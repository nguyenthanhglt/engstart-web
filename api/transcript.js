// Vercel Serverless Function: /api/transcript (v9 — Dịch gộp 1 request duy nhất, không bị giới hạn 429!)
// - Tầng 1: Gemini 3.8 Flash (8s).
// - Tầng 2: Google Translate gộp theo cụm 15 dòng/request (chống 429) -> Dự phòng MyMemory API.

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

async function translateGroupWithGoogle(texts, tl) {
  // Dùng dấu phân tách [@@@] để Google Translate không bao giờ gộp mất dòng (đặc biệt với Tiếng Trung zh-CN!)
  const SEP = '\n@@@\n';
  const joined = texts.join(SEP);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=rm`;
  const r = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `q=${encodeURIComponent(joined)}`
  }, 8000);
  if (!r.ok) throw new Error('Google Translate HTTP ' + r.status);
  const data = await r.json();
  const fullTranslated = Array.isArray(data?.[0]) ? data[0].map(seg => seg?.[0] || '').join('') : '';
  const fullPinyin = Array.isArray(data?.[0]) ? data[0].map(seg => seg?.[2] || '').filter(Boolean).join(' ') : '';
  const splitLines = fullTranslated.split(/@{2,4}/).map(s => s.trim()).filter(Boolean);
  const splitPinyin = fullPinyin ? fullPinyin.split(/@{2,4}/).map(s => s.trim()) : [];
  if (splitLines.length >= texts.length) {
    return texts.map((orig, idx) => ({
      text: splitLines[idx] || orig,
      ipa: tl.startsWith('zh') ? (splitPinyin[idx] || '') : ''
    }));
  }
  return null;
}

async function translateLineWithMyMemory(text, sl, tl) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;
  const r = await fetchWithTimeout(url, {}, 6000);
  if (!r.ok) return text;
  const data = await r.json();
  return (data?.responseData?.translatedText || text).trim();
}

async function translateBatchFallback(chunk, isZh) {
  const tl = isZh ? 'zh-CN' : 'en';
  const results = [];
  const groupSize = 5;

  for (let i = 0; i < chunk.length; i += groupSize) {
    const slice = chunk.slice(i, i + groupSize);
    const originals = slice.map(x => x.text.slice(0, 420));
    let translatedList = null;

    try {
      translatedList = await translateGroupWithGoogle(originals, tl);
    } catch {}

    if (!translatedList) {
      translatedList = await Promise.all(originals.map(async t => {
        const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t);
        const out = await translateLineWithMyMemory(t.slice(0, 400), isVi ? 'vi' : 'en', tl).catch(() => t);
        return { text: out, ipa: '' };
      }));
    }

    const sampleVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(originals.join(' '));
    let viList = originals.map(t => ({ text: t }));
    if (!sampleVi) {
      try { viList = (await translateGroupWithGoogle(originals, 'vi')) || viList; } catch {}
    }

    slice.forEach((ln, idx) => {
      const tr = translatedList[idx] || { text: ln.text, ipa: '' };
      const viObj = viList[idx] || { text: ln.text };
      results.push({
        start: ln.start,
        end: ln.end,
        text: tr.text || ln.text,
        ipa: tr.ipa || '',
        vi: viObj.text || ln.text
      });
    });
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
        engine = 'google-batch-fast';
        translated = await translateBatchFallback(slice, isZh);
      }
      return res.status(200).json({ lang: isZh ? 'zh' : 'en', engine, count: translated.length, lines: translated });
    } catch (err) {
      return res.status(500).json({ error: 'Lỗi dịch lời thoại: ' + String(err.message || err) });
    }
  }

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
      return res.status(502).json({ error: 'Gemini AI đang quá tải tạm thời. Bạn dán lời thoại YouTube vào ô bên dưới để dịch song ngữ siêu tốc nhé!' });
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
    return res.status(504).json({ error: 'Video quá dài để AI nghe trực tiếp. Bạn dán lời thoại YouTube vào ô bên dưới để dịch song ngữ siêu tốc nhé!' });
  }
};
