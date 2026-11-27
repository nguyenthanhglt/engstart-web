/* Pronunciation-only playback coordinator. Load EngStartPhonemePlayer first.
 * All play methods return a Promise. Ignore rejections with code CANCELED.
 * onStatus receives {type, message, kind, ...}; errors include code.
 * This controller never converts an IPA sound request into spoken words.
 */
(() => {
  'use strict';
  const failure = (code, message) => Object.assign(new Error(message), {code});
  const cancelled = () => failure('CANCELED', 'Đã dừng nghe.');
  const normalizeLang = value => String(value || '').replace(/_/g, '-').toLowerCase();
  const rateOf = value => Math.min(1.5, Math.max(.5, Number(value) || 1));

  class EngStartPronunciationController {
    constructor({manifest, onStatus = () => {}} = {}) {
      if (!window.EngStartPhonemePlayer) throw failure('PLAYER_MISSING', 'Chưa tải bộ phát âm. Hãy tải lại trang.');
      this.onStatus = onStatus;
      this._generation = 0;
      this._session = null;
      this._synth = window.speechSynthesis || null;
      this._phonemes = new window.EngStartPhonemePlayer({manifest, onStatus: event => {
        const session = this._session;
        if (!session || session.kind !== 'sound' || !this._current(session)) return;
        if (event.type === 'phoneme-playing' && event.lessonId === session.lessonId) {
          this._emit('sound-playing', 'Đang phát phần âm được gạch chân.', session);
        }
      }});
    }

    get isPlaying() { return Boolean(this._session); }

    _emit(type, message, session, extra = {}) {
      try {
        this.onStatus({type, message, kind: session?.kind, lessonId: session?.lessonId,
          accent: session?.accent, text: session?.text, ...extra});
      } catch (_) {}
    }

    _current(session) {
      return this._session === session && session.generation === this._generation;
    }

    _cancel(announce) {
      const old = this._session;
      this._generation++;
      this._session = null;
      if (old?.cancel) old.cancel();
      this._phonemes.stop();
      try { this._synth?.cancel(); } catch (_) {}
      if (announce && old) this._emit('stopped', 'Đã dừng nghe.', old);
    }

    stop() { this._cancel(true); }

    _start(kind, details = {}) {
      this._cancel(false);
      const session = {kind, generation: this._generation, cancel: null, ...details};
      this._session = session;
      this._emit('loading', kind === 'sound' ? 'Đang chuẩn bị bản thu âm riêng…' :
        kind === 'recording' ? 'Đang mở bản ghi âm của bạn…' : 'Đang tải mẫu đọc…', session);
      return session;
    }

    async _run(session, action) {
      try {
        if (!this._current(session)) throw cancelled();
        const result = await action();
        if (!this._current(session)) throw cancelled();
        this._session = null;
        this._emit(`${session.kind}-ended`, session.kind === 'sound' ? 'Đã nghe xong âm riêng.' :
          session.kind === 'recording' ? 'Đã nghe xong bản ghi âm của bạn.' : 'Đã nghe xong từ hoặc câu mẫu.', session);
        return result;
      } catch (error) {
        if (!this._current(session)) throw cancelled();
        this._session = null;
        const reason = error?.code ? error : failure('PLAYBACK_FAILED', 'Không phát được âm thanh. Hãy thử lại.');
        if (reason.code !== 'CANCELED') this._emit('error', reason.message, session, {code: reason.code});
        throw reason;
      }
    }

    playSound(lessonId, {accent = 'en-GB', rate = 1} = {}) {
      const session = this._start('sound', {lessonId, accent});
      return this._run(session, () => this._phonemes.play(lessonId, {accent, rate}));
    }

    playWord(text, {accent = 'en-GB', rate = 1} = {}) {
      const clean = String(text ?? '').trim();
      const lang = normalizeLang(accent) === 'en-gb' ? 'en-GB' : normalizeLang(accent) === 'en-us' ? 'en-US' : '';
      const session = this._start('word', {text: clean, accent: lang || accent});
      return this._run(session, async () => {
        if (!clean) throw failure('EMPTY_TEXT', 'Chưa có từ hoặc câu để nghe.');
        if (!lang) throw failure('INVALID_ACCENT', 'Hãy chọn giọng Anh–Anh hoặc Anh–Mỹ.');
        if (/^https?:$/.test(window.location?.protocol || '')) {
          const url = new URL('/api/tts', window.location.href);
          url.searchParams.set('mode', /^[a-zA-Z'-]{1,28}$/.test(clean) ? 'ipa-word' : 'phrase');
          url.searchParams.set('lang', lang);
          url.searchParams.set('text', clean);
          try {
            return await this._playMedia(session, url.href, rateOf(rate));
          } catch (error) {
            if (!this._current(session) || error?.code === 'CANCELED') throw cancelled();
          }
        }
        if (!this._current(session)) throw cancelled();
        this._emit('word-fallback', 'Mẫu đọc chưa tải được. Đang tìm giọng máy đúng biến thể đã chọn…', session);
        return this._speakBrowser(session, clean, lang, rateOf(rate));
      });
    }

    playRecording(blobURL) {
      const session = this._start('recording');
      return this._run(session, () => {
        if (!/^blob:/.test(String(blobURL || ''))) throw failure('RECORDING_MISSING', 'Chưa có bản ghi âm để nghe lại.');
        return this._playMedia(session, blobURL, 1);
      });
    }

    _playMedia(session, url, rate) {
      return new Promise((resolve, reject) => {
        let player;
        try { player = new Audio(); }
        catch (_) { reject(failure('AUDIO_UNAVAILABLE', 'Thiết bị chưa mở được âm thanh.')); return; }
        let settled = false;
        let timer = null;
        const finish = error => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          player.onplaying = player.onended = player.onerror = null;
          if (session.cancel === cancel) session.cancel = null;
          try { player.pause(); player.removeAttribute('src'); player.load(); } catch (_) {}
          if (!this._current(session)) error = cancelled();
          if (error) reject(error); else resolve({kind: session.kind, accent: session.accent});
        };
        const cancel = () => finish(cancelled());
        session.cancel = cancel;
        player.preload = 'auto';
        player.playbackRate = rate;
        player.preservesPitch = true;
        if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;
        player.onplaying = () => {
          if (!this._current(session)) { cancel(); return; }
          this._emit(`${session.kind}-playing`, session.kind === 'recording' ?
            'Đang nghe bản ghi âm của bạn.' : 'Đang phát từ hoặc câu mẫu.', session, {source: session.kind === 'recording' ? 'recording' : 'server'});
        };
        player.onended = () => finish();
        player.onerror = () => finish(failure('AUDIO_LOAD_FAILED', 'Không tải được mẫu âm thanh. Hãy thử lại.'));
        timer = setTimeout(() => finish(failure('AUDIO_TIMEOUT', 'Mẫu âm thanh chưa phản hồi. Hãy thử lại.')), 60000);
        player.src = url;
        try {
          Promise.resolve(player.play()).catch(error => finish(failure('AUDIO_PLAY_FAILED', error?.name === 'NotAllowedError' ?
            'Trình duyệt chặn âm thanh. Hãy bấm trực tiếp nút nghe một lần nữa.' : 'Không phát được mẫu âm thanh. Hãy thử lại.')));
        } catch (_) { finish(failure('AUDIO_PLAY_FAILED', 'Không mở được mẫu âm thanh trên thiết bị này.')); }
      });
    }

    _findVoice(session, accent) {
      const synth = this._synth;
      if (!synth || !window.SpeechSynthesisUtterance) return Promise.reject(failure('VOICE_UNAVAILABLE', 'Thiết bị chưa có giọng đọc dự phòng. Hãy thử nghe lại khi kết nối mạng.'));
      const read = () => { try { return synth.getVoices() || []; } catch (_) { return []; } };
      const matching = voices => voices.find(voice => normalizeLang(voice.lang) === normalizeLang(accent));
      const missing = () => failure('VOICE_UNAVAILABLE', `Chưa có giọng ${accent === 'en-GB' ? 'Anh–Anh' : 'Anh–Mỹ'} trên thiết bị. Hãy thử tải lại mẫu đọc khi có mạng.`);
      const initial = read();
      if (matching(initial)) return Promise.resolve(matching(initial));
      if (initial.length) return Promise.reject(missing());
      return new Promise((resolve, reject) => {
        let settled = false;
        let timer = null;
        const finish = (voice, error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          synth.removeEventListener?.('voiceschanged', check);
          if (session.cancel === cancel) session.cancel = null;
          if (!this._current(session)) error = cancelled();
          if (error) reject(error); else resolve(voice);
        };
        const check = () => {
          if (!this._current(session)) { finish(null, cancelled()); return; }
          const voices = read(), voice = matching(voices);
          if (voice) finish(voice);
          else if (voices.length) finish(null, missing());
        };
        const cancel = () => finish(null, cancelled());
        session.cancel = cancel;
        synth.addEventListener?.('voiceschanged', check);
        timer = setTimeout(() => { const voice = matching(read()); finish(voice, voice ? null : missing()); }, 2500);
        check();
      });
    }

    async _speakBrowser(session, text, accent, rate) {
      const voice = await this._findVoice(session, accent);
      if (!this._current(session)) throw cancelled();
      return new Promise((resolve, reject) => {
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = accent;
        utterance.voice = voice;
        utterance.rate = rate;
        let settled = false;
        let timer = null;
        const finish = error => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          utterance.onstart = utterance.onend = utterance.onerror = null;
          if (session.cancel === cancel) session.cancel = null;
          if (!this._current(session)) error = cancelled();
          if (error) reject(error); else resolve({kind: 'word', accent, source: 'browser-tts'});
        };
        const cancel = () => finish(cancelled());
        session.cancel = cancel;
        utterance.onstart = () => {
          if (!this._current(session)) { cancel(); return; }
          this._emit('word-playing', `Đang đọc bằng giọng máy ${accent === 'en-GB' ? 'Anh–Anh' : 'Anh–Mỹ'}.`, session, {source: 'browser-tts', voiceName: voice.name});
        };
        utterance.onend = () => finish();
        utterance.onerror = () => finish(failure('SPEECH_FAILED', 'Giọng máy chưa đọc được. Hãy bấm nghe lại hoặc kiểm tra âm lượng.'));
        timer = setTimeout(() => {
          if (settled || !this._current(session)) return;
          finish(failure('SPEECH_TIMEOUT', 'Giọng máy chưa phản hồi. Hãy thử lại.'));
          try { this._synth.cancel(); } catch (_) {}
        }, 60000);
        try { this._synth.speak(utterance); }
        catch (_) { finish(failure('SPEECH_FAILED', 'Không mở được giọng máy trên thiết bị này.')); }
      });
    }
  }
  window.EngStartPronunciationController = EngStartPronunciationController;
})();
