// Vercel Serverless Function: /api/transcript?v=VIDEO_ID&lang=en|zh&start=0
// Tạo Phụ đề AI song ngữ trực tiếp bằng Gemini 3.8 Flash theo từng chặng 45 giây cực nhanh (tránh timeout 10s của Vercel Hobby).

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const startSec = Math.max(0, parseInt(req.query.start || '0', 10) || 0);
  const endSec = startSec + 45;
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  }
  if (!apiKey) {
    return res.status(503).json({ error: 'Chưa cài GEMINI_API_KEY trên Vercel.' });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const prompt = isZh
    ? `Transcribe & translate the speech from ${startSec}s to ${endSec}s into 8-14 short bilingual subtitle lines.
Return ONLY valid JSON array: [{"start":${startSec},"end":${startSec + 4},"text":"Simplified Chinese","ipa":"Pinyin","vi":"Vietnamese"}]`
    : `Transcribe & translate the speech from ${startSec}s to ${endSec}s into 8-14 short bilingual subtitle lines.
Return ONLY valid JSON array: [{"start":${startSec},"end":${startSec + 4},"text":"Natural English","ipa":"","vi":"Vietnamese"}]`;

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
                fileData: { fileUri: ytUrl, mimeType: 'video/mp4' },
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
        error: `Gemini AI báo lỗi (${geminiRes.status}): ${errBody.slice(0, 220)}`
      });
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) {
      return res.status(502).json({ error: 'Gemini AI chưa trả về mảng phụ đề hợp lệ, hãy bấm Tạo video lại.' });
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
      nextStart: endSec,
      count: lines.length,
      lines
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ AI: ' + String(err.message || err) });
  }
};
