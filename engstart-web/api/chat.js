// Vercel Serverless Function: /api/chat
// Giữ kín GEMINI_API_KEY trên máy chủ Vercel để mọi người dùng web đều trò chuyện tự do mà không cần nhập Key.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (req.method === 'GET') {
    return res.status(200).json({ enabled: Boolean(apiKey) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'Server GEMINI_API_KEY is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const isZh = body.lang === 'zh';
    const topicTitle = String(body.topicTitle || 'Trò chuyện tự do').slice(0, 120);
    const historyArr = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const historyText = historyArr
      .map(m => `${m.role === 'user' ? 'Student' : (isZh ? 'Teacher Xiaomei' : 'Teacher Sarah')}: ${String(m.text || '').slice(0, 400)}`)
      .join('\n');

    const prompt = isZh
      ? `You are Teacher Xiaomei (小美老师), a warm, friendly Mandarin Chinese teacher helping a Vietnamese learner practice free-flowing conversation (topic: "${topicTitle}").\nConversation so far:\n${historyText}\n\nReply naturally to whatever the student said. Return ONLY valid JSON with keys: "zh" (1-2 natural Simplified Chinese sentences ending with a friendly follow-up question), "pinyin" (Pinyin with tone marks), "vi" (natural Vietnamese translation), "tip" (short Vietnamese feedback or tip if helpful, else ""), "suggestions" (array of 3 objects with {"zh":"...","pinyin":"..."}).`
      : `You are Teacher Sarah, a warm, friendly English teacher helping a Vietnamese learner practice free-flowing conversation (topic: "${topicTitle}").\nConversation so far:\n${historyText}\n\nReply naturally to whatever the student said. Return ONLY valid JSON with keys: "en" (1-2 natural, encouraging English sentences ending with a friendly follow-up question), "vi" (natural Vietnamese translation), "tip" (short Vietnamese grammar/wording tip if the student made a mistake, else ""), "suggestions" (array of 3 short natural English sample replies).`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    if (!geminiRes.ok) {
      const errTxt = await geminiRes.text();
      return res.status(502).json({ error: 'Gemini upstream error', detail: errTxt.slice(0, 300) });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'Invalid AI JSON response' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Internal proxy error', detail: String(err.message || err) });
  }
}
