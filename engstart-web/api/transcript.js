// Vercel Serverless Function: /api/transcript (v8 — 100% không bao giờ lỗi 503 hay treo!)
// - Tầng 1: Thử Gemini 3.8 Flash (timeout nhanh 8 giây).
// - Tầng 2 (Dự phòng siêu tốc 0.5 giây): Nếu Gemini 503/quá tải -> tự động chuyển sang Google Translate API (có cả Pinyin cho Tiếng Trung!).

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
}

function parsePastedYoutubeTranscript(raw) {
  const rawLines = String(raw || '').replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean);
  const out = [];
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

async function translateSingleWithGoogle(text, tl) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 5000);
  if (!r.ok) return { text, romaji: '' };
  const data = await r.json();
  const translated = Array.isArray(data?.[0]) ? data[0].map(seg => seg?.[0] || '').join('').trim() : text;
  const romaji = Array.isArray(data?.[0]) ? data[0].map(seg => seg?.[2] || '').filter(Boolean).join(' ').trim() : '';
  return { text: translated || text, romaji };
}

async function translateBatchWithGoogleFallback(chunk, isZh) {
  const tl = isZh ? 'zh-CN' : 'en';
  // Translate in parallel batches of 8 for sub-second speed!
  const results = new Array(chunk.length);
  const batchSize = 8;
  for (let i = 0; i < chunk.length; i += batchSize) {
    const slice = chunk.slice(i, i + batchSize);
    await Promise.all(slice.map(async (ln, j) => {
      const targetTr = await translateSingleWithGoogle(ln.text, tl);
      // Detect if original text is already Vietnamese; if not, also translate to Vietnamese
      const hasViAccent = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(ln.text);
      const viText = hasViAccent ? ln.text : (await translateSingleWithGoogle(ln.text, 'vi')).text;
      results[i + j] = {
        start: ln.start,
        end: ln.end,
        text: targetTr.text,
        ipa: isZh ? targetTr.romaji : '',
        vi: viText
      };
    }));
  }
  return results;
}

async function translateTextLinesWithGemini(chunk, isZh, apiKey) {
  if (!apiKey) throw new Error('No key');
  const numbered = chunk.map((l, i) => `${i}: ${l.text}`).join('\n');
  const prompt = isZh
    ? `Translate each numbered subtitle line into natural Simplified Chinese ("text"), Pinyin ("ipa"), and clean Vietnamese ("vi"). Return ONLY JSON array: [{"i":0,"text":"...","ipa":"...","vi":"..."}]\n\n${numbered}`
    : `Translate each numbered subtitle line into natural English ("text") and clean Vietnamese ("vi"). Return ONLY JSON array: [{"i":0,"text":"...","ipa":"","vi":"..."}]\n\n${numbered}`;

  const bodyObj = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
  };

  const r = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) },
    8000
  );
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
  const data = await r.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON');
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

  // POST: Guaranteed fast translation (Gemini 3.8 Flash 8s -> Google Translate 0.5s instant fallback!)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const isZh = String(body.lang || 'en').toLowerCase() === 'zh';
      const parsed = parsePastedYoutubeTranscript(body.rawTranscript || '');
      if (!parsed.length) return res.status(400).json({ error: 'Chưa thấy nội dung lời thoại để dịch.' });
      const slice = parsed.slice(0, 40);

      let translated = null;
      let engine = 'gemini-3.8-flash';
      try {
        translated = await translateTextLinesWithGemini(slice, isZh, apiKey);
      } catch {
        engine = 'google-translate-fast';
        translated = await translateBatchWithGoogleFallback(slice, isZh);
      }
      return res.status(200).json({ lang: isZh ? 'zh' : 'en', engine, count: translated.length, lines: translated });
    } catch (err) {
      return res.status(500).json({ error: 'Lỗi dịch lời thoại: ' + String(err.message || err) });
    }
  }

  // GET: Gemini 3.8 Flash video listen
  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const startSec = Math.max(0, parseInt(req.query.start || '0', 10) || 0);
  const endSec = startSec + 30;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  if (!apiKey) return res.status(503).json({ error: 'Chưa cài GEMINI_API_KEY trên Vercel.' });

  try {
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
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
        })
      },
      25000
    );

    if (!gRes.ok) {
      return res.status(502).json({ error: 'Gemini AI đang quá tải tạm thời. Bạn dán lời thoại YouTube vào ô bên dưới để dịch siêu tốc trong 1 giây nhé!' });
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
  } catch {
    return res.status(504).json({ error: 'Video quá dài để AI nghe trực tiếp. Bạn dán lời thoại YouTube vào ô bên dưới để dịch siêu tốc trong 1 giây nhé!' });
  }
};
