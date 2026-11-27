/* Recorded phonetic samples. This player never calls speechSynthesis. */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript?.src || location.href).href;
  const failure = (code, message) => Object.assign(new Error(message), {code});

  class EngStartPhonemePlayer {
    constructor({manifest, onStatus = () => {}} = {}) {
      this.manifest = manifest || {clips:{},accents:{}};
      this.onStatus = onStatus;
      this.session = null;
    }

    get isPlaying() { return Boolean(this.session); }

    getClip(lessonId, accent = 'en-GB') {
      const id = this.manifest.accents?.[accent]?.[lessonId];
      return id ? this.manifest.clips?.[id] || null : null;
    }

    _emit(type, message, details = {}) {
      try { this.onStatus({type, message, ...details}); } catch (_) {}
    }

    play(lessonId, {accent = 'en-GB', rate = 1} = {}) {
      this.stop();
      const clip = this.getClip(lessonId, accent);
      if (!clip?.src) return Promise.reject(failure('PHONEME_UNAVAILABLE', 'Bài này chưa có bản thu âm riêng. Nút nghe từ ví dụ vẫn nằm ở phần bên dưới.'));
      const player = new Audio();
      player.preload = 'auto';
      player.playbackRate = Math.min(1.25, Math.max(.65, Number(rate) || 1));
      player.preservesPitch = true;
      if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;
      return new Promise((resolve, reject) => {
        const session = {player, reject, settled:false, timer:null, finish:null};
        const finish = error => {
          if (session.settled) return;
          session.settled = true;
          clearTimeout(session.timer);
          player.onplaying = player.onended = player.onerror = null;
          if (this.session === session) this.session = null;
          player.pause();
          player.removeAttribute('src');
          player.load();
          if (error) { this._emit(error.code === 'CANCELED' ? 'phoneme-stopped' : 'phoneme-error', error.message, {lessonId,accent,clip}); reject(error); }
          else { this._emit('phoneme-ended', 'Đã nghe xong âm riêng.', {lessonId,accent,clip}); resolve({lessonId,accent,clip}); }
        };
        session.finish = finish;
        this.session = session;
        player.onplaying = () => this._emit('phoneme-playing', 'Đang phát bản thu âm riêng.', {lessonId,accent,clip});
        player.onended = () => finish();
        player.onerror = () => finish(failure('PHONEME_LOAD_FAILED', 'Chưa tải được bản thu âm. Hãy kiểm tra mạng và bấm nghe lại.'));
        session.timer = setTimeout(() => finish(failure('PHONEME_TIMEOUT', 'Bản thu âm chưa phản hồi. Hãy thử tải lại trang.')), 20000);
        player.src = new URL(clip.src, base).href;
        try {
          Promise.resolve(player.play()).catch(error => finish(failure('PHONEME_PLAY_FAILED', error?.name === 'NotAllowedError' ? 'Trình duyệt chặn âm thanh. Hãy bấm trực tiếp nút nghe âm một lần nữa.' : 'Không phát được bản thu âm. Hãy thử lại hoặc kiểm tra loa.')));
        } catch (_) { finish(failure('PHONEME_PLAY_FAILED', 'Không mở được bản thu âm trên thiết bị này.')); }
      });
    }

    stop() {
      if (this.session) this.session.finish(failure('CANCELED', 'Đã dừng nghe âm.'));
    }
  }
  window.EngStartPhonemePlayer = EngStartPhonemePlayer;
})();
