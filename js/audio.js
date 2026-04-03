class AudioManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    play(type) {
        if (!this.enabled) return;
        this.init();

        switch (type) {
            case 'correct': this._playCorrect(); break;
            case 'wrong': this._playWrong(); break;
            case 'win': this._playWin(); break;
            case 'lose': this._playLose(); break;
            case 'click': this._playClick(); break;
            case 'reveal': this._playReveal(); break;
        }
    }

    _playTone(freq, duration, type = 'sine', volume = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playCorrect() {
        this._playTone(523, 0.15);
        setTimeout(() => this._playTone(659, 0.15), 100);
    }

    _playWrong() {
        this._playTone(200, 0.3, 'sawtooth', 0.2);
    }

    _playWin() {
        [523, 587, 659, 784, 880].forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.2, 'sine', 0.25), i * 120);
        });
    }

    _playLose() {
        [400, 350, 300, 250, 200].forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.3, 'triangle', 0.2), i * 200);
        });
    }

    _playClick() {
        this._playTone(800, 0.05, 'square', 0.1);
    }

    _playReveal() {
        this._playTone(440, 0.1, 'sine', 0.15);
        setTimeout(() => this._playTone(550, 0.1, 'sine', 0.15), 80);
        setTimeout(() => this._playTone(660, 0.15, 'sine', 0.15), 160);
    }
}

const audio = new AudioManager();
