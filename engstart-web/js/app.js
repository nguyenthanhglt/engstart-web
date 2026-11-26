// ==================== PERSISTED STATE ====================
    const STORAGE_KEY = 'engstart_pro_v3';
    const TODAY_STR = () => new Date().toISOString().slice(0, 10);
    const DAY_MS = 24 * 60 * 60 * 1000;

    const DEFAULT_STATE = {
      mainNav: 'roadmap',
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
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('text-indigo-600', active);
        btn.classList.toggle('shadow-xs', active);
        btn.classList.toggle('text-slate-600', !active);
      });
    }

    // ==================== NAVIGATION ====================
    function showMainPage(navName) {
      ui.session = null;
      setZenMode(false);
      state.mainNav = navName;
      if (navName === 'ipa') state.activeTrack = 'ipa';
      saveState();

      document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
      if (navName === 'review') {
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
      } else {
        document.getElementById('page-roadmap').classList.remove('hidden');
        renderRoadmapPage();
      }
      updateHeader();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      refreshIcons();
    }

    function switchTrack(trackName) {
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
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
              <div class="text-2xl font-extrabold">${item.symbol}</div>
              <div class="text-xs font-medium mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}">${item.name}</div>
              <div class="text-[11px] mt-2 font-semibold ${isSelected ? 'text-white/90' : 'text-indigo-600'}">VD: ${item.examples[0].en}</div>
            </button>
          `;
        }).join('');
      }
      const current = IPA_DATA.find(i => i.id === ui.selectedIpaId) || IPA_DATA[0];
      const isMastered = state.masteredIpa.includes(current.id);
      const panel = document.getElementById('ipa-detail-panel');
      if (!panel) return;
      panel.innerHTML = `
        <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div class="inline-flex items-center gap-2">
            <span class="text-3xl font-extrabold text-indigo-600">${current.symbol}</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">${current.name}</span>
          </div>
          <button type="button" data-speak="${current.examples[0].en}" class="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4"></i> Nghe mẫu</button>
        </div>
        <div class="space-y-4 py-4">
          <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100"><div class="text-xs font-bold text-emerald-800 mb-1">Mẹo đặt khẩu hình</div><p class="text-sm text-slate-700">${current.tip}</p></div>
          <div class="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100"><div class="text-xs font-bold text-amber-800 mb-1">Lỗi hay gặp</div><p class="text-sm text-slate-700">${current.mistake}</p></div>
          <div class="space-y-2">
            ${current.examples.map(ex => `<div class="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"><div><span class="font-bold text-slate-900">${ex.en}</span> <span class="text-xs text-indigo-600">${ex.ipa}</span> <span class="text-xs text-slate-500">— ${ex.vi}</span></div><div class="flex items-center gap-1.5"><button type="button" data-speak="${ex.en}" class="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600"><i data-lucide="volume-2" class="w-4 h-4"></i></button><button type="button" data-speak-slow="${ex.en}" class="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600">Chậm</button></div></div>`).join('')}
          </div>
        </div>
        <button type="button" id="toggle-ipa-master-btn" data-ipa-master="${current.id}" class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold ${isMastered ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}">${isMastered ? 'Đã nắm âm này (Bỏ đánh dấu)' : 'Đánh dấu đã nắm âm này (+1 ⭐)'}</button>
      `;
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
    function renderReviewPage() {
      const el = document.getElementById('page-review');
      if (!el) return;
      const { due, learning, mastered } = getSrsBuckets();

      el.innerHTML = `
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

    function getActiveGeminiKey() {
      const cfgKey = (window.ENGSTART_CONFIG && window.ENGSTART_CONFIG.GEMINI_API_KEY) || '';
      return (state.geminiApiKey || cfgKey || '').trim();
    }

    function initAiChatForScenario(scenarioId) {
      const sc = AI_SCENARIOS.find(s => s.id === scenarioId) || AI_SCENARIOS[0];
      ui.aiScenarioId = sc.id;
      ui.aiTurnIdx = 0;
      ui.aiMessages = [
        { role: 'ai', en: sc.greetingEn, vi: sc.greetingVi, tip: '', suggestions: sc.suggestions }
      ];
      ui.aiLoading = false;
      ui.aiInput = '';
    }

    async function sendAiMessage(text) {
      const clean = (text || '').trim();
      if (!clean || ui.aiLoading) return;
      const sc = AI_SCENARIOS.find(s => s.id === ui.aiScenarioId) || AI_SCENARIOS[0];
      const grammarTip = checkBasicVietnameseMistakes(clean);

      ui.aiMessages.push({ role: 'user', en: clean, tip: grammarTip });
      ui.aiInput = '';
      ui.aiLoading = true;
      renderAiTutorPage();

      const apiKey = getActiveGeminiKey();
      if (apiKey) {
        try {
          const historyText = ui.aiMessages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'Teacher Sarah'}: ${m.en}`).join('\n');
          const prompt = `You are Teacher Sarah, a warm, encouraging English teacher helping a Vietnamese beginner (A0-A2) practice the topic "${sc.title}".\nConversation so far:\n${historyText}\n\nReply strictly in JSON with keys: "en" (short, simple, natural English reply of 1-2 sentences ending with an easy follow-up question), "vi" (natural Vietnamese translation of your reply), "tip" (short Vietnamese grammar/wording correction if the student made a mistake, or "" if good), "suggestions" (array of 3 short simple English sample replies the student can say next). Return ONLY valid JSON.`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
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
          return;
        } catch (err) {
          showToast('Chưa kết nối được Gemini API, chuyển về Chế độ Cô giáo thông minh miễn phí.');
        }
      }

      // Built-in Smart Offline Tutor Fallback (100% Free, instant, zero key needed!)
      setTimeout(() => {
        const turn = sc.turns[ui.aiTurnIdx] || sc.turns[sc.turns.length - 1];
        ui.aiTurnIdx = Math.min(ui.aiTurnIdx + 1, sc.turns.length - 1);
        ui.aiMessages.push({
          role: 'ai',
          en: turn.replyEn,
          vi: turn.replyVi,
          tip: '',
          suggestions: turn.suggestions || []
        });
        ui.aiLoading = false;
        addXp(10, 'Luyện phản xạ với Cô Sarah (+10 XP)');
        renderAiTutorPage();
        if (ui.aiAutoSpeak) speakText(turn.replyEn);
      }, 450);
    }

    function renderAiTutorPage() {
      const el = document.getElementById('page-tutor');
      if (!el) return;
      if (!ui.aiMessages || !ui.aiMessages.length) initAiChatForScenario(ui.aiScenarioId || 'intro');
      const sc = AI_SCENARIOS.find(s => s.id === ui.aiScenarioId) || AI_SCENARIOS[0];
      const lastAi = [...ui.aiMessages].reverse().find(m => m.role === 'ai');
      const hasGemini = Boolean(getActiveGeminiKey());

      el.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Sidebar: Scenarios & AI Settings -->
          <aside class="lg:col-span-4 space-y-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
              <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <i data-lucide="bot" class="w-6 h-6"></i>
                </div>
                <div>
                  <div class="font-extrabold text-slate-900 text-sm">Cô giáo AI Sarah</div>
                  <div class="text-[11px] font-semibold ${hasGemini ? 'text-emerald-600' : 'text-indigo-600'}">
                    ${hasGemini ? 'Đang bật Gemini AI tự do' : 'Chế độ Luyện nói miễn phí'}
                  </div>
                </div>
              </div>

              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chọn tình huống giao tiếp</div>
              <div class="space-y-1.5">
                ${AI_SCENARIOS.map(s => {
                  const active = s.id === sc.id;
                  return `
                    <button type="button" data-ai-scenario="${s.id}" class="w-full text-left p-3 rounded-xl border transition-all ${
                      active ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50/80 border-transparent hover:border-indigo-200 text-slate-800'
                    }">
                      <div class="text-xs font-bold">${s.title}</div>
                      <div class="text-[10px] mt-0.5 ${active ? 'text-indigo-200' : 'text-slate-500'}">${s.level}</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Optional Gemini API Key Box -->
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i> Mở khóa trò chuyện tự do (Tuỳ chọn)</span>
              </div>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Không cần Key bạn vẫn luyện theo 5 tình huống mẫu bên trên. Nếu muốn hỏi đáp tự do mọi chủ đề với Gemini AI, dán API Key miễn phí từ Google AI Studio vào đây:
              </p>
              <div class="flex gap-1.5">
                <input type="password" id="ai-gemini-key-input" value="${(state.geminiApiKey || '').replace(/"/g, '&quot;')}" placeholder="AIzaSy... (tuỳ chọn)" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-500" />
                <button type="button" id="ai-save-key-btn" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">Lưu</button>
              </div>
            </div>
          </aside>

          <!-- Right Main Chat Area -->
          <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[540px] max-h-[680px]">
            <!-- Chat Header -->
            <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="font-extrabold text-slate-900 text-base">${sc.title}</h2>
                <p class="text-xs text-slate-500">Bấm Micro để nói tiếng Anh hoặc gõ câu trả lời bên dưới</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="ai-toggle-autospeak" class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${ui.aiAutoSpeak ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> ${ui.aiAutoSpeak ? 'Tự đọc: Bật' : 'Tự đọc: Tắt'}
                </button>
                <button type="button" id="ai-toggle-vi" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
                  ${ui.aiShowVi ? 'Ẩn dịch Việt' : 'Hiện dịch Việt'}
                </button>
                <button type="button" id="ai-restart-chat" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600" title="Bắt đầu lại cuộc trò chuyện">
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Messages List -->
            <div id="ai-chat-scroll" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              ${ui.aiMessages.map(m => {
                if (m.role === 'ai') {
                  return `
                    <div class="flex items-start gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">S</div>
                      <div class="max-w-[85%] space-y-1.5">
                        <div class="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 space-y-1.5">
                          <div class="flex items-start justify-between gap-2">
                            <div class="text-sm font-bold text-slate-900 leading-relaxed">${m.en}</div>
                            <button type="button" data-speak="${m.en.replace(/"/g, '&quot;')}" class="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 shrink-0" title="Nghe cô giáo đọc">
                              <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                          ${(ui.aiShowVi && m.vi) ? `<div class="text-xs text-slate-500">${m.vi}</div>` : ''}
                        </div>
                        ${m.tip ? `<div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">${m.tip}</div>` : ''}
                      </div>
                    </div>
                  `;
                }
                return `
                  <div class="flex flex-col items-end gap-1">
                    <div class="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 text-sm font-semibold shadow-2xs">
                      ${m.en}
                    </div>
                    ${m.tip ? `<div class="max-w-[85%] p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">${m.tip}</div>` : ''}
                  </div>
                `;
              }).join('')}
              ${ui.aiLoading ? `<div class="text-xs text-slate-400 italic pl-10">Cô Sarah đang trả lời...</div>` : ''}
            </div>

            <!-- Quick Reply Suggestions for Beginners -->
            ${(lastAi && lastAi.suggestions && lastAi.suggestions.length && !ui.aiLoading) ? `
              <div class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
                <div class="text-[11px] font-bold text-slate-400">Gợi ý câu trả lời (bấm để gửi nhanh hoặc tập nói theo):</div>
                <div class="flex flex-wrap gap-1.5">
                  ${lastAi.suggestions.map(sg => `
                    <button type="button" data-ai-suggest="${sg.replace(/"/g, '&quot;')}" class="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-colors">
                      ${sg}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Input + Mic Bar -->
            <div class="p-3.5 border-t border-slate-100 flex items-center gap-2">
              <button type="button" id="ai-mic-btn" title="Bấm để nói tiếng Anh bằng Micro" class="w-11 h-11 rounded-xl ${ui.isListening ? 'bg-rose-600 mic-recording text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'} flex items-center justify-center shrink-0 transition-all">
                <i data-lucide="mic" class="w-5 h-5"></i>
              </button>
              <input type="text" id="ai-chat-input" value="${(ui.aiInput || '').replace(/"/g, '&quot;')}" placeholder="Gõ tiếng Anh hoặc bấm Micro để nói với Cô Sarah..." autocomplete="off" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm" />
              <button type="button" id="ai-send-btn" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-1.5 shrink-0">
                Gửi <i data-lucide="send" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      refreshIcons();
      const scroller = document.getElementById('ai-chat-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }


    // ==================== CHINESE LEARNING MODULE (TIẾNG TRUNG HSK 1) ====================
    function speakChinese(text, customRate) {
      const rate = typeof customRate === 'number' ? customRate : state.speechRate;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        showToast('Trình duyệt hiện chưa hỗ trợ đọc âm thanh.');
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = rate;
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang && (v.lang.toLowerCase() === 'zh-cn' || v.lang.toLowerCase().startsWith('zh')));
        if (zhVoice) utter.voice = zhVoice;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        showToast('Không thể phát giọng đọc tiếng Trung lúc này.');
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
      const googleName = meta.full_name || meta.name || (currentAuthUser && currentAuthUser.email ? currentAuthUser.email.split('@')[0] : 'Học viên EngStart');
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



      // Chinese Module actions
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
      const aiScBtn = e.target.closest('[data-ai-scenario]');
      if (aiScBtn) {
        initAiChatForScenario(aiScBtn.dataset.aiScenario);
        renderAiTutorPage();
        const sc = AI_SCENARIOS.find(s => s.id === ui.aiScenarioId);
        if (sc && ui.aiAutoSpeak) speakText(sc.greetingEn);
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
        showToast('Đang lắng nghe... Hãy nói câu tiếng Anh của bạn!');
        startSpeechCapture('hello', (res) => {
          if (res && res.transcript) {
            sendAiMessage(res.transcript);
          } else {
            renderAiTutorPage();
          }
        });
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
      if (e.target.id === 'notebook-textarea') { state.notebook = e.target.value; saveState(); }
      if (e.target.id === 'card-recall-input' && ui.session) ui.session.typedValue = e.target.value;
      if (e.target.id === 'dictation-input' && ui.session) ui.session.inputVal = e.target.value;
      if (e.target.id === 'ai-chat-input') { ui.aiInput = e.target.value; }
      if (e.target.id === 'bank-search-input') { ui.bankSearch = e.target.value; ui.bankPage = 1; renderBankPage(); const inp = document.getElementById('bank-search-input'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }
    });

    document.addEventListener('change', (e) => {
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
