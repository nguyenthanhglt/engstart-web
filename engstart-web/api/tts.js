// Vercel Serverless Function v21: /api/tts
// 1) mode=ipa&file=<Wikimedia.ogg>: Lấy bản MP3 chuẩn (tương thích 100% iPhone/iPad Safari & máy tính) của âm IPA thu âm người thật trên Wikimedia Commons.
// 2) mode=word&lang=en-GB|en-US&text=<word>: Ưu tiên lấy MP3 thu âm người bản xứ thật từ từ điển (Oxford/Wiktionary qua dictionaryapi.dev), đúng giọng UK/US.
// 3) Mặc định (cụm từ / câu / tiếng Trung): Phát MP3 giọng bản xứ tự nhiên chuẩn UK/US/zh-CN.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function fetchWikimediaMp3(filename) {
  const clean = String(filename || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!clean) return null;
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(clean)}&prop=videoinfo&viprop=derivatives|url&format=json`;
  const r = await fetch(apiUrl, { headers: { 'User-Agent': 'EngStartKidLearning/1.0 (https://vercel.app)' } });
  if (!r.ok) return null;
  const data = await r.json();
  const pages = (data && data.query && data.query.pages) || {};
  const page = Object.values(pages)[0];
  const vi = page && page.videoinfo && page.videoinfo[0];
  if (!vi) return null;
  const derivs = Array.isArray(vi.derivatives) ? vi.derivatives : [];
  const mp3 = derivs.find(d => d && ((d.type && d.type.includes('mpeg')) || (d.src && d.src.toLowerCase().endsWith('.mp3'))));
  const audioUrl = (mp3 && mp3.src) || vi.url;
  if (!audioUrl) return null;
  const ar = await fetch(audioUrl, { headers: { 'User-Agent': 'EngStartKidLearning/1.0 (https://vercel.app)' } });
  if (!ar.ok) return null;
  const buf = Buffer.from(await ar.arrayBuffer());
  const ct = (mp3 && 'audio/mpeg') || ar.headers.get('content-type') || 'audio/ogg';
  return { buf, ct };
}

async function fetchDictionaryWordMp3(word, lang) {
  const w = String(word || '').toLowerCase().replace(/[^a-z'-]/g, '').trim();
  if (!w || w.includes(' ')) return null;
  const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`, {
    headers: { 'User-Agent': UA }
  });
  if (!r.ok) return null;
  const entries = await r.json();
  if (!Array.isArray(entries)) return null;
  const urls = [];
  for (const entry of entries) {
    for (const ph of (entry.phonetics || [])) {
      if (ph && ph.audio && /^https?:\/\//.test(ph.audio)) {
        urls.push(ph.audio);
      }
    }
  }
  if (!urls.length) return null;
  const wantUk = String(lang || '').toLowerCase().includes('gb') || String(lang || '').toLowerCase().includes('uk');
  let chosen = urls.find(u => wantUk ? /-uk\.mp3/i.test(u) : /-us\.mp3/i.test(u));
  if (!chosen) chosen = urls.find(u => /\.mp3$/i.test(u)) || urls[0];
  const ar = await fetch(chosen, { headers: { 'User-Agent': UA } });
  if (!ar.ok) return null;
  return { buf: Buffer.from(await ar.arrayBuffer()), ct: 'audio/mpeg' };
}

async function fetchGoogleTtsMp3(text, lang) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`;
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Referer': 'https://translate.google.com/' }
  });
  if (!r.ok) return null;
  return { buf: Buffer.from(await r.arrayBuffer()), ct: 'audio/mpeg' };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const mode = String(req.query.mode || '').trim();
  const file = String(req.query.file || '').trim();
  const text = String(req.query.text || '').trim().slice(0, 200);
  const lang = String(req.query.lang || 'en-GB').trim();

  try {
    if (mode === 'ipa' && file) {
      const ipaAudio = await fetchWikimediaMp3(file);
      if (ipaAudio) {
        res.setHeader('Content-Type', ipaAudio.ct);
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.status(200).send(ipaAudio.buf);
      }
      if (!text) return res.status(404).end('IPA audio not found');
    }

    if (!text) return res.status(400).end('Missing text');

    const isSingleEnWord = (mode === 'word' || /^[a-zA-Z'-]{1,28}$/.test(text)) && lang.toLowerCase().startsWith('en');
    if (isSingleEnWord) {
      const dictAudio = await fetchDictionaryWordMp3(text, lang);
      if (dictAudio) {
        res.setHeader('Content-Type', dictAudio.ct);
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.status(200).send(dictAudio.buf);
      }
    }

    const ttsAudio = await fetchGoogleTtsMp3(text, lang);
    if (ttsAudio) {
      res.setHeader('Content-Type', ttsAudio.ct);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(ttsAudio.buf);
    }

    return res.status(502).end('TTS upstream failed');
  } catch (e) {
    return res.status(500).end('TTS error');
  }
};
