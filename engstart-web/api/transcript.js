// Vercel Serverless Function: /api/transcript?v=VIDEO_ID&lang=en|zh
// 1. Lấy phụ đề gốc kèm mốc thời gian (timestamps) từ YouTube.
// 2. Tự động dịch song ngữ Anh/Trung <-> Việt (ưu tiên YouTube tlang, nếu YouTube không có dịch thì tự dùng Gemini AI trên Vercel!).

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseXmlCaptions(xml) {
  const lines = [];
  const re = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const start = parseFloat(m[1]);
    const dur = parseFloat(m[2] || '3');
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, ''));
    if (text) lines.push({ start, end: Number((start + dur).toFixed(2)), text });
  }
  return lines;
}

async function translateBatchWithGemini(lines, targetLang, apiKey) {
  if (!apiKey || !lines.length) return null;
  const isZh = targetLang.startsWith('zh');
  // Translate up to first 80 lines in a fast single Gemini 2.5 Flash call
  const chunk = lines.slice(0, 80);
  const numbered = chunk.map((l, i) => `${i}: ${l.text}`).join('\n');
  const prompt = isZh
    ? `Translate each numbered subtitle line below into natural Simplified Chinese ("zh"), its Pinyin with tone marks ("pinyin"), and natural Vietnamese ("vi"). Return ONLY a valid JSON array of objects in the exact same order: [{"i":0,"zh":"...","pinyin":"...","vi":"..."}, ...].\n\nLines:\n${numbered}`
    : `Translate each numbered subtitle line below into natural English ("en") and natural Vietnamese ("vi"). Return ONLY a valid JSON array of objects in the exact same order: [{"i":0,"en":"...","vi":"..."}, ...].\n\nLines:\n${numbered}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (!arrMatch) return null;
  const parsed = JSON.parse(arrMatch[0]);
  if (!Array.isArray(parsed)) return null;

  const map = new Map();
  parsed.forEach((item, idx) => {
    const key = typeof item.i === 'number' ? item.i : idx;
    map.set(key, item);
  });

  return lines.slice(0, 300).map((ln, idx) => {
    const tr = map.get(idx);
    if (!tr) return { start: ln.start, end: ln.end, text: ln.text, ipa: '', vi: '' };
    if (isZh) {
      return { start: ln.start, end: ln.end, text: tr.zh || ln.text, ipa: tr.pinyin || '', vi: tr.vi || ln.text };
    }
    return { start: ln.start, end: ln.end, text: tr.en || ln.text, ipa: '', vi: tr.vi || ln.text };
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const videoId = String(req.query.v || '').trim();
  const targetLang = String(req.query.lang || 'en').toLowerCase() === 'zh' ? 'zh-Hans' : 'en';
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid YouTube video ID' });
  }

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
      }
    });
    const html = await pageRes.text();
    const match = html.match(/"captionTracks":(\[[\s\S]*?\])/);
    if (!match) {
      return res.status(404).json({ error: 'Video này chưa có phụ đề công khai trên YouTube.' });
    }

    const tracks = JSON.parse(match[1]);
    if (!Array.isArray(tracks) || !tracks.length) {
      return res.status(404).json({ error: 'Không tìm thấy track phụ đề.' });
    }

    const baseTrack = tracks.find(t => (t.languageCode || '').toLowerCase().startsWith(targetLang.slice(0, 2)))
      || tracks.find(t => /^vi/i.test(t.languageCode || ''))
      || tracks[0];

    const baseXml = await (await fetch(baseTrack.baseUrl)).text();
    const baseLines = parseXmlCaptions(baseXml);
    if (!baseLines.length) {
      return res.status(404).json({ error: 'Phụ đề YouTube bị rỗng.' });
    }

    const baseLangShort = (baseTrack.languageCode || '').toLowerCase().slice(0, 2);
    const needTranslateTarget = baseLangShort !== targetLang.slice(0, 2);

    // Try YouTube's built-in tlang first
    let targetLines = baseLines;
    let ytTranslatedOk = !needTranslateTarget;
    if (needTranslateTarget) {
      try {
        const tXml = await (await fetch(`${baseTrack.baseUrl}&tlang=${encodeURIComponent(targetLang)}`)).text();
        const parsedT = parseXmlCaptions(tXml);
        if (parsedT.length > 0 && parsedT[0].text !== baseLines[0].text) {
          targetLines = parsedT;
          ytTranslatedOk = true;
        }
      } catch {}
    }

    // Try YouTube Vietnamese track
    let viLines = [];
    const viTrack = tracks.find(t => /^vi/i.test(t.languageCode || ''));
    if (viTrack) {
      try {
        const viXml = await (await fetch(viTrack.baseUrl)).text();
        viLines = parseXmlCaptions(viXml);
      } catch {}
    } else if (baseLangShort === 'vi') {
      viLines = baseLines;
    } else {
      try {
        const viXml = await (await fetch(`${baseTrack.baseUrl}&tlang=vi`)).text();
        viLines = parseXmlCaptions(viXml);
      } catch {}
    }

    // If YouTube didn't have translation (or Vietnamese track is missing) AND Gemini API Key is set -> auto-translate with Gemini AI!
    if ((!ytTranslatedOk || !viLines.length) && apiKey) {
      try {
        const aiTranslated = await translateBatchWithGemini(baseLines, targetLang, apiKey);
        if (aiTranslated && aiTranslated.length) {
          return res.status(200).json({
            lang: targetLang.startsWith('zh') ? 'zh' : 'en',
            translatedBy: 'gemini-ai',
            count: aiTranslated.length,
            lines: aiTranslated
          });
        }
      } catch {}
    }

    const lines = targetLines.slice(0, 300).map((ln, idx) => {
      const nearVi = viLines[idx] && Math.abs(viLines[idx].start - ln.start) < 2.5
        ? viLines[idx].text
        : (viLines.find(v => Math.abs(v.start - ln.start) < 2.2)?.text || '');
      return { start: ln.start, end: ln.end, text: ln.text, ipa: '', vi: nearVi };
    });

    return res.status(200).json({
      lang: targetLang.startsWith('zh') ? 'zh' : 'en',
      translatedBy: ytTranslatedOk ? 'youtube' : 'original',
      count: lines.length,
      lines
    });
  } catch (err) {
    return res.status(500).json({ error: 'Không thể tải phụ đề YouTube', detail: String(err.message || err) });
  }
};
