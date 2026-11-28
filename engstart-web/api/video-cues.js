/* EngStart v40: recognize timed speech from a public YouTube video via Gemini.
   No synthetic timing, no companion text, no YouTube caption scraping. */
const WINDOW = 45, LOOKAHEAD = 8;
const finite = Number.isFinite;
const round = n => Math.round(n * 1000) / 1000;
const offset = n => `${round(n).toFixed(3)}s`;
function validateResult(data, start, cutoff, clipEnd, total, language) {
  if (!data || data.timeBase !== 'clip-seconds' || !Array.isArray(data.lines) || data.lines.length > 100) throw Error('AI không trả đúng định dạng phụ đề.');
  const limit = cutoff - start, available = clipEnd - start;
  const coverage = data.coveredThrough;
  if (!finite(coverage) || coverage <= 0 || coverage > available + .02 || coverage < limit - .1) throw Error('AI chưa xác nhận đã nghe đủ đoạn yêu cầu. Hãy thử lại hoặc nhập phụ đề.');
  const absoluteCoverage = round(Math.min(total, start + coverage));
  const lines = [];
  for (const x of data.lines) {
    if (!x || !finite(x.start) || !finite(x.end) || x.start < 0 || x.start >= limit + .02 || x.end <= x.start || x.end > coverage + .02 || x.end > available + .02 || typeof x.text !== 'string' || !x.text.trim() || x.text.length > 1000) throw Error('AI trả mốc thời gian hoặc lời thoại không hợp lệ; không lưu đoạn lỗi.');
    const a = round(start + x.start), b = round(Math.min(total,start + x.end));
    if (b <= a || lines.length && a < lines[lines.length-1].end) throw Error('Mốc phụ đề bị chồng lấn; hãy thử lại hoặc nhập SRT/VTT.');
    const lang = ['en','zh','vi'].includes(x.language) ? x.language : language === 'auto' ? '' : language;
    if (!lang || (language !== 'auto' && lang !== language)) throw Error('Ngôn ngữ lời thoại không khớp lựa chọn. Hãy chọn Tự nhận diện.');
    lines.push({start:a,end:b,text:x.text.trim(),original:x.text.trim(),sourceLang:lang,vi:lang==='vi'?x.text.trim():String(x.vi||'').trim().slice(0,1000),ipa:lang==='zh'?String(x.ipa||'').trim().slice(0,1000):''});
  }
  if (!lines.length && data.silent !== true) throw Error('AI chưa nhận được lời thoại; không bỏ qua đoạn này.');
  if (lines.length && data.silent === true) throw Error('Dữ liệu AI mâu thuẫn.');
  // Advancing past an unfinished boundary is not allowed: coverage must be explicitly supplied.
  return {lines,nextStart:absoluteCoverage,silent:data.silent===true,estimated:true};
}
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Chỉ hỗ trợ POST.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({error:'Dữ liệu không hợp lệ.'});}
  const {videoId,start,duration:total,language='auto'}=body;
  if(!/^[\w-]{11}$/.test(videoId||'')||!finite(start)||!finite(total)||start<0||total<=start||total>21600||!['auto','en','zh','vi'].includes(language))return res.status(400).json({error:'Video, thời lượng hoặc ngôn ngữ không hợp lệ (tối đa 6 giờ).'});
  const key=(process.env.GEMINI_API_KEY||'').trim();if(!key)return res.status(503).json({error:'Chưa có GEMINI_API_KEY trên Vercel. Hãy nạp bản chép lời có mốc thời gian hoặc SRT/VTT.'});
  const cutoff=round(Math.min(total,start+WINDOW)),clipEnd=round(Math.min(total,cutoff+LOOKAHEAD));
  const prompt=`Listen to the actual audio of the supplied clipped public video. Do not use the title, topic, or imagined examples. Transcribe only speech actually heard, verbatim in its original language (${language==='auto'?'detect English, Mandarin or Vietnamese':language}). Make short natural clause-sized dictation cues, roughly 2-8 seconds; do not break a word, do not add words, do not paraphrase. Time base: numeric seconds RELATIVE TO THE START OF THIS CLIP, zero at the clip start (absolute video time ${round(start)}s). Cover all speech whose onset is before relative ${round(cutoff-start)} seconds. You have ${round(clipEnd-start)} seconds of audio, including lookahead, to finish a phrase crossing that cutoff. Do not include a new phrase starting after the cutoff. If a final phrase crosses the cutoff, report its real end using the lookahead. If you cannot hear or time the speech reliably, return an error-shaped object rather than guessing. Set coveredThrough to the relative cutoff, or the last included phrase's end if later. Set silent true ONLY if there was no speech in the requested range. Include actual start and end for each cue (not estimated by evenly splitting text), no overlaps, no music annotations. Include Vietnamese translation vi and pinyin ipa for Mandarin when possible; original text must never be replaced by its translation. Return a JSON object only: {"timeBase":"clip-seconds","coveredThrough":number,"silent":boolean,"lines":[{"start":number,"end":number,"text":"actual speech","language":"en or zh or vi","vi":"Vietnamese meaning","ipa":"Pinyin if Mandarin"}]}.`;
  const configured=(process.env.GEMINI_VIDEO_MODEL||'').trim();const models=configured&&/^[a-zA-Z0-9._-]+$/.test(configured)?[configured]:['gemini-3.6-flash','gemini-3.5-flash','gemini-3-flash-preview'];
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),42000);
  try{
    for(let i=0;i<models.length;i++){
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${models[i]}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts:[{fileData:{fileUri:`https://www.youtube.com/watch?v=${videoId}`,mimeType:'video/mp4'},videoMetadata:{startOffset:offset(start),endOffset:offset(clipEnd),fps:1}},{text:prompt}]}],generationConfig:{temperature:0,responseMimeType:'application/json',maxOutputTokens:4096}})});
      if(r.status===404&&i<models.length-1)continue;
      if(!r.ok)return res.status(r.status===429?429:502).json({error:r.status===429?'Gemini hết lượt hoặc đang giới hạn yêu cầu. Phần đã xử lý vẫn được lưu.':`Gemini không nhận dạng được video (HTTP ${r.status}). Hãy thử video công khai khác hoặc nạp phụ đề.`});
      const out=await r.json(),candidate=out?.candidates?.[0];if(candidate?.finishReason&&candidate.finishReason!=='STOP')throw Error('AI chưa trả kết quả hoàn chỉnh.');
      const text=(candidate?.content?.parts||[]).filter(x=>!x.thought).map(x=>x.text||'').join('').trim();let parsed;try{parsed=JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{throw Error('Không đọc được phụ đề AI.');}
      return res.status(200).json(validateResult(parsed,start,cutoff,clipEnd,total,language));
    }
    return res.status(502).json({error:'Không tìm thấy model nhận dạng video tương thích.'});
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'Nhận dạng quá thời gian. Hãy tiếp tục hoặc nạp phụ đề.':String(e.message||'Không nhận dạng được video.').slice(0,240)});}finally{clearTimeout(timer);}
};
