const STORAGE_KEY = 'hangman_game_data';

const storage = {
    _getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : { saved: 0, best: 0, streak: 0, soundOn: true };
        } catch {
            return { saved: 0, best: 0, streak: 0, soundOn: true };
        }
    },

    _saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Storage full or unavailable
        }
    },

    getSaved() {
        return this._getAll().saved;
    },

    getBest() {
        return this._getAll().best;
    },

    getStreak() {
        return this._getAll().streak;
    },

    getSoundPref() {
        return this._getAll().soundOn;
    },

    recordWin() {
        const data = this._getAll();
        data.saved++;
        data.streak++;
        if (data.streak > data.best) {
            data.best = data.streak;
        }
        this._saveAll(data);
        return data;
    },

    recordLoss() {
        const data = this._getAll();
        data.streak = 0;
        this._saveAll(data);
        return data;
    },

    setSoundPref(enabled) {
        const data = this._getAll();
        data.soundOn = enabled;
        this._saveAll(data);
    }
};
