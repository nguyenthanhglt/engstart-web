// ==================== PERSISTED STATE ====================
    const STORAGE_KEY = 'engstart_pro_v3';
    const TODAY_STR = () => new Date().toISOString().slice(0, 10);
    const DAY_MS = 24 * 60 * 60 * 1000;

    const DEFAULT_STATE = {
      mainNav: 'typing',
      activeTrack: 'vocab',
      selectedTopicId: 'greeting',
      selectedDialogueId: 'd1',
      speechRate: 1.0,
      xp: 0,
      // Daily Streak & Goal
      streak: 0,
      lastStudyDate: null,
      todayDate: TODAY_STR(),
      todayXp: 0,
      dailyGoalXp: 50,
      // Progress
      lessonProgress: {},  // { [lessonId]: { cards, exercise, dictation, builder, speaking } }
      srsData: {},         // { [wordId]: { box: 0..4, intervalDays: 0..14, nextReview: ms } }
      completedDialogues: [],
      completedGrammar: [],
      bankLearnedIds: [],
      bankDailySize: 15,
      customBankWords: [],
      geminiApiKey: "",
      zhLearnedIds: [],
      zhLessonProgress: {},
      zhBankLearnedIds: [],
      zhCustomBankWords: [],
      masteredIpa: [],
      notebook: '',
      // Account & Cloud Sync
      profile: { name: '', email: '', customAvatar: '' },
      supabase: { url: '', key: '', lastSynced: null }
    };

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
        const p = JSON.parse(raw);
        const merged = {
          ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
          ...p,
          lessonProgress: p.lessonProgress && typeof p.lessonProgress === 'object' ? p.lessonProgress : {},
          srsData: p.srsData && typeof p.srsData === 'object' ? p.srsData : {},
          completedDialogues: Array.isArray(p.completedDialogues) ? p.completedDialogues : [],
          completedGrammar: Array.isArray(p.completedGrammar) ? p.completedGrammar : [],
          masteredIpa: Array.isArray(p.masteredIpa) ? p.masteredIpa : [],
          profile: p.profile && typeof p.profile === 'object' ? p.profile : { name: '', email: '' },
          supabase: p.supabase && typeof p.supabase === 'object' ? p.supabase : { url: '', key: '', lastSynced: null }
        };
        if (merged.todayDate !== TODAY_STR()) {
          merged.todayDate = TODAY_STR();
          merged.todayXp = 0;
        }
        return merged;
      } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    }

    let state = loadState();

    let sbClient = null;
    let currentAuthUser = null;
    let cloudSyncStatus = 'local'; // 'local' | 'saving' | 'synced' | 'error'
    let cloudSaveTimer = null;

    function initSupabaseClient() {
      try {
        const cfg = window.ENGSTART_CONFIG || {};
        if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase && typeof window.supabase.createClient === 'function') {
          sbClient = window.supabase.createClient(cfg.SUPABASE_URL.trim(), cfg.SUPABASE_ANON_KEY.trim());
        }
      } catch (e) {
        sbClient = null;
      }
    }

    function scheduleCloudSave() {
      if (!sbClient || !currentAuthUser) return;
      cloudSyncStatus = 'saving';
      if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(async () => {
        await pushProgressToCloud(true);
      }, 1200);
    }

    function saveState(skipCloud) {
      state.updatedAt = Date.now();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
      if (!skipCloud) scheduleCloudSave();
    }

    // Transient UI State
    let ui = {
      zenMode: false,
      audienceFilter: 'all',
      bankDay: 1,
      bankViewMode: 'day',
      bankFilter: 'all',
      bankSearch: '',
      bankPage: 1,
      aiLang: 'en',
      aiScenarioId: 'intro',
      aiTurnIdx: 0,
      aiMessages: [],
      aiLoading: false,
      aiAutoSpeak: true,
      aiShowVi: true,
      aiInput: '',
      zhTrack: 'vocab',
      zhTopicId: 'zh_greet',
      zhGrammarId: 'zhg1',
      bankLang: 'en',
      zhMode: 'list',
      zhCardIdx: 0,
      zhFlipped: false,
      zhShowPinyin: true,
      zhQuizItems: [],
      zhQuizIdx: 0,
      zhQuizPicked: null,
      zhQuizScore: 0,
      zhQuizDone: false,
      selectedGrammarId: GRAMMAR_LESSONS[0].id,
      grammarAnswers: {},
      ipaCategory: 'all',
      selectedIpaId: IPA_DATA[0].id,
      // Dialogue state
      dialogueShowVi: true,
      dialogueRoleplay: false,
      dialoguePlayingIdx: -1,
      dialogueSpeechResult: {}, // { lineIdx: { transcript, score } }
      // Speech recognition state
      isListening: false,
      activeRecognition: null,
      // Active study session
      session: null
    };

    // ==================== CORE UTILITIES ====================
    let toastTimer = null;
    function showToast(msg) {
      const toast = document.getElementById('toast');
      const msgEl = document.getElementById('toast-msg');
      if (!toast || !msgEl) return;
      msgEl.textContent = msg;
      toast.classList.remove('opacity-0', 'translate-y-3');
      toast.classList.add('opacity-100', 'translate-y-0');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-3');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 2600);
    }


    // ==================== BULLETPROOF MANDARIN CHINESE AUDIO (NATIVE VOICE + ONLINE FALLBACK) ====================
    let _zhAudioEl = null;
    function playChineseAudioFallback(text, rate) {
      try {
        if (_zhAudioEl) { _zhAudioEl.pause(); _zhAudioEl = null; }
        const isHttp = window.location && window.location.protocol.startsWith('http');
        const primaryUrl = isHttp
          ? `/api/tts?lang=zh-CN&text=${encodeURIComponent(text.slice(0, 160))}`
          : `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text.slice(0, 80))}&le=zh`;
        const audio = new Audio(primaryUrl);
        audio.playbackRate = Math.max(0.65, Math.min(1.2, rate || 1.0));
        _zhAudioEl = audio;
        audio.play().catch(() => {
          const backup = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text.slice(0, 80))}&le=zh`);
          _zhAudioEl = backup;
          backup.play().catch(() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(text);
              u.lang = 'zh-CN';
              u.rate = rate || state.speechRate || 0.92;
              window.speechSynthesis.speak(u);
            }
          });
        });
      } catch (e) {}
    }

    function speakChinese(text, customRate) {
      const clean = (text || '').trim();
      if (!clean) return;
      const rate = customRate || (state.speechRate === 0.7 ? 0.75 : 0.96);
      const isHttp = typeof window !== 'undefined' && window.location && /^https?:$/.test(window.location.protocol);
      if (isHttp) {
        playChineseAudioFallback(clean, rate);
        return;
      }
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices() || [];
        const zhVoice = voices.find(v => /^zh[-_]?(cn|hans|sg)/i.test(v.lang))
          || voices.find(v => /^zh/i.test(v.lang))
          || voices.find(v => /chinese|mandarin|putonghua|ting-ting|xiaoxiao/i.test(v.name));
        if (zhVoice) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(clean);
          u.voice = zhVoice;
          u.lang = zhVoice.lang || 'zh-CN';
          u.rate = rate;
          u.onerror = () => playChineseAudioFallback(clean, rate);
          window.speechSynthesis.speak(u);
          return;
        }
      }
      playChineseAudioFallback(clean, rate);
    }

    function speakText(text, customRate, pitch, onEnd) {
      const rate = typeof customRate === 'number' ? customRate : state.speechRate;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        showToast('Trình duyệt hiện chưa hỗ trợ đọc âm thanh.');
        if (onEnd) onEnd();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = rate;
        if (typeof pitch === 'number') utter.pitch = pitch;
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                        voices.find(v => v.lang && v.lang.startsWith('en-US')) ||
                        voices.find(v => v.lang && v.lang.startsWith('en'));
        if (enVoice) utter.voice = enVoice;
        if (onEnd) utter.onend = onEnd;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        if (onEnd) onEnd();
      }
    }

    // Speech Recognition (Speech-to-Text)
    function getSpeechRecognitionCtor() {
      return window.SpeechRecognition || window.webkitSpeechRecognition || null;
    }

    function normalizeText(str) {
      return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }

    function scorePronunciation(expected, spoken) {
      const expWords = normalizeText(expected).split(' ').filter(Boolean);
      const spkWords = normalizeText(spoken).split(' ').filter(Boolean);
      if (expWords.length === 0) return { pct: 0, matched: [] };
      const matched = expWords.map(w => ({ word: w, ok: spkWords.includes(w) }));
      const okCount = matched.filter(m => m.ok).length;
      const pct = Math.round((okCount / expWords.length) * 100);
      return { pct, matched };
    }

    function startSpeechCapture(expectedText, onResult) {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        showToast('Trình duyệt này chưa hỗ trợ Micro Speech-to-Text (hãy dùng Chrome hoặc Edge).');
        return;
      }
      if (ui.activeRecognition) {
        try { ui.activeRecognition.stop(); } catch (e) { /* ignore */ }
      }
      try {
        const rec = new Ctor();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        ui.isListening = true;
        ui.activeRecognition = rec;

        rec.onresult = (event) => {
          const transcript = event.results && event.results[0] && event.results[0][0]
            ? event.results[0][0].transcript : '';
          ui.isListening = false;
          ui.activeRecognition = null;
          const evalRes = scorePronunciation(expectedText, transcript);
          onResult({ transcript, ...evalRes });
        };
        rec.onerror = () => {
          ui.isListening = false;
          ui.activeRecognition = null;
          showToast('Chưa nghe rõ giọng nói hoặc chưa cấp quyền Micro. Hãy thử lại!');
          onResult(null);
        };
        rec.onend = () => {
          if (ui.isListening) {
            ui.isListening = false;
            ui.activeRecognition = null;
            onResult(null);
          }
        };
        rec.start();
      } catch (e) {
        ui.isListening = false;
        showToast('Không thể khởi động Micro lúc này.');
        onResult(null);
      }
    }

    function shuffleArray(arr) {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    }

    function refreshIcons() {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    window.EngStartPracticeLabSpeaker = function(text, language, rate) {
      if (language === 'zh') speakChinese(text, rate || 0.9);
      else speakText(text, rate || 0.9);
    };

    // ==================== STREAK, XP & SRS LOGIC ====================
    function recordDailyActivity(xpAmount) {
      const today = TODAY_STR();
      if (state.todayDate !== today) {
        state.todayDate = today;
        state.todayXp = 0;
      }
      state.todayXp += xpAmount;

      if (state.lastStudyDate !== today) {
        if (state.lastStudyDate) {
          const prev = new Date(state.lastStudyDate + 'T00:00:00Z').getTime();
          const curr = new Date(today + 'T00:00:00Z').getTime();
          const diffDays = Math.round((curr - prev) / DAY_MS);
          state.streak = diffDays === 1 ? state.streak + 1 : 1;
        } else {
          state.streak = 1;
        }
        state.lastStudyDate = today;
      }
    }

    function addXp(amount, msg) {
      state.xp += amount;
      recordDailyActivity(amount);
      saveState();
      updateHeader();
      if (msg) showToast(msg);
    }

    // SRS Quality: 0 = Quên (0 ngày / hôm nay), 1 = Khó (1 ngày), 2 = Tốt (3 ngày), 3 = Dễ (7 ngày)
    function updateSrsWord(wordId, quality) {
      const now = Date.now();
      const prev = state.srsData[wordId] || { box: 0, intervalDays: 0, nextReview: now };
      let box = prev.box;
      let intervalDays = 0;
      if (quality === 0) {
        box = 0;
        intervalDays = 0; // Due immediately today
      } else if (quality === 1) {
        box = Math.max(1, box);
        intervalDays = 1;
      } else if (quality === 2) {
        box = Math.min(4, box + 1);
        intervalDays = box >= 3 ? 7 : 3;
      } else {
        box = 4;
        intervalDays = 14;
      }
      state.srsData[wordId] = {
        box,
        intervalDays,
        nextReview: intervalDays === 0 ? now : now + intervalDays * DAY_MS
      };
      saveState();
      updateHeader();
    }

    function getSrsBuckets() {
      const now = Date.now();
      const due = [];
      const learning = [];
      const mastered = [];
      Object.keys(state.srsData).forEach(id => {
        const w = ALL_WORDS.find(x => x.id === id);
        if (!w) return;
        const rec = state.srsData[id];
        if (rec.nextReview <= now || rec.box === 0) due.push({ ...w, srs: rec });
        else if (rec.box >= 4) mastered.push({ ...w, srs: rec });
        else learning.push({ ...w, srs: rec });
      });
      return { due, learning, mastered };
    }

    function getLessonProg(lessonId) {
      return state.lessonProgress[lessonId] || { cards: false, exercise: false, dictation: false, builder: false, speaking: false };
    }

    function getLessonStars(lessonId) {
      const p = getLessonProg(lessonId);
      let s = 0;
      if (p.cards) s += 3;
      if (p.exercise) s += 3;
      if (p.dictation) s += 1;
      if (p.builder) s += 1;
      if (p.speaking) s += 2;
      return s; // max 10 stars
    }

    function isLessonPassed(lessonId) {
      const p = getLessonProg(lessonId);
      return Boolean(p.cards && p.exercise);
    }

    function getTopicStats(topic) {
      const totalLessons = topic.lessons.length;
      const doneLessons = topic.lessons.filter(l => isLessonPassed(l.id)).length;
      const stars = topic.lessons.reduce((acc, l) => acc + getLessonStars(l.id), 0);
      const maxStars = totalLessons * 10;
      return { totalLessons, doneLessons, stars, maxStars };
    }

    function getTotalStars() {
      let total = 0;
      TOPICS_DATA.forEach(t => { total += getTopicStats(t).stars; });
      total += state.completedDialogues.length * 3;
      total += state.completedGrammar.length * 5;
      total += state.masteredIpa.length;
      return total;
    }

    function markLessonStep(lessonId, stepKey, xpAmount, msg) {
      if (!state.lessonProgress[lessonId]) {
        state.lessonProgress[lessonId] = { cards: false, exercise: false, dictation: false, builder: false, speaking: false };
      }
      const already = state.lessonProgress[lessonId][stepKey];
      state.lessonProgress[lessonId][stepKey] = true;
      if (!already && xpAmount) {
        state.xp += xpAmount;
        recordDailyActivity(xpAmount);
      }
      saveState();
      updateHeader();
      if (msg) showToast(msg);
    }

    function setZenMode(on) {
      ui.zenMode = Boolean(on);
      document.body.classList.toggle('zen-mode', ui.zenMode);
    }

    // ==================== HEADER ====================
    function updateHeader() {
      const xpEl = document.getElementById('header-xp');
      const starEl = document.getElementById('header-stars');
      const streakEl = document.getElementById('header-streak');
      const speedEl = document.getElementById('speed-label');
      const badgeEl = document.getElementById('nav-review-badge');
      const userEl = document.getElementById('header-user-label');
      const goalEl = document.getElementById('daily-goal-pill');

      if (xpEl) xpEl.textContent = state.xp;
      if (starEl) starEl.textContent = getTotalStars();
      if (streakEl) streakEl.textContent = state.streak;
      if (speedEl) speedEl.textContent = state.speechRate === 1.0 ? '1.0x' : '0.7x';
      const avatarEl = document.getElementById('header-user-avatar');
      const iconEl = document.getElementById('header-user-icon');
      const customAvatar = (state.profile && state.profile.customAvatar) || '';
      const googleAvatar = (currentAuthUser && currentAuthUser.user_metadata && currentAuthUser.user_metadata.avatar_url) || '';
      const effectiveAvatar = customAvatar || googleAvatar;
      const customName = (state.profile && state.profile.name && state.profile.name.trim()) || '';

      if (currentAuthUser) {
        const meta = currentAuthUser.user_metadata || {};
        const displayName = customName || meta.full_name || meta.name || (currentAuthUser.email ? currentAuthUser.email.split('@')[0] : 'Học viên');
        if (userEl) userEl.textContent = displayName;
      } else {
        if (userEl) userEl.textContent = customName || 'Đăng nhập';
      }

      if (avatarEl && effectiveAvatar) {
        avatarEl.src = effectiveAvatar;
        avatarEl.classList.remove('hidden');
        if (iconEl) iconEl.classList.add('hidden');
      } else {
        if (avatarEl) avatarEl.classList.add('hidden');
        if (iconEl) iconEl.classList.remove('hidden');
      }
      if (goalEl) {
        const done = state.todayXp >= state.dailyGoalXp;
        goalEl.textContent = done
          ? `Đạt mục tiêu ngày (${state.todayXp}/${state.dailyGoalXp} XP)`
          : `Mục tiêu hôm nay: ${state.todayXp}/${state.dailyGoalXp} XP`;
      }

      const { due } = getSrsBuckets();
      if (badgeEl) {
        if (due.length > 0) {
          badgeEl.textContent = due.length;
          badgeEl.classList.remove('hidden');
        } else {
          badgeEl.classList.add('hidden');
        }
      }

      document.querySelectorAll('.main-nav-btn').forEach(btn => {
        const active = !ui.session && btn.dataset.mainNav === state.mainNav;
        btn.classList.toggle('aio-nav-active', active);
        btn.classList.toggle('text-slate-700', !active);
      });
      const activeLang = (state.mainNav === 'chinese' || (state.mainNav === 'typing' && ui.typingLang === 'zh') || (state.mainNav === 'bank' && ui.bankLang === 'zh') || (state.mainNav === 'tutor' && ui.aiLang === 'zh') || (state.mainNav === 'dictionary' && ui.dictLang === 'zh')) ? 'zh' : 'en';
      document.querySelectorAll('.global-lang-btn').forEach(btn => {
        const isOn = btn.dataset.globalLang === activeLang;
        btn.classList.toggle('bg-white', isOn);
        btn.classList.toggle('shadow-2xs', isOn);
        btn.classList.toggle('text-sky-700', isOn && activeLang === 'en');
        btn.classList.toggle('text-rose-600', isOn && activeLang === 'zh');
        btn.classList.toggle('text-slate-600', !isOn);
      });
    }

    // ==================== NAVIGATION ====================
    function showMainPage(navName) {
      if (navName !== 'videos' && window.EngVideo36) window.EngVideo36.leave();
      if (state.mainNav === 'bank') window.EngStartVocabulary?.leave();
      if (state.mainNav === 'dictionary' && navName !== 'dictionary') window.EngStartDictionary?.leave();
      stopIpaAudio(); stopIpaPracticeRecording();
      ui.session = null;
      setZenMode(false);
      state.mainNav = navName;
      if (navName === 'ipa') state.activeTrack = 'ipa';
      saveState();

      document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
      if (navName === 'home') {
        document.getElementById('page-home').classList.remove('hidden');
        renderHomePage();
      } else if (navName === 'exercises') {
        document.getElementById('page-exercises').classList.remove('hidden');
        renderExercisesPage();
      } else if (navName === 'grammar') {
        document.getElementById('page-grammar').classList.remove('hidden');
        renderAioGrammarPage();
      } else if (navName === 'reading') {
        document.getElementById('page-reading').classList.remove('hidden');
        renderAioReadingPage();
      } else if (navName === 'pronunciation') {
        document.getElementById('page-pronunciation').classList.remove('hidden');
        renderAioPronunciationPage();
      } else if (navName === 'practice-lab') {
        document.getElementById('page-practice-lab').classList.remove('hidden');
        if (window.EngStartPracticeLab) window.EngStartPracticeLab.render();
      } else if (navName === 'dictionary') {
        document.getElementById('page-dictionary').classList.remove('hidden');
        renderAioDictionaryPage();
      } else if (navName === 'typing') {
        document.getElementById('page-typing').classList.remove('hidden');
        renderTypingPage();
      } else if (navName === 'review') {
        document.getElementById('page-review').classList.remove('hidden');
        renderReviewPage();
      } else if (navName === 'bank') {
        document.getElementById('page-bank').classList.remove('hidden');
        renderBankPage();
      } else if (navName === 'tutor') {
        document.getElementById('page-tutor').classList.remove('hidden');
        renderAiTutorPage();
      } else if (navName === 'chinese') {
        document.getElementById('page-chinese').classList.remove('hidden');
        renderChinesePage();
      } else if (navName === 'videos') {
        document.getElementById('page-videos').classList.remove('hidden');
        renderVideoStudioPage();
      } else {
        document.getElementById('page-roadmap').classList.remove('hidden');
        renderRoadmapPage();
      }
      updateHeader();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      refreshIcons();
    }

    function switchTrack(trackName) {
      if (state.mainNav === 'bank') window.EngStartVocabulary?.leave();
      if (state.mainNav === 'dictionary') window.EngStartDictionary?.leave();
      stopIpaAudio(); stopIpaPracticeRecording();
      ui.session = null;
      setZenMode(false);
      state.activeTrack = trackName;
      state.mainNav = trackName === 'ipa' ? 'ipa' : 'roadmap';
      saveState();
      document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('page-roadmap').classList.remove('hidden');
      renderRoadmapPage();
      updateHeader();
      refreshIcons();
    }

    // ==================== ROADMAP PAGE ====================
    function renderRoadmapPage() {
      document.querySelectorAll('.track-btn').forEach(btn => {
        const active = btn.dataset.track === state.activeTrack;
        btn.className = `track-btn px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
          active ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`;
      });

      document.getElementById('track-view-vocab').classList.toggle('hidden', state.activeTrack !== 'vocab');
      document.getElementById('track-view-dialogue').classList.toggle('hidden', state.activeTrack !== 'dialogue');
      document.getElementById('track-view-grammar').classList.toggle('hidden', state.activeTrack !== 'grammar');
      document.getElementById('track-view-ipa').classList.toggle('hidden', state.activeTrack !== 'ipa');

      const kicker = document.getElementById('track-kicker');
      const heading = document.getElementById('track-heading');
      const desc = document.getElementById('track-desc');

      if (state.activeTrack === 'vocab') {
        const topic = TOPICS_DATA.find(t => t.id === state.selectedTopicId) || TOPICS_DATA[0];
        if (kicker) kicker.textContent = `LỘ TRÌNH TỪ VỰNG A0–A1 · CHỦ ĐỀ ${topic.num}/24`;
        if (heading) heading.textContent = `${topic.title} (${topic.enTitle})`;
        if (desc) desc.textContent = topic.desc;
        renderVocabRoadmap();
      } else if (state.activeTrack === 'dialogue') {
        if (kicker) kicker.textContent = 'HỘI THOẠI MẪU 2 VAI · LUYỆN PHẢN XẠ NGHE & NÓI';
        if (heading) heading.textContent = '6 Tình Huống Giao Tiếp Đời Sống Cho Người Mới';
        if (desc) desc.textContent = 'Nghe toàn bộ đoạn hội thoại 2 giọng đọc khác nhau, ẩn/hiện dịch tiếng Việt và bật chế độ Đóng vai để tự nói bằng Micro.';
        renderDialogueTrack();
      } else if (state.activeTrack === 'grammar') {
        if (kicker) kicker.textContent = 'LỘ TRÌNH NGỮ PHÁP GỐC · 5 BÀI NỀN TẢNG';
        if (heading) heading.textContent = '5 Điểm Ngữ pháp Cốt lõi Cho Người Mất Gốc';
        if (desc) desc.textContent = 'Giải thích dễ hiểu, không dùng thuật ngữ hàn lâm. Hoàn thành 3 câu hỏi ngắn mỗi bài để nhận 5 ⭐.';
        renderGrammarTrack();
      } else if (state.activeTrack === 'ipa') {
        if (kicker) kicker.textContent = 'LỘ TRÌNH PHÁT ÂM NỀN TẢNG · 16 ÂM CỐT LÕI';
        if (heading) heading.textContent = 'Bảng Phát âm IPA Dễ Nhầm Nhất Cho Người Việt';
        if (desc) desc.textContent = 'Bấm vào từng âm để xem mẹo đặt lưỡi, tránh lỗi sai kinh điển và nghe đọc mẫu tốc độ thường hoặc chậm.';
        renderIpaTrack();
      }
      updateHeader();
      refreshIcons();
    }

    function renderVocabRoadmap() {
      const totalLessons = TOPICS_DATA.reduce((a, t) => a + t.lessons.length, 0);
      const doneLessons = TOPICS_DATA.reduce((a, t) => a + getTopicStats(t).doneLessons, 0);
      const overallPct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

      const sbLessons = document.getElementById('sidebar-total-lessons');
      const sbPct = document.getElementById('sidebar-total-pct');
      const sbBar = document.getElementById('sidebar-total-bar');
      if (sbLessons) sbLessons.textContent = `${doneLessons}/${totalLessons} bài đã hoàn thành`;
      if (sbPct) sbPct.textContent = `${overallPct}%`;
      if (sbBar) sbBar.style.width = `${overallPct}%`;

      document.querySelectorAll('.aud-filter-btn').forEach(btn => {
        const active = btn.dataset.audFilter === ui.audienceFilter;
        btn.className = `aud-filter-btn py-1.5 px-2 rounded-lg transition-all ${active ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`;
      });
      const visibleTopics = TOPICS_DATA.filter(t => {
        if (ui.audienceFilter === 'all') return true;
        const aud = TOPIC_AUDIENCE[t.id] || 'both';
        return aud === 'both' || aud === ui.audienceFilter;
      });
      const listEl = document.getElementById('topic-sidebar-list');
      if (listEl) {
        listEl.innerHTML = visibleTopics.map(t => {
          const active = t.id === state.selectedTopicId;
          const st = getTopicStats(t);
          return `
            <button type="button" data-select-topic="${t.id}" class="w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
              active ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50/70 border-transparent hover:border-indigo-200 hover:bg-indigo-50/40 text-slate-800'
            }">
              <div class="flex items-center gap-2.5 min-w-0">
                <img src="${TOPIC_IMAGES[t.id]}" alt="${t.title}" class="w-10 h-10 rounded-xl object-cover shrink-0 border ${active ? 'border-white/50' : 'border-slate-200'}" />
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-bold truncate">${t.title}</div>
                  <div class="text-[11px] ${active ? 'text-indigo-100' : 'text-slate-500'}">${st.doneLessons}/${st.totalLessons} bài · ${st.stars}/${st.maxStars} ⭐</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 shrink-0 ${active ? 'text-indigo-200' : 'text-slate-300'}"></i>
            </button>
          `;
        }).join('');
      }

      const topic = TOPICS_DATA.find(t => t.id === state.selectedTopicId) || TOPICS_DATA[0];
      const st = getTopicStats(topic);
      const mainEl = document.getElementById('topic-main-panel');
      if (!mainEl) return;

      mainEl.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src="${TOPIC_IMAGES[topic.id]}" alt="${topic.title}" class="w-24 h-18 sm:w-28 sm:h-20 rounded-2xl object-cover border border-indigo-100 shadow-xs shrink-0" />
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-indigo-600">Chủ đề ${topic.num} · ${topic.lessons.reduce((a, l) => a + l.words.length, 0)} từ cơ bản</div>
              <div class="flex items-center gap-3 mt-1 text-xs sm:text-sm font-semibold text-slate-600">
                <span class="flex items-center gap-1"><i data-lucide="book-open" class="w-4 h-4 text-emerald-500"></i> ${st.doneLessons}/${st.totalLessons} bài học</span>
                <span class="flex items-center gap-1"><i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-500"></i> ${st.stars}/${st.maxStars} sao</span>
              </div>
            </div>
          </div>
          <button type="button" data-start-cards="${topic.lessons[0].id}" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors">
            Học thẻ ngay <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-200"><i data-lucide="award" class="w-3.5 h-3.5"></i> Kiểm tra vượt cấp chủ đề</div>
            <h3 class="text-base sm:text-lg font-extrabold">Đã biết một ít chủ đề "${topic.title}"?</h3>
            <p class="text-xs sm:text-sm text-indigo-100">Làm nhanh 6 câu ngắn. Đúng từ <strong>5/6 câu</strong> sẽ hoàn thành ngay toàn bộ các bài của chủ đề này!</p>
          </div>
          <button type="button" data-start-placement="${topic.id}" class="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs">
            Làm bài kiểm tra <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-4">
          ${topic.lessons.map(lesson => {
            const p = getLessonProg(lesson.id);
            const stars = getLessonStars(lesson.id);
            const passed = isLessonPassed(lesson.id);
            return `
              <div class="bg-white rounded-2xl border ${passed ? 'border-emerald-200' : 'border-slate-200/90'} shadow-xs p-5 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}">${lesson.num}</span>
                    <div>
                      <h4 class="font-bold text-slate-900 text-base">${lesson.title}</h4>
                      <div class="text-xs text-slate-500">${lesson.words.length} từ vựng cốt lõi · ${passed ? '<span class="text-emerald-600 font-semibold">Đã qua bài</span>' : '<span class="text-indigo-600 font-semibold">Đang học</span>'}</div>
                    </div>
                  </div>
                  <div class="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold flex items-center gap-1">
                    <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-500"></i> ${stars}/10
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Để qua bài (2 bước chính)</div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" data-start-cards="${lesson.id}" class="p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${p.cards ? 'bg-emerald-50/60 border-emerald-200' : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400'}">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl ${p.cards ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'} flex items-center justify-center shrink-0"><i data-lucide="${p.cards ? 'check' : 'layers'}" class="w-4 h-4"></i></div>
                        <div>
                          <div class="text-sm font-bold text-slate-900">1. Học thẻ Flashcard</div>
                          <div class="text-[11px] text-slate-500">${lesson.words.length} thẻ + SRS (+3 ⭐)</div>
                        </div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
                    </button>

                    <button type="button" data-start-exercise="${lesson.id}" class="p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${p.exercise ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-400'}">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl ${p.exercise ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-indigo-600'} flex items-center justify-center shrink-0"><i data-lucide="${p.exercise ? 'check' : 'list-checks'}" class="w-4 h-4"></i></div>
                        <div>
                          <div class="text-sm font-bold text-slate-900">2. Bài tập trắc nghiệm</div>
                          <div class="text-[11px] text-slate-500">${lesson.words.length} câu chọn &amp; điền (+3 ⭐)</div>
                        </div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Luyện thêm tuỳ chọn (Nghe · Nói · Ghép câu)</div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button type="button" data-start-speaking="${lesson.id}" class="p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${p.speaking ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-400'}">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-lg ${p.speaking ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-rose-200 text-rose-600'} flex items-center justify-center shrink-0"><i data-lucide="mic" class="w-4 h-4"></i></div>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-slate-800 truncate">Luyện nói AI</div>
                          <div class="text-[10px] text-slate-500">Chấm mic (+2 ⭐)</div>
                        </div>
                      </div>
                    </button>

                    <button type="button" data-start-dictation="${lesson.id}" class="p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${p.dictation ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200/80 hover:border-indigo-300'}">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-lg ${p.dictation ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600'} flex items-center justify-center shrink-0"><i data-lucide="headphones" class="w-4 h-4"></i></div>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-slate-800 truncate">Nghe viết</div>
                          <div class="text-[10px] text-slate-500">Dictation (+1 ⭐)</div>
                        </div>
                      </div>
                    </button>

                    <button type="button" data-start-builder="${lesson.id}" class="p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${p.builder ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200/80 hover:border-indigo-300'}">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-lg ${p.builder ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600'} flex items-center justify-center shrink-0"><i data-lucide="puzzle" class="w-4 h-4"></i></div>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-slate-800 truncate">Ghép câu</div>
                          <div class="text-[10px] text-slate-500">Xếp từ (+1 ⭐)</div>
                        </div>
                      </div>
                    </button>

                    <button type="button" data-start-oq-translate="${lesson.id}" class="p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 bg-violet-50/40 border-violet-200/80 hover:border-violet-400">
                      <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-white border border-violet-200 text-violet-600 flex items-center justify-center shrink-0"><i data-lucide="pen-line" class="w-4 h-4"></i></div>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-slate-800 truncate">Dịch &amp; Đặt câu</div>
                          <div class="text-[10px] text-slate-500">OpenQuiz (+10 XP)</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // ==================== 2-ROLE DIALOGUE TRACK ====================
    function renderDialogueTrack() {
      const side = document.getElementById('dialogue-sidebar-list');
      if (side) {
        side.innerHTML = `
          <div class="pb-2 mb-1 border-b border-slate-100 px-1">
            <div class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">6 Hội thoại Đời sống</div>
            <div class="text-xs text-slate-500 mt-0.5">Hoàn thành: ${state.completedDialogues.length}/${DIALOGUES_DATA.length} tình huống</div>
          </div>
          ${DIALOGUES_DATA.map(d => {
            const active = d.id === state.selectedDialogueId;
            const done = state.completedDialogues.includes(d.id);
            return `
              <button type="button" data-select-dialogue="${d.id}" class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                active ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50/70 border-transparent hover:border-indigo-200 text-slate-800'
              }">
                <div class="min-w-0">
                  <div class="text-[11px] font-bold ${active ? 'text-indigo-200' : 'text-indigo-600'}">Hội thoại ${d.num} · ${d.level}</div>
                  <div class="text-sm font-bold truncate mt-0.5">${d.title}</div>
                </div>
                ${done ? `<span class="w-5 h-5 rounded-full ${active ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shrink-0"><i data-lucide="check" class="w-3 h-3"></i></span>` : ''}
              </button>
            `;
          }).join('')}
        `;
      }

      const d = DIALOGUES_DATA.find(x => x.id === state.selectedDialogueId) || DIALOGUES_DATA[0];
      const done = state.completedDialogues.includes(d.id);
      const panel = document.getElementById('dialogue-detail-panel');
      if (!panel) return;

      panel.innerHTML = `
        <div class="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Tình huống ${d.num} · ${d.level}</span>
            <h2 class="text-xl font-extrabold text-slate-900 mt-0.5">${d.title}</h2>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">${d.context}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" id="dialogue-play-all-btn" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i> Nghe cả đoạn (2 vai)
            </button>
            <button type="button" id="dialogue-toggle-vi-btn" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
              ${ui.dialogueShowVi ? 'Ẩn dịch Việt' : 'Hiện dịch Việt'}
            </button>
            <button type="button" id="dialogue-toggle-roleplay-btn" class="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
              ui.dialogueRoleplay ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }">
              <i data-lucide="mic" class="w-3.5 h-3.5"></i> ${ui.dialogueRoleplay ? 'Đang đóng vai Bạn' : 'Đóng vai luyện nói'}
            </button>
          </div>
        </div>

        <div class="space-y-3.5">
          ${d.lines.map((line, idx) => {
            const isUser = line.role === 'B';
            const isPlaying = ui.dialoguePlayingIdx === idx;
            const res = ui.dialogueSpeechResult[`${d.id}_${idx}`];
            return `
              <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 border transition-all ${
                  isPlaying ? 'ring-2 ring-indigo-500 shadow-md ' : ''
                }${isUser ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-200/80'} space-y-2">
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-[11px] font-extrabold uppercase tracking-wider ${isUser ? 'text-indigo-700' : 'text-slate-500'}">${line.name}</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" data-speak-line="${idx}" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600" title="Nghe câu này">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                      </button>
                      ${(ui.dialogueRoleplay && isUser) ? `
                        <button type="button" data-mic-dialogue="${idx}" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1">
                          <i data-lucide="mic" class="w-3 h-3"></i> Đọc câu này
                        </button>
                      ` : ''}
                    </div>
                  </div>
                  <div class="text-sm sm:text-base font-bold text-slate-900">${line.en}</div>
                  ${ui.dialogueShowVi ? `<div class="text-xs text-slate-600">${line.vi}</div>` : ''}
                  ${res ? `
                    <div class="pt-1.5 border-t border-indigo-100 text-xs flex items-center justify-between gap-2">
                      <span class="text-slate-600">Bạn đọc: <em>"${res.transcript}"</em></span>
                      <span class="px-2 py-0.5 rounded-full font-bold ${res.pct >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${res.pct}% khớp</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <span class="text-xs text-slate-500">Mẹo: Nghe 2 lần rồi bật <strong>Đóng vai luyện nói</strong> để phản xạ như giao tiếp thật.</span>
          <button type="button" id="dialogue-complete-btn" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-colors ${
            done ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }">
            ${done ? 'Đã hoàn thành (+3 ⭐)' : 'Đánh dấu đã luyện xong (+3 ⭐)'}
          </button>
        </div>
      `;
    }

    function playFullDialogue(d) {
      let i = 0;
      function next() {
        if (i >= d.lines.length || state.activeTrack !== 'dialogue') {
          ui.dialoguePlayingIdx = -1;
          renderDialogueTrack();
          refreshIcons();
          return;
        }
        ui.dialoguePlayingIdx = i;
        renderDialogueTrack();
        refreshIcons();
        const line = d.lines[i];
        const pitch = line.role === 'A' ? 1.12 : 0.9;
        i += 1;
        speakText(line.en, state.speechRate, pitch, () => {
          setTimeout(next, 450);
        });
      }
      next();
    }

    // ==================== GRAMMAR & IPA TRACKS ====================
    function renderGrammarTrack() {
      const listEl = document.getElementById('grammar-sidebar-list');
      if (listEl) {
        listEl.innerHTML = `
          <div class="pb-2 mb-1 border-b border-slate-100 px-1">
            <div class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">5 Bài Ngữ pháp Gốc</div>
            <div class="text-xs text-slate-500 mt-0.5">Hoàn thành: ${state.completedGrammar.length}/${GRAMMAR_LESSONS.length} bài</div>
          </div>
          ${GRAMMAR_LESSONS.map(l => {
            const active = l.id === ui.selectedGrammarId;
            const done = state.completedGrammar.includes(l.id);
            return `
              <button type="button" data-grammar-id="${l.id}" class="grammar-nav-btn w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50/70 border-transparent hover:border-indigo-200 text-slate-800'}">
                <div class="min-w-0">
                  <div class="text-[11px] font-bold uppercase ${active ? 'text-indigo-200' : 'text-indigo-600'}">${l.number}</div>
                  <div class="text-sm font-bold truncate mt-0.5">${l.title}</div>
                </div>
                <span class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${done ? (active ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-600') : (active ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-400')}"><i data-lucide="${done ? 'check' : 'book-open'}" class="w-3.5 h-3.5"></i></span>
              </button>
            `;
          }).join('')}
        `;
      }

      const lesson = GRAMMAR_LESSONS.find(l => l.id === ui.selectedGrammarId) || GRAMMAR_LESSONS[0];
      const lessonAnswers = ui.grammarAnswers[lesson.id] || {};
      const done = state.completedGrammar.includes(lesson.id);
      const detailEl = document.getElementById('grammar-detail-panel');
      if (!detailEl) return;

      detailEl.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">${lesson.number}</span>
            <h2 class="text-xl font-extrabold text-slate-900 mt-0.5">${lesson.title}</h2>
          </div>
          ${done ? '<span class="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Đã hoàn thành (+5 ⭐)</span>' : ''}
        </div>
        <div class="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-sm text-slate-700"><span class="font-bold text-indigo-800">Hiểu nhanh:</span> ${lesson.summary}</div>
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-slate-900">Công thức dễ nhớ</h3>
          ${lesson.formulas.map(f => `<div class="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"><span class="text-xs font-semibold text-slate-500">${f.label}</span><span class="text-xs sm:text-sm font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">${f.code}</span></div>`).join('')}
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-slate-900">Ví dụ thực tế</h3>
          ${lesson.examples.map(ex => `<div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/80"><div><div class="text-sm font-bold text-slate-900">${ex.en}</div><div class="text-xs text-slate-500">${ex.vi}</div></div><button type="button" data-speak="${ex.en}" class="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600"><i data-lucide="volume-2" class="w-4 h-4"></i></button></div>`).join('')}
        </div>
        <div class="p-4 rounded-xl bg-amber-50/80 border border-amber-200/70 text-sm text-amber-900"><span class="font-bold">Lưu ý:</span> ${lesson.warning}</div>
        <div class="pt-3 border-t border-slate-100 space-y-3.5">
          <h3 class="text-base font-extrabold text-slate-900">Bài tập nhanh (3 câu)</h3>
          ${lesson.quiz.map((qItem, qIdx) => {
            const chosen = lessonAnswers[qIdx];
            const hasAnswered = typeof chosen === 'number';
            return `
              <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div class="text-sm font-bold text-slate-900">Câu ${qIdx + 1}: ${qItem.q}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${qItem.options.map((opt, optIdx) => {
                    let cls = 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700';
                    if (hasAnswered) {
                      if (optIdx === qItem.answer) cls = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                      else if (optIdx === chosen) cls = 'bg-rose-50 border-rose-400 text-rose-700';
                      else cls = 'bg-white/60 border-slate-200 text-slate-400';
                    }
                    return `<button type="button" data-gram-q="${qIdx}" data-gram-opt="${optIdx}" class="gram-opt-btn text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${cls}">${opt}</button>`;
                  }).join('')}
                </div>
                ${hasAnswered ? `<div class="text-xs p-2.5 rounded-xl ${chosen === qItem.answer ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'}"><strong>${chosen === qItem.answer ? 'Chính xác!' : 'Chưa đúng.'}</strong> ${qItem.explain}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    function renderIpaTrack() {
      const countEl = document.getElementById('ipa-progress-count');
      if (countEl) countEl.textContent = state.masteredIpa.length;
      document.querySelectorAll('.ipa-filter-btn').forEach(btn => {
        const active = btn.dataset.ipaCat === ui.ipaCategory;
        btn.className = `ipa-filter-btn px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`;
      });
      const filtered = ui.ipaCategory === 'all' ? IPA_DATA : IPA_DATA.filter(i => i.cat === ui.ipaCategory);
      if (!filtered.some(i => i.id === ui.selectedIpaId) && filtered.length) ui.selectedIpaId = filtered[0].id;
      const grid = document.getElementById('ipa-grid');
      if (grid) {
        grid.innerHTML = filtered.map(item => {
          const isSelected = item.id === ui.selectedIpaId;
          const isMastered = state.masteredIpa.includes(item.id);
          return `
            <button type="button" data-ipa-id="${item.id}" class="ipa-card relative p-4 rounded-2xl border text-left transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200/90 hover:border-indigo-300 text-slate-900'}">
              ${isMastered ? `<span class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full ${isSelected ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center"><i data-lucide="check" class="w-3 h-3"></i></span>` : ''}
              <div class="text-2xl font-extrabold">${ipaSymbol(item.symbol,item.examples[0].en)}</div>
              <div class="text-xs font-medium mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}">${item.name}</div>
              <div class="text-[11px] mt-2 font-semibold ${isSelected ? 'text-white/90' : 'text-indigo-600'}">VD: ${ipaHighlight(item.symbol,item.examples[0].en)}</div>
            </button>
          `;
        }).join('');
      }
      const current = IPA_DATA.find(i => i.id === ui.selectedIpaId) || IPA_DATA[0];
      const isMastered = state.masteredIpa.includes(current.id);
      const guide = NTPronunciation.guide(current.symbol,ipaAccent());
      const panel = document.getElementById('ipa-detail-panel');
      if (!panel) return;
      panel.innerHTML = `
        <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div class="inline-flex items-center gap-2">
            <span class="text-3xl font-extrabold text-indigo-600">${ipaSymbol(current.symbol,current.examples[0].en)}</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">${current.name}</span>
          </div>
          <button type="button" data-speak-phoneme="${NTPronunciation.normal(current.symbol)}" data-ipa-context="${current.examples[0].en}" class="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Nghe âm riêng</button>
        </div>
        ${ipaStatusHTML}
        <p class="nt-ipa-note">Loa /âm/ phát phần gạch chân. “Cả từ” đọc đầy đủ từ. Phụ âm và âm cuối phát 3 lần.</p>
        <div class="space-y-4 py-4">
          <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100"><div class="text-xs font-bold text-emerald-800 mb-1">Mẹo đặt khẩu hình</div><p class="text-sm text-slate-700">${guide ? guide.tip : current.tip}</p></div>
          <div class="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100"><div class="text-xs font-bold text-amber-800 mb-1">Lỗi hay gặp</div><p class="text-sm text-slate-700">${guide ? guide.mistake : current.mistake}</p></div>
          <div class="space-y-2">
            ${current.examples.map(ex => NTPronunciation.exampleHTML(current.symbol,ex.en,ipaAccent(),{slow:true,meaning:ex.vi})).join('')}
          </div>
        </div>
        <button type="button" id="toggle-ipa-master-btn" data-ipa-master="${current.id}" class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold ${isMastered ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}">${isMastered ? 'Đã nắm âm này (Bỏ đánh dấu)' : 'Đánh dấu đã nắm âm này (+1 ⭐)'}</button>
      `;
      updateIpaAudioStatus();
    }

    // ==================== STUDY SESSION ENGINE ====================
    function findLessonById(lessonId) {
      for (const t of TOPICS_DATA) {
        for (const l of t.lessons) {
          if (l.id === lessonId) return { topic: t, lesson: l };
        }
      }
      return null;
    }

    function openStudyPage() {
      document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('page-study').classList.remove('hidden');
      updateHeader();
      renderStudySession();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      refreshIcons();
    }

    function startCardSession(lessonId, customWords, titleOverride) {
      let words = customWords;
      let title = titleOverride || 'Ôn tập SRS thông minh';
      let topicId = state.selectedTopicId;
      if (lessonId) {
        const found = findLessonById(lessonId);
        if (!found) return;
        words = found.lesson.words;
        title = `${found.topic.title} · ${found.lesson.num}: ${found.lesson.title}`;
        topicId = found.topic.id;
      }
      if (!words || !words.length) return;
      ui.session = {
        type: lessonId ? 'cards' : 'srs_cards',
        topicId, lessonId: lessonId || null, title, items: words, idx: 0,
        frontLang: 'en', flipped: false, revealBlank: false, typedValue: '', recallResult: null, hintLevel: 0, done: false
      };
      openStudyPage();
    }

    function startExerciseSession(lessonId) {
      const found = findLessonById(lessonId);
      if (!found) return;
      const questions = found.lesson.words.map((w, i) => {
        const distractors = shuffleArray(ALL_WORDS.filter(x => x.id !== w.id)).slice(0, 3);
        if (i % 2 === 1) {
          return {
            word: w,
            prompt: `Điền từ đúng vào câu: "${w.exBlank}"`,
            subPrompt: `Nghĩa tiếng Việt: ${w.exVi}`,
            speak: w.exEn,
            options: shuffleArray([w, ...distractors]).map(x => ({ label: x.en, isCorrect: x.id === w.id })),
            answerText: `${w.en} (${w.vi})`
          };
        }
        return {
          word: w,
          prompt: `Từ "${w.en}" (${w.ipa}) có nghĩa là gì?`,
          subPrompt: `Ví dụ: ${w.exEn}`,
          subPromptVi: w.exVi,
          speak: w.en,
          options: shuffleArray([w, ...distractors]).map(x => ({ label: x.vi, isCorrect: x.id === w.id })),
          answerText: `${w.en} = ${w.vi}`
        };
      });
      ui.session = { type: 'exercise', topicId: found.topic.id, lessonId, title: `Bài tập · ${found.lesson.num}: ${found.lesson.title}`, items: questions, idx: 0, picked: null, score: 0, done: false };
      openStudyPage();
    }

    function startSpeakingSession(lessonId) {
      const found = findLessonById(lessonId);
      if (!found) return;
      ui.session = {
        type: 'speaking',
        topicId: found.topic.id,
        lessonId,
        title: `Luyện nói AI · ${found.lesson.num}: ${found.lesson.title}`,
        items: found.lesson.words,
        idx: 0,
        mode: 'word', // 'word' | 'sentence'
        lastEval: null,
        passedCount: 0,
        done: false
      };
      openStudyPage();
    }

    function startDictationSession(lessonId) {
      const found = findLessonById(lessonId);
      if (!found) return;
      ui.session = { type: 'dictation', topicId: found.topic.id, lessonId, title: `Nghe viết · ${found.lesson.num}: ${found.lesson.title}`, items: found.lesson.words, idx: 0, inputVal: '', status: null, hintShown: false, score: 0, done: false };
      openStudyPage();
      speakText(found.lesson.words[0].en);
    }

    function startBuilderSession(lessonId) {
      const found = findLessonById(lessonId);
      if (!found || !found.lesson.sentences.length) return;
      const first = found.lesson.sentences[0];
      ui.session = { type: 'builder', topicId: found.topic.id, lessonId, title: `Ghép câu · ${found.lesson.num}: ${found.lesson.title}`, items: found.lesson.sentences, idx: 0, pool: shuffleArray(first.words.map((w, i) => ({ id: `${i}_${w}`, text: w }))), selected: [], status: null, done: false };
      openStudyPage();
    }

    function startPlacementSession(topicId) {
      const topic = TOPICS_DATA.find(t => t.id === topicId);
      if (!topic) return;
      const selected = shuffleArray(topic.lessons.flatMap(l => l.words)).slice(0, 6);
      const questions = selected.map((w, i) => {
        const distractors = shuffleArray(ALL_WORDS.filter(x => x.id !== w.id)).slice(0, 3);
        return {
          word: w,
          prompt: i % 2 === 0 ? `Nghĩa tiếng Việt của "${w.en}" (${w.ipa}) là gì?` : `Từ tiếng Anh nào có nghĩa là "${w.vi}"?`,
          subPrompt: i % 2 === 0 ? `Gợi ý câu: ${w.exEn}` : `Điền vào câu: ${w.exBlank}`,
          subPromptVi: w.exVi,
          speak: w.en,
          options: shuffleArray([w, ...distractors]).map(x => ({ label: i % 2 === 0 ? x.vi : x.en, isCorrect: x.id === w.id })),
          answerText: `${w.en} (${w.vi})`
        };
      });
      ui.session = { type: 'placement', topicId, lessonId: null, title: `Kiểm tra vượt cấp · Chủ đề ${topic.num}: ${topic.title}`, items: questions, idx: 0, picked: null, score: 0, done: false };
      openStudyPage();
    }

    // ==================== RENDER STUDY SESSION ====================
    function renderStudySession() {
      const container = document.getElementById('page-study');
      const s = ui.session;
      if (!container || !s) return;

      const pct = s.done ? 100 : Math.round(((s.idx + 1) / s.items.length) * 100);
      const topBar = `
        <div class="flex items-center justify-between gap-3">
          <button type="button" id="exit-study-btn" class="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại
          </button>
          <div class="text-xs sm:text-sm font-bold text-slate-700 truncate">${s.title}</div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" id="toggle-zen-btn" class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 ${ui.zenMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}">
              <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Zen
            </button>
            <button type="button" id="study-notebook-btn" class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1">
              <i data-lucide="notebook-pen" class="w-3.5 h-3.5"></i> Sổ tay
            </button>
          </div>
        </div>
        <div class="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>
      `;

      // A. FLASHCARD STUDIO WITH SRS 4-LEVEL RATING
      if (s.type === 'cards' || s.type === 'srs_cards') {
        if (s.done) {
          container.innerHTML = `
            ${topBar}
            <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-5">
              <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="party-popper" class="w-8 h-8"></i></div>
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900">Hoàn thành học thẻ!</h2>
                <p class="text-sm text-slate-600 mt-1">Thuật toán SRS đã tự động lên lịch ôn tập cho ${s.items.length} từ vừa học.</p>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <button type="button" id="exit-study-btn-2" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">Quay lại</button>
                ${s.lessonId ? `<button type="button" data-start-exercise="${s.lessonId}" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-1.5">Làm bước 2: Bài tập <i data-lucide="arrow-right" class="w-4 h-4"></i></button>` : ''}
              </div>
            </div>
          `;
          refreshIcons();
          return;
        }

        const w = s.items[s.idx];
        const srsInfo = state.srsData[w.id];
        const hintText = s.hintLevel > 0 ? w.en.slice(0, Math.min(s.hintLevel + 1, w.en.length)) + '...' : '';

        container.innerHTML = `
          ${topBar}
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="text-xs font-extrabold text-slate-400">THẺ ${s.idx + 1}/${s.items.length}</span>
                <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">${w.pos}</span>
                ${srsInfo ? `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">SRS Hộp ${srsInfo.box}/4</span>` : ''}
              </div>
              <div class="bg-slate-100 p-0.5 rounded-lg inline-flex text-xs font-semibold">
                <button type="button" data-front-lang="en" class="px-2.5 py-1 rounded-md ${s.frontLang === 'en' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}">Mặt trước: Anh</button>
                <button type="button" data-front-lang="vi" class="px-2.5 py-1 rounded-md ${s.frontLang === 'vi' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}">Việt</button>
              </div>
            </div>

            ${!s.flipped ? `
              <div class="py-4 sm:py-6 text-center space-y-4">
                ${renderWordVisual(w, 'w-48 sm:w-56 aspect-[4/3] rounded-2xl object-cover shadow-sm border-2 border-indigo-100 mx-auto')}
                ${s.frontLang === 'en' ? `
                  <div class="space-y-2">
                    <div class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">${w.en}</div>
                    <div class="text-lg font-medium text-indigo-600">${w.ipa}</div>
                  </div>
                  <div class="flex items-center justify-center gap-2">
                    <button type="button" data-speak="${w.en}" class="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Nghe (A)</button>
                    <button type="button" data-speak-slow="${w.en}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold">Đọc chậm</button>
                  </div>
                ` : `
                  <div class="space-y-2">
                    <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Nghĩa tiếng Việt</div>
                    <div class="text-3xl sm:text-4xl font-extrabold text-slate-900">${w.vi}</div>
                    <p class="text-sm text-slate-500 max-w-md mx-auto pt-1">${w.usage}</p>
                  </div>
                `}

                ${s.frontLang === 'vi' ? `
                <div class="max-w-md mx-auto pt-2 space-y-2">
                  <div class="flex gap-2">
                    <input type="text" id="card-recall-input" value="${s.typedValue.replace(/"/g, '&quot;')}" placeholder="Gõ từ tiếng Anh tương ứng rồi nhấn Enter..." autocomplete="off" class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm" />
                    <button type="button" id="card-check-recall-btn" class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold">Kiểm tra</button>
                  </div>
                  <div class="flex items-center justify-between text-xs px-1">
                    <button type="button" id="card-hint-btn" class="text-indigo-600 hover:underline font-semibold">Gợi ý chữ cái đầu</button>
                    ${hintText ? `<span class="font-bold text-amber-700">Gợi ý: ${hintText}</span>` : ''}
                  </div>
                  ${s.recallResult === 'correct' ? `<div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Chính xác! "${w.en}"</div>` : ''}
                  ${s.recallResult === 'wrong' ? `<div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">Chưa khớp! Bấm Lật thẻ bên dưới để xem đáp án.</div>` : ''}
                </div>
                ` : '<p class="text-xs text-slate-400">Nghe phát âm, đoán nghĩa trong đầu rồi bấm lật thẻ (hoặc chọn <strong>Mặt trước: Việt</strong> để tự gõ từ).</p>'}
              </div>
              <button type="button" id="card-flip-btn" class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                <i data-lucide="rotate-cw" class="w-4 h-4"></i> Lật xem đáp án &amp; ví dụ (Space)
              </button>
            ` : `
              <div class="space-y-4 py-1">
                <div class="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">${w.en}</span>
                      <span class="text-sm font-medium text-indigo-600">${w.ipa}</span>
                    </div>
                    <div class="text-lg font-extrabold text-emerald-700 mt-1">${w.vi}</div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button type="button" data-speak="${w.en}" class="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Nghe</button>
                    <button type="button" data-speak-slow="${w.en}" class="px-2.5 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold">Chậm</button>
                  </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cách dùng</div>
                  <p class="text-sm text-slate-700 font-medium mt-0.5">${w.usage}</p>
                </div>

                <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Câu ví dụ thực tế</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" id="toggle-blank-btn" class="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-700">${s.revealBlank ? 'Ẩn từ khóa' : 'Hiện từ khóa'}</button>
                      <button type="button" data-speak="${w.exEn}" class="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                  </div>
                  <div class="text-base font-bold text-slate-900">${s.revealBlank ? w.exEn : w.exBlank}</div>
                  <div class="text-xs sm:text-sm text-slate-600">${w.exVi}</div>
                </div>

                <!-- 4-Level SRS Rating -->
                <div class="space-y-1.5 pt-1">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Đánh giá mức độ nhớ (Thuật toán SRS tự lên lịch ôn)</div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button type="button" data-srs-rate="0" class="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold">
                      Quên (1)<span class="block text-[10px] font-medium opacity-80">Ôn lại hôm nay</span>
                    </button>
                    <button type="button" data-srs-rate="1" class="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold">
                      Khó (2)<span class="block text-[10px] font-medium opacity-80">Ôn sau 1 ngày</span>
                    </button>
                    <button type="button" data-srs-rate="2" class="py-2.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold">
                      Tốt (3)<span class="block text-[10px] font-medium opacity-80">Ôn sau 3 ngày</span>
                    </button>
                    <button type="button" data-srs-rate="3" class="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                      Dễ (4)<span class="block text-[10px] font-medium text-emerald-100">Ôn sau 14 ngày</span>
                    </button>
                  </div>
                </div>
              </div>
            `}

            <div class="hidden sm:flex items-center justify-center gap-4 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">A</kbd> Phát âm</span>
              <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">Space</kbd> Lật thẻ</span>
              <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">1–4</kbd> Chấm điểm SRS</span>
            </div>
          </div>
        `;
      }

      // B. SPEAKING PRACTICE (Speech-to-Text Pronunciation Scoring)
      else if (s.type === 'speaking') {
        if (s.done) {
          container.innerHTML = `
            ${topBar}
            <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-5">
              <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="mic" class="w-8 h-8"></i></div>
              <h2 class="text-2xl font-extrabold text-slate-900">Hoàn thành Luyện nói!</h2>
              <p class="text-sm text-slate-600">Bạn đã luyện phát âm ${s.items.length} từ/câu trong bài (+2 ⭐).</p>
              <button type="button" id="exit-study-btn-2" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">Quay lại lộ trình</button>
            </div>
          `;
          refreshIcons();
          return;
        }

        const w = s.items[s.idx];
        const targetText = s.mode === 'word' ? w.en : w.exEn;
        const targetSub = s.mode === 'word' ? `${w.ipa} — ${w.vi}` : w.exVi;
        const supported = Boolean(getSpeechRecognitionCtor());

        container.innerHTML = `
          ${topBar}
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-center">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-400">LUYỆN NÓI · ${s.idx + 1} / ${s.items.length}</span>
              <div class="bg-slate-100 p-0.5 rounded-lg inline-flex text-xs font-semibold">
                <button type="button" data-speak-mode="word" class="px-2.5 py-1 rounded-md ${s.mode === 'word' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}">Đọc từ</button>
                <button type="button" data-speak-mode="sentence" class="px-2.5 py-1 rounded-md ${s.mode === 'sentence' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'}">Đọc cả câu</button>
              </div>
            </div>

            <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              ${renderWordVisual(w, 'w-44 sm:w-52 aspect-[4/3] rounded-2xl object-cover shadow-xs border border-slate-200 mx-auto')}
              <div class="text-2xl sm:text-3xl font-extrabold text-slate-900">${targetText}</div>
              <div class="text-sm text-indigo-600 font-medium">${targetSub}</div>
              <div class="pt-2 flex items-center justify-center gap-2">
                <button type="button" data-speak="${targetText}" class="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Nghe mẫu trước</button>
                <button type="button" data-speak-slow="${targetText}" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold">Nghe chậm</button>
              </div>
            </div>

            <div class="space-y-3">
              <button type="button" id="speak-mic-btn" class="w-20 h-20 rounded-full ${ui.isListening ? 'bg-rose-600 mic-recording' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-lg flex items-center justify-center mx-auto transition-all">
                <i data-lucide="mic" class="w-8 h-8"></i>
              </button>
              <div class="text-xs font-semibold ${ui.isListening ? 'text-rose-600' : 'text-slate-500'}">
                ${ui.isListening ? 'Đang lắng nghe... Hãy đọc to rõ câu tiếng Anh!' : (supported ? 'Bấm nút Micro và đọc to câu trên' : 'Trình duyệt chưa hỗ trợ Micro (Khuyên dùng Chrome / Edge)')}
              </div>
            </div>

            ${s.lastEval ? `
              <div class="p-4 rounded-2xl border ${s.lastEval.pct >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} space-y-2 text-left max-w-md mx-auto">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase ${s.lastEval.pct >= 70 ? 'text-emerald-700' : 'text-amber-700'}">Độ chính xác phát âm</span>
                  <span class="text-lg font-extrabold ${s.lastEval.pct >= 70 ? 'text-emerald-700' : 'text-amber-700'}">${s.lastEval.pct}%</span>
                </div>
                <div class="text-xs text-slate-600">Máy nghe được: <strong class="text-slate-900">"${s.lastEval.transcript || '(không rõ)'}"</strong></div>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${s.lastEval.matched.map(m => `<span class="px-2 py-0.5 rounded-md text-xs font-bold ${m.ok ? 'bg-emerald-200/70 text-emerald-900' : 'bg-rose-200/70 text-rose-900'}">${m.word}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
              <button type="button" id="speak-skip-btn" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold">Bỏ qua từ này</button>
              <button type="button" id="speak-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
                ${s.idx + 1 === s.items.length ? 'Hoàn thành bài nói' : 'Từ tiếp theo'}
              </button>
            </div>
          </div>
        `;
      }

      // C. MULTIPLE-CHOICE EXERCISE & PLACEMENT
      else if (s.type === 'exercise' || s.type === 'placement') {
        if (s.done) {
          const isPlacement = s.type === 'placement';
          const passThreshold = isPlacement ? 5 : Math.ceil(s.items.length * 0.7);
          const passed = s.score >= passThreshold;
          container.innerHTML = `
            ${topBar}
            <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-5">
              <div class="w-16 h-16 rounded-2xl ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mx-auto"><i data-lucide="${passed ? 'trophy' : 'target'}" class="w-8 h-8"></i></div>
              <h2 class="text-2xl font-extrabold text-slate-900">Kết quả: ${s.score}/${s.items.length} câu đúng</h2>
              <p class="text-sm text-slate-600 max-w-md mx-auto">${passed ? (isPlacement ? 'Xuất sắc! Bạn đã vượt cấp và hoàn thành toàn bộ chủ đề này!' : 'Chúc mừng bạn đã vượt qua bài tập!') : `Cần đúng tối thiểu ${passThreshold}/${s.items.length} câu để đạt.`}</p>
              <div class="flex items-center justify-center gap-3">
                <button type="button" id="exit-study-btn-2" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">Về lộ trình</button>
                <button type="button" id="retry-session-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">Làm lại</button>
              </div>
            </div>
          `;
          refreshIcons();
          return;
        }
        const q = s.items[s.idx];
        const hasPicked = typeof s.picked === 'number';
        container.innerHTML = `
          ${topBar}
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
            <div class="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>CÂU ${s.idx + 1} / ${s.items.length}</span>
              <button type="button" data-speak="${q.speak}" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe</button>
            </div>
            <div class="flex flex-col sm:flex-row items-center gap-4">${q.word ? renderWordVisual(q.word, 'w-36 sm:w-40 aspect-[4/3] rounded-2xl object-cover shadow-xs border border-indigo-100 shrink-0') : ''}<div class="flex-1 text-center sm:text-left"><h2 class="text-lg sm:text-xl font-extrabold text-slate-900">${q.prompt}</h2><p class="text-xs sm:text-sm text-slate-600 font-medium mt-1">${q.subPrompt}</p>${(q.subPromptVi && hasPicked) ? `<p class="text-xs sm:text-sm text-indigo-600 italic mt-0.5">Dịch: ${q.subPromptVi}</p>` : ''}</div></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${q.options.map((opt, i) => {
                let cls = 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800';
                if (hasPicked) {
                  if (opt.isCorrect) cls = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                  else if (i === s.picked) cls = 'bg-rose-50 border-rose-400 text-rose-700';
                  else cls = 'bg-slate-50 border-slate-200 text-slate-400';
                }
                return `<button type="button" data-ex-opt="${i}" ${hasPicked ? 'disabled' : ''} class="p-4 rounded-xl border text-left text-sm font-semibold ${cls}">${opt.label}</button>`;
              }).join('')}
            </div>
            ${hasPicked ? `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100"><div class="text-xs sm:text-sm font-semibold ${q.options[s.picked].isCorrect ? 'text-emerald-700' : 'text-rose-700'}">${q.options[s.picked].isCorrect ? 'Chính xác!' : 'Chưa đúng.'} Đáp án: <strong>${q.answerText}</strong></div><button type="button" id="ex-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">${s.idx + 1 === s.items.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button></div>` : ''}
          </div>
        `;
      }

      // D. DICTATION
      else if (s.type === 'dictation') {
        if (s.done) {
          container.innerHTML = `${topBar}<div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-5"><div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="headphones" class="w-8 h-8"></i></div><h2 class="text-2xl font-extrabold text-slate-900">Hoàn thành Nghe viết!</h2><p class="text-sm text-slate-600">Bạn đã viết đúng ${s.score}/${s.items.length} từ (+1 ⭐).</p><button type="button" id="exit-study-btn-2" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Quay lại lộ trình</button></div>`;
          refreshIcons();
          return;
        }
        const w = s.items[s.idx];
        container.innerHTML = `
          ${topBar}
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-center">
            <div class="text-xs font-bold text-slate-400">NGHE VIẾT · TỪ ${s.idx + 1} / ${s.items.length}</div>
            <div class="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 space-y-3">
              <button type="button" data-speak="${w.en}" class="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-md flex items-center justify-center mx-auto"><i data-lucide="volume-2" class="w-7 h-7"></i></button>
              <div class="flex items-center justify-center gap-2">
                <button type="button" data-speak="${w.en}" class="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-indigo-700">Nghe lại</button>
                <button type="button" data-speak-slow="${w.en}" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600">Nghe chậm</button>
              </div>
              <div class="text-xs text-slate-500">Nghĩa gợi ý: <strong class="text-slate-700">${w.vi}</strong></div>
            </div>
            <div class="max-w-md mx-auto space-y-3">
              <div class="flex gap-2">
                <input type="text" id="dictation-input" value="${s.inputVal.replace(/"/g, '&quot;')}" placeholder="Gõ từ bạn nghe được..." autocomplete="off" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-semibold" />
                ${s.status !== 'correct' ? `<button type="button" id="dictation-check-btn" class="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Kiểm tra</button>` : ''}
              </div>
              <div class="flex items-center justify-between text-xs px-1">
                <button type="button" id="dictation-hint-btn" class="text-indigo-600 hover:underline font-semibold">Hiện gợi ý</button>
                ${s.hintShown ? `<span class="text-amber-700 font-bold">Bắt đầu bằng: "${w.en.slice(0, 2)}..." (${w.en.length} ký tự)</span>` : ''}
              </div>
              ${s.status === 'correct' ? `<div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between"><span>Chuẩn xác! "${w.en}"</span><button type="button" id="dictation-next-btn" class="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Tiếp tục</button></div>` : ''}
              ${s.status === 'wrong' ? `<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">Chưa đúng chính tả! Nghe chậm lại hoặc xem gợi ý nhé.</div>` : ''}
            </div>
          </div>
        `;
      }

      // E. SENTENCE BUILDER
      else if (s.type === 'builder') {
        if (s.done) {
          container.innerHTML = `${topBar}<div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-5"><div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="puzzle" class="w-8 h-8"></i></div><h2 class="text-2xl font-extrabold text-slate-900">Hoàn thành Ghép câu!</h2><p class="text-sm text-slate-600">Bạn đã ghép chuẩn xác các câu giao tiếp của bài (+1 ⭐).</p><button type="button" id="exit-study-btn-2" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Quay lại lộ trình</button></div>`;
          refreshIcons();
          return;
        }
        const item = s.items[s.idx];
        container.innerHTML = `
          ${topBar}
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
            <div class="text-xs font-bold text-slate-400">GHÉP CÂU · CÂU ${s.idx + 1} / ${s.items.length}</div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80"><div class="text-xs font-semibold text-slate-400 uppercase mb-1">Dịch sang tiếng Anh:</div><div class="text-lg font-extrabold text-slate-900">"${item.vi}"</div></div>
            <div class="min-h-[76px] p-3.5 rounded-2xl border-2 border-dashed ${s.status === 'correct' ? 'border-emerald-400 bg-emerald-50/50' : s.status === 'wrong' ? 'border-rose-400 bg-rose-50/50' : 'border-indigo-200 bg-indigo-50/30'} flex flex-wrap gap-2 items-center">
              ${s.selected.length === 0 ? '<span class="text-xs text-slate-400">Bấm các từ bên dưới để xếp câu...</span>' : s.selected.map(c => `<button type="button" data-b-remove="${c.id}" class="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">${c.text}</button>`).join('')}
            </div>
            <div class="flex flex-wrap gap-2">${s.pool.map(c => `<button type="button" data-b-add="${c.id}" class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-800 text-sm font-semibold">${c.text}</button>`).join('')}</div>
            ${s.status === 'correct' ? `<div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between"><span>Chuẩn rồi! "${item.words.join(' ')}."</span><button type="button" data-speak="${item.words.join(' ')}" class="px-3 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-700">Nghe câu</button></div>` : ''}
            ${s.status === 'wrong' ? `<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">Chưa đúng thứ tự! Bấm từ để gỡ ra hoặc Xếp lại.</div>` : ''}
            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
              <button type="button" id="b-reset-btn" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold">Xếp lại</button>
              ${s.status !== 'correct' ? '<button type="button" id="b-check-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Kiểm tra</button>' : '<button type="button" id="b-next-btn" class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Câu tiếp theo</button>'}
            </div>
          </div>
        `;
      }

      refreshIcons();
    }

    // ==================== SRS REVIEW PAGE ====================

    // ==================== OPENQUIZ-STYLE PRACTICE HUB (TRANSLATION, SPEAKING USE, READING, SPEED DASH) ====================
    const OQ_READING_PASSAGES = [
      {
        id: 'oq-read-en-1', lang: 'en', title: 'A Morning at the Coffee Shop', level: 'A1 · Tiếng Anh',
        before: 'Every morning, Linh walks to a small coffee shop near her office. She always orders an iced latte and says ',
        blank: 'thank you',
        after: ' with a big smile. After drinking her coffee, she feels happy and ready to start work at nine.',
        vi: 'Mỗi sáng, Linh đi bộ đến một quán cà phê nhỏ gần văn phòng. Cô ấy luôn gọi một ly latte đá và nói "cảm ơn" với nụ cười tươi. Sau khi uống cà phê, cô ấy cảm thấy vui vẻ và sẵn sàng bắt đầu công việc lúc 9 giờ.',
        question: 'When does Linh start work?',
        options: ['At seven in the morning', 'At nine in the morning', 'After lunch', 'In the evening'],
        correctIdx: 1,
        explanation: 'Đoạn văn nói: "ready to start work at nine" (sẵn sàng bắt đầu công việc lúc 9 giờ).'
      },
      {
        id: 'oq-read-en-2', lang: 'en', title: 'Finding the Train Station', level: 'A1–A2 · Tiếng Anh',
        before: 'Nam is visiting a new city for the first time. He wants to take a train, so he asks a local person: "Excuse me, where is the ',
        blank: 'station',
        after: '?" The local person smiles and says it is only five minutes away on foot.',
        vi: 'Nam đang đi thăm một thành phố mới lần đầu tiên. Cậu ấy muốn đi tàu nên hỏi một người dân địa phương: "Xin lỗi, nhà ga ở đâu ạ?" Người dân mỉm cười và nói chỉ cách đó 5 phút đi bộ thôi.',
        question: 'How far is the train station from Nam?',
        options: ['Five minutes on foot', 'Thirty minutes by bus', 'One hour by taxi', 'Very far from the city'],
        correctIdx: 0,
        explanation: 'Đoạn văn nói: "only five minutes away on foot" (chỉ cách 5 phút đi bộ).'
      },
      {
        id: 'oq-read-en-3', lang: 'en', title: 'A Cute Puppy in the Park', level: 'A1 · Bé & Mới học',
        before: 'On Sunday afternoon, Mia goes to the green park with her little dog, Milo. Milo loves running after a red ',
        blank: 'ball',
        after: ' on the grass. When Milo gets tired, Mia gives him fresh water and a small biscuit.',
        vi: 'Vào chiều Chủ nhật, Mia đi ra công viên xanh cùng chú cún nhỏ Milo. Milo rất thích chạy theo quả bóng màu đỏ trên bãi cỏ. Khi Milo mệt, Mia cho chú uống nước mát và ăn một chiếc bánh quy nhỏ.',
        question: 'What does Milo love running after?',
        options: ['A blue bird', 'A red ball', 'A yellow bike', 'A white cat'],
        correctIdx: 1,
        explanation: 'Đoạn văn nói: "Milo loves running after a red ball on the grass."'
      },
      {
        id: 'oq-read-en-4', lang: 'en', title: 'Shopping at the Supermarket', level: 'A1 · Đời sống',
        before: 'Today Mom and Ben are buying food for dinner. They put six sweet apples, two bottles of milk, and fresh ',
        blank: 'bread',
        after: ' into the basket. Before leaving, Ben helps his mom carry the shopping bag to the car.',
        vi: 'Hôm nay mẹ và Ben đang mua đồ ăn cho bữa tối. Họ bỏ 6 quả táo ngọt, 2 chai sữa và bánh mì tươi vào giỏ. Trước khi về, Ben giúp mẹ xách túi đồ ra xe.',
        question: 'How many apples do they buy?',
        options: ['Two apples', 'Four apples', 'Six apples', 'Ten apples'],
        correctIdx: 2,
        explanation: 'Đoạn văn nói: "They put six sweet apples..." (Họ bỏ 6 quả táo ngọt).'
      },
      {
        id: 'oq-read-en-5', lang: 'en', title: 'My Favorite School Subject', level: 'A1 · Trường học',
        before: 'Tom is ten years old and he loves going to school every day. His favorite subject is ',
        blank: 'English',
        after: ' because he enjoys singing songs and reading short stories with his teacher.',
        vi: 'Tom 10 tuổi và cậu bé rất thích đi học mỗi ngày. Môn học yêu thích của cậu là tiếng Anh vì cậu thích hát các bài hát và đọc truyện ngắn cùng cô giáo.',
        question: 'Why does Tom like his favorite subject?',
        options: ['He likes drawing maps', 'He enjoys singing songs and reading stories', 'He plays football after class', 'He has no homework'],
        correctIdx: 1,
        explanation: 'Đoạn văn nói: "because he enjoys singing songs and reading short stories with his teacher."'
      },
      {
        id: 'oq-read-en-6', lang: 'en', title: 'A Rainy Sunday at Home', level: 'A2 · Giao tiếp',
        before: 'It is raining heavily outside, so our family decides to stay at home. Dad cooks a big pot of hot ',
        blank: 'soup',
        after: ', and we watch a funny movie together in the living room.',
        vi: 'Bên ngoài trời đang mưa to nên cả nhà mình quyết định ở nhà. Bố nấu một nồi súp nóng lớn, và cả nhà cùng nhau xem một bộ phim hài trong phòng khách.',
        question: 'Where do they watch the movie?',
        options: ['At the cinema', 'In the kitchen', 'In the living room', 'In the garden'],
        correctIdx: 2,
        explanation: 'Đoạn văn nói: "we watch a funny movie together in the living room."'
      },
      {
        id: 'oq-read-zh-1', lang: 'zh', title: '小明的周末 (Cuối tuần của Tiểu Minh)', level: 'HSK 1 · Tiếng Trung',
        before: '今天是星期六，小明不用工作。上午他和朋友去咖啡店喝茶，中午一起吃面条。下午他们去看电影，小明觉得非常',
        blank: '开心',
        after: '。',
        pinyin: 'Jīntiān shì xīngqīliù, Xiǎomíng búyòng gōngzuò. Shàngwǔ tā hé péngyou qù kāfēidiàn hē chá, zhōngwǔ yìqǐ chī miàntiáo. Xiàwǔ tāmen qù kàn diànyǐng, Xiǎomíng juéde fēicháng kāixīn.',
        vi: 'Hôm nay là thứ Bảy, Tiểu Minh không phải đi làm. Buổi sáng cậu ấy cùng bạn đi quán cà phê uống trà, buổi trưa ăn mì cùng nhau. Buổi chiều họ đi xem phim, Tiểu Minh cảm thấy vô cùng vui vẻ.',
        question: 'Tiểu Minh và bạn ăn gì vào buổi trưa?',
        options: ['Cơm chiên (炒饭)', 'Mì sợi (面条)', 'Bánh bao (包子)', 'Phở (河粉)'],
        correctIdx: 1,
        explanation: 'Trong bài viết: "中午一起吃面条" (buổi trưa cùng nhau ăn mì sợi).'
      },
      {
        id: 'oq-read-zh-2', lang: 'zh', title: '去超市买水果 (Đi siêu thị mua hoa quả)', level: 'HSK 1 · Đời sống',
        before: '妈妈和妹妹一起去超市。妹妹很喜欢吃甜的',
        blank: '苹果',
        after: '，所以妈妈买了五个，还买了一瓶牛奶。',
        pinyin: 'Māma hé mèimei yìqǐ qù chāoshì. Mèimei hěn xǐhuan chī tián de píngguǒ, suǒyǐ māma mǎile wǔ gè, hái mǎile yì píng niúnǎi.',
        vi: 'Mẹ và em gái cùng đi siêu thị. Em gái rất thích ăn táo ngọt nên mẹ mua 5 quả, và còn mua thêm 1 chai sữa bò.',
        question: 'Mẹ đã mua bao nhiêu quả táo?',
        options: ['3 quả', '5 quả', '6 quả', '8 quả'],
        correctIdx: 1,
        explanation: 'Trong bài viết: "所以妈妈买了五个" (nên mẹ đã mua 5 quả).'
      },
      {
        id: 'oq-read-zh-3', lang: 'zh', title: '我的小猫 (Chú mèo nhỏ của tôi)', level: 'HSK 1 · Cho bé',
        before: '我家有一只白色的小猫，它今年两岁了。它每天喜欢喝温水，吃小',
        blank: '鱼',
        after: '，晚上喜欢睡在我的床边。',
        pinyin: 'Wǒ jiā yǒu yì zhī báisè de xiǎomāo, tā jīnnián liǎng suì le. Tā měitiān xǐhuan hē wēnshuǐ, chī xiǎoyú, wǎnshang xǐhuan shuì zài wǒ de chuángbiān.',
        vi: 'Nhà tôi có một chú mèo nhỏ màu trắng, năm nay nó 2 tuổi rồi. Mỗi ngày nó thích uống nước ấm, ăn cá nhỏ, buổi tối thích ngủ bên cạnh giường tôi.',
        question: 'Chú mèo nhỏ có màu gì?',
        options: ['Màu đen', 'Màu vàng', 'Màu trắng', 'Màu xám'],
        correctIdx: 2,
        explanation: 'Trong bài viết: "一只白色的小猫" (một chú mèo nhỏ màu trắng).'
      },
      {
        id: 'oq-read-zh-4', lang: 'zh', title: '早饭时间 (Giờ ăn sáng)', level: 'HSK 1 · Gia đình',
        before: '每天早上七点，爸爸都会给我们做早饭。我吃一个鸡蛋，喝一杯热',
        blank: '牛奶',
        after: '，然后背着书包去学校。',
        pinyin: 'Měitiān zǎoshang qī diǎn, bàba dōu huì gěi wǒmen zuò zǎofàn. Wǒ chī yí gè jīdàn, hē yì bēi rè niúnǎi, ránhòu bēizhe shūbāo qù xuéxiào.',
        vi: 'Mỗi sáng lúc 7 giờ, bố đều làm bữa sáng cho chúng tôi. Tôi ăn một quả trứng gà, uống một ly sữa nóng, sau đó đeo cặp sách đi học.',
        question: 'Ai là người nấu bữa sáng trong gia đình?',
        options: ['Mẹ', 'Bố', 'Chị gái', 'Bà nội'],
        correctIdx: 1,
        explanation: 'Trong bài viết: "爸爸都会给我们做早饭" (bố đều làm bữa sáng cho chúng tôi).'
      },
      {
        id: 'oq-read-zh-5', lang: 'zh', title: '春天的天气 (Thời tiết mùa xuân)', level: 'HSK 2 · Thiên nhiên',
        before: '春天来了，天气很暖和，公园里有很多漂亮的花。周末我喜欢和家人去公园',
        blank: '散步',
        after: '，拍照留念。',
        pinyin: 'Chūntiān lái le, tiānqì hěn nuǎnhuo, gōngyuán lǐ yǒu hěn duō piàoliang de huā. Zhōumò wǒ xǐhuan hé jiārén qù gōngyuán sànbù, pāizhào liúniàn.',
        vi: 'Mùa xuân đến rồi, thời tiết rất ấm áp, trong công viên có rất nhiều hoa đẹp. Cuối tuần tôi thích cùng gia đình đi dạo công viên và chụp ảnh kỷ niệm.',
        question: 'Thời tiết mùa xuân trong bài như thế nào?',
        options: ['Rất lạnh', 'Rất nóng', 'Rất ấm áp', 'Mưa to'],
        correctIdx: 2,
        explanation: 'Trong bài viết: "天气很暖和" (thời tiết rất ấm áp).'
      },
      {
        id: 'oq-read-zh-6', lang: 'zh', title: '学习中文 (Học tiếng Trung)', level: 'HSK 2 · Học tập',
        before: '安娜每天晚上学习中文三十分钟。她先听录音练习发音，再写十个汉字。现在她已经会说很多日常',
        blank: '句子',
        after: '了。',
        pinyin: 'Ānnà měitiān wǎnshang xuéxí Zhōngwén sānshí fēnzhōng. Tā xiān tīng lùyīn liànxí fāyīn, zài xiě shí gè Hànzì. Xiànzài tā yǐjīng huì shuō hěn duō rìcháng jùzi le.',
        vi: 'Anna học tiếng Trung 30 phút mỗi tối. Cô ấy nghe ghi âm luyện phát âm trước, sau đó viết 10 chữ Hán. Bây giờ cô ấy đã biết nói rất nhiều câu giao tiếp hằng ngày rồi.',
        question: 'Mỗi tối Anna học tiếng Trung bao lâu?',
        options: ['15 phút', '30 phút', '1 tiếng', '2 tiếng'],
        correctIdx: 1,
        explanation: 'Trong bài viết: "每天晚上学习中文三十分钟" (mỗi tối học tiếng Trung 30 phút).'
      }
    ];

    async function generateAiReadingPassage(topicInput, lang) {
      const topic = String(topicInput || '').trim() || (lang === 'zh' ? 'đi mua sắm cuối tuần' : 'a fun day at the zoo');
      const isZh = lang === 'zh';
      ui.oqAiGenerating = true;
      if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'reading', lang: isZh ? 'zh' : 'en', topic })
        });
        if (!resp.ok) throw new Error('AI server unavailable');
        const obj = await resp.json();
        if (!obj || !obj.before || !obj.blank || !Array.isArray(obj.options) || obj.options.length < 2) {
          throw new Error('Incomplete passage');
        }
        const newItem = {
          id: 'oq-read-ai-' + Date.now(),
          lang: isZh ? 'zh' : 'en',
          title: String(obj.title || topic),
          level: String(obj.level || (isZh ? 'HSK 1–2 · AI tạo' : 'A1–A2 · AI tạo')),
          before: String(obj.before),
          blank: String(obj.blank).trim(),
          after: String(obj.after || '.'),
          pinyin: isZh ? String(obj.pinyin || '') : '',
          vi: String(obj.vi || ''),
          question: String(obj.question || 'What is the passage about?'),
          options: obj.options.slice(0, 4).map(String),
          correctIdx: Math.max(0, Math.min(3, Number(obj.correctIdx) || 0)),
          explanation: String(obj.explanation || '')
        };
        OQ_READING_PASSAGES.push(newItem);
        ui.oqReadLangFilter = 'all';
        ui.oqReadIdx = OQ_READING_PASSAGES.length - 1;
        ui.oqReadBlank = '';
        ui.oqReadBlankOk = null;
        ui.oqReadShowVi = false;
        ui.oqReadQuizPicked = null;
        showToast('✨ Đã tạo bài đọc mới bằng AI!');
      } catch (e) {
        showToast('Chưa gọi được AI tạo bài — bạn hãy dùng nút "Đổi câu khác" nhé!');
      } finally {
        ui.oqAiGenerating = false;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
      }
    }

    function getOqPool(lang) {
      if (lang === 'zh') {
        const list = [];
        if (typeof ZH_TOPICS !== 'undefined') {
          ZH_TOPICS.forEach(t => (t.words || []).forEach(w => {
            list.push({
              target: w.hanzi,
              sub: w.pinyin,
              vi: w.vi,
              exampleTarget: w.exZh || w.ex || w.hanzi,
              exampleVi: w.exVi || w.vi,
              isZh: true
            });
          }));
        }
        return list;
      }
      const list = [];
      TOPICS_DATA.forEach(t => (t.lessons || []).forEach(l => (l.words || []).forEach(w => {
        list.push({
          target: w.en,
          sub: w.ipa,
          vi: w.vi,
          exampleTarget: w.exEn || w.example || w.en,
          exampleVi: w.exVi || w.exampleVi || w.vi,
          isZh: false
        });
      })));
      return list;
    }

    // ==================== SPEED DASH ONLINE LEADERBOARD (SUPABASE + LOCAL FALLBACK) ====================
    function getDashPlayerName() {
      const saved = (state.profile && state.profile.name && state.profile.name.trim()) || '';
      const meta = (typeof currentAuthUser !== 'undefined' && currentAuthUser && currentAuthUser.user_metadata) || {};
      const guest = (typeof localStorage !== 'undefined' && localStorage.getItem('engstart_dash_nick')) || '';
      return (guest || saved || meta.full_name || meta.name || 'Người chơi ẩn danh').slice(0, 28);
    }

    async function loadDashLeaderboard(lang, force) {
      const targetLang = lang === 'zh' ? 'zh' : 'en';
      if (!ui.dashLbCache) ui.dashLbCache = {};
      if (!force && ui.dashLbCache[targetLang] && (Date.now() - ui.dashLbCache[targetLang].ts < 20000)) {
        return ui.dashLbCache[targetLang];
      }
      ui.dashLbLoading = true;
      let rows = [];
      let online = false;
      try {
        if (typeof sbClient !== 'undefined' && sbClient) {
          const { data, error } = await sbClient
            .from('engstart_leaderboard')
            .select('id, player_name, lang, score, max_combo, created_at')
            .eq('lang', targetLang)
            .order('score', { ascending: false })
            .order('max_combo', { ascending: false })
            .limit(10);
          if (!error && Array.isArray(data)) {
            rows = data;
            online = true;
          }
        }
      } catch {}
      if (!online) {
        const localAll = Array.isArray(state.dashLocalLb) ? state.dashLocalLb : [];
        rows = localAll
          .filter(r => r.lang === targetLang)
          .sort((a, b) => (b.score - a.score) || (b.max_combo - a.max_combo))
          .slice(0, 10);
      }
      ui.dashLbCache[targetLang] = { rows, online, ts: Date.now() };
      ui.dashLbLoading = false;
      if (state.mainNav === 'review' && ui.reviewSubTab === 'dash') renderReviewPage();
      return ui.dashLbCache[targetLang];
    }

    async function submitDashScore(lang, score, maxCombo) {
      if (!score || score <= 0) return;
      const targetLang = lang === 'zh' ? 'zh' : 'en';
      const playerName = getDashPlayerName();
      const entry = {
        id: 'loc_' + Date.now(),
        player_name: playerName,
        lang: targetLang,
        score: Number(score) || 0,
        max_combo: Number(maxCombo) || 0,
        created_at: new Date().toISOString()
      };
      if (!Array.isArray(state.dashLocalLb)) state.dashLocalLb = [];
      const prevBest = state.dashLocalLb.filter(x => x.lang === targetLang).reduce((m, x) => Math.max(m, x.score || 0), 0);
      state.dashLocalLb.push(entry);
      state.dashLocalLb = state.dashLocalLb.sort((a, b) => b.score - a.score).slice(0, 30);
      saveState();

      if (score > prevBest && typeof confetti === 'function') {
        try { confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } }); } catch {}
      }

      try {
        if (typeof sbClient !== 'undefined' && sbClient) {
          const { error } = await sbClient.from('engstart_leaderboard').insert([{
            player_name: playerName,
            lang: targetLang,
            score: entry.score,
            max_combo: entry.max_combo
          }]);
          if (!error) {
            showToast(`🏆 Đã ghi danh ${score} điểm lên Bảng xếp hạng!`);
          }
        }
      } catch {}
      loadDashLeaderboard(targetLang, true);
    }

    function initOqSpeedDash() {
      const lang = ui.oqLang || 'en';
      const pool = getOqPool(lang);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      ui.oqDashActive = true;
      ui.oqDashScore = 0;
      ui.oqDashCombo = 0;
      ui.oqDashBestCombo = 0;
      ui.oqDashLeft = 60;
      ui.oqDashPool = shuffled;
      ui.oqDashIdx = 0;
      ui.oqDashFeedback = '';
      if (window._oqDashTimer) clearInterval(window._oqDashTimer);
      window._oqDashTimer = setInterval(() => {
        if (!ui.oqDashActive || state.mainNav !== 'review' || ui.reviewSubTab !== 'dash') {
          clearInterval(window._oqDashTimer);
          return;
        }
        ui.oqDashLeft = Math.max(0, (ui.oqDashLeft || 0) - 1);
        const timerEl = document.getElementById('oq-dash-timer');
        if (timerEl) timerEl.textContent = ui.oqDashLeft + 's';
        if (ui.oqDashLeft <= 0) {
          ui.oqDashActive = false;
          clearInterval(window._oqDashTimer);
          addXp(Math.min(40, (ui.oqDashScore || 0) * 5), `Hoàn thành Đua tốc độ (+${Math.min(40, (ui.oqDashScore || 0) * 5)} XP)`);
          submitDashScore(ui.oqLang || 'en', ui.oqDashScore || 0, ui.oqDashBestCombo || 0);
          renderReviewPage();
        }
      }, 1000);
    }

    function renderOpenQuizSubSection(subTab) {
      const lang = ui.oqLang || 'en';
      const isZh = lang === 'zh';
      const pool = getOqPool(lang);

      if (subTab === 'translate') {
        const idx = Math.max(0, Math.min(ui.oqTransIdx || 0, pool.length - 1));
        ui.oqTransIdx = idx;
        const item = pool[idx];
        const speakAttr = isZh
          ? `data-speak-zh="${item.exampleTarget.replace(/"/g, '&quot;')}"`
          : `data-speak="${item.exampleTarget.replace(/"/g, '&quot;')}"`;

        return `
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-indigo-600">Học từ nào, nói &amp; dịch từ đó (OpenQuiz)</div>
                <h2 class="text-lg font-extrabold text-slate-900">Luyện dịch câu &amp; đặt câu dùng từ mục tiêu</h2>
              </div>
              <div class="flex items-center gap-2">
                <div class="bg-slate-100 p-1 rounded-xl inline-flex text-xs font-bold">
                  <button type="button" data-oq-lang="en" class="px-3 py-1.5 rounded-lg ${!isZh ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}">Tiếng Anh</button>
                  <button type="button" data-oq-lang="zh" class="px-3 py-1.5 rounded-lg ${isZh ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Tiếng Trung</button>
                </div>
                <button type="button" id="oq-trans-next-btn" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700">Đổi câu khác ↻</button>
              </div>
            </div>

            <div class="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-extrabold ${isZh ? 'text-rose-700' : 'text-indigo-700'}">
                  Từ bắt buộc dùng: ${item.target} (${item.sub})
                </span>
                <span class="text-xs font-semibold text-slate-500">— ${item.vi}</span>
              </div>
              <div class="text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                Dịch câu này sang ${isZh ? 'Tiếng Trung' : 'Tiếng Anh'}: “${item.exampleVi}”
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <button type="button" id="oq-trans-mic-btn" class="w-11 h-11 rounded-xl ${ui.speechListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'} flex items-center justify-center shrink-0" title="Bấm Micro để nói thay vì gõ">
                  <i data-lucide="mic" class="w-5 h-5"></i>
                </button>
                <input type="text" id="oq-trans-input" value="${(ui.oqTransInput || '').replace(/"/g, '&quot;')}" placeholder="${isZh ? 'Gõ chữ Hán hoặc bấm Micro nói...' : 'Gõ câu tiếng Anh hoặc bấm Micro nói...'}" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" id="oq-trans-check-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold">Kiểm tra &amp; Sửa lỗi</button>
                <button type="button" id="oq-trans-idk-btn" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold">Tôi không biết (Xem đáp án)</button>
              </div>
            </div>

            ${ui.oqTransResult ? `
              <div class="p-4 rounded-2xl border ${ui.oqTransResult.pct >= 75 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} space-y-2.5 animate-pop">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold ${ui.oqTransResult.pct >= 75 ? 'text-emerald-800' : 'text-amber-800'}">
                      ${ui.oqTransResult.idk ? 'Đáp án mẫu để bạn ghi nhớ:' : `Độ chính xác: ${ui.oqTransResult.pct}%`}
                    </span>
                    ${ui.oqTransResult.usedTarget ? `<span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓ Đã dùng đúng từ "${item.target}"</span>` : `<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">Chưa thấy từ "${item.target}"</span>`}
                  </div>
                  <button type="button" ${speakAttr} class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 text-xs font-bold flex items-center gap-1">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe câu chuẩn
                  </button>
                </div>
                <div class="text-sm font-extrabold text-slate-900">${item.exampleTarget}</div>
                ${ui.oqTransResult.tokens && ui.oqTransResult.tokens.length ? `
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    ${ui.oqTransResult.tokens.map(t => `<span class="px-2 py-0.5 rounded-md text-xs font-bold ${t.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700 line-through'}">${t.word}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }

      if (subTab === 'reading') {
        const langFilter = ui.oqReadLangFilter || 'all';
        const filteredList = OQ_READING_PASSAGES.map((item, idx) => ({ item, idx }))
          .filter(x => langFilter === 'all' || x.item.lang === langFilter);
        let pIdx = Math.max(0, Math.min(ui.oqReadIdx || 0, OQ_READING_PASSAGES.length - 1));
        if (filteredList.length && !filteredList.some(x => x.idx === pIdx)) {
          pIdx = filteredList[0].idx;
          ui.oqReadIdx = pIdx;
        }
        const p = OQ_READING_PASSAGES[pIdx];
        const posInFiltered = Math.max(0, filteredList.findIndex(x => x.idx === pIdx));
        const prevIdx = filteredList.length ? filteredList[(posInFiltered - 1 + filteredList.length) % filteredList.length].idx : 0;
        const nextIdx = filteredList.length ? filteredList[(posInFiltered + 1) % filteredList.length].idx : 0;
        const fullText = p.before + p.blank + p.after;
        const speakAttr = p.lang === 'zh'
          ? `data-speak-zh="${fullText.replace(/"/g, '&quot;')}"`
          : `data-speak="${fullText.replace(/"/g, '&quot;')}"`;
        const aiLang = ui.oqAiLang || 'en';

        return `
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-emerald-600">Đọc hiểu &amp; Điền từ theo ngữ cảnh · Bài ${posInFiltered + 1}/${filteredList.length}</div>
                <h2 class="text-lg font-extrabold text-slate-900">${p.title} <span class="text-xs font-semibold text-slate-400">(${p.level})</span></h2>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <div class="bg-slate-100 p-0.5 rounded-lg inline-flex text-xs font-bold">
                  <button type="button" data-oq-read-lang="all" class="px-2.5 py-1 rounded-md ${langFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}">Tất cả (${OQ_READING_PASSAGES.length})</button>
                  <button type="button" data-oq-read-lang="en" class="px-2.5 py-1 rounded-md ${langFilter === 'en' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500'}">🇬🇧 Anh</button>
                  <button type="button" data-oq-read-lang="zh" class="px-2.5 py-1 rounded-md ${langFilter === 'zh' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500'}">🇨🇳 Trung</button>
                </div>
                <button type="button" data-oq-read="${prevIdx}" class="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">← Trước</button>
                <button type="button" data-oq-read="${nextIdx}" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">Bài tiếp →</button>
                <button type="button" id="oq-read-random-btn" class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold">🔀 Đổi câu khác</button>
              </div>
            </div>

            <!-- AI Generate New Passage Bar -->
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-sky-50/70 border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-xs font-extrabold text-emerald-800">✨ AI tạo bài mới:</span>
                <button type="button" data-oq-ai-lang="en" class="px-2 py-1 rounded-lg text-[11px] font-bold border ${aiLang === 'en' ? 'bg-sky-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}">Anh</button>
                <button type="button" data-oq-ai-lang="zh" class="px-2 py-1 rounded-lg text-[11px] font-bold border ${aiLang === 'zh' ? 'bg-rose-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}">Trung</button>
              </div>
              <input type="text" id="oq-ai-topic-input" value="${(ui.oqAiTopic || '').replace(/"/g, '&quot;')}" placeholder="Nhập chủ đề (VD: động vật cho bé, đi siêu thị, du lịch...)" class="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500" />
              <button type="button" id="oq-ai-gen-btn" ${ui.oqAiGenerating ? 'disabled' : ''} class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shrink-0 disabled:opacity-60">
                ${ui.oqAiGenerating ? 'Đang tạo bài...' : '✨ Tạo bài đọc'}
              </button>
            </div>

            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500">Nghe đọc đoạn văn và điền từ còn thiếu vào chỗ trống:</span>
                <button type="button" ${speakAttr} class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <i data-lucide="volume-2" class="w-4 h-4"></i> Nghe cả đoạn
                </button>
              </div>
              <p class="text-base sm:text-lg leading-loose text-slate-900 font-medium">
                ${p.before}
                <input type="text" id="oq-read-blank-input" value="${(ui.oqReadBlank || '').replace(/"/g, '&quot;')}" placeholder="điền từ..." class="inline-block w-32 px-2.5 py-0.5 mx-1 rounded-lg border-2 ${ui.oqReadBlankOk === true ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : (ui.oqReadBlankOk === false ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-indigo-300 bg-white')} font-extrabold text-center text-sm outline-none" />
                ${p.after}
              </p>
              ${p.pinyin ? `<div class="text-xs font-mono text-rose-600">${p.pinyin}</div>` : ''}
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" id="oq-read-check-blank" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Kiểm tra từ điền</button>
                <button type="button" id="oq-read-toggle-vi" class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold">${ui.oqReadShowVi ? 'Ẩn dịch Việt' : 'Xem dịch Việt'}</button>
                ${ui.oqReadBlankOk === false ? `<span class="text-xs font-bold text-rose-600">Gợi ý đáp án: ${p.blank}</span>` : ''}
                ${ui.oqReadBlankOk === true ? `<span class="text-xs font-bold text-emerald-700">✓ Chính xác! (+10 XP)</span>` : ''}
              </div>
              ${ui.oqReadShowVi ? `<div class="text-xs text-slate-600 pt-2 border-t border-slate-200">${p.vi}</div>` : ''}
            </div>

            <!-- Comprehension Question -->
            <div class="space-y-2.5">
              <div class="text-sm font-extrabold text-slate-900">Câu hỏi đọc hiểu: ${p.question}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${p.options.map((opt, idx) => {
                  const picked = ui.oqReadQuizPicked;
                  let cls = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                  if (picked !== null && picked !== undefined) {
                    if (idx === p.correctIdx) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    else if (picked === idx) cls = 'bg-rose-50 border-rose-300 text-rose-800';
                  }
                  return `<button type="button" data-oq-read-pick="${idx}" class="text-left p-3 rounded-xl border text-xs sm:text-sm transition-all ${cls}">${opt}</button>`;
                }).join('')}
              </div>
              ${ui.oqReadQuizPicked !== null && ui.oqReadQuizPicked !== undefined ? `
                <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <strong>Giải thích:</strong> ${p.explanation}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      if (subTab === 'dash') {
        const active = Boolean(ui.oqDashActive);
        const curPool = ui.oqDashPool || pool;
        const curItem = curPool[(ui.oqDashIdx || 0) % curPool.length];
        const distractors = pool.filter(x => x.target !== curItem.target).sort(() => Math.random() - 0.5).slice(0, 3);
        const choices = [curItem, ...distractors].sort((a, b) => a.target.localeCompare(b.target));

        return `
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-amber-600">Mini-game phản xạ 60 giây (Speed Dash)</div>
                <h2 class="text-lg font-extrabold text-slate-900">Đua Tốc Độ Từ Vựng</h2>
              </div>
              <div class="flex items-center gap-2">
                <div class="bg-slate-100 p-1 rounded-xl inline-flex text-xs font-bold">
                  <button type="button" data-oq-lang="en" class="px-3 py-1.5 rounded-lg ${!isZh ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}">Tiếng Anh</button>
                  <button type="button" data-oq-lang="zh" class="px-3 py-1.5 rounded-lg ${isZh ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Tiếng Trung</button>
                </div>
                <button type="button" id="oq-dash-start-btn" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">
                  ${active ? 'Chơi lại' : 'Bắt đầu 60s ▶'}
                </button>
              </div>
            </div>

            ${!active ? `
              <div class="p-8 text-center space-y-3 bg-amber-50/40 rounded-2xl border border-amber-100">
                <div class="text-3xl font-extrabold text-slate-900">${ui.oqDashScore ? `Kết quả vừa rồi: ${ui.oqDashScore} điểm!` : 'Sẵn sàng thử phản xạ 60 giây?'}</div>
                <p class="text-sm text-slate-600 max-w-md mx-auto">Chọn nhanh từ tương ứng với nghĩa tiếng Việt trước khi hết giờ. Càng chọn đúng liên tiếp, Combo càng cao và nhận thưởng XP ngay!</p>
                <button type="button" id="oq-dash-start-btn-2" class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-xs">Bắt đầu chơi ngay</button>
              </div>
            ` : `
              <div class="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold">
                <span>Điểm: <strong class="text-amber-400 text-base">${ui.oqDashScore || 0}</strong></span>
                <span>Combo: <strong class="text-emerald-400">x${ui.oqDashCombo || 0}</strong></span>
                <span>Thời gian: <strong id="oq-dash-timer" class="text-rose-400 text-base">${ui.oqDashLeft || 0}s</strong></span>
              </div>

              <div class="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center space-y-1">
                <div class="text-xs font-bold uppercase text-indigo-600">Chọn từ đúng với nghĩa sau:</div>
                <div class="text-2xl font-extrabold text-slate-900">${curItem.vi}</div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${choices.map(c => `
                  <button type="button" data-oq-dash-pick="${c.target === curItem.target ? '1' : '0'}" class="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all">
                    <div class="font-extrabold text-base text-slate-900">${c.target}</div>
                    <div class="text-xs text-slate-500">${c.sub}</div>
                  </button>
                `).join('')}
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold ${ui.oqDashFeedback && ui.oqDashFeedback.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}">${ui.oqDashFeedback || ''}</span>
                <button type="button" data-oq-dash-pick="0" class="text-xs font-bold text-slate-500 hover:text-slate-800 underline">Tôi không biết (Bỏ qua)</button>
              </div>
            `}
          
            <!-- 🏆 Bảng Xếp Hạng Đua Tốc Độ 60s -->
            <div class="pt-4 border-t border-slate-100 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-base">🏆</span>
                  <div>
                    <div class="text-sm font-extrabold text-slate-900">Bảng Xếp Hạng ${isZh ? 'Tiếng Trung' : 'Tiếng Anh'} (Top 10)</div>
                    ${(ui.dashLbCache && ui.dashLbCache[lang] && ui.dashLbCache[lang].online) ? '<div class="text-[11px] text-emerald-700 font-semibold">🟢 Đồng bộ trực tuyến mọi người chơi</div>' : ''}
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <input type="text" id="dash-nick-input" value="${getDashPlayerName().replace(/"/g, '&quot;')}" maxlength="24" placeholder="Tên thi đấu..." class="w-32 sm:w-40 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-amber-500" />
                  <button type="button" id="dash-lb-refresh" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">🔄 Làm mới</button>
                </div>
              </div>

              ${(() => {
                const cached = ui.dashLbCache && ui.dashLbCache[lang];
                if (!cached && !ui.dashLbLoading) {
                  setTimeout(() => loadDashLeaderboard(lang, false), 50);
                }
                const rows = (cached && cached.rows) || [];
                const myName = getDashPlayerName().toLowerCase();
                if (!rows.length) {
                  return `<div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">Chưa có điểm nào ở mục ${isZh ? 'Tiếng Trung' : 'Tiếng Anh'}. Hãy bấm <strong>Bắt đầu chơi ngay</strong> để lên Top 1 đầu tiên nhé!</div>`;
                }
                const medals = ['🥇', '🥈', '🥉'];
                return `
                  <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
                    ${rows.map((r, i) => {
                      const isMe = String(r.player_name || '').toLowerCase() === myName;
                      return `
                        <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm ${isMe ? 'bg-amber-50/70' : (i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white')}">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <span class="w-6 text-center font-extrabold shrink-0 ${i < 3 ? 'text-base' : 'text-xs text-slate-400'}">${medals[i] || ('#' + (i + 1))}</span>
                            <span class="font-extrabold text-slate-900 truncate">${(r.player_name || 'Ẩn danh').replace(/</g, '&lt;')}</span>
                            ${isMe ? '<span class="px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-extrabold shrink-0">Bạn</span>' : ''}
                          </div>
                          <div class="flex items-center gap-3 shrink-0">
                            <span class="text-[11px] font-bold text-orange-600">🔥 x${r.max_combo || 0}</span>
                            <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">${r.score || 0} điểm</span>
                          </div>
                        </div>`;
                    }).join('')}
                  </div>`;
              })()}
            </div>
          </div>
        `;
      }
      return '';
    }

    function renderReviewPage() {
      const el = document.getElementById('page-review');
      if (!el) return;
      const { due, learning, mastered } = getSrsBuckets();
      const subTab = ui.reviewSubTab || 'srs';

      const switcherHtml = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 flex flex-wrap items-center gap-1.5">
          <button type="button" data-review-subtab="srs" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'srs' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">Lịch ôn SRS (${due.length})</button>
          <button type="button" data-review-subtab="translate" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'translate' ? 'bg-violet-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">Dịch &amp; Đặt câu</button>
          <button type="button" data-review-subtab="reading" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'reading' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">Đọc hiểu điền từ</button>
          <button type="button" data-review-subtab="dash" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${subTab === 'dash' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">Game Đua tốc độ 60s</button>
        </div>
      `;

      if (subTab !== 'srs') {
        el.innerHTML = switcherHtml + renderOpenQuizSubSection(subTab);
        refreshIcons();
        return;
      }

      el.innerHTML = switcherHtml + `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-indigo-600">Lặp lại ngắt quãng (Spaced Repetition)</div>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-0.5">Kho Ôn Tập Thông Minh SRS</h1>
            <p class="text-sm text-slate-600 mt-1">Tự động nhắc ôn những từ bạn sắp quên đúng thời điểm (Hôm nay → 1 ngày → 3 ngày → 14 ngày).</p>
          </div>
          ${due.length > 0 ? `
            <button type="button" id="start-srs-due-btn" class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs flex items-center gap-2 shrink-0">
              <i data-lucide="play" class="w-4 h-4 fill-current"></i> Ôn ngay ${due.length} từ đến hạn
            </button>
          ` : ''}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs">
            <div class="text-xs font-bold uppercase text-rose-600">Cần ôn hôm nay</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">${due.length} <span class="text-sm font-semibold text-slate-400">từ</span></div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
            <div class="text-xs font-bold uppercase text-amber-600">Đang ghi nhớ (1–7 ngày)</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">${learning.length} <span class="text-sm font-semibold text-slate-400">từ</span></div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
            <div class="text-xs font-bold uppercase text-emerald-600">Đã thành thạo (14 ngày)</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">${mastered.length} <span class="text-sm font-semibold text-slate-400">từ</span></div>
          </div>
        </div>

        ${(due.length + learning.length + mastered.length) === 0 ? `
          <div class="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto"><i data-lucide="brain" class="w-7 h-7"></i></div>
            <h3 class="text-base font-bold text-slate-800">Chưa có từ nào trong lịch SRS</h3>
            <p class="text-sm text-slate-500 max-w-md mx-auto">Hãy vào <strong>Lộ trình</strong> và học thử Bài 01. Mỗi thẻ bạn chấm điểm (Quên / Khó / Tốt / Dễ) sẽ tự động được xếp lịch ôn tại đây!</p>
            <button type="button" data-main-nav="roadmap" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Bắt đầu học thẻ ngay</button>
          </div>
        ` : `
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-slate-900">Danh sách từ đã đưa vào SRS (${due.length + learning.length + mastered.length})</h2>
              ${learning.length + mastered.length > 0 ? `<button type="button" id="start-srs-all-btn" class="text-xs font-bold text-indigo-600 hover:underline">Ôn lại toàn bộ</button>` : ''}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${[...due, ...learning, ...mastered].map(w => {
                const isDue = w.srs.nextReview <= Date.now() || w.srs.box === 0;
                const daysLeft = Math.max(0, Math.ceil((w.srs.nextReview - Date.now()) / DAY_MS));
                return `
                  <div class="p-4 rounded-xl border ${isDue ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/70 border-slate-200/80'} flex items-start justify-between gap-2">
                    <div>
                      <div class="font-extrabold text-slate-900">${w.en} <span class="text-xs font-normal text-indigo-600">${w.ipa}</span></div>
                      <div class="text-xs font-bold text-emerald-700 mt-0.5">${w.vi}</div>
                      <div class="text-[11px] mt-1.5 font-semibold ${isDue ? 'text-rose-600' : 'text-slate-500'}">
                        ${isDue ? 'Đến hạn ôn ngay hôm nay' : `Ôn lại sau ${daysLeft} ngày (Hộp ${w.srs.box}/4)`}
                      </div>
                    </div>
                    <button type="button" data-speak="${w.en}" class="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}
      `;
      refreshIcons();
    }


    // ==================== 10K COMMUNICATION VOCAB BANK ENGINE ====================
    function getFullVocabBank() {
      const seen = new Set();
      const list = [];
      if (ui.bankLang === 'zh') {
        ZH_TOPICS.forEach(t => t.words.forEach(w => {
          if (!seen.has(w.hanzi)) {
            seen.add(w.hanzi);
            list.push({ id: w.id, en: w.hanzi, ipa: w.pinyin, pos: t.title, vi: w.vi, level: 'HSK1', isZh: true, exEn: w.exZh, exVi: w.exVi });
          }
        }));
        if (typeof EXTRA_ZH_WORDS !== 'undefined' && Array.isArray(EXTRA_ZH_WORDS)) {
          EXTRA_ZH_WORDS.forEach((row, idx) => {
            if (row[0] && !seen.has(row[0])) {
              seen.add(row[0]);
              list.push({ id: 'zhbk_' + idx, en: row[0], ipa: row[1] || '', pos: row[2] || 'từ vựng', vi: row[3] || '', level: row[4] || 'HSK2', isZh: true });
            }
          });
        }
        if (Array.isArray(state.zhCustomBankWords)) {
          state.zhCustomBankWords.forEach((row, idx) => {
            if (row.en && !seen.has(row.en)) {
              seen.add(row.en);
              list.push({ id: 'zhimp_' + idx, en: row.en, ipa: row.ipa || '', pos: row.pos || 'giao tiếp', vi: row.vi || '', level: row.level || 'HSK3', isZh: true });
            }
          });
        }
        return list;
      }

      ALL_WORDS.forEach(w => {
        const key = w.en.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: w.id, en: w.en, ipa: w.ipa, pos: w.pos, vi: w.vi, level: 'A1',
            usage: w.usage, exEn: w.exEn, exBlank: w.exBlank, exVi: w.exVi, topicId: w.topicId
          });
        }
      });
      if (typeof EXTRA_COMM_WORDS !== 'undefined' && Array.isArray(EXTRA_COMM_WORDS)) {
        EXTRA_COMM_WORDS.forEach((row, idx) => {
          const key = String(row[0] || '').toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push({
              id: 'bk_' + idx, en: row[0], ipa: row[1] || '', pos: row[2] || 'từ vựng',
              vi: row[3] || '', level: row[4] || 'A2',
              usage: `Từ giao tiếp thông dụng (${row[2] || 'cơ bản'}) — cấp độ ${row[4] || 'A2'}.`,
              exEn: `I use the word "${row[0]}" in daily conversation.`,
              exBlank: `I use the word "____" in daily conversation.`,
              exVi: `Tôi dùng từ "${row[3]}" trong giao tiếp hằng ngày.`,
              topicId: 'greeting'
            });
          }
        });
      }
      if (Array.isArray(state.customBankWords)) {
        state.customBankWords.forEach((row, idx) => {
          const key = String(row.en || '').toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push({
              id: 'imp_' + idx, en: row.en, ipa: row.ipa || '', pos: row.pos || 'giao tiếp',
              vi: row.vi || '', level: row.level || 'B1',
              usage: 'Từ vựng bạn đã nạp thêm vào kho giao tiếp.',
              exEn: row.exEn || row.en, exBlank: row.exEn || '____', exVi: row.vi || '',
              topicId: 'greeting'
            });
          }
        });
      }
      return list;
    }

    function renderBankPage() {
      const el = document.getElementById('page-bank');
      if (!el) return;
      if (window.EngStartVocabulary && !ui.bankLegacy) {
        window.EngStartVocabulary.render(el, {
          lang: ui.bankLang === 'zh' ? 'zh' : 'en',
          getState: () => state,
          getBank: () => getFullVocabBank(),
          setLang: value => { ui.bankLang = value; updateHeader(); },
          save: () => saveState(),
          reward: xp => addXp(xp),
          toast: showToast,
          stopOtherAudio: () => { stopIpaAudio(); try { window.speechSynthesis?.cancel(); } catch (_) {} },
          legacy: () => { window.EngStartVocabulary.leave(); ui.bankLegacy = true; renderBankPage(); }
        });
        return;
      }
      renderLegacyBankPage();
      if (window.EngStartVocabulary) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm';
        back.textContent = '← Thư viện từ vựng mới';
        back.addEventListener('click', () => { ui.bankLegacy = false; renderBankPage(); });
        el.prepend(back);
      }
    }

    function renderLegacyBankPage() {
      const el = document.getElementById('page-bank');
      if (!el) return;
      const isZh = ui.bankLang === 'zh';
      const bank = getFullVocabBank();
      const learnedArr = isZh ? (state.zhBankLearnedIds || []) : (state.bankLearnedIds || []);
      const learnedSet = new Set(learnedArr);
      const dailySize = state.bankDailySize || 15;
      const totalDays = Math.max(1, Math.ceil(bank.length / dailySize));
      const curDay = Math.min(Math.max(1, ui.bankDay || 1), totalDays);
      ui.bankDay = curDay;

      const dayStart = (curDay - 1) * dailySize;
      const dayWords = bank.slice(dayStart, dayStart + dailySize);
      const dayLearnedCount = dayWords.filter(w => learnedSet.has(w.id)).length;

      const q = (ui.bankSearch || '').trim().toLowerCase();
      let filtered = ui.bankViewMode === 'day' ? dayWords : bank;
      if (q) {
        filtered = bank.filter(w => w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q) || (w.ipa && w.ipa.toLowerCase().includes(q)));
      }
      if (ui.bankFilter === 'learned') filtered = filtered.filter(w => learnedSet.has(w.id));
      else if (ui.bankFilter === 'unlearned') filtered = filtered.filter(w => !learnedSet.has(w.id));
      else if (['A1', 'A2', 'B1', 'HSK1', 'HSK2', 'HSK3'].includes(ui.bankFilter)) filtered = filtered.filter(w => w.level === ui.bankFilter);

      const pageSize = 24;
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const curPage = Math.min(Math.max(1, ui.bankPage || 1), totalPages);
      ui.bankPage = curPage;
      const pageItems = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

      const totalLearned = bank.filter(w => learnedSet.has(w.id)).length;
      const pct = bank.length ? Math.round((totalLearned / bank.length) * 100) : 0;
      const levels = isZh ? ['HSK1', 'HSK2', 'HSK3'] : ['A1', 'A2', 'B1'];

      el.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="bg-slate-100 p-1 rounded-xl inline-flex text-xs font-bold">
                  <button type="button" data-bank-lang="en" class="px-3 py-1.5 rounded-lg ${!isZh ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}">Kho Tiếng Anh</button>
                  <button type="button" data-bank-lang="zh" class="px-3 py-1.5 rounded-lg ${isZh ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Kho Tiếng Trung</button>
                </div>
                <span class="px-2.5 py-1 rounded-full ${isZh ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'} text-[11px] font-bold uppercase tracking-wider">Mở rộng tới 10.000 từ</span>
              </div>
              <h1 class="text-2xl font-extrabold text-slate-900 mt-2">Kho ${isZh ? 'Tiếng Trung' : 'Tiếng Anh'} Giao Tiếp (${bank.length.toLocaleString('vi-VN')} từ sẵn sàng)</h1>
              <p class="text-sm text-slate-600 mt-1">Chia nhỏ theo từng ngày để học mỗi ngày 1 ít. Hỗ trợ nạp thêm tệp CSV/JSON lên tới 10.000+ từ.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              ${!isZh ? `
                <button type="button" id="bank-study-day-btn" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5">
                  <i data-lucide="play" class="w-4 h-4 fill-current"></i> Học Flashcard Ngày ${curDay}
                </button>
              ` : ''}
              <label class="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="upload" class="w-4 h-4"></i> Nạp thêm CSV/JSON
                <input type="file" id="bank-import-input" accept=".csv,.json,.txt" class="hidden" />
              </label>
              <button type="button" id="bank-sample-csv-btn" class="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Mẫu CSV</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-100 items-center">
            <div class="md:col-span-5 space-y-1.5">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-slate-600">Đã thuộc: <strong>${totalLearned}/${bank.length}</strong> từ</span>
                <span class="${isZh ? 'text-rose-600' : 'text-indigo-600'}">${pct}%</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r ${isZh ? 'from-rose-500 to-amber-500' : 'from-indigo-500 to-emerald-500'} rounded-full transition-all" style="width: ${pct}%"></div>
              </div>
            </div>
            <div class="md:col-span-7 flex flex-wrap items-center justify-start md:justify-end gap-2">
              <span class="text-xs font-semibold text-slate-500">Mục tiêu/ngày:</span>
              <div class="bg-slate-100 p-1 rounded-xl inline-flex text-xs font-bold">
                ${[10, 15, 20, 30].map(sz => `<button type="button" data-bank-size="${sz}" class="px-2.5 py-1 rounded-lg ${dailySize === sz ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}">${sz} từ</button>`).join('')}
              </div>
              <div class="flex items-center gap-1.5 ml-1">
                <button type="button" id="bank-prev-day" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                <span class="px-3 py-1 rounded-lg ${isZh ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'} text-xs font-extrabold">Ngày ${curDay}/${totalDays} (${dayLearnedCount}/${dayWords.length})</span>
                <button type="button" id="bank-next-day" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <input type="text" id="bank-search-input" value="${(ui.bankSearch || '').replace(/"/g, '&quot;')}" placeholder="Tìm nhanh từ vựng, pinyin/phiên âm hoặc tiếng Việt..." class="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm" />
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" data-bank-mode="day" class="px-3 py-1.5 rounded-lg text-xs font-bold ${ui.bankViewMode === 'day' && !q ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}">Chỉ Ngày ${curDay}</button>
            <button type="button" data-bank-mode="all" class="px-3 py-1.5 rounded-lg text-xs font-bold ${ui.bankViewMode === 'all' || q ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}">Toàn bộ kho</button>
            ${['all', 'unlearned', 'learned', ...levels].map(f => {
              const lbl = f === 'all' ? 'Mọi cấp' : f === 'unlearned' ? 'Chưa thuộc' : f === 'learned' ? 'Đã thuộc' : f;
              return `<button type="button" data-bank-filter="${f}" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold ${ui.bankFilter === f ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'}">${lbl}</button>`;
            }).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${pageItems.length === 0 ? `<div class="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">Không tìm thấy từ nào phù hợp bộ lọc.</div>` : pageItems.map((w, i) => {
            const isDone = learnedSet.has(w.id);
            const globalNum = (curPage - 1) * pageSize + i + 1;
            return `
              <div class="bg-white rounded-2xl border ${isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'} p-4 flex items-start justify-between gap-2.5 hover:border-indigo-200 transition-colors">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-bold text-slate-400">#${globalNum}</span>
                    <span class="text-base font-extrabold text-slate-900">${w.en}</span>
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">${w.level}</span>
                  </div>
                  <div class="text-xs ${w.isZh ? 'text-rose-600' : 'text-indigo-600'} font-medium">${w.ipa} <span class="text-slate-400">· ${w.pos}</span></div>
                  <div class="text-sm font-bold text-emerald-700 mt-1">${w.vi}</div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button type="button" ${w.isZh ? `data-speak-zh="${w.en}"` : `data-speak="${w.en}"`} title="Nghe" class="p-2 rounded-lg ${w.isZh ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                  <button type="button" data-bank-toggle="${w.id}" class="p-2 rounded-lg border transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600'}"><i data-lucide="check" class="w-4 h-4"></i></button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${totalPages > 1 ? `
          <div class="flex items-center justify-center gap-2 pt-2">
            <button type="button" id="bank-prev-page" ${curPage <= 1 ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold disabled:opacity-40">Trang trước</button>
            <span class="text-xs font-bold text-slate-600">Trang ${curPage} / ${totalPages} (${filtered.length} từ)</span>
            <button type="button" id="bank-next-page" ${curPage >= totalPages ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold disabled:opacity-40">Trang sau</button>
          </div>
        ` : ''}
      `;
      refreshIcons();
    }

    // ==================== AI TEACHER (CÔ SARAH) ENGINE ====================
    const AI_SCENARIOS = [
      {
        id: 'intro', title: 'Chào hỏi & Giới thiệu bản thân', level: 'A0 · Dễ nhất',
        greetingEn: "Hello! I am Teacher Sarah. Nice to meet you! What is your name?",
        greetingVi: "Xin chào! Cô là giáo viên Sarah. Rất vui được gặp bạn! Bạn tên là gì?",
        suggestions: ["My name is Minh.", "Hello Sarah! I am Linh.", "Nice to meet you too!"],
        turns: [
          {
            replyEn: "Nice to meet you! Where are you from?",
            replyVi: "Rất vui được gặp bạn! Bạn đến từ đâu?",
            suggestions: ["I am from Vietnam.", "I live in Ho Chi Minh City.", "I am from Hanoi."]
          },
          {
            replyEn: "Vietnam is a wonderful country! What do you like to do in your free time?",
            replyVi: "Việt Nam là một đất nước tuyệt vời! Bạn thích làm gì vào thời gian rảnh?",
            suggestions: ["I like listening to music.", "I love drinking coffee and reading.", "I play football with my friends."]
          },
          {
            replyEn: "That sounds fun! Why do you want to learn English?",
            replyVi: "Nghe thật thú vị! Tại sao bạn muốn học tiếng Anh?",
            suggestions: ["I want to travel and make friends.", "I need English for my job.", "I want to speak English confidently."]
          },
          {
            replyEn: "You are doing a great job today! Keep practicing 15 minutes every day. Would you like to try another topic?",
            replyVi: "Hôm nay bạn làm rất tốt! Hãy duy trì luyện 15 phút mỗi ngày nhé. Bạn có muốn thử chủ đề khác không?",
            suggestions: ["Yes, thank you Teacher Sarah!", "I am very happy to practice with you."]
          }
        ]
      },
      {
        id: 'cafe', title: 'Gọi đồ uống ở quán cà phê', level: 'A0 · Đời sống',
        greetingEn: "Good morning! Welcome to EngStart Cafe. What would you like to order today?",
        greetingVi: "Chào buổi sáng! Chào mừng đến EngStart Cafe. Hôm nay bạn muốn gọi món gì?",
        suggestions: ["Can I have an iced coffee, please?", "I want a cup of tea.", "Can I see the menu, please?"],
        turns: [
          {
            replyEn: "Sure! Would you like it with milk and sugar, or black?",
            replyVi: "Vâng ạ! Bạn muốn dùng kèm sữa đường hay uống đen không đường?",
            suggestions: ["With milk and a little sugar, please.", "Black coffee, no sugar please.", "Iced milk coffee, please!"]
          },
          {
            replyEn: "Great choice! Would you like anything to eat, like a croissant or cake?",
            replyVi: "Lựa chọn tuyệt vời! Bạn có muốn dùng thêm đồ ăn như bánh sừng bò hay bánh ngọt không?",
            suggestions: ["No, thank you.", "Yes, one croissant please.", "How much is the cake?"]
          },
          {
            replyEn: "Your total is 3 dollars. Would you like to pay by card or in cash?",
            replyVi: "Tổng của bạn là 3 đô la. Bạn muốn thanh toán bằng thẻ hay tiền mặt?",
            suggestions: ["Can I pay by card?", "I will pay in cash.", "Here you are. Thank you!"]
          },
          {
            replyEn: "Thank you so much! Here is your drink. Have a wonderful day!",
            replyVi: "Cảm ơn bạn rất nhiều! Đồ uống của bạn đây. Chúc bạn một ngày tuyệt vời!",
            suggestions: ["Thank you! Goodbye!", "You too, have a nice day!"]
          }
        ]
      },
      {
        id: 'travel', title: 'Du lịch & Hỏi đường', level: 'A1 · Du lịch',
        greetingEn: "Hello! You look a little lost. Can I help you find a place?",
        greetingVi: "Xin chào! Trông bạn có vẻ đang tìm đường. Mình có thể giúp bạn tìm chỗ nào không?",
        suggestions: ["Excuse me, where is the hotel?", "I am looking for the nearest bus stop.", "How do I get to the airport?"],
        turns: [
          {
            replyEn: "Oh, it is quite close! Go straight ahead for two minutes, then turn right.",
            replyVi: "Ồ, chỗ đó khá gần! Bạn cứ đi thẳng khoảng hai phút rồi rẽ phải nhé.",
            suggestions: ["Is it far from here?", "Should I walk or take a taxi?", "Thank you so much!"]
          },
          {
            replyEn: "You can easily walk there in five minutes. You will see a big bank on your left.",
            replyVi: "Bạn có thể đi bộ dễ dàng mất 5 phút. Bạn sẽ thấy một ngân hàng lớn ở bên trái.",
            suggestions: ["Got it! Thank you for your help.", "Can you speak slowly, please?", "You are very kind!"]
          },
          {
            replyEn: "You are very welcome! Enjoy your trip!",
            replyVi: "Không có gì đâu! Chúc bạn có chuyến du lịch vui vẻ nhé!",
            suggestions: ["Goodbye, have a great day!", "Thank you!"]
          }
        ]
      },
      {
        id: 'interview', title: 'Phỏng vấn xin việc cơ bản', level: 'A2 · Người lớn',
        greetingEn: "Good afternoon! Thank you for coming today. Could you tell me a little about yourself?",
        greetingVi: "Chào buổi chiều! Cảm ơn bạn đã đến hôm nay. Bạn có thể giới thiệu một chút về bản thân không?",
        suggestions: ["My name is Minh and I have three years of experience.", "I am a hard-working and friendly person.", "I work in sales and I love helping customers."],
        turns: [
          {
            replyEn: "That is great! What are your strongest skills for this position?",
            replyVi: "Tuyệt lắm! Kỹ năng mạnh nhất của bạn cho vị trí này là gì?",
            suggestions: ["I have good communication and teamwork skills.", "I learn very fast and stay calm under pressure.", "I am good at solving problems."]
          },
          {
            replyEn: "Impressive! Why do you want to work for our company?",
            replyVi: "Ấn tượng đấy! Tại sao bạn muốn làm việc cho công ty chúng tôi?",
            suggestions: ["I want to grow my career and learn new skills.", "Your company has a great team and culture.", "I want to contribute to your projects."]
          },
          {
            replyEn: "Thank you for your thoughtful answers! We will contact you by email next week.",
            replyVi: "Cảm ơn những câu trả lời chu đáo của bạn! Chúng tôi sẽ liên hệ qua email vào tuần tới.",
            suggestions: ["Thank you for your time! I look forward to hearing from you.", "Have a nice day!"]
          }
        ]
      },
      {
        id: 'kids_fun', title: 'Trò chuyện vui cho Bé (Màu sắc & Thú cưng)', level: 'A0 · Thiếu nhi',
        greetingEn: "Hi little friend! I am Teacher Sarah. What is your favorite color?",
        greetingVi: "Chào bạn nhỏ! Cô là cô Sarah. Màu sắc yêu thích của con là màu gì?",
        suggestions: ["My favorite color is blue!", "I like pink and yellow.", "I love red!"],
        turns: [
          {
            replyEn: "Ooh, that is a super pretty color! Do you like animals? What is your favorite animal?",
            replyVi: "Ôi màu đó đẹp quá! Con có thích động vật không? Con thích con vật nào nhất?",
            suggestions: ["I love cute dogs!", "My favorite animal is a cat.", "I like rabbits and elephants."]
          },
          {
            replyEn: "Awesome! Can you count from one to five in English for me?",
            replyVi: "Tuyệt vời! Con có thể đếm từ 1 đến 5 bằng tiếng Anh cho cô nghe không?",
            suggestions: ["One, two, three, four, five!", "I can count to ten!"]
          },
          {
            replyEn: "Yay! High five! You are a superstar today!",
            replyVi: "Hoan hô! Đập tay nào! Hôm nay con là một siêu sao đấy!",
            suggestions: ["Thank you Teacher Sarah!", "I am very happy!"]
          }
        ]
      }
    ];

    function checkBasicVietnameseMistakes(userText) {
      const t = (userText || '').trim();
      const lower = t.toLowerCase();
      if (/\bi\s+(happy|sad|tired|hungry|busy|fine|good|ready|sorry|excited)\b/.test(lower)) {
        const adj = lower.match(/\bi\s+(happy|sad|tired|hungry|busy|fine|good|ready|sorry|excited)\b/)[1];
        return `Mẹo ngữ pháp: Trước tính từ "${adj}" nhớ thêm "am" nhé → "I am ${adj}."`;
      }
      if (/\bi\s+from\b/.test(lower)) {
        return 'Mẹo ngữ pháp: Nhớ thêm động từ "am" → "I am from Vietnam."';
      }
      if (/\bi\s+very\s+like\b/.test(lower)) {
        return 'Mẹo tự nhiên: Người bản xứ nói "I really like..." hoặc "I like ... very much" thay vì "I very like".';
      }
      if (/\b(he|she)\s+go\b/.test(lower)) {
        return 'Mẹo ngữ pháp: Với "He/She" ở thì hiện tại đơn, nhớ chia thành "goes" nhé!';
      }
      if (/\bthank\b/.test(lower) && !/\bthank\s+you\b|\bthanks\b/.test(lower)) {
        return 'Mẹo giao tiếp: Nên nói đầy đủ "Thank you" hoặc "Thanks" thay vì chỉ nói "Thank".';
      }
      return '';
    }


    const AI_ZH_SCENARIOS = [
      {
        id: 'zh-intro',
        title: 'Chào hỏi & Giới thiệu bản thân',
        level: 'HSK 1 · Dễ nhất',
        greetingZh: '你好！我是小美老师。很高兴认识你！你叫什么名字？',
        greetingPinyin: 'Nǐ hǎo! Wǒ shì Xiǎoměi lǎoshī. Hěn gāoxìng rènshi nǐ! Nǐ jiào shénme míngzi?',
        greetingVi: 'Xin chào! Cô là giáo viên Tiểu Mỹ. Rất vui được gặp bạn! Bạn tên là gì?',
        suggestions: [
          { zh: '你好，我叫 Minh。', pinyin: 'Nǐ hǎo, wǒ jiào Minh.' },
          { zh: '我叫 Linh，很高兴认识你！', pinyin: 'Wǒ jiào Linh, hěn gāoxìng rènshi nǐ!' },
          { zh: '你好老师！我是越南人。', pinyin: 'Nǐ hǎo lǎoshī! Wǒ shì Yuènán rén.' }
        ],
        turns: [
          {
            replyZh: '很高兴认识你！你是越南人吗？你学习中文多长时间了？',
            pinyin: 'Hěn gāoxìng rènshi nǐ! Nǐ shì Yuènán rén ma? Nǐ xuéxí Zhōngwén duō cháng shíjiān le?',
            replyVi: 'Rất vui được làm quen với bạn! Bạn là người Việt Nam phải không? Bạn học tiếng Trung bao lâu rồi?',
            suggestions: [
              { zh: '对，我是越南人。我刚开始学。', pinyin: 'Duì, wǒ shì Yuènán rén. Wǒ gāng kāishǐ xué.' },
              { zh: '我学了一个月了。', pinyin: 'Wǒ xué le yí ge yuè le.' },
              { zh: '我很喜欢中文！', pinyin: 'Wǒ hěn xǐhuan Zhōngwén!' }
            ]
          },
          {
            replyZh: '太棒了！你的发音很好听。你平时喜欢做什么？',
            pinyin: 'Tài bàng le! Nǐ de fāyīn hěn hǎotīng. Nǐ píngshí xǐhuan zuò shénme?',
            replyVi: 'Tuyệt vời! Phát âm của bạn hay lắm. Bình thường bạn thích làm gì?',
            suggestions: [
              { zh: '我喜欢听音乐和看电影。', pinyin: 'Wǒ xǐhuan tīng yīnyuè hé kàn diànyǐng.' },
              { zh: '我喜欢喝咖啡和看书。', pinyin: 'Wǒ xǐhuan hē kāfēi hé kànshū.' },
              { zh: '我喜欢去旅游。', pinyin: 'Wǒ xǐhuan qù lǚyóu.' }
            ]
          },
          {
            replyZh: '真不错！每天跟我练习十分钟，你的中文一定会越来越好。加油！',
            pinyin: 'Zhēn búcuò! Měitiān gēn wǒ liànxí shí fēnzhōng, nǐ de Zhōngwén yídìng huì yuèláiyuè hǎo. Jiāyóu!',
            replyVi: 'Hay quá! Mỗi ngày luyện với cô 10 phút, tiếng Trung của bạn chắc chắn sẽ ngày càng giỏi hơn. Cố lên nhé!',
            suggestions: [
              { zh: '谢谢老师！我会努力的！', pinyin: 'Xièxie lǎoshī! Wǒ huì nǔlì de!' },
              { zh: '明天见，老师！', pinyin: 'Míngtiān jiàn, lǎoshī!' },
              { zh: '我们再聊别的吧！', pinyin: 'Wǒmen zài liáo bié de ba!' }
            ]
          }
        ]
      },
      {
        id: 'zh-food',
        title: 'Gọi trà sữa & Món ăn',
        level: 'HSK 1 · Đời sống',
        greetingZh: '欢迎光临！请问你想喝点什么？我们有珍珠奶茶和冰美式。',
        greetingPinyin: 'Huānyíng guānglín! Qǐngwèn nǐ xiǎng hē diǎn shénme? Wǒmen yǒu zhēnzhū nǎichá hé bīng měishì.',
        greetingVi: 'Chào mừng quý khách! Xin hỏi bạn muốn uống gì? Quán có trà sữa trân châu và cà phê Mỹ đá.',
        suggestions: [
          { zh: '我要一杯珍珠奶茶。', pinyin: 'Wǒ yào yì bēi zhēnzhū nǎichá.' },
          { zh: '请给我一杯冰咖啡。', pinyin: 'Qǐng gěi wǒ yì bēi bīng kāfēi.' },
          { zh: '奶茶多少钱一杯？', pinyin: 'Nǎichá duōshao qián yì bēi?' }
        ],
        turns: [
          {
            replyZh: '好的！请问要大杯还是中杯？甜度要正常甜还是少糖？',
            pinyin: 'Hǎo de! Qǐngwèn yào dà bēi háishi zhōng bēi? Tiándù yào zhèngcháng tián háishi shǎo táng?',
            replyVi: 'Vâng! Xin hỏi bạn lấy ly lớn hay ly vừa? Độ ngọt bình thường hay ít đường ạ?',
            suggestions: [
              { zh: '大杯，少糖，谢谢！', pinyin: 'Dà bēi, shǎo táng, xièxie!' },
              { zh: '中杯，少冰，半糖。', pinyin: 'Zhōng bēi, shǎo bīng, bàn táng.' },
              { zh: '我要热的，不要冰。', pinyin: 'Wǒ yào rè de, bú yào bīng.' }
            ]
          },
          {
            replyZh: '明白！一共二十五块钱。请问您用微信还是现金支付？',
            pinyin: 'Míngbai! Yígòng èrshíwǔ kuài qián. Qǐngwèn nín yòng Wēixìn háishi xiànjīn zhīfù?',
            replyVi: 'Rõ rồi ạ! Tổng cộng 25 tệ. Xin hỏi bạn thanh toán bằng WeChat hay tiền mặt?',
            suggestions: [
              { zh: '我用微信支付。', pinyin: 'Wǒ yòng Wēixìn zhīfù.' },
              { zh: '我用现金，给你。', pinyin: 'Wǒ yòng xiànjīn, gěi nǐ.' },
              { zh: '请稍等一下，我扫码。', pinyin: 'Qǐng shāoděng yíxià, wǒ sǎomǎ.' }
            ]
          },
          {
            replyZh: '谢谢您！请稍等，您的饮料马上就好。祝您用餐愉快！',
            pinyin: 'Xièxie nín! Qǐng shāoděng, nín de yǐnliào mǎshàng jiù hǎo. Zhù nín yòngcān yúkuài!',
            replyVi: 'Cảm ơn quý khách! Xin đợi một chút, đồ uống của bạn sẽ xong ngay. Chúc bạn ngon miệng!',
            suggestions: [
              { zh: '谢谢，不客气！', pinyin: 'Xièxie, bú kèqi!' },
              { zh: '你们的奶茶真好喝！', pinyin: 'Nǐmen de nǎichá zhēn hǎohē!' }
            ]
          }
        ]
      },
      {
        id: 'zh-shop',
        title: 'Mua sắm & Hỏi giá',
        level: 'HSK 1 · Giao tiếp',
        greetingZh: '你好！欢迎来到我们店。你想买什么衣服？',
        greetingPinyin: 'Nǐ hǎo! Huānyíng láidào wǒmen diàn. Nǐ xiǎng mǎi shénme yīfu?',
        greetingVi: 'Xin chào! Chào mừng đến cửa hàng của chúng tôi. Bạn muốn mua quần áo gì?',
        suggestions: [
          { zh: '我想买一件白色的T恤。', pinyin: 'Wǒ xiǎng mǎi yí jiàn báisè de T-xù.' },
          { zh: '这件衣服多少钱？', pinyin: 'Zhè jiàn yīfu duōshao qián?' },
          { zh: '我可以试穿一下吗？', pinyin: 'Wǒ kěyǐ shìchuān yíxià ma?' }
        ],
        turns: [
          {
            replyZh: '这件一百二十块钱，质量很好！你穿什么尺码？',
            pinyin: 'Zhè jiàn yìbǎi èrshí kuài qián, zhìliàng hěn hǎo! Nǐ chuān shénme chǐmǎ?',
            replyVi: 'Cái này 120 tệ, chất lượng rất tốt! Bạn mặc cỡ nào?',
            suggestions: [
              { zh: '我穿M码。可以便宜一点吗？', pinyin: 'Wǒ chuān M mǎ. Kěyǐ piányi yìdiǎn ma?' },
              { zh: '有没有大一点的？', pinyin: 'Yǒu méiyǒu dà yìdiǎn de?' },
              { zh: '太贵了，九十块可以吗？', pinyin: 'Tài guì le, jiǔshí kuài kěyǐ ma?' }
            ]
          },
          {
            replyZh: '好吧，算你一百块钱！试衣间在那边，你去试试看。',
            pinyin: 'Hǎo ba, suàn nǐ yìbǎi kuài qián! Shìyījiān zài nàbiān, nǐ qù shìshi kàn.',
            replyVi: 'Được rồi, tính bạn 100 tệ nhé! Phòng thử đồ ở đằng kia, bạn vào thử xem.',
            suggestions: [
              { zh: '太好了，我买这件！', pinyin: 'Tài hǎo le, wǒ mǎi zhè jiàn!' },
              { zh: '很合身，谢谢你！', pinyin: 'Hěn héshēn, xièxie nǐ!' }
            ]
          }
        ]
      },
      {
        id: 'zh-travel',
        title: 'Hỏi đường & Du lịch',
        level: 'HSK 2 · Du lịch',
        greetingZh: '你好！你看起来像在找路，请问你想去哪里？',
        greetingPinyin: 'Nǐ hǎo! Nǐ kàn qǐlái xiàng zài zhǎo lù, qǐngwèn nǐ xiǎng qù nǎlǐ?',
        greetingVi: 'Xin chào! Trông bạn như đang tìm đường, xin hỏi bạn muốn đi đâu?',
        suggestions: [
          { zh: '请问，地铁站在哪里？', pinyin: 'Qǐngwèn, dìtiězhàn zài nǎlǐ?' },
          { zh: '去机场怎么走？', pinyin: 'Qù jīchǎng zěnme zǒu?' },
          { zh: '这里附近有餐厅吗？', pinyin: 'Zhèlǐ fùjìn yǒu cāntīng ma?' }
        ],
        turns: [
          {
            replyZh: '一直往前走，到红绿灯那里往左拐，走两分钟就到了！',
            pinyin: 'Yìzhí wǎng qián zǒu, dào hónglǜdēng nàlǐ wǎng zuǒ guǎi, zǒu liǎng fēnzhōng jiù dào le!',
            replyVi: 'Bạn cứ đi thẳng, đến chỗ đèn đỏ rẽ trái, đi 2 phút là tới!',
            suggestions: [
              { zh: '走路要多久？', pinyin: 'Zǒulù yào duō jiǔ?' },
              { zh: '谢谢你，你真热心！', pinyin: 'Xièxie nǐ, nǐ zhēn rèxīn!' },
              { zh: '坐出租车方便吗？', pinyin: 'Zuò chūzūchē fāngbiàn ma?' }
            ]
          },
          {
            replyZh: '很近的，不用坐车。祝你在北京玩得开心！',
            pinyin: 'Hěn jìn de, búyòng zuòchē. Zhù nǐ zài Běijīng wán de kāixīn!',
            replyVi: 'Gần lắm, không cần bắt xe đâu. Chúc bạn chơi vui vẻ ở Bắc Kinh nhé!',
            suggestions: [
              { zh: '谢谢，再见！', pinyin: 'Xièxie, zàijiàn!' },
              { zh: '北京真漂亮！', pinyin: 'Běijīng zhēn piàoliang!' }
            ]
          }
        ]
      }
    ];

    let serverAiEnabled = null;
    async function checkServerAiProxy() {
      if (serverAiEnabled !== null) return serverAiEnabled;
      if (!window.location || !window.location.protocol.startsWith('http')) {
        serverAiEnabled = false;
        return false;
      }
      try {
        const res = await fetch('/api/chat', { method: 'GET' });
        if (!res.ok) { serverAiEnabled = false; return false; }
        const data = await res.json();
        serverAiEnabled = Boolean(data && data.enabled);
        if (serverAiEnabled && state.mainNav === 'tutor') renderAiTutorPage();
        return serverAiEnabled;
      } catch {
        serverAiEnabled = false;
        return false;
      }
    }

    function getActiveGeminiKey() {
      const cfgKey = (window.ENGSTART_CONFIG && window.ENGSTART_CONFIG.GEMINI_API_KEY) || '';
      return (state.geminiApiKey || cfgKey || '').trim();
    }

    function getActiveAiScenarios() {
      return ui.aiLang === 'zh' ? AI_ZH_SCENARIOS : AI_SCENARIOS;
    }

    function initAiChatForScenario(scenarioId) {
      const list = getActiveAiScenarios();
      const sc = list.find(s => s.id === scenarioId) || list[0];
      ui.aiScenarioId = sc.id;
      ui.aiTurnIdx = 0;
      if (ui.aiLang === 'zh') {
        ui.aiMessages = [
          { role: 'ai', text: sc.greetingZh, pinyin: sc.greetingPinyin, vi: sc.greetingVi, tip: '', suggestions: sc.suggestions }
        ];
      } else {
        ui.aiMessages = [
          { role: 'ai', en: sc.greetingEn, vi: sc.greetingVi, tip: '', suggestions: sc.suggestions }
        ];
      }
      ui.aiLoading = false;
      ui.aiInput = '';
    }

    function generateSmartOfflineReply(clean, isZh, sc) {
      const q = (clean || '').trim().toLowerCase();

      if (isZh) {
        // 1. Greeting / intro
        if (/^(ni hao|nihao|xin chao|chao|hello|hi|你好|您好)/i.test(q)) {
          return {
            text: '你好！今天过得怎么样？你想聊点什么话题呀？',
            pinyin: 'Nǐ hǎo! Jīntiān guò de zěnmeyàng? Nǐ xiǎng liáo diǎn shénme huàtí ya?',
            vi: 'Xin chào! Hôm nay bạn thế nào? Bạn muốn trò chuyện về chủ đề gì nào?',
            suggestions: [
              { zh: '我今天很好，谢谢老师！', pinyin: 'Wǒ jīntiān hěn hǎo, xièxie lǎoshī!' },
              { zh: '我想聊聊美食和旅游。', pinyin: 'Wǒ xiǎng liáoliao měishí hé lǚyóu.' },
              { zh: '老师，你叫什么名字？', pinyin: 'Lǎoshī, nǐ jiào shénme míngzi?' }
            ]
          };
        }
        // 2. Asking teacher's name / info
        if (/tên|name|叫什么|who are you|bạn là ai/i.test(q)) {
          return {
            text: '我叫小美，是你的中文老师！你叫什么名字？平时喜欢做什么？',
            pinyin: 'Wǒ jiào Xiǎoměi, shì nǐ de Zhōngwén lǎoshī! Nǐ jiào shénme míngzi? Píngshí xǐhuan zuò shénme?',
            vi: 'Cô tên là Tiểu Mỹ, là giáo viên tiếng Trung của bạn! Bạn tên là gì? Bình thường thích làm gì?',
            suggestions: [
              { zh: '我叫 Minh，很高兴认识你！', pinyin: 'Wǒ jiào Minh, hěn gāoxìng rènshi nǐ!' },
              { zh: '我喜欢听音乐和喝咖啡。', pinyin: 'Wǒ xǐhuan tīng yīnyuè hé hē kāfēi.' }
            ]
          };
        }
        // 3. Name statement ("tên là", "tôi là", "我叫")
        if (/tên là|tôi là|mình là|my name|i am|我叫|我是/i.test(q)) {
          return {
            text: '真好听的名字！很高兴认识你。你今天忙吗？',
            pinyin: 'Zhēn hǎotīng de míngzi! Hěn gāoxìng rènshi nǐ. Nǐ jīntiān máng ma?',
            vi: 'Tên hay quá! Rất vui được làm quen với bạn. Hôm nay bạn có bận không?',
            suggestions: [
              { zh: '今天不太忙，我想练习中文。', pinyin: 'Jīntiān bú tài máng, wǒ xiǎng liànxí Zhōngwén.' },
              { zh: '有点忙，但是很开心！', pinyin: 'Yǒudiǎn máng, dànshì hěn kāixīn!' }
            ]
          };
        }
        // 4. Food / drink / coffee / milk tea
        if (/ăn|uống|cơm|phở|trà sữa|cà phê|đói|khát|eat|drink|food|coffee|吃|喝|奶茶|咖啡/i.test(q)) {
          return {
            text: '我也超喜欢美食！你最喜欢吃什么菜？越南河粉还是中国菜？',
            pinyin: 'Wǒ yě chāo xǐhuan měishí! Nǐ zuì xǐhuan chī shénme cài? Yuènán héfěn háishi Zhōngguó cài?',
            vi: 'Cô cũng cực kỳ thích đồ ăn ngon! Bạn thích ăn món gì nhất? Phở Việt Nam hay món Trung Quốc?',
            suggestions: [
              { zh: '我最喜欢吃越南河粉！', pinyin: 'Wǒ zuì xǐhuan chī Yuènán héfěn!' },
              { zh: '我想喝一杯珍珠奶茶。', pinyin: 'Wǒ xiǎng hē yì bēi zhēnzhū nǎichá.' }
            ]
          };
        }
        // 5. Work / study / tired / busy / mood
        if (/làm việc|công việc|học|mệt|bận|vui|buồn|work|job|tired|busy|happy|工作|累|忙|开心/i.test(q)) {
          return {
            text: '辛苦你了！工作和学习之余，别忘了休息一下哦。周末你常做什么放松？',
            pinyin: 'Xīnkǔ nǐ le! Gōngzuò hé xuéxí zhīyú, bié wàng le xiūxi yíxià o. Zhōumò nǐ cháng zuò shénme fàngsōng?',
            vi: 'Vất vả cho bạn rồi! Ngoài giờ làm và học, đừng quên nghỉ ngơi nhé. Cuối tuần bạn hay làm gì để thư giãn?',
            suggestions: [
              { zh: '周末我喜欢看电影和睡觉。', pinyin: 'Zhōumò wǒ xǐhuan kàn diànyǐng hé shuìjiào.' },
              { zh: '我常跟朋友去喝咖啡。', pinyin: 'Wǒ cháng gēn péngyou qù hē kāfēi.' }
            ]
          };
        }
        // 6. Travel / places / weather
        if (/du lịch|đi chơi|thời tiết|nắng|mưa|trời|travel|weather|旅游|天气|去/i.test(q)) {
          return {
            text: '去旅游最开心了！你最想去中国的哪个城市？北京、上海还是成都？',
            pinyin: 'Qù lǚyóu zuì kāixīn le! Nǐ zuì xiǎng qù Zhōngguó de nǎge chéngshì? Běijīng, Shànghǎi háishi Chéngdū?',
            vi: 'Đi du lịch là vui nhất! Bạn muốn đi thành phố nào của Trung Quốc nhất? Bắc Kinh, Thượng Hải hay Thành Đô?',
            suggestions: [
              { zh: '我想去北京看长城！', pinyin: 'Wǒ xiǎng qù Běijīng kàn Chángchéng!' },
              { zh: '我想去上海吃美食！', pinyin: 'Wǒ xiǎng qù Shànghǎi chī měishí!' }
            ]
          };
        }
        // 7. Asking how to say something or praising/thanking
        if (/cảm ơn|thank|xiexie|谢谢|tạm biệt|bye|再见/i.test(q)) {
          return {
            text: '不客气！随时都可以来找小美老师聊天哦。你还想聊什么？',
            pinyin: 'Bú kèqi! Suíshí dōu kěyǐ lái zhǎo Xiǎoměi lǎoshī liáotiān o. Nǐ hái xiǎng liáo shénme?',
            vi: 'Không có chi! Lúc nào bạn cũng có thể vào trò chuyện với cô Tiểu Mỹ nhé. Bạn còn muốn nói chuyện gì nữa không?',
            suggestions: [
              { zh: '我们聊聊爱好吧！', pinyin: 'Wǒmen liáoliao àihào ba!' },
              { zh: '明天见，老师！', pinyin: 'Míngtiān jiàn, lǎoshī!' }
            ]
          };
        }
        // 8. Conversational fallback (cycles naturally if topic is open)
        const turn = sc.turns[ui.aiTurnIdx % sc.turns.length];
        ui.aiTurnIdx = (ui.aiTurnIdx + 1) % sc.turns.length;
        return {
          text: turn.replyZh,
          pinyin: turn.pinyin,
          vi: turn.replyVi,
          suggestions: turn.suggestions || []
        };
      }

      // English (Teacher Sarah) smart conversational matcher
      if (/^(hello|hi|hey|good morning|good evening|xin chao|chao)/i.test(q)) {
        return {
          en: "Hello! How is your day going today? Feel free to chat with me about anything!",
          vi: "Xin chào! Hôm nay ngày của bạn thế nào? Cứ thoải mái trò chuyện với cô về bất cứ điều gì nhé!",
          suggestions: ["I'm doing great today!", "I'm a bit tired from work.", "Let's talk about food!"]
        };
      }
      if (/your name|who are you|ten la gi|cô tên/i.test(q)) {
        return {
          en: "I'm Teacher Sarah, your friendly English companion! What should I call you?",
          vi: "Cô là giáo viên Sarah, người bạn đồng hành tiếng Anh của bạn! Cô nên gọi bạn là gì nhỉ?",
          suggestions: ["My name is Minh.", "You can call me Linh.", "Nice to meet you, Sarah!"]
        };
      }
      if (/my name|i am|i'm|tên là|tôi là|mình là/i.test(q)) {
        return {
          en: "Lovely to meet you! What do you usually like to do to relax after a busy day?",
          vi: "Rất vui được gặp bạn! Sau một ngày bận rộn, bạn thường thích làm gì để thư giãn?",
          suggestions: ["I like listening to music.", "I enjoy watching movies.", "I like drinking coffee with friends."]
        };
      }
      if (/eat|food|drink|coffee|tea|hungry|ăn|uống|cà phê|trà|đói/i.test(q)) {
        return {
          en: "Mmm, talking about food always makes me smile! What is your favorite dish or drink?",
          vi: "Nói đến đồ ăn là vui rồi! Món ăn hoặc đồ uống yêu thích nhất của bạn là gì?",
          suggestions: ["I love Vietnamese pho!", "I drink iced coffee every morning.", "I like milk tea."]
        };
      }
      if (/work|job|study|tired|busy|happy|sad|làm việc|công việc|mệt|bận|vui|buồn/i.test(q)) {
        return {
          en: "I hear you! Remember to take a short break and be kind to yourself. What are your plans for this weekend?",
          vi: "Cô hiểu mà! Nhớ nghỉ ngơi một chút và chăm sóc bản thân nhé. Cuối tuần này bạn có dự định gì không?",
          suggestions: ["I want to stay home and rest.", "I will hang out with my family.", "I'm going to practice English!"]
        };
      }
      if (/travel|trip|vacation|beach|du lịch|đi chơi/i.test(q)) {
        return {
          en: "Traveling sounds wonderful! If you could visit any country tomorrow, where would you go?",
          vi: "Đi du lịch nghe tuyệt quá! Nếu ngày mai được đi bất kỳ nước nào, bạn muốn đi đâu?",
          suggestions: ["I want to visit Japan.", "I'd love to go to China.", "I want to explore Europe."]
        };
      }
      if (/thank|bye|goodbye|cảm ơn|tạm biệt/i.test(q)) {
        return {
          en: "You're very welcome! Come back and chat anytime you want. Have a wonderful day!",
          vi: "Không có chi! Lúc nào muốn trò chuyện cứ quay lại đây với cô nhé. Chúc bạn một ngày tuyệt vời!",
          suggestions: ["Thank you, Teacher Sarah!", "See you tomorrow!"]
        };
      }

      const turn = sc.turns[ui.aiTurnIdx % sc.turns.length];
      ui.aiTurnIdx = (ui.aiTurnIdx + 1) % sc.turns.length;
      return {
        en: turn.replyEn,
        vi: turn.replyVi,
        suggestions: turn.suggestions || []
      };
    }

    async function sendAiMessage(text) {
      const clean = (text || '').trim();
      if (!clean || ui.aiLoading) return;
      const isZh = ui.aiLang === 'zh';
      const list = getActiveAiScenarios();
      const sc = list.find(s => s.id === ui.aiScenarioId) || list[0];

      // Auto-help if user asks to learn Chinese while in English mode
      if (!isZh && /tiếng trung|hoc trung|tieng trung|ni hao|nihao|[\u4e00-\u9fff]/i.test(clean)) {
        ui.aiMessages.push({ role: 'user', en: clean, tip: '' });
        ui.aiLang = 'zh';
        const zhSc = AI_ZH_SCENARIOS[0];
        ui.aiScenarioId = zhSc.id;
        ui.aiTurnIdx = 0;
        ui.aiMessages.push({
          role: 'ai',
          text: zhSc.greetingZh,
          pinyin: zhSc.greetingPinyin,
          vi: 'Cô đã chuyển sang chế độ Tiếng Trung (Cô Tiểu Mỹ) cho bạn rồi nhé! ' + zhSc.greetingVi,
          tip: 'Mẹo: Bạn có thể bấm nút Tiếng Anh / Tiếng Trung ở góc trên bên trái bất cứ lúc nào.',
          suggestions: zhSc.suggestions
        });
        ui.aiInput = '';
        renderAiTutorPage();
        if (ui.aiAutoSpeak) speakChinese(zhSc.greetingZh);
        return;
      }

      const grammarTip = isZh ? '' : checkBasicVietnameseMistakes(clean);
      ui.aiMessages.push({ role: 'user', en: clean, text: clean, tip: grammarTip });
      ui.aiInput = '';
      ui.aiLoading = true;
      renderAiTutorPage();

      // Priority 1: Shared Vercel Serverless Proxy (/api/chat) — no API key needed for visitors!
      if (window.location && window.location.protocol.startsWith('http') && serverAiEnabled !== false) {
        try {
          const proxyRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lang: isZh ? 'zh' : 'en',
              topicTitle: sc.title,
              history: ui.aiMessages.slice(-8).map(m => ({ role: m.role, text: m.text || m.en || '' }))
            })
          });
          if (proxyRes.ok) {
            serverAiEnabled = true;
            const parsed = await proxyRes.json();
            if (isZh) {
              ui.aiMessages.push({
                role: 'ai',
                text: parsed.zh || "很好！请再说一遍。",
                pinyin: parsed.pinyin || "Hěn hǎo! Qǐng zài shuō yíbiàn.",
                vi: parsed.vi || "Tốt lắm! Bạn nói thêm nhé.",
                tip: parsed.tip || '',
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
              });
              ui.aiLoading = false;
              addXp(10, 'Trò chuyện AI Tiếng Trung (+10 XP)');
              renderAiTutorPage();
              if (ui.aiAutoSpeak) speakChinese(parsed.zh || '');
            } else {
              ui.aiMessages.push({
                role: 'ai',
                en: parsed.en || "Great job! Tell me more.",
                vi: parsed.vi || "Bạn làm tốt lắm! Kể thêm cho cô nghe nhé.",
                tip: parsed.tip || '',
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
              });
              ui.aiLoading = false;
              addXp(10, 'Trò chuyện AI Tiếng Anh (+10 XP)');
              renderAiTutorPage();
              if (ui.aiAutoSpeak) speakText(parsed.en || '');
            }
            return;
          } else if (proxyRes.status === 404 || proxyRes.status === 503) {
            serverAiEnabled = false;
          }
        } catch (err) {
          serverAiEnabled = false;
        }
      }

      const apiKey = getActiveGeminiKey();
      if (apiKey) {
        try {
          const historyText = ui.aiMessages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : (isZh ? 'Teacher Xiaomei' : 'Teacher Sarah')}: ${m.text || m.en}`).join('\n');
          const prompt = isZh
            ? `You are Teacher Xiaomei (小美老师), a warm, encouraging Mandarin Chinese teacher helping a Vietnamese beginner (HSK 1-2) practice "${sc.title}".\nConversation so far:\n${historyText}\n\nReply strictly in JSON with keys: "zh" (1-2 simple Simplified Chinese sentences ending with an easy question), "pinyin" (Pinyin with tone marks), "vi" (natural Vietnamese translation), "tip" (short Vietnamese feedback if needed, else ""), "suggestions" (array of 3 objects with {"zh":"...","pinyin":"..."}). Return ONLY valid JSON.`
            : `You are Teacher Sarah, a warm, encouraging English teacher helping a Vietnamese beginner (A0-A2) practice "${sc.title}".\nConversation so far:\n${historyText}\n\nReply strictly in JSON with keys: "en" (short, simple English reply of 1-2 sentences ending with an easy follow-up question), "vi" (natural Vietnamese translation), "tip" (short Vietnamese grammar correction if needed, else ""), "suggestions" (array of 3 short English sample replies). Return ONLY valid JSON.`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON');
          const parsed = JSON.parse(jsonMatch[0]);
          if (isZh) {
            ui.aiMessages.push({
              role: 'ai',
              text: parsed.zh || "很好！请再说一遍。",
              pinyin: parsed.pinyin || "Hěn hǎo! Qǐng zài shuō yíbiàn.",
              vi: parsed.vi || "Tốt lắm! Bạn nói thêm nhé.",
              tip: parsed.tip || '',
              suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
            });
            ui.aiLoading = false;
            addXp(10, 'Luyện hội thoại Tiếng Trung (+10 XP)');
            renderAiTutorPage();
            if (ui.aiAutoSpeak) speakChinese(parsed.zh || '');
          } else {
            ui.aiMessages.push({
              role: 'ai',
              en: parsed.en || "Great job! Tell me more.",
              vi: parsed.vi || "Bạn làm tốt lắm! Kể thêm cho cô nghe nhé.",
              tip: parsed.tip || '',
              suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
            });
            ui.aiLoading = false;
            addXp(10, 'Luyện hội thoại AI (+10 XP)');
            renderAiTutorPage();
            if (ui.aiAutoSpeak) speakText(parsed.en || '');
          }
          return;
        } catch (err) {
          showToast('Chưa kết nối được Gemini API, chuyển về Chế độ Cô giáo thông minh miễn phí.');
        }
      }

      // Built-in Smart Conversational Fallback
      setTimeout(() => {
        const reply = generateSmartOfflineReply(clean, isZh, sc);
        if (isZh) {
          ui.aiMessages.push({
            role: 'ai',
            text: reply.text,
            pinyin: reply.pinyin,
            vi: reply.vi,
            tip: '',
            suggestions: reply.suggestions || []
          });
          ui.aiLoading = false;
          addXp(10, 'Trò chuyện với Cô Tiểu Mỹ (+10 XP)');
          renderAiTutorPage();
          if (ui.aiAutoSpeak) speakChinese(reply.text);
        } else {
          ui.aiMessages.push({
            role: 'ai',
            en: reply.en,
            vi: reply.vi,
            tip: '',
            suggestions: reply.suggestions || []
          });
          ui.aiLoading = false;
          addXp(10, 'Trò chuyện với Cô Sarah (+10 XP)');
          renderAiTutorPage();
          if (ui.aiAutoSpeak) speakText(reply.en);
        }
      }, 420);
    }

    function renderAiTutorPage() {
      const el = document.getElementById('page-tutor');
      if (!el) return;
      const isZh = ui.aiLang === 'zh';
      const list = getActiveAiScenarios();
      if (!ui.aiMessages || !ui.aiMessages.length || !list.some(s => s.id === ui.aiScenarioId)) {
        initAiChatForScenario(list[0].id);
      }
      const sc = list.find(s => s.id === ui.aiScenarioId) || list[0];
      const lastAi = [...ui.aiMessages].reverse().find(m => m.role === 'ai');
      if (serverAiEnabled === null) checkServerAiProxy();
      const hasSharedAi = Boolean(serverAiEnabled);
      const hasGemini = hasSharedAi || Boolean(getActiveGeminiKey());
      const customAvatar = (state.profile && state.profile.customAvatar) || '';
      const googleAvatar = (currentAuthUser && currentAuthUser.user_metadata && currentAuthUser.user_metadata.avatar_url) || '';
      const userAvatar = customAvatar || googleAvatar;

      el.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Sidebar: Language Switch, Scenarios & AI Settings -->
          <aside class="lg:col-span-4 space-y-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
              <!-- Language Toggle -->
              <div class="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold">
                <button type="button" data-ai-lang="en" class="py-2 px-2 rounded-lg transition-all ${!isZh ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                  Tiếng Anh (Cô Sarah)
                </button>
                <button type="button" data-ai-lang="zh" class="py-2 px-2 rounded-lg transition-all ${isZh ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                  Tiếng Trung (Cô Tiểu Mỹ)
                </button>
              </div>

              <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div class="w-11 h-11 rounded-2xl ${isZh ? 'bg-gradient-to-br from-rose-600 to-orange-500' : 'bg-gradient-to-br from-indigo-600 to-violet-500'} text-white flex items-center justify-center shadow-xs shrink-0">
                  <i data-lucide="bot" class="w-6 h-6"></i>
                </div>
                <div>
                  <div class="font-extrabold text-slate-900 text-sm">${isZh ? 'Cô giáo AI Tiểu Mỹ (小美老师)' : 'Cô giáo AI Sarah'}</div>
                  <div class="text-[11px] font-semibold ${hasGemini ? 'text-emerald-600' : (isZh ? 'text-rose-600' : 'text-indigo-600')}">
                    ${hasSharedAi ? 'Đang bật Gemini AI dùng chung (Miễn phí)' : (hasGemini ? 'Đang bật Gemini AI tự do' : 'Chế độ Luyện nói miễn phí')}
                  </div>
                </div>
              </div>

              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chọn tình huống giao tiếp</div>
              <div class="space-y-1.5">
                ${list.map(s => {
                  const active = s.id === sc.id;
                  const activeCls = isZh ? 'bg-rose-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs';
                  const subCls = active ? (isZh ? 'text-rose-100' : 'text-indigo-100') : 'text-slate-500';
                  return `
                    <button type="button" data-ai-scenario="${s.id}" class="w-full text-left p-3 rounded-xl border transition-all ${active ? activeCls + ' border-transparent' : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'}">
                      <div class="font-bold text-xs sm:text-sm">${s.title}</div>
                      <div class="text-[11px] mt-0.5 ${subCls}">${s.level}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Optional Gemini API Key (auto-hidden when shared Vercel AI is active) -->
            ${hasSharedAi ? `
              <div class="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                  <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i> Trò chuyện tự do đã mở khóa!
                </div>
                <p class="text-[11px] text-emerald-700 leading-relaxed">
                  Mọi người truy cập web đều có thể trò chuyện tự do với Cô Sarah &amp; Cô Tiểu Mỹ ngay mà không cần nhập API Key.
                </p>
              </div>
            ` : `
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-2.5">
              <div class="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <i data-lucide="sparkles" class="w-4 h-4 text-amber-500"></i> Mở khóa trò chuyện tự do (Tuỳ chọn)
              </div>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Không cần Key bạn vẫn trò chuyện thoải mái theo các chủ đề hằng ngày. Để AI hiểu sâu và đối đáp tự do 100% mọi câu hỏi bất kỳ, lấy <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="text-indigo-600 font-bold underline">Gemini API Key miễn phí tại đây</a> rồi dán vào ô dưới:
              </p>
              <div class="flex gap-1.5">
                <input type="password" id="ai-gemini-key-input" value="${state.geminiApiKey || ''}" placeholder="AIzaSy... (tuỳ chọn)" class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-400" />
                <button type="button" id="ai-save-key-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Lưu</button>
              </div>
            </div>`}
          </aside>

          <!-- Right Panel: Chat Window -->
          <section class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[640px] max-h-[78vh] overflow-hidden">
            <!-- Chat Header -->
            <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
              <div>
                <div class="font-extrabold text-slate-900 text-sm sm:text-base">${sc.title}</div>
                <div class="text-xs text-slate-500">${isZh ? 'Bấm Micro để nói tiếng Trung (zh-CN) hoặc gõ Pinyin / chữ Hán' : 'Bấm Micro để nói tiếng Anh hoặc gõ câu trả lời bên dưới'}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="ai-toggle-autospeak" class="px-2.5 py-1.5 rounded-lg text-xs font-bold border ${ui.aiAutoSpeak ? (isZh ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700') : 'bg-white border-slate-200 text-slate-500'}" title="Tự đọc câu trả lời của cô giáo">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5 inline"></i> Tự đọc: ${ui.aiAutoSpeak ? 'Bật' : 'Tắt'}
                </button>
                <button type="button" id="ai-toggle-vi" class="px-2.5 py-1.5 rounded-lg text-xs font-bold border bg-white border-slate-200 text-slate-700">
                  ${ui.aiShowVi ? 'Ẩn dịch Việt' : 'Hiện dịch Việt'}
                </button>
                <button type="button" id="ai-restart-chat" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600" title="Bắt đầu lại cuộc trò chuyện">
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div id="ai-chat-scroll" class="flex-1 overflow-y-auto p-5 space-y-4">
              ${ui.aiMessages.map(m => {
                if (m.role === 'ai') {
                  const mainTxt = m.text || m.en || '';
                  const speakAttr = isZh ? `data-speak-zh="${mainTxt.replace(/"/g, '&quot;')}"` : `data-speak="${mainTxt.replace(/"/g, '&quot;')}"`;
                  return `
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full ${isZh ? 'bg-rose-600' : 'bg-indigo-600'} text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-1">${isZh ? '美' : 'S'}</div>
                      <div class="max-w-[85%] space-y-1.5">
                        <div class="bg-slate-100 rounded-2xl rounded-tl-xs px-4 py-3 text-slate-900 space-y-1">
                          <div class="flex items-start justify-between gap-2">
                            <span class="font-bold text-sm sm:text-base leading-snug">${mainTxt}</span>
                            <button type="button" ${speakAttr} class="w-7 h-7 rounded-lg bg-white hover:bg-indigo-50 ${isZh ? 'text-rose-600' : 'text-indigo-600'} flex items-center justify-center shrink-0 shadow-2xs" title="Nghe lại">
                              <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                          ${m.pinyin ? `<div class="text-xs font-semibold text-rose-600">${m.pinyin}</div>` : ''}
                          ${ui.aiShowVi && m.vi ? `<div class="text-xs text-slate-500 pt-1 border-t border-slate-200/70">${m.vi}</div>` : ''}
                        </div>
                        ${m.tip ? `<div class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">${m.tip}</div>` : ''}
                      </div>
                    </div>
                  `;
                }
                return `
                  <div class="flex items-end justify-end gap-2">
                    <div class="max-w-[80%] space-y-1 flex flex-col items-end">
                      <div class="${isZh ? 'bg-rose-600' : 'bg-indigo-600'} text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm font-semibold">${m.text || m.en}</div>
                      ${m.tip ? `<div class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-right">${m.tip}</div>` : ''}
                    </div>
                    ${userAvatar ? `<img src="${userAvatar}" alt="Bạn" class="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />` : ''}
                  </div>
                `;
              }).join('')}
              ${ui.aiLoading ? `<div class="text-xs text-slate-400 italic pl-11">${isZh ? 'Cô Tiểu Mỹ đang trả lời...' : 'Cô Sarah đang trả lời...'}</div>` : ''}
            </div>

            <!-- Suggestions + Input -->
            <div class="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
              ${lastAi && lastAi.suggestions && lastAi.suggestions.length ? `
                <div class="space-y-1.5">
                  <div class="text-[11px] font-bold text-slate-500">Gợi ý câu trả lời (bấm để gửi nhanh hoặc tập nói theo):</div>
                  <div class="flex flex-wrap gap-1.5">
                    ${lastAi.suggestions.map(sg => {
                      const sgVal = typeof sg === 'string' ? sg : sg.zh;
                      const sgLabel = typeof sg === 'string' ? sg : `${sg.zh} <span class="text-slate-400 font-normal">(${sg.pinyin})</span>`;
                      return `
                        <button type="button" data-ai-suggest="${sgVal.replace(/"/g, '&quot;')}" class="px-3 py-1.5 rounded-full bg-white ${isZh ? 'hover:bg-rose-50 border-rose-200 text-rose-700' : 'hover:bg-indigo-50 border-indigo-200 text-indigo-700'} border text-xs font-semibold transition-colors">
                          ${sgLabel}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              <div class="flex items-center gap-2">
                <button type="button" id="ai-mic-btn" class="w-10 h-10 rounded-xl ${ui.speechListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'} flex items-center justify-center shrink-0" title="Bấm để nói bằng Micro">
                  <i data-lucide="mic" class="w-4 h-4"></i>
                </button>
                <input type="text" id="ai-chat-input" value="${(ui.aiInput || '').replace(/"/g, '&quot;')}" placeholder="${isZh ? 'Gõ chữ Hán / Pinyin hoặc bấm Micro để nói với Cô Tiểu Mỹ...' : 'Gõ tiếng Anh hoặc bấm Micro để nói với Cô Sarah...'}" class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none text-sm" />
                <button type="button" id="ai-send-btn" class="px-4 py-2.5 rounded-xl ${isZh ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-sm font-bold flex items-center gap-1.5 shrink-0">
                  Gửi <i data-lucide="send" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </section>
        </div>
      `;
      refreshIcons();
      const scroller = document.getElementById('ai-chat-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }





    // ==================== EXERCISES TAB ("LÀM BÀI TẬP" — ANH & TRUNG, 4 DẠNG BÀI) ====================
    const EX_GRAMMAR_QS = {
      en: [
        { prompt: 'She ____ a teacher at a primary school.', vi: 'Cô ấy là giáo viên tại một trường tiểu học.', options: ['am', 'is', 'are', 'be'], ans: 1, exp: 'Chủ ngữ ngôi thứ 3 số ít "She" đi với động từ to be "is".' },
        { prompt: '____ you like drinking iced coffee?', vi: 'Bạn có thích uống cà phê đá không?', options: ['Does', 'Is', 'Do', 'Are'], ans: 2, exp: 'Câu hỏi hiện tại đơn với động từ thường "like" và chủ ngữ "you" dùng "Do".' },
        { prompt: 'I ____ English with my AI teacher right now.', vi: 'Ngay lúc này tôi đang học tiếng Anh cùng cô giáo AI.', options: ['learn', 'am learning', 'learned', 'learns'], ans: 1, exp: 'Có "right now" (ngay lúc này) nên dùng thì Hiện tại tiếp diễn: am + V-ing.' },
        { prompt: 'Yesterday, we ____ to a new Vietnamese restaurant.', vi: 'Hôm qua chúng tôi đã đến một nhà hàng Việt Nam mới.', options: ['go', 'going', 'went', 'goes'], ans: 2, exp: '"Yesterday" (hôm qua) dùng Quá khứ đơn; quá khứ của "go" là "went".' },
        { prompt: 'Could you ____ me where the train station is?', vi: 'Bạn có thể chỉ giúp tôi nhà ga ở đâu không?', options: ['tell', 'telling', 'to tell', 'told'], ans: 0, exp: 'Sau động từ khuyết thiếu "Could" luôn dùng động từ nguyên mẫu không "to".' },
        { prompt: 'If it rains tomorrow, I ____ stay at home.', vi: 'Nếu ngày mai trời mưa, tôi sẽ ở nhà.', options: ['am', 'will', 'was', 'did'], ans: 1, exp: 'Câu điều kiện loại 1: If + Hiện tại đơn, S + will + V nguyên mẫu.' },
        { prompt: 'My brother ____ football every Sunday morning.', vi: 'Anh trai tôi chơi bóng đá mỗi sáng Chủ nhật.', options: ['play', 'plays', 'playing', 'played'], ans: 1, exp: 'Thói quen lặp lại (every Sunday) + ngôi thứ 3 số ít "My brother" → thêm -s (plays).' },
        { prompt: 'There ____ two cute cats in the living room.', vi: 'Có hai chú mèo dễ thương trong phòng khách.', options: ['is', 'are', 'am', 'be'], ans: 1, exp: '"two cute cats" là danh từ số nhiều nên dùng "There are".' },
        { prompt: 'We have lived in Ho Chi Minh City ____ 2020.', vi: 'Chúng tôi đã sống ở TP. Hồ Chí Minh từ năm 2020.', options: ['for', 'since', 'at', 'in'], ans: 1, exp: 'Trước một mốc thời gian cụ thể (2020) trong thì Hiện tại hoàn thành dùng "since".' },
        { prompt: 'This milk tea is ____ than the one I bought yesterday.', vi: 'Ly trà sữa này ngon hơn ly tôi mua hôm qua.', options: ['good', 'better', 'best', 'more good'], ans: 1, exp: 'So sánh hơn của "good" là dạng bất quy tắc "better".' },
        { prompt: 'She ____ to Japan twice.', vi: 'Cô ấy đã từng đi Nhật Bản hai lần.', options: ['has been', 'have been', 'was been', 'is being'], ans: 0, exp: 'Trải nghiệm đến hiện tại với chủ ngữ "She" dùng Hiện tại hoàn thành "has been".' },
        { prompt: 'You ____ wear a helmet when riding a motorbike.', vi: 'Bạn phải đội mũ bảo hiểm khi đi xe máy.', options: ['must', 'mustn\'t', 'doesn\'t', 'are'], ans: 0, exp: '"must" diễn tả quy định/nghĩa vụ bắt buộc.' },
        { prompt: 'I enjoy ____ to music while working.', vi: 'Tôi thích nghe nhạc trong lúc làm việc.', options: ['listen', 'to listen', 'listening', 'listened'], ans: 2, exp: 'Sau động từ "enjoy" luôn dùng V-ing (listening).' },
        { prompt: 'What ____ you doing when I called you last night?', vi: 'Bạn đang làm gì khi tôi gọi cho bạn tối qua?', options: ['was', 'were', 'are', 'did'], ans: 1, exp: 'Quá khứ tiếp diễn với chủ ngữ "you" dùng "were".' },
        { prompt: 'How ____ sugar would you like in your coffee?', vi: 'Bạn muốn cho bao nhiêu đường vào cà phê?', options: ['many', 'much', 'few', 'a'], ans: 1, exp: '"sugar" là danh từ không đếm được nên hỏi số lượng bằng "How much".' },
        { prompt: 'He wants ____ a new laptop for his job.', vi: 'Anh ấy muốn mua một chiếc laptop mới cho công việc.', options: ['buy', 'buying', 'to buy', 'bought'], ans: 2, exp: 'Cấu trúc "want + to V" (muốn làm gì).' },
        { prompt: 'The meeting starts ____ 9:30 AM tomorrow.', vi: 'Cuộc họp bắt đầu lúc 9 giờ 30 sáng ngày mai.', options: ['in', 'on', 'at', 'to'], ans: 2, exp: 'Trước giờ giấc cụ thể luôn dùng giới từ "at".' },
        { prompt: '____ is your favorite Vietnamese dish?', vi: 'Món ăn Việt Nam yêu thích nhất của bạn là gì?', options: ['Who', 'Where', 'What', 'When'], ans: 2, exp: 'Hỏi về món ăn (sự vật) dùng từ để hỏi "What".' }
      ],
      zh: [
        { prompt: '我 ____ 越南人。', vi: 'Tôi là người Việt Nam.', options: ['有 (yǒu)', '是 (shì)', '在 (zài)', '去 (qù)'], ans: 1, exp: 'Dùng động từ 是 (shì — là) để nối chủ ngữ và danh từ.' },
        { prompt: '你是学生 ____？', vi: 'Bạn là học sinh phải không?', options: ['的 (de)', '了 (le)', '吗 (ma)', '不 (bù)'], ans: 2, exp: 'Thêm trợ từ 吗 (ma) vào cuối câu để tạo câu hỏi Có/Không.' },
        { prompt: '我 ____ 弟弟。', vi: 'Tôi không có em trai.', options: ['不有 (bù yǒu)', '没有 (méiyǒu)', '不是 (bú shì)', '没是 (méi shì)'], ans: 1, exp: 'Phủ định của 有 (có) luôn là 没有 (méiyǒu), không dùng 不有.' },
        { prompt: '我今天 ____ 家学习中文。', vi: 'Hôm nay tôi học tiếng Trung ở nhà.', options: ['在 (zài)', '是 (shì)', '有 (yǒu)', '很 (hěn)'], ans: 0, exp: 'Cấu trúc địa điểm: Chủ ngữ + Thời gian + 在 + Địa điểm + Động từ.' },
        { prompt: '这件衣服 ____ 钱？', vi: 'Cái áo này bao nhiêu tiền?', options: ['什么 (shénme)', '哪里 (nǎlǐ)', '多少 (duōshao)', '怎么 (zěnme)'], ans: 2, exp: 'Hỏi giá tiền dùng cụm cố định 多少钱 (duōshao qián).' },
        { prompt: '我 ____ 一杯珍珠奶茶。', vi: 'Cho tôi một ly trà sữa trân châu.', options: ['要 (yào)', '是 (shì)', '在 (zài)', '叫 (jiào)'], ans: 0, exp: 'Khi gọi món ăn/đồ uống, dùng động từ 要 (yào — muốn/lấy).' },
        { prompt: '这是我 ____ 书。', vi: 'Đây là quyển sách của tôi.', options: ['的 (de)', '吗 (ma)', '呢 (ne)', '吧 (ba)'], ans: 0, exp: 'Trợ từ 的 (de) biểu thị sự sở hữu ("của").' },
        { prompt: '你叫 ____ 名字？', vi: 'Bạn tên là gì?', options: ['谁 (shéi)', '什么 (shénme)', '哪儿 (nǎr)', '几 (jǐ)'], ans: 1, exp: 'Hỏi tên dùng mẫu câu cố định: 你叫什么名字？' },
        { prompt: '今天天气 ____ 好！', vi: 'Thời tiết hôm nay rất đẹp!', options: ['很 (hěn)', '是 (shì)', '有 (yǒu)', '在 (zài)'], ans: 0, exp: 'Trước tính từ trong câu trần thuật tiếng Trung thường dùng phó từ 很 (hěn).' },
        { prompt: '我昨天买 ____ 一件新衣服。', vi: 'Hôm qua tôi đã mua một cái áo mới.', options: ['吗 (ma)', '了 (le)', '呢 (ne)', '的 (de)'], ans: 1, exp: 'Trợ từ 了 (le) đặt sau động từ biểu thị hành động đã hoàn thành.' },
        { prompt: '你 ____ 说中文吗？', vi: 'Bạn biết nói tiếng Trung không?', options: ['会 (huì)', '是 (shì)', '在 (zài)', '给 (gěi)'], ans: 0, exp: '会 (huì) diễn tả kỹ năng học được (biết nói ngoại ngữ, biết lái xe...).' },
        { prompt: '现在 ____ 点了？', vi: 'Bây giờ là mấy giờ rồi?', options: ['什么 (shénme)', '几 (jǐ)', '谁 (shéi)', '怎么 (zěnme)'], ans: 1, exp: 'Hỏi giờ dùng 几点 (jǐ diǎn — mấy giờ).' },
        { prompt: '地铁站 ____ 哪里？', vi: 'Trạm tàu điện ngầm ở đâu?', options: ['有 (yǒu)', '是 (shì)', '在 (zài)', '去 (qù)'], ans: 2, exp: 'Hỏi vị trí dùng 在哪里 (zài nǎlǐ — ở đâu).' },
        { prompt: '我们一起去喝咖啡 ____！', vi: 'Chúng mình cùng đi uống cà phê nhé!', options: ['吗 (ma)', '吧 (ba)', '的 (de)', '了 (le)'], ans: 1, exp: 'Trợ từ 吧 (ba) đặt cuối câu mang nghĩa gợi ý, rủ rê ("nhé / đi").' },
        { prompt: '他 ____ 喜欢听音乐。', vi: 'Anh ấy cũng thích nghe nhạc.', options: ['也 (yě)', '和 (hé)', '吗 (ma)', '的 (de)'], ans: 0, exp: 'Phó từ 也 (yě — cũng) luôn đặt trước động từ.' },
        { prompt: '我明天 ____ 去北京旅游。', vi: 'Ngày mai tôi muốn đi du lịch Bắc Kinh.', options: ['想 (xiǎng)', '是 (shì)', '在 (zài)', '有 (yǒu)'], ans: 0, exp: '想 (xiǎng) + động từ diễn tả mong muốn/dự định làm gì.' }
      ]
    };

    function buildExerciseSet(lang, mode) {
      const isZh = lang === 'zh';
      const words = [];
      if (isZh && typeof ZH_TOPICS !== 'undefined') {
        ZH_TOPICS.forEach(t => (t.words || []).forEach(w => words.push({
          term: w.hanzi, sub: w.pinyin, vi: w.vi,
          ex: w.exZh || w.hanzi, exSub: w.exPy || w.pinyin, exVi: w.exVi || w.vi
        })));
      } else {
        TOPICS_DATA.forEach(t => (t.lessons || []).forEach(l => (l.words || []).forEach(w => words.push({
          term: w.en, sub: w.ipa || '', vi: w.vi,
          ex: w.exEn || w.en, exBlank: w.exBlank || '', exSub: w.ipa || '', exVi: w.exVi || w.vi
        }))));
      }
      const shuffled = [...words].sort(() => Math.random() - 0.5);

      if (mode === 'mcq') {
        const gramPool = [...(EX_GRAMMAR_QS[lang] || EX_GRAMMAR_QS.en)].sort(() => Math.random() - 0.5);
        const gramPart = gramPool.slice(0, 4).map(g => {
          const correctText = g.options[g.ans];
          const shuffledOpts = [...g.options].sort(() => Math.random() - 0.5);
          return { ...g, options: shuffledOpts, ans: shuffledOpts.indexOf(correctText), kind: 'grammar' };
        });
        const vocabPart = shuffled.slice(0, 4).map(w => {
          const wrongs = shuffled.filter(x => x.term !== w.term).slice(0, 3).map(x => x.vi);
          const opts = [w.vi, ...wrongs].sort(() => Math.random() - 0.5);
          return {
            kind: 'vocab',
            prompt: `Từ "${w.term}" (${w.sub}) có nghĩa là gì?`,
            speak: w.term,
            options: opts,
            ans: opts.indexOf(w.vi),
            exp: `${w.term} (${w.sub}) = ${w.vi}. Ví dụ: ${w.ex} (${w.exVi})`
          };
        });
        return [...gramPart, ...vocabPart].sort(() => Math.random() - 0.5);
      }

      if (mode === 'fill') {
        return shuffled.slice(0, 6).map(w => {
          let blanked = w.exBlank || '';
          if (!blanked) {
            if (isZh && w.ex.includes(w.term)) blanked = w.ex.replace(w.term, '____');
            else if (!isZh && w.ex.toLowerCase().includes(w.term.toLowerCase())) {
              blanked = w.ex.replace(new RegExp(w.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '____');
            } else {
              blanked = isZh ? `Điền chữ Hán cho nghĩa: "${w.vi}"` : `Điền từ tiếng Anh cho nghĩa: "${w.vi}"`;
            }
          }
          return { blanked, answer: w.term, full: w.ex, sub: w.sub, vi: w.exVi || w.vi };
        });
      }

      if (mode === 'order') {
        const usable = shuffled.filter(w => isZh ? (w.ex.length >= 4 && w.ex.length <= 10) : (w.ex.split(/\s+/).length >= 4 && w.ex.split(/\s+/).length <= 8));
        return usable.slice(0, 5).map(w => {
          const cleanEx = w.ex.replace(/[.!?。！？]/g, '').trim();
          const tokens = isZh ? [...cleanEx] : cleanEx.split(/\s+/);
          const scrambled = [...tokens].sort(() => Math.random() - 0.5);
          return { target: cleanEx, tokens, scrambled, vi: w.exVi || w.vi, speak: w.ex };
        });
      }

      // mode === 'listen'
      return shuffled.slice(0, 6).map(w => {
        const wrongs = shuffled.filter(x => x.term !== w.term).slice(0, 3).map(x => ({ label: `${x.term} — ${x.vi}`, ok: false }));
        const opts = [{ label: `${w.term} — ${w.vi}`, ok: true }, ...wrongs].sort(() => Math.random() - 0.5);
        return { speak: w.term, sub: w.sub, term: w.term, vi: w.vi, options: opts, ans: opts.findIndex(o => o.ok) };
      });
    }

    function initExerciseSession(lang, mode) {
      ui.exLang = lang || ui.exLang || 'en';
      ui.exMode = mode || ui.exMode || 'mcq';
      ui.exItems = buildExerciseSet(ui.exLang, ui.exMode);
      ui.exIdx = 0;
      ui.exCorrect = 0;
      ui.exDone = false;
      ui.exPicked = null;
      ui.exFillInput = '';
      ui.exFillChecked = null;
      ui.exOrderPicked = [];
      ui.exOrderChecked = null;
    }

    function renderExercisesPage() {
      const el = document.getElementById('page-exercises');
      if (!el) return;
      const lang = ui.exLang || 'en';
      const mode = ui.exMode || 'mcq';
      const isZh = lang === 'zh';
      if (!ui.exItems || !ui.exItems.length) initExerciseSession(lang, mode);

      const items = ui.exItems;
      const idx = Math.min(ui.exIdx || 0, items.length - 1);
      const item = items[idx];
      const pct = Math.round(((idx + (ui.exDone ? 1 : 0)) / items.length) * 100);
      const speakAttrFor = (t) => isZh
        ? `data-speak-zh="${String(t || '').replace(/"/g, '&quot;')}"`
        : `data-speak="${String(t || '').replace(/"/g, '&quot;')}"`;

      el.innerHTML = `
        <!-- Lavender AIO Exercises Hero Banner -->
        <div class="aio-lavender-banner rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Làm bài tập.</h1>
              <div class="bg-white/85 p-0.5 rounded-xl inline-flex text-xs font-bold border border-purple-200">
                <button type="button" data-ex-lang="en" class="px-3 py-1 rounded-lg ${!isZh ? 'bg-indigo-600 text-white' : 'text-slate-600'}">Tiếng Anh</button>
                <button type="button" data-ex-lang="zh" class="px-3 py-1 rounded-lg ${isZh ? 'bg-rose-600 text-white' : 'text-slate-600'}">Tiếng Trung</button>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-700">4 dạng bài tập tương tác có chấm điểm tức thì, giải thích chi tiết và thưởng XP khi hoàn thành.</p>
          </div>
          <button type="button" id="ex-new-set-btn" class="px-4 py-2.5 rounded-2xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-900 text-xs font-extrabold shadow-xs shrink-0 self-start lg:self-center">
            Tạo đề mới ↻
          </button>
        </div>

        <!-- 4 Exercise Mode Tabs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button type="button" data-ex-mode="mcq" class="p-3.5 rounded-2xl border text-left transition-all ${mode === 'mcq' ? 'bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-xs' : 'bg-white/80 border-[#E6DEC9] hover:bg-white'}">
            <div class="text-xs font-extrabold text-indigo-700">1. Trắc nghiệm A/B/C/D</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Từ vựng &amp; Ngữ pháp tổng hợp</div>
          </button>
          <button type="button" data-ex-mode="fill" class="p-3.5 rounded-2xl border text-left transition-all ${mode === 'fill' ? 'bg-white border-amber-400 ring-2 ring-amber-100 shadow-xs' : 'bg-white/80 border-[#E6DEC9] hover:bg-white'}">
            <div class="text-xs font-extrabold text-amber-700">2. Điền từ chỗ trống</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Nhớ chính tả &amp; ngữ cảnh</div>
          </button>
          <button type="button" data-ex-mode="order" class="p-3.5 rounded-2xl border text-left transition-all ${mode === 'order' ? 'bg-white border-emerald-400 ring-2 ring-emerald-100 shadow-xs' : 'bg-white/80 border-[#E6DEC9] hover:bg-white'}">
            <div class="text-xs font-extrabold text-emerald-700">3. Sắp xếp câu</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Luyện trật tự từ chuẩn xác</div>
          </button>
          <button type="button" data-ex-mode="listen" class="p-3.5 rounded-2xl border text-left transition-all ${mode === 'listen' ? 'bg-white border-rose-400 ring-2 ring-rose-100 shadow-xs' : 'bg-white/80 border-[#E6DEC9] hover:bg-white'}">
            <div class="text-xs font-extrabold text-rose-700">4. Nghe chọn đáp án</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Luyện phản xạ tai nghe</div>
          </button>
        </div>

        <!-- Exercise Stage Card -->
        <div class="bg-white rounded-3xl border border-[#E6DEC9] shadow-xs p-5 sm:p-7 space-y-5 max-w-3xl mx-auto">
          ${ui.exDone ? `
            <div class="text-center py-6 space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl">🏆</div>
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900">Hoàn thành bài tập!</h2>
                <p class="text-sm text-slate-600 mt-1">Bạn trả lời đúng <strong class="text-emerald-700">${ui.exCorrect}/${items.length}</strong> câu (${Math.round((ui.exCorrect / items.length) * 100)}%).</p>
              </div>
              <div class="flex flex-wrap justify-center gap-2">
                <button type="button" id="ex-new-set-btn-2" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Làm đề mới ngay</button>
              </div>
            </div>
          ` : `
            <!-- Progress Bar -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Câu ${idx + 1} / ${items.length}</span>
                <span class="text-emerald-700">Đúng: ${ui.exCorrect}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full bg-indigo-600 rounded-full transition-all" style="width:${pct}%"></div>
              </div>
            </div>

            ${mode === 'mcq' ? `
              <div class="p-5 rounded-2xl aio-grid-paper border border-[#E5DEC9] flex items-center justify-between gap-3">
                <div class="text-base sm:text-lg font-extrabold text-slate-900">${item.prompt}</div>
                ${item.speak ? `<button type="button" ${speakAttrFor(item.speak)} class="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shrink-0"><i data-lucide="volume-2" class="w-4 h-4"></i></button>` : ''}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${item.options.map((opt, i) => {
                  const picked = ui.exPicked;
                  let cls = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                  if (picked !== null) {
                    if (i === item.ans) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    else if (i === picked) cls = 'bg-rose-50 border-rose-400 text-rose-800';
                  }
                  return `<button type="button" data-ex-mcq-pick="${i}" ${picked !== null ? 'disabled' : ''} class="p-3.5 rounded-2xl border text-left text-sm transition-all ${cls}"><span class="font-extrabold mr-2 text-slate-400">${['A','B','C','D'][i]}.</span>${opt}</button>`;
                }).join('')}
              </div>
              ${ui.exPicked !== null ? (() => {
                const ansClean = (item.options[item.ans] || '').split('(')[0].trim();
                const fullSent = item.prompt.includes('____') ? item.prompt.replace('____', ansClean) : '';
                return `
                <div class="p-4 rounded-2xl ${ui.exPicked === item.ans ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'} border text-xs sm:text-sm space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <div class="font-extrabold">${ui.exPicked === item.ans ? '✓ Chính xác!' : '✗ Chưa đúng rồi!'}</div>
                    ${fullSent ? `<button type="button" ${speakAttrFor(fullSent)} class="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-indigo-700 text-xs font-bold inline-flex items-center gap-1"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe câu</button>` : ''}
                  </div>
                  ${fullSent ? `<div class="font-bold text-slate-900">Câu đầy đủ: ${fullSent}</div>` : ''}
                  ${item.vi ? `<div><strong>Dịch nghĩa:</strong> ${item.vi}</div>` : ''}
                  <div><strong>Giải thích:</strong> ${item.exp}</div>
                </div>
                <div class="flex justify-end">
                  <button type="button" id="ex-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Câu tiếp theo →</button>
                </div>`;
              })() : ''}
            ` : ''}

            ${mode === 'fill' ? `
              <div class="p-5 rounded-2xl aio-grid-paper border border-[#E5DEC9] space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold uppercase text-amber-700">Điền từ còn thiếu</span>
                  <button type="button" ${speakAttrFor(item.full)} class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-indigo-600 flex items-center gap-1"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe câu</button>
                </div>
                <div class="text-lg font-extrabold text-slate-900">${item.blanked}</div>
                <div class="text-xs text-slate-600">Gợi ý nghĩa: <strong>${item.vi}</strong> (${item.sub})</div>
              </div>
              <div class="flex items-center gap-2">
                <input type="text" id="ex-fill-input" value="${(ui.exFillInput || '').replace(/"/g, '&quot;')}" placeholder="${isZh ? 'Gõ chữ Hán cần điền...' : 'Gõ từ tiếng Anh cần điền...'}" class="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-500 text-sm font-bold outline-none" />
                <button type="button" id="ex-fill-check-btn" class="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shrink-0">Kiểm tra</button>
              </div>
              ${ui.exFillChecked !== null ? `
                <div class="p-4 rounded-2xl border ${ui.exFillChecked ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'} text-xs sm:text-sm space-y-1">
                  <div class="font-extrabold">${ui.exFillChecked ? '✓ Chính xác!' : `✗ Đáp án đúng là: ${item.answer}`}</div>
                  <div>Câu đầy đủ: <strong>${item.full}</strong></div>
                </div>
                <div class="flex justify-end">
                  <button type="button" id="ex-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Câu tiếp theo →</button>
                </div>
              ` : ''}
            ` : ''}

            ${mode === 'order' ? `
              <div class="p-5 rounded-2xl aio-grid-paper border border-[#E5DEC9] space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold uppercase text-emerald-700">Sắp xếp thành câu hoàn chỉnh</span>
                  <button type="button" ${speakAttrFor(item.speak)} class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-indigo-600 flex items-center gap-1"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe gợi ý</button>
                </div>
                <div class="text-sm font-bold text-slate-700">Nghĩa tiếng Việt: “${item.vi}”</div>
              </div>

              <!-- Built Answer Box -->
              <div class="min-h-[56px] p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 flex flex-wrap gap-2 items-center">
                ${(ui.exOrderPicked || []).length ? ui.exOrderPicked.map((tokIdx, pos) => `
                  <button type="button" data-ex-order-remove="${pos}" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-2xs">${item.scrambled[tokIdx]}</button>
                `).join('') : `<span class="text-xs text-slate-400">Bấm các mảnh từ bên dưới theo đúng thứ tự...</span>`}
              </div>

              <!-- Word Bank -->
              <div class="flex flex-wrap gap-2">
                ${item.scrambled.map((tok, i) => {
                  const used = (ui.exOrderPicked || []).includes(i);
                  return `<button type="button" data-ex-order-add="${i}" ${used ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${used ? 'bg-slate-100 border-slate-200 text-slate-300' : 'bg-white hover:bg-emerald-50 border-slate-300 text-slate-900 shadow-2xs'}">${tok}</button>`;
                }).join('')}
              </div>

              <div class="flex items-center justify-between gap-2">
                <button type="button" id="ex-order-clear-btn" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Xếp lại</button>
                <button type="button" id="ex-order-check-btn" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold">Kiểm tra câu</button>
              </div>

              ${ui.exOrderChecked !== null ? `
                <div class="p-4 rounded-2xl border ${ui.exOrderChecked ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'} text-xs sm:text-sm space-y-1">
                  <div class="font-extrabold">${ui.exOrderChecked ? '✓ Xếp câu chuẩn xác!' : `✗ Thứ tự đúng là: ${item.target}`}</div>
                </div>
                <div class="flex justify-end">
                  <button type="button" id="ex-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Câu tiếp theo →</button>
                </div>
              ` : ''}
            ` : ''}

            ${mode === 'listen' ? `
              <div class="p-6 rounded-2xl aio-grid-paper border border-[#E5DEC9] text-center space-y-3">
                <div class="text-xs font-bold uppercase text-rose-600">Bấm loa để nghe rồi chọn từ khớp nhất</div>
                <button type="button" ${speakAttrFor(item.speak)} class="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold shadow-xs inline-flex items-center gap-2">
                  <i data-lucide="volume-2" class="w-5 h-5"></i> Nghe phát âm
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${item.options.map((opt, i) => {
                  const picked = ui.exPicked;
                  let cls = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                  if (picked !== null) {
                    if (i === item.ans) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    else if (i === picked) cls = 'bg-rose-50 border-rose-400 text-rose-800';
                  }
                  return `<button type="button" data-ex-mcq-pick="${i}" ${picked !== null ? 'disabled' : ''} class="p-3.5 rounded-2xl border text-left text-sm transition-all ${cls}">${opt.label}</button>`;
                }).join('')}
              </div>
              ${ui.exPicked !== null ? `
                <div class="flex justify-end">
                  <button type="button" id="ex-next-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold">Câu tiếp theo →</button>
                </div>
              ` : ''}
            ` : ''}
          `}
        </div>
      `;
      refreshIcons();
    }

    // ==================== AIO FULL SUITE: HOME, GRAMMAR, READING, PRONUNCIATION, DEEP DICTIONARY ====================
    const AIO_GRAMMAR_UNITS = {
      en: [
        {
          num: 1, title: 'Động từ To Be & Giới thiệu bản thân', level: 'A1',
          points: [
            { title: 'Am / Is / Are khẳng định', ex: 'I am a student. She is happy.', rule: 'I đi với am; He/She/It đi với is; You/We/They đi với are.' },
            { title: 'Câu phủ định & câu hỏi To Be', ex: 'Are you from Vietnam? — Yes, I am.', rule: 'Đảo am/is/are lên đầu câu để hỏi; thêm not sau to be để phủ định.' }
          ]
        },
        {
          num: 2, title: 'Thì Hiện tại đơn (Present Simple)', level: 'A1',
          points: [
            { title: 'Thói quen hằng ngày', ex: 'I drink coffee every morning.', rule: 'Chủ ngữ He/She/It thêm -s/-es vào động từ thường.' },
            { title: 'Câu hỏi với Do / Does', ex: 'Do you like music? Does he work here?', rule: 'Dùng Do cho I/You/We/They và Does cho He/She/It.' }
          ]
        },
        {
          num: 3, title: 'Thì Hiện tại tiếp diễn & Kế hoạch', level: 'A1–A2',
          points: [
            { title: 'Đang diễn ra lúc nói (be + V-ing)', ex: 'I am learning English right now.', rule: 'S + am/is/are + V-ing diễn tả hành động đang xảy ra.' },
            { title: 'Be going to cho dự định', ex: 'I am going to travel next month.', rule: 'Dùng be going to + V nguyên mẫu khi đã có kế hoạch từ trước.' }
          ]
        },
        {
          num: 4, title: 'Thì Quá khứ đơn & Quá khứ tiếp diễn', level: 'A2',
          points: [
            { title: 'Quá khứ đơn (V-ed / V2)', ex: 'I visited Hanoi last year.', rule: 'Kể lại sự việc đã chấm dứt hoàn toàn trong quá khứ.' },
            { title: 'Quá khứ tiếp diễn với when / while', ex: 'I was reading when he called.', rule: 'was/were + V-ing cho hành động đang diễn ra thì việc khác xen vào.' }
          ]
        },
        {
          num: 5, title: 'Động từ khuyết thiếu (Can, Could, Should, Must)', level: 'A2',
          points: [
            { title: 'Can / Could: khả năng & lời nhờ lịch sự', ex: 'Could you help me, please?', rule: 'Sau can/could/should/must luôn dùng động từ nguyên mẫu không to.' },
            { title: 'Should & Have to: lời khuyên và nghĩa vụ', ex: 'You should sleep early. I have to go now.', rule: 'Should dùng để khuyên; Have to/Must diễn tả việc cần phải làm.' }
          ]
        },
        {
          num: 6, title: 'So sánh hơn, so sánh nhất & Câu điều kiện loại 1', level: 'A2',
          points: [
            { title: 'So sánh hơn & nhất (-er/more, -est/most)', ex: 'This coffee is better and cheaper.', rule: 'Tính từ ngắn thêm -er/-est; tính từ dài thêm more/the most.' },
            { title: 'Câu điều kiện loại 1 (If + HTĐ, will + V)', ex: 'If it rains, I will stay at home.', rule: 'Diễn tả điều kiện có thể xảy ra ở hiện tại hoặc tương lai.' }
          ]
        }
      ],
      zh: [
        {
          num: 1, title: 'Câu chữ 是 (Shì) & Giới thiệu', level: 'HSK 1',
          points: [
            { title: 'A 是 B (A là B)', ex: '我是越南人。 (Wǒ shì Yuènán rén.)', rule: 'Dùng 是 nối hai danh từ; phủ định dùng 不是 (bú shì).' },
            { title: 'Câu hỏi với 吗 (ma)', ex: '你是学生吗？ (Nǐ shì xuésheng ma?)', rule: 'Chỉ cần thêm 吗 vào cuối câu trần thuật để tạo câu hỏi Có/Không.' }
          ]
        },
        {
          num: 2, title: 'Sở hữu với 的 (de) & Động từ 有 (yǒu)', level: 'HSK 1',
          points: [
            { title: 'Chữ 的 (của)', ex: '我的老师 (Wǒ de lǎoshī — giáo viên của tôi)', rule: 'Đặt 的 giữa chủ sở hữu và danh từ được sở hữu.' },
            { title: '有 / 没有 (có / không có)', ex: '我有一个姐姐。 (Wǒ yǒu yí ge jiějie.)', rule: 'Phủ định của 有 luôn là 没有 (méiyǒu), không bao giờ dùng 不有.' }
          ]
        },
        {
          num: 3, title: 'Trật tự thời gian & Địa điểm (在 zài)', level: 'HSK 1',
          points: [
            { title: 'Chủ ngữ + Thời gian + 在 + Địa điểm + Động từ', ex: '我今天在家学习中文。 (Hôm nay tôi học tiếng Trung ở nhà.)', rule: 'Khác tiếng Việt: địa điểm (ở đâu) luôn đặt TRƯỚC động từ trong tiếng Trung!' },
            { title: 'Hỏi ở đâu với 在哪儿 / 在哪里', ex: '地铁站在哪里？ (Trạm tàu điện ngầm ở đâu?)', rule: 'Cấu trúc: [Sự vật/Người] + 在哪里？' }
          ]
        },
        {
          num: 4, title: 'Diễn đạt muốn làm gì (想 / 要) & Hoàn thành (了)', level: 'HSK 1–2',
          points: [
            { title: '想 (muốn nhẹ nhàng) vs 要 (muốn / gọi món)', ex: '我要一杯珍珠奶茶。 (Cho tôi một ly trà sữa trân châu.)', rule: 'Khi gọi đồ ăn/uống hay mua hàng, dùng 要 rất tự nhiên.' },
            { title: 'Trợ từ 了 (le) chỉ sự hoàn thành / thay đổi', ex: '我买了这件衣服。 (Tôi đã mua cái áo này rồi.)', rule: 'Đặt 了 ngay sau động từ hoặc cuối câu để nhấn mạnh đã xảy ra.' }
          ]
        }
      ]
    };

    const AIO_IPA_TABLE = {
      vowelsLong: [
        { sym: 'iː', ex: 'sheep', hi: 'ee', file: 'Close_front_unrounded_vowel.ogg', sound: 'sheep', diff: 'Dễ', tip: 'Miệng cười rộng sang hai bên, kéo dài âm "i".' },
        { sym: 'uː', ex: 'food', hi: 'oo', file: 'Close_back_rounded_vowel.ogg', sound: 'food', diff: 'Dễ', tip: 'Tròn môi nhỏ, đẩy ra trước, kéo dài âm "u".' },
        { sym: 'ɔː', ex: 'saw', hi: 'aw', file: 'Open-mid_back_rounded_vowel.ogg', sound: 'saw', diff: 'Vừa', tip: 'Mở miệng vừa phải, hơi tròn môi, kéo dài âm "o".' },
        { sym: 'ɑː', ex: 'car', hi: 'ar', file: 'Open_back_unrounded_vowel.ogg', sound: 'car', diff: 'Dễ', tip: 'Há miệng rộng, hạ cằm xuống, kéo dài âm "a".' },
        { sym: 'ɜː', ex: 'bird', hi: 'ir', file: 'Open-mid_central_unrounded_vowel.ogg', sound: 'bird', diff: 'Khó', tip: 'Đọc âm "ơ" dài rồi hơi cong đầu lưỡi nhẹ lên.' }
      ],
      vowelsShort: [
        { sym: 'ɪ', ex: 'ship', hi: 'i', file: 'Near-close_near-front_unrounded_vowel.ogg', sound: 'ship', diff: 'Khó', tip: 'Thả lỏng môi, đọc ngắn và dứt khoát giữa "i" và "ê".' },
        { sym: 'ʊ', ex: 'book', hi: 'oo', file: 'Near-close_near-back_rounded_vowel.ogg', sound: 'book', diff: 'Khó', tip: 'Môi hơi mở lỏng, đọc ngắn giữa "u" và "ư".' },
        { sym: 'ɒ', ex: 'hot', hi: 'o', file: 'Open_back_rounded_vowel.ogg', sound: 'hot', diff: 'Vừa', tip: 'Há miệng vừa, đọc âm "o" ngắn và gọn.' },
        { sym: 'ʌ', ex: 'cup', hi: 'u', file: 'Open-mid_back_unrounded_vowel.ogg', sound: 'cup', diff: 'Vừa', tip: 'Đọc ngắn và dứt khoát như âm "ă" tiếng Việt.' },
        { sym: 'ə', ex: 'about', hi: 'a', file: 'Mid-central_vowel.ogg', sound: 'about', diff: 'Khó', tip: 'Âm "ơ" cực nhẹ và ngắn (âm không nhấn trọng âm).' },
        { sym: 'e', ex: 'bed', hi: 'e', file: 'Open-mid_front_unrounded_vowel.ogg', sound: 'bed', diff: 'Vừa', tip: 'Mở miệng vừa, đọc ngắn gọn như "e" tiếng Việt.' },
        { sym: 'æ', ex: 'cat', hi: 'a', file: 'Near-open_front_unrounded_vowel.ogg', sound: 'cat', diff: 'Khó', tip: 'Há miệng rộng như nói "a" nhưng đọc âm "e" (a-bẹt).' }
      ],
      diphthongs: [
        { sym: 'eɪ', ex: 'face', hi: 'a', file: '', sound: 'ay', diff: 'Vừa', tip: 'Lướt nhanh từ "ê" sang "i".' },
        { sym: 'aɪ', ex: 'my', hi: 'y', file: '', sound: 'eye', diff: 'Dễ', tip: 'Lướt từ "a" sang "i" (giống "ai").' },
        { sym: 'ɔɪ', ex: 'boy', hi: 'oy', file: '', sound: 'oy', diff: 'Dễ', tip: 'Lướt từ "o" sang "i" (giống "oi").' },
        { sym: 'oʊ', ex: 'go', hi: 'o', file: '', sound: 'oh', diff: 'Vừa', tip: 'Đọc "ô" rồi khép tròn môi sang "u".' },
        { sym: 'aʊ', ex: 'now', hi: 'ow', file: '', sound: 'ow', diff: 'Dễ', tip: 'Lướt từ "a" sang "u" (giống "ao").' },
        { sym: 'ɪə', ex: 'ear', hi: 'ear', file: '', sound: 'ear', diff: 'Khó', tip: 'Lướt từ "i" ngắn sang "ơ" nhẹ.' },
        { sym: 'eə', ex: 'hair', hi: 'air', file: '', sound: 'air', diff: 'Khó', tip: 'Lướt từ "e" sang "ơ" nhẹ.' },
        { sym: 'ʊə', ex: 'tour', hi: 'our', file: '', sound: 'tour', diff: 'Khó', tip: 'Lướt từ "u" ngắn sang "ơ" nhẹ.' }
      ],
      consonantsVoiceless: [
        { sym: 'p', ex: 'pen', hi: 'p', file: 'Voiceless_bilabial_plosive.ogg', sound: 'pen', diff: 'Dễ', tip: 'Mím 2 môi rồi bật mạnh luồng hơi ra (không rung cổ).' },
        { sym: 't', ex: 'tea', hi: 't', file: 'Voiceless_alveolar_plosive.ogg', sound: 'tea', diff: 'Vừa', tip: 'Đầu lưỡi chạm lợi trên rồi bật hơi mạnh ra ngoài.' },
        { sym: 'k', ex: 'key', hi: 'k', file: 'Voiceless_velar_plosive.ogg', sound: 'key', diff: 'Dễ', tip: 'Cuống lưỡi nâng lên bật hơi mạnh như "kh" nhẹ.' },
        { sym: 'f', ex: 'fine', hi: 'f', file: 'Voiceless_labiodental_fricative.ogg', sound: 'fine', diff: 'Dễ', tip: 'Răng trên chạm nhẹ môi dưới rồi thổi hơi ra.' },
        { sym: 'θ', ex: 'think', hi: 'th', file: 'Voiceless_dental_fricative.ogg', sound: 'think', diff: 'Khó', tip: 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi nhẹ (không rung).' },
        { sym: 's', ex: 'see', hi: 's', file: 'Voiceless_alveolar_sibilant.ogg', sound: 'see', diff: 'Vừa', tip: 'Khép nhẹ răng, xì hơi sắc qua khe răng.' },
        { sym: 'ʃ', ex: 'she', hi: 'sh', file: 'Voiceless_postalveolar_fricative.ogg', sound: 'she', diff: 'Khó', tip: 'Chu môi tròn ra trước, thổi hơi mềm như "suỵt".' },
        { sym: 'tʃ', ex: 'chair', hi: 'ch', file: 'Voiceless_postalveolar_affricate.ogg', sound: 'chair', diff: 'Khó', tip: 'Chu môi bật hơi dứt khoát như "ch" nặng có gió.' }
      ],
      consonantsVoiced: [
        { sym: 'b', ex: 'bag', hi: 'b', file: 'Voiced_bilabial_plosive.ogg', sound: 'bag', diff: 'Dễ', tip: 'Mím 2 môi bật ra có rung dây thanh quản.' },
        { sym: 'd', ex: 'day', hi: 'd', file: 'Voiced_alveolar_plosive.ogg', sound: 'day', diff: 'Dễ', tip: 'Đầu lưỡi chạm lợi trên bật ra có rung cổ.' },
        { sym: 'g', ex: 'girl', hi: 'g', file: 'Voiced_velar_plosive.ogg', sound: 'girl', diff: 'Dễ', tip: 'Cuống lưỡi bật ra có rung cổ như "g" tiếng Việt.' },
        { sym: 'v', ex: 'voice', hi: 'v', file: 'Voiced_labiodental_fricative.ogg', sound: 'voice', diff: 'Dễ', tip: 'Răng trên chạm môi dưới, thổi hơi kèm rung cổ.' },
        { sym: 'ð', ex: 'this', hi: 'th', file: 'Voiced_dental_fricative.ogg', sound: 'this', diff: 'Khó', tip: 'Đầu lưỡi giữa 2 hàm răng, đẩy hơi kèm rung cổ.' },
        { sym: 'z', ex: 'zoo', hi: 'z', file: 'Voiced_alveolar_sibilant.ogg', sound: 'zoo', diff: 'Vừa', tip: 'Như âm /s/ nhưng rung dây thanh quản (như tiếng ong).' },
        { sym: 'ʒ', ex: 'measure', hi: 's', file: 'Voiced_postalveolar_fricative.ogg', sound: 'measure', diff: 'Khó', tip: 'Chu môi như /ʃ/ nhưng có rung cổ.' },
        { sym: 'dʒ', ex: 'job', hi: 'j', file: 'Voiced_postalveolar_affricate.ogg', sound: 'job', diff: 'Khó', tip: 'Chu môi bật âm "gi/dờ" có rung cổ.' }
      ],
      consonantsOther: [
        {"sym":"m","ex":"man","hi":"m","file":"","sound":"man","diff":"Dễ","tip":"Khép hai môi, giữ thanh quản rung và để hơi đi qua mũi."},
        {"sym":"n","ex":"no","hi":"n","file":"","sound":"no","diff":"Dễ","tip":"Đầu lưỡi chạm gờ lợi, luồng hơi qua mũi và thanh quản rung."},
        {"sym":"ŋ","ex":"sing","hi":"ng","file":"","sound":"sing","diff":"Vừa","tip":"Nâng phần sau lưỡi chạm vòm mềm, phát thanh qua mũi."},
        {"sym":"h","ex":"house","hi":"h","file":"","sound":"house","diff":"Dễ","tip":"Hơi đi nhẹ qua thanh môn mở; chuẩn bị khẩu hình của nguyên âm sau."},
        {"sym":"l","ex":"light","hi":"l","file":"","sound":"light","diff":"Khó","tip":"Đầu lưỡi chạm gờ lợi, luồng hơi thoát qua hai bên lưỡi."},
        {"sym":"r","ex":"red","hi":"r","file":"","sound":"red","diff":"Khó","tip":"Nâng phần trước lưỡi nhưng không chạm gờ lợi; giữ thanh."},
        {"sym":"j","ex":"yes","hi":"y","file":"","sound":"yes","diff":"Dễ","tip":"Nâng phần trước lưỡi gần vòm cứng và lướt ngay sang nguyên âm."},
        {"sym":"w","ex":"we","hi":"w","file":"","sound":"we","diff":"Dễ","tip":"Tròn môi và nâng phần sau lưỡi, sau đó lướt sang nguyên âm."}
      ],
      endings: [
        { sym: '-t', ex: 'sit', hi: 't', file: 'Voiceless_alveolar_plosive.ogg', sound: 'sit', diff: 'Khó', tip: 'Bật nhẹ âm đuôi /t/ ở cuối từ — đừng nuốt mất âm cuối!' },
        { sym: '-k', ex: 'back', hi: 'ck', file: 'Voiceless_velar_plosive.ogg', sound: 'back', diff: 'Khó', tip: 'Bật nhẹ luồng hơi /k/ ở cuống họng khi kết thúc từ.' },
        { sym: '-s', ex: 'nice', hi: 'ce', file: 'Voiceless_alveolar_sibilant.ogg', sound: 'nice', diff: 'Khó', tip: 'Xì nhẹ âm /s/ ở cuối từ.' },
        { sym: '-(e)s', ex: 'cats', hi: 's', file: 'Voiceless_alveolar_sibilant.ogg', sound: 'cats', diff: 'Khó', tip: 'Đuôi -(e)s có 3 cách đọc: /s/ (cats), /z/ (dogs), /ɪz/ (watches).' },
        { sym: '-ed', ex: 'played', hi: 'ed', file: 'Voiced_alveolar_plosive.ogg', sound: 'played', diff: 'Khó', tip: 'Bật nhẹ âm /d/ cuối từ (không đọc thành "ết").' },
        { sym: '-st', ex: 'past', hi: 'st', file: '', sound: 'past', diff: 'Khó', tip: 'Xì /s/ rồi bật nhẹ /t/ liền mạch ở cuối từ.' },
        { sym: '-nd', ex: 'friend', hi: 'nd', file: '', sound: 'friend', diff: 'Khó', tip: 'Giữ âm /n/ rồi bật nhẹ /d/ ở cuối từ.' }
      ]
    };


    const IPA_DETAIL_GUIDES = {
      'iː': {
        cat: 'Nguyên âm dài', ipaEx: '/ʃiːp/', viEx: 'con cừu',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Kéo môi rộng nhất có thể và giữ môi căng.',
        tongue: 'Căng lưỡi, nâng lưỡi rất cao trong miệng và đẩy ra trước.',
        note: 'Đầu lưỡi cũng có thể đặt ngay sau răng cửa dưới.',
        pitfall: 'Hay đọc ngắn như "i" tiếng Việt nên sheep nghe thành ship, leave thành live. Kéo dài âm, giữ môi căng tới hết.',
        pairs: [['eat', '/iːt/', 'it', '/ɪt/'], ['feel', '/fiːl/', 'fill', '/fɪl/'], ['meal', '/miːl/', 'mill', '/mɪl/']],
        words: ['sheep', 'eat', 'seat', 'feel', 'cheap', 'sleep', 'heat', 'feet', 'reach', 'bean'],
        phrases: ['sweet dreams', 'green tea', 'a piece of cheese', 'see you next week', 'free time', 'keep quiet'],
        sentences: [
          'We have to leave at three o’clock.',
          'Please don’t put your feet on the seats.',
          'Can we meet for coffee next week?',
          'I need some sleep before the meeting.',
          'My teacher speaks slowly and clearly.',
          'He’s reading a magazine on the beach.'
        ]
      },
      'uː': {
        cat: 'Nguyên âm dài', ipaEx: '/fuːd/', viEx: 'thức ăn',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Làm tròn môi thành vòng tròn và giữ môi căng.',
        tongue: 'Căng lưỡi, nâng phần sau lưỡi rất cao và kéo về phía cổ họng.',
        note: 'Giữ khẩu hình tròn môi ổn định và kéo dài hơi đều đặn.',
        pitfall: 'Hay đọc như "u" tiếng Việt, không phân biệt dài ngắn nên pool và pull nghe như nhau. Chu môi căng, kéo dài hẳn tới hết.',
        pairs: [['pool', '/puːl/', 'pull', '/pʊl/'], ['fool', '/fuːl/', 'full', '/fʊl/'], ['soon', '/suːn/', 'sun', '/sʌn/']],
        words: ['pool', 'fool', 'soon', 'noon', 'mood', 'school'],
        phrases: ['a true story', 'a soup spoon', 'a blue balloon', 'too soon', 'a huge room', 'new shoes'],
        sentences: [
          'We usually have soup at noon.',
          'Do you like fruit juice too?',
          'The new school uniform is blue and white.',
          'I lost my blue shoes at the swimming pool.',
          'The music is too loud in here.',
          'Who moved my computer to the new room?'
        ]
      },
      'ɔː': {
        cat: 'Nguyên âm dài', ipaEx: '/sɔː/', viEx: 'đã thấy (quá khứ của see)',
        mouth: 'Mở miệng vừa phải, hẹp hơn khi đọc /ɑː/.',
        lips: 'Làm tròn môi rõ, hơi đưa ra trước và giữ môi căng.',
        tongue: 'Căng lưỡi, kéo lưỡi ra sau và nâng phần sau lưỡi ở mức giữa; giữ âm dài.',
        note: 'Giọng Anh không đọc r cuối (short, port). Giọng Mỹ mở miệng rộng hơn, lưỡi thấp hơn.',
        pitfall: 'Hay đọc ngắn như "o" hoặc "ô" tiếng Việt nên short nghe như shot. Tròn môi, kéo dài; giọng Anh bỏ r cuối, giọng Mỹ đọc r (short, port).',
        pairs: [['walk', '/wɔːk/', 'wok', '/wɒk/'], ['law', '/lɔː/', 'low', '/ləʊ/'], ['ball', '/bɔːl/', 'bowl', '/bəʊl/']],
        words: ['walk', 'stalk', 'law', 'ball', 'call', 'saw', 'hall', 'lawn', 'called', 'bald'],
        phrases: ['a short walk', 'small talk', 'all morning', 'a short story', 'the sports hall', 'draw a horse'],
        sentences: [
          'We all saw the sports report on the morning news.',
          'Call me before you walk to school.',
          'My daughter loves to draw horses.',
          'We walked to the shore before breakfast.',
          'He was born in a small town in the north.',
          'Your football shorts are in the drawer.'
        ]
      },
      'ɑː': {
        cat: 'Nguyên âm dài', ipaEx: '/kɑː/', viEx: 'xe hơi',
        mouth: 'Mở miệng rộng.',
        lips: 'Giữ môi ở tư thế trung tính, không kéo ngang hoặc tròn môi.',
        tongue: 'Căng và làm phẳng lưỡi; đặt lưỡi rất thấp ở giữa khoang miệng, không quá đưa ra trước hoặc kéo ra sau.',
        note: 'Tuỳ giọng địa phương, /ɑː/ có thể được phát âm với lưỡi ở giữa miệng hoặc kéo lùi hơn về phía cổ họng.',
        pitfall: 'Hay đọc như "a" tiếng Việt, ngắn và nông nên heart nghe gần hut. Hạ lưỡi thật thấp, mở rộng miệng, kéo dài; giọng Anh bỏ r cuối, giọng Mỹ đọc r.',
        pairs: [['calm', '/kɑːm/', 'come', '/kʌm/'], ['heart', '/hɑːt/', 'hurt', '/hɜːt/'], ['farm', '/fɑːm/', 'firm', '/fɜːm/']],
        words: ['calm', 'heart', 'far', 'farm', 'hard', 'barn', 'dart', 'star'],
        phrases: ['a car park', 'a garden party', 'a large farm', 'a sharp knife', 'keep calm', 'far apart'],
        sentences: [
          'My father parked the car in the dark.',
          'Is the market very far away?',
          'The party starts in the garden at eight.',
          'Calm down and start the car.',
          'The stars are very bright tonight.',
          'It’s hard to park in the city centre.'
        ]
      },
      'ɜː': {
        cat: 'Nguyên âm dài', ipaEx: '/bɜːd/', viEx: 'con chim',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Giữ môi trung tính và thả lỏng, không tròn môi.',
        tongue: 'Hơi căng lưỡi, đặt lưỡi ở giữa khoang miệng; đầu lưỡi hạ, không cong lên.',
        note: 'Giọng Anh không đọc r: chỉ giữ âm ở giữa miệng và kéo dài. /ɜː/ thường ở âm tiết có nhấn, nhưng vẫn giữ ở vài âm tiết không nhấn như -work (homework /ˈhəʊmwɜːk/).',
        pitfall: 'Hay tròn môi thành "ơ" (work nghe như walk) hoặc mở thành "a" (heard như hard). Miệng hé, kéo dài âm; giọng Mỹ cong đầu lưỡi thành r.',
        pairs: [['bird', '/bɜːd/', 'board', '/bɔːd/'], ['heard', '/hɜːd/', 'hard', '/hɑːd/'], ['shirt', '/ʃɜːt/', 'short', '/ʃɔːt/']],
        words: ['bird', 'shirt', 'turn', 'burn', 'worm', 'hurt', 'heard', 'fur', 'firm', 'stir'],
        phrases: ['the first word', 'learn new words', 'a dirty shirt', 'her birthday', 'a perfect world', 'a church service'],
        sentences: [
          'She has worked as a nurse for thirty years.',
          'The early bird catches the worm.',
          'Turn left at the church and it’s the first house.',
          'I was nervous on my first day at work.',
          'I’d like to return this shirt, please.',
          'Which girl came first in the race?'
        ]
      },
      'ɪ': {
        cat: 'Nguyên âm ngắn', ipaEx: '/ʃɪp/', viEx: 'con tàu',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Kéo môi ngang nhưng giữ môi thả lỏng.',
        tongue: 'Thả lỏng lưỡi, nâng lưỡi cao trong miệng và đẩy ra trước.',
        note: 'Âm này cũng có thể phát âm với môi trung tính. Đầu lưỡi có thể đặt ngay sau răng cửa dưới.',
        pitfall: 'Hay đọc thành "i" Việt căng và dài nên ship nghe như sheep, live như leave. Thả lỏng môi lưỡi, đọc thật ngắn, hơi ngả về "ê".',
        pairs: [['it', '/ɪt/', 'eat', '/iːt/'], ['sit', '/sɪt/', 'seat', '/siːt/'], ['fill', '/fɪl/', 'feel', '/fiːl/']],
        words: ['ship', 'list', 'bit', 'still', 'lip', 'sick', 'dip', 'hill', 'pitch', 'chick'],
        phrases: ['fish and chips', 'a little bit', 'a busy city', 'the kitchen sink', 'different things', 'swimming pool'],
        sentences: [
          'My little sister is six years old.',
          'Is this the quickest way to the city?',
          'Did you fix the window in the kitchen?',
          'The milk is in the fridge.',
          'The children are swimming in the river.',
          'Sit still and listen to this song.'
        ]
      },
      'ʊ': {
        cat: 'Nguyên âm ngắn', ipaEx: '/bʊk/', viEx: 'cuốn sách',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Làm tròn môi nhẹ và giữ môi thả lỏng.',
        tongue: 'Thả lỏng lưỡi, nâng phần sau lưỡi lên cao và kéo về phía cổ họng.',
        note: 'Âm ngắn và thả lỏng hoàn toàn, không chu môi căng như /uː/.',
        pitfall: 'Hay đọc thành "u" Việt dài, chu môi căng nên full nghe như fool, pull như pool. Thả lỏng môi, đọc ngắn và nhẹ.',
        pairs: [['full', '/fʊl/', 'fool', '/fuːl/'], ['pull', '/pʊl/', 'pool', '/puːl/'], ['could', '/kʊd/', 'cooed', '/kuːd/']],
        words: ['full', 'pull', 'could', 'should', 'wood', 'look', 'book', 'took'],
        phrases: ['my favourite book', 'a good cook', 'brown sugar', 'the football team', 'a wooden table', 'look at this'],
        sentences: [
          'Put the books back on the shelf, please.',
          'I took a good look at the photos.',
          'We should cook the chicken a bit longer.',
          'He stood on my foot by mistake.',
          'Could you put the book on the shelf?',
          'The woman pushed the door and looked in.'
        ]
      },
      'ɒ': {
        cat: 'Nguyên âm ngắn', ipaEx: '/hɒt/', viEx: 'nóng',
        mouth: 'Miệng mở rộng, hàm hạ thấp.',
        lips: 'Môi tròn nhẹ, không chu ra trước.',
        tongue: 'Lưỡi hạ thấp, lùi về sau; đọc ngắn, dứt gọn.',
        note: 'Giọng Anh tròn môi nhẹ và ngắn; giọng Mỹ thường mở rộng hơn gần /ɑː/.',
        pitfall: 'Hay kéo dài thành /ɔː/ (shot nghe như short) hoặc bẹt thành "ă" (lock nghe như luck). Đọc thật ngắn, môi tròn nhẹ như "o".',
        pairs: [['lock', '/lɒk/', 'luck', '/lʌk/'], ['not', '/nɒt/', 'nut', '/nʌt/'], ['shot', '/ʃɒt/', 'short', '/ʃɔːt/']],
        words: ['lock', 'not', 'long', 'boss', 'body', 'cot', 'shot', 'pot', 'spot', 'fox'],
        phrases: ['hot coffee', 'not a lot', 'got a job', 'a long holiday', 'a box of chocolates', 'a common problem'],
        sentences: [
          'The doctor says I should stop drinking coffee.',
          'The shops stop selling hot food at ten o’clock.',
          'She got a job at the hospital.',
          'I’m sorry, I forgot to wash the bottles.',
          'Can you watch the shop while I pop out?',
          'The dog got lost in the forest.'
        ]
      },
      'ʌ': {
        cat: 'Nguyên âm ngắn', ipaEx: '/kʌp/', viEx: 'cốc, tách',
        mouth: 'Mở miệng nhẹ.',
        lips: 'Giữ môi trung tính và thả lỏng.',
        tongue: 'Thả lỏng lưỡi, giữ lưỡi ở vị trí giữa khoang miệng.',
        note: '/ʌ/ thường nằm ở âm tiết có nhấn; ở âm tiết không nhấn nó hay yếu thành /ə/, trừ vài chỗ như un- (unhappy /ʌnˈhæpi/).',
        pitfall: 'Hay kéo dài thành /ɑː/ (cut nghe như cart) hoặc mở rộng thành /æ/ (cup nghe như cap). Đọc ngắn, gọn như "ă".',
        pairs: [['up', '/ʌp/', 'app', '/æp/'], ['but', '/bʌt/', 'bat', '/bæt/'], ['cup', '/kʌp/', 'cap', '/kæp/']],
        words: ['come', 'stuff', 'cup', 'cut', 'fun', 'much', 'run', 'bug', 'uncle', 'truck'],
        phrases: ['a cup of tea', 'my younger brother', 'a lucky number', 'just enough', 'Sunday lunch', 'run for the bus'],
        sentences: [
          'My mother loves running with us.',
          'We must run or we’ll miss the bus.',
          'The club meets once a month.',
          'There’s nothing in the cupboard for lunch.',
          'Is it fun to study in another country?',
          'Mum cut up the onions for the soup.'
        ]
      },
      'ə': {
        cat: 'Nguyên âm ngắn', ipaEx: '/əˈbaʊt/', viEx: 'về, khoảng',
        mouth: 'Miệng hé nhẹ, hàm thả lỏng, gần như không cử động.',
        lips: 'Môi thả lỏng hoàn toàn, không tròn, không dẹt.',
        tongue: 'Lưỡi nằm yên giữa miệng; đọc rất ngắn, nhẹ, không nhấn.',
        note: 'Đây là âm xuất hiện nhiều nhất trong tiếng Anh ở các âm tiết không nhấn (schwa).',
        pitfall: 'Hay đọc rõ theo mặt chữ (about thành "a-bao") hoặc thành /ɪ/: accept nghe như except. Âm tiết không nhấn đọc lướt như "ơ" rất nhẹ.',
        pairs: [['accept', '/əkˈsept/', 'except', '/ɪkˈsept/'], ['affect', '/əˈfekt/', 'effect', '/ɪˈfekt/'], ['addition', '/əˈdɪʃn/', 'edition', '/ɪˈdɪʃn/']],
        words: ['accept', 'addition', 'alike', 'away', 'support', 'parade'],
        phrases: ['talk about a problem', 'a famous actor', 'together again', 'tomorrow afternoon', "a doctor's appointment", 'a chocolate cake'],
        sentences: [
          'The teacher forgot about the lesson.',
          'This banana bread is absolutely delicious.',
          'The cinema is open again today.',
          'My neighbours went away on holiday.',
          'The police officer asked a question.',
          'Remember to bring a camera tomorrow.'
        ]
      },
      'e': {
        cat: 'Nguyên âm ngắn', ipaEx: '/bed/', viEx: 'cái giường',
        mouth: 'Mở miệng một phần.',
        lips: 'Kéo môi hơi ngang nhưng vẫn thả lỏng.',
        tongue: 'Thả lỏng lưỡi, đặt lưỡi hơi thấp hơn đường giữa và đẩy ra trước.',
        note: 'Đầu lưỡi cũng có thể đặt ngay sau răng cửa dưới.',
        pitfall: 'Hay đọc khép thành "ê" hoặc mở quá thành /æ/: bed nghe như bad, pen như pan. Hạ hàm vừa phải, đọc ngắn, gần "e" tiếng Việt.',
        pairs: [['bed', '/bed/', 'bad', '/bæd/'], ['end', '/end/', 'and', '/ænd/'], ['pen', '/pen/', 'pan', '/pæn/']],
        words: ['bed', 'pen', 'men', 'said', 'head', 'send', 'beg', 'lend', 'bet', 'guess'],
        phrases: ['get dressed', 'breakfast in bed', 'a red dress', 'fresh bread', 'help yourself', 'very well'],
        sentences: [
          'Let me check the menu again.',
          'My best friend never forgets my birthday.',
          'Did you get the message I sent yesterday?',
          'I felt tired, so I went to bed early.',
          'You need some rest to get better.',
          'The reception desk is next to the lift.'
        ]
      },
      'æ': {
        cat: 'Nguyên âm ngắn (a-bẹt)', ipaEx: '/kæt/', viEx: 'con mèo',
        mouth: 'Há miệng rộng, hạ cằm xuống thấp.',
        lips: 'Môi hơi kéo nhẹ sang hai bên, không tròn môi.',
        tongue: 'Đầu lưỡi chạm răng cửa dưới, thân lưỡi ép thấp xuống.',
        note: 'Khẩu hình giống chữ "a" nhưng phát ra âm lai giữa "a" và "e".',
        pitfall: 'Người Việt hay đọc thành "e" thường nên bad nghe thành bed, man nghe thành men.',
        pairs: [['bad', '/bæd/', 'bed', '/bed/'], ['man', '/mæn/', 'men', '/men/'], ['pan', '/pæn/', 'pen', '/pen/']],
        words: ['cat', 'hat', 'bag', 'apple', 'happy', 'family', 'thank', 'plan'],
        phrases: ['black cat', 'a bad habit', 'happy family', 'thank you', 'back pack', 'fast track'],
        sentences: [
          'The black cat sat on the mat.',
          'I have a happy family.',
          'Can I have an apple, please?',
          'That man has a black bag.'
        ]
      },
      'θ': {
        cat: 'Phụ âm vô thanh', ipaEx: '/θɪŋk/', viEx: 'suy nghĩ',
        mouth: 'Mở hé nhẹ.',
        lips: 'Môi thả lỏng tự nhiên.',
        tongue: 'Đặt nhẹ đầu lưỡi vào giữa hai hàm răng trên và dưới.',
        note: 'Thổi luồng hơi nhẹ qua khe giữa lưỡi và răng trên — KHÔNG rung cổ họng.',
        pitfall: 'Người Việt hay đọc thành "thờ" tiếng Việt nên think nghe thành tink, thank thành tank.',
        pairs: [['think', '/θɪŋk/', 'sink', '/sɪŋk/'], ['three', '/θriː/', 'tree', '/triː/'], ['thank', '/θæŋk/', 'tank', '/tæŋk/']],
        words: ['think', 'thank', 'three', 'mouth', 'both', 'month', 'north', 'healthy'],
        phrases: ['thank you', 'three thousand', 'both of us', 'healthy food'],
        sentences: [
          'Thank you for thinking of me.',
          'I have three brothers.',
          'My birthday is next month.'
        ]
      },
      'ð': {
        cat: 'Phụ âm hữu thanh', ipaEx: '/ðɪs/', viEx: 'cái này',
        mouth: 'Mở hé nhẹ.',
        lips: 'Môi thả lỏng tự nhiên.',
        tongue: 'Đặt nhẹ đầu lưỡi vào giữa hai hàm răng giống âm /θ/.',
        note: 'Vừa thổi hơi vừa RUNG dây thanh quản ở cổ họng (sờ tay lên cổ sẽ thấy rung).',
        pitfall: 'Hay đọc thành "đờ" hoặc "dờ" tiếng Việt (this thành đít, that thành đát).',
        pairs: [['they', '/ðeɪ/', 'day', '/deɪ/'], ['there', '/ðeə/', 'dare', '/deə/'], ['breathe', '/briːð/', 'breeze', '/briːz/']],
        words: ['this', 'that', 'they', 'mother', 'father', 'brother', 'weather', 'together'],
        phrases: ['this and that', 'mother and father', 'the weather', 'together with'],
        sentences: [
          'This is my mother and that is my father.',
          'The weather is nice today.',
          'Let’s study together.'
        ]
      },
      'ʃ': {
        cat: 'Phụ âm vô thanh', ipaEx: '/ʃiː/', viEx: 'cô ấy',
        mouth: 'Mở nhỏ, hai hàm răng gần khép lại.',
        lips: 'Chu môi tròn và đẩy nhẹ ra trước (như khi ra hiệu "suỵt!").',
        tongue: 'Nâng mặt lưỡi lên gần vòm miệng, không chạm hẳn.',
        note: 'Thổi hơi mạnh, dài và êm — không rung cổ họng.',
        pitfall: 'Người Việt hay quên chu môi nên she nghe giống see, wash nghe giống was.',
        pairs: [['she', '/ʃiː/', 'see', '/siː/'], ['ship', '/ʃɪp/', 'sip', '/sɪp/'], ['short', '/ʃɔːt/', 'sort', '/sɔːt/']],
        words: ['she', 'shop', 'shoe', 'fish', 'wash', 'English', 'sugar', 'nation'],
        phrases: ['fresh fish', 'English class', 'wash dishes', 'shopping mall'],
        sentences: [
          'She sells fresh fish at the shop.',
          'I study English every day.',
          'Please wash your hands before dinner.'
        ]
      },
      'tʃ': {
        cat: 'Phụ âm vô thanh', ipaEx: '/tʃeə/', viEx: 'cái ghế',
        mouth: 'Khép nhẹ rồi bật mở nhanh.',
        lips: 'Chu môi nhẹ ra trước như âm /ʃ/.',
        tongue: 'Đầu lưỡi chạm lợi trên để chặn hơi, sau đó bật mạnh ra cùng tiếng /ʃ/.',
        note: 'Bật hơi rõ và dứt khoát, không rung cổ họng.',
        pitfall: 'Hay đọc nhẹ quá thành "ch" tiếng Việt không có hơi bật mạnh.',
        pairs: [['chair', '/tʃeə/', 'share', '/ʃeə/'], ['cheap', '/tʃiːp/', 'sheep', '/ʃiːp/'], ['watch', '/wɒtʃ/', 'wash', '/wɒʃ/']],
        words: ['chair', 'cheese', 'check', 'lunch', 'watch', 'teacher', 'kitchen', 'picture'],
        phrases: ['cheap watch', 'cheese sandwich', 'my teacher', 'lunch time'],
        sentences: [
          'My teacher sits on the chair.',
          'What did you have for lunch?',
          'Let’s watch a movie tonight.'
        ]
      },
      '-(e)s': {
        cat: 'Âm cuối (số nhiều / ngôi 3)', ipaEx: '/kæts/', viEx: 'những con mèo',
        mouth: 'Khép nhẹ hai hàm răng gần sát nhau.',
        lips: 'Môi thả lỏng tự nhiên, hơi kéo nhẹ sang hai bên.',
        tongue: 'Đầu lưỡi đặt gần lợi trên, thổi luồng hơi gọn ra qua khe răng — KHÔNG đọc kéo dài hay thêm "ờ".',
        note: 'Đuôi -(e)s có 3 cách đọc chuẩn: (1) Đọc /s/ sau âm vô thanh p, t, k, f, θ (cats, books, stops); (2) Đọc /ɪz/ sau âm gió s, z, sh, ch, x, ge (buses, watches, boxes); (3) Đọc /z/ sau tất cả các âm hữu thanh & nguyên âm còn lại (dogs, bags, plays).',
        pitfall: 'Người Việt hay bỏ luôn đuôi -s/-es (cats nghe như cat) hoặc đọc nhầm từ nào cũng xì /s/ mạnh dù phải đọc /z/ (dogs) hay /ɪz/ (watches).',
        pairs: [['cats', '/kæts/', 'cat', '/kæt/'], ['dogs', '/dɒgz/', 'dog', '/dɒg/'], ['watches', '/ˈwɒtʃɪz/', 'watch', '/wɒtʃ/']],
        words: ['cats', 'books', 'stops', 'dogs', 'bags', 'plays', 'buses', 'watches', 'boxes', 'dishes'],
        phrases: ['two black cats', 'three big dogs', 'five new books', 'red buses', 'clean dishes', 'my watches'],
        sentences: [
          'The two cats love sleeping on the sofa.',
          'She reads five books every month.',
          'My brother walks our two dogs every morning.',
          'The red buses stop near my school.',
          'He watches English cartoons after dinner.',
          'Please put the clean dishes in those boxes.'
        ]
      },
      '-t': {
        cat: 'Âm cuối hay quên', ipaEx: '/kæt/', viEx: 'con mèo',
        mouth: 'Mở nhỏ.',
        lips: 'Môi thả lỏng.',
        tongue: 'Đầu lưỡi chạm vào lợi ngay sau răng cửa trên, giữ hơi 1 tích tắc rồi bật nhẹ ra.',
        note: 'Chỉ bật luồng hơi "t" thật gọn, KHÔNG thêm tiếng "ờ" thành "cat-tờ".',
        pitfall: 'Người Việt hay nuốt mất âm cuối nên cat, cap, cab nghe y hệt nhau.',
        pairs: [['cat', '/kæt/', 'cap', '/kæp/'], ['hat', '/hæt/', 'had', '/hæd/'], ['right', '/raɪt/', 'ride', '/raɪd/']],
        words: ['cat', 'hot', 'night', 'right', 'start', 'street', 'student', 'market'],
        phrases: ['hot tea', 'good night', 'that cat', 'right now'],
        sentences: [
          'It is a hot night.',
          'Put your hat on right now.',
          'The cat sat on the mat.'
        ]
      }
    };

    function ipaAccent() { return (ui.ipaPractice && ui.ipaPractice.accent) || ui.ipaAccent || 'en-GB'; }
    function ipaSymbol(sym, word) { return NTPronunciation.symbol(sym, ipaAccent(), word); }
    function ipaHighlight(sym, word) { return NTPronunciation.highlight(sym, word, ipaAccent()); }
    function ipaWordIPA(word) { return NTPronunciation.wordIPA(word, ipaAccent()); }
    const ipaStatusHTML = '<p class="nt-ipa-status" data-ipa-audio-status role="status" aria-live="polite"></p>';
    let _ipaController = null;
    let _ipaAudioMessage = '';
    let _ipaAudioError = false;

    function updateIpaAudioStatus() {
      document.querySelectorAll('[data-ipa-audio-status]').forEach(node => {
        node.textContent = _ipaAudioMessage;
        node.dataset.error = String(_ipaAudioError);
      });
    }
    function getIpaController() {
      if (!_ipaController) _ipaController = new EngStartPronunciationController({
        manifest: window.ENGSTART_PHONEME_AUDIO,
        onStatus: event => {
          _ipaAudioMessage = event.message || '';
          _ipaAudioError = event.type === 'error';
          updateIpaAudioStatus();
          if (_ipaAudioError) showToast(_ipaAudioMessage);
        }
      });
      return _ipaController;
    }
    function stopIpaAudio() { if (_ipaController && _ipaController.isPlaying) _ipaController.stop(); }
    function finishIpaPlayback(promise) {
      Promise.resolve(promise).catch(error => {
        if (error && error.code === 'CANCELED') return;
        _ipaAudioMessage = error && error.message || 'Chưa phát được âm thanh. Hãy bấm nghe lại.';
        _ipaAudioError = true;
        updateIpaAudioStatus();
      });
    }
    function playIpaPhoneme(sym, word, rate = 1) {
      const target = NTPronunciation.target(sym, word, ipaAccent());
      if (!target || !target.id) {
        stopIpaAudio();
        _ipaAudioError = true;
        _ipaAudioMessage = 'Chưa có bản thu riêng cho âm này. Không chuyển sang đọc cả từ.';
        updateIpaAudioStatus();
        showToast(_ipaAudioMessage);
        return;
      }
      stopIpaPracticeRecording();
      const accent=ipaAccent();
      finishIpaPlayback(getIpaController().playSound(target.id, {accent,rate}).then(result=>{
        state.ipaHeard = state.ipaHeard && typeof state.ipaHeard==='object' ? state.ipaHeard : {};
        state.ipaHeard[accent] = state.ipaHeard[accent] || {};
        if(!state.ipaHeard[accent][sym]) {state.ipaHeard[accent][sym]=true;saveState();}
        if(state.mainNav==='pronunciation' && !ui.ipaDetailSym && !ui.ipaPractice && (ui.pronLang||'en')==='en') renderAioPronunciationPage();
        return result;
      }));
    }
    function getIpaGuide(item) {
      const fix = NTPronunciation.guide(item.sym, ipaAccent());
      const old = IPA_DETAIL_GUIDES[item.sym];
      const supplemental = fix?.practiceV31 || {};
      const pair = supplemental.pair || (fix && fix.pair);
      const isUS = ipaAccent() === 'en-US';
      const fallbackPairs = pair ? [[pair.a,pair[isUS?'ipaAUS':'ipaAUK'],pair.b,pair[isUS?'ipaBUS':'ipaBUK']]] : [];
      const base = old || {
        cat:item.sym.startsWith('-') ? 'Âm cuối' : AIO_IPA_TABLE.consonantsOther.some(x=>x.sym===item.sym) ? 'Phụ âm không ghép cặp' : 'Âm tiếng Anh',
        pairs:fallbackPairs, words:[item.ex],
        phrases:[item.ex], sentences:[`Please say ${item.ex} clearly.`]
      };
      const primary = NTPronunciation.target(item.sym,item.ex,ipaAccent());
      const appendUnique = (old, extra) => [...new Set([...(old || []), ...(extra || [])])];
      const enrichedPairs = [...(base.pairs || [])];
      fallbackPairs.forEach(pr=>{if(!enrichedPairs.some(x=>x[0]===pr[0]&&x[2]===pr[2])) enrichedPairs.push(pr);});
      return {...base,
        words:appendUnique(base.words,supplemental.words),
        phrases:appendUnique(base.phrases,supplemental.phrases),
        sentences:appendUnique(base.sentences,supplemental.sentences),
        ipaEx:primary && primary.wordIPA || '',
        viEx:fix && fix.meaning || (old && item.sym !== '-t' ? old.viEx : '') || '',
        mouth:fix && fix.tip || item.tip,
        lips:fix && fix.steps[0] || '',
        tongue:fix && fix.steps.slice(1).join(' ') || '',
        note:[fix && fix.accentNote,'Nghe âm riêng trước; “Cả từ” dùng để nghe âm trong từ. Phụ âm và âm cuối được lặp 3 lần, không thêm nguyên âm đệm.'].filter(Boolean).join(' '),
        pitfall:fix && fix.mistake || '',
        pairs:enrichedPairs.filter(pair => {
          const words = [pair[0].toLowerCase(),pair[2].toLowerCase()];
          if (words[0] === words[1]) return false;
          if (words.some(word=>['book','took','accept','except','affect','effect','addition','edition'].includes(word))) return false;
          if (isUS && ['ɔː','ɒ'].includes(item.sym) && words.some(word=>['walk','wok','stalk','stock'].includes(word))) return false;
          return true;
        })
      };
    }

    // ==================== AIO IPA PRACTICE MODE (Cụm từ / Câu / Thử thách nghe) ====================
    const IPA_MINIMAL_CONTRASTS = {
      sheep: ['ship', '/ʃiːp/', '/ʃɪp/'], eat: ['it', '/iːt/', '/ɪt/'], seat: ['sit', '/siːt/', '/sɪt/'],
      feel: ['fill', '/fiːl/', '/fɪl/'], cheap: ['chip', '/tʃiːp/', '/tʃɪp/'], sleep: ['slip', '/sliːp/', '/slɪp/'],
      heat: ['hit', '/hiːt/', '/hɪt/'], feet: ['fit', '/fiːt/', '/fɪt/'], reach: ['rich', '/riːtʃ/', '/rɪtʃ/'],
      bean: ['bin', '/biːn/', '/bɪn/'], meal: ['mill', '/miːl/', '/mɪl/'],
      ship: ['sheep', '/ʃɪp/', '/ʃiːp/'], list: ['least', '/lɪst/', '/liːst/'], bit: ['beat', '/bɪt/', '/biːt/'],
      still: ['steal', '/stɪl/', '/stiːl/'], lip: ['leap', '/lɪp/', '/liːp/'], sick: ['seek', '/sɪk/', '/siːk/'],
      dip: ['deep', '/dɪp/', '/diːp/'], hill: ['heel', '/hɪl/', '/hiːl/'], pitch: ['peach', '/pɪtʃ/', '/piːtʃ/'],
      chick: ['cheek', '/tʃɪk/', '/tʃiːk/'],
      pool: ['pull', '/puːl/', '/pʊl/'], fool: ['full', '/fuːl/', '/fʊl/'], soon: ['sun', '/suːn/', '/sʌn/'],
      noon: ['none', '/nuːn/', '/nʌn/'], mood: ['mud', '/muːd/', '/mʌd/'], school: ['skull', '/skuːl/', '/skʌl/'],
      full: ['fool', '/fʊl/', '/fuːl/'], pull: ['pool', '/pʊl/', '/puːl/'], could: ['cooed', '/kʊd/', '/kuːd/'],
      should: ['shoed', '/ʃʊd/', '/ʃuːd/'], wood: ['wooed', '/wʊd/', '/wuːd/'], look: ['Luke', '/lʊk/', '/luːk/'],
      book: ['boot', '/bʊk/', '/buːt/'], took: ['tooth', '/tʊk/', '/tuːθ/'],
      walk: ['wok', '/wɔːk/', '/wɒk/'], stalk: ['stock', '/stɔːk/', '/stɒk/'], law: ['low', '/lɔː/', '/ləʊ/'],
      ball: ['bowl', '/bɔːl/', '/bəʊl/'], call: ['coal', '/kɔːl/', '/kəʊl/'], saw: ['so', '/sɔː/', '/səʊ/'],
      hall: ['hole', '/hɔːl/', '/həʊl/'], lawn: ['loan', '/lɔːn/', '/ləʊn/'], called: ['cold', '/kɔːld/', '/kəʊld/'],
      bald: ['bold', '/bɔːld/', '/bəʊld/'],
      calm: ['come', '/kɑːm/', '/kʌm/'], heart: ['hurt', '/hɑːt/', '/hɜːt/'], far: ['fur', '/fɑː/', '/fɜː/'],
      farm: ['firm', '/fɑːm/', '/fɜːm/'], hard: ['heard', '/hɑːd/', '/hɜːd/'], barn: ['burn', '/bɑːn/', '/bɜːn/'],
      dart: ['dirt', '/dɑːt/', '/dɜːt/'], star: ['stir', '/stɑː/', '/stɜː/'],
      bird: ['board', '/bɜːd/', '/bɔːd/'], shirt: ['short', '/ʃɜːt/', '/ʃɔːt/'], turn: ['torn', '/tɜːn/', '/tɔːn/'],
      burn: ['born', '/bɜːn/', '/bɔːn/'], worm: ['warm', '/wɜːm/', '/wɔːm/'], hurt: ['heart', '/hɜːt/', '/hɑːt/'],
      heard: ['hard', '/hɜːd/', '/hɑːd/'], fur: ['far', '/fɜː/', '/fɑː/'], firm: ['farm', '/fɜːm/', '/fɑːm/'],
      stir: ['star', '/stɜː/', '/stɑː/'],
      lock: ['luck', '/lɒk/', '/lʌk/'], not: ['nut', '/nɒt/', '/nʌt/'], long: ['lung', '/lɒŋ/', '/lʌŋ/'],
      boss: ['bus', '/bɒs/', '/bʌs/'], body: ['buddy', '/ˈbɒdi/', '/ˈbʌdi/'], cot: ['cut', '/kɒt/', '/kʌt/'],
      shot: ['short', '/ʃɒt/', '/ʃɔːt/'], pot: ['port', '/pɒt/', '/pɔːt/'], spot: ['sport', '/spɒt/', '/spɔːt/'],
      fox: ['forks', '/fɒks/', '/fɔːks/'],
      come: ['calm', '/kʌm/', '/kɑːm/'], stuff: ['staff', '/stʌf/', '/stɑːf/'], cup: ['cap', '/kʌp/', '/kæp/'],
      cut: ['cat', '/kʌt/', '/kæt/'], fun: ['fan', '/fʌn/', '/fæn/'], much: ['match', '/mʌtʃ/', '/mætʃ/'],
      run: ['ran', '/rʌn/', '/ræn/'], bug: ['bag', '/bʌg/', '/bæg/'], uncle: ['ankle', '/ˈʌŋkl/', '/ˈæŋkl/'],
      truck: ['track', '/trʌk/', '/træk/'],
      accept: ['except', '/əkˈsept/', '/ɪkˈsept/'], addition: ['edition', '/əˈdɪʃn/', '/ɪˈdɪʃn/'],
      alike: ['like', '/əˈlaɪk/', '/laɪk/'], away: ['way', '/əˈweɪ/', '/weɪ/'],
      support: ['sport', '/səˈpɔːt/', '/spɔːt/'], parade: ['prayed', '/pəˈreɪd/', '/preɪd/'],
      bed: ['bad', '/bed/', '/bæd/'], pen: ['pan', '/pen/', '/pæn/'], men: ['man', '/men/', '/mæn/'],
      said: ['sad', '/sed/', '/sæd/'], head: ['had', '/hed/', '/hæd/'], send: ['sand', '/send/', '/sænd/'],
      beg: ['bag', '/beg/', '/bæg/'], lend: ['land', '/lend/', '/lænd/'], bet: ['bat', '/bet/', '/bæt/'],
      guess: ['gas', '/ges/', '/gæs/'],
      cat: ['cut', '/kæt/', '/kʌt/'], hat: ['hut', '/hæt/', '/hʌt/'], bag: ['beg', '/bæg/', '/beg/'],
      think: ['sink', '/θɪŋk/', '/sɪŋk/'], thank: ['tank', '/θæŋk/', '/tæŋk/'], three: ['tree', '/θriː/', '/triː/'],
      this: ['dis', '/ðɪs/', '/dɪs/'], they: ['day', '/ðeɪ/', '/deɪ/'],
      she: ['see', '/ʃiː/', '/siː/'], chair: ['share', '/tʃeə/', '/ʃeə/'], watch: ['wash', '/wɒtʃ/', '/wɒʃ/']
    };

    const IPA_PHRASE_VI = {
      'sweet dreams': ['mơ đẹp nhé', '/swiːt driːmz/'],
      'green tea': ['trà xanh', '/griːn tiː/'],
      'a piece of cheese': ['một miếng phô mai', '/ə piːs əv tʃiːz/'],
      'see you next week': ['hẹn gặp bạn tuần tới', '/siː juː nekst wiːk/'],
      'free time': ['thời gian rảnh', '/friː taɪm/'],
      'keep quiet': ['giữ im lặng', '/kiːp ˈkwaɪət/'],
      'a true story': ['một câu chuyện có thật', '/ə truː ˈstɔːri/'],
      'a soup spoon': ['một cái thìa súp', '/ə suːp spuːn/'],
      'a blue balloon': ['một quả bóng bay xanh', '/ə bluː bəˈluːn/'],
      'too soon': ['quá sớm', '/tuː suːn/'],
      'a huge room': ['một căn phòng rộng lớn', '/ə hjuːdʒ ruːm/'],
      'new shoes': ['đôi giày mới', '/njuː ʃuːz/'],
      'a short walk': ['một chuyến đi bộ ngắn', '/ə ʃɔːt wɔːk/'],
      'small talk': ['chuyện phiếm xã giao', '/smɔːl tɔːk/'],
      'all morning': ['cả buổi sáng', '/ɔːl ˈmɔːnɪŋ/'],
      'a short story': ['một truyện ngắn', '/ə ʃɔːt ˈstɔːri/'],
      'the sports hall': ['nhà thi đấu thể thao', '/ðə spɔːts hɔːl/'],
      'draw a horse': ['vẽ một con ngựa', '/drɔː ə hɔːs/'],
      'a car park': ['bãi đỗ xe hơi', '/ə kɑː pɑːk/'],
      'a garden party': ['tiệc ngoài vườn', '/ə ˈgɑːdn ˈpɑːti/'],
      'a large farm': ['một trang trại rộng', '/ə lɑːdʒ fɑːm/'],
      'a sharp knife': ['một con dao sắc', '/ə ʃɑːp naɪf/'],
      'keep calm': ['giữ bình tĩnh', '/kiːp kɑːm/'],
      'far apart': ['cách xa nhau', '/fɑːr əˈpɑːt/'],
      'the first word': ['từ đầu tiên', '/ðə fɜːst wɜːd/'],
      'learn new words': ['học từ mới', '/lɜːn njuː wɜːdz/'],
      'a dirty shirt': ['một chiếc áo sơ mi bẩn', '/ə ˈdɜːti ʃɜːt/'],
      'her birthday': ['sinh nhật của cô ấy', '/hɜː ˈbɜːθdeɪ/'],
      'a perfect world': ['một thế giới hoàn hảo', '/ə ˈpɜːfɪkt wɜːld/'],
      'a church service': ['buổi lễ nhà thờ', '/ə tʃɜːtʃ ˈsɜːvɪs/'],
      'fish and chips': ['cá và khoai tây chiên', '/fɪʃ ənd tʃɪps/'],
      'a little bit': ['một chút xíu', '/ə ˈlɪtl bɪt/'],
      'a busy city': ['một thành phố nhộn nhịp', '/ə ˈbɪzi ˈsɪti/'],
      'the kitchen sink': ['bồn rửa nhà bếp', '/ðə ˈkɪtʃɪn sɪŋk/'],
      'different things': ['những điều khác nhau', '/ˈdɪfrənt θɪŋz/'],
      'swimming pool': ['hồ bơi', '/ˈswɪmɪŋ puːl/'],
      'my favourite book': ['cuốn sách yêu thích của tôi', '/maɪ ˈfeɪvərɪt bʊk/'],
      'a good cook': ['một đầu bếp giỏi', '/ə gʊd kʊk/'],
      'brown sugar': ['đường nâu', '/braʊn ˈʃʊgə/'],
      'the football team': ['đội bóng đá', '/ðə ˈfʊtbɔːl tiːm/'],
      'a wooden table': ['một chiếc bàn gỗ', '/ə ˈwʊdn ˈteɪbl/'],
      'look at this': ['hãy nhìn cái này xem', '/lʊk æt ðɪs/'],
      'hot coffee': ['cà phê nóng', '/hɒt ˈkɒfi/'],
      'not a lot': ['không nhiều lắm', '/nɒt ə lɒt/'],
      'got a job': ['tìm được việc làm', '/gɒt ə dʒɒb/'],
      'a long holiday': ['một kỳ nghỉ dài', '/ə lɒŋ ˈhɒlədeɪ/'],
      'a box of chocolates': ['một hộp sô-cô-la', '/ə bɒks əv ˈtʃɒkləts/'],
      'a common problem': ['một vấn đề phổ biến', '/ə ˈkɒmən ˈprɒbləm/'],
      'a cup of tea': ['một tách trà', '/ə kʌp əv tiː/'],
      'my younger brother': ['em trai của tôi', '/maɪ ˈjʌŋgə ˈbrʌðə/'],
      'a lucky number': ['một con số may mắn', '/ə ˈlʌki ˈnʌmbə/'],
      'just enough': ['vừa đủ', '/dʒʌst ɪˈnʌf/'],
      'Sunday lunch': ['bữa trưa Chủ nhật', '/ˈsʌndeɪ lʌntʃ/'],
      'run for the bus': ['chạy đuổi theo xe buýt', '/rʌn fə ðə bʌs/'],
      'talk about a problem': ['nói về một vấn đề', '/tɔːk əˈbaʊt ə ˈprɒbləm/'],
      'a famous actor': ['một diễn viên nổi tiếng', '/ə ˈfeɪməs ˈæktə/'],
      'together again': ['lại ở bên nhau', '/təˈgeðər əˈgen/'],
      'tomorrow afternoon': ['chiều ngày mai', '/təˈmɒrəʊ ˌɑːftəˈnuːn/'],
      "a doctor's appointment": ['lịch hẹn bác sĩ', '/ə ˈdɒktəz əˈpɔɪntmənt/'],
      'a chocolate cake': ['một chiếc bánh sô-cô-la', '/ə ˈtʃɒklət keɪk/'],
      'get dressed': ['mặc quần áo', '/get drest/'],
      'breakfast in bed': ['bữa sáng trên giường', '/ˈbrekfəst ɪn bed/'],
      'a red dress': ['một chiếc váy đỏ', '/ə red dres/'],
      'fresh bread': ['bánh mì tươi', '/freʃ bred/'],
      'help yourself': ['cứ tự nhiên nhé', '/help jɔːˈself/'],
      'very well': ['rất tốt', '/ˈveri wel/']
    };

    let _ipaRecMedia = null;
    let _ipaRecChunks = [];
    let _ipaRecUrl = null;
    let _ipaSpeechRec = null;

    function getIpaDoneSet(sym) {
      if (!state.ipaProgress) state.ipaProgress = {};
      if (!Array.isArray(state.ipaProgress[sym])) state.ipaProgress[sym] = [];
      return new Set(state.ipaProgress[sym]);
    }

    function markIpaItemDone(sym, itemKey) {
      if (!state.ipaProgress) state.ipaProgress = {};
      if (!Array.isArray(state.ipaProgress[sym])) state.ipaProgress[sym] = [];
      if (!state.ipaProgress[sym].includes(itemKey)) {
        state.ipaProgress[sym].push(itemKey);
        if (typeof addXp === 'function') addXp(3);
        saveState();
      }
    }

    function buildIpaPracticeItems(cur, g) {
      const items = [];
      (g.phrases || []).forEach((ph, i) => {
        const meta = IPA_PHRASE_VI[ph] || ['', ''];
        items.push({ key: `p_${i}`, type: 'phrase', label: 'Cụm từ', text: ph, vi: meta[0], ipa: meta[1] });
      });
      (g.sentences || []).forEach((s, i) => {
        items.push({ key: `s_${i}`, type: 'sentence', label: 'Câu', text: s, vi: 'Nghe mẫu và bấm ghi âm để luyện nói tự nhiên', ipa: '' });
      });
      (g.words || []).forEach((w, i) => {
        const blocked = ['book','took','accept','except','affect','effect','addition','edition'];
        if (blocked.includes(w.toLowerCase())) return;
        const isVowelLesson = [...AIO_IPA_TABLE.vowelsLong,...AIO_IPA_TABLE.vowelsShort,...AIO_IPA_TABLE.diphthongs].some(item=>item.sym === cur.sym);
        const c = isVowelLesson ? IPA_MINIMAL_CONTRASTS[w.toLowerCase()] : null;
        if (ipaAccent() === 'en-US' && ['ɔː','ɒ'].includes(cur.sym) && ['walk','wok','stalk','stock'].includes(w.toLowerCase())) return;
        const pairFallback = (g.pairs || []).find(pair => pair[0].toLowerCase() === w.toLowerCase() || pair[2].toLowerCase() === w.toLowerCase());
        if (!pairFallback && !c) return;
        const targetIpa = ipaWordIPA(w) || (ipaAccent() === 'en-GB' ? (c ? c[1] : (pairFallback[0] === w ? pairFallback[1] : pairFallback[3])) : '');
        const altWord = pairFallback ? (pairFallback[2] !== w ? pairFallback[2] : pairFallback[0]) : c[0];
        if (!altWord || altWord.toLowerCase() === w.toLowerCase()) return;
        const altIpa = ipaWordIPA(altWord) || (ipaAccent() === 'en-GB' ? (pairFallback ? (pairFallback[2] !== w ? pairFallback[3] : pairFallback[1]) : c[2]) : '');
        if (targetIpa && altIpa && targetIpa === altIpa) return;
        const swap = ((w.charCodeAt(0) + i) % 2) === 1;
        const opts = swap
          ? [{ word: altWord, ipa: altIpa, isTarget: false }, { word: w, ipa: targetIpa, isTarget: true }]
          : [{ word: w, ipa: targetIpa, isTarget: true }, { word: altWord, ipa: altIpa, isTarget: false }];
        items.push({ key: `l_${i}`, type: 'listen', label: 'Thử thách nghe', target: w, opts });
      });
      (g.pairs || []).forEach((pair, i) => {
        const targetWord = [pair[0],pair[2]].find(w=>NTPronunciation.target(cur.sym,w,ipaAccent()));
        if (!targetWord || items.some(it=>it.type==='listen' && it.target===targetWord)) return;
        const alternate = targetWord===pair[0]?pair[2]:pair[0];
        const targetIpa = ipaWordIPA(targetWord) || (ipaAccent()==='en-GB'?(targetWord===pair[0]?pair[1]:pair[3]):'');
        const alternateIpa = ipaWordIPA(alternate) || (ipaAccent()==='en-GB'?(targetWord===pair[0]?pair[3]:pair[1]):'');
        if (!targetIpa || !alternateIpa || targetIpa===alternateIpa || targetWord===alternate) return;
        const opts=[{word:targetWord,ipa:targetIpa,isTarget:true},{word:alternate,ipa:alternateIpa,isTarget:false}];
        if(i%2===0) opts.reverse();
        items.push({key:`contrast_${targetWord}_${alternate}`,type:'listen',label:'Thử thách nghe',target:targetWord,opts});
      });
      return items;
    }

    function startIpaPractice(sym, startType) {
      stopIpaAudio(); stopIpaPracticeRecording();
      const allEnIpaList = [
        ...AIO_IPA_TABLE.vowelsLong, ...AIO_IPA_TABLE.vowelsShort, ...AIO_IPA_TABLE.diphthongs,
        ...AIO_IPA_TABLE.consonantsVoiceless, ...AIO_IPA_TABLE.consonantsVoiced, ...AIO_IPA_TABLE.consonantsOther, ...AIO_IPA_TABLE.endings
      ];
      const cur = allEnIpaList.find(x => x.sym === sym) || allEnIpaList[0];
      const g = getIpaGuide(cur);
      const items = buildIpaPracticeItems(cur, g);
      let idx = 0;
      if (startType) {
        const found = items.findIndex(it => it.type === startType);
        if (found !== -1) idx = found;
      }
      if (_ipaRecUrl) { try { URL.revokeObjectURL(_ipaRecUrl); } catch {} _ipaRecUrl = null; }
      ui.ipaDetailSym = cur.sym;
      ui.ipaPractice = {
        sym: cur.sym,
        idx,
        items,
        accent: ui.ipaAccent || 'en-GB',
        speed: 1.0,
        showGuide: false,
        answeredIdx: null,
        heardKey: null,
        recording: false,
        transcript: '',
        score: null,
        hasRecording: false
      };
      renderAioPronunciationPage();
      // Listening starts with an explicit tap on the speaker.
    }

    function speakIpaPracticeText(text, customRate) {
      if (!text) return;
      stopIpaPracticeRecording();
      const rate = customRate || (ui.ipaPractice && ui.ipaPractice.speed) || 1;
      const practice=ui.ipaPractice;
      const item=practice?.items[practice.idx];
      finishIpaPlayback(getIpaController().playWord(text, {accent:ipaAccent(),rate}).then(result=>{
        if(practice && ui.ipaPractice===practice && practice.items[practice.idx]===item && item?.type==='listen' && item.target===text && practice.answeredIdx===null && state.mainNav==='pronunciation') {
          practice.heardKey=item.key;renderAioPronunciationPage();
        }
        return result;
      }));
    }

    function refreshIpaPracticeAccent() {
      const p = ui.ipaPractice;
      if (!p) return;
      const previousKey = p.items[p.idx]?.key;
      p.accent = ui.ipaAccent || 'en-GB';
      const cur = Object.values(AIO_IPA_TABLE).flat().find(item=>item.sym === p.sym);
      if (!cur) return;
      p.items = buildIpaPracticeItems(cur,getIpaGuide(cur));
      p.idx = Math.max(0,p.items.findIndex(item=>item.key === previousKey));
      p.answeredIdx = null; p.heardKey = null; p.transcript = ''; p.score = null; p.hasRecording = false;
      if (_ipaRecUrl) { URL.revokeObjectURL(_ipaRecUrl); _ipaRecUrl = null; }
    }

    let _ipaRecordingSession = null;
    let _ipaRecordingGeneration = 0;

    function stopIpaPracticeRecording(keep = false) {
      const session = _ipaRecordingSession;
      if (!session) return;
      clearTimeout(session.timer);
      session.keep = keep && Boolean(session.media);
      if (!session.keep) {
        _ipaRecordingGeneration += 1;
        _ipaRecordingSession = null;
      }
      if (session.owner) session.owner.recording = false;
      if (session.media && session.media.state !== 'inactive') {
        try { session.media.stop(); } catch (_) { session.stream?.getTracks().forEach(track=>track.stop()); }
      }
      if (!session.keep) session.stream?.getTracks().forEach(track=>track.stop());
    }

    async function toggleIpaPracticeRecording() {
      const p = ui.ipaPractice;
      if (!p) return;
      const item = p.items[p.idx];
      if (!item || item.type === 'listen') return;
      if (p.recording) { stopIpaPracticeRecording(true); renderAioPronunciationPage(); return; }
      stopIpaAudio();
      stopIpaPracticeRecording();
      if (_ipaRecUrl) { URL.revokeObjectURL(_ipaRecUrl); _ipaRecUrl = null; }
      p.hasRecording = false;
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        showToast('Thiết bị chưa hỗ trợ ghi âm ở trang này. Hãy mở bằng HTTPS và dùng trình duyệt có hỗ trợ micro.');
        return;
      }
      const session = {generation:++_ipaRecordingGeneration,owner:p,itemKey:item.key,media:null,stream:null,timer:null,keep:false};
      _ipaRecordingSession = session;
      const current = () => _ipaRecordingSession === session && session.generation === _ipaRecordingGeneration && ui.ipaPractice === p && p.items[p.idx]?.key === item.key;
      p.recording = true; p.transcript = ''; p.score = null;
      renderAioPronunciationPage();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        if (!current()) { stream.getTracks().forEach(track=>track.stop()); return; }
        session.stream = stream;
        const choices = ['audio/webm;codecs=opus','audio/mp4','audio/webm'];
        const mimeType = choices.find(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type));
        const media = mimeType ? new MediaRecorder(stream,{mimeType}) : new MediaRecorder(stream);
        session.media = media;
        const chunks = [];
        media.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
        media.onstop = () => {
          stream.getTracks().forEach(track=>track.stop());
          clearTimeout(session.timer);
          if (!current()) return;
          _ipaRecordingSession = null;
          p.recording = false;
          if (session.keep && chunks.length) {
            if (_ipaRecUrl) URL.revokeObjectURL(_ipaRecUrl);
            const blob = new Blob(chunks,{type:media.mimeType || chunks[0].type || 'audio/webm'});
            _ipaRecUrl = URL.createObjectURL(blob);
            p.hasRecording = true;
            markIpaItemDone(p.sym,item.key);
          }
          renderAioPronunciationPage();
        };
        media.onerror = () => {
          if (current()) { stopIpaPracticeRecording(); showToast('Ghi âm bị gián đoạn. Bạn có thể thử lại.'); renderAioPronunciationPage(); }
          stream.getTracks().forEach(track=>track.stop());
        };
        media.start();
        session.timer = setTimeout(()=>{ if (current()) stopIpaPracticeRecording(true); },30000);
      } catch (_) {
        session.stream?.getTracks().forEach(track=>track.stop());
        if (current()) { stopIpaPracticeRecording(); showToast('Chưa ghi âm được. Hãy kiểm tra quyền micro của trang.'); renderAioPronunciationPage(); }
      }
    }

    window.addEventListener('pagehide', () => { stopIpaAudio(); stopIpaPracticeRecording(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopIpaAudio(); stopIpaPracticeRecording();
        if (ui.ipaPractice && state.mainNav === 'pronunciation') renderAioPronunciationPage();
      }
    });

    function answerIpaListenOption(optIdx) {
      const p = ui.ipaPractice;
      if (!p) return;
      const item = p.items[p.idx];
      if (!item || item.type !== 'listen' || p.answeredIdx !== null || !item.opts[optIdx]) return;
      if(p.heardKey!==item.key){showToast('Hãy nghe hết mẫu trước khi chọn đáp án.');return;}
      p.answeredIdx = optIdx;
      const chosen = item.opts[optIdx];
      if (chosen && chosen.isTarget) {
        markIpaItemDone(p.sym, item.key);
        showToast('Chính xác! +3 XP');
      } else {
        showToast(`Đáp án đúng là "${item.target}" — bấm loa để nghe lại nhé!`);
      }
      renderAioPronunciationPage();
    }

    function goIpaPracticeItem(nextIdx) {
      stopIpaAudio();
      const p = ui.ipaPractice;
      if (!p) return;
      stopIpaPracticeRecording();
      if (_ipaRecUrl) { try { URL.revokeObjectURL(_ipaRecUrl); } catch {} _ipaRecUrl = null; }
      if (nextIdx >= p.items.length) {
        showToast(`Chúc mừng! Bạn đã đi hết bài luyện âm /${p.sym}/!`);
        ui.ipaPractice = null;
        renderAioPronunciationPage();
        return;
      }
      p.idx = Math.max(0, nextIdx);
      p.answeredIdx = null;
      p.heardKey = null;
      p.transcript = '';
      p.score = null;
      p.hasRecording = false;
      renderAioPronunciationPage();
      // Listening starts with an explicit tap on the speaker.
    }

    document.addEventListener('keydown', (e) => {
      const p = ui.ipaPractice;
      if (!p || state.mainNav !== 'pronunciation') return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName)) return;
      const item = p.items[p.idx];
      if (!item) return;
      if (item.type === 'listen') {
        if (e.key === '1') { e.preventDefault(); answerIpaListenOption(0); }
        else if (e.key === '2') { e.preventDefault(); answerIpaListenOption(1); }
        else if (e.key === 'Enter' && p.answeredIdx !== null) { e.preventDefault(); goIpaPracticeItem(p.idx + 1); }
      }
    });


    const AIO_ZH_PINYIN_INITIALS = [
      { sym: 'b', ex: '爸爸 (bàba)', tip: 'Giống p nhẹ không bật hơi' },
      { sym: 'p', ex: '朋友 (péngyou)', tip: 'Bật hơi mạnh từ môi' },
      { sym: 'm', ex: '妈妈 (māma)', tip: 'Giống m tiếng Việt' },
      { sym: 'f', ex: '饭 (fàn)', tip: 'Giống ph tiếng Việt' },
      { sym: 'zh', ex: '中国 (Zhōngguó)', tip: 'Uốn lưỡi lên vòm miệng' },
      { sym: 'ch', ex: '吃饭 (chīfàn)', tip: 'Uốn lưỡi + bật hơi mạnh' },
      { sym: 'sh', ex: '老师 (lǎoshī)', tip: 'Uốn lưỡi giống s nặng' },
      { sym: 'r', ex: '热 (rè)', tip: 'Uốn lưỡi nhẹ, không rung' },
      { sym: 'j', ex: '家 (jiā)', tip: 'Đầu lưỡi chạm răng dưới, nhẹ' },
      { sym: 'q', ex: '请 (qǐng)', tip: 'Như ch nhẹ nhưng bật hơi mạnh' },
      { sym: 'x', ex: '谢谢 (xièxie)', tip: 'Miệng cười nhẹ, xì hơi mềm' },
      { sym: 'z', ex: '再见 (zàijiàn)', tip: 'Đầu lưỡi chạm răng trên, không bật hơi' },
      { sym: 'c', ex: '菜 (cài)', tip: 'Như z nhưng bật hơi mạnh ra ngoài' },
      { sym: 's', ex: '三 (sān)', tip: 'Đầu lưỡi phẳng gần răng, xì nhẹ' }
    ];

    const ZH_FOUR_TONE_MATRIX = [
      {
        vowel: 'a', label: 'Vận mẫu a (m-)',
        tones: [
          { py: 'mā', mark: 'ā', hanzi: '妈', vi: 'mẹ' },
          { py: 'má', mark: 'á', hanzi: '麻', vi: 'cây gai / tê' },
          { py: 'mǎ', mark: 'ǎ', hanzi: '马', vi: 'con ngựa' },
          { py: 'mà', mark: 'à', hanzi: '骂', vi: 'mắng' }
        ]
      },
      {
        vowel: 'o', label: 'Vận mẫu o (m-)',
        tones: [
          { py: 'mō', mark: 'ō', hanzi: '摸', vi: 'sờ, chạm' },
          { py: 'mó', mark: 'ó', hanzi: '磨', vi: 'mài' },
          { py: 'mǒ', mark: 'ǒ', hanzi: '抹', vi: 'bôi, quẹt' },
          { py: 'mò', mark: 'ò', hanzi: '墨', vi: 'mực' }
        ]
      },
      {
        vowel: 'e', label: 'Vận mẫu e',
        tones: [
          { py: 'ē', mark: 'ē', hanzi: '婀', vi: 'thướt tha' },
          { py: 'é', mark: 'é', hanzi: '鹅', vi: 'con ngỗng' },
          { py: 'ě', mark: 'ě', hanzi: '噁', vi: 'buồn nôn' },
          { py: 'è', mark: 'è', hanzi: '饿', vi: 'đói bụng' }
        ]
      },
      {
        vowel: 'i', label: 'Vận mẫu i (y-)',
        tones: [
          { py: 'yī', mark: 'ī', hanzi: '衣', vi: 'quần áo' },
          { py: 'yí', mark: 'í', hanzi: '移', vi: 'di chuyển' },
          { py: 'yǐ', mark: 'ǐ', hanzi: '椅', vi: 'cái ghế' },
          { py: 'yì', mark: 'ì', hanzi: '意', vi: 'ý nghĩa' }
        ]
      },
      {
        vowel: 'u', label: 'Vận mẫu u (w-)',
        tones: [
          { py: 'wū', mark: 'ū', hanzi: '屋', vi: 'ngôi nhà' },
          { py: 'wú', mark: 'ú', hanzi: '无', vi: 'không có' },
          { py: 'wǔ', mark: 'ǔ', hanzi: '五', vi: 'số 5' },
          { py: 'wù', mark: 'ù', hanzi: '物', vi: 'đồ vật' }
        ]
      },
      {
        vowel: 'ü', label: 'Vận mẫu ü (y-)',
        tones: [
          { py: 'yū', mark: 'ǖ', hanzi: '淤', vi: 'bùn phù sa' },
          { py: 'yú', mark: 'ǘ', hanzi: '鱼', vi: 'con cá' },
          { py: 'yǔ', mark: 'ǚ', hanzi: '雨', vi: 'mưa' },
          { py: 'yù', mark: 'ǜ', hanzi: '玉', vi: 'ngọc' }
        ]
      }
    ];

    let _zhRowTimer = null;
    function playChineseToneRow(vowel) {
      if (_zhRowTimer) { clearTimeout(_zhRowTimer); _zhRowTimer = null; }
      const row = ZH_FOUR_TONE_MATRIX.find(r => r.vowel === vowel);
      if (!row) return;
      let i = 0;
      const step = () => {
        if (i >= row.tones.length) return;
        speakChinese(row.tones[i].hanzi, 0.88);
        i++;
        if (i < row.tones.length) _zhRowTimer = setTimeout(step, 950);
      };
      step();
    }

    function renderHomePage() {
      const el = document.getElementById('page-home');
      if (!el) return;
      const { due } = getSrsBuckets();
      const customName = (state.profile && state.profile.name && state.profile.name.trim()) || '';
      const meta = (currentAuthUser && currentAuthUser.user_metadata) || {};
      const displayName = customName || meta.full_name || meta.name || 'Nguyễn Thành';
      const userAvatar = (state.profile && state.profile.customAvatar) || meta.avatar_url || '';
      const levelNum = Math.floor((state.xp || 0) / 100) + 1;
      const nextLvPct = Math.min(100, (state.xp || 0) % 100);
      const goalPct = Math.min(100, Math.round(((state.todayXp || 0) / (state.dailyGoalXp || 50)) * 100));

      el.innerHTML = `
        <!-- Coral Hero Banner (AIO Tiến độ & Kế hoạch) -->
        <div class="aio-coral-banner rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Trang chủ &amp; Tiến độ.</h1>
            <p class="text-xs sm:text-sm font-medium text-slate-700 mt-1">Kế hoạch học song ngữ <strong>Tiếng Anh &amp; Tiếng Trung</strong> mỗi ngày dành riêng cho ${displayName}.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" data-main-nav="typing" class="px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-900 text-xs sm:text-sm font-extrabold shadow-xs">Gõ câu ngay →</button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left: Kế hoạch hôm nay (Honey Panel) -->
          <div class="lg:col-span-7 aio-honey-panel rounded-3xl p-5 space-y-3 shadow-2xs">
            <div class="flex items-center justify-between">
              <div class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <i data-lucide="calendar-check-2" class="w-4 h-4 text-amber-800"></i> Kế hoạch hôm nay.
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-white text-xs font-extrabold text-amber-900 border border-amber-200">${state.todayXp || 0}/${state.dailyGoalXp || 50} XP</span>
            </div>

            <div class="space-y-2">
              <button type="button" data-main-nav="typing" class="w-full p-3.5 rounded-2xl bg-white hover:bg-sky-50/40 border border-[#E5D6B5] flex items-center justify-between gap-3 text-left transition-all">
                <div>
                  <div class="text-[11px] font-bold text-sky-600">Học qua gõ câu · Anh &amp; Trung</div>
                  <div class="font-extrabold text-sm text-slate-900">Gõ 5 câu giao tiếp đời sống (chấm từng từ)</div>
                </div>
                <span class="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">Tiếp theo</span>
              </button>

              <button type="button" data-main-nav="grammar" class="w-full p-3.5 rounded-2xl bg-white hover:bg-orange-50/40 border border-[#E5D6B5] flex items-center justify-between gap-3 text-left transition-all">
                <div>
                  <div class="text-[11px] font-bold text-orange-600">Luyện ngữ pháp</div>
                  <div class="font-extrabold text-sm text-slate-900">Ôn 1 điểm ngữ pháp cốt lõi (A1–A2 / HSK 1)</div>
                </div>
                <span class="text-xs font-bold text-slate-400 shrink-0">~5 phút</span>
              </button>

              <button type="button" data-main-nav="pronunciation" class="w-full p-3.5 rounded-2xl bg-white hover:bg-cyan-50/40 border border-[#E5D6B5] flex items-center justify-between gap-3 text-left transition-all">
                <div>
                  <div class="text-[11px] font-bold text-cyan-700">Luyện phát âm</div>
                  <div class="font-extrabold text-sm text-slate-900">Luyện bảng IPA Tiếng Anh &amp; 4 Thanh điệu Tiếng Trung</div>
                </div>
                <span class="text-xs font-bold text-slate-400 shrink-0">~5 phút</span>
              </button>

              <button type="button" data-main-nav="videos" class="w-full p-3.5 rounded-2xl bg-white hover:bg-pink-50/40 border border-[#E5D6B5] flex items-center justify-between gap-3 text-left transition-all">
                <div>
                  <div class="text-[11px] font-bold text-pink-600">Học qua video</div>
                  <div class="font-extrabold text-sm text-slate-900">Xem 1 video song ngữ &amp; tập nói đuổi theo mic</div>
                </div>
                <span class="text-xs font-bold text-slate-400 shrink-0">~6 phút</span>
              </button>

              <button type="button" data-main-nav="review" class="w-full p-3.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-[#E5D6B5] flex items-center justify-between gap-3 text-left transition-all">
                <div>
                  <div class="text-[11px] font-bold text-emerald-700">Ôn SRS &amp; Game 60s</div>
                  <div class="font-extrabold text-sm text-slate-900">${due.length > 0 ? `Ôn ngay ${due.length} từ đến hạn SRS` : 'Chơi 1 ván Game Đua tốc độ 60 giây'}</div>
                </div>
                <span class="text-xs font-bold text-slate-400 shrink-0">~3 phút</span>
              </button>
            </div>

            <div class="pt-1">
              <div class="flex justify-between text-[11px] font-bold text-amber-900/80 mb-1">
                <span>Tiến độ mục tiêu hôm nay</span><span>${goalPct}%</span>
              </div>
              <div class="h-2 rounded-full bg-white/80 overflow-hidden">
                <div class="h-full bg-amber-600 rounded-full transition-all" style="width:${goalPct}%"></div>
              </div>
            </div>
          </div>

          <!-- Right: Profile Level + Quick Shortcuts -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-white rounded-3xl border border-[#E6DEC9] p-5 space-y-4 shadow-2xs">
              <div class="flex items-center gap-3.5">
                ${userAvatar
                  ? `<img src="${userAvatar}" alt="${displayName}" class="w-14 h-14 rounded-2xl object-cover border-2 border-amber-200" />`
                  : `<div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-xl flex items-center justify-center">${displayName.charAt(0).toUpperCase()}</div>`
                }
                <div class="min-w-0 flex-1">
                  <div class="font-extrabold text-base text-slate-900 truncate">${displayName}</div>
                  <div class="text-xs font-semibold text-slate-500">Cấp ${levelNum} · Còn ${100 - nextLvPct} XP lên Cấp ${levelNum + 1}</div>
                  <div class="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                    <div class="h-full bg-indigo-600 rounded-full" style="width:${nextLvPct}%"></div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-3 rounded-2xl bg-[#FAF6EE] border border-[#EAE2D3]">
                  <div class="text-lg font-extrabold text-orange-600">${state.streak || 0}</div>
                  <div class="text-[11px] font-semibold text-slate-500">Chuỗi ngày</div>
                </div>
                <div class="p-3 rounded-2xl bg-[#FAF6EE] border border-[#EAE2D3]">
                  <div class="text-lg font-extrabold text-indigo-600">${state.xp || 0}</div>
                  <div class="text-[11px] font-semibold text-slate-500">Tổng XP</div>
                </div>
                <div class="p-3 rounded-2xl bg-[#FAF6EE] border border-[#EAE2D3]">
                  <div class="text-lg font-extrabold text-amber-600">${getTotalStars()}</div>
                  <div class="text-[11px] font-semibold text-slate-500">Số sao</div>
                </div>
              </div>

              <button type="button" data-open-account="1" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">
                Đổi ảnh cá nhân &amp; Đồng bộ Gmail
              </button>
            </div>

            <div class="bg-white rounded-3xl border border-[#E6DEC9] p-5 space-y-3 shadow-2xs">
              <div class="font-extrabold text-sm text-slate-900">Truy cập nhanh 2 lộ trình</div>
              <div class="grid grid-cols-2 gap-2.5">
                <button type="button" data-main-nav="roadmap" class="p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/70 border border-sky-200 text-left">
                  <div class="text-xs font-extrabold text-sky-900">🇬🇧 Tiếng Anh</div>
                  <div class="text-[11px] text-sky-700 mt-0.5">24 chủ đề · 240 từ</div>
                </button>
                <button type="button" data-main-nav="chinese" class="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-left">
                  <div class="text-xs font-extrabold text-rose-900">🇨🇳 Tiếng Trung</div>
                  <div class="text-[11px] text-rose-700 mt-0.5">12 chủ đề · HSK 1–2</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      refreshIcons();
    }


    function buildGrammarFormulaLegend(formula, isZh) {
      if (!formula) return '';
      const f = String(formula);
      const items = [];
      const add = (sym, desc) => {
        if (!items.some(x => x.sym === sym)) items.push({ sym, desc });
      };

      if (/\(\+\)/.test(f) && /\(-\)/.test(f)) {
        add('(+) / (-) / (?)', '<b>(+)</b> Câu khẳng định · <b>(-)</b> Câu phủ định (không) · <b>(?)</b> Câu hỏi');
      } else if (/\(\+\)/.test(f)) {
        add('(+) / (-)', '<b>(+)</b> Câu khẳng định · <b>(-)</b> Câu phủ định / cấm đoán');
      }

      if (/\bS\b/.test(f)) {
        add('S', isZh
          ? 'Chủ ngữ (người/vật thực hiện hành động, VD: <i>我 tôi, 你 bạn, 他 anh ấy</i>)'
          : 'Chủ ngữ — người/vật làm hành động (VD: <i>I, You, He, She, It, We, They</i>)');
      }
      if (isZh && /\bA\b/.test(f) && /\bB\b/.test(f)) {
        add('A, B', 'Hai đối tượng (người hoặc vật) được nêu hoặc so sánh trong câu');
      }
      if (!isZh) {
        if (/am\s*\/\s*is\s*\/\s*are/i.test(f)) {
          add('am / is / are', 'Động từ <i>to be</i> (thì, là, ở): <b>I</b> → am · <b>He/She/It</b> → is · <b>You/We/They</b> → are');
        }
        if (/was\s*\/\s*were/i.test(f)) {
          add('was / were', 'Động từ <i>to be</i> ở quá khứ: <b>I/He/She/It</b> → was · <b>You/We/They</b> → were');
        }
        if (/have\s*\/\s*has/i.test(f)) {
          add('have / has', 'Trợ động từ hoàn thành: <b>have</b> đi với <i>I, You, We, They</i> · <b>has</b> đi với <i>He, She, It</i> (phủ định: <i>haven’t / hasn’t</i>)');
        }
        if (/do\s*\/\s*does|don’t\s*\/\s*doesn’t|don't\s*\/\s*doesn't/i.test(f) || (/\bDo\b/.test(f) && /\bDoes\b/.test(f))) {
          add('do / does', 'Trợ động từ hiện tại: <b>do / don’t</b> đi với <i>I, You, We, They</i> · <b>does / doesn’t</b> đi với <i>He, She, It</i>');
        }
        if (/\bDid\b|didn’t|didn't/i.test(f)) {
          add('did / didn’t', 'Trợ động từ quá khứ (dùng chung cho mọi chủ ngữ; động từ theo sau giữ nguyên mẫu)');
        }
        if (/\bwill\b/i.test(f)) {
          add('will / won’t', '“Sẽ / sẽ không” (dùng chung cho mọi chủ ngữ, theo sau là động từ nguyên mẫu)');
        }
        if (/going to/i.test(f)) {
          add('going to', '“Dự định sẽ...” — dùng cho kế hoạch đã lên trước');
        }
        if (/\bwould\b/i.test(f)) {
          add('would', '“Sẽ...” — dùng trong tình huống giả định (không có thật ở hiện tại)');
        }
        if (/can\s*\/\s*could\s*\/\s*should\s*\/\s*must/i.test(f)) {
          add('can / could / should / must', 'Động từ khuyết thiếu: <b>can</b> (có thể) · <b>could</b> (có thể, lịch sự) · <b>should</b> (nên) · <b>must</b> (phải)');
        }
        if (/Wh-/i.test(f)) {
          add('Wh-', 'Từ để hỏi: <i>What (gì), Where (ở đâu), When (khi nào), Why (tại sao), Who (ai), How (thế nào)</i>');
        }
        if (/HTĐ/.test(f)) {
          add('HTĐ', 'Thì Hiện tại đơn (<i>S + V / V-s,es</i>)');
        }
        if (/V3/.test(f)) {
          add('V3 / V-ed', 'Động từ cột 3 (quá khứ phân từ): thêm <b>-ed</b> (<i>worked</i>) hoặc bất quy tắc (<i>gone, eaten, seen</i>)');
        }
        if (/V2/.test(f)) {
          add('V2 / V-ed', 'Động từ quá khứ cột 2: thêm <b>-ed</b> (<i>played, visited</i>) hoặc bất quy tắc (<i>went, ate, saw</i>)');
        }
        if (/V-ing/.test(f)) {
          add('V-ing', 'Động từ thêm đuôi <b>-ing</b> (VD: <i>eating, studying, playing</i>)');
        }
        if (/V-s\/es|V-s\b/.test(f)) {
          add('V-s/es', 'Động từ thêm <b>-s</b> hoặc <b>-es</b> khi chủ ngữ là số ít (<i>He / She / It</i>)');
        }
        if (/to V\b/.test(f)) {
          add('to V', '<b>to</b> + động từ nguyên mẫu (VD: <i>to learn, to go</i>)');
        }
        if (/V nguyên mẫu|\+\s*V\b|\bV\s*\/|\bV\?|\bV!|\bV\.\.\./.test(f)) {
          add('V', 'Động từ nguyên mẫu — dạng gốc không chia (VD: <i>go, eat, play</i>)');
        }
        if (/N\/Adj/.test(f)) {
          add('N / Adj', '<b>N</b> = Danh từ (<i>teacher, cat</i>) · <b>Adj</b> = Tính từ (<i>happy, tall</i>)');
        }
        if (/by tác nhân/.test(f)) {
          add('by + tác nhân', '“Bởi ai đó” (có thể bỏ qua nếu không cần nhấn mạnh người làm)');
        }
      } else {
        if (/V1/.test(f) && /V2/.test(f)) {
          add('V1, V2', '<b>V1</b> = Hành động làm trước · <b>V2</b> = Hành động làm tiếp theo trong cùng câu');
        } else if (/\bV\b/.test(f)) {
          add('V', 'Động từ chỉ hành động (VD: <i>吃 ăn, 去 đi, 看 xem</i>)');
        }
        if (/\bO\b/.test(f)) {
          add('O', 'Tân ngữ — người/vật chịu tác động của hành động (VD: <i>饭 cơm, 书 sách</i>)');
        }
        if (/是/.test(f)) add('是 / 不是', '<b>是 (shì)</b> = là · <b>不是 (bú shì)</b> = không phải là');
        if (/吗/.test(f)) add('吗 (ma)', 'Đặt cuối câu để biến câu kể thành câu hỏi “...phải không / ...không?”');
        if (/的/.test(f)) add('的 (de)', 'Từ nối sở hữu (“của”) hoặc nối phần mô tả với danh từ phía sau');
        if (/有\s*\/\s*没有/.test(f)) add('有 / 没有', '<b>有 (yǒu)</b> = có · <b>没有 (méiyǒu)</b> = không có');
        if (/了/.test(f)) add('了 (le)', 'Đánh dấu hành động <b>đã xảy ra / đã hoàn thành</b>');
        if (/没/.test(f) && !/没有/.test(f)) add('没 (méi)', '“Chưa / đã không...” (khi dùng <b>没</b> thì bỏ <b>了</b>)');
        if (/过/.test(f)) add('过 (guo)', '“Đã từng...” (nói về trải nghiệm trong quá khứ)');
        if (/正在/.test(f)) add('正在 / 在... 呢', '“Đang...” — nhấn mạnh hành động đang diễn ra ngay lúc nói');
        if (/比/.test(f)) add('比 (bǐ)', '“Hơn” — dùng để so sánh A hơn B');
        if (/被/.test(f)) add('被 (bèi)', '“Bị / được” — dùng trong câu bị động');
        if (/把/.test(f)) add('把 (bǎ)', 'Đưa đồ vật lên trước động từ để nhấn mạnh cách tác động lên đồ vật đó');
        if (/想\s*\/\s*要/.test(f)) add('想 / 要 / 会 / 可以', '<b>想</b> (muốn) · <b>要</b> (cần/sẽ) · <b>会</b> (biết làm) · <b>可以</b> (có thể/được phép)');
      }

      if (!items.length) return '';
      return `
        <div class="pt-2.5 mt-2 border-t border-indigo-200/70 space-y-1.5">
          <div class="text-[11px] font-extrabold text-indigo-700">💡 Giải thích ký hiệu cho dễ hiểu:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            ${items.map(it => `
              <div class="flex items-start gap-2 text-xs text-slate-700 leading-snug bg-white/80 rounded-xl px-2.5 py-1.5 border border-indigo-100">
                <span class="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-extrabold text-[11px] shrink-0">${it.sym}</span>
                <span>${it.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function renderAioGrammarPage() {
      const el = document.getElementById('page-grammar');
      if (!el) return;
      const lang = ui.aioGrammarLang || 'en';
      const isZh = lang === 'zh';
      const sourceMap = (typeof window !== 'undefined' && window.AIO_GRAMMAR_UNITS_FULL) ? window.AIO_GRAMMAR_UNITS_FULL : AIO_GRAMMAR_UNITS;
      const allUnits = sourceMap[lang] || sourceMap.en;
      const activeGroup = ui.aioGrammarGroup || 'all';
      const units = activeGroup === 'all' ? allUnits : allUnits.filter(u => u.group === activeGroup);
      const activeKey = ui.aioGrammarSelected || `${lang}-1-0`;

      let selectedPoint = null;
      units.forEach(u => u.points.forEach((pt, idx) => {
        if (`${lang}-${u.num}-${idx}` === activeKey) selectedPoint = { ...pt, unitTitle: u.title, level: u.level, unitNum: u.num, key: activeKey };
      }));
      if (!selectedPoint) {
        const u0 = units[0];
        selectedPoint = { ...u0.points[0], unitTitle: u0.title, level: u0.level, unitNum: u0.num, key: `${lang}-${u0.num}-0` };
      }

      const examples = Array.isArray(selectedPoint.examples) && selectedPoint.examples.length
        ? selectedPoint.examples
        : [{ text: selectedPoint.ex || '', vi: '', note: '' }];
      const firstSpeakText = (examples[0].text || '').split('(')[0].trim();
      const quizPicked = ui.aioGramQuizPicked && ui.aioGramQuizPicked[selectedPoint.key];
      const chk = selectedPoint.check;

      el.innerHTML = `
        <div class="aio-orange-banner rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Luyện ngữ pháp.</h1>
              <div class="bg-white/85 p-0.5 rounded-xl inline-flex text-xs font-bold border border-orange-200">
                <button type="button" data-aio-gram-lang="en" class="px-3 py-1 rounded-lg ${!isZh ? 'bg-orange-600 text-white' : 'text-slate-600'}">🇬🇧 Tiếng Anh (${(sourceMap.en || []).length} chuyên đề)</button>
                <button type="button" data-aio-gram-lang="zh" class="px-3 py-1 rounded-lg ${isZh ? 'bg-rose-600 text-white' : 'text-slate-600'}">🇨🇳 Tiếng Trung (${(sourceMap.zh || []).length} chuyên đề)</button>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-700">Đầy đủ công thức, giải thích dễ hiểu bằng tiếng Việt, 3 ví dụ có phát âm bản xứ, lỗi hay mắc và bài tập áp dụng ngay.</p>
          </div>
          <button type="button" ${isZh ? `data-speak-zh="${firstSpeakText.replace(/"/g, '&quot;')}"` : `data-speak="${firstSpeakText.replace(/"/g, '&quot;')}"`} class="px-4 py-2.5 rounded-2xl bg-white hover:bg-orange-50 border border-orange-200 text-slate-900 text-xs font-extrabold shadow-xs shrink-0 flex items-center gap-1.5">
            <i data-lucide="volume-2" class="w-4 h-4 text-orange-600"></i> Nghe ví dụ chính
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-[#E6DEC9] p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-extrabold">Bài ${selectedPoint.unitNum} · ${selectedPoint.level} · ${selectedPoint.unitTitle}</span>
          </div>

          <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">${selectedPoint.title}</h2>

          ${selectedPoint.formula ? `
            <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
              <div class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">📐 Công thức ghi nhớ</div>
              <div class="text-xs sm:text-sm font-mono font-bold text-slate-900 leading-relaxed">${selectedPoint.formula}</div>
              ${buildGrammarFormulaLegend(selectedPoint.formula, isZh)}
            </div>
          ` : ''}

          <div class="text-sm text-slate-800 leading-relaxed bg-[#FAF6EE] p-4 rounded-2xl border border-[#EAE2D3]">
            <strong class="text-orange-800">📖 Giải thích tiếng Việt:</strong> ${selectedPoint.rule}
          </div>

          <div class="space-y-2">
            <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">💬 Ví dụ cụ thể &amp; Phân tích (bấm loa để nghe)</div>
            <div class="space-y-2">
              ${examples.map((ex, ei) => {
                const spk = (ex.text || '').split('(')[0].trim().replace(/"/g, '&quot;');
                return `
                  <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 transition-colors flex items-start justify-between gap-3">
                    <div class="space-y-1 min-w-0">
                      <div class="text-sm sm:text-base font-extrabold text-slate-900">${ei + 1}. ${ex.text}</div>
                      ${ex.pinyin ? `<div class="text-xs font-mono text-rose-600">${ex.pinyin}</div>` : ''}
                      ${ex.vi ? `<div class="text-xs sm:text-sm font-semibold text-emerald-700">→ ${ex.vi}</div>` : ''}
                      ${ex.note ? `<div class="text-xs text-slate-500">💡 <em>${ex.note}</em></div>` : ''}
                    </div>
                    <button type="button" ${isZh ? `data-speak-zh="${spk}"` : `data-speak="${spk}"`} class="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 shrink-0" title="Nghe phát âm">
                      <i data-lucide="volume-2" class="w-4 h-4"></i>
                    </button>
                  </div>`;
              }).join('')}
            </div>
          </div>

          ${selectedPoint.mistake ? `
            <div class="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
              <strong>⚠️ Lỗi người Việt hay mắc:</strong> ${selectedPoint.mistake}
            </div>
          ` : ''}

          ${chk ? `
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div class="text-xs font-extrabold uppercase tracking-wider text-violet-700">📝 Kiểm tra nhanh (áp dụng ngay)</div>
              <div class="text-sm font-bold text-slate-900">${chk.q}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${chk.opts.map((opt, oi) => {
                  const picked = quizPicked !== undefined;
                  let cls = 'bg-white hover:bg-violet-50 border-slate-200 text-slate-800';
                  if (picked) {
                    if (oi === chk.ans) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-300';
                    else if (oi === quizPicked) cls = 'bg-rose-50 border-rose-400 text-rose-900';
                    else cls = 'bg-white/70 border-slate-200 text-slate-400';
                  }
                  return `<button type="button" data-aio-gram-quiz="${oi}" data-aio-gram-key="${selectedPoint.key}" class="px-3.5 py-2.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all ${cls}">${String.fromCharCode(65 + oi)}. ${opt}</button>`;
                }).join('')}
              </div>
              ${quizPicked !== undefined ? `
                <div class="p-3 rounded-xl text-xs font-semibold ${quizPicked === chk.ans ? 'bg-emerald-100/80 text-emerald-900' : 'bg-rose-100/80 text-rose-900'}">
                  ${quizPicked === chk.ans ? '✅ Chính xác! (+5 XP) — ' : '❌ Chưa đúng rồi — '}${chk.explain}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- 3 Category Filter Pills -->
        <div class="flex flex-wrap items-center gap-2">
          ${[
            { id: 'all', label: `Tất cả (${allUnits.length} bài)` },
            { id: 'tenses', label: isZh ? '1. Năng nguyện & Trợ từ' : '1. Các thì & Trợ động từ' },
            { id: 'parts', label: isZh ? '2. Sở hữu, Lượng từ & 的/地/得' : '2. Từ loại (Danh/Đại/Tính/Trạng)' },
            { id: 'structures', label: isZh ? '3. Cấu trúc câu (被, 把, Liên từ)' : '3. Cấu trúc câu (Mệnh lệnh, If, Bị động, Từ nối)' }
          ].map(g => `
            <button type="button" data-aio-gram-group="${g.id}" class="px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all ${
              activeGroup === g.id ? 'bg-slate-900 text-white border-transparent shadow-2xs' : 'bg-white hover:bg-orange-50 text-slate-700 border-[#E6DEC9]'
            }">${g.label}</button>
          `).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${units.map(u => `
            <div class="bg-white rounded-3xl border border-[#E6DEC9] p-4 sm:p-5 space-y-2.5 shadow-2xs">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-extrabold text-sm flex items-center justify-center shrink-0">${u.num}</span>
                  <h3 class="font-extrabold text-sm sm:text-base text-slate-900">${u.title}</h3>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold shrink-0">${u.level}</span>
              </div>
              <div class="space-y-1.5">
                ${u.points.map((pt, idx) => {
                  const key = `${lang}-${u.num}-${idx}`;
                  const isSel = key === selectedPoint.key;
                  return `
                    <button type="button" data-aio-gram-pick="${key}" class="w-full text-left px-3.5 py-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isSel ? 'bg-orange-50 border-orange-400 text-orange-950 font-extrabold shadow-2xs' : 'bg-[#FAF6EE]/70 hover:bg-orange-50/40 border-[#EAE2D3] text-slate-800 font-semibold'
                    }">
                      <span class="text-xs sm:text-sm">${pt.title}</span>
                      <i data-lucide="chevron-right" class="w-4 h-4 text-orange-500 shrink-0"></i>
                    </button>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      refreshIcons();
    }

    function renderAioReadingPage() {
      const el = document.getElementById('page-reading');
      if (!el) return;
      el.innerHTML = `
        <!-- Mint Green AIO Reading & Translation Banner -->
        <div class="aio-mint-banner rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-2">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Luyện đọc &amp; dịch.</h1>
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-emerald-200">Đọc bài song ngữ Anh &amp; Trung</span>
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-emerald-200">Dịch từng câu chấm lỗi ngay</span>
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-emerald-200">Dán văn bản riêng để nghe đọc</span>
            </div>
          </div>
        </div>

        ${renderOpenQuizSubSection('translate')}
        ${renderOpenQuizSubSection('reading')}

        <!-- Custom Text Reader ("Bài học của tôi: Dán văn bản") -->
        <div class="aio-grid-paper rounded-3xl border border-[#E5DEC9] p-5 space-y-3">
          <div class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <i data-lucide="file-plus-2" class="w-4 h-4 text-emerald-700"></i> Bài học của tôi · Dán đoạn văn bất kỳ để luyện nghe
          </div>
          <textarea id="custom-read-text" rows="3" placeholder="Dán bất kỳ đoạn văn Tiếng Anh hoặc Tiếng Trung nào bạn muốn luyện nghe & đọc theo..." class="w-full p-3.5 rounded-2xl border border-[#E5DEC9] bg-white text-sm outline-none focus:border-emerald-500">${ui.customReadText || ''}</textarea>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="custom-read-en-btn" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Đọc giọng Tiếng Anh</button>
            <button type="button" id="custom-read-zh-btn" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Đọc giọng Tiếng Trung</button>
          </div>
        </div>
      `;
      refreshIcons();
    }

    function ipaLessonSeen(sym) {
      return Boolean(state.ipaHeard?.[ipaAccent()]?.[sym] || (Array.isArray(state.ipaProgress?.[sym]) && state.ipaProgress[sym].length));
    }
    function ipaBoardGroups() { return Object.values(AIO_IPA_TABLE).flat(); }
    function ipaNextLesson() {
      const ordered=['Dễ','Vừa','Khó'].flatMap(diff=>ipaBoardGroups().filter(x=>x.diff===diff));
      return ordered.find(x=>!ipaLessonSeen(x.sym)) || ordered[0];
    }
    function ipaOpenLesson(sym) {
      const item=ipaBoardGroups().find(x=>x.sym===sym);
      if(!item) return;
      stopIpaAudio(); stopIpaPracticeRecording();
      ui.activeIpaSym=sym;ui.ipaDetailSym=sym;ui.ipaPractice=null;
      _ipaAudioMessage='';_ipaAudioError=false;
      renderAioPronunciationPage();window.scrollTo({top:0,behavior:'smooth'});
    }
    function renderAioPronunciationPage() {
      const el = document.getElementById('page-pronunciation');
      if (!el) return;
      const lang = ui.pronLang || 'en';
      const isZh = lang === 'zh';


      const allEnIpa = [
        ...AIO_IPA_TABLE.vowelsLong, ...AIO_IPA_TABLE.vowelsShort, ...AIO_IPA_TABLE.diphthongs,
        ...AIO_IPA_TABLE.consonantsVoiceless, ...AIO_IPA_TABLE.consonantsVoiced, ...AIO_IPA_TABLE.consonantsOther, ...AIO_IPA_TABLE.endings
      ];
      const activeIpa = allEnIpa.find(x => x.sym === ui.activeIpaSym) || allEnIpa[0];

      // Full AIO Interactive Practice Mode (Cụm từ / Câu / Thử thách nghe)
      if (!isZh && ui.ipaPractice) {
        const p = ui.ipaPractice;
        const cur = allEnIpa.find(x => x.sym === p.sym) || activeIpa;
        const g = getIpaGuide(cur);
        const item = p.items[p.idx] || p.items[0];
        const doneSet = getIpaDoneSet(cur.sym);
        const totalItems = p.items.length;
        const doneCount = p.items.filter(it => doneSet.has(it.key)).length;
        const isUK = (p.accent || 'en-GB') === 'en-GB';

        const renderTrackBoxes = (type, label) => {
          const subset = p.items.map((it, idx) => ({ it, idx })).filter(x => x.it.type === type);
          return `
            <div class="flex flex-col gap-0.5">
              <span class="text-[9px] font-bold text-slate-600 leading-none">${label}</span>
              <div class="flex items-center gap-1">
                ${subset.map(x => {
                  const isCur = x.idx === p.idx;
                  const isDone = doneSet.has(x.it.key);
                  return `<button type="button" data-ipa-jump="${x.idx}" title="${label} ${x.idx + 1}" class="w-3 h-3 rounded-[3px] border transition-all ${
                    isCur ? 'bg-amber-300 border-slate-900 scale-110 shadow-2xs'
                    : isDone ? 'bg-emerald-500 border-emerald-600'
                    : 'bg-white/75 border-cyan-300/80 hover:border-cyan-600'
                  }"></button>`;
                }).join('')}
              </div>
            </div>`;
        };

        const highlightTargetInIpa = (ipaStr) => {
          if (!ipaStr) return '';
          const esc = cur.sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return ipaStr.replace(new RegExp(esc, 'g'), `<span class="underline decoration-cyan-500 decoration-2 underline-offset-2 text-cyan-800 font-bold">${ipaSymbol(cur.sym,cur.ex)}</span>`);
        };

        el.innerHTML = `
          ${!isZh ? ipaStatusHTML : ''}
          <div class="aio-cyan-banner rounded-3xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs border-b-2 border-cyan-300/70">
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" id="ipa-practice-exit" class="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-cyan-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Âm /${ipaSymbol(cur.sym,cur.ex)}/
              </button>
              <div class="w-8 h-8 rounded-full bg-white/90 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
                <i data-lucide="mic" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="text-sm font-extrabold text-slate-900 leading-tight">Luyện /${ipaSymbol(cur.sym,cur.ex)}/ ${cur.ex}</div>
                <button type="button" id="ipa-toggle-accent" class="text-[11px] font-bold text-cyan-800 hover:underline">${isUK ? 'Giọng Anh-Anh (UK)' : 'Giọng Anh-Mỹ (US)'} · bấm đổi</button>
              </div>
              <div class="hidden md:flex items-center gap-4 pl-2 border-l border-cyan-300/60">
                ${renderTrackBoxes('phrase', 'Cụm từ')}
                ${renderTrackBoxes('sentence', 'Câu')}
                ${renderTrackBoxes('listen', 'Thử thách nghe')}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold text-slate-800">${doneCount}<span class="text-slate-500 font-semibold">/${totalItems} mục</span></span>
              <button type="button" id="ipa-toggle-guide" class="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-cyan-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="book-open" class="w-3.5 h-3.5 text-cyan-700"></i> Cách đọc
              </button>
            </div>
          </div>

          ${p.showGuide ? `
            <div class="bg-white rounded-2xl border border-cyan-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shadow-2xs">
              <div><strong class="text-slate-500">Khẩu hình:</strong> <span class="text-slate-800">${g.mouth}</span></div>
              <div><strong class="text-slate-500">Bước 1:</strong> <span class="text-slate-800">${g.lips}</span></div>
              <div><strong class="text-slate-500">Bước 2–3:</strong> <span class="text-slate-800">${g.tongue}</span></div>
              <div class="md:col-span-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"><strong>⚠️ Người Việt hay nhầm:</strong> ${g.pitfall}</div>
            </div>
          ` : ''}

          <div class="max-w-3xl mx-auto pt-4 pb-8 space-y-4">
            ${item.type === 'listen' ? `
              <div class="relative bg-[#FAF6EE] rounded-3xl border border-cyan-200 border-b-4 border-l-4 border-b-cyan-300/80 border-l-cyan-300/80 p-6 sm:p-7 shadow-sm">
                <div class="w-12 h-3 bg-amber-200/70 rounded-xs mx-auto -mt-8 mb-4"></div>
                <span class="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-extrabold mb-4">Thử thách nghe</span>
                <div class="flex items-center gap-5">
                  <button type="button" id="ipa-listen-play" class="w-16 h-16 rounded-full bg-[#5B481B] hover:bg-[#493914] text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95">
                    <i data-lucide="volume-2" class="w-7 h-7"></i>
                  </button>
                  <div>
                    <div class="text-xs font-bold text-slate-500">Nghe</div>
                    <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900">Bạn nghe thấy từ nào?</h2>
                    <div class="text-xs text-slate-500 mt-0.5">Bấm loa để nghe mẫu · phím 1 / 2 để chọn nhanh</div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${item.opts.map((opt, oi) => {
                  const picked = p.answeredIdx !== null;
                  const isChosen = p.answeredIdx === oi;
                  let cls = 'bg-white hover:bg-cyan-50/50 border-[#E5DEC9] hover:border-cyan-400';
                  if (picked) {
                    if (opt.isTarget) cls = 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200';
                    else if (isChosen) cls = 'bg-rose-50 border-rose-400 ring-2 ring-rose-200';
                    else cls = 'bg-white/70 border-slate-200 opacity-70';
                  }
                  return `
                    <div class="rounded-2xl border p-4 transition-all flex items-center justify-between gap-3 ${cls}">
                      <button type="button" data-ipa-listen-opt="${oi}" class="flex-1 flex items-center gap-3 text-left">
                        <span class="w-6 h-6 rounded-md bg-[#FAF6EE] border border-[#E5DEC9] flex items-center justify-center text-xs font-extrabold text-slate-600 shrink-0">${oi + 1}</span>
                        <div>
                          <div class="text-lg font-extrabold text-slate-900">${opt.word}</div>
                          <div class="text-xs font-mono text-slate-500">${opt.ipa}</div>
                        </div>
                      </button>
                      ${picked ? `
                        <button type="button" data-ipa-replay-word="${opt.word}" class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                          <i data-lucide="volume-2" class="w-3.5 h-3.5 text-cyan-600"></i> Nghe
                        </button>
                      ` : ''}
                    </div>`;
                }).join('')}
              </div>

              <div class="bg-[#EAE2D0] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-[#DDD3BD]">
                <div class="text-xs font-bold text-slate-700">
                  ${p.answeredIdx !== null
                    ? (item.opts[p.answeredIdx].isTarget ? '✅ Chính xác! Bạn phân biệt âm rất tốt.' : `❌ Từ vừa đọc là <strong>${item.target}</strong>. Hãy bấm nút Nghe ở cả 2 từ để so sánh nhé!`)
                    : (p.heardKey===item.key?'Bấm 1 hoặc 2 để chọn đáp án bạn nghe được.':'Bấm loa và nghe hết mẫu trước khi chọn đáp án.')}
                </div>
                <button type="button" id="ipa-practice-next" class="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D8CEB8] text-slate-900 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-2xs shrink-0">
                  ${p.answeredIdx !== null ? 'Tiếp theo →' : 'Bỏ qua →'}
                </button>
              </div>
            ` : `
              <div class="relative bg-[#FAF6EE] rounded-3xl border border-cyan-200 border-b-4 border-l-4 border-b-cyan-300/80 border-l-cyan-300/80 p-6 sm:p-8 shadow-sm min-h-[250px] flex flex-col justify-between">
                <div>
                  <div class="w-12 h-3 bg-amber-200/70 rounded-xs mx-auto -mt-9 mb-4"></div>
                  <span class="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-extrabold mb-3">${item.label}</span>
                  <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">${item.text}</h2>
                  ${item.vi ? `<div class="text-sm font-medium text-slate-600 mt-1.5">${item.vi}</div>` : ''}
                  ${item.ipa && isUK ? `<div class="text-sm font-mono text-slate-500 mt-1">${highlightTargetInIpa(item.ipa)}</div>` : ''}
                </div>

                <div class="border-t border-dashed border-[#DDD3BD] mt-6 pt-4">
                  ${p.recording ? `
                    <div class="flex items-center gap-2 text-xs font-extrabold text-rose-600 animate-pulse">
                      <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Đang ghi âm giọng bạn... Hãy đọc to rõ "${item.text}" rồi bấm dừng!
                    </div>
                  ` : p.hasRecording ? `
                    <div class="text-xs text-slate-700">Đã ghi âm. Bấm <strong>Nghe lại</strong> để so sánh với mẫu. Phần này không chấm điểm phát âm tự động.</div>
                  ` : `
                    <div class="text-xs text-slate-400">Bấm <strong>Nghe cả cụm/câu</strong> trước, sau đó bấm nút micro màu đỏ <strong>Bắt đầu ghi âm</strong> để luyện đọc và nghe lại giọng mình.</div>
                  `}
                </div>
              </div>

              <div class="bg-[#EAE2D0] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-[#DDD3BD]">
                <div class="flex flex-wrap items-center gap-2.5">
                  <button type="button" id="ipa-sample-play" class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D8CEB8] text-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5 text-slate-700"></i> Nghe cả cụm/câu
                  </button>

                  <button type="button" id="ipa-record-btn" class="flex items-center gap-2.5 pr-3 py-1 pl-1 rounded-full ${p.recording ? 'bg-rose-100 border border-rose-400' : 'hover:bg-white/60'} transition-all">
                    <span class="w-11 h-11 rounded-full ${p.recording ? 'bg-rose-600 animate-pulse' : 'bg-[#D34A26] hover:bg-[#B93D1C]'} text-white flex items-center justify-center shadow-sm">
                      <i data-lucide="${p.recording ? 'square' : 'mic'}" class="w-5 h-5"></i>
                    </span>
                    <span class="text-left leading-tight">
                      <span class="block text-xs font-extrabold text-slate-900">${p.recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</span>
                      <span class="block text-[10px] text-slate-500">Tối đa 30 giây</span>
                    </span>
                  </button>

                  <button type="button" id="ipa-playback-btn" ${p.hasRecording ? '' : 'disabled'} class="px-3 py-2 rounded-xl bg-white/85 border border-[#D8CEB8] text-xs font-bold flex items-center gap-1.5 ${p.hasRecording ? 'text-slate-800 hover:bg-white' : 'text-slate-400 opacity-60 cursor-not-allowed'}">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Nghe lại
                  </button>

                  <select id="ipa-speed-select" class="px-2.5 py-2 rounded-xl bg-white border border-[#D8CEB8] text-xs font-bold text-slate-700 outline-none">
                    <option value="1" ${p.speed === 1 ? 'selected' : ''}>Mặc định</option>
                    <option value="0.75" ${p.speed === 0.75 ? 'selected' : ''}>Chậm (0.75x)</option>
                    <option value="0.6" ${p.speed === 0.6 ? 'selected' : ''}>Rất chậm (0.6x)</option>
                  </select>
                </div>

                <button type="button" id="ipa-practice-next" class="px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D8CEB8] text-slate-900 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-2xs">
                  ${doneSet.has(item.key) ? 'Tiếp theo →' : 'Bỏ qua →'}
                </button>
              </div>
            `}
          </div>
        `;
        updateIpaAudioStatus();
        refreshIcons();
        return;
      }

      // Full AIO Sound Detail View when user clicks any IPA tile!
      if (!isZh && ui.ipaDetailSym) {
        const cur = allEnIpa.find(x => x.sym === ui.ipaDetailSym) || activeIpa;
        const g = getIpaGuide(cur);
        const doneSet = getIpaDoneSet(cur.sym);
        const listenItems = buildIpaPracticeItems(cur,g).filter(item=>item.type === 'listen');
        const listenDone = listenItems.filter(item=>doneSet.has(item.key)).length;
        const phraseDone = (g.phrases || []).filter((_, i) => doneSet.has(`p_${i}`)).length;
        const sentDone = (g.sentences || []).filter((_, i) => doneSet.has(`s_${i}`)).length;
        const isUK = (ui.ipaAccent || 'en-GB') === 'en-GB';

        const miniSquares = (count, prefix) => Array.from({ length: count }, (_, i) => {
          const ok = doneSet.has(`${prefix}_${i}`);
          return `<span class="w-3.5 h-3.5 rounded-[4px] border ${ok ? 'bg-emerald-500 border-emerald-600' : 'bg-[#FAF6EE] border-[#E2D9C5]'} inline-block"></span>`;
        }).join('');

        el.innerHTML = `
          ${!isZh ? ipaStatusHTML : ''}
          <div class="aio-cyan-banner rounded-3xl px-5 py-4 flex items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-3">
              <button type="button" id="ipa-back-btn" class="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-cyan-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Phát âm
              </button>
              <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900">${cur.sym==='-(e)s'?'Đuôi -s/-es':cur.sym==='-ed'?'Đuôi -ed':cur.sym.startsWith('-')?`Âm cuối /${ipaSymbol(cur.sym,cur.ex)}/`:`Âm /${ipaSymbol(cur.sym,cur.ex)}/`}.</h1>
            </div>
            <div class="bg-white/90 p-0.5 rounded-xl inline-flex text-xs font-extrabold border border-cyan-200">
              <button type="button" data-ipa-accent="en-GB" class="px-2.5 py-1 rounded-lg ${isUK ? 'bg-cyan-800 text-white' : 'text-slate-600'}">UK</button>
              <button type="button" data-ipa-accent="en-US" class="px-2.5 py-1 rounded-lg ${!isUK ? 'bg-cyan-800 text-white' : 'text-slate-600'}">US</button>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-[#E5DEC9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-2xl bg-[#FAF6EE] border border-[#E5DEC9] flex items-center justify-center text-3xl font-extrabold text-slate-900 shadow-2xs shrink-0">/${ipaSymbol(cur.sym,cur.ex)}/</div>
              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-bold">${g.cat}</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">${(listenDone + phraseDone + sentDone) > 0 ? `Đã luyện ${listenDone + phraseDone + sentDone}/${(listenItems.length + g.phrases.length + g.sentences.length)}` : 'Chưa luyện'}</span>
                </div>
                <div class="text-base sm:text-lg text-slate-700">
                  <span class="text-xs font-bold text-slate-400 mr-1.5">Từ khoá</span>
                  <strong class="text-2xl text-slate-900">${ipaHighlight(cur.sym,cur.ex)}</strong>
                  <span class="text-sm font-mono text-cyan-700 ml-1.5">${g.ipaEx}</span>
                  <span class="text-xs text-slate-500 ml-1.5">${g.viEx}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <button type="button" data-speak-phoneme="${cur.sym}" data-ipa-context="${cur.ex}" class="px-4 py-2.5 rounded-2xl bg-white hover:bg-cyan-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                <i data-lucide="volume-2" class="w-4 h-4 text-cyan-700"></i> Nghe âm
              </button>
              <button type="button" data-speak-phoneme="${cur.sym}" data-ipa-context="${cur.ex}" data-ipa-rate="0.8" class="nt-ipa-button">Âm chậm</button>
              <button type="button" data-ipa-word="${cur.ex}" class="nt-ipa-button">Cả từ</button>
              <button type="button" data-ipa-start="phrase" class="px-4 py-2.5 rounded-2xl bg-white hover:bg-cyan-50 border-2 border-cyan-500 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-xs">
                Bắt đầu luyện →
              </button>
            </div>
          </div>

          <section class="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <h2 class="font-extrabold text-sm">Âm trong từng từ</h2>
            <p class="nt-ipa-note">Loa /âm/ chỉ phát phần gạch chân; “Cả từ” đọc toàn bộ từ minh họa. Nếu mẫu cả từ không tải được, bạn có thể <a class="underline" href="https://dictionary.cambridge.org/pronunciation/english/${encodeURIComponent(cur.ex)}" target="_blank" rel="noopener noreferrer">nghe từ khóa trên Cambridge</a> và thử lại sau. Mẫu âm riêng không phụ thuộc giọng đọc cài trên thiết bị.</p>
            <div class="nt-ipa-examples">${[...new Set([cur.ex,...g.words])].map(word=>NTPronunciation.exampleHTML(cur.sym,word,ipaAccent())).join('')}</div>
          </section>
          ${NTPronunciation.ruleHTML(cur.sym,ipaAccent())}

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div class="lg:col-span-5 bg-white rounded-3xl border border-cyan-200/80 p-5 space-y-3 shadow-2xs">
              <div class="font-extrabold text-sm text-slate-900">Cặp dễ nhầm</div>
              <div class="space-y-2.5">
                ${g.pairs.length ? '' : '<p class="nt-ipa-note">Luyện âm riêng rồi nghe cả từ ở phần trên.</p>'}
                ${g.pairs.map(pr => `
                  <div class="p-2.5 rounded-2xl bg-[#FAF6EE] border border-[#EAE2D3] flex items-center justify-between gap-2">
                    <button type="button" data-ipa-word="${pr[0]}" class="flex-1 px-3 py-2 rounded-xl bg-white hover:bg-cyan-50 border border-slate-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-900">
                      <i data-lucide="volume-2" class="w-3.5 h-3.5 text-cyan-600"></i> ${pr[0]} <span class="text-[11px] font-mono text-slate-400 font-normal">${ipaWordIPA(pr[0]) || (isUK ? pr[1] : '')}</span>
                    </button>
                    <span class="text-xs font-extrabold text-slate-400">≠</span>
                    <button type="button" data-ipa-word="${pr[2]}" class="flex-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-900">
                      <i data-lucide="volume-2" class="w-3.5 h-3.5 text-rose-500"></i> ${pr[2]} <span class="text-[11px] font-mono text-slate-400 font-normal">${ipaWordIPA(pr[2]) || (isUK ? pr[3] : '')}</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E5DEC9] p-5 space-y-3 shadow-2xs">
              <div class="font-extrabold text-sm text-slate-900">Cách đọc</div>
              <div class="divide-y divide-slate-100 text-xs sm:text-sm">
                <div class="py-2 flex gap-3"><span class="w-16 font-extrabold text-slate-500 shrink-0">Khẩu hình</span><span class="text-slate-800">${g.mouth}</span></div>
                <div class="py-2 flex gap-3"><span class="w-16 font-extrabold text-slate-500 shrink-0">Bước 1</span><span class="text-slate-800">${g.lips}</span></div>
                <div class="py-2 flex gap-3"><span class="w-16 font-extrabold text-slate-500 shrink-0">Bước 2–3</span><span class="text-slate-800">${g.tongue}</span></div>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                <strong>ℹ️ Lưu ý khi phát âm:</strong> ${g.note}
              </div>
              <div class="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <strong>⚠️ Người Việt hay nhầm:</strong> ${g.pitfall}
              </div>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-[#E5DEC9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div class="space-y-2 min-w-0">
              <div class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <i data-lucide="headphones" class="w-4 h-4 text-cyan-600"></i> Thử thách nghe
              </div>
              <div class="flex flex-wrap items-center gap-1.5">${listenItems.map(item=>`<span class="w-3.5 h-3.5 rounded border ${doneSet.has(item.key)?'bg-emerald-500':'bg-white'}"></span>`).join('')}</div>
              <div class="text-xs text-slate-500 truncate">${g.words.join(', ')}</div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-sm font-extrabold text-slate-700">${listenDone}/${listenItems.length}</span>
              <button type="button" data-ipa-start="listen" ${listenItems.length ? '' : 'disabled title="Chưa có cặp đối chiếu phù hợp cho âm và giọng này"'} class="px-4 py-2 rounded-xl bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 text-slate-900 text-xs font-extrabold shadow-2xs">Bắt đầu luyện →</button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="bg-white rounded-3xl border border-cyan-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div class="space-y-2 min-w-0">
                <div class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <i data-lucide="message-square" class="w-4 h-4 text-cyan-600"></i> Cụm từ
                </div>
                <div class="flex flex-wrap items-center gap-1.5">${miniSquares(g.phrases.length, 'p')}</div>
                <div class="text-xs text-slate-500 line-clamp-2">${g.phrases.join(', ')}</div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-sm font-extrabold text-slate-700">${phraseDone}/${g.phrases.length}</span>
                <button type="button" data-ipa-start="phrase" class="px-4 py-2 rounded-xl bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 text-slate-900 text-xs font-extrabold shadow-2xs">Bắt đầu luyện →</button>
              </div>
            </div>

            <div class="aio-honey-panel rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div class="space-y-2 min-w-0">
                <div class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <i data-lucide="quote" class="w-4 h-4 text-amber-800"></i> Câu
                </div>
                <div class="flex flex-wrap items-center gap-1.5">${miniSquares(g.sentences.length, 's')}</div>
                <div class="text-xs text-slate-600 line-clamp-2">${g.sentences.join(' · ')}</div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-sm font-extrabold text-slate-700">${sentDone}/${g.sentences.length}</span>
                <button type="button" data-ipa-start="sentence" class="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 border border-[#E5D6B5] text-slate-900 text-xs font-extrabold shadow-2xs">Bắt đầu luyện →</button>
              </div>
            </div>
          </div>
        `;
        updateIpaAudioStatus();
        refreshIcons();
        return;
      }

      const tileHtml = (item, isChinese) => {
        const isSel = !isChinese && activeIpa && activeIpa.sym === item.sym;
        if(!isChinese) return `<article class="nt31-tile ${ipaLessonSeen(item.sym)?'nt31-seen':''} ${isSel?'nt31-selected':''}">
          <div class="nt31-tile-top"><span class="nt31-diff">${item.diff}</span><button type="button" class="nt31-speaker" data-speak-phoneme="${item.sym}" data-ipa-context="${item.ex}" aria-label="Nghe riêng âm /${ipaSymbol(item.sym,item.ex)}/" title="Nghe âm riêng"><i data-lucide="volume-2" class="w-4 h-4"></i></button></div>
          <button type="button" class="nt31-open" data-pick-ipa="${item.sym}" aria-label="Mở bài ${ipaSymbol(item.sym,item.ex)} ${item.ex}"><strong>${NTPronunciation.tileSymbol(item.sym,ipaAccent(),item.ex)}</strong><span>${ipaHighlight(item.sym,item.ex)}</span><small>${ipaLessonSeen(item.sym)?'Đã nghe/luyện':'Mở bài học →'}</small></button>
        </article>`;
        return `
        <button type="button" ${isChinese ? `data-speak-zh="${item.ex.split('(')[0].trim()}"` : `data-pick-ipa="${item.sym}" data-speak-phoneme="${item.sym}" data-ipa-context="${item.ex}"`} class="p-3 rounded-2xl bg-white hover:bg-cyan-50/60 border ${isSel ? 'border-cyan-500 ring-2 ring-cyan-200 shadow-xs' : 'border-[#E5DEC9] hover:border-cyan-400 shadow-2xs'} text-left transition-all group">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">${item.diff || 'Pinyin'}</span>
            <i data-lucide="volume-2" class="w-3.5 h-3.5 text-cyan-600 opacity-70 group-hover:opacity-100"></i>
          </div>
          <div class="text-lg font-extrabold text-slate-900 mt-1">${isChinese ? item.sym : NTPronunciation.tileSymbol(item.sym,ipaAccent(),item.ex)}</div>
          <div class="text-xs font-semibold text-slate-600 truncate">${isChinese ? item.ex : ipaHighlight(item.sym,item.ex)}</div>
          ${isChinese && item.tip ? `<div class="text-[10px] text-rose-600 mt-0.5 line-clamp-1">${item.tip}</div>` : ''}
        </button>`;
      };

      el.innerHTML = `
          ${!isZh ? ipaStatusHTML : ''}
        <!-- Cyan AIO Pronunciation Banner -->
        <div class="aio-cyan-banner rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Luyện phát âm.</h1>
              <div class="bg-white/85 p-0.5 rounded-xl inline-flex text-xs font-bold border border-cyan-200">
                <button type="button" data-pron-lang="en" class="px-3 py-1 rounded-lg ${!isZh ? 'bg-cyan-700 text-white' : 'text-slate-600'}">Tiếng Anh (IPA)</button>
                <button type="button" data-pron-lang="zh" class="px-3 py-1 rounded-lg ${isZh ? 'bg-rose-600 text-white' : 'text-slate-600'}">Tiếng Trung (4 Thanh &amp; Pinyin)</button>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-700">${isZh ? 'Bấm trực tiếp vào từng ô âm để nghe phát âm mẫu chuẩn xác.' : 'Bấm loa để nghe riêng phần gạch chân; bấm ký hiệu để mở bài học. Phụ âm và âm cuối phát 3 lần.'}</p>
          </div>
        </div>

        ${!isZh ? `
          <div class="nt31-toolbar">
            <div class="nt31-accent"><button type="button" data-ipa-accent="en-GB" class="nt-ipa-button" aria-pressed="${ipaAccent()==='en-GB'}">Anh–Anh (UK)</button><button type="button" data-ipa-accent="en-US" class="nt-ipa-button" aria-pressed="${ipaAccent()==='en-US'}">Anh–Mỹ (US)</button></div>
            <div class="nt31-progress"><b>${allEnIpa.filter(x=>ipaLessonSeen(x.sym)).length}/${allEnIpa.length}</b> mục đã nghe/luyện <button type="button" class="nt-ipa-button" data-pick-ipa="${ipaNextLesson().sym}">Luyện tiếp /${ipaSymbol(ipaNextLesson().sym,ipaNextLesson().ex)}/ →</button></div>
          </div>
          <p class="nt-ipa-note">44 mục âm theo bảng UK + 7 bài âm cuối. Với US, một số mục là biến thể hoặc tổ hợp âm (có thể trùng nhau); không coi 51 mục là 51 âm vị riêng. Tiến độ bài luyện cũ được giữ lại.</p>
          <section class="nt31-roadmap"><h2> <i data-lucide="route" class="w-4 h-4"></i> Lộ trình luyện</h2><div class="nt31-stages">${['Dễ','Vừa','Khó'].map((diff,i)=>{const group=allEnIpa.filter(x=>x.diff===diff);const done=group.filter(x=>ipaLessonSeen(x.sym)).length;const next=group.find(x=>!ipaLessonSeen(x.sym))||group[0];return `<button type="button" data-pick-ipa="${next.sym}" class="nt31-stage"><span>Chặng ${i+1} · ${diff}</span><b>${['Làm quen với âm cơ bản','Chỉnh những âm dễ lệch','Âm khó và âm cuối'][i]}</b><small>${done}/${group.length} mục đã nghe/luyện</small><div class="nt31-bar"><i style="width:${100*done/group.length}%"></i></div></button>`;}).join('')}</div></section>
          <div class="nt31-layout">
            <section class="nt31-panel"><h2>Nguyên âm đơn <small>12 mục</small></h2><div class="nt31-row-label">Dài</div><div class="nt31-vowels-long">${AIO_IPA_TABLE.vowelsLong.map(x=>tileHtml(x,false)).join('')}</div><div class="nt31-row-label">Ngắn</div><div class="nt31-vowels-short">${AIO_IPA_TABLE.vowelsShort.map(x=>tileHtml(x,false)).join('')}</div></section>
            <section class="nt31-panel nt31-warm"><h2>Nguyên âm đôi <small>8 mục UK</small></h2><div class="nt31-diphthongs">${AIO_IPA_TABLE.diphthongs.map(x=>tileHtml(x,false)).join('')}</div></section>
            <section class="nt31-panel nt31-warm nt31-consonants"><h2>Phụ âm <small>24 mục</small></h2><div class="nt31-row-label">Vô thanh</div><div class="nt31-consonant-row">${AIO_IPA_TABLE.consonantsVoiceless.map(x=>tileHtml(x,false)).join('')}</div><div class="nt31-row-label">Hữu thanh</div><div class="nt31-consonant-row">${AIO_IPA_TABLE.consonantsVoiced.map(x=>tileHtml(x,false)).join('')}</div><div class="nt31-row-label">Không ghép cặp</div><div class="nt31-consonant-row">${AIO_IPA_TABLE.consonantsOther.map(x=>tileHtml(x,false)).join('')}</div></section>
            <section class="nt31-panel nt31-endings"><h2>Âm cuối <small>7 bài</small></h2><div class="nt31-ending-row">${AIO_IPA_TABLE.endings.map(x=>tileHtml(x,false)).join('')}</div></section>
          </div>
          <p class="nt-ipa-note">Loa phát bản âm riêng có sẵn trong web. Bấm ký hiệu hoặc từ để mở bài học. Mẫu âm riêng là tham chiếu IPA; giọng tự nhiên có thể khác đôi chút. <a class="underline" href="https://dictionary.cambridge.org/help/phonetics.html" target="_blank" rel="noopener noreferrer">Đối chiếu UK/US với Cambridge</a>.</p>
        ` : `
          <div class="aio-honey-panel rounded-3xl p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-base text-slate-900">Bảng 4 Thanh điệu Tiếng Trung chuẩn Bắc Kinh (单韵母 × 4 thanh)</div>
                <div class="text-xs text-slate-600 mt-0.5">Bấm từng ô để nghe rõ độ cao khác biệt giữa 4 thanh: <strong>Thanh 1 (55)</strong> ngang cao · <strong>Thanh 2 (35)</strong> đi lên · <strong>Thanh 3 (214)</strong> xuống trầm rồi uốn lên · <strong>Thanh 4 (51)</strong> rơi mạnh dứt khoát.</div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-extrabold text-rose-700 px-1">
              <div class="bg-white/85 rounded-xl py-1.5 border border-rose-200/70">Thanh 1 (55) — Ngang cao</div>
              <div class="bg-white/85 rounded-xl py-1.5 border border-rose-200/70">Thanh 2 (35) — Đi lên</div>
              <div class="bg-white/85 rounded-xl py-1.5 border border-rose-200/70">Thanh 3 (214) — Trầm rồi lên</div>
              <div class="bg-white/85 rounded-xl py-1.5 border border-rose-200/70">Thanh 4 (51) — Rơi dứt khoát</div>
            </div>

            <div class="space-y-2.5">
              ${ZH_FOUR_TONE_MATRIX.map(row => `
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between px-1">
                    <span class="text-xs font-extrabold text-slate-700">${row.label}</span>
                    <button type="button" data-zh-tone-row="${row.vowel}" class="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-[#E5D6B5] text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <i data-lucide="play" class="w-3 h-3"></i> Nghe liền 4 thanh
                    </button>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    ${row.tones.map((t, ti) => `
                      <button type="button" data-speak-zh="${t.hanzi}" class="p-3 rounded-2xl bg-white hover:bg-rose-50/70 border border-[#E5D6B5] hover:border-rose-400 text-left transition-all shadow-2xs group">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">Thanh ${ti + 1}</span>
                          <i data-lucide="volume-2" class="w-3.5 h-3.5 text-rose-500 opacity-75 group-hover:opacity-100"></i>
                        </div>
                        <div class="text-2xl font-extrabold text-slate-900 mt-1">${t.mark} <span class="text-sm font-mono text-rose-600">${t.py}</span></div>
                        <div class="text-xs font-semibold text-slate-600 mt-0.5">${t.hanzi} · <span class="text-emerald-700">${t.vi}</span></div>
                      </button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="bg-white rounded-3xl border border-[#E5DEC9] p-5 space-y-3">
            <div class="font-extrabold text-sm text-slate-900">Thanh mẫu Pinyin hay nhầm (Bấm nghe từng âm)</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              ${AIO_ZH_PINYIN_INITIALS.map(x => tileHtml(x, true)).join('')}
            </div>
          </div>
        `}
      `;
      if (!isZh) el.insertAdjacentHTML('beforeend','<p class="nt-ipa-sources">Mẫu âm IPA tham chiếu; một số âm dùng chung giữa hai giọng. <a href="./assets/pronunciation/CREDITS.txt" target="_blank" rel="noopener">Nguồn và giấy phép bản thu</a></p>');
      updateIpaAudioStatus();
      refreshIcons();
    }

    function renderAioDictionaryPage() {
      const el = document.getElementById('page-dictionary');
      if (!el) return;
      if (!window.EngStartDictionary) { el.textContent = 'Chưa tải được bộ từ điển. Hãy tải lại trang.'; return; }
      window.EngStartDictionary.render(el, {
        lang: ui.dictLang || 'all',
        setLang: value => { ui.dictLang = value; updateHeader(); },
        refreshIcons,
        stopOtherAudio: () => { stopIpaAudio(); try { window.speechSynthesis?.cancel(); } catch {} },
        getData: () => {
          const en = [], zh = [];
          if (typeof ALL_WORDS !== 'undefined') ALL_WORDS.forEach(w => en.push({head:w.en,sub:w.ipa,pos:w.pos,vi:w.vi,usage:w.usage,example:w.exEn,exampleVi:w.exVi,level:''}));
          if (typeof EXTRA_COMM_WORDS !== 'undefined') EXTRA_COMM_WORDS.forEach(r => en.push({head:r[0],sub:r[1],pos:r[2],vi:r[3],level:r[4]}));
          if (typeof ZH_TOPICS !== 'undefined') ZH_TOPICS.forEach(t => (t.words || []).forEach(w => zh.push({head:w.hanzi,sub:w.pinyin,pos:w.pos||'Từ vựng',vi:w.vi,example:w.exZh||w.ex,examplePy:w.exPy,exampleVi:w.exVi})));
          if (typeof EXTRA_ZH_WORDS !== 'undefined') EXTRA_ZH_WORDS.forEach(r => zh.push(Array.isArray(r)?{head:r[0],sub:r[1],pos:r[2],vi:r[3],level:r[4]}:{head:r.hanzi,sub:r.pinyin,pos:r.pos,vi:r.vi,level:r.level,example:r.exZh,exampleVi:r.exVi}));
          (state.customBankWords || []).forEach(w=>en.push({head:w.en,sub:w.ipa,pos:w.pos,vi:w.vi,level:w.level,example:w.exEn,exampleVi:w.exVi}));
          (state.zhCustomBankWords || []).forEach(w=>zh.push({head:w.en,sub:w.ipa,pos:w.pos,vi:w.vi,level:w.level,example:w.exEn,exampleVi:w.exVi}));
          // v34 dictionary: include the entire v33 library and personal vocabulary decks.
          const addLibrary = (w,l) => {
            if (!w || !['en','zh'].includes(l)) return;
            const row = {head:w.en||w.word||w.hanzi,sub:w.ipa||w.pinyin,pos:w.pos,vi:w.vi||w.meaning,level:w.level,example:w.exEn||w.exZh||w.example,exampleVi:w.exVi||w.exampleVi,examplePy:w.exPy,definition:w.definition,usage:w.usage};
            (l==='zh'?zh:en).push(row);
          };
          (window.EngStartVocabularyData?.rows || []).forEach(w=>addLibrary(w,w.lang));
          (Array.isArray(state.vocabLibraryV33?.custom)?state.vocabLibraryV33.custom:[]).forEach(d=>{if(d&&Array.isArray(d.words))d.words.forEach(w=>addLibrary(w,d.lang));});
          return {en,zh};
        },
        isSaved: (head) => String(state.notebook || '').split('\n').some(line => line.startsWith('- [Từ điển] '+head+' (')),
        save: (entry, meaning) => {
          const prefix = '- [Từ điển] '+entry.head+' (';
          if (String(state.notebook||'').split('\n').some(line=>line.startsWith(prefix))) { showToast('Từ này đã có trong sổ tay.'); return; }
          const pronunciation = entry.lang === 'zh' ? (entry.pinyin || '—') : ([entry.uk&&'UK '+entry.uk,entry.us&&'US '+entry.us].filter(Boolean).join(' · ') || entry.sub || '—');
          const line = (prefix + pronunciation + '): ' + meaning).replace(/[\r\n]+/g,' ');
          state.notebook = state.notebook ? state.notebook + '\n' + line : line;
          saveState(); showToast('Đã lưu '+entry.head+' vào Sổ tay!');
        }
      });
    }

    // ==================== AIO-STYLE SENTENCE TYPING ("HỌC QUA GÕ CÂU" — ANH & TRUNG) ====================
    function getTypingTopics(lang) {
      if (lang === 'zh') {
        const life = [];
        const work = [];
        const zhIcons = ['👋','🍜','🛍️','👨‍👩‍👧','⏰','🚕','❤️','🌤️','💼','📚','💻','✈️'];
        (typeof ZH_TOPICS !== 'undefined' ? ZH_TOPICS : []).forEach((t, idx) => {
          const sentences = (t.words || []).map(w => ({
            target: w.exZh || w.ex || w.hanzi,
            sub: w.exPy || w.exPinyin || w.pinyin,
            vi: w.exVi || w.vi,
            word: w.hanzi
          }));
          const obj = {
            id: 'zh-' + t.id,
            icon: zhIcons[idx % zhIcons.length],
            title: t.title,
            count: sentences.length,
            level: idx < 6 ? 'HSK 1' : 'HSK 2',
            sentences
          };
          if (idx < 8) life.push(obj);
          else work.push(obj);
        });
        return { life, work, all: [...life, ...work] };
      }

      const life = [];
      const work = [];
      const workKeys = new Set(['work', 'study', 'tech', 'office', 'interview', 'career', 'money']);
      const enIcons = ['👋','📚','👨‍👩‍👧','💼','🍜','🛍️','⏰','🚕','🌤️','🏥','🎉','🏡','💻','🎯','✈️','🎵'];
      TOPICS_DATA.forEach((t, idx) => {
        const sentences = [];
        (t.lessons || []).forEach(l => (l.words || []).forEach(w => {
          const exStr = w.exEn || w.example || '';
          if (exStr) {
            sentences.push({
              target: exStr,
              sub: w.ipa || '',
              vi: w.exVi || w.exampleVi || w.vi,
              word: w.en
            });
          }
        }));
        const obj = {
          id: 'en-' + t.id,
          icon: enIcons[idx % enIcons.length],
          title: t.title,
          count: sentences.length,
          level: idx < 8 ? 'A1' : (idx < 16 ? 'A2' : 'B1'),
          sentences
        };
        if (workKeys.has(t.id) || /công việc|học tập|công nghệ|phỏng vấn|tài chính/i.test(t.title)) {
          work.push(obj);
        } else {
          life.push(obj);
        }
      });
      return { life, work, all: [...life, ...work] };
    }

    function renderLiveTypingTokens(target, typed, isZh) {
      if (isZh) {
        const chars = [...target];
        return chars.map((ch, i) => {
          if (i >= typed.length) return `<span class="text-slate-400">${ch}</span>`;
          const ok = typed[i] === ch;
          return `<span class="${ok ? 'text-emerald-600 bg-emerald-50 rounded px-0.5' : 'text-rose-600 bg-rose-50 rounded px-0.5 underline'}">${ch}</span>`;
        }).join('');
      }
      const tWords = target.split(/\s+/);
      const uWords = (typed || '').trim() ? typed.trim().split(/\s+/) : [];
      const clean = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
      return tWords.map((w, i) => {
        if (i >= uWords.length) {
          return `<span class="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-sm font-semibold">${ui.typingMode === 'easy' ? w : '•'.repeat(Math.min(6, w.length))}</span>`;
        }
        const ok = clean(uWords[i]) === clean(w);
        return `<span class="px-1.5 py-0.5 rounded-md text-sm font-bold ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">${ok ? w : uWords[i]}</span>`;
      }).join(' ');
    }

    function renderTypingPage() {
      const el = document.getElementById('page-typing');
      if (!el) return;
      const lang = ui.typingLang || 'en';
      const isZh = lang === 'zh';
      const { life, work, all } = getTypingTopics(lang);

      // Active typing session view
      if (ui.typingActiveTopicId) {
        const topic = all.find(t => t.id === ui.typingActiveTopicId) || all[0];
        const idx = Math.max(0, Math.min(ui.typingSentenceIdx || 0, topic.sentences.length - 1));
        ui.typingSentenceIdx = idx;
        const sent = topic.sentences[idx];
        const mode = ui.typingMode || 'hard'; // 'hard' | 'medium' | 'easy'
        const typed = ui.typingInput || '';
        const speakAttr = isZh
          ? `data-speak-zh="${sent.target.replace(/"/g, '&quot;')}"`
          : `data-speak="${sent.target.replace(/"/g, '&quot;')}"`;

        el.innerHTML = `
          <div class="bg-white rounded-3xl border border-[#E6DEC9] shadow-xs p-5 sm:p-7 space-y-5 max-w-3xl mx-auto">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <button type="button" id="typing-back-btn" class="px-3 py-1.5 rounded-xl bg-[#F6F2E9] hover:bg-[#ECE5D5] text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại danh sách
              </button>
              <div class="text-xs font-extrabold text-slate-600">${topic.icon} ${topic.title} · Câu ${idx + 1}/${topic.sentences.length}</div>
              <div class="bg-[#F6F2E9] p-1 rounded-xl inline-flex text-[11px] font-bold">
                <button type="button" data-typing-mode="hard" class="px-2.5 py-1 rounded-lg ${mode === 'hard' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'}">Khó (Nghe thuần)</button>
                <button type="button" data-typing-mode="medium" class="px-2.5 py-1 rounded-lg ${mode === 'medium' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'}">Vừa (Nghe+Việt)</button>
                <button type="button" data-typing-mode="easy" class="px-2.5 py-1 rounded-lg ${mode === 'easy' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'}">Dễ (Hiện mẫu)</button>
              </div>
            </div>

            <div class="p-5 rounded-2xl aio-grid-paper border border-[#E5DEC9] space-y-3 text-center">
              <div class="flex items-center justify-center gap-2">
                <button type="button" ${speakAttr} class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <i data-lucide="volume-2" class="w-4 h-4"></i> Nghe câu mẫu
                </button>
                ${isZh ? `<button type="button" data-speak-zh-slow="${sent.target.replace(/"/g, '&quot;')}" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700">Đọc chậm</button>` : ''}
              </div>

              ${mode === 'easy' ? `
                <div class="text-lg sm:text-xl font-extrabold text-slate-800 pt-1">${sent.target}</div>
                ${sent.sub ? `<div class="text-xs font-mono ${isZh ? 'text-rose-600' : 'text-sky-600'}">${sent.sub}</div>` : ''}
              ` : ''}
              ${mode !== 'hard' ? `<div class="text-sm font-semibold text-slate-600">Nghĩa: “${sent.vi}”</div>` : `<div class="text-xs text-slate-500 italic">Nghe âm thanh phía trên rồi gõ lại chính xác câu bạn nghe được</div>`}
            </div>

            <!-- Live Word-by-Word Grading Display -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chấm từng từ khi gõ:</div>
              <div id="typing-live-feedback" class="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                ${renderLiveTypingTokens(sent.target, typed, isZh)}
              </div>
            </div>

            <div class="space-y-2.5">
              <input type="text" id="typing-sentence-input" autocomplete="off" value="${typed.replace(/"/g, '&quot;')}" placeholder="${isZh ? 'Gõ lại câu chữ Hán...' : 'Gõ lại câu tiếng Anh tại đây...'}" class="w-full px-4 py-3.5 rounded-2xl border-2 border-sky-200 focus:border-sky-500 bg-white text-base font-semibold outline-none" />
              <div class="flex items-center justify-between gap-2">
                <button type="button" id="typing-reveal-btn" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Hiện đáp án</button>
                <div class="flex items-center gap-2">
                  <button type="button" id="typing-check-next-btn" class="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-xs">Kiểm tra &amp; Câu tiếp →</button>
                </div>
              </div>
            </div>
          </div>
        `;
        refreshIcons();
        return;
      }

      const levels = isZh
        ? [
            { code: 'HSK 1', title: 'Tiếng Trung cho người mới', sub: 'Chào hỏi, gia đình, số đếm', active: true },
            { code: 'HSK 2', title: 'Tiếng Trung cơ bản', sub: 'Mua sắm, du lịch, đi lại', active: false },
            { code: 'HSK 3', title: 'Giao tiếp mở rộng', sub: 'Công việc, kể chuyện, sở thích', active: false }
          ]
        : [
            { code: 'A1', title: 'Tiếng Anh cho người mới', sub: 'Chào hỏi, kết bạn', active: true },
            { code: 'A2', title: 'Tiếng Anh cơ bản', sub: 'Mua sắm, đi lại', active: false },
            { code: 'B1', title: 'Tiếng Anh trung cấp', sub: 'Kể chuyện, giao tiếp tự tin', active: false },
            { code: 'B2', title: 'Tiếng Anh trung cao', sub: 'Nói lên ý kiến, công sở', active: false }
          ];

      el.innerHTML = `
        <!-- 1. Sky-Blue AIO Hero Banner -->
        <div class="aio-sky-banner rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs relative overflow-hidden">
          <div class="space-y-2.5 relative z-10">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Học qua gõ câu.</h1>
              <div class="bg-white/80 backdrop-blur-xs p-0.5 rounded-xl inline-flex text-xs font-bold border border-sky-200">
                <button type="button" data-typing-lang="en" class="px-2.5 py-1 rounded-lg ${!isZh ? 'bg-sky-600 text-white' : 'text-slate-600'}">Tiếng Anh</button>
                <button type="button" data-typing-lang="zh" class="px-2.5 py-1 rounded-lg ${isZh ? 'bg-rose-600 text-white' : 'text-slate-600'}">Tiếng Trung</button>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-sky-200/80 flex items-center gap-1"><i data-lucide="headphones" class="w-3.5 h-3.5 text-sky-600"></i> Nghe trước, gõ sau</span>
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-sky-200/80 flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i> Chấm từng từ khi gõ</span>
              <span class="px-2.5 py-1 rounded-full bg-white/85 border border-sky-200/80 flex items-center gap-1"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-indigo-600"></i> Ba chế độ tuỳ chọn</span>
            </div>
          </div>

          <button type="button" data-start-typing-topic="${all[0] ? all[0].id : ''}" class="relative z-10 px-5 py-2.5 rounded-2xl bg-white hover:bg-sky-50 border border-sky-200 text-slate-900 text-sm font-extrabold shadow-xs flex items-center gap-2 self-start lg:self-center shrink-0 transition-transform hover:-translate-y-0.5">
            Bắt đầu ${isZh ? 'HSK 1' : 'A1'} <i data-lucide="arrow-right" class="w-4 h-4 text-sky-600"></i>
          </button>
        </div>

        <!-- 2. Graph-Paper "Lộ trình đề xuất." -->
        <div class="aio-grid-paper rounded-3xl border border-[#E5DEC9] p-5 space-y-3.5 shadow-2xs">
          <div class="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <span class="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><i data-lucide="compass" class="w-3.5 h-3.5"></i></span>
            Lộ trình đề xuất (${isZh ? 'Tiếng Trung HSK' : 'Tiếng Anh CEFR'}).
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${levels.length} gap-3">
            ${levels.map((lv, i) => `
              <button type="button" data-start-typing-topic="${all[Math.min(i * 2, all.length - 1)]?.id || ''}" class="text-left p-4 rounded-2xl bg-white border transition-all ${lv.active ? 'border-sky-400 ring-2 ring-sky-100 shadow-xs' : 'border-[#E6DEC9] hover:border-sky-300'}">
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="px-2.5 py-1 rounded-full text-xs font-extrabold ${lv.active ? (isZh ? 'bg-rose-600 text-white' : 'bg-sky-600 text-white') : 'bg-sky-100 text-sky-800'}">${lv.code}</span>
                  <div class="flex-1 border-t-2 border-dashed border-sky-200 mx-1"></div>
                  <span class="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500"><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></span>
                </div>
                <div class="font-extrabold text-sm text-slate-900">${lv.title}</div>
                <div class="text-xs text-slate-500 mt-0.5">${lv.sub}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. Warm Honey Panel: "Tình huống đời sống." -->
        <div class="aio-honey-panel rounded-3xl p-5 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <span class="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center"><i data-lucide="sun" class="w-3.5 h-3.5"></i></span>
              Tình huống đời sống.
            </div>
            <span class="text-xs font-bold text-amber-900/70">${life.length} bộ</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            ${life.map(t => `
              <button type="button" data-start-typing-topic="${t.id}" class="p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-[#E5D6B5] shadow-2xs text-left flex items-center gap-3 transition-all hover:-translate-y-0.5">
                <div class="w-10 h-10 rounded-xl bg-[#FAF4E6] flex items-center justify-center text-xl shrink-0">${t.icon}</div>
                <div class="min-w-0">
                  <div class="font-extrabold text-xs sm:text-sm text-slate-900 truncate">${t.title}</div>
                  <div class="text-[11px] font-semibold text-slate-500">${t.count} câu · ${t.level}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 4. Warm Peach Panel: "Môi trường công việc & Học tập." -->
        ${work.length ? `
          <div class="aio-peach-panel rounded-3xl p-5 space-y-3.5 shadow-2xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <span class="w-6 h-6 rounded-lg bg-orange-200/80 text-orange-800 flex items-center justify-center"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i></span>
                Môi trường công việc &amp; Học tập.
              </div>
              <span class="text-xs font-bold text-orange-900/70">${work.length} bộ</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              ${work.map(t => `
                <button type="button" data-start-typing-topic="${t.id}" class="p-3.5 rounded-2xl bg-white hover:bg-orange-50/50 border border-[#EBCFB9] shadow-2xs text-left flex items-center gap-3 transition-all hover:-translate-y-0.5">
                  <div class="w-10 h-10 rounded-xl bg-[#FDF1E8] flex items-center justify-center text-xl shrink-0">${t.icon}</div>
                  <div class="min-w-0">
                    <div class="font-extrabold text-xs sm:text-sm text-slate-900 truncate">${t.title}</div>
                    <div class="text-[11px] font-semibold text-slate-500">${t.count} câu · ${t.level}</div>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
      refreshIcons();
    }

    // ==================== CORODOMO-STYLE LIVE-SYNC VIDEO STUDIO (YT IFRAME API + REAL-TIME SUBTITLES) ====================
    const VIDEO_STUDIO_LESSONS = [
      {
        id: 'vid-en-1',
        lang: 'en',
        level: 'A0–A1 · Giao tiếp hằng ngày',
        title: 'Small Talk & Chào hỏi tự nhiên (Everyday English)',
        youtubeId: 'S_8vM_vE7s8',
        duration: '03:15',
        lines: [
          { start: 0, end: 5, text: 'Good morning! How is everything going today?', ipa: '/ɡʊd ˈmɔːrnɪŋ haʊ ɪz ˈevriθɪŋ ˈɡoʊɪŋ təˈdeɪ/', vi: 'Chào buổi sáng! Hôm nay mọi việc thế nào rồi?' },
          { start: 5, end: 10, text: 'Pretty good, thanks! I just grabbed a cup of coffee.', ipa: '/ˈprɪti ɡʊd θæŋks aɪ dʒʌst ɡræbd ə kʌp əv ˈkɔːfi/', vi: 'Khá ổn, cảm ơn! Mình vừa làm một ly cà phê.' },
          { start: 10, end: 16, text: 'Sounds great! Are you busy with work this morning?', ipa: '/saʊndz ɡreɪt ɑːr juː ˈbɪzi wɪð wɜːrk ðɪs ˈmɔːrnɪŋ/', vi: 'Nghe tuyệt đấy! Sáng nay bạn có bận việc không?' },
          { start: 16, end: 22, text: 'A little bit, I have a short meeting at ten.', ipa: '/ə ˈlɪtl bɪt aɪ hæv ə ʃɔːrt ˈmiːtɪŋ æt ten/', vi: 'Hơi bận một chút, mình có cuộc họp ngắn lúc 10 giờ.' },
          { start: 22, end: 28, text: 'No worries, let us catch up after lunch!', ipa: '/noʊ ˈwɜːriz let ʌs kætʃ ʌp ˈæftər lʌntʃ/', vi: 'Không sao đâu, trưa ăn xong mình nói chuyện tiếp nhé!' }
        ],
        vocab: { morning: 'buổi sáng', everything: 'mọi thứ', pretty: 'khá là', coffee: 'cà phê', busy: 'bận rộn', meeting: 'cuộc họp', lunch: 'bữa trưa' }
      },
      {
        id: 'vid-en-2',
        lang: 'en',
        level: 'A1 · Đời sống & Quán cà phê',
        title: 'Gọi đồ uống ở quán cà phê như người bản xứ',
        youtubeId: '2i2M6Y58m6g',
        duration: '02:40',
        lines: [
          { start: 0, end: 5, text: 'Hi there! What can I get started for you today?', ipa: '/haɪ ðer wʌt kæn aɪ ɡet ˈstɑːrtɪd fɔːr juː təˈdeɪ/', vi: 'Chào bạn! Hôm nay bạn muốn gọi món gì nào?' },
          { start: 5, end: 11, text: 'Can I have an iced latte with less sugar, please?', ipa: '/kæn aɪ hæv æn aɪst ˈlɑːteɪ wɪð les ˈʃʊɡər pliːz/', vi: 'Cho mình một ly latte đá ít đường nhé?' },
          { start: 11, end: 17, text: 'Sure thing! Would you like a medium or a large?', ipa: '/ʃʊr θɪŋ wʊd juː laɪk ə ˈmiːdiəm ɔːr ə lɑːrdʒ/', vi: 'Chắc chắn rồi! Bạn lấy cỡ vừa hay cỡ lớn?' },
          { start: 17, end: 23, text: 'Medium is fine. How much does that come to?', ipa: '/ˈmiːdiəm ɪz faɪn haʊ mʌtʃ dʌz ðæt kʌm tuː/', vi: 'Cỡ vừa là được. Tổng cộng hết bao nhiêu vậy?' },
          { start: 23, end: 29, text: 'That will be four dollars and fifty cents.', ipa: '/ðæt wɪl biː fɔːr ˈdɑːlərz ænd ˈfɪfti sents/', vi: 'Của bạn hết 4 đô la 50 xu ạ.' }
        ],
        vocab: { started: 'bắt đầu gọi món', iced: 'có đá', sugar: 'đường', medium: 'cỡ vừa', large: 'cỡ lớn', dollars: 'đô la' }
      },
      {
        id: 'vid-zh-1',
        lang: 'zh',
        level: 'HSK 1 · Chào hỏi & Làm quen',
        title: 'Hội thoại Tiếng Trung thực tế: Chào hỏi & Giới thiệu',
        youtubeId: 'McZW0iZ0Z8A',
        duration: '02:50',
        lines: [
          { start: 0, end: 5, text: '你好！请问你贵姓？', ipa: 'Nǐ hǎo! Qǐngwèn nǐ guìxìng?', vi: 'Xin chào! Xin hỏi bạn họ gì?' },
          { start: 5, end: 11, text: '我姓陈，叫小明。很高兴认识你！', ipa: 'Wǒ xìng Chén, jiào Xiǎomíng. Hěn gāoxìng rènshi nǐ!', vi: 'Tôi họ Trần, tên là Tiểu Minh. Rất vui được quen bạn!' },
          { start: 11, end: 17, text: '你是越南人吗？你的中文真好！', ipa: 'Nǐ shì Yuènán rén ma? Nǐ de Zhōngwén zhēn hǎo!', vi: 'Bạn là người Việt Nam phải không? Tiếng Trung của bạn giỏi quá!' },
          { start: 17, end: 23, text: '哪里哪里，我还在学习呢。', ipa: 'Nǎlǐ nǎlǐ, wǒ hái zài xuéxí ne.', vi: 'Đâu có đâu có, mình vẫn đang học thôi ạ.' },
          { start: 23, end: 29, text: '以后我们多用中文聊天吧！', ipa: 'Yǐhòu wǒmen duō yòng Zhōngwén liáotiān ba!', vi: 'Sau này chúng mình nói chuyện bằng tiếng Trung nhiều hơn nhé!' }
        ],
        vocab: { '你好': 'xin chào (nǐ hǎo)', '请问': 'xin hỏi (qǐngwèn)', '高兴': 'vui vẻ (gāoxìng)', '认识': 'làm quen (rènshi)', '学习': 'học tập (xuéxí)', '聊天': 'trò chuyện (liáotiān)' }
      },
      {
        id: 'vid-zh-2',
        lang: 'zh',
        level: 'HSK 1 · Trà sữa & Ẩm thực',
        title: 'Đi quán trà sữa & Gọi món bằng Tiếng Trung',
        youtubeId: 'U9gN1yC8x9w',
        duration: '03:10',
        lines: [
          { start: 0, end: 5, text: '欢迎光临！请问您想喝点什么？', ipa: 'Huānyíng guānglín! Qǐngwèn nín xiǎng hē diǎn shénme?', vi: 'Chào mừng quý khách! Xin hỏi bạn muốn uống gì?' },
          { start: 5, end: 11, text: '我要一杯珍珠奶茶，少糖少冰。', ipa: 'Wǒ yào yì bēi zhēnzhū nǎichá, shǎo táng shǎo bīng.', vi: 'Cho tôi một ly trà sữa trân châu, ít đường ít đá.' },
          { start: 11, end: 17, text: '好的，大杯还是中杯？', ipa: 'Hǎo de, dà bēi háishi zhōng bēi?', vi: 'Vâng, ly lớn hay ly vừa ạ?' },
          { start: 17, end: 23, text: '中杯就可以了。一共多少钱？', ipa: 'Zhōng bēi jiù kěyǐ le. Yígòng duōshao qián?', vi: 'Ly vừa là được rồi. Tổng cộng bao nhiêu tiền?' },
          { start: 23, end: 29, text: '一共二十块钱，请这里扫码付款。', ipa: 'Yígòng èrshí kuài qián, qǐng zhèlǐ sǎomǎ fùkuǎn.', vi: 'Tổng cộng 20 tệ, mời bạn quét mã thanh toán ở đây.' }
        ],
        vocab: { '奶茶': 'trà sữa (nǎichá)', '少糖': 'ít đường (shǎo táng)', '少冰': 'ít đá (shǎo bīng)', '一共': 'tổng cộng (yígòng)', '多少钱': 'bao nhiêu tiền (duōshao qián)' }
      }
    ];

    let _ytPlayer = null;
    let _ytMountedVideoId = null;
    let _ytSyncTimer = null;

    function formatSec(sec) {
      const s = Math.max(0, Math.floor(sec || 0));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    }

    function parseSrtOrVtt(raw) {
      const blocks = String(raw || '').replace(/\r/g, '').split(/\n\s*\n/);
      const toSec = (ts) => {
        const parts = ts.replace(',', '.').trim().split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
      };
      const out = [];
      blocks.forEach(b => {
        const lines = b.split('\n').map(x => x.trim()).filter(Boolean);
        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx !== -1) {
          const [sStr, eStr] = lines[timeLineIdx].split('-->');
          const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
          if (text) out.push({ start: toSec(sStr), end: toSec(eStr.split(' ')[0]), text, ipa: '', vi: '' });
        }
      });
      return out;
    }

    function getActiveVideoData() {
      const langFilter = ui.videoLangFilter || 'all';
      const filtered = VIDEO_STUDIO_LESSONS.filter(v => langFilter === 'all' || v.lang === langFilter);
      const base = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || filtered[0] || VIDEO_STUDIO_LESSONS[0];
      ui.videoId = base.id;
      const isCustom = Boolean(ui.customYoutubeId || ui.localVideoUrl);
      const lines = (ui.customVideoLines && ui.customVideoLines.length)
        ? ui.customVideoLines
        : (isCustom ? [] : base.lines);
      const lang = ui.customVideoLang || base.lang;
      const youtubeId = ui.customYoutubeId || base.youtubeId;
      return { base, filtered, lines, lang, youtubeId };
    }

    function ensureYouTubeApiLoaded(cb) {
      if (window.YT && window.YT.Player) { cb(); return; }
      window._ytReadyQueue = window._ytReadyQueue || [];
      window._ytReadyQueue.push(cb);
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => {
          (window._ytReadyQueue || []).forEach(fn => { try { fn(); } catch {} });
          window._ytReadyQueue = [];
        };
      }
    }

    function updateLiveCaptionUI(currentSec) {
      const { lines, lang } = getActiveVideoData();
      if (!lines || !lines.length) return;
      let activeIdx = lines.findIndex(l => currentSec >= (l.start || 0) && currentSec < (l.end || (l.start + 5)));
      if (activeIdx === -1) {
        for (let i = lines.length - 1; i >= 0; i--) {
          if (currentSec >= (lines[i].start || 0)) { activeIdx = i; break; }
        }
      }
      if (activeIdx === -1) activeIdx = 0;

      // Loop current line if Loop mode is enabled
      if (ui.videoLoopActive && _ytPlayer && typeof _ytPlayer.seekTo === 'function') {
        const loopLine = lines[ui.videoLineIdx || 0];
        if (loopLine && currentSec >= (loopLine.end || loopLine.start + 5)) {
          _ytPlayer.seekTo(loopLine.start || 0, true);
          return;
        }
      }

      if (activeIdx !== ui.videoLineIdx) {
        ui.videoLineIdx = activeIdx;
        const ln = lines[activeIdx];
        const bar = document.getElementById('vid-live-caption-bar');
        if (bar && ln) {
          bar.innerHTML = `
            <div class="text-sm sm:text-base font-extrabold text-white leading-snug">${ln.text}</div>
            ${ui.videoShowIpa !== false && ln.ipa ? `<div class="text-xs font-mono text-emerald-300 mt-0.5">${ln.ipa}</div>` : ''}
            ${ui.videoShowVi !== false && ln.vi ? `<div class="text-xs text-slate-300 mt-0.5">${ln.vi}</div>` : ''}
          `;
        }
        // Highlight & auto-scroll active subtitle row in right panel
        document.querySelectorAll('[data-vid-row]').forEach(row => {
          const rIdx = parseInt(row.dataset.vidRow, 10);
          const isCur = rIdx === activeIdx;
          row.classList.toggle('bg-emerald-50', isCur);
          row.classList.toggle('border-emerald-400', isCur);
          row.classList.toggle('ring-1', isCur);
          row.classList.toggle('ring-emerald-200', isCur);
          row.classList.toggle('bg-white', !isCur);
          row.classList.toggle('border-slate-200/80', !isCur);
          if (isCur && ui.videoMode === 'subs') {
            try { row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {}
          }
        });
      }
    }

    function mountYouTubeLivePlayer(videoId) {
      const host = document.getElementById('yt-player-host');
      if (!host) return;
      // Attach YT.Player directly to the already-visible <iframe> so the video is NEVER a black box!
      ensureYouTubeApiLoaded(() => {
        const elHost = document.getElementById('yt-player-host');
        if (!elHost) return;
        _ytMountedVideoId = videoId;
        try {
          _ytPlayer = new YT.Player('yt-player-host', {
            events: {
              onStateChange: (ev) => {
                if (ev.data === YT.PlayerState.PLAYING) {
                  if (_ytSyncTimer) clearInterval(_ytSyncTimer);
                  _ytSyncTimer = setInterval(() => {
                    if (state.mainNav !== 'videos' || !_ytPlayer || typeof _ytPlayer.getCurrentTime !== 'function') {
                      clearInterval(_ytSyncTimer);
                      return;
                    }
                    updateLiveCaptionUI(_ytPlayer.getCurrentTime());
                  }, 250);
                }
              }
            }
          });
        } catch (e) {}
      });
    }

    async function fetchYoutubeTranscript(videoId, startSec = 0, append = false) {
      if (!window.location || !window.location.protocol.startsWith('http')) {
        ui.videoLastError = 'Bản xem trước (Canvas) không có máy chủ Vercel. Hãy dùng trên web thật của bạn để chạy Phụ đề AI!';
        renderVideoStudioPage();
        return;
      }
      ui.videoLoadingSubs = true;
      ui.videoLastError = '';
      showToast(append ? 'Phụ đề AI đang dịch tiếp 45 giây tiếp theo...' : 'Phụ đề AI đang nghe & dịch 45 giây đầu (khoảng 5–10 giây)...');
      renderVideoStudioPage();
      try {
        const ctrl = new AbortController();
        const tId = setTimeout(() => ctrl.abort(), 65000);
        const res = await fetch(`/api/transcript?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(ui.customVideoLang || 'en')}&start=${startSec}`, { signal: ctrl.signal }).finally(() => clearTimeout(tId));
        const rawTxt = await res.text();
        let data = {};
        try { data = JSON.parse(rawTxt); } catch { data = { error: `HTTP ${res.status}: ${rawTxt.slice(0, 180)}` }; }
        if (!res.ok) {
          ui.videoLastError = data.error || `Lỗi máy chủ (HTTP ${res.status}).`;
          showToast(ui.videoLastError);
          return;
        }
        if (data && Array.isArray(data.lines) && data.lines.length) {
          ui.customVideoLines = append && ui.customVideoLines ? [...ui.customVideoLines, ...data.lines] : data.lines;
          ui.customVideoLang = data.lang || 'en';
          ui.videoNextStart = data.nextStart || (startSec + 45);
          if (!append) ui.videoLineIdx = 0;
          showToast(`Phụ đề AI đã dịch xong ${data.lines.length} dòng chạy đồng bộ!`);
        } else {
          ui.videoLastError = 'AI chưa nghe thấy lời thoại trong đoạn video này.';
        }
      } catch (err) {
        ui.videoLastError = 'Không kết nối được tới /api/transcript: ' + String(err.message || err);
      } finally {
        ui.videoLoadingSubs = false;
        renderVideoStudioPage();
      }
    }

    function extractYoutubeId(urlOrId) {
      const s = (urlOrId || '').trim();
      if (!s) return '';
      if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
      const m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return m ? m[1] : '';
    }

    function scoreSentenceMatch(target, spoken, isZh) {
      if (isZh) {
        const cleanT = (target || '').replace(/[^\u4e00-\u9fff]/g, '');
        const cleanS = (spoken || '').replace(/[^\u4e00-\u9fff]/g, '');
        if (!cleanT) return { pct: 0, tokens: [] };
        let hits = 0;
        const tokens = [...cleanT].map(ch => {
          const ok = cleanS.includes(ch);
          if (ok) hits++;
          return { word: ch, ok };
        });
        return { pct: Math.round((hits / cleanT.length) * 100), tokens };
      }
      const norm = (str) => (str || '').toLowerCase().replace(/[^a-z0-9'\s]/g, '').split(/\s+/).filter(Boolean);
      const tWords = norm(target);
      const sWords = norm(spoken);
      if (!tWords.length) return { pct: 0, tokens: [] };
      let hits = 0;
      const tokens = tWords.map(w => {
        const ok = sWords.includes(w);
        if (ok) hits++;
        return { word: w, ok };
      });
      return { pct: Math.round((hits / tWords.length) * 100), tokens };
    }

    function renderVideoStudioPage() {
      if (window.EngVideo36) { window.EngVideo36.render(ui.videoLangFilter || 'all'); return; }
      const el = document.getElementById('page-videos');
      if (!el) return;

      const { base: activeVideo, filtered, lines, lang, youtubeId: activeYtId } = getActiveVideoData();
      const isZh = lang === 'zh';
      const mode = ui.videoMode || 'subs';
      const lineIdx = Math.max(0, Math.min(ui.videoLineIdx || 0, lines.length - 1));
      ui.videoLineIdx = lineIdx;
      const curLine = lines[lineIdx] || { start: 0, end: 5, text: '', ipa: '', vi: '' };
      const speakAttrFor = (txt) => isZh
        ? `data-speak-zh="${String(txt || '').replace(/"/g, '&quot;')}"`
        : `data-speak="${String(txt || '').replace(/"/g, '&quot;')}"`;

      el.innerHTML = `
        <!-- Corodomo Emerald-Green Banner: "Biến mọi video yêu thích thành bài học." -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900">Học qua video</h1>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold">
              <button type="button" data-video-lang="all" class="px-3.5 py-1.5 rounded-full border transition-all ${(ui.videoLangFilter || 'all') === 'all' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}">Thư viện (${VIDEO_STUDIO_LESSONS.length})</button>
              <button type="button" data-video-lang="en" class="px-3.5 py-1.5 rounded-full border transition-all ${ui.videoLangFilter === 'en' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}">Tiếng Anh</button>
              <button type="button" data-video-lang="zh" class="px-3.5 py-1.5 rounded-full border transition-all ${ui.videoLangFilter === 'zh' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}">Tiếng Trung</button>
            </div>
          </div>

          <div class="coro-green-banner rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">Biến mọi video yêu thích thành bài học.</div>

            <div>
              <!-- 3 Source Tabs: YouTube | Tải lên | Studio -->
              <div class="inline-flex items-end gap-1">
                <button type="button" data-vid-src-tab="youtube" class="px-4 py-2 rounded-t-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${(ui.videoSrcTab || 'youtube') === 'youtube' ? 'bg-white text-rose-600' : 'bg-white/80 text-slate-600 hover:bg-white'}">
                  <i data-lucide="youtube" class="w-4 h-4"></i> YouTube
                </button>
                <button type="button" data-vid-src-tab="upload" class="px-4 py-2 rounded-t-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${ui.videoSrcTab === 'upload' ? 'bg-white text-emerald-700' : 'bg-white/80 text-slate-600 hover:bg-white'}">
                  <i data-lucide="upload" class="w-4 h-4"></i> Tải lên
                </button>
                <button type="button" data-vid-src-tab="studio" class="px-4 py-2 rounded-t-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${ui.videoSrcTab === 'studio' ? 'bg-white text-indigo-700' : 'bg-white/80 text-slate-600 hover:bg-white'}">
                  <i data-lucide="clapperboard" class="w-4 h-4"></i> Studio
                </button>
              </div>

              <!-- White Action Bar -->
              <div class="bg-white rounded-b-2xl rounded-tr-2xl p-3.5 sm:p-4 shadow-xs">
                ${(ui.videoSrcTab || 'youtube') === 'youtube' ? `
                  <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-end">
                    <div class="lg:col-span-6 space-y-1">
                      <label class="text-[11px] font-bold text-slate-500">Link YouTube</label>
                      <input type="text" id="custom-yt-input" value="${ui.customYoutubeUrl || ''}" placeholder="Dán link YouTube bạn muốn học..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div class="lg:col-span-2 space-y-1">
                      <label class="text-[11px] font-bold text-slate-500">Ngôn ngữ video</label>
                      <select id="vid-lang-select" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none">
                        <option value="en" ${(ui.customVideoLang || 'en') === 'en' ? 'selected' : ''}>Tiếng Anh</option>
                        <option value="zh" ${ui.customVideoLang === 'zh' ? 'selected' : ''}>Tiếng Trung</option>
                      </select>
                    </div>
                    <div class="lg:col-span-2 space-y-1">
                      <label class="text-[11px] font-bold text-slate-500">Phụ đề</label>
                      <select id="vid-sub-mode-select" class="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs font-extrabold text-emerald-800 outline-none">
                        <option value="ai" ${(ui.videoSubMode || 'ai') === 'ai' ? 'selected' : ''}>✨ Phụ đề AI</option>
                        <option value="srt" ${ui.videoSubMode === 'srt' ? 'selected' : ''}>📄 Nạp .SRT/.VTT</option>
                      </select>
                      <input type="file" id="upload-srt-input" accept=".srt,.vtt,.txt" class="hidden" />
                    </div>
                    <div class="lg:col-span-2">
                      <button type="button" id="load-custom-yt-btn" class="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs">
                        <i data-lucide="video" class="w-4 h-4"></i> ${ui.videoLoadingSubs ? 'Đang tạo...' : 'Tạo video'}
                      </button>
                    </div>
                  </div>
                ` : ''}

                ${ui.videoSrcTab === 'upload' ? `
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <label for="upload-local-video-input" class="cursor-pointer flex-1 px-4 py-3 rounded-xl border-2 border-dashed border-emerald-300 hover:bg-emerald-50/50 text-xs sm:text-sm font-bold text-emerald-800 text-center">
                      ${ui.localVideoName ? `✓ Đã chọn: ${ui.localVideoName} (Bấm để đổi video khác)` : '📁 Bấm để chọn video từ máy (.MP4, .WebM, .MOV)'}
                    </label>
                    <input type="file" id="upload-local-video-input" accept="video/*" class="hidden" />
                    <label for="upload-srt-input" class="cursor-pointer px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center shrink-0">
                      + Nạp phụ đề .SRT/.VTT
                    </label>
                    <input type="file" id="upload-srt-input" accept=".srt,.vtt,.txt" class="hidden" />
                  </div>
                ` : ''}

                ${ui.videoSrcTab === 'studio' ? `
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>Chọn ngay các bài video mẫu Anh &amp; Trung đã gắn sẵn phụ đề song ngữ + IPA/Pinyin bên dưới.</span>
                    <button type="button" id="reset-custom-yt-btn" class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Mở video mẫu</button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left Column: Video Player + Corodomo Floating Live Caption Bar + Library -->
          <div class="lg:col-span-7 space-y-4">
            <div class="bg-slate-950 rounded-3xl overflow-hidden shadow-sm border border-slate-800">
              <div class="aspect-video w-full bg-black relative">
                ${ui.localVideoUrl
                  ? `<video id="local-video-player" src="${ui.localVideoUrl}" controls class="w-full h-full"></video>`
                  : `<iframe id="yt-player-host" class="w-full h-full" src="https://www.youtube.com/embed/${activeYtId}?enablejsapi=1&rel=0&modestbranding=1" title="${activeVideo.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                }
              </div>
              <!-- Corodomo-style Live Floating Subtitle Bar directly under video -->
              <div class="px-4 py-3.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
                <div id="vid-live-caption-bar" class="min-w-0 flex-1 text-center">
                  <div class="text-sm sm:text-base font-extrabold text-white leading-snug">${curLine.text || 'Bấm phát video để chữ tự chạy đồng bộ...'}</div>
                  ${ui.videoShowIpa !== false && curLine.ipa ? `<div class="text-xs font-mono text-emerald-300 mt-0.5">${curLine.ipa}</div>` : ''}
                  ${ui.videoShowVi !== false && curLine.vi ? `<div class="text-xs text-slate-300 mt-0.5">${curLine.vi}</div>` : ''}
                </div>
                <button type="button" id="vid-toggle-loop-btn" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border ${ui.videoLoopActive ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}" title="Lặp đi lặp lại câu đang phát">
                  ${ui.videoLoopActive ? '🔁 Đang lặp câu' : '🔁 Lặp câu'}
                </button>
              </div>
            </div>

            <!-- Video Library -->
            <div class="bg-white rounded-3xl border border-[#E6DEC9] shadow-2xs p-4 space-y-2.5">
              <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Thư viện Video có sẵn phụ đề đồng bộ</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${filtered.map(v => {
                  const active = v.id === activeVideo.id && !ui.customYoutubeId;
                  return `
                    <button type="button" data-select-video="${v.id}" class="w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${active ? 'bg-emerald-600 text-white border-transparent shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'}">
                      <div class="min-w-0">
                        <div class="text-[10px] font-bold ${active ? 'text-emerald-100' : (v.lang === 'zh' ? 'text-rose-600' : 'text-indigo-600')}">${v.lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'} · ${v.level}</div>
                        <div class="font-bold text-xs truncate">${v.title}</div>
                      </div>
                      <span class="text-[10px] font-bold shrink-0 ${active ? 'text-emerald-100' : 'text-slate-400'}">${v.duration}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Corodomo Live Auto-Scrolling Subtitle Panel & Practice Modes -->
          <div class="lg:col-span-5 bg-white rounded-3xl border border-[#E6DEC9] shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div class="bg-[#F6F2E9] p-1 rounded-xl inline-flex flex-wrap gap-1 text-xs font-bold">
                <button type="button" data-video-mode="subs" class="px-2.5 py-1.5 rounded-lg ${mode === 'subs' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}">Phụ đề (${lines.length})</button>
                <button type="button" data-video-mode="shadowing" class="px-2.5 py-1.5 rounded-lg ${mode === 'shadowing' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'}">Shadowing</button>
                <button type="button" data-video-mode="dictation" class="px-2.5 py-1.5 rounded-lg ${mode === 'dictation' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'}">Nghe chép</button>
                <button type="button" data-video-mode="quiz" class="px-2.5 py-1.5 rounded-lg ${mode === 'quiz' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600'}">Quiz</button>
              </div>

              <div class="flex items-center gap-1">
                <button type="button" id="vid-toggle-ipa" class="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold ${ui.videoShowIpa !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-slate-500'}">${isZh ? 'Pinyin' : 'IPA'}</button>
                <button type="button" id="vid-toggle-vi" class="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold ${ui.videoShowVi !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-slate-500'}">Dịch</button>
              </div>
            </div>

            ${mode === 'subs' ? `
              ${!lines.length ? `
                <div class="p-6 rounded-2xl ${ui.videoLastError ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'} border text-center space-y-2.5">
                  <div class="text-sm font-extrabold ${ui.videoLastError ? 'text-rose-900' : 'text-emerald-900'}">
                    ${ui.videoLoadingSubs ? '✨ Phụ đề AI (Gemini 3.8 Flash) đang nghe &amp; dịch video...' : (ui.videoLastError ? 'Phụ đề AI gặp sự cố:' : 'Video đã sẵn sàng cho Phụ đề AI')}
                  </div>
                  <p class="text-xs ${ui.videoLastError ? 'text-rose-800' : 'text-emerald-800'} leading-relaxed break-words">
                    ${ui.videoLoadingSubs ? 'AI đang nghe và dịch song ngữ 30 giây đầu tiên (có thể mất 15–35 giây)...' : (ui.videoLastError || 'Bấm nút <strong>Tạo video</strong> màu xanh bên trên để Gemini AI tự nghe &amp; tạo phụ đề song ngữ chạy khớp từng giây.')}
                  </p>
                  ${!ui.videoLoadingSubs ? `
                    <div class="pt-2 border-t border-slate-200/70 text-left space-y-2">
                      <div class="text-[11px] font-extrabold text-slate-700">⚡ Cách siêu nhanh (2 giây) cho mọi video dài:</div>
                      <textarea id="vid-paste-transcript" rows="3" placeholder="Dán lời thoại copy từ mục 'Hiện bản chép lời' trên YouTube vào đây (ví dụ:&#10;0:00&#10;Xin chào các bạn...)" class="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500">${ui.videoPasteDraft || ''}</textarea>
                      <button type="button" id="vid-ai-translate-paste-btn" class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold">✨ Gemini AI dịch song ngữ ngay (2 giây)</button>
                    </div>
                  ` : ''}
                </div>
              ` : `
              <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                ${lines.map((ln, idx) => `
                  <div data-vid-row="${idx}" data-vid-seek="${ln.start || 0}" class="cursor-pointer p-3 rounded-2xl border transition-all ${idx === lineIdx ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-200' : 'bg-white border-slate-200/80 hover:bg-slate-50'} space-y-1">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-start gap-2 min-w-0">
                        <span class="mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-500 shrink-0">${formatSec(ln.start || 0)}</span>
                        <div class="text-xs sm:text-sm font-bold text-slate-900 leading-snug">${ln.text}</div>
                      </div>
                      <button type="button" ${speakAttrFor(ln.text)} class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0" title="Đọc chậm câu này">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                    ${ui.videoShowIpa !== false && ln.ipa ? `<div class="text-[11px] font-mono pl-11 ${isZh ? 'text-rose-600' : 'text-indigo-600'}">${ln.ipa}</div>` : ''}
                    ${ui.videoShowVi !== false && ln.vi ? `<div class="text-xs text-slate-600 pl-11">${ln.vi}</div>` : ''}
                  </div>
                `).join('')}
                ${ui.customYoutubeId && ui.videoNextStart ? `
                  <button type="button" id="vid-load-more-ai-btn" class="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                    ${ui.videoLoadingSubs ? 'Đang dịch tiếp...' : `✨ Dịch tiếp 45 giây tiếp theo (từ ${formatSec(ui.videoNextStart)}) →`}
                  </button>
                ` : ''}
              </div>`}
            ` : ''}

            ${mode === 'shadowing' ? `
              <div class="space-y-3.5">
                <div class="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Câu ${lineIdx + 1} / ${lines.length} (${formatSec(curLine.start || 0)})</span>
                  <div class="flex items-center gap-1.5">
                    <button type="button" data-vid-line-nav="-1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">← Trước</button>
                    <button type="button" data-vid-line-nav="1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Sau →</button>
                  </div>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div class="text-base font-extrabold text-slate-900">${curLine.text}</div>
                  ${curLine.ipa ? `<div class="text-xs font-mono text-indigo-600">${curLine.ipa}</div>` : ''}
                  ${curLine.vi ? `<div class="text-xs text-slate-600">${curLine.vi}</div>` : ''}
                  <div class="pt-2 flex flex-wrap gap-2">
                    <button type="button" ${speakAttrFor(curLine.text)} class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4 text-indigo-600"></i> Nghe mẫu</button>
                    <button type="button" id="vid-shadow-mic-btn" class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"><i data-lucide="mic" class="w-4 h-4"></i> Nói đuổi (Micro)</button>
                  </div>
                </div>
                ${ui.videoShadowResult ? `
                  <div class="p-3.5 rounded-2xl border ${ui.videoShadowResult.pct >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} space-y-2">
                    <div class="text-xs font-extrabold">Độ khớp từng từ: ${ui.videoShadowResult.pct}%</div>
                    <div class="flex flex-wrap gap-1.5">${ui.videoShadowResult.tokens.map(t => `<span class="px-2 py-0.5 rounded text-xs font-bold ${t.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">${t.word}</span>`).join('')}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${mode === 'dictation' ? `
              <div class="space-y-3.5">
                <div class="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Nghe chép câu ${lineIdx + 1} / ${lines.length}</span>
                  <div class="flex items-center gap-1.5">
                    <button type="button" data-vid-line-nav="-1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">← Trước</button>
                    <button type="button" data-vid-line-nav="1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Sau →</button>
                  </div>
                </div>
                <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
                  <button type="button" ${speakAttrFor(curLine.text)} class="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Phát câu</button>
                  <textarea id="vid-dictation-input" rows="2" placeholder="Gõ lại câu bạn nghe được..." class="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm outline-none">${ui.videoDictationInput || ''}</textarea>
                  <button type="button" id="vid-check-dictation-btn" class="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Kiểm tra chính tả</button>
                </div>
                ${ui.videoDictationResult ? `
                  <div class="p-3.5 rounded-2xl border bg-emerald-50 border-emerald-200 space-y-1.5">
                    <div class="text-xs font-extrabold">Kết quả: ${ui.videoDictationResult.pct}% · Đáp án: ${curLine.text}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${mode === 'quiz' ? (() => {
              const qLine = lines[lineIdx] || lines[0];
              const options = lines.slice(0, 4);
              if (!options.some(o => o.text === qLine.text)) options[0] = qLine;
              return `
                <div class="space-y-3.5">
                  <div class="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Quiz câu ${lineIdx + 1} / ${lines.length}</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" data-vid-line-nav="-1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">← Trước</button>
                      <button type="button" data-vid-line-nav="1" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Sau →</button>
                    </div>
                  </div>
                  <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 font-extrabold text-sm text-slate-900">${qLine.text}</div>
                  <div class="space-y-2">
                    ${options.map((opt, idx) => {
                      const picked = ui.videoQuizPicked;
                      const isCorrect = opt.text === qLine.text;
                      let cls = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                      if (picked !== null && picked !== undefined) {
                        if (isCorrect) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        else if (picked === idx) cls = 'bg-rose-50 border-rose-300 text-rose-800';
                      }
                      return `<button type="button" data-vid-quiz-pick="${idx}" data-vid-quiz-correct="${isCorrect ? '1' : '0'}" class="w-full text-left p-3 rounded-xl border text-xs transition-all ${cls}">${opt.vi || opt.text}</button>`;
                    }).join('')}
                  </div>
                </div>
              `;
            })() : ''}
          </div>
        </div>
      `;
      refreshIcons();
      if (ui.localVideoUrl) {
        const lv = document.getElementById('local-video-player');
        if (lv) lv.ontimeupdate = () => updateLiveCaptionUI(lv.currentTime);
      } else {
        mountYouTubeLivePlayer(activeYtId);
      }
    }

    function renderChinesePage() {
      const el = document.getElementById('page-chinese');
      if (!el) return;
      const learned = new Set(state.zhLearnedIds || []);
      const totalZh = ZH_TOPICS.reduce((a, t) => a + t.words.length, 0);
      const doneZh = ZH_TOPICS.reduce((a, t) => a + t.words.filter(w => learned.has(w.id)).length, 0);
      const pct = totalZh ? Math.round((doneZh / totalZh) * 100) : 0;
      const curTopic = ZH_TOPICS.find(t => t.id === ui.zhTopicId) || ZH_TOPICS[0];

      // Build active sub-view (list / flashcard / quiz)
      let mainContent = '';

      if (ui.zhMode === 'card') {
        const words = curTopic.words;
        const idx = Math.min(Math.max(0, ui.zhCardIdx || 0), words.length - 1);
        ui.zhCardIdx = idx;
        const w = words[idx];
        const isDone = learned.has(w.id);

        mainContent = `
          <div class="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5 text-center">
            <div class="flex items-center justify-between text-xs font-bold text-slate-400 pb-3 border-b border-slate-100">
              <span>THẺ ${idx + 1} / ${words.length} · ${curTopic.title}</span>
              <button type="button" id="zh-toggle-pinyin" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
                ${ui.zhShowPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
              </button>
            </div>

            <div class="py-4 space-y-3">
              <div class="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-wide">${w.hanzi}</div>
              ${ui.zhShowPinyin ? `<div class="text-xl font-bold text-rose-600">${w.pinyin}</div>` : '<div class="text-xs text-slate-400">(Đang ẩn Pinyin để luyện nhớ chữ Hán)</div>'}
              <div class="flex items-center justify-center gap-2 pt-2">
                <button type="button" data-speak-zh="${w.hanzi}" class="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <i data-lucide="volume-2" class="w-4 h-4"></i> Nghe tiếng Trung
                </button>
                <button type="button" data-speak-zh-slow="${w.hanzi}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold">
                  Đọc chậm
                </button>
              </div>
            </div>

            ${ui.zhFlipped ? `
              <div class="space-y-3 text-left bg-rose-50/50 border border-rose-100 rounded-2xl p-4 sm:p-5">
                <div class="text-center text-2xl font-extrabold text-emerald-700">${w.vi}</div>
                <div class="bg-white rounded-xl p-3.5 border border-rose-100 flex items-start justify-between gap-2">
                  <div class="space-y-0.5">
                    <div class="text-base font-bold text-slate-900">${w.exZh}</div>
                    <div class="text-xs font-semibold text-rose-600">${w.exPy}</div>
                    <div class="text-xs text-slate-600">${w.exVi}</div>
                  </div>
                  <button type="button" data-speak-zh="${w.exZh}" class="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                </div>
              </div>
            ` : `
              <button type="button" id="zh-flip-btn" class="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-xs">
                Lật xem nghĩa &amp; câu ví dụ
              </button>
            `}

            <div class="grid grid-cols-12 gap-2 pt-2 border-t border-slate-100">
              <button type="button" id="zh-prev-card" class="col-span-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold">Trước</button>
              <button type="button" data-zh-toggle="${w.id}" class="col-span-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold ${isDone ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}">
                ${isDone ? 'Đã thuộc từ này ✓' : 'Đánh dấu đã thuộc (+10 XP)'}
              </button>
              <button type="button" id="zh-next-card" class="col-span-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold">Tiếp</button>
            </div>
          </div>
        `;
      } else if (ui.zhMode === 'quiz') {
        const qList = ui.zhQuizItems || [];
        if (!qList.length) {
          mainContent = `<div class="bg-white rounded-2xl border p-8 text-center text-sm text-slate-500">Đang tạo bài trắc nghiệm...</div>`;
        } else if (ui.zhQuizDone) {
          mainContent = `
            <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="trophy" class="w-8 h-8"></i></div>
              <h3 class="text-2xl font-extrabold text-slate-900">Kết quả: ${ui.zhQuizScore}/${qList.length} câu đúng</h3>
              <p class="text-sm text-slate-600">Tuyệt vời! Bạn đang làm quen chữ Hán và Pinyin rất nhanh.</p>
              <button type="button" id="zh-restart-quiz" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">Làm lại bài kiểm tra</button>
            </div>
          `;
        } else {
          const q = qList[ui.zhQuizIdx];
          const picked = ui.zhQuizPicked;
          const hasPicked = typeof picked === 'number';
          mainContent = `
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>CÂU ${ui.zhQuizIdx + 1} / ${qList.length}</span>
                <button type="button" data-speak-zh="${q.word.hanzi}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Nghe lại</button>
              </div>
              <div class="text-center space-y-1 py-2">
                <div class="text-4xl font-extrabold text-slate-900">${q.word.hanzi}</div>
                <div class="text-base font-bold text-rose-600">${q.word.pinyin}</div>
                <div class="text-xs text-slate-500 pt-1">Chọn nghĩa tiếng Việt đúng:</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${q.options.map((opt, i) => {
                  let cls = 'bg-white border-slate-200 hover:border-rose-400 text-slate-800';
                  if (hasPicked) {
                    if (opt.isCorrect) cls = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                    else if (i === picked) cls = 'bg-rose-50 border-rose-400 text-rose-700';
                    else cls = 'bg-slate-50 border-slate-200 text-slate-400';
                  }
                  return `<button type="button" data-zh-opt="${i}" ${hasPicked ? 'disabled' : ''} class="p-4 rounded-xl border text-left text-sm font-semibold ${cls}">${opt.label}</button>`;
                }).join('')}
              </div>
              ${hasPicked ? `
                <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div class="text-xs sm:text-sm font-bold ${q.options[picked].isCorrect ? 'text-emerald-700' : 'text-rose-700'}">
                    ${q.options[picked].isCorrect ? 'Chính xác!' : 'Chưa đúng.'} ${q.word.hanzi} (${q.word.pinyin}) = ${q.word.vi}
                  </div>
                  <button type="button" id="zh-next-quiz" class="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold">${ui.zhQuizIdx + 1 === qList.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
                </div>
              ` : ''}
            </div>
          `;
        }
      } else {
        // Default: Word List + 4 Tones intro
        mainContent = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${curTopic.words.map(w => {
              const isDone = learned.has(w.id);
              return `
                <div class="bg-white rounded-2xl border ${isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'} p-4 space-y-2.5 hover:border-rose-200 transition-colors">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="flex items-baseline gap-2">
                        <span class="text-2xl font-extrabold text-slate-900">${w.hanzi}</span>
                        <span class="text-sm font-bold text-rose-600">${w.pinyin}</span>
                      </div>
                      <div class="text-sm font-bold text-emerald-700 mt-0.5">${w.vi}</div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" data-speak-zh="${w.hanzi}" title="Nghe tiếng Trung" class="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                      <button type="button" data-zh-toggle="${w.id}" title="Đánh dấu đã thuộc" class="p-2 rounded-lg border ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600'}"><i data-lucide="check" class="w-4 h-4"></i></button>
                    </div>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div class="font-bold text-slate-800">${w.exZh} <span class="font-medium text-rose-600">(${w.exPy})</span></div>
                      <div class="text-slate-500 mt-0.5">${w.exVi}</div>
                    </div>
                    <button type="button" data-speak-zh="${w.exZh}" class="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 shrink-0"><i data-lucide="play" class="w-3.5 h-3.5"></i></button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      el.innerHTML = `
        <!-- Chinese Hero Strip -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
                Tiếng Trung từ con số 0 · HSK 1 (Giản thể + Pinyin)
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Học Tiếng Trung Giao Tiếp (120 từ HSK 1–2 & Hội thoại)</h1>
              <p class="text-sm text-slate-600 mt-1">Làm quen 4 thanh điệu Pinyin, học 120 từ giao tiếp chia 12 chủ đề với giọng đọc bản xứ (zh-CN), Thẻ ghi nhớ ẩn/hiện Pinyin và trắc nghiệm nhanh.</p>
            </div>
            <div class="bg-slate-100 p-1 rounded-xl inline-flex text-xs font-bold shrink-0 self-start">
              <button type="button" data-zh-mode="list" class="px-3.5 py-2 rounded-lg ${ui.zhMode === 'list' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Danh sách từ</button>
              <button type="button" data-zh-mode="card" class="px-3.5 py-2 rounded-lg ${ui.zhMode === 'card' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Thẻ ghi nhớ</button>
              <button type="button" data-zh-mode="quiz" class="px-3.5 py-2 rounded-lg ${ui.zhMode === 'quiz' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Trắc nghiệm</button>
              <button type="button" data-zh-mode="dialogue" class="px-3.5 py-2 rounded-lg ${ui.zhMode === 'dialogue' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'}">Hội thoại</button>
            </div>
          </div>

          <!-- 4 Pinyin Tones Bar -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
            ${ZH_TONES.map(t => `
              <button type="button" data-speak-zh="${t.sample}" class="text-left p-3 rounded-xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100 transition-colors">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-rose-700">${t.mark}</span>
                  <i data-lucide="volume-2" class="w-3.5 h-3.5 text-rose-500"></i>
                </div>
                <div class="text-lg font-extrabold text-slate-900 mt-0.5">${t.sample} <span class="text-sm font-bold text-rose-600">${t.pinyin}</span> <span class="text-xs font-normal text-slate-500">(${t.meaning})</span></div>
                <div class="text-[11px] text-slate-500 mt-1 leading-snug">${t.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2-Column Chinese Topics -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside class="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
            <div class="space-y-1.5 pb-2 border-b border-slate-100">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-slate-600">Tiến độ Tiếng Trung</span>
                <span class="text-rose-600">${doneZh}/${totalZh} từ (${pct}%)</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all" style="width: ${pct}%"></div>
              </div>
            </div>
            <div class="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              ${ZH_TOPICS.map(t => {
                const active = t.id === curTopic.id;
                const dCount = t.words.filter(w => learned.has(w.id)).length;
                return `
                  <button type="button" data-zh-topic="${t.id}" class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${active ? 'bg-rose-600 border-rose-600 text-white shadow-xs' : 'bg-slate-50/70 border-transparent hover:border-rose-200 text-slate-800'}">
                    <div>
                      <div class="text-xs font-bold ${active ? 'text-rose-100' : 'text-rose-600'}">Chủ đề ${t.num}</div>
                      <div class="text-sm font-bold">${t.title}</div>
                      <div class="text-[11px] ${active ? 'text-rose-100' : 'text-slate-500'}">${dCount}/${t.words.length} từ đã thuộc</div>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 shrink-0"></i>
                  </button>
                `;
              }).join('')}
            </div>
          </aside>

          <div class="lg:col-span-8 space-y-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-extrabold text-slate-900">Chủ đề ${curTopic.num}: ${curTopic.title}</h2>
                <p class="text-xs text-slate-500">${curTopic.desc}</p>
              </div>
            </div>
            ${mainContent}
          </div>
        </div>
      `;
      refreshIcons();
    }

    function startChineseQuiz() {
      const curTopic = ZH_TOPICS.find(t => t.id === ui.zhTopicId) || ZH_TOPICS[0];
      const allZh = ZH_TOPICS.flatMap(t => t.words);
      const selected = shuffleArray(curTopic.words).slice(0, 6);
      ui.zhQuizItems = selected.map(w => {
        const others = shuffleArray(allZh.filter(x => x.id !== w.id)).slice(0, 3);
        return {
          word: w,
          options: shuffleArray([w, ...others]).map(x => ({ label: x.vi, isCorrect: x.id === w.id }))
        };
      });
      ui.zhQuizIdx = 0;
      ui.zhQuizPicked = null;
      ui.zhQuizScore = 0;
      ui.zhQuizDone = false;
    }


    // ==================== GOOGLE LOGIN & AUTO CLOUD SYNC (SUPABASE AUTH) ====================
    function handleCustomAvatarFile(file) {
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        showToast('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP...).');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
          const size = 160;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          if (!state.profile) state.profile = { name: '', email: '', customAvatar: '' };
          state.profile.customAvatar = dataUrl;
          saveState();
          syncHeaderStats();
          renderAuthPanel();
          showToast('Đã lưu ảnh nhận diện cá nhân của bạn!');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function renderAuthPanel() {
      const box = document.getElementById('auth-panel-box');
      if (!box) return;
      const configured = Boolean(sbClient);
      const customAvatar = (state.profile && state.profile.customAvatar) || '';
      const customName = (state.profile && state.profile.name) || '';

      const meta = (currentAuthUser && currentAuthUser.user_metadata) || {};
      const googleName = meta.full_name || meta.name || (currentAuthUser && currentAuthUser.email ? currentAuthUser.email.split('@')[0] : 'Nguyễn Thành');
      const displayName = (customName && customName.trim()) || googleName;
      const email = (currentAuthUser && currentAuthUser.email) || '';
      const avatar = customAvatar || meta.avatar_url || '';

      const personalCardHtml = `
        <div class="bg-white rounded-2xl border border-indigo-100 p-3.5 space-y-3">
          <div class="flex items-center gap-3.5">
            <div class="relative shrink-0">
              ${avatar
                ? `<img src="${avatar}" alt="${displayName}" class="w-14 h-14 rounded-full border-2 border-indigo-100 shadow-xs object-cover" />`
                : `<div class="w-14 h-14 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xl">${displayName.charAt(0).toUpperCase()}</div>`
              }
            </div>
            <div class="min-w-0 flex-1 space-y-1.5">
              <div class="text-xs font-bold uppercase tracking-wider text-indigo-700">Nhận diện cá nhân</div>
              <div class="flex flex-wrap items-center gap-2">
                <label for="custom-avatar-input" class="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors">
                  <i data-lucide="camera" class="w-3.5 h-3.5"></i> ${customAvatar ? 'Đổi ảnh của bạn' : 'Tải ảnh của bạn'}
                </label>
                <input type="file" id="custom-avatar-input" accept="image/*" class="hidden" />
                ${customAvatar ? `
                  <button type="button" id="remove-custom-avatar-btn" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors">
                    Xóa ảnh riêng
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="text" id="profile-name-input" value="${customName.replace(/"/g, '&quot;')}" placeholder="Tên hiển thị của bạn (ví dụ: Minh Anh)" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-semibold text-slate-800" />
            <button type="button" id="save-profile-name-btn" class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0">Lưu tên</button>
          </div>
        </div>
      `;

      if (currentAuthUser) {
        const syncLabel = cloudSyncStatus === 'saving'
          ? 'Đang tự động lưu lên mây...'
          : (cloudSyncStatus === 'synced' ? 'Đã tự động đồng bộ lên đám mây' : 'Sẵn sàng đồng bộ tự động');

        box.innerHTML = `
          ${personalCardHtml}
          <div class="flex items-center justify-between gap-3 px-1">
            <div class="min-w-0">
              <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">${displayName}</div>
              <div class="text-[11px] text-slate-500 truncate">${email}</div>
              <div class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ${syncLabel}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" id="manual-cloud-sync-btn" class="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Đồng bộ ngay
            </button>
            <button type="button" id="google-signout-btn" class="py-2.5 px-3 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Đăng xuất
            </button>
          </div>
        `;
      } else {
        box.innerHTML = `
          ${personalCardHtml}
          <div class="space-y-3 pt-1">
            <div class="text-xs font-bold uppercase tracking-wider text-indigo-700">Đăng nhập bằng tài khoản Google</div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Đăng nhập bằng Gmail giúp tự động lưu mọi buổi học (XP, Streak, lịch ôn SRS, bài đã qua và Sổ tay) để bạn học tiếp trên cả điện thoại lẫn máy tính.
            </p>
            <button type="button" id="google-signin-btn" class="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs text-slate-800 text-sm font-bold flex items-center justify-center gap-2.5 transition-all">
              <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              Tiếp tục với Google (Gmail)
            </button>
            ${!configured ? `
              <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                <strong>Chưa gắn khóa Supabase:</strong> Hiện web đang tự lưu tiến độ trên máy này. Hãy điền <code>SUPABASE_URL</code> và <code>SUPABASE_ANON_KEY</code> vào <code>js/config.js</code> để bật đăng nhập Gmail thật.
              </div>
            ` : ''}
          </div>
        `;
      }
      refreshIcons();
    }

    function openAccountModal() {
      renderAuthPanel();
      const m = document.getElementById('account-modal');
      if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
      refreshIcons();
    }

    async function signInWithGoogle() {
      if (!sbClient) {
        showToast('Hãy điền SUPABASE_URL và SUPABASE_ANON_KEY trong tệp js/config.js trước nhé!');
        return;
      }
      try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await sbClient.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl }
        });
        if (error) showToast('Lỗi đăng nhập Google: ' + error.message);
      } catch (e) {
        showToast('Không thể kết nối đăng nhập Google lúc này.');
      }
    }

    async function signOutGoogle() {
      if (!sbClient) return;
      try {
        await sbClient.auth.signOut();
        currentAuthUser = null;
        cloudSyncStatus = 'local';
        updateHeader();
        renderAuthPanel();
        showToast('Đã đăng xuất khỏi tài khoản Google.');
      } catch (e) {
        showToast('Có lỗi khi đăng xuất.');
      }
    }

    async function pushProgressToCloud(silent) {
      if (!sbClient || !currentAuthUser) return;
      try {
        cloudSyncStatus = 'saving';
        const { error } = await sbClient
          .from('engstart_progress')
          .upsert({
            user_id: currentAuthUser.id,
            user_email: currentAuthUser.email || '',
            payload: state,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        if (error) throw error;
        cloudSyncStatus = 'synced';
        renderAuthPanel();
        if (!silent) showToast('Đã lưu tiến độ học lên đám mây!');
      } catch (e) {
        cloudSyncStatus = 'error';
        if (!silent) showToast('Không thể lưu lên đám mây. Hãy kiểm tra bảng SQL trên Supabase.');
      }
    }

    async function pullProgressFromCloud() {
      if (!sbClient || !currentAuthUser) return;
      try {
        const { data, error } = await sbClient
          .from('engstart_progress')
          .select('payload, updated_at')
          .eq('user_id', currentAuthUser.id)
          .maybeSingle();
        if (error) throw error;
        if (data && data.payload) {
          const cloudUpdated = data.payload.updatedAt || 0;
          const localUpdated = state.updatedAt || 0;
          if (cloudUpdated >= localUpdated || state.xp === 0) {
            state = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...data.payload };
            saveState(true);
            updateHeader();
            showMainPage(state.mainNav || 'roadmap');
          } else {
            await pushProgressToCloud(true);
          }
          cloudSyncStatus = 'synced';
        } else {
          await pushProgressToCloud(true);
        }
        renderAuthPanel();
      } catch (e) {
        cloudSyncStatus = 'error';
      }
    }

    async function setupAuthSession() {
      initSupabaseClient();
      if (!sbClient) return;
      try {
        const { data } = await sbClient.auth.getSession();
        if (data && data.session && data.session.user) {
          currentAuthUser = data.session.user;
          updateHeader();
          await pullProgressFromCloud();
        }
        sbClient.auth.onAuthStateChange(async (event, session) => {
          currentAuthUser = session && session.user ? session.user : null;
          updateHeader();
          if (event === 'SIGNED_IN' && currentAuthUser) {
            showToast('Đăng nhập Gmail thành công! Đang đồng bộ buổi học...');
            await pullProgressFromCloud();
          }
        });
      } catch (e) {
        // Fallback to offline local mode
      }
    }

    // ==================== CARD & DICTATION HELPERS ====================
    function advanceCardWithSrs(quality) {
      const s = ui.session;
      if (!s || (s.type !== 'cards' && s.type !== 'srs_cards')) return;
      const w = s.items[s.idx];
      updateSrsWord(w.id, quality);
      if (quality >= 2) addXp(5);

      if (s.idx + 1 < s.items.length) {
        s.idx += 1;
        s.flipped = false;
        s.revealBlank = false;
        s.typedValue = '';
        s.recallResult = null;
        s.hintLevel = 0;
      } else {
        s.done = true;
        if (s.lessonId) markLessonStep(s.lessonId, 'cards', 15, 'Hoàn thành học thẻ! (+3 ⭐, +15 XP)');
        else showToast('Đã hoàn thành phiên ôn tập SRS!');
      }
      renderStudySession();
    }

    function checkCardRecall() {
      const s = ui.session;
      if (!s) return;
      const input = document.getElementById('card-recall-input');
      const val = (input ? input.value : s.typedValue).trim().toLowerCase();
      s.typedValue = val;
      if (!val) return;
      if (val === s.items[s.idx].en.trim().toLowerCase()) {
        s.recallResult = 'correct';
        speakText(s.items[s.idx].en);
      } else {
        s.recallResult = 'wrong';
      }
      renderStudySession();
    }

    function checkDictation() {
      const s = ui.session;
      if (!s || s.type !== 'dictation') return;
      const input = document.getElementById('dictation-input');
      const val = (input ? input.value : s.inputVal).trim().toLowerCase();
      s.inputVal = val;
      if (val === s.items[s.idx].en.trim().toLowerCase()) {
        s.status = 'correct';
        s.score += 1;
        addXp(5, 'Viết chuẩn xác! (+5 XP)');
      } else {
        s.status = 'wrong';
      }
      renderStudySession();
    }

    // ==================== EVENT DELEGATION ====================
    document.addEventListener('click', (e) => {
      const ipaWordButton = e.target.closest('[data-ipa-word]');
      if (ipaWordButton) { e.stopPropagation(); speakIpaPracticeText(ipaWordButton.dataset.ipaWord,Number(ipaWordButton.dataset.ipaRate) || undefined); return; }
      const speakBtn = e.target.closest('[data-speak]');
      if (speakBtn) { e.stopPropagation(); speakText(speakBtn.dataset.speak); return; }
      const speakSlowBtn = e.target.closest('[data-speak-slow]');
      if (speakSlowBtn) { e.stopPropagation(); speakText(speakSlowBtn.dataset.speakSlow, 0.65); return; }

      const mainNav = e.target.closest('[data-main-nav]');
      if (mainNav) { showMainPage(mainNav.dataset.mainNav); return; }
      if (e.target.closest('#brand-home-btn')) { switchTrack('vocab'); return; }

      const trackBtn = e.target.closest('[data-track]');
      if (trackBtn) { switchTrack(trackBtn.dataset.track); return; }

      const audBtn = e.target.closest('[data-aud-filter]');
      if (audBtn) {
        ui.audienceFilter = audBtn.dataset.audFilter;
        const matched = TOPICS_DATA.filter(t => ui.audienceFilter === 'all' || (TOPIC_AUDIENCE[t.id] || 'both') === 'both' || TOPIC_AUDIENCE[t.id] === ui.audienceFilter);
        if (matched.length && !matched.some(t => t.id === state.selectedTopicId)) {
          state.selectedTopicId = matched[0].id;
          saveState();
        }
        renderRoadmapPage();
        return;
      }
      const topicBtn = e.target.closest('[data-select-topic]');
      if (topicBtn) { state.selectedTopicId = topicBtn.dataset.selectTopic; saveState(); renderRoadmapPage(); return; }

      // Speed toggle
      if (e.target.closest('#speed-toggle-btn')) {
        state.speechRate = state.speechRate === 1.0 ? 0.7 : 1.0;
        saveState();
        updateHeader();
        showToast(state.speechRate === 1.0 ? 'Tốc độ đọc: Bình thường (1.0x)' : 'Tốc độ đọc: Chậm (0.7x)');
        return;
      }

      // Notebook Drawer
      if (e.target.closest('#header-notebook-btn') || e.target.closest('#mobile-notebook-btn') || e.target.closest('#study-notebook-btn')) {
        const d = document.getElementById('notebook-drawer');
        const ta = document.getElementById('notebook-textarea');
        if (ta) ta.value = state.notebook || '';
        if (d) { d.classList.remove('hidden'); d.classList.add('flex'); }
        return;
      }
      if (e.target.closest('#close-notebook-btn') || e.target.id === 'notebook-drawer') {
        const d = document.getElementById('notebook-drawer');
        if (d) { d.classList.add('hidden'); d.classList.remove('flex'); }
        return;
      }
      if (e.target.closest('#clear-notebook-btn')) {
        state.notebook = ''; saveState();
        const ta = document.getElementById('notebook-textarea');
        if (ta) ta.value = '';
        showToast('Đã xóa ghi chú.');
        return;
      }

      // Account & Cloud Modal
      if (e.target.closest('#open-account-modal-btn')) { openAccountModal(); return; }
      if (e.target.closest('#close-account-modal-btn') || e.target.id === 'account-modal') {
        const m = document.getElementById('account-modal');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        return;
      }
      if (e.target.closest('#remove-custom-avatar-btn')) {
        if (state.profile) state.profile.customAvatar = '';
        saveState();
        syncHeaderStats();
        renderAuthPanel();
        showToast('Đã xóa ảnh riêng.');
        return;
      }
      if (e.target.closest('#save-profile-name-btn')) {
        const inp = document.getElementById('profile-name-input');
        if (!state.profile) state.profile = { name: '', email: '', customAvatar: '' };
        state.profile.name = inp ? inp.value.trim() : '';
        saveState();
        syncHeaderStats();
        renderAuthPanel();
        showToast('Đã lưu tên hiển thị!');
        return;
      }
      if (e.target.closest('#google-signin-btn')) { signInWithGoogle(); return; }
      if (e.target.closest('#google-signout-btn')) { signOutGoogle(); return; }
      if (e.target.closest('#manual-cloud-sync-btn')) { pushProgressToCloud(false); return; }
      if (e.target.closest('#export-json-btn')) {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `engstart_backup_${TODAY_STR()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Đã tải xuống file sao lưu tiến độ!');
        return;
      }

      // Reset Modal
      if (e.target.closest('#open-reset-modal-btn')) { const m = document.getElementById('reset-modal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); } return; }
      if (e.target.closest('#cancel-reset-btn')) { const m = document.getElementById('reset-modal'); if (m) { m.classList.add('hidden'); m.classList.remove('flex'); } return; }
      if (e.target.closest('#confirm-reset-btn')) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        ui.grammarAnswers = {}; ui.session = null; setZenMode(false);
        saveState();
        const m = document.getElementById('reset-modal'); if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        showMainPage('roadmap');
        showToast('Đã đặt lại toàn bộ tiến độ.');
        return;
      }

      // Start Study Sessions
      const startCards = e.target.closest('[data-start-cards]'); if (startCards) { startCardSession(startCards.dataset.startCards); return; }
      const startEx = e.target.closest('[data-start-exercise]'); if (startEx) { startExerciseSession(startEx.dataset.startExercise); return; }
      const startSpeak = e.target.closest('[data-start-speaking]'); if (startSpeak) { startSpeakingSession(startSpeak.dataset.startSpeaking); return; }
      const startDict = e.target.closest('[data-start-dictation]'); if (startDict) { startDictationSession(startDict.dataset.startDictation); return; }
      const startBuild = e.target.closest('[data-start-builder]'); if (startBuild) { startBuilderSession(startBuild.dataset.startBuilder); return; }
      const startPlace = e.target.closest('[data-start-placement]'); if (startPlace) { startPlacementSession(startPlace.dataset.startPlacement); return; }

      // Exit Study / Zen
      if (e.target.closest('#exit-study-btn') || e.target.closest('#exit-study-btn-2')) { showMainPage(['review', 'bank'].includes(state.mainNav) ? state.mainNav : 'roadmap'); return; }
      if (e.target.closest('#toggle-zen-btn')) { setZenMode(!ui.zenMode); renderStudySession(); return; }

      // Flashcard actions
      const flBtn = e.target.closest('[data-front-lang]'); if (flBtn && ui.session) { ui.session.frontLang = flBtn.dataset.frontLang; ui.session.flipped = false; renderStudySession(); return; }
      if (e.target.closest('#card-flip-btn') && ui.session) { ui.session.flipped = true; renderStudySession(); return; }
      if (e.target.closest('#toggle-blank-btn') && ui.session) { ui.session.revealBlank = !ui.session.revealBlank; renderStudySession(); return; }
      if (e.target.closest('#card-hint-btn') && ui.session) { ui.session.hintLevel += 1; renderStudySession(); return; }
      if (e.target.closest('#card-check-recall-btn')) { checkCardRecall(); return; }
      const srsRateBtn = e.target.closest('[data-srs-rate]');
      if (srsRateBtn) { advanceCardWithSrs(Number(srsRateBtn.dataset.srsRate)); return; }

      // Speaking Practice actions
      const spkMode = e.target.closest('[data-speak-mode]');
      if (spkMode && ui.session && ui.session.type === 'speaking') {
        ui.session.mode = spkMode.dataset.speakMode;
        ui.session.lastEval = null;
        renderStudySession();
        return;
      }
      if (e.target.closest('#speak-mic-btn') && ui.session && ui.session.type === 'speaking') {
        const w = ui.session.items[ui.session.idx];
        const targetText = ui.session.mode === 'word' ? w.en : w.exEn;
        startSpeechCapture(targetText, (res) => {
          if (res) {
            ui.session.lastEval = res;
            if (res.pct >= 70) {
              ui.session.passedCount += 1;
              addXp(10, `Phát âm tốt (${res.pct}%)! +10 XP`);
            }
          }
          renderStudySession();
        });
        renderStudySession();
        return;
      }
      if ((e.target.closest('#speak-next-btn') || e.target.closest('#speak-skip-btn')) && ui.session && ui.session.type === 'speaking') {
        if (ui.session.idx + 1 < ui.session.items.length) {
          ui.session.idx += 1;
          ui.session.lastEval = null;
        } else {
          ui.session.done = true;
          if (ui.session.lessonId) markLessonStep(ui.session.lessonId, 'speaking', 20, 'Hoàn thành Luyện nói! (+2 ⭐)');
        }
        renderStudySession();
        return;
      }

      // Exercise & Placement actions
      const exOpt = e.target.closest('[data-ex-opt]');
      if (exOpt && ui.session && typeof ui.session.picked !== 'number') {
        const idx = Number(exOpt.dataset.exOpt);
        ui.session.picked = idx;
        if (ui.session.items[ui.session.idx].options[idx].isCorrect) ui.session.score += 1;
        renderStudySession();
        return;
      }
      if (e.target.closest('#ex-next-btn') && ui.session) {
        const s = ui.session;
        if (s.idx + 1 < s.items.length) { s.idx += 1; s.picked = null; }
        else {
          s.done = true;
          if (s.type === 'exercise' && s.score >= Math.ceil(s.items.length * 0.7) && s.lessonId) {
            markLessonStep(s.lessonId, 'exercise', 20, 'Vượt qua bài tập! (+3 ⭐)');
            if (typeof confetti === 'function') confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
          } else if (s.type === 'placement' && s.score >= 5) {
            const topic = TOPICS_DATA.find(t => t.id === s.topicId);
            if (topic) {
              topic.lessons.forEach(l => { markLessonStep(l.id, 'cards', 0); markLessonStep(l.id, 'exercise', 0); });
              addXp(40, `Vượt cấp thành công chủ đề ${topic.title}! (+40 XP)`);
              if (typeof confetti === 'function') confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 } });
            }
          }
        }
        renderStudySession();
        return;
      }
      if (e.target.closest('#retry-session-btn') && ui.session) {
        if (ui.session.type === 'placement') startPlacementSession(ui.session.topicId);
        else if (ui.session.lessonId) startExerciseSession(ui.session.lessonId);
        return;
      }

      // Dictation actions
      if (e.target.closest('#dictation-check-btn')) { checkDictation(); return; }
      if (e.target.closest('#dictation-hint-btn') && ui.session) { ui.session.hintShown = true; renderStudySession(); return; }
      if (e.target.closest('#dictation-next-btn') && ui.session) {
        const s = ui.session;
        if (s.idx + 1 < s.items.length) { s.idx += 1; s.inputVal = ''; s.status = null; s.hintShown = false; renderStudySession(); speakText(s.items[s.idx].en); }
        else { s.done = true; if (s.lessonId) markLessonStep(s.lessonId, 'dictation', 15, 'Hoàn thành Nghe viết! (+1 ⭐)'); renderStudySession(); }
        return;
      }

      // Sentence Builder actions
      const bAdd = e.target.closest('[data-b-add]');
      if (bAdd && ui.session && ui.session.type === 'builder') {
        const i = ui.session.pool.findIndex(c => c.id === bAdd.dataset.bAdd);
        if (i !== -1) { ui.session.selected.push(ui.session.pool.splice(i, 1)[0]); ui.session.status = null; renderStudySession(); }
        return;
      }
      const bRem = e.target.closest('[data-b-remove]');
      if (bRem && ui.session && ui.session.type === 'builder') {
        const i = ui.session.selected.findIndex(c => c.id === bRem.dataset.bRemove);
        if (i !== -1) { ui.session.pool.push(ui.session.selected.splice(i, 1)[0]); ui.session.status = null; renderStudySession(); }
        return;
      }
      if (e.target.closest('#b-reset-btn') && ui.session && ui.session.type === 'builder') {
        const item = ui.session.items[ui.session.idx];
        ui.session.pool = shuffleArray(item.words.map((w, i) => ({ id: `${i}_${w}`, text: w })));
        ui.session.selected = []; ui.session.status = null; renderStudySession(); return;
      }
      if (e.target.closest('#b-check-btn') && ui.session && ui.session.type === 'builder') {
        const item = ui.session.items[ui.session.idx];
        const built = ui.session.selected.map(c => c.text).join(' ');
        if (built === item.words.join(' ')) { ui.session.status = 'correct'; speakText(built); addXp(10, 'Ghép câu chuẩn xác! (+10 XP)'); }
        else ui.session.status = 'wrong';
        renderStudySession(); return;
      }
      if (e.target.closest('#b-next-btn') && ui.session && ui.session.type === 'builder') {
        const s = ui.session;
        if (s.idx + 1 < s.items.length) {
          s.idx += 1;
          const nextItem = s.items[s.idx];
          s.pool = shuffleArray(nextItem.words.map((w, i) => ({ id: `${i}_${w}`, text: w })));
          s.selected = []; s.status = null;
        } else {
          s.done = true; if (s.lessonId) markLessonStep(s.lessonId, 'builder', 15, 'Hoàn thành Ghép câu! (+1 ⭐)');
        }
        renderStudySession(); return;
      }

      // Dialogue actions
      const selDlg = e.target.closest('[data-select-dialogue]');
      if (selDlg) { state.selectedDialogueId = selDlg.dataset.selectDialogue; ui.dialoguePlayingIdx = -1; saveState(); renderDialogueTrack(); refreshIcons(); return; }
      if (e.target.closest('#dialogue-play-all-btn')) {
        const d = DIALOGUES_DATA.find(x => x.id === state.selectedDialogueId);
        if (d) playFullDialogue(d);
        return;
      }
      if (e.target.closest('#dialogue-toggle-vi-btn')) { ui.dialogueShowVi = !ui.dialogueShowVi; renderDialogueTrack(); refreshIcons(); return; }
      if (e.target.closest('#dialogue-toggle-roleplay-btn')) { ui.dialogueRoleplay = !ui.dialogueRoleplay; renderDialogueTrack(); refreshIcons(); return; }
      const spkLine = e.target.closest('[data-speak-line]');
      if (spkLine) {
        const d = DIALOGUES_DATA.find(x => x.id === state.selectedDialogueId);
        const line = d && d.lines[Number(spkLine.dataset.speakLine)];
        if (line) speakText(line.en, state.speechRate, line.role === 'A' ? 1.12 : 0.9);
        return;
      }
      const micDlg = e.target.closest('[data-mic-dialogue]');
      if (micDlg) {
        const idx = Number(micDlg.dataset.micDialogue);
        const d = DIALOGUES_DATA.find(x => x.id === state.selectedDialogueId);
        const line = d && d.lines[idx];
        if (!line) return;
        showToast('Đang nghe... Hãy đọc câu của bạn!');
        startSpeechCapture(line.en, (res) => {
          if (res) {
            ui.dialogueSpeechResult[`${d.id}_${idx}`] = res;
            if (res.pct >= 70) addXp(10, `Phản xạ rất tốt (${res.pct}%)! +10 XP`);
          }
          renderDialogueTrack();
          refreshIcons();
        });
        return;
      }
      if (e.target.closest('#dialogue-complete-btn')) {
        const id = state.selectedDialogueId;
        if (!state.completedDialogues.includes(id)) {
          state.completedDialogues.push(id);
          addXp(20, 'Hoàn thành luyện Hội thoại! (+3 ⭐, +20 XP)');
        }
        renderDialogueTrack();
        refreshIcons();
        return;
      }

      // SRS Review actions



      // Global Language Switcher & Mobile Account button
      if (e.target.closest('[data-open-account]')) { openAccountModal(); return; }
      const gLangBtn = e.target.closest('[data-global-lang]');
      if (gLangBtn) {
        const chosen = gLangBtn.dataset.globalLang === 'zh' ? 'zh' : 'en';
        ui.typingLang = chosen;
        ui.bankLang = chosen;
        ui.aiLang = chosen;
        ui.oqLang = chosen;
        ui.aioGrammarLang = chosen;
        ui.pronLang = chosen;
        ui.dictLang = chosen;
        ui.dictPickIdx = 0;
        if (ui.exLang !== chosen) initExerciseSession(chosen, ui.exMode || 'mcq');
        ui.videoLangFilter = chosen;
        ui.typingActiveTopicId = null;
        if (state.mainNav === 'roadmap' && chosen === 'zh') { showMainPage('chinese'); return; }
        if (state.mainNav === 'chinese' && chosen === 'en') { showMainPage('roadmap'); return; }
        showMainPage(state.mainNav);
        return;
      }

      // Exercises ("Làm bài tập") actions
      const exLangBtn = e.target.closest('[data-ex-lang]');
      if (exLangBtn) {
        initExerciseSession(exLangBtn.dataset.exLang, ui.exMode || 'mcq');
        renderExercisesPage();
        return;
      }
      const exModeBtn = e.target.closest('[data-ex-mode]');
      if (exModeBtn) {
        initExerciseSession(ui.exLang || 'en', exModeBtn.dataset.exMode);
        renderExercisesPage();
        return;
      }
      if (e.target.closest('#ex-new-set-btn') || e.target.closest('#ex-new-set-btn-2')) {
        initExerciseSession(ui.exLang || 'en', ui.exMode || 'mcq');
        renderExercisesPage();
        return;
      }
      const exMcqBtn = e.target.closest('[data-ex-mcq-pick]');
      if (exMcqBtn && ui.exPicked === null) {
        const picked = parseInt(exMcqBtn.dataset.exMcqPick, 10);
        const cur = ui.exItems[ui.exIdx || 0];
        ui.exPicked = picked;
        if (picked === cur.ans) {
          ui.exCorrect = (ui.exCorrect || 0) + 1;
          addXp(5, 'Đúng bài tập (+5 XP)');
        }
        renderExercisesPage();
        return;
      }
      if (e.target.closest('#ex-fill-check-btn')) {
        const inp = document.getElementById('ex-fill-input');
        const val = (inp ? inp.value : '').trim();
        ui.exFillInput = val;
        const cur = ui.exItems[ui.exIdx || 0];
        const ok = val.toLowerCase() === cur.answer.toLowerCase();
        ui.exFillChecked = ok;
        if (ok) {
          ui.exCorrect = (ui.exCorrect || 0) + 1;
          addXp(5, 'Điền từ chính xác (+5 XP)');
        }
        renderExercisesPage();
        return;
      }
      const exOrdAdd = e.target.closest('[data-ex-order-add]');
      if (exOrdAdd) {
        const i = parseInt(exOrdAdd.dataset.exOrderAdd, 10);
        if (!ui.exOrderPicked) ui.exOrderPicked = [];
        if (!ui.exOrderPicked.includes(i)) ui.exOrderPicked.push(i);
        renderExercisesPage();
        return;
      }
      const exOrdRem = e.target.closest('[data-ex-order-remove]');
      if (exOrdRem) {
        const pos = parseInt(exOrdRem.dataset.exOrderRemove, 10);
        if (ui.exOrderPicked) ui.exOrderPicked.splice(pos, 1);
        renderExercisesPage();
        return;
      }
      if (e.target.closest('#ex-order-clear-btn')) {
        ui.exOrderPicked = [];
        ui.exOrderChecked = null;
        renderExercisesPage();
        return;
      }
      if (e.target.closest('#ex-order-check-btn')) {
        const cur = ui.exItems[ui.exIdx || 0];
        const isZh = (ui.exLang || 'en') === 'zh';
        const built = (ui.exOrderPicked || []).map(i => cur.scrambled[i]).join(isZh ? '' : ' ');
        const ok = built.toLowerCase() === cur.target.toLowerCase();
        ui.exOrderChecked = ok;
        if (ok) {
          ui.exCorrect = (ui.exCorrect || 0) + 1;
          addXp(10, 'Sắp xếp câu đúng (+10 XP)');
        }
        renderExercisesPage();
        return;
      }
      if (e.target.closest('#ex-next-btn')) {
        if ((ui.exIdx || 0) + 1 >= ui.exItems.length) {
          ui.exDone = true;
          addXp(20, 'Hoàn thành bộ bài tập (+20 XP)');
        } else {
          ui.exIdx = (ui.exIdx || 0) + 1;
          ui.exPicked = null;
          ui.exFillInput = '';
          ui.exFillChecked = null;
          ui.exOrderPicked = [];
          ui.exOrderChecked = null;
        }
        renderExercisesPage();
        return;
      }

      // AIO Grammar, Reading, Pronunciation & Dictionary actions
      const grmGroupBtn = e.target.closest('[data-aio-gram-group]');
      if (grmGroupBtn) {
        ui.aioGrammarGroup = grmGroupBtn.dataset.aioGramGroup;
        renderAioGrammarPage();
        return;
      }
      const grmLangBtn = e.target.closest('[data-aio-gram-lang]');
      if (grmLangBtn) {
        ui.aioGrammarLang = grmLangBtn.dataset.aioGramLang;
        ui.aioGrammarGroup = 'all';
        ui.aioGrammarSelected = `${ui.aioGrammarLang}-1-0`;
        renderAioGrammarPage();
        return;
      }
      const gramQuizBtn = e.target.closest('[data-aio-gram-quiz]');
      if (gramQuizBtn) {
        const gKey = gramQuizBtn.dataset.aioGramKey;
        const pickedIdx = Number(gramQuizBtn.dataset.aioGramQuiz);
        if (!ui.aioGramQuizPicked) ui.aioGramQuizPicked = {};
        if (ui.aioGramQuizPicked[gKey] === undefined) {
          ui.aioGramQuizPicked[gKey] = pickedIdx;
          const lang = ui.aioGrammarLang || 'en';
          const src = (typeof window !== 'undefined' && window.AIO_GRAMMAR_UNITS_FULL) ? window.AIO_GRAMMAR_UNITS_FULL : AIO_GRAMMAR_UNITS;
          const units = src[lang] || src.en;
          units.forEach(u => u.points.forEach((pt, idx) => {
            if (`${lang}-${u.num}-${idx}` === gKey && pt.check && pickedIdx === pt.check.ans) {
              addXp(5, 'Đúng câu kiểm tra ngữ pháp (+5 XP)');
            }
          }));
          renderAioGrammarPage();
        }
        return;
      }
      const grmPickBtn = e.target.closest('[data-aio-gram-pick]');
      if (grmPickBtn) {
        ui.aioGrammarSelected = grmPickBtn.dataset.aioGramPick;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderAioGrammarPage();
        return;
      }
      if (e.target.closest('#custom-read-en-btn')) {
        const ta = document.getElementById('custom-read-text');
        const val = ta ? ta.value.trim() : '';
        ui.customReadText = val;
        if (val) speakText(val); else showToast('Hãy dán đoạn văn tiếng Anh trước nhé!');
        return;
      }
      if (e.target.closest('#custom-read-zh-btn')) {
        const ta = document.getElementById('custom-read-text');
        const val = ta ? ta.value.trim() : '';
        ui.customReadText = val;
        if (val) speakChinese(val); else showToast('Hãy dán đoạn văn tiếng Trung trước nhé!');
        return;
      }
      if (e.target.closest('#ipa-back-btn')) {
        stopIpaAudio(); stopIpaPracticeRecording();
        stopIpaPracticeRecording();
        ui.ipaPractice = null;
        ui.ipaDetailSym = null;
        _ipaAudioMessage='';_ipaAudioError=false;
        renderAioPronunciationPage();
        return;
      }
      if (e.target.closest('#ipa-practice-exit')) {
        stopIpaAudio(); stopIpaPracticeRecording();
        stopIpaPracticeRecording();
        ui.ipaPractice = null;
        renderAioPronunciationPage();
        return;
      }
      const ipaAccentBtn = e.target.closest('[data-ipa-accent]');
      if (ipaAccentBtn) {
        stopIpaAudio(); stopIpaPracticeRecording();
        ui.ipaAccent = ipaAccentBtn.dataset.ipaAccent;
        _ipaAudioMessage='';_ipaAudioError=false;
        refreshIpaPracticeAccent();
        renderAioPronunciationPage();
        return;
      }
      if (e.target.closest('#ipa-toggle-accent')) {
        stopIpaAudio(); stopIpaPracticeRecording();
        ui.ipaAccent = (ui.ipaAccent || 'en-GB') === 'en-GB' ? 'en-US' : 'en-GB';
        refreshIpaPracticeAccent();
        renderAioPronunciationPage();
        return;
      }
      if (e.target.closest('#ipa-toggle-guide')) {
        if (ui.ipaPractice) {
          ui.ipaPractice.showGuide = !ui.ipaPractice.showGuide;
          renderAioPronunciationPage();
        }
        return;
      }
      const ipaStartBtn = e.target.closest('[data-ipa-start]');
      if (ipaStartBtn && ui.ipaDetailSym) {
        startIpaPractice(ui.ipaDetailSym, ipaStartBtn.dataset.ipaStart);
        return;
      }
      const ipaJumpBtn = e.target.closest('[data-ipa-jump]');
      if (ipaJumpBtn && ui.ipaPractice) {
        goIpaPracticeItem(Number(ipaJumpBtn.dataset.ipaJump));
        return;
      }
      if (e.target.closest('#ipa-listen-play') && ui.ipaPractice) {
        const it = ui.ipaPractice.items[ui.ipaPractice.idx];
        if (it && it.target) speakIpaPracticeText(it.target);
        return;
      }
      const ipaListenOpt = e.target.closest('[data-ipa-listen-opt]');
      if (ipaListenOpt && ui.ipaPractice) {
        answerIpaListenOption(Number(ipaListenOpt.dataset.ipaListenOpt));
        return;
      }
      const ipaReplayWord = e.target.closest('[data-ipa-replay-word]');
      if (ipaReplayWord) {
        speakIpaPracticeText(ipaReplayWord.dataset.ipaReplayWord);
        return;
      }
      if (e.target.closest('#ipa-sample-play') && ui.ipaPractice) {
        const it = ui.ipaPractice.items[ui.ipaPractice.idx];
        if (it && it.text) speakIpaPracticeText(it.text);
        return;
      }
      if (e.target.closest('#ipa-record-btn') && ui.ipaPractice) {
        toggleIpaPracticeRecording();
        return;
      }
      if (e.target.closest('#ipa-playback-btn') && _ipaRecUrl) {
        if (ui.ipaPractice && ui.ipaPractice.recording) { showToast('Dừng ghi âm trước khi nghe lại.'); return; }
        finishIpaPlayback(getIpaController().playRecording(_ipaRecUrl));
        return;
      }
      if (e.target.closest('#ipa-practice-next') && ui.ipaPractice) {
        goIpaPracticeItem(ui.ipaPractice.idx + 1);
        return;
      }
      const pickIpaBtn = e.target.closest('[data-pick-ipa]');
      if (pickIpaBtn) {
        ipaOpenLesson(pickIpaBtn.dataset.pickIpa);
        return;
      }
      const spkPhonemeBtn = e.target.closest('[data-speak-phoneme]');
      if (spkPhonemeBtn) {
        e.stopPropagation();
        playIpaPhoneme(spkPhonemeBtn.dataset.speakPhoneme, spkPhonemeBtn.dataset.ipaContext || '', Number(spkPhonemeBtn.dataset.ipaRate)||1);
        return;
      }
      const spkSlowBtn = e.target.closest('[data-speak-slow]');
      if (spkSlowBtn) {
        e.stopPropagation();
        const prevRate = state.speechRate;
        state.speechRate = 0.65;
        speakText(spkSlowBtn.dataset.speakSlow || '');
        state.speechRate = prevRate;
        return;
      }
      const pronLangBtn = e.target.closest('[data-pron-lang]');
      if (pronLangBtn) {
        stopIpaAudio(); stopIpaPracticeRecording();
        ui.pronLang = pronLangBtn.dataset.pronLang;
        renderAioPronunciationPage();
        return;
      }
      // AIO Sentence Typing ("Học qua gõ câu") actions
      const tLangBtn = e.target.closest('[data-typing-lang]');
      if (tLangBtn) {
        ui.typingLang = tLangBtn.dataset.typingLang === 'zh' ? 'zh' : 'en';
        ui.typingActiveTopicId = null;
        renderTypingPage();
        updateHeader();
        return;
      }
      const startTopicBtn = e.target.closest('[data-start-typing-topic]');
      if (startTopicBtn && startTopicBtn.dataset.startTypingTopic) {
        ui.typingActiveTopicId = startTopicBtn.dataset.startTypingTopic;
        ui.typingSentenceIdx = 0;
        ui.typingInput = '';
        renderTypingPage();
        const { all } = getTypingTopics(ui.typingLang || 'en');
        const tp = all.find(t => t.id === ui.typingActiveTopicId);
        if (tp && tp.sentences[0]) {
          if (ui.typingLang === 'zh') speakChinese(tp.sentences[0].target);
          else speakText(tp.sentences[0].target);
        }
        return;
      }
      if (e.target.closest('#typing-back-btn')) {
        ui.typingActiveTopicId = null;
        ui.typingInput = '';
        renderTypingPage();
        return;
      }
      const tModeBtn = e.target.closest('[data-typing-mode]');
      if (tModeBtn) {
        ui.typingMode = tModeBtn.dataset.typingMode;
        renderTypingPage();
        return;
      }
      if (e.target.closest('#typing-reveal-btn')) {
        const { all } = getTypingTopics(ui.typingLang || 'en');
        const tp = all.find(t => t.id === ui.typingActiveTopicId);
        if (tp) {
          const sent = tp.sentences[ui.typingSentenceIdx || 0];
          ui.typingInput = sent.target;
          renderTypingPage();
        }
        return;
      }
      if (e.target.closest('#typing-check-next-btn')) {
        const { all } = getTypingTopics(ui.typingLang || 'en');
        const tp = all.find(t => t.id === ui.typingActiveTopicId);
        if (tp) {
          const sent = tp.sentences[ui.typingSentenceIdx || 0];
          const scored = scoreSentenceMatch(sent.target, ui.typingInput || '', ui.typingLang === 'zh');
          if (scored.pct >= 70) addXp(10, 'Gõ câu chuẩn xác (+10 XP)');
          ui.typingSentenceIdx = ((ui.typingSentenceIdx || 0) + 1) % tp.sentences.length;
          ui.typingInput = '';
          renderTypingPage();
          const nextSent = tp.sentences[ui.typingSentenceIdx];
          if (nextSent) {
            if (ui.typingLang === 'zh') speakChinese(nextSent.target);
            else speakText(nextSent.target);
          }
        }
        return;
      }

      // OpenQuiz Practice Hub actions
      const revSubBtn = e.target.closest('[data-review-subtab]');
      if (revSubBtn) {
        ui.reviewSubTab = revSubBtn.dataset.reviewSubtab;
        renderReviewPage();
        return;
      }
      const startOqBtn = e.target.closest('[data-start-oq-translate]');
      if (startOqBtn) {
        ui.oqLang = 'en';
        ui.reviewSubTab = 'translate';
        ui.oqTransInput = '';
        ui.oqTransResult = null;
        showMainPage('review');
        return;
      }
      const oqLangBtn = e.target.closest('[data-oq-lang]');
      if (oqLangBtn) {
        ui.oqLang = oqLangBtn.dataset.oqLang;
        ui.oqTransIdx = 0;
        ui.oqTransInput = '';
        ui.oqTransResult = null;
        ui.oqDashActive = false;
        renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-trans-next-btn')) {
        const pool = getOqPool(ui.oqLang || 'en');
        ui.oqTransIdx = Math.floor(Math.random() * pool.length);
        ui.oqTransInput = '';
        ui.oqTransResult = null;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-trans-mic-btn')) {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) { showToast('Trình duyệt chưa hỗ trợ Micro (hãy dùng Chrome hoặc Edge).'); return; }
        const isZh = (ui.oqLang || 'en') === 'zh';
        showToast('Đang lắng nghe câu dịch của bạn...');
        startSpeechCapture(isZh ? '你好' : 'hello', (res) => {
          if (res && res.transcript) ui.oqTransInput = res.transcript;
          renderReviewPage();
        }, isZh ? 'zh-CN' : 'en-US');
        renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-trans-check-btn')) {
        const inp = document.getElementById('oq-trans-input');
        const val = inp ? inp.value.trim() : '';
        ui.oqTransInput = val;
        const isZh = (ui.oqLang || 'en') === 'zh';
        const pool = getOqPool(ui.oqLang || 'en');
        const item = pool[ui.oqTransIdx || 0];
        const scored = scoreSentenceMatch(item.exampleTarget, val, isZh);
        const usedTarget = isZh
          ? val.includes(item.target)
          : val.toLowerCase().includes(item.target.toLowerCase());
        ui.oqTransResult = { ...scored, usedTarget, idk: false };
        if (scored.pct >= 75 || usedTarget) addXp(10, 'Dịch & đặt câu chuẩn (+10 XP)');
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-trans-idk-btn')) {
        ui.oqTransResult = { pct: 0, tokens: [], usedTarget: false, idk: true };
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      const oqReadTab = e.target.closest('[data-oq-read]');
      if (oqReadTab) {
        ui.oqReadIdx = parseInt(oqReadTab.dataset.oqRead, 10);
        ui.oqReadBlank = '';
        ui.oqReadBlankOk = null;
        ui.oqReadQuizPicked = null;
        ui.oqReadShowVi = false;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-read-check-blank')) {
        const inp = document.getElementById('oq-read-blank-input');
        const val = inp ? inp.value.trim() : '';
        ui.oqReadBlank = val;
        const p = OQ_READING_PASSAGES[ui.oqReadIdx || 0];
        const ok = val.toLowerCase() === p.blank.toLowerCase();
        ui.oqReadBlankOk = ok;
        if (ok) addXp(10, 'Điền từ đọc hiểu chính xác (+10 XP)');
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      const oqReadLangBtn = e.target.closest('[data-oq-read-lang]');
      if (oqReadLangBtn) {
        ui.oqReadLangFilter = oqReadLangBtn.dataset.oqReadLang;
        ui.oqReadBlank = ''; ui.oqReadBlankOk = null; ui.oqReadShowVi = false; ui.oqReadQuizPicked = null;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-read-random-btn')) {
        const lf = ui.oqReadLangFilter || 'all';
        const pool = OQ_READING_PASSAGES.map((x, i) => ({ x, i })).filter(o => lf === 'all' || o.x.lang === lf);
        if (pool.length > 1) {
          const others = pool.filter(o => o.i !== (ui.oqReadIdx || 0));
          const pick = others[Math.floor(Math.random() * others.length)] || pool[0];
          ui.oqReadIdx = pick.i;
          ui.oqReadBlank = ''; ui.oqReadBlankOk = null; ui.oqReadShowVi = false; ui.oqReadQuizPicked = null;
        }
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      const oqAiLangBtn = e.target.closest('[data-oq-ai-lang]');
      if (oqAiLangBtn) {
        ui.oqAiLang = oqAiLangBtn.dataset.oqAiLang;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#oq-ai-gen-btn')) {
        const inp = document.getElementById('oq-ai-topic-input');
        ui.oqAiTopic = inp ? inp.value.trim() : '';
        generateAiReadingPassage(ui.oqAiTopic, ui.oqAiLang || 'en');
        return;
      }
      if (e.target.closest('#oq-read-toggle-vi')) {
        ui.oqReadShowVi = !ui.oqReadShowVi;
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      const oqReadPick = e.target.closest('[data-oq-read-pick]');
      if (oqReadPick) {
        const idx = parseInt(oqReadPick.dataset.oqReadPick, 10);
        ui.oqReadQuizPicked = idx;
        const p = OQ_READING_PASSAGES[ui.oqReadIdx || 0];
        if (idx === p.correctIdx) addXp(10, 'Đúng câu hỏi đọc hiểu (+10 XP)');
        if (state.mainNav === 'reading') renderAioReadingPage(); else renderReviewPage();
        return;
      }
      if (e.target.closest('#dash-lb-refresh')) {
        const inp = document.getElementById('dash-nick-input');
        if (inp && inp.value.trim()) {
          try { localStorage.setItem('engstart_dash_nick', inp.value.trim().slice(0, 24)); } catch {}
        }
        loadDashLeaderboard(ui.oqLang || 'en', true);
        showToast('Đã cập nhật bảng xếp hạng!');
        return;
      }
      if (e.target.closest('#oq-dash-start-btn') || e.target.closest('#oq-dash-start-btn-2')) {
        initOqSpeedDash();
        renderReviewPage();
        return;
      }
      const oqDashPick = e.target.closest('[data-oq-dash-pick]');
      if (oqDashPick && ui.oqDashActive) {
        const ok = oqDashPick.dataset.oqDashPick === '1';
        if (ok) {
          ui.oqDashScore = (ui.oqDashScore || 0) + 1;
          ui.oqDashCombo = (ui.oqDashCombo || 0) + 1;
          ui.oqDashBestCombo = Math.max(ui.oqDashBestCombo || 0, ui.oqDashCombo);
          ui.oqDashFeedback = '✓ Chính xác! +1 điểm';
        } else {
          ui.oqDashCombo = 0;
          ui.oqDashFeedback = '✗ Chưa đúng — sang từ tiếp theo!';
        }
        ui.oqDashIdx = (ui.oqDashIdx || 0) + 1;
        renderReviewPage();
        return;
      }

      // Video Studio actions
      const vLangBtn = e.target.closest('[data-video-lang]');
      if (vLangBtn) {
        ui.videoLangFilter = vLangBtn.dataset.videoLang;
        ui.customYoutubeId = '';
        ui.videoLineIdx = 0;
        ui.videoShadowResult = null;
        ui.videoDictationResult = null;
        ui.videoQuizPicked = null;
        renderVideoStudioPage();
        return;
      }
      const vSelBtn = e.target.closest('[data-select-video]');
      if (vSelBtn) {
        ui.videoId = vSelBtn.dataset.selectVideo;
        ui.customYoutubeId = '';
        ui.customVideoLines = null;
        ui.customVideoLang = null;
        _ytMountedVideoId = null;
        ui.videoLineIdx = 0;
        ui.videoLookupWord = null;
        ui.videoShadowResult = null;
        ui.videoDictationResult = null;
        ui.videoQuizPicked = null;
        renderVideoStudioPage();
        return;
      }
      const vModeBtn = e.target.closest('[data-video-mode]');
      if (vModeBtn) {
        ui.videoMode = vModeBtn.dataset.videoMode;
        ui.videoQuizPicked = null;
        renderVideoStudioPage();
        return;
      }
      if (e.target.closest('#vid-toggle-ipa')) { ui.videoShowIpa = ui.videoShowIpa === false ? true : false; renderVideoStudioPage(); return; }
      if (e.target.closest('#vid-toggle-vi')) { ui.videoShowVi = ui.videoShowVi === false ? true : false; renderVideoStudioPage(); return; }
      const vSrcTab = e.target.closest('[data-vid-src-tab]');
      if (vSrcTab) {
        ui.videoSrcTab = vSrcTab.dataset.vidSrcTab;
        renderVideoStudioPage();
        return;
      }
      if (e.target.closest('#vid-ai-translate-paste-btn') && !ui.videoLoadingSubs) {
        const ta = document.getElementById('vid-paste-transcript');
        const rawText = (ta ? ta.value : '').trim();
        ui.videoPasteDraft = rawText;
        if (!rawText) { showToast('Hãy dán vài dòng lời thoại từ YouTube vào ô trống trước nhé!'); return; }
        ui.videoLoadingSubs = true;
        ui.videoLastError = '';
        renderVideoStudioPage();
        fetch('/api/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: (ui.customVideoLang = (document.getElementById('vid-lang-select')?.value || ui.customVideoLang || 'en')), rawTranscript: rawText })
        })
          .then(r => r.json().then(d => ({ ok: r.ok, d })))
          .then(({ ok, d }) => {
            if (!ok) { ui.videoLastError = d.error || 'Lỗi dịch lời thoại.'; showToast(ui.videoLastError); return; }
            if (d.lines && d.lines.length) {
              ui.customVideoLines = d.lines;
              ui.videoLineIdx = 0;
              showToast(`Gemini AI đã dịch xong ${d.lines.length} dòng chạy khớp từng giây!`);
            }
          })
          .catch(err => { ui.videoLastError = 'Lỗi kết nối: ' + err.message; })
          .finally(() => { ui.videoLoadingSubs = false; renderVideoStudioPage(); });
        return;
      }
      if (e.target.closest('#vid-load-more-ai-btn') && ui.customYoutubeId && !ui.videoLoadingSubs) {
        fetchYoutubeTranscript(ui.customYoutubeId, ui.videoNextStart || 45, true);
        return;
      }
      if (e.target.closest('#vid-toggle-loop-btn')) {
        ui.videoLoopActive = !ui.videoLoopActive;
        renderVideoStudioPage();
        return;
      }
      const seekRow = e.target.closest('[data-vid-seek]');
      if (seekRow && !e.target.closest('button')) {
        const sec = parseFloat(seekRow.dataset.vidSeek || '0');
        ui.videoLineIdx = parseInt(seekRow.dataset.vidRow || '0', 10);
        const lv = document.getElementById('local-video-player');
        if (lv) {
          lv.currentTime = sec;
          lv.play().catch(() => {});
        } else if (_ytPlayer && typeof _ytPlayer.seekTo === 'function') {
          _ytPlayer.seekTo(sec, true);
          _ytPlayer.playVideo();
        }
        updateLiveCaptionUI(sec + 0.05);
        return;
      }
      if (e.target.closest('#load-custom-yt-btn')) {
        const inp = document.getElementById('custom-yt-input');
        const val = inp ? inp.value.trim() : '';
        const ytId = extractYoutubeId(val);
        if (!ytId) { showToast('Link YouTube chưa hợp lệ, bạn dán lại link nhé!'); return; }
        ui.customYoutubeUrl = val;
        ui.customYoutubeId = ytId;
        ui.localVideoUrl = '';
        ui.localVideoName = '';
        const lSel = document.getElementById('vid-lang-select');
        ui.customVideoLang = lSel ? lSel.value : (ui.customVideoLang || 'en');
        ui.customVideoLines = null;
        ui.videoLineIdx = 0;
        _ytMountedVideoId = null;
        renderVideoStudioPage();
        fetchYoutubeTranscript(ytId);
        return;
      }
      if (e.target.closest('#reset-custom-yt-btn')) {
        ui.customYoutubeId = '';
        ui.localVideoUrl = '';
        ui.localVideoName = '';
        ui.customYoutubeUrl = '';
        ui.customVideoLines = null;
        ui.customVideoLang = null;
        _ytMountedVideoId = null;
        renderVideoStudioPage();
        return;
      }
      const vLookupBtn = e.target.closest('[data-vid-lookup]');
      if (vLookupBtn) {
        const w = vLookupBtn.dataset.vidLookup;
        const vid = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || VIDEO_STUDIO_LESSONS[0];
        ui.videoLookupWord = { word: w, meaning: (vid.vocab && vid.vocab[w]) || 'Từ vựng trong bài' };
        renderVideoStudioPage();
        return;
      }
      if (e.target.closest('#vid-save-word-btn') && ui.videoLookupWord) {
        const entry = `- ${ui.videoLookupWord.word}: ${ui.videoLookupWord.meaning}`;
        state.notebook = state.notebook ? (state.notebook + '\n' + entry) : entry;
        saveState();
        showToast(`Đã lưu "${ui.videoLookupWord.word}" vào Sổ tay!`);
        return;
      }
      const vLoopBtn = e.target.closest('[data-vid-loop]');
      if (vLoopBtn) {
        const idx = parseInt(vLoopBtn.dataset.vidLoop, 10);
        const vid = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || VIDEO_STUDIO_LESSONS[0];
        const ln = vid.lines[idx];
        if (ln) {
          ui.videoLineIdx = idx;
          let count = 0;
          const playOnce = () => {
            if (count >= 3) return;
            count++;
            if (vid.lang === 'zh') speakChinese(ln.text);
            else speakText(ln.text);
            if (count < 3) setTimeout(playOnce, 2600);
          };
          playOnce();
          showToast('Đang đọc lặp lại 3 lần...');
        }
        return;
      }
      const vNavBtn = e.target.closest('[data-vid-line-nav]');
      if (vNavBtn) {
        const delta = parseInt(vNavBtn.dataset.vidLineNav, 10);
        const vid = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || VIDEO_STUDIO_LESSONS[0];
        ui.videoLineIdx = ((ui.videoLineIdx || 0) + delta + vid.lines.length) % vid.lines.length;
        ui.videoShadowResult = null;
        ui.videoDictationResult = null;
        ui.videoDictationInput = '';
        ui.videoQuizPicked = null;
        renderVideoStudioPage();
        return;
      }
      if (e.target.closest('#vid-shadow-mic-btn')) {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) { showToast('Trình duyệt chưa hỗ trợ Micro (hãy dùng Chrome hoặc Edge).'); return; }
        const vid = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || VIDEO_STUDIO_LESSONS[0];
        const ln = vid.lines[ui.videoLineIdx || 0];
        showToast('Đang lắng nghe... Hãy đọc theo câu mẫu!');
        startSpeechCapture(ln.text, (res) => {
          if (res && res.transcript) {
            const scored = scoreSentenceMatch(ln.text, res.transcript, vid.lang === 'zh');
            ui.videoShadowResult = { ...scored, transcript: res.transcript };
            if (scored.pct >= 70) addXp(10, 'Shadowing chuẩn (+10 XP)');
          }
          renderVideoStudioPage();
        }, vid.lang === 'zh' ? 'zh-CN' : 'en-US');
        renderVideoStudioPage();
        return;
      }
      if (e.target.closest('#vid-check-dictation-btn')) {
        const inp = document.getElementById('vid-dictation-input');
        const val = inp ? inp.value : '';
        ui.videoDictationInput = val;
        const vid = VIDEO_STUDIO_LESSONS.find(v => v.id === ui.videoId) || VIDEO_STUDIO_LESSONS[0];
        const ln = vid.lines[ui.videoLineIdx || 0];
        ui.videoDictationResult = scoreSentenceMatch(ln.text, val, vid.lang === 'zh');
        if (ui.videoDictationResult.pct >= 80) addXp(10, 'Nghe chép chính xác (+10 XP)');
        renderVideoStudioPage();
        return;
      }
      const vQuizBtn = e.target.closest('[data-vid-quiz-pick]');
      if (vQuizBtn) {
        ui.videoQuizPicked = parseInt(vQuizBtn.dataset.vidQuizPick, 10);
        if (vQuizBtn.dataset.vidQuizCorrect === '1') addXp(10, 'Trả lời đúng Quiz Video (+10 XP)');
        renderVideoStudioPage();
        return;
      }

      // Chinese Module actions
      const zhToneRowBtn = e.target.closest('[data-zh-tone-row]');
      if (zhToneRowBtn) { e.stopPropagation(); playChineseToneRow(zhToneRowBtn.dataset.zhToneRow); return; }
      const spkZh = e.target.closest('[data-speak-zh]');
      if (spkZh) { e.stopPropagation(); speakChinese(spkZh.dataset.speakZh); return; }
      const spkZhSlow = e.target.closest('[data-speak-zh-slow]');
      if (spkZhSlow) { e.stopPropagation(); speakChinese(spkZhSlow.dataset.speakZhSlow, 0.65); return; }
      const zhTopicBtn = e.target.closest('[data-zh-topic]');
      if (zhTopicBtn) {
        ui.zhTopicId = zhTopicBtn.dataset.zhTopic;
        ui.zhCardIdx = 0; ui.zhFlipped = false;
        if (ui.zhMode === 'quiz') startChineseQuiz();
        renderChinesePage();
        return;
      }
      const zhModeBtn = e.target.closest('[data-zh-mode]');
      if (zhModeBtn) {
        ui.zhMode = zhModeBtn.dataset.zhMode;
        ui.zhCardIdx = 0; ui.zhFlipped = false;
        if (ui.zhMode === 'quiz') startChineseQuiz();
        renderChinesePage();
        return;
      }
      if (e.target.closest('#zh-toggle-pinyin')) { ui.zhShowPinyin = !ui.zhShowPinyin; renderChinesePage(); return; }
      if (e.target.closest('#zh-flip-btn')) { ui.zhFlipped = true; renderChinesePage(); return; }
      if (e.target.closest('#zh-prev-card')) { ui.zhCardIdx = Math.max(0, (ui.zhCardIdx || 0) - 1); ui.zhFlipped = false; renderChinesePage(); return; }
      if (e.target.closest('#zh-next-card')) {
        const curTopic = ZH_TOPICS.find(t => t.id === ui.zhTopicId) || ZH_TOPICS[0];
        if ((ui.zhCardIdx || 0) + 1 >= curTopic.words.length) {
          markZhStep(curTopic.id, 'cards', 15, 'Hoàn thành học thẻ Tiếng Trung! (+3 ⭐)');
          ui.zhMode = 'overview';
          ui.zhCardIdx = 0;
        } else {
          ui.zhCardIdx = (ui.zhCardIdx || 0) + 1;
        }
        ui.zhFlipped = false;
        renderChinesePage();
        return;
      }
      const zhTrackBtn = e.target.closest('[data-zh-track]');
      if (zhTrackBtn) { ui.zhTrack = zhTrackBtn.dataset.zhTrack; ui.zhMode = 'overview'; renderChinesePage(); return; }
      const zhGramBtn = e.target.closest('[data-zh-gram]');
      if (zhGramBtn) { ui.zhGrammarId = zhGramBtn.dataset.zhGram; renderChinesePage(); return; }
      const zhStartSpk = e.target.closest('[data-zh-start-speak]');
      if (zhStartSpk) { startChineseSpeakingSession(zhStartSpk.dataset.zhStartSpeak); return; }
      const zhStartLis = e.target.closest('[data-zh-start-listen]');
      if (zhStartLis) { startChineseListeningSession(zhStartLis.dataset.zhStartListen); return; }
      const zhListenOpt = e.target.closest('[data-zh-listen-opt]');
      if (zhListenOpt && typeof ui.zhListenPicked !== 'number') {
        const idx = Number(zhListenOpt.dataset.zhListenOpt);
        ui.zhListenPicked = idx;
        if (ui.zhListenItems[ui.zhListenIdx].options[idx].isCorrect) ui.zhListenScore += 1;
        renderChinesePage();
        return;
      }
      if (e.target.closest('#zh-next-listen')) {
        if (ui.zhListenIdx + 1 < ui.zhListenItems.length) {
          ui.zhListenIdx += 1; ui.zhListenPicked = null;
          renderChinesePage();
          speakChinese(ui.zhListenItems[ui.zhListenIdx].word.hanzi);
        } else {
          ui.zhListenDone = true;
          markZhStep(ui.zhTopicId, 'listening', 15, 'Hoàn thành Luyện nghe Tiếng Trung! (+2 ⭐)');
          renderChinesePage();
        }
        return;
      }
      if (e.target.closest('#zh-mic-btn')) {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) { showToast('Trình duyệt chưa hỗ trợ Micro (hãy dùng Chrome hoặc Edge).'); return; }
        const curTopic = ZH_TOPICS.find(t => t.id === ui.zhTopicId) || ZH_TOPICS[0];
        const w = curTopic.words[ui.zhSpeakIdx || 0];
        try {
          const rec = new Ctor();
          rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 1;
          ui.isListening = true; renderChinesePage();
          rec.onresult = (ev) => {
            const transcript = ev.results?.[0]?.[0]?.transcript || '';
            ui.isListening = false;
            const matched = transcript.includes(w.hanzi) || normalizeText(transcript) === normalizeText(w.hanzi);
            ui.zhSpeakEval = { transcript, matched };
            if (matched) addXp(10, 'Phát âm tiếng Trung chuẩn lắm! (+10 XP)');
            renderChinesePage();
          };
          rec.onerror = () => { ui.isListening = false; showToast('Chưa nghe rõ giọng đọc, hãy thử lại!'); renderChinesePage(); };
          rec.start();
        } catch (err) { ui.isListening = false; }
        return;
      }
      if (e.target.closest('#zh-speak-next')) {
        const curTopic = ZH_TOPICS.find(t => t.id === ui.zhTopicId) || ZH_TOPICS[0];
        if ((ui.zhSpeakIdx || 0) + 1 >= curTopic.words.length) {
          markZhStep(curTopic.id, 'speaking', 20, 'Hoàn thành Luyện nói Tiếng Trung! (+2 ⭐)');
          ui.zhMode = 'overview';
        } else {
          ui.zhSpeakIdx = (ui.zhSpeakIdx || 0) + 1;
          ui.zhSpeakEval = null;
        }
        renderChinesePage();
        return;
      }
      const zhToggle = e.target.closest('[data-zh-toggle]');
      if (zhToggle) {
        const id = zhToggle.dataset.zhToggle;
        if (!Array.isArray(state.zhLearnedIds)) state.zhLearnedIds = [];
        if (state.zhLearnedIds.includes(id)) {
          state.zhLearnedIds = state.zhLearnedIds.filter(x => x !== id);
          saveState();
        } else {
          state.zhLearnedIds.push(id);
          addXp(10, 'Đã thuộc thêm 1 từ Tiếng Trung! (+10 XP)');
        }
        renderChinesePage();
        return;
      }
      const zhOpt = e.target.closest('[data-zh-opt]');
      if (zhOpt && typeof ui.zhQuizPicked !== 'number') {
        const idx = Number(zhOpt.dataset.zhOpt);
        ui.zhQuizPicked = idx;
        if (ui.zhQuizItems[ui.zhQuizIdx].options[idx].isCorrect) ui.zhQuizScore += 1;
        renderChinesePage();
        return;
      }
      if (e.target.closest('#zh-next-quiz')) {
        if (ui.zhQuizIdx + 1 < ui.zhQuizItems.length) { ui.zhQuizIdx += 1; ui.zhQuizPicked = null; }
        else {
          ui.zhQuizDone = true;
          if (ui.zhQuizScore >= 4) {
            markZhStep(ui.zhTopicId, 'quiz', 20, 'Vượt qua Trắc nghiệm Tiếng Trung! (+3 ⭐)');
            if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 65, origin: { y: 0.7 } });
          } else {
            addXp(ui.zhQuizScore * 5, `Hoàn thành Trắc nghiệm Tiếng Trung! (+${ui.zhQuizScore * 5} XP)`);
          }
        }
        renderChinesePage();
        return;
      }
      if (e.target.closest('#zh-restart-quiz')) { startChineseQuiz(); renderChinesePage(); return; }
      const zhPlayDlg = e.target.closest('[data-zh-play-dlg]');
      if (zhPlayDlg) {
        const d = ZH_DIALOGUES.find(x => x.id === zhPlayDlg.dataset.zhPlayDlg);
        if (d) {
          let i = 0;
          const playNext = () => {
            if (i >= d.lines.length) return;
            const text = d.lines[i].zh; i += 1;
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = state.speechRate;
              u.onend = () => setTimeout(playNext, 450);
              window.speechSynthesis.speak(u);
            }
          };
          playNext();
        }
        return;
      }

      // AI Teacher actions
      const aiLangBtn = e.target.closest('[data-ai-lang]');
      if (aiLangBtn) {
        ui.aiLang = aiLangBtn.dataset.aiLang === 'zh' ? 'zh' : 'en';
        const list = getActiveAiScenarios();
        initAiChatForScenario(list[0].id);
        renderAiTutorPage();
        if (ui.aiAutoSpeak) {
          if (ui.aiLang === 'zh') speakChinese(list[0].greetingZh);
          else speakText(list[0].greetingEn);
        }
        return;
      }
      const aiScBtn = e.target.closest('[data-ai-scenario]');
      if (aiScBtn) {
        initAiChatForScenario(aiScBtn.dataset.aiScenario);
        renderAiTutorPage();
        const list = getActiveAiScenarios();
        const sc = list.find(s => s.id === ui.aiScenarioId);
        if (sc && ui.aiAutoSpeak) {
          if (ui.aiLang === 'zh') speakChinese(sc.greetingZh);
          else speakText(sc.greetingEn);
        }
        return;
      }
      const aiSugBtn = e.target.closest('[data-ai-suggest]');
      if (aiSugBtn) { sendAiMessage(aiSugBtn.dataset.aiSuggest); return; }
      if (e.target.closest('#ai-send-btn')) {
        const inp = document.getElementById('ai-chat-input');
        sendAiMessage(inp ? inp.value : ui.aiInput);
        return;
      }
      if (e.target.closest('#ai-mic-btn')) {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) { showToast('Trình duyệt chưa hỗ trợ Micro (hãy dùng Chrome hoặc Edge).'); return; }
        const isZh = ui.aiLang === 'zh';
        showToast(isZh ? 'Đang lắng nghe... Hãy nói câu tiếng Trung của bạn!' : 'Đang lắng nghe... Hãy nói câu tiếng Anh của bạn!');
        startSpeechCapture(isZh ? '你好' : 'hello', (res) => {
          if (res && res.transcript) {
            sendAiMessage(res.transcript);
          } else {
            renderAiTutorPage();
          }
        }, isZh ? 'zh-CN' : 'en-US');
        renderAiTutorPage();
        return;
      }
      if (e.target.closest('#ai-toggle-autospeak')) { ui.aiAutoSpeak = !ui.aiAutoSpeak; renderAiTutorPage(); return; }
      if (e.target.closest('#ai-toggle-vi')) { ui.aiShowVi = !ui.aiShowVi; renderAiTutorPage(); return; }
      if (e.target.closest('#ai-restart-chat')) { initAiChatForScenario(ui.aiScenarioId); renderAiTutorPage(); return; }
      if (e.target.closest('#ai-save-key-btn')) {
        const inp = document.getElementById('ai-gemini-key-input');
        state.geminiApiKey = inp ? inp.value.trim() : '';
        saveState();
        renderAiTutorPage();
        showToast(state.geminiApiKey ? 'Đã lưu Gemini API Key! Cô Sarah đã sẵn sàng trò chuyện tự do.' : 'Đã xóa Key, dùng Chế độ Cô giáo miễn phí.');
        return;
      }

      // 10K Vocab Bank actions
      const bankSizeBtn = e.target.closest('[data-bank-size]');
      if (bankSizeBtn) { state.bankDailySize = Number(bankSizeBtn.dataset.bankSize); ui.bankDay = 1; ui.bankPage = 1; saveState(); renderBankPage(); return; }
      if (e.target.closest('#bank-prev-day')) { ui.bankDay = Math.max(1, (ui.bankDay || 1) - 1); ui.bankPage = 1; renderBankPage(); return; }
      if (e.target.closest('#bank-next-day')) { ui.bankDay = (ui.bankDay || 1) + 1; ui.bankPage = 1; renderBankPage(); return; }
      const bankModeBtn = e.target.closest('[data-bank-mode]');
      if (bankModeBtn) { ui.bankViewMode = bankModeBtn.dataset.bankMode; ui.bankSearch = ''; ui.bankPage = 1; renderBankPage(); return; }
      const bankFilterBtn = e.target.closest('[data-bank-filter]');
      if (bankFilterBtn) { ui.bankFilter = bankFilterBtn.dataset.bankFilter; ui.bankPage = 1; renderBankPage(); return; }
      if (e.target.closest('#bank-prev-page')) { ui.bankPage = Math.max(1, (ui.bankPage || 1) - 1); renderBankPage(); return; }
      if (e.target.closest('#bank-next-page')) { ui.bankPage = (ui.bankPage || 1) + 1; renderBankPage(); return; }
      const bankLangBtn = e.target.closest('[data-bank-lang]');
      if (bankLangBtn) { ui.bankLang = bankLangBtn.dataset.bankLang; ui.bankDay = 1; ui.bankPage = 1; ui.bankFilter = 'all'; ui.bankSearch = ''; renderBankPage(); return; }
      const bankToggle = e.target.closest('[data-bank-toggle]');
      if (bankToggle) {
        const id = bankToggle.dataset.bankToggle;
        const arrKey = ui.bankLang === 'zh' ? 'zhBankLearnedIds' : 'bankLearnedIds';
        if (!Array.isArray(state[arrKey])) state[arrKey] = [];
        if (state[arrKey].includes(id)) {
          state[arrKey] = state[arrKey].filter(x => x !== id);
          saveState();
        } else {
          state[arrKey].push(id);
          addXp(5, 'Đã thuộc thêm 1 từ giao tiếp! (+5 XP)');
        }
        renderBankPage();
        return;
      }
      if (e.target.closest('#bank-study-day-btn')) {
        const bank = getFullVocabBank();
        const sz = state.bankDailySize || 15;
        const start = ((ui.bankDay || 1) - 1) * sz;
        const words = bank.slice(start, start + sz);
        startCardSession(null, words, `Kho Giao Tiếp · Ngày ${ui.bankDay || 1} (${words.length} từ)`);
        return;
      }
      if (e.target.closest('#bank-sample-csv-btn')) {
        const csv = "word,ipa,pos,meaning,level\nachieve,/əˈtʃiːv/,động từ,đạt được,B1\nbenefit,/ˈbenɪfɪt/,danh từ,lợi ích,B1\ncommunicate,/kəˈmjuːnɪkeɪt/,động từ,giao tiếp,B1\n";
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'mau_nap_10000_tu.csv'; a.click(); URL.revokeObjectURL(url);
        showToast('Đã tải tệp mẫu CSV! Bạn có thể thêm hàng nghìn từ rồi nạp lên.');
        return;
      }

      if (e.target.closest('#start-srs-due-btn')) {
        const { due } = getSrsBuckets();
        startCardSession(null, due, `Ôn tập SRS (${due.length} từ đến hạn)`);
        return;
      }
      if (e.target.closest('#start-srs-all-btn')) {
        const { due, learning, mastered } = getSrsBuckets();
        startCardSession(null, [...due, ...learning, ...mastered], 'Ôn tập toàn bộ kho SRS');
        return;
      }

      // Grammar & IPA actions
      const gramNav = e.target.closest('.grammar-nav-btn');
      if (gramNav) { ui.selectedGrammarId = gramNav.dataset.grammarId; renderGrammarTrack(); refreshIcons(); return; }
      const gramOpt = e.target.closest('.gram-opt-btn');
      if (gramOpt) {
        const lesson = GRAMMAR_LESSONS.find(l => l.id === ui.selectedGrammarId);
        if (!lesson) return;
        const qIdx = Number(gramOpt.dataset.gramQ);
        const optIdx = Number(gramOpt.dataset.gramOpt);
        if (!ui.grammarAnswers[lesson.id]) ui.grammarAnswers[lesson.id] = {};
        ui.grammarAnswers[lesson.id][qIdx] = optIdx;
        if (lesson.quiz.every((q, i) => ui.grammarAnswers[lesson.id][i] === q.answer) && !state.completedGrammar.includes(lesson.id)) {
          state.completedGrammar.push(lesson.id);
          addXp(25, `Hoàn thành ${lesson.number} Ngữ pháp! (+5 ⭐)`);
          if (typeof confetti === 'function') confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
        }
        renderGrammarTrack(); refreshIcons(); return;
      }
      const ipaFilter = e.target.closest('.ipa-filter-btn'); if (ipaFilter) { ui.ipaCategory = ipaFilter.dataset.ipaCat; renderIpaTrack(); refreshIcons(); return; }
      const ipaCard = e.target.closest('.ipa-card'); if (ipaCard) { ui.selectedIpaId = ipaCard.dataset.ipaId; renderIpaTrack(); refreshIcons(); return; }
      const ipaMasterBtn = e.target.closest('#toggle-ipa-master-btn');
      if (ipaMasterBtn) {
        const id = ipaMasterBtn.dataset.ipaMaster;
        if (state.masteredIpa.includes(id)) { state.masteredIpa = state.masteredIpa.filter(x => x !== id); saveState(); updateHeader(); showToast('Đã bỏ đánh dấu.'); }
        else { state.masteredIpa.push(id); addXp(10, 'Đã nắm thêm 1 âm IPA! (+1 ⭐)'); }
        renderIpaTrack(); refreshIcons(); return;
      }
    });

    // Inputs & File Import
    document.addEventListener('input', (e) => {
      if (e.target.id === 'typing-sentence-input') {
        ui.typingInput = e.target.value;
        const { all } = getTypingTopics(ui.typingLang || 'en');
        const tp = all.find(t => t.id === ui.typingActiveTopicId);
        const box = document.getElementById('typing-live-feedback');
        if (tp && box) {
          const sent = tp.sentences[ui.typingSentenceIdx || 0];
          box.innerHTML = renderLiveTypingTokens(sent.target, ui.typingInput, ui.typingLang === 'zh');
        }
        return;
      }
      if (e.target.id === 'notebook-textarea') { state.notebook = e.target.value; saveState(); }
      if (e.target.id === 'card-recall-input' && ui.session) ui.session.typedValue = e.target.value;
      if (e.target.id === 'dictation-input' && ui.session) ui.session.inputVal = e.target.value;
      if (e.target.id === 'ai-chat-input') { ui.aiInput = e.target.value; }
      if (e.target.id === 'bank-search-input') { ui.bankSearch = e.target.value; ui.bankPage = 1; renderBankPage(); const inp = document.getElementById('bank-search-input'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'dash-nick-input') { try { localStorage.setItem('engstart_dash_nick', (e.target.value || '').trim().slice(0, 24)); } catch {} return; }
      if (e.target.id === 'ipa-speed-select' && ui.ipaPractice) { stopIpaAudio(); ui.ipaPractice.speed = Number(e.target.value) || 1; return; }
      if (e.target.id === 'vid-lang-select') {
        ui.customVideoLang = e.target.value === 'zh' ? 'zh' : 'en';
        return;
      }
      if (e.target.id === 'vid-sub-mode-select') {
        ui.videoSubMode = e.target.value;
        if (ui.videoSubMode === 'srt') {
          const fInp = document.getElementById('upload-srt-input');
          if (fInp) fInp.click();
        }
        return;
      }
      if (e.target.id === 'upload-local-video-input' && e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        if (ui.localVideoUrl) { try { URL.revokeObjectURL(ui.localVideoUrl); } catch {} }
        ui.localVideoUrl = URL.createObjectURL(f);
        ui.localVideoName = f.name;
        ui.customYoutubeId = '';
        renderVideoStudioPage();
        showToast(`Đã tải video "${f.name}" — bạn có thể nạp thêm file .SRT/.VTT để chữ chạy đồng bộ!`);
        e.target.value = '';
        return;
      }
      if (e.target.id === 'upload-srt-input' && e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const parsed = parseSrtOrVtt(ev.target.result || '');
          if (!parsed.length) { showToast('File phụ đề .SRT/.VTT không đúng định dạng!'); return; }
          ui.customVideoLines = parsed;
          ui.videoLineIdx = 0;
          ui.videoMode = 'subs';
          renderVideoStudioPage();
          showToast(`Đã nạp ${parsed.length} dòng phụ đề chạy đồng bộ!`);
        };
        reader.readAsText(f);
        e.target.value = '';
        return;
      }
      if (e.target.id === 'custom-avatar-input' && e.target.files && e.target.files[0]) {
        handleCustomAvatarFile(e.target.files[0]);
        e.target.value = '';
        return;
      }
      if (e.target.id === 'bank-import-input') {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const raw = String(reader.result || '').trim();
            let added = [];
            if (file.name.endsWith('.json') || raw.startsWith('[')) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) {
                arr.forEach(item => {
                  if (Array.isArray(item) && item[0]) added.push({ en: String(item[0]), ipa: String(item[1]||''), pos: String(item[2]||''), vi: String(item[3]||''), level: String(item[4]||'B1') });
                  else if (item && item.en) added.push({ en: String(item.en), ipa: String(item.ipa||''), pos: String(item.pos||''), vi: String(item.vi||item.meaning||''), level: String(item.level||'B1') });
                });
              }
            } else {
              const lines = raw.split(/\r?\n/).filter(Boolean);
              lines.forEach((line, idx) => {
                const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (idx === 0 && cols[0].toLowerCase() === 'word') return;
                if (cols.length >= 2 && cols[0]) {
                  if (cols.length >= 4) added.push({ en: cols[0], ipa: cols[1], pos: cols[2], vi: cols[3], level: cols[4] || 'B1' });
                  else added.push({ en: cols[0], ipa: '', pos: 'giao tiếp', vi: cols[1], level: 'B1' });
                }
              });
            }
            const targetKey = ui.bankLang === 'zh' ? 'zhCustomBankWords' : 'customBankWords';
            if (!Array.isArray(state[targetKey])) state[targetKey] = [];
            state[targetKey] = state[targetKey].concat(added.slice(0, 10000));
            saveState();
            renderBankPage();
            showToast(`Đã nạp thêm ${added.length} từ vào Kho Giao Tiếp!`);
          } catch (err) {
            showToast('Tệp CSV/JSON không đúng định dạng.');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
        return;
      }
      if (e.target.id === 'import-json-input') {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            state = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...parsed };
            saveState();
            updateHeader();
            showMainPage('roadmap');
            showToast('Đã khôi phục tiến độ từ tệp JSON!');
          } catch (err) {
            showToast('Tệp JSON không hợp lệ.');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Enter' && e.target.id === 'ai-chat-input') { e.preventDefault(); sendAiMessage(e.target.value); }
        else if (e.key === 'Enter' && e.target.id === 'card-recall-input') { e.preventDefault(); checkCardRecall(); }
        else if (e.key === 'Enter' && e.target.id === 'dictation-input') {
          e.preventDefault();
          if (ui.session && ui.session.status === 'correct') { const b = document.getElementById('dictation-next-btn'); if (b) b.click(); }
          else checkDictation();
        }
        return;
      }
      const s = ui.session;
      if (!s || (s.type !== 'cards' && s.type !== 'srs_cards') || s.done) return;
      const w = s.items[s.idx];
      if (!w) return;
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); speakText(w.en); }
      else if (e.code === 'Space') { e.preventDefault(); s.flipped = !s.flipped; renderStudySession(); }
      else if (s.flipped && ['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); advanceCardWithSrs(Number(e.key) - 1); }
    });

    window.addEventListener('DOMContentLoaded', () => {
      if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
      updateHeader();
      showMainPage(state.mainNav || 'roadmap');
      setupAuthSession();
    });
