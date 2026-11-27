// Vercel Serverless Function: /api/chat (v15 — Tự dò model Gemini đang mở cho Key + hỗ trợ ?test=1 để kiểm tra trực tiếp!)

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function discoverFlashModels(apiKey) {
  try {
    const r = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {},
      6000
    );
    if (!r.ok) return [];
    const data = await r.json();
    const list = (data.models || [])
      .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => String(m.name || '').replace(/^models\//, ''))
      .filter(name => /gemini/i.test(name));
    // Prefer flash / lite models first for speed
    const flashFirst = [
      ...list.filter(n => /flash-lite|flash/i.test(n) && !/image|tts|audio|live|thinking/i.test(n)),
      ...list.filter(n => !/flash/i.test(n) && !/embedding|imagen|veo|aqa/i.test(n))
    ];
    return [...new Set(flashFirst)].slice(0, 6);
  } catch {
    return [];
  }
}

async function callGeminiSmart(prompt, apiKey) {
  const discovered = await discoverFlashModels(apiKey);
  const candidates = [...new Set([...discovered, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'])];
  const errors = [];

  for (const model of candidates) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.75 }
          })
        },
        12000
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return { parsed: JSON.parse(jsonMatch[0]), model };
        }
        errors.push(`${model}: non-JSON reply`);
      } else {
        const txt = await res.text();
        errors.push(`${model} (${res.status}): ${txt.slice(0, 120)}`);
      }
    } catch (e) {
      errors.push(`${model}: ${String(e.message || e)}`);
    }
  }
  throw new Error(errors.join(' | '));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (req.method === 'GET') {
    if (req.query && req.query.test === '1') {
      const models = await discoverFlashModels(apiKey);
      try {
        const out = await callGeminiSmart('Student asks: "Bạn có biết Gia Lai ở đâu không?". Reply ONLY JSON: {"en":"short friendly answer about Gia Lai in English","vi":"Vietnamese translation","tip":"","suggestions":["Yes!"]}', apiKey);
        return res.status(200).json({ ok: true, discoveredModels: models, usedModel: out.model, reply: out.parsed });
      } catch (err) {
        return res.status(502).json({ ok: false, discoveredModels: models, error: String(err.message || err) });
      }
    }
    return res.status(200).json({ enabled: Boolean(apiKey) });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!apiKey) return res.status(503).json({ error: 'Server GEMINI_API_KEY is not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.mode === 'reading') {
      const isZhRead = body.lang === 'zh';
      const topic = String(body.topic || (isZhRead ? 'cuộc sống hằng ngày' : 'daily life')).trim().slice(0, 100);
      const readPrompt = isZhRead
        ? `Tạo 1 bài đọc hiểu điền từ ngắn (2-3 câu trình độ HSK 1-2, phù hợp cho bé và người mới học) bằng tiếng Trung về chủ đề "${topic}". Chỉ trả về ĐÚNG 1 JSON hợp lệ (không markdown): {"title":"Tiêu đề tiếng Trung (dịch Việt)","level":"HSK 1-2 · AI tạo","before":"đoạn trước chỗ trống","blank":"1 từ tiếng Trung 1-2 chữ","after":"đoạn sau chỗ trống","pinyin":"phiên âm đầy đủ có dấu thanh","vi":"dịch tiếng Việt tự nhiên","question":"1 câu hỏi đọc hiểu bằng tiếng Việt","options":["đáp án A","đáp án B","đáp án C","đáp án D"],"correctIdx":0,"explanation":"giải thích ngắn bằng tiếng Việt"}`
        : `Create 1 short beginner A1-A2 English fill-in-the-blank reading passage (2-3 fun, clear sentences suitable for kids and beginners) about "${topic}". Return ONLY valid JSON (no markdown): {"title":"Short title","level":"A1–A2 · AI tạo","before":"text before blank ending with a space ","blank":"1 simple English word","after":" text after blank.","vi":"natural Vietnamese translation","question":"1 short English comprehension question","options":["option A","option B","option C","option D"],"correctIdx":0,"explanation":"short explanation in Vietnamese"}`;
      const { parsed, model } = await callGeminiSmart(readPrompt, apiKey);
      return res.status(200).json({ ...parsed, _model: model });
    }
    const isZh = body.lang === 'zh';
    const topicTitle = String(body.topicTitle || 'Trò chuyện tự do').slice(0, 120);
    const historyArr = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const historyText = historyArr
      .map(m => `${m.role === 'user' ? 'Student' : (isZh ? 'Teacher Xiaomei' : 'Teacher Sarah')}: ${String(m.text || '').slice(0, 400)}`)
      .join('\n');

    const prompt = isZh
      ? `You are Teacher Xiaomei (小美老师), a warm, witty, genuinely knowledgeable Mandarin Chinese teacher chatting freely with a Vietnamese learner (topic: "${topicTitle}").
IMPORTANT: Directly answer the student's EXACT message or question first (if they mention Gia Lai or ask a real question in Vietnamese/Chinese, answer about it warmly and specifically!). Never give generic scripted replies.
Conversation so far:
${historyText}

Return ONLY valid JSON:
{"zh":"1-3 natural Simplified Chinese sentences answering the student + a friendly follow-up question","pinyin":"Pinyin with tone marks","vi":"natural Vietnamese translation","tip":"short Vietnamese tip or how to say their sentence in Chinese, or empty string","suggestions":[{"zh":"...","pinyin":"..."},{"zh":"...","pinyin":"..."},{"zh":"...","pinyin":"..."}]}`
      : `You are Teacher Sarah, a warm, witty, genuinely knowledgeable English teacher chatting freely with a Vietnamese learner (topic: "${topicTitle}").
IMPORTANT: Directly answer the student's EXACT message or question first (if they mention Gia Lai or ask a real question in Vietnamese/English, answer about it warmly and specifically!). Never give generic scripted replies.
Conversation so far:
${historyText}

Return ONLY valid JSON:
{"en":"1-3 natural English sentences answering the student + a friendly follow-up question","vi":"natural Vietnamese translation","tip":"short Vietnamese tip or how to say their sentence in English, or empty string","suggestions":["reply 1","reply 2","reply 3"]}`;

    const { parsed, model } = await callGeminiSmart(prompt, apiKey);
    return res.status(200).json({ ...parsed, _model: model });
  } catch (err) {
    return res.status(502).json({ error: 'Gemini AI tạm bận', detail: String(err.message || err) });
  }
};
