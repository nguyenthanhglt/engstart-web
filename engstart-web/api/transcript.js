// Vercel Serverless Function: /api/transcript (v7)
// - thinkingBudget: 0 giúp Gemini 3.8 Flash phản hồi cực nhanh (~2 giây), không bị timeout!
// - Hỗ trợ chuẩn định dạng copy từ "Hiện bản chép lời" YouTube tiếng Việt ("0:000 giây...", "1:051 phút, 5 giây...").

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
}

function parsePastedYoutubeTranscript(raw) {
  const rawLines = String(raw || '').replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean);
  const out = [];
  // Matches: "0:000 giâyText...", "0:1212 giâyText...", "1:051 phút, 5 giâyText...", or standalone "0:12"
  const inlineRe = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*\d+\s*(?:giờ|phút|giây|hours?|minutes?|seconds?)(?:[,\s]+\d+\s*(?:phút|giây|minutes?|seconds?))*)?\s*(.*)$/i;

  let curStart = null;
  let buf = [];
  const flush = () => {
    const joined = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (curStart !== null && joined) {
      out.push({ start: curStart, end: curStart + 4, text: joined });
    }
    buf = [];
  };

  for (const ln of rawLines) {
    const m = ln.match(inlineRe);
    if (m) {
      const hasHours = Boolean(m[3]);
      const sec = hasHours
        ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
        : Number(m[1]) * 60 + Number(m[2]);
      flush();
      curStart = sec;
      const rest = (m[4] || '').trim();
      if (rest) buf.push(rest);
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

async function translateTextLinesWithGemini(chunk, isZh, apiKey) {
  const numbered = chunk.map((l, i) => `${i}: ${l.text}`).join('\n');
  const prompt = isZh
    ? `Translate each numbered Vietnamese/foreign subtitle line into natural Simplified Chinese ("text"), Pinyin with tone marks ("ipa"), and clean Vietnamese ("vi"). Return ONLY a valid JSON array: [{"i":0,"text":"...","ipa":"...","vi":"..."}]\n\n${numbered}`
    : `Translate each numbered Vietnamese/foreign subtitle line into natural English ("text") and clean Vietnamese ("vi"). Return ONLY a valid JSON array: [{"i":0,"text":"...","ipa":"","vi":"..."}]\n\n${numbered}`;

  const bodyObj = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  let r = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) },
    25000
  );
  // If thinkingConfig isn't accepted by this model variant (400), retry cleanly without it
  if (r.status === 400) {
    delete bodyObj.generationConfig.thinkingConfig;
    r = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) },
      25000
    );
  }
  if (!r.ok) {
    const errTxt = await r.text();
    throw new Error(`Gemini (${r.status}): ${errTxt.slice(0, 180)}`);
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

  // POST: Fast 2–4s AI bilingual translation of pasted YouTube transcript
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const isZh = String(body.lang || 'en').toLowerCase() === 'zh';
      const parsed = parsePastedYoutubeTranscript(body.rawTranscript || '');
      if (!parsed.length) return res.status(400).json({ error: 'Chưa thấy nội dung lời thoại để dịch.' });
      const translated = await translateTextLinesWithGemini(parsed.slice(0, 30), isZh, apiKey);
      return res.status(200).json({ lang: isZh ? 'zh' : 'en', count: translated.length, lines: translated });
    } catch (err) {
      return res.status(500).json({ error: 'Lỗi dịch lời thoại: ' + String(err.message || err) });
    }
  }

  // GET: Fast Gemini 3.8 Flash video listen (30s clip, thinkingBudget: 0)
  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const startSec = Math.max(0, parseInt(req.query.start || '0', 10) || 0);
  const endSec = startSec + 30;

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  }

  try {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const prompt = isZh
      ? `Listen to ${startSec}s–${endSec}s and return ONLY a JSON array of 6-10 subtitle lines: [{"start":${startSec},"end":${startSec + 4},"text":"Simplified Chinese","ipa":"Pinyin","vi":"Vietnamese"}]`
      : `Listen to ${startSec}s–${endSec}s and return ONLY a JSON array of 6-10 subtitle lines: [{"start":${startSec},"end":${startSec + 4},"text":"Natural English","ipa":"","vi":"Vietnamese"}]`;

    const bodyObj = {
      contents: [{
        parts: [
          { fileData: { fileUri: ytUrl, mimeType: 'video/mp4' }, videoMetadata: { startOffset: `${startSec}s`, endOffset: `${endSec}s`, fps: 0.2 } },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
    };

    const gRes = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) },
      50000
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
      return { start: Number(s.toFixed(2)), end: Number(e.toFixed(2)), text: String(x.text).trim(), ipa: String(x.ipa || '').trim(), vi: String(x.vi || '').trim() };
    });

    return res.status(200).json({ lang: isZh ? 'zh' : 'en', nextStart: endSec, count: lines.length, lines });
  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Video này quá dài để AI nghe trực tiếp. Bạn dán lời thoại YouTube vào ô bên dưới để AI dịch siêu tốc nhé!'
      : ('Lỗi AI: ' + String(err.message || err));
    return res.status(504).json({ error: msg });
  }
};
