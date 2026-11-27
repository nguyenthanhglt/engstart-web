// Vercel Serverless Function: /api/transcript
// - GET ?v=VIDEO_ID&lang=en|zh&start=0 : Tự động lấy & dịch phụ đề (YouTube InnerTube -> Gemini 3.8 Flash video 55s).
// - POST { lang, rawTranscript }       : Nhận lời thoại copy từ YouTube ("Hiện bản chép lời") -> Gemini 3.8 Flash dịch song ngữ trong 2–3 giây!

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function parseJson3(json) {
  const out = [];
  for (const ev of ((json && json.events) || [])) {
    if (!ev.segs || typeof ev.tStartMs !== 'number') continue;
    const text = decodeEntities(ev.segs.map(s => s.utf8 || '').join('')).replace(/\n/g, ' ').trim();
    if (!text) continue;
    const start = Number((ev.tStartMs / 1000).toFixed(2));
    const dur = Number(((ev.dDurationMs || 3000) / 1000).toFixed(2));
    out.push({ start, end: Number((start + dur).toFixed(2)), text });
  }
  return out;
}

function parseXml(xml) {
  const out = [];
  const re = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const start = parseFloat(m[1]);
    const dur = parseFloat(m[2] || '3');
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, ''));
    if (text) out.push({ start, end: Number((start + dur).toFixed(2)), text });
  }
  return out;
}

function parsePastedYoutubeTranscript(raw) {
  const lines = String(raw || '').replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean);
  const out = [];
  const tsRe = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  let curStart = null;
  let buf = [];
  const flush = () => {
    if (curStart !== null && buf.length) {
      out.push({ start: curStart, end: curStart + 4, text: buf.join(' ') });
    }
    buf = [];
  };
  for (const ln of lines) {
    const m = ln.match(tsRe);
    if (m) {
      flush();
      const parts = m[3] ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, Number(m[1]), Number(m[2])];
      curStart = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      if (curStart === null) curStart = out.length * 4;
      buf.push(ln);
    }
  }
  flush();
  for (let i = 0; i < out.length - 1; i++) {
    out[i].end = Math.max(out[i].start + 1.5, out[i + 1].start);
  }
  return out;
}

async function getFastYoutubeCaptions(videoId) {
  try {
    const r = await fetchWithTimeout('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11) gzip'
      },
      body: JSON.stringify({
        videoId,
        context: { client: { clientName: 'ANDROID', clientVersion: '19.29.37', androidSdkVersion: 30, hl: 'vi', gl: 'VN' } }
      })
    }, 4500);
    if (!r.ok) return null;
    const data = await r.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || !tracks.length) return null;
    const chosen = tracks.find(t => /^vi/i.test(t.languageCode || '')) || tracks.find(t => /^en/i.test(t.languageCode || '')) || tracks[0];
    const capUrl = chosen.baseUrl.includes('fmt=') ? chosen.baseUrl : `${chosen.baseUrl}&fmt=json3`;
    const capRes = await fetchWithTimeout(capUrl, {}, 4500);
    if (!capRes.ok) return null;
    const txt = await capRes.text();
    const lines = txt.trim().startsWith('{') ? parseJson3(JSON.parse(txt)) : parseXml(txt);
    return lines.length ? lines : null;
  } catch {
    return null;
  }
}

async function translateTextLinesWithGemini(chunk, isZh, apiKey) {
  const numbered = chunk.map((l, i) => `${i}: ${l.text}`).join('\n');
  const prompt = isZh
    ? `Translate each numbered line into natural Simplified Chinese ("text"), Pinyin with tone marks ("ipa"), and natural Vietnamese ("vi"). Return ONLY a valid JSON array: [{"i":0,"text":"...","ipa":"...","vi":"..."}]\n\n${numbered}`
    : `Translate each numbered line into natural English ("text") and natural Vietnamese ("vi"). Return ONLY a valid JSON array: [{"i":0,"text":"...","ipa":"","vi":"..."}]\n\n${numbered}`;

  const r = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    },
    25000
  );
  if (!r.ok) {
    const errTxt = await r.text();
    throw new Error(`Gemini 3.8 Flash (${r.status}): ${errTxt.slice(0, 180)}`);
  }
  const data = await r.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Gemini chưa trả về JSON hợp lệ.');
  const arr = JSON.parse(m[0]);
  const map = new Map();
  arr.forEach((it, idx) => map.set(typeof it.i === 'number' ? it.i : idx, it));
  return chunk.map((ln, idx) => {
    const tr = map.get(idx) || {};
    return {
      start: ln.start,
      end: ln.end,
      text: String(tr.text || ln.text).trim(),
      ipa: String(tr.ipa || '').trim(),
      vi: String(tr.vi || ln.text).trim()
    };
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return res.status(503).json({ error: 'Chưa cài GEMINI_API_KEY trên Vercel.' });

  // POST: Instant 2-3s AI bilingual translation of pasted YouTube transcript!
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const isZh = String(body.lang || 'en').toLowerCase() === 'zh';
      const parsed = parsePastedYoutubeTranscript(body.rawTranscript || '');
      if (!parsed.length) return res.status(400).json({ error: 'Chưa thấy nội dung lời thoại để dịch.' });
      const translated = await translateTextLinesWithGemini(parsed.slice(0, 50), isZh, apiKey);
      return res.status(200).json({ lang: isZh ? 'zh' : 'en', count: translated.length, lines: translated });
    } catch (err) {
      return res.status(500).json({ error: 'Lỗi dịch lời thoại: ' + String(err.message || err) });
    }
  }

  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const startSec = Math.max(0, parseInt(req.query.start || '0', 10) || 0);

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  }

  try {
    const rawCaptions = await getFastYoutubeCaptions(videoId);
    if (rawCaptions && rawCaptions.length) {
      const slice = rawCaptions.filter(l => l.start >= startSec).slice(0, 35);
      if (slice.length) {
        const translated = await translateTextLinesWithGemini(slice, isZh, apiKey);
        const lastEnd = Math.ceil(translated[translated.length - 1].end || (startSec + 60));
        return res.status(200).json({ lang: isZh ? 'zh' : 'en', nextStart: lastEnd, count: translated.length, lines: translated });
      }
    }

    // Fallback: Gemini 3.8 Flash listens directly to 30s with generous 55s timeout
    const endSec = startSec + 30;
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const prompt = isZh
      ? `Listen to ${startSec}s–${endSec}s and return ONLY a JSON array of 6-10 subtitle lines: [{"start":${startSec},"end":${startSec + 4},"text":"Simplified Chinese","ipa":"Pinyin","vi":"Vietnamese"}]`
      : `Listen to ${startSec}s–${endSec}s and return ONLY a JSON array of 6-10 subtitle lines: [{"start":${startSec},"end":${startSec + 4},"text":"Natural English","ipa":"","vi":"Vietnamese"}]`;

    const gRes = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { fileData: { fileUri: ytUrl, mimeType: 'video/mp4' }, videoMetadata: { startOffset: `${startSec}s`, endOffset: `${endSec}s`, fps: 0.2 } },
              { text: prompt }
            ]
          }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      },
      55000
    );

    if (!gRes.ok) {
      const errBody = await gRes.text();
      return res.status(502).json({ error: `Gemini AI báo lỗi (${gRes.status}): ${errBody.slice(0, 200)}` });
    }
    const gData = await gRes.json();
    const raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) return res.status(502).json({ error: 'AI chưa trả về đúng mảng phụ đề.' });
    const parsed = JSON.parse(arrMatch[0]);
    const lines = (Array.isArray(parsed) ? parsed : []).filter(x => x && x.text).map((x, idx, arr) => {
      const s = Number(x.start) >= startSec ? Number(x.start) : (startSec + idx * 4);
      const nextS = arr[idx + 1] ? Number(arr[idx + 1].start) : (s + 4);
      const e = Number(x.end) > s ? Number(x.end) : Math.max(s + 2, nextS);
      return { start: Number(s.toFixed(2)), end: Number(e.toFixed(2)), text: String(x.text || '').trim(), ipa: String(x.ipa || '').trim(), vi: String(x.vi || '').trim() };
    });

    return res.status(200).json({ lang: isZh ? 'zh' : 'en', nextStart: endSec, count: lines.length, lines });
  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Video này quá dài để AI nghe trực tiếp. Bạn bấm nút "Dán lời thoại YouTube để AI dịch trong 2 giây" ngay bên dưới nhé!'
      : ('Lỗi AI: ' + String(err.message || err));
    return res.status(504).json({ error: msg });
  }
};
