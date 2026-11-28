/* Welcome v43: standalone public demo, using the existing app's Supabase client.
   Does not change progress, credentials, study modules or cloud sync. */
(() => {
  'use strict';
  const root = document.getElementById('nt-welcome');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const samples = {
    en: [
      {kind:'Điền từ còn thiếu',question:'I ___ learning English.',hint:'Tôi thích học tiếng Anh.',options:['like','likes','am','have'],correct:0,spoken:'I like learning English.',explain:'I like learning English. — Sau “I”, dùng động từ “like”.'},
      {kind:'Chọn nghĩa đúng',question:'Good morning!',hint:'Lời chào thường dùng vào buổi sáng.',options:['Chúc ngủ ngon','Chào buổi sáng','Cảm ơn bạn','Hẹn gặp lại'],correct:1,spoken:'Good morning!',explain:'Good morning! — Chào buổi sáng!'},
      {kind:'Hoàn thành câu',question:'How ___ you?',hint:'Bạn khỏe không?',options:['is','be','are','do'],correct:2,spoken:'How are you?',explain:'How are you? — Với “you”, dùng “are”.'}
    ],
    zh: [
      {kind:'Chọn nghĩa đúng',question:'你好！',hint:'Nǐ hǎo!',options:['Cảm ơn','Xin chào','Tạm biệt','Xin lỗi'],correct:1,spoken:'你好！',explain:'你好 (nǐ hǎo) — Xin chào!'},
      {kind:'Điền từ còn thiếu',question:'我 ___ 学中文。',hint:'Wǒ ___ xué Zhōngwén. · Tôi thích học tiếng Trung.',options:['喜欢','谢谢','再见','什么'],correct:0,spoken:'我喜欢学中文。',explain:'喜欢 (xǐhuan) có nghĩa là thích.'},
      {kind:'Chọn lời đáp',question:'谢谢！',hint:'Xièxie! · Cảm ơn!',options:['你好','晚安','不客气','对不起'],correct:2,spoken:'不客气！',explain:'不客气 (bú kèqi) — Không có gì.'}
    ]
  };
  let language='en', step=0, solved=false, misses=0, complete=false;
  const body=$('nt-demo-body'), next=$('nt-demo-next'), progress=$('nt-demo-progress');
  const node=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
  const button=(cls,txt,handler)=>{const b=node('button',cls,txt);b.type='button';b.addEventListener('click',handler);return b;};
  let demoUtterance=null;
  function stopDemoAudio(){if(demoUtterance&&window.speechSynthesis){window.speechSynthesis.cancel();demoUtterance=null;}}
  function resetDemo(lang){stopDemoAudio();language=lang;step=0;solved=false;misses=0;complete=false;root.querySelectorAll('[data-nt-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ntLang===lang)));renderDemo();}
  function renderDemo(){
    body.replaceChildren();
    const total=samples[language].length;
    $('nt-demo-level').textContent=(language==='en'?'Tiếng Anh':'Tiếng Trung')+' · Cơ bản';
    $('nt-demo-count').textContent=complete?'Hoàn thành':`${step+1} / ${total}`;
    const done=complete?total:step+(solved?1:0);
    progress.setAttribute('aria-valuenow',String(done));progress.firstElementChild.style.width=`${done/total*100}%`;
    next.disabled=!solved;next.hidden=complete;next.textContent=step===total-1?'Hoàn thành ✓':'Tiếp theo →';
    if(complete){
      const end=node('div','nt-complete');end.append(node('b','','✓'),node('h3','','Bạn đã hoàn thành bài thử!'),node('p','',misses===0?'3/3 câu chính xác ngay lần đầu. Hãy tiếp tục duy trì thói quen này!':'Bạn đã tự sửa và hoàn thành cả 3 câu. Hãy tiếp tục luyện tập!'));
      end.append(button('nt-btn nt-secondary','Học lại',()=>resetDemo(language)),button('nt-btn nt-primary','Bắt đầu học →',()=>openAuth('register')));body.append(end);return;
    }
    const q=samples[language][step];
    const question=node('h3','nt-demo-question',q.question);question.lang=language==='en'?'en':'zh-CN';
    body.append(node('p','nt-demo-kicker',q.kind),question,node('p','nt-demo-hint',q.hint));
    const audio=button('nt-sample-audio','🔊 Nghe mẫu',()=>{
      if(!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined'){feedback.textContent='Thiết bị chưa hỗ trợ giọng đọc. Bạn vẫn có thể làm bài.';return;}
      const voices=window.speechSynthesis.getVoices();const lang=language==='en'?'en':'zh';const voice=voices.find(v=>v.lang.toLowerCase().startsWith(lang));
      if(!voice){feedback.textContent='Chưa có giọng đọc phù hợp trên thiết bị. Bạn vẫn có thể làm bài.';return;}
      stopDemoAudio();demoUtterance=new SpeechSynthesisUtterance(q.spoken);demoUtterance.voice=voice;demoUtterance.lang=voice.lang;demoUtterance.rate=.9;demoUtterance.onerror=()=>{feedback.textContent='Không phát được giọng mẫu. Hãy thử lại.';demoUtterance=null;};demoUtterance.onend=()=>{demoUtterance=null;};window.speechSynthesis.speak(demoUtterance);
    });
    // No full-answer audio until the learner has answered the current question.
    audio.hidden=true;body.append(audio);
    const options=node('div','nt-options');options.setAttribute('role','group');options.setAttribute('aria-label','Chọn đáp án');
    const feedback=node('div','nt-feedback','Chọn một đáp án để kiểm tra.');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    q.options.forEach((opt,i)=>{const b=button('nt-option',opt,()=>{if(solved)return;options.querySelectorAll('button').forEach(x=>x.classList.remove('is-wrong'));if(i!==q.correct){misses++;b.classList.add('is-wrong');feedback.className='nt-feedback bad';feedback.textContent='Chưa đúng, thử một đáp án khác nhé.';return;}solved=true;b.classList.add('is-correct');options.querySelectorAll('button').forEach(x=>x.disabled=true);feedback.className='nt-feedback good';feedback.textContent='✓ '+q.explain;audio.hidden=false;next.disabled=false;progress.setAttribute('aria-valuenow',String(step+1));progress.firstElementChild.style.width=`${(step+1)/total*100}%`;next.focus();});options.append(b);});
    body.append(options,feedback);
  }
  next.addEventListener('click',()=>{if(!solved||complete)return;stopDemoAudio();if(step===samples[language].length-1){complete=true;renderDemo();body.querySelector('button')?.focus();}else{step++;solved=false;renderDemo();body.querySelector('button:not([hidden])')?.focus();}});
  root.querySelectorAll('[data-nt-lang]').forEach(b=>b.addEventListener('click',()=>{if(language!==b.dataset.ntLang)resetDemo(b.dataset.ntLang);}));
  renderDemo();

  const dialog=$('nt-auth-dialog'), form=$('nt-auth-form'), email=$('nt-email'), password=$('nt-password'), submit=$('nt-auth-submit'), google=$('nt-google'), status=$('nt-auth-status'), local=$('nt-local');
  let mode='login', busy=false, authKnown=false, authAvailable=false, manuallyLocal=false;
  function getClient(){try{return typeof sbClient!=='undefined'?sbClient:null;}catch{return null;}}
  function setStatus(message,error=false){status.textContent=message;status.classList.toggle('error',error);}
  function setBusy(value){busy=value;submit.disabled=value||!authAvailable;google.disabled=value||!authAvailable;email.disabled=value;password.disabled=value;dialog.querySelectorAll('[data-nt-mode]').forEach(b=>b.disabled=value);$('nt-pass-toggle').disabled=value;submit.textContent=value?'Đang xử lý…':mode==='login'?'Đăng nhập →':'Tạo tài khoản →';}
  function toggleMode(value){mode=value==='register'?'register':'login';$('nt-auth-title').textContent=mode==='login'?'Đăng nhập':'Tạo tài khoản';$('nt-auth-intro').textContent=mode==='login'?'Tiếp tục hành trình học của bạn.':'Tạo tài khoản để lưu tiến độ học tập.';password.autocomplete=mode==='login'?'current-password':'new-password';dialog.querySelectorAll('[data-nt-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ntMode===mode)));setBusy(false);setStatus(authKnown&&!authAvailable?'Chưa kết nối được hệ thống đăng nhập.':!authKnown?'Đang kiểm tra kết nối…':'',authKnown&&!authAvailable);}
  function resetPassword(){password.value='';password.type='password';$('nt-pass-toggle').textContent='Hiện';$('nt-pass-toggle').setAttribute('aria-label','Hiện mật khẩu');}
  function openAuth(value){stopDemoAudio();if(!busy)toggleMode(value);if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}email.focus();}
  root.addEventListener('click',e=>{const auth=e.target.closest('[data-nt-auth]');if(auth){openAuth(auth.dataset.ntAuth);return;}const tab=e.target.closest('[data-nt-mode]');if(tab&&!busy){toggleMode(tab.dataset.ntMode);return;}if(e.target.closest('[data-nt-close]')){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}});
  dialog.addEventListener('close',resetPassword);
  dialog.addEventListener('cancel',()=>{resetPassword();});
  $('nt-pass-toggle').addEventListener('click',()=>{const show=password.type==='password';password.type=show?'text':'password';$('nt-pass-toggle').textContent=show?'Ẩn':'Hiện';$('nt-pass-toggle').setAttribute('aria-label',show?'Ẩn mật khẩu':'Hiện mật khẩu');});
  function displayLanding(show){document.body.classList.toggle('nt-welcome-active',show);if(!show){stopDemoAudio();if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}resetPassword();}if(show)window.scrollTo(0,0);}
  function friendlyError(error){const message=String(error?.message||'');if(/invalid login credentials/i.test(message))return 'Email hoặc mật khẩu chưa đúng.';if(/email not confirmed/i.test(message))return 'Bạn cần xác nhận email trước khi đăng nhập.';if(/rate limit|too many/i.test(message))return 'Bạn thao tác quá nhiều lần. Hãy thử lại sau.';if(/already registered|already exists/i.test(message))return 'Email này đã có tài khoản. Hãy chuyển sang đăng nhập.';if(/password.*(weak|short|least)/i.test(message))return 'Mật khẩu chưa đáp ứng yêu cầu của hệ thống.';if(/fetch|network|timeout/i.test(message))return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';return 'Không thể hoàn tất. Hãy kiểm tra thông tin hoặc thử lại sau.';}
  const redirect=()=>window.location.origin+window.location.pathname;
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!form.reportValidity())return;const client=getClient();if(!client||!authAvailable){setStatus('Hệ thống đăng nhập chưa sẵn sàng.',true);return;}const chosen=mode;const credentials={email:email.value.trim(),password:password.value};setBusy(true);setStatus('Đang kết nối…');try{const result=chosen==='login'?await client.auth.signInWithPassword(credentials):await client.auth.signUp({...credentials,options:{emailRedirectTo:redirect()}});if(result.error)throw result.error;if(result.data?.session?.user){displayLanding(false);}else if(chosen==='register'){setStatus('Nếu cần xác nhận tài khoản, hãy kiểm tra email (kể cả thư rác), sau đó đăng nhập.');}else{setStatus('Chưa nhận được phiên đăng nhập. Hãy thử lại.',true);}resetPassword();}catch(err){setStatus(friendlyError(err),true);}finally{setBusy(false);}});
  google.addEventListener('click',async()=>{const client=getClient();if(busy||!client||!authAvailable)return;setBusy(true);setStatus('Đang mở đăng nhập Google…');try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect()}});if(error)throw error;setStatus('Nếu trình duyệt chưa chuyển trang, hãy thử lại.');}catch(err){setStatus(friendlyError(err),true);}finally{setBusy(false);}});
  // Preserve the archive's local-only mode solely when no Supabase config exists.
  local.addEventListener('click',()=>{if(authAvailable||!authKnown||local.hidden)return;manuallyLocal=true;displayLanding(false);});
  function applySession(session){if(session?.user){manuallyLocal=false;displayLanding(false);}else if(!manuallyLocal){displayLanding(true);}}
  async function connect(){const client=getClient();authKnown=true;authAvailable=!!client;local.hidden=!!(window.ENGSTART_CONFIG?.SUPABASE_URL&&window.ENGSTART_CONFIG?.SUPABASE_ANON_KEY)||authAvailable;setBusy(false);if(!client){setStatus('Chưa kết nối hệ thống đăng nhập. Bạn vẫn có thể học thử.',true);return;}
    setStatus('');
    let revision=0;
    client.auth.onAuthStateChange((event,session)=>{revision++;if(event==='SIGNED_OUT')manuallyLocal=false;applySession(session);});
    const requested=revision;
    try{const {data,error}=await client.auth.getSession();if(error)throw error;if(revision===requested)applySession(data?.session);}catch{if(revision===requested)setStatus('Không kiểm tra được phiên đăng nhập. Hãy thử đăng nhập lại.',true);}
  }
  setBusy(false);
  // The app registers its auth initialization on window's DOMContentLoaded.
  // Schedule our connection afterward so that the existing client has been created.
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(connect,0),{once:true});else setTimeout(connect,0);
})();
