// Vercel Serverless Function: /api/transcript?v=VIDEO_ID&lang=en|zh
// Dùng Gemini 3.8 Flash với videoMetadata (0s–90s, fps: 0.2) để nghe & dịch cực nhanh (~5–7 giây), không bao giờ bị timeout trên Vercel!

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const startSec = Math.max(0, parseInt(req.query.start || '0', 10) || 0);
  const endSec = startSec + 90;
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  }
  if (!apiKey) {
    return res.status(503).json({ error: 'Chưa cài GEMINI_API_KEY trên Vercel.' });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const prompt = isZh
    ? `Listen to the spoken audio in this video clip (${startSec}s to ${endSec}s).
Split into 15-25 short subtitle segments with exact timestamps in seconds (relative to the full video starting at ${startSec}).
Return ONLY a valid JSON array: [{"start":${startSec},"end":${startSec + 4},"text":"Simplified Chinese","ipa":"Pinyin with tone marks","vi":"Vietnamese"}]`
    : `Listen to the spoken audio in this video clip (${startSec}s to ${endSec}s).
Split into 15-25 short subtitle segments with exact timestamps in seconds (relative to the full video starting at ${startSec}).
Return ONLY a valid JSON array: [{"start":${startSec},"end":${startSec + 4},"text":"Natural English","ipa":"","vi":"Vietnamese"}]`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                fileData: { fileUri: ytUrl },
                videoMetadata: {
                  startOffset: `${startSec}s`,
                  endOffset: `${endSec}s`,
                  fps: 0.2
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      return res.status(502).json({
        error: `Gemini AI báo lỗi (${geminiRes.status}).`,
        detail: errBody.slice(0, 350)
      });
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) {
      return res.status(502).json({ error: 'AI chưa trả về đúng mảng phụ đề, hãy bấm Tạo video lại.' });
    }

    const parsed = JSON.parse(arrMatch[0]);
    const lines = (Array.isArray(parsed) ? parsed : [])
      .filter(x => x && x.text)
      .map((x, idx, arr) => {
        const s = Number(x.start) >= startSec ? Number(x.start) : (startSec + idx * 4);
        const nextS = arr[idx + 1] ? Number(arr[idx + 1].start) : (s + 4);
        const e = Number(x.end) > s ? Number(x.end) : Math.max(s + 2, nextS);
        return {
          start: Number(s.toFixed(2)),
          end: Number(e.toFixed(2)),
          text: String(x.text || '').trim(),
          ipa: String(x.ipa || '').trim(),
          vi: String(x.vi || '').trim()
        };
      });

    if (!lines.length) {
      return res.status(404).json({ error: 'Không nghe thấy lời thoại trong đoạn video này.' });
    }

    return res.status(200).json({
      lang: isZh ? 'zh' : 'en',
      translatedBy: 'gemini-3.8-flash-fast',
      count: lines.length,
      lines
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ AI: ' + String(err.message || err) });
  }
}

handler.config = { maxDuration: 60 };
module.exports = handler;
