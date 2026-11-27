// Vercel Serverless Function: /api/chat (v13 — Trò chuyện AI tự nhiên thật sự + tự chuyển model dự phòng khi 503!)

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function callGeminiWaterfall(prompt, apiKey) {
  // Tự động thử lần lượt các model Flash mới nhất nếu 1 model đang nghẽn 503
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastErr = '';

  for (const model of models) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              responseMimeType: 'application/json'
            }
          })
        },
        14000
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return { parsed: JSON.parse(jsonMatch[0]), model };
        }
      } else {
        const txt = await res.text();
        lastErr = `${model} (${res.status}): ${txt.slice(0, 140)}`;
      }
    } catch (e) {
      lastErr = `${model}: ${String(e.message || e)}`;
    }
  }
  throw new Error(lastErr || 'All Gemini models unavailable');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (req.method === 'GET') {
    return res.status(200).json({ enabled: Boolean(apiKey) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!apiKey) return res.status(503).json({ error: 'Server GEMINI_API_KEY is not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const isZh = body.lang === 'zh';
    const topicTitle = String(body.topicTitle || 'Trò chuyện tự do').slice(0, 120);
    const historyArr = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const historyText = historyArr
      .map(m => `${m.role === 'user' ? 'Student' : (isZh ? 'Teacher Xiaomei' : 'Teacher Sarah')}: ${String(m.text || '').slice(0, 400)}`)
      .join('\n');

    const prompt = isZh
      ? `You are Teacher Xiaomei (小美老师), a warm, witty, genuinely knowledgeable Mandarin Chinese teacher chatting freely with a Vietnamese learner (topic: "${topicTitle}").
IMPORTANT: Actually answer the student's EXACT message or question first (if they mention a place like Gia Lai, ask a real question, or write in Vietnamese, respond directly and warmly to what they just said!). Keep it natural like a real friend/teacher, never give generic scripted replies.
Conversation so far:
${historyText}

Return ONLY valid JSON with keys:
- "zh": 1-3 natural Simplified Chinese sentences directly answering the student + a friendly follow-up question
- "pinyin": Pinyin with tone marks for "zh"
- "vi": natural Vietnamese translation of "zh"
- "tip": if the student wrote in Vietnamese or made a small mistake, briefly show how to say their sentence in Chinese (with Pinyin), otherwise ""
- "suggestions": array of 3 natural follow-up replies the student can say next: [{"zh":"...","pinyin":"..."}]`
      : `You are Teacher Sarah, a warm, witty, genuinely knowledgeable English teacher chatting freely with a Vietnamese learner (topic: "${topicTitle}").
IMPORTANT: Actually answer the student's EXACT message or question first (if they mention a place like Gia Lai, ask a real-world question, or write in Vietnamese, respond directly and warmly to what they just said!). Keep it natural like a real friend/teacher, never give generic scripted replies.
Conversation so far:
${historyText}

Return ONLY valid JSON with keys:
- "en": 1-3 natural, friendly English sentences directly answering the student + a natural follow-up question
- "vi": natural Vietnamese translation of "en"
- "tip": if the student wrote in Vietnamese or made a grammar mistake, briefly show the natural English way to say what they meant, otherwise ""
- "suggestions": array of 3 short natural English follow-up replies the student can say next`;

    const { parsed, model } = await callGeminiWaterfall(prompt, apiKey);
    return res.status(200).json({ ...parsed, _model: model });
  } catch (err) {
    return res.status(502).json({ error: 'Gemini AI tạm bận', detail: String(err.message || err) });
  }
};
