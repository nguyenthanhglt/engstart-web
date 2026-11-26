// Vercel Serverless Function: /api/transcript?v=VIDEO_ID
// Tự động lấy phụ đề kèm mốc thời gian (timestamps) thật từ YouTube để chạy chữ đồng bộ như Corodomo.

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const videoId = String(req.query.v || '').trim();
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
      return res.status(404).json({ error: 'Video này không có phụ đề công khai trên YouTube.' });
    }

    const tracks = JSON.parse(match[1]);
    if (!Array.isArray(tracks) || !tracks.length) {
      return res.status(404).json({ error: 'Không tìm thấy track phụ đề.' });
    }

    // Prefer English or Chinese or Vietnamese or first available track
    const preferLang = String(req.query.lang || '').toLowerCase();
    let chosen = tracks.find(t => preferLang && (t.languageCode || '').toLowerCase().startsWith(preferLang))
      || tracks.find(t => /^en/i.test(t.languageCode || ''))
      || tracks.find(t => /^zh/i.test(t.languageCode || ''))
      || tracks.find(t => /^vi/i.test(t.languageCode || ''))
      || tracks[0];

    const viTrack = tracks.find(t => /^vi/i.test(t.languageCode || ''));

    const capRes = await fetch(chosen.baseUrl);
    const xml = await capRes.text();
    const lines = [];
    const re = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const start = parseFloat(m[1]);
      const dur = parseFloat(m[2] || '3');
      const text = decodeEntities(m[3].replace(/<[^>]+>/g, ''));
      if (text) {
        lines.push({ start, end: Number((start + dur).toFixed(2)), text, ipa: '', vi: '' });
      }
    }

    // Attach Vietnamese translation track if available on the same YouTube video
    if (viTrack && viTrack.baseUrl !== chosen.baseUrl) {
      try {
        const viRes = await fetch(viTrack.baseUrl);
        const viXml = await viRes.text();
        const viLines = [];
        let vm;
        while ((vm = re.exec(viXml)) !== null) {
          viLines.push({ start: parseFloat(vm[1]), text: decodeEntities(vm[3].replace(/<[^>]+>/g, '')) });
        }
        lines.forEach(ln => {
          const near = viLines.find(v => Math.abs(v.start - ln.start) < 2.2);
          if (near) ln.vi = near.text;
        });
      } catch {}
    }

    return res.status(200).json({
      lang: (chosen.languageCode || 'en').startsWith('zh') ? 'zh' : 'en',
      languageCode: chosen.languageCode || 'en',
      count: lines.length,
      lines: lines.slice(0, 400)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Không thể tải phụ đề YouTube', detail: String(err.message || err) });
  }
};
