// Vercel Serverless Function: /api/transcript?v=VIDEO_ID&lang=en|zh
// Dùng trực tiếp Gemini 2.5 Flash nghe & dịch thẳng video YouTube (fileData.fileUri) — KHÔNG cần phụ thuộc vào phụ đề CC của YouTube!

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const videoId = String(req.query.v || '').trim();
  const isZh = String(req.query.lang || 'en').toLowerCase() === 'zh';
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Link YouTube không hợp lệ.' });
  }
  if (!apiKey) {
    return res.status(503).json({ error: 'Chưa cài GEMINI_API_KEY trên Vercel (Settings → Environment Variables).' });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const prompt = isZh
    ? `Watch and listen carefully to this YouTube video from 00:00 up to the first 3 minutes (or the end if shorter).
Break the spoken dialogue into natural subtitle segments (about 25 to 50 segments).
For each segment, return:
- "start": start time in seconds (number, e.g. 0, 4.5, 9.2)
- "end": end time in seconds (number)
- "text": natural Simplified Chinese translation/transcription of what is spoken
- "ipa": Pinyin with tone marks for "text"
- "vi": natural Vietnamese translation/transcription of what is spoken

Return ONLY a valid JSON array with no markdown fences:
[{"start":0,"end":4.5,"text":"...","ipa":"...","vi":"..."}]`
    : `Watch and listen carefully to this YouTube video from 00:00 up to the first 3 minutes (or the end if shorter).
Break the spoken dialogue into natural subtitle segments (about 25 to 50 segments).
For each segment, return:
- "start": start time in seconds (number, e.g. 0, 4.5, 9.2)
- "end": end time in seconds (number)
- "text": natural English translation/transcription of what is spoken
- "ipa": brief US IPA transcription or empty string ""
- "vi": natural Vietnamese translation/transcription of what is spoken

Return ONLY a valid JSON array with no markdown fences:
[{"start":0,"end":4.5,"text":"...","ipa":"","vi":"..."}]`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { fileData: { fileUri: ytUrl } },
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
        error: `Gemini AI báo lỗi (${geminiRes.status}). Hãy kiểm tra lại GEMINI_API_KEY trên Vercel.`,
        detail: errBody.slice(0, 300)
      });
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) {
      return res.status(502).json({ error: 'Gemini AI chưa trả về đúng định dạng phụ đề, hãy thử bấm Tạo video lại.' });
    }

    const parsed = JSON.parse(arrMatch[0]);
    const lines = (Array.isArray(parsed) ? parsed : [])
      .filter(x => x && x.text)
      .map((x, idx, arr) => {
        const start = Number(x.start) || (idx * 4);
        const nextStart = arr[idx + 1] ? Number(arr[idx + 1].start) : (start + 4);
        const end = Number(x.end) > start ? Number(x.end) : Math.max(start + 2, nextStart);
        return {
          start: Number(start.toFixed(2)),
          end: Number(end.toFixed(2)),
          text: String(x.text || '').trim(),
          ipa: String(x.ipa || '').trim(),
          vi: String(x.vi || '').trim()
        };
      });

    if (!lines.length) {
      return res.status(404).json({ error: 'Không nghe thấy lời thoại trong video này.' });
    }

    return res.status(200).json({
      lang: isZh ? 'zh' : 'en',
      translatedBy: 'gemini-native-video',
      count: lines.length,
      lines
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ AI: ' + String(err.message || err) });
  }
};
