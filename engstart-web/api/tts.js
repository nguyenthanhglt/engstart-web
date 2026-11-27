// Vercel Serverless Function: /api/tts?lang=zh-CN&text=...
// Phát giọng đọc tiếng Trung (và tiếng Anh) bản xứ chuẩn MP3 trực tiếp cùng tên miền (không bị chặn CORS/Referer, đọc trọn câu dài cực rõ!).

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const text = String(req.query.text || '').trim().slice(0, 180);
  const lang = String(req.query.lang || 'zh-CN').trim();
  if (!text) return res.status(400).end('Missing text');

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    if (!r.ok) return res.status(502).end('TTS upstream failed');
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).end('TTS error');
  }
};
