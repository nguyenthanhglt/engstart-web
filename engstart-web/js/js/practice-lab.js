/* Nguyen Thanh - optional study games. No changes to IPA, auth, API or other lessons. */
(() => {
  'use strict';
  const KEY = 'engstart_practice_lab_v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const shuffle = a => { const b = a.slice(); for (let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const tidy = value => String(value||'').normalize('NFC').toLowerCase().replace(/[.,?!;:，。！？、]/g,'').replace(/\s+/g,' ').trim();
  const statsDefault = () => ({en:{played:0,correct:0,total:0,days:{}}, zh:{played:0,correct:0,total:0,days:{}}});
  let stats = statsDefault();
  try { const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved && typeof saved==='object') for (const lang of ['en','zh']) if(saved[lang]) stats[lang]={...stats[lang],...saved[lang],days:saved[lang].days||{}}; } catch(_){}
  let lang='en', audience='all', game=null, data=[], position=0, correct=0, hasAnswered=false, selected=null, matches=[], expectedAnswer='', sound=null;
  const el=()=>document.getElementById('practice-lab-root');
  function save(){try{localStorage.setItem(KEY,JSON.stringify(stats));}catch(_){}}
  function allWords(){
    if(lang==='zh')return (typeof ZH_TOPICS==='undefined'?[]:ZH_TOPICS).flatMap(t=>(t.words||[]).map(w=>({id:w.id,word:w.hanzi,vi:w.vi,ipa:w.pinyin||'',group:t.title}))).filter(w=>w.word&&w.vi);
    return (typeof TOPICS_DATA==='undefined'?[]:TOPICS_DATA).filter(t=>audience==='all'||typeof TOPIC_AUDIENCE==='undefined'||(TOPIC_AUDIENCE[t.id]||'both')==='both'||TOPIC_AUDIENCE[t.id]===audience).flatMap(t=>t.lessons.flatMap(l=>l.words.map(w=>({id:w.id,word:w.en,vi:w.vi,ipa:w.ipa||'',group:t.title})))).filter(w=>w.word&&w.vi);
  }
  const englishSentences=()=> (typeof TOPICS_DATA==='undefined'?[]:TOPICS_DATA).filter(t=>audience==='all'||typeof TOPIC_AUDIENCE==='undefined'||(TOPIC_AUDIENCE[t.id]||'both')==='both'||TOPIC_AUDIENCE[t.id]===audience).flatMap(t=>t.lessons.flatMap(l=>(l.sentences||[]).map(s=>({parts:s.words,vi:s.vi,full:s.words.join(' ')})))).filter(s=>s.parts?.length>=3);
  const chineseSentences=[
    {parts:['我','学习','汉语'],vi:'Tôi học tiếng Trung.'},{parts:['你','喜欢','喝茶','吗'],vi:'Bạn có thích uống trà không?'},
    {parts:['我','很','喜欢','这个'],vi:'Tôi rất thích cái này.'},{parts:['我','去','学校'],vi:'Tôi đi học.'},
    {parts:['今天','天气','很好'],vi:'Hôm nay thời tiết rất đẹp.'},{parts:['我','想','喝水'],vi:'Tôi muốn uống nước.'},
    {parts:['谢谢','你的','帮助'],vi:'Cảm ơn sự giúp đỡ của bạn.'},{parts:['我们','坐','出租车','吧'],vi:'Chúng ta đi taxi nhé.'},
    {parts:['她','是','老师'],vi:'Cô ấy là giáo viên.'},{parts:['你','叫','什么','名字'],vi:'Bạn tên gì?'}
  ].map(s=>({...s,full:s.parts.join('')}));
  const ui = (text)=>{ const box=el();if(box)box.innerHTML=text;};
  function say(text){ if(sound)try{sound.pause();sound=null;}catch(_){}; try{ window.EngStartPracticeLabSpeaker?.(text,lang); }catch(_){}}
  function button(text,action,classes=''){return `<button type="button" data-lab-action="${action}" class="lab-button ${classes}">${text}</button>`;}
  function top(){ const s=stats[lang],accuracy=s.total?Math.round(s.correct/s.total*100):0; const daily=Object.keys(s.days||{}).length;
    return `<div class="lab-hero"><div><span class="lab-kicker">NGUYỄN THÀNH · HỌC MỖI NGÀY</span><h2>Trò chơi & luyện nghe</h2><p>Luyện chủ động, nhận phản hồi ngay và học qua từ vựng Anh – Trung có sẵn.</p></div><div class="lab-tabs"><button type="button" data-lab-lang="en" class="${lang==='en'?'selected':''}">🇬🇧 Tiếng Anh</button><button type="button" data-lab-lang="zh" class="${lang==='zh'?'selected':''}">🇨🇳 Tiếng Trung</button></div></div>
    <div class="lab-metrics"><div><b>${s.played}</b><small>Lượt đã hoàn thành</small></div><div><b>${accuracy}%</b><small>Đáp án đúng</small></div><div><b>${daily}</b><small>Ngày đã luyện</small></div></div>`; }
  function recentDays(){
    const today=new Date();const days=[];
    for(let i=6;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i);const key=d.toLocaleDateString('en-CA');const n=Number(stats[lang].days[key]||0);days.push({label:['CN','T2','T3','T4','T5','T6','T7'][d.getDay()],n});}
    const max=Math.max(1,...days.map(x=>x.n));
    return `<div class="lab-week"><div><strong>Hoạt động 7 ngày gần đây</strong><p>Lượt hoàn thành theo ngày, lưu trên thiết bị này.</p></div><div class="lab-week-bars">${days.map(x=>`<div title="${x.n} lượt"><span>${x.n||''}</span><i style="height:${Math.max(8,Math.round(x.n/max*48))}px;opacity:${x.n?1:.23}"></i><small>${x.label}</small></div>`).join('')}</div></div>`;
  }
  function home(){ game=null;position=0;correct=0;selected=null;matches=[];
    const count=allWords().length;
    ui(`${top()}<div class="lab-filter"><div><strong>Kho bài tập</strong> <span>${count} từ đang có</span></div>${lang==='en'?`<div class="lab-pills"><button data-lab-audience="all" class="${audience==='all'?'active':''}">Tất cả</button><button data-lab-audience="kids" class="${audience==='kids'?'active':''}">Trẻ em</button><button data-lab-audience="adult" class="${audience==='adult'?'active':''}">Người lớn</button></div>`:'<span>Tiếng Trung HSK · bài cơ bản</span>'}</div>
    <div class="lab-grid">
    ${tile('quiz','🧠','Trắc nghiệm','Chọn đúng nghĩa tiếng Việt của từ, nhận kết quả ngay.','Bắt đầu trắc nghiệm','pink')}
    ${tile('match','🔗','Nối từ','Ghép 5 từ với nghĩa tương ứng, luyện trí nhớ.','Chơi nối từ','blue')}
    ${tile('dictation','🎧','Nghe & chép chính tả','Nghe từ rồi gõ lại chính xác; có nút nghe chậm.','Bắt đầu nghe–chép','gold')}
    ${tile('order','🧩','Xếp câu','Sắp xếp các mảnh từ thành câu hoàn chỉnh.','Bắt đầu xếp câu','green')}
    </div>${recentDays()}<div class="lab-footer"><strong>Tiếp tục luyện kỹ năng</strong><p>Phát âm IPA, học video, hội thoại và Cô giáo AI của web vẫn giữ nguyên.</p><div class="lab-shortcuts"><button data-main-nav="pronunciation">Phát âm IPA →</button><button data-main-nav="videos">Học qua video →</button><button data-main-nav="tutor">Cô giáo AI →</button></div></div>`);
  }
  function tile(id,emoji,name,desc,cta,color){return `<article class="lab-tile lab-${color}"><div class="lab-emoji">${emoji}</div><h3>${name}</h3><p>${desc}</p>${button(cta,'start:'+id,'lab-start')}</article>`;}
  function start(kind){
    const words=shuffle(allWords());
    if(!words.length){ui(`${top()}<div class="lab-panel">Chưa có dữ liệu từ vựng trong danh mục này. ${button('Quay lại','home')}</div>`);return;}
    game=kind;position=0;correct=0;hasAnswered=false;matches=[];selected=null;
    if(kind==='match'){ data=shuffle(words).slice(0,15); if(data.length<5){home();return;} data=data.slice(0,Math.floor(data.length/5)*5); }
    else if(kind==='order'){data=shuffle(lang==='zh'?chineseSentences:englishSentences()).slice(0,8);}
    else data=words.slice(0,Math.min(10,words.length));
    if(!data.length){home();return;}
    draw();
  }
  function layout(content){const total=game==='match'?data.length/5:data.length;ui(`${top()}<div class="lab-play"><div class="lab-playhead"><div><button data-lab-action="home" class="lab-back">← Trò chơi</button> <strong>${({quiz:'Trắc nghiệm',match:'Nối từ',dictation:'Nghe & chép',order:'Xếp câu'})[game]}</strong></div><span>${position+1} / ${total}</span></div><div class="lab-progress"><i style="width:${Math.min(100,100*position/total)}%"></i></div>${content}</div>`);}
  function draw(){hasAnswered=false;expectedAnswer='';
    if(game==='quiz')quiz();else if(game==='match')match();else if(game==='dictation')dictation();else order();
  }
  function quiz(){const item=data[position];const distractors=shuffle(allWords().filter(w=>w.id!==item.id&&tidy(w.vi)!==tidy(item.vi))).map(w=>w.vi);const choices=shuffle([item.vi,...[...new Set(distractors)].slice(0,3)]); expectedAnswer=item.vi;
    layout(`<div class="lab-question"><span>Câu hỏi ${position+1}</span><h3>${escapeHtml(item.word)}</h3><p>${escapeHtml(item.ipa)} · Chọn nghĩa phù hợp</p><button class="lab-listen" data-lab-action="listen">🔊 Nghe từ</button></div><div class="lab-choices">${choices.map((v,i)=>`<button type="button" data-lab-pick="${i}" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}</div><div id="lab-feedback" aria-live="polite"></div>`);
  }
  function dictation(){const item=data[position];expectedAnswer=item.word;
    layout(`<div class="lab-question"><span>Nghe & gõ lại từ ${position+1}</span><h3>🎧 Nghe rồi viết</h3><p>${lang==='zh'?'Gõ chữ Hán tương ứng với âm bạn nghe.':'Nhập đúng từ tiếng Anh vừa nghe.'}</p><button class="lab-listen" data-lab-action="listen">🔊 Phát mẫu</button><button class="lab-listen" data-lab-action="slow">🐢 Nghe chậm</button></div><form id="lab-dictation-form"><label for="lab-type">Câu trả lời của bạn</label><input id="lab-type" autocomplete="off" spellcheck="false" placeholder="${lang==='zh'?'Nhập chữ Hán…':'Type what you hear…'}" required /><button type="submit" class="lab-submit">Kiểm tra đáp án</button></form><div id="lab-feedback" aria-live="polite"></div>`);
  }
  function match(){const group=data.slice(position*5,position*5+5);if(!group.length){finish();return;}
    matches=[];selected=null;expectedAnswer='';const left=shuffle(group),right=shuffle(group);
    layout(`<div class="lab-question"><h3>🔗 Ghép từ với nghĩa</h3><p>Bấm một từ bên trái, sau đó bấm nghĩa đúng bên phải.</p></div><div class="lab-matching"><div>${left.map(w=>`<button type="button" data-lab-match="word" data-id="${escapeHtml(w.id)}">${escapeHtml(w.word)}</button>`).join('')}</div><div>${right.map(w=>`<button type="button" data-lab-match="meaning" data-id="${escapeHtml(w.id)}">${escapeHtml(w.vi)}</button>`).join('')}</div></div><div id="lab-feedback" aria-live="polite">Đã ghép 0/5</div>`);
  }
  function order(){const item=data[position];selected=[];expectedAnswer=item.full;const indices=shuffle(item.parts.map((_,i)=>i));
    layout(`<div class="lab-question"><span>Xếp câu ${position+1}</span><h3>${escapeHtml(item.vi)}</h3><p>Chạm vào các mảnh từ theo đúng thứ tự.</p><button class="lab-listen" data-lab-action="listen">🔊 Nghe câu</button></div><div class="lab-order-picked" id="lab-order-picked">Chọn từ bên dưới…</div><div class="lab-order-pool">${indices.map(i=>`<button type="button" data-lab-part="${i}">${escapeHtml(item.parts[i])}</button>`).join('')}</div><div class="lab-controls"><button data-lab-action="undo">↩ Làm lại</button><button class="lab-submit" data-lab-action="check-order">Kiểm tra câu</button></div><div id="lab-feedback" aria-live="polite"></div>`);
  }
  function respond(ok){if(hasAnswered)return;hasAnswered=true;if(ok)correct++;
    const fb=document.getElementById('lab-feedback'); if(fb)fb.innerHTML=`<div class="lab-result ${ok?'ok':'wrong'}"><b>${ok?'✓ Chính xác!':'Cần luyện thêm'}</b><p>Đáp án: <strong>${escapeHtml(expectedAnswer)}</strong></p><button type="button" data-lab-action="next">${position+1>=data.length?'Xem kết quả':'Câu tiếp theo →'}</button></div>`;
    document.querySelectorAll('[data-lab-pick]').forEach(b=>{b.disabled=true;b.classList.toggle('correct',tidy(b.dataset.value)===tidy(expectedAnswer));});
    const submit=document.querySelector('#lab-dictation-form button[type=submit]');if(submit)submit.disabled=true;
  }
  function next(){position++;if(position>=data.length)finish();else draw();}
  function finish(){const number=game==='match'?data.length:data.length; stats[lang].played++;stats[lang].correct+=correct;stats[lang].total+=number;const today=new Date().toLocaleDateString('en-CA');stats[lang].days[today]=(stats[lang].days[today]||0)+1;save();
    game=null;ui(`${top()}<div class="lab-finish"><span>🏆</span><h3>Hoàn thành bài luyện!</h3><div><b>${correct}/${number}</b> đáp án đúng</div><p>${correct===number?'Xuất sắc! Bạn đã trả lời đúng tất cả.':'Bạn có thể chơi lại để ghi nhớ các từ tốt hơn.'}</p>${button('Chơi lại','restart','lab-submit')} ${button('Chọn trò chơi khác','home')}</div>`);
  }
  function handleMatch(btn){if(!game||game!=='match')return;const id=btn.dataset.id,side=btn.dataset.labMatch;if(matches.includes(id))return;
    if(side==='word'){document.querySelectorAll('[data-lab-match=word]').forEach(b=>b.classList.remove('selected'));selected=id;btn.classList.add('selected');return;}
    if(!selected)return;
    if(id===selected){matches.push(id);correct++;document.querySelectorAll(`[data-lab-match][data-id="${id}"]`).forEach(b=>{b.disabled=true;b.classList.add('matched');});}else{btn.classList.add('miss');setTimeout(()=>btn.classList.remove('miss'),500);}
    selected=null;document.querySelectorAll('[data-lab-match=word]').forEach(b=>b.classList.remove('selected'));
    const fb=document.getElementById('lab-feedback');if(fb)fb.textContent=`Đã ghép ${matches.length}/5`;
    if(matches.length>=5){hasAnswered=true;if(fb)fb.innerHTML=`<div class="lab-result ok"><b>✓ Đã nối đủ 5 cặp!</b><button data-lab-action="next-group">${(position+1)*5>=data.length?'Xem kết quả':'Nhóm tiếp theo →'}</button></div>`;}
  }
  function listen(){if(game==='order')say(data[position].full);else if(game==='match')return;else say(data[position].word);}
  const onClick=e=>{
    if(!el()||el().closest('.hidden'))return;
    const l=e.target.closest('[data-lab-lang]');if(l){lang=l.dataset.labLang;home();return;}
    const a=e.target.closest('[data-lab-audience]');if(a){audience=a.dataset.labAudience;home();return;}
    const matchBtn=e.target.closest('[data-lab-match]');if(matchBtn){handleMatch(matchBtn);return;}
    const p=e.target.closest('[data-lab-pick]');if(p){respond(tidy(p.dataset.value)===tidy(expectedAnswer));return;}
    const part=e.target.closest('[data-lab-part]');if(part&&game==='order'&&!hasAnswered){const i=Number(part.dataset.labPart);if(selected.includes(i))return;selected.push(i);part.disabled=true;part.classList.add('matched');const holder=document.getElementById('lab-order-picked');holder.innerHTML=selected.map(i=>`<span>${escapeHtml(data[position].parts[i])}</span>`).join(' ');return;}
    const action=e.target.closest('[data-lab-action]')?.dataset.labAction;if(!action)return;
    if(action==='home')home();else if(action.startsWith('start:'))start(action.split(':')[1]);else if(action==='restart')start(lastGame||'quiz');
    else if(action==='listen')listen();else if(action==='slow'){const item=data[position];if(window.EngStartPracticeLabSpeaker)window.EngStartPracticeLabSpeaker(item.word,lang,.7);}
    else if(action==='next')next();else if(action==='next-group'){position++;if((position*5)>=data.length)finish();else draw();}
    else if(action==='undo'&&game==='order')order();
    else if(action==='check-order'&&game==='order'&&!hasAnswered){if(selected.length!==data[position].parts.length){const fb=document.getElementById('lab-feedback');if(fb)fb.textContent='Hãy chọn đủ các từ trước khi kiểm tra.';return;} const entered=lang==='zh'?selected.map(i=>data[position].parts[i]).join(''):selected.map(i=>data[position].parts[i]).join(' ');respond(tidy(entered)===tidy(expectedAnswer));}
  };
  let lastGame='quiz';
  document.addEventListener('click',e=>{const startBtn=e.target.closest('[data-lab-action^="start:"]');if(startBtn)lastGame=startBtn.dataset.labAction.split(':')[1];onClick(e);});
  document.addEventListener('submit',e=>{if(e.target.id!=='lab-dictation-form'||game!=='dictation'||hasAnswered)return;e.preventDefault();respond(tidy(document.getElementById('lab-type').value)===tidy(expectedAnswer));});
  window.EngStartPracticeLab={render:home};
})();
