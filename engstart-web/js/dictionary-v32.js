/* EngStart v32 - dictionary-only module. No changes to IPA / TTS / chat. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal=v=>String(v??'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
  const fold=v=>normal(v).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d');
  const py=v=>fold(v).replace(/[\s'’1-5]/g,'');
  const isHan=v=>/\p{Script=Han}/u.test(v);
  const string=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
  const list=(v,max=20)=>Array.isArray(v)?v.slice(0,max):[];
  const paths={search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>','volume-2':'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>','arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>','arrow-left-right':'<path d="M3 7h17m-5-4 5 4-5 4M21 17H4m5-4-5 4 5 4"/>',bookmark:'<path d="M6 4h12v17l-6-4-6 4Z"/>',check:'<path d="m5 12 4 4L19 6"/>',layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>','git-branch':'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10m0-4c8 0 12-1 12-4"/>',list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>'};
  const icon=name=>`<svg class="nd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.list}</svg>`;
  const curated=window.EngStartDictionaryData||[];
  const historyKey='engstart_dictionary_recent_v32';
  let root=null,ctx=null,lang='all',query='',selected=null,matches=[],bank=[],history=[],cache=new Map(),abort=null,seq=0,busy=false,notice='',audio=null,audioTimer=null,audioSeq=0,speaking=false,initialized=false;
  try{const h=JSON.parse(localStorage.getItem(historyKey)||'[]');history=list(h,12).filter(v=>v&&typeof v.head==='string'&&['en','zh'].includes(v.lang));}catch{}
  const remember=e=>{history=[{head:e.head,lang:e.lang},...history.filter(x=>normal(x.head)!==normal(e.head)||x.lang!==e.lang)].slice(0,12);try{localStorage.setItem(historyKey,JSON.stringify(history));}catch{}};
  function cleanEntry(e,source){
    if(!e||!['en','zh'].includes(e.lang)||!string(e.head,80))return null;
    const groups=list(e.groups,8).map(g=>({pos:string(g?.pos,100)||'Từ vựng',senses:list(g?.senses,8).filter(s=>string(s?.vi)||string(s?.definition)).map(s=>({vi:string(s.vi),definition:string(s.definition),example:string(s.example,350),exampleVi:string(s.exampleVi,350),pinyin:string(s.pinyin,200)}))})).filter(g=>g.senses.length);
    if(!groups.length)return null;
    const rel=a=>list(a,18).filter(x=>string(x?.word,100)).map(x=>({word:string(x.word,100),vi:string(x.vi,200),pos:string(x.pos,100),example:string(x.example,300),exampleVi:string(x.exampleVi,300),context:string(x.context,180)}));
    return {head:string(e.head,80),lang:e.lang,source,uk:string(e.uk,120),us:string(e.us,120),pinyin:string(e.pinyin,120),sub:string(e.sub,120),level:string(e.level,30),overview:string(e.overview,650),forms:string(e.forms,350),usage:string(e.usage,650),groups,collocations:rel(e.collocations),family:rel(e.family),synonyms:rel(e.synonyms),antonyms:rel(e.antonyms)};
  }
  const key=e=>`${e.lang}:${normal(e.head)}`;
  const meaning=e=>e.groups.map(g=>g.senses.map(s=>s.vi||s.definition).join('; ')).join('; ');
  function refreshBank(){
    const map=new Map();
    const add=e=>{if(!e)return;const k=key(e),old=map.get(k);if(!old){map.set(k,e);return;}if(old.source==='local'&&e.source==='local'){
      for(const g of e.groups){const target=old.groups.find(x=>normal(x.pos)===normal(g.pos));if(!target){old.groups.push(g);continue;}for(const s of g.senses){if(!target.senses.some(x=>normal(x.vi)===normal(s.vi)))target.senses.push(s);}}
      if(!old.sub)old.sub=e.sub;if(!old.pinyin)old.pinyin=e.pinyin;if(!old.level)old.level=e.level;
    }};
    curated.forEach(e=>add(cleanEntry(e,'curated')));
    function local(w,l){if(!w||!string(w.head,80)||!string(w.vi))return;return cleanEntry({lang:l,head:w.head,sub:l==='en'?w.sub:'',pinyin:l==='zh'?w.sub:'',level:w.level,usage:w.usage,groups:[{pos:w.pos||'Từ vựng',senses:[{vi:w.vi,example:w.example,exampleVi:w.exampleVi,pinyin:w.examplePy}]}]},'local');}
    const data=ctx?.getData?.()||{};
    for(const w of data.en||[])add(local(w,'en'));
    for(const w of data.zh||[])add(local(w,'zh'));
    // Related entries from the original curated content remain useful without a network.
    for(const e of curated)for(const x of [...(e.collocations||[]),...(e.family||[])]){
      const k=e.lang+':'+normal(x.word);if(map.has(k))continue;
      add(local({head:x.word,sub:e.lang==='zh'?x.pos:'',pos:e.lang==='zh'?'Từ / cụm từ liên quan':(x.pos||'Cụm từ'),vi:x.vi,example:x.example,exampleVi:x.exampleVi},e.lang));
    }
    bank=[...map.values()];
  }
  function candidates(q){
    const n=normal(q),f=fold(q);if(!n)return bank.filter(x=>lang==='all'||x.lang===lang).slice(0,12);
    const scored=bank.filter(x=>lang==='all'||x.lang===lang).map(e=>{
      const head=normal(e.head),sub=normal(e.pinyin||e.sub),vi=fold(meaning(e));let score=0;
      if(head===n)score=100;else if(e.lang==='zh'&&sub&&py(sub)===py(n))score=90;else if(head.startsWith(n))score=70;else if(head.includes(n))score=55;else if(sub&&fold(sub).includes(f))score=45;else if(vi.split(/[,;\/()]/).some(v=>v.trim()===f))score=40;else if(vi.includes(f))score=20;
      return {e,score};
    }).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.e.head.length-b.e.head.length||a.e.head.localeCompare(b.e.head));return scored.slice(0,20).map(x=>x.e);
  }
  function exact(q){const n=normal(q);return matches.find(e=>normal(e.head)===n)||matches.find(e=>e.lang==='zh'&&e.pinyin&&py(e.pinyin)===py(n))||null;}
  function setStatus(text,error=false){const e=root?.querySelector('#nd-audio-status');if(e){e.textContent=text;e.dataset.error=String(error);}}
  function stopAudio(){audioSeq++;if(audioTimer)clearTimeout(audioTimer);audioTimer=null;if(audio){try{audio.pause();audio.removeAttribute('src');audio.load();}catch{}audio=null;}if(speaking){try{window.speechSynthesis?.cancel();}catch{}speaking=false;}}
  function cancelLookup(){seq++;if(abort)abort.abort();abort=null;busy=false;}
  function browserAudio(text,locale,id){if(id!==audioSeq)return;const synth=window.speechSynthesis;const voices=synth?.getVoices?.()||[];const target=locale.toLowerCase();const voice=voices.find(v=>String(v.lang).replace(/_/g,'-').toLowerCase()===target)||(locale==='zh-CN'?voices.find(v=>/^zh[-_]?(cn|hans)/i.test(v.lang)):null);
    if(!synth||!voice||typeof window.SpeechSynthesisUtterance!=='function'){setStatus(`Chưa tải được mẫu đọc ${locale}. Hãy dùng liên kết từ điển hoặc thử lại khi có mạng.`,true);return;}
    try{const u=new window.SpeechSynthesisUtterance(text);u.lang=locale;u.voice=voice;u.rate=.95;speaking=true;u.onstart=()=>{if(id===audioSeq)setStatus('Đang nghe giọng tổng hợp của thiết bị.');};u.onend=()=>{if(id===audioSeq){speaking=false;setStatus('Đã nghe xong.');}};u.onerror=()=>{if(id===audioSeq){speaking=false;setStatus('Không phát được mẫu đọc. Hãy thử lại.',true);}};synth.speak(u);}catch{speaking=false;setStatus('Không phát được mẫu đọc.',true);}}
  function listen(text,locale){if(!text)return;stopAudio();ctx?.stopOtherAudio?.();const id=audioSeq;setStatus('Đang tải âm thanh…');
    if(!/^https?:$/.test(window.location.protocol)){browserAudio(text,locale,id);return;}
    const path=new URL('/api/tts',window.location.href);path.searchParams.set('lang',locale);path.searchParams.set('text',text.slice(0,200));path.searchParams.set('mode',locale.startsWith('en')&&/^[a-zA-Z]+(?:['-][a-zA-Z]+)*$/.test(text)?'ipa-word':'phrase');
    let failed=false;const fail=()=>{if(failed||id!==audioSeq)return;failed=true;clearTimeout(audioTimer);audioTimer=null;if(audio){try{audio.pause();audio.removeAttribute('src');audio.load();}catch{}audio=null;}browserAudio(text,locale,id);};
    try{const a=new Audio(path.href);audio=a;a.onplaying=()=>{if(id===audioSeq&&!failed){clearTimeout(audioTimer);audioTimer=null;setStatus('Đang phát mẫu đọc '+(locale==='en-GB'?'Anh–Anh':locale==='en-US'?'Anh–Mỹ':'tiếng Trung')+'.');}};a.onended=()=>{if(id===audioSeq){audio=null;setStatus('Đã nghe xong.');}};a.onerror=fail;audioTimer=setTimeout(fail,12000);Promise.resolve(a.play()).catch(fail);}catch{fail();}
  }
  function audioButton(text,locale,label='Nghe mẫu'){return `<button type="button" class="nd-audiobtn" data-nd-audio="${esc(text)}" data-nd-locale="${esc(locale)}" title="${esc(label)}" aria-label="${esc(label)}">${icon('volume-2')}</button>`;}
  function chip(e,label){return `<button type="button" class="nd-chip" data-nd-look="${esc(e.head||e.word)}" data-nd-lang="${esc(e.lang||selected?.lang||lang)}" title="${esc(e.context||'Tra từ này')}"><b>${esc(e.head||e.word)}</b>${label?`<small>${esc(label)}</small>`:''}</button>`;}
  function lookupLocale(e){return e.lang==='zh'?'zh-CN':'en-GB';}
  function highlight(text,e){
    const t=String(text||'');let targets=[e.head];
    if(e.lang==='en'&&e.forms){targets.push(...e.forms.split(' – ').flatMap(v=>v.split('/')).map(v=>v.trim()).filter(v=>v&&/^[a-zA-Z'-]+$/.test(v)));}
    const literal=v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    try{const re=new RegExp(e.lang==='en'?'\\b(?:'+targets.sort((a,b)=>b.length-a.length).map(literal).join('|')+')\\b':literal(e.head),'giu');let at=0,html='';for(const match of t.matchAll(re)){html+=esc(t.slice(at,match.index))+'<mark class="nd-example-target">'+esc(match[0])+'</mark>';at=match.index+match[0].length;}return html+esc(t.slice(at));}catch{return esc(t);}
  }
  function example(s,e){return s.example?`<div class="nd-example"><div><b>${highlight(s.example,e)}</b>${s.pinyin?`<p>${esc(s.pinyin)}</p>`:''}${s.exampleVi?`<p>${esc(s.exampleVi)}</p>`:''}</div>${audioButton(s.example,lookupLocale(e),'Nghe câu ví dụ')}</div>`:'';}
  function sourceLabel(e){return e.source==='curated'?'Mục từ biên soạn sẵn':e.source==='ai'?'Mục từ do Gemini tạo · cần đối chiếu':'Kho từ vựng của web · nghĩa cơ bản';}
  function relatedPanel(title,items,e,kind){
    const empty='<div class="nd-muted">Chưa có dữ liệu cho mục này.</div>';
    return `<section class="nd-panel ${kind==='family'?'nd-panel-gold':'nd-panel-blue'}"><h2 class="nd-h2">${icon(kind==='family'?'git-branch':'layers')}${title}</h2>${items.length?(kind==='family'?`<div class="nd-family">${items.map(x=>`<button type="button" data-nd-look="${esc(x.word)}" data-nd-lang="${e.lang}"><b>${esc(x.word)}</b>${x.pos?`<span class="nd-badge">${esc(x.pos)}</span>`:''}<small>${esc(x.vi)}</small></button>`).join('')}</div>`:`<div class="nd-related">${items.map(x=>`<div class="nd-related-row"><button type="button" class="nd-related-word" data-nd-look="${esc(x.word)}" data-nd-lang="${e.lang}"><b>${esc(x.word)}</b><small>${esc(x.vi)}${x.pos?` · ${esc(x.pos)}`:''}</small>${x.example?`<small>${esc(x.example)}${x.exampleVi?` — ${esc(x.exampleVi)}`:''}</small>`:''}</button>${audioButton(x.word,lookupLocale(e),'Nghe '+x.word)}</div>`).join('')}</div>`):empty}</section>`;
  }
  function renderDetail(e){
    const locale=lookupLocale(e),isZh=e.lang==='zh', saved=ctx?.isSaved?.(e.head)||false;
    const accent=(label,value,l)=>`<button type="button" data-nd-audio="${esc(e.head)}" data-nd-locale="${l}" aria-label="Nghe ${label}"><span><strong>${label}</strong> <span class="nd-ipa">${esc(value||'Chưa có phiên âm')}</span></span>${icon('volume-2')}</button>`;
    const groups=e.groups.map((g,i)=>`<details class="nd-group" ${i===0?'open':''}><summary><span class="nd-badge">${esc(g.pos)}</span><span>${g.senses.length} ${e.source==='local'?'mục':'nghĩa'}</span><span class="nd-muted">${i===0?'':esc(g.senses.map(s=>s.vi).join('; ').slice(0,100))}</span></summary><div class="nd-senses">${g.senses.map((s,j)=>`<article class="nd-sense"><span class="nd-num">${j+1}</span><div><div class="nd-meaning">${esc(s.vi||s.definition)}</div>${s.definition&&s.vi?`<div class="nd-definition">${esc(s.definition)}</div>`:''}${example(s,e)}</div></article>`).join('')}</div></details>`).join('');
    const chips=(arr)=>arr.length?`<div class="nd-pills">${arr.map(x=>chip({...x,lang:e.lang},[x.vi,x.context].filter(Boolean).join(' · '))).join('')}</div>`:'<div class="nd-muted">Không có dữ liệu phù hợp.</div>';
    const external=e.lang==='en'?`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(e.head)}`:`https://dictionary.cambridge.org/dictionary/chinese-simplified-english/${encodeURIComponent(e.head)}`;
    return `<div class="nd-cols"><div class="nd-stack"><section class="nd-panel"><div class="nd-headrow"><div><div class="nd-pills"><h2 class="nd-word">${esc(e.head)}</h2>${e.level?`<span class="nd-badge nd-badge-level" title="Mức độ tham khảo">${esc(e.level)}</span>`:''}${e.groups.map(g=>`<span class="nd-badge">${esc(g.pos)}</span>`).join('')}</div><p class="nd-muted" style="margin-top:5px">${esc(sourceLabel(e))}</p></div><button type="button" class="nd-btn" data-nd-save ${saved?'aria-pressed="true"':'aria-pressed="false"'}>${icon(saved?'check':'bookmark')}${saved?'Đã lưu':'Lưu sổ tay'}</button></div><div class="nd-audios">${isZh?accent('Pinyin',e.pinyin,'zh-CN'):accent('UK',e.uk,'en-GB')+accent('US',e.us,'en-US')}</div>${!isZh&&!e.uk&&!e.us&&e.sub?`<p class="nd-muted">Phiên âm gốc trong kho: ${esc(e.sub)} (chưa xác định giọng)</p>`:''}<p id="nd-audio-status" class="nd-status" role="status" aria-live="polite">Nghe từ hoặc câu mẫu · không ảnh hưởng bộ IPA.</p>${e.overview?`<p class="nd-overview">${esc(e.overview)}</p>`:''}${groups}${e.forms?`<div class="nd-usage"><b>Dạng từ:</b> ${esc(e.forms)}</div>`:''}${e.usage?`<div class="nd-usage"><b>Ghi chú cách dùng:</b> ${esc(e.usage)}</div>`:''}<div class="nd-foot"><a href="${esc(external)}" target="_blank" rel="noopener noreferrer">Đối chiếu từ điển Cambridge ↗</a>${e.source==='local'?`<button type="button" class="nd-btn" data-nd-online="${esc(e.head)}" data-nd-lang="${e.lang}" ${busy?'disabled':''}>${icon('sparkles')} Mở rộng nghĩa bằng AI</button>`:''}</div></section><section class="nd-panel nd-panel-green"><h2 class="nd-h2">${icon('arrow-left-right')} Đồng nghĩa &amp; trái nghĩa</h2><p class="nd-muted" style="margin-bottom:10px">Các từ chỉ tương đương hoặc đối lập trong nghĩa cụ thể; không thay thế được trong mọi câu.</p><div class="nd-syn-grid"><div><h3 class="nd-subhead">Đồng nghĩa / gần nghĩa</h3>${chips(e.synonyms)}</div><div><h3 class="nd-subhead">Trái nghĩa</h3>${chips(e.antonyms)}</div></div></section></div><aside class="nd-stack">${relatedPanel('Cụm từ kết hợp',e.collocations,e,'collocations')}${relatedPanel(isZh?'Từ liên quan / Họ từ':'Họ từ',e.family,e,'family')}${renderMatches(e)}</aside></div>`;
  }
  function renderMatches(e){const related=matches.filter(m=>!e||key(m)!==key(e));return related.length?`<section class="nd-panel"><h2 class="nd-h2">${icon('list')} Kết quả trong kho từ</h2><div class="nd-related">${related.map(m=>`<div class="nd-related-row"><button type="button" class="nd-related-word" data-nd-look="${esc(m.head)}" data-nd-lang="${m.lang}"><b>${esc(m.head)} <span class="nd-muted">${m.lang==='en'?'EN':'中文'}</span></b><small>${esc(meaning(m).slice(0,160))}</small></button></div>`).join('')}</div></section>`:'';}
  function renderView(){if(!root)return;
    const label=lang==='en'?'Tìm từ hoặc cụm từ tiếng Anh…':lang==='zh'?'Tìm chữ Hán, Pinyin hoặc nghĩa tiếng Việt…':'Tìm từ tiếng Anh, chữ Hán, Pinyin hoặc nghĩa tiếng Việt…';
    const langButtons=[['all','Tất cả'],['en','Tiếng Anh'],['zh','Tiếng Trung']].map(([l,t])=>`<button type="button" data-nd-filter="${l}" aria-pressed="${lang===l}">${t}</button>`).join('');
    root.innerHTML=`<div class="nd-shell"><header class="nd-banner"><form id="nd-search-form" class="nd-search"><h1 class="nd-title">📖 Từ điển.</h1><div class="nd-searchbox">${icon('search')}<input id="nd-query" aria-label="Từ cần tra" maxlength="80" value="${esc(query)}" placeholder="${esc(label)}" autocomplete="off"/><button type="button" class="nd-clear" data-nd-clear aria-label="Xóa tìm kiếm">×</button></div><button class="nd-btn nd-primary" type="submit">Tra từ ${icon('arrow-right')}</button></form><div class="nd-meta"><div class="nd-lang" aria-label="Ngôn ngữ">${langButtons}</div><span class="nd-muted">${bank.filter(x=>x.lang==='en').length} mục Anh · ${bank.filter(x=>x.lang==='zh').length} mục Trung · Kho cục bộ + tra cứu AI</span></div></header>${history.length?`<div class="nd-pills"><span class="nd-muted">Gần đây:</span>${history.slice(0,7).map(x=>chip(x,'')).join('')}<button type="button" data-nd-history-clear class="nd-btn">Xóa lịch sử</button></div>`:''}${busy?'<div class="nd-notice" role="status">Đang tra cứu mở rộng bằng Gemini… Bạn có thể tiếp tục tra từ khác.</div>':''}${notice?`<div class="nd-notice" role="status">${esc(notice)}</div>`:''}${selected?renderDetail(selected):`<div class="nd-stack"><section class="nd-panel nd-empty"><h2>${query?'Chưa có mục từ chính xác':'Tra cứu một từ hoặc cụm từ'}</h2><p class="nd-muted">${query?(matches.length?'Chọn một kết quả phù hợp bên dưới.':'Thử kiểm tra chính tả, chuyển ngôn ngữ hoặc dùng tra cứu mở rộng.'): 'Chọn một từ để xem nghĩa, cách đọc, cụm từ và ví dụ song ngữ.'}</p><div class="nd-pills" style="justify-content:center;margin-top:12px">${query?`<button type="button" class="nd-btn" data-nd-online="${esc(query)}" data-nd-lang="en" ${busy?'disabled':''}>Tra AI tiếng Anh</button><button type="button" class="nd-btn" data-nd-online="${esc(query)}" data-nd-lang="zh" ${busy?'disabled':''}>Tra AI tiếng Trung</button>`:(lang==='zh'?['你好','学习','玩']:['play','run','book','light']).map(w=>chip({head:w,lang:lang==='zh'?'zh':'en'},'')).join('')}</div></section>${renderMatches(null)}</div>`}</div>`;
    ctx?.refreshIcons?.();
  }
  async function online(q,l){
    const requested=string(q,80);if(!requested||!['en','zh'].includes(l))return;cancelLookup();stopAudio();const id=seq;const k=l+':'+normal(requested);const cached=cache.get(k);
    if(cached){selected=cached;remember(cached);notice='';renderView();return;}
    abort=new AbortController();busy=true;notice='';renderView();const timer=setTimeout(()=>abort&&seq===id&&abort.abort(),28000);
    try{const res=await fetch('/api/dictionary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:requested,lang:l}),signal:abort.signal});const data=await res.json().catch(()=>({}));if(seq!==id)return;if(!res.ok)throw new Error(data.error||'Tra cứu mở rộng không thành công.');
      const e=cleanEntry(data.entry,'ai');if(!e||e.lang!==l||(normal(e.head)!==normal(requested)&&!(l==='zh'&&!isHan(requested)&&py(e.pinyin)===py(requested))))throw new Error('Kết quả không khớp từ cần tra.');
      selected=e;remember(e);if(cache.size>=80)cache.delete(cache.keys().next().value);cache.set(k,e);notice='Kết quả AI có thể chưa chính xác; đối chiếu nguồn từ điển khi cần.';
    }catch(error){if(seq===id)notice=error?.name==='AbortError'?'Tra cứu quá thời gian. Dữ liệu cục bộ vẫn sử dụng được.':string(error?.message)||'Không kết nối được dịch vụ từ điển.';}
    finally{clearTimeout(timer);if(seq===id){busy=false;abort=null;renderView();}}
  }
  function search(q,l=lang,auto=true){cancelLookup();stopAudio();lang=['all','en','zh'].includes(l)?l:'all';ctx?.setLang?.(lang);query=string(q,80);notice='';matches=candidates(query);selected=exact(query);if(selected)remember(selected);renderView();if(!auto||!query||selected?.source==='curated')return;
    // Only send an explicit, unambiguous lexical query to the online service.
    if(selected){online(selected.head,selected.lang);return;}
    if(matches.length&&lang==='all'&&!isHan(query))return;
    if(isHan(query)&&lang!=='en')online(query,'zh');else if(lang==='zh')online(query,'zh');else if(lang==='en'||/^[a-zA-Z]+(?:[\s'’\-][a-zA-Z]+)*$/.test(query))online(query,'en');
  }
  function onClick(ev){const t=ev.target.closest('button');if(!t||!root.contains(t))return;
    if(t.hasAttribute('data-nd-clear')){search('',lang,false);root.querySelector('#nd-query')?.focus();}
    else if(t.dataset.ndFilter){search(query,t.dataset.ndFilter,false);}
    else if(t.dataset.ndLook){search(t.dataset.ndLook,t.dataset.ndLang||lang,true);}
    else if(t.hasAttribute('data-nd-history-clear')){history=[];try{localStorage.removeItem(historyKey);}catch{}renderView();}
    else if(t.dataset.ndOnline){const q=t.dataset.ndOnline,l=t.dataset.ndLang;query=q;lang=l;ctx?.setLang?.(l);matches=candidates(q);selected=exact(q);online(q,l);}
    else if(t.dataset.ndAudio){listen(t.dataset.ndAudio,t.dataset.ndLocale||'en-GB');}
    else if(t.hasAttribute('data-nd-save')&&selected){ctx?.save?.(selected,meaning(selected));renderView();}
  }
  function onSubmit(ev){if(ev.target.id!=='nd-search-form')return;ev.preventDefault();search(root.querySelector('#nd-query')?.value||'',lang,true);}
  function render(el,context){ctx=context;const newRoot=root!==el;root=el;if(newRoot){root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);}refreshBank();const desired=context.lang||'all';if(!initialized){initialized=true;search(desired==='zh'?'你好':'play',desired,false);}else if(desired!==lang){search(query,desired,false);}else{matches=candidates(query);if(selected?.source==='local')selected=exact(query);renderView();}}
  function leave(){cancelLookup();stopAudio();notice='';}
  window.EngStartDictionary={render,leave};
})();
