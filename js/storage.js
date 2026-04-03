const STORAGE_KEY = 'gosford_sheela_v2';

const ACHIEVEMENTS = [
    { id: 'first_win', name: 'First Save', desc: 'Save the stickman for the first time', icon: '🌟', check: d => d.saved >= 1 },
    { id: 'streak_3', name: 'Hat Trick', desc: 'Get a streak of 3', icon: '🎯', check: d => d.best >= 3 },
    { id: 'streak_5', name: 'On Fire', desc: 'Get a streak of 5', icon: '🔥', check: d => d.best >= 5 },
    { id: 'streak_10', name: 'Unstoppable', desc: 'Get a streak of 10', icon: '💎', check: d => d.best >= 10 },
    { id: 'saved_10', name: 'Guardian', desc: 'Save 10 stickmen', icon: '🛡️', check: d => d.saved >= 10 },
    { id: 'saved_25', name: 'Hero', desc: 'Save 25 stickmen', icon: '🦸', check: d => d.saved >= 25 },
    { id: 'saved_50', name: 'Legend', desc: 'Save 50 stickmen', icon: '👑', check: d => d.saved >= 50 },
    { id: 'no_hint', name: 'No Help Needed', desc: 'Win without using a hint', icon: '🧠', check: (d, g) => g && g.won && !g.hintUsed },
    { id: 'flawless', name: 'Flawless', desc: 'Win with zero wrong guesses', icon: '✨', check: (d, g) => g && g.won && g.wrongCount === 0 },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Win in under 30 seconds', icon: '⚡', check: (d, g) => g && g.won && g.time < 30 },
    { id: 'cat_master', name: 'Explorer', desc: 'Play all 6 categories', icon: '🗺️', check: d => Object.keys(d.categoryProgress || {}).length >= 6 },
    { id: 'daily_first', name: 'Daily Player', desc: 'Complete your first daily challenge', icon: '📅', check: d => (d.dailyWins || 0) >= 1 },
    { id: 'daily_7', name: 'Dedicated', desc: 'Complete 7 daily challenges', icon: '🏅', check: d => (d.dailyWins || 0) >= 7 },
    { id: 'comeback', name: 'Close Call', desc: 'Win with only 1 guess remaining', icon: '😰', check: (d, g) => g && g.won && g.wrongCount === 6 },
    { id: 'played_20', name: 'Addicted', desc: 'Play 20 games', icon: '🎮', check: d => (d.totalGames || 0) >= 20 },
];

const storage = {
    _defaults: {
        saved: 0,
        best: 0,
        streak: 0,
        soundOn: true,
        totalGames: 0,
        totalLosses: 0,
        categoryProgress: {},
        wordHistory: [],
        achievements: [],
        dailyDate: null,
        dailyCompleted: false,
        dailyWins: 0,
    },

    _getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? { ...this._defaults, ...JSON.parse(data) } : { ...this._defaults };
        } catch {
            return { ...this._defaults };
        }
    },

    _saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch { /* Storage full */ }
    },

    getSaved() { return this._getAll().saved; },
    getBest() { return this._getAll().best; },
    getStreak() { return this._getAll().streak; },
    getSoundPref() { return this._getAll().soundOn; },
    getTotalGames() { return this._getAll().totalGames; },
    getAchievements() { return this._getAll().achievements || []; },
    getCategoryProgress() { return this._getAll().categoryProgress || {}; },

    getDailyStatus() {
        const data = this._getAll();
        const today = new Date().toISOString().split('T')[0];
        return {
            isToday: data.dailyDate === today,
            completed: data.dailyDate === today && data.dailyCompleted,
        };
    },

    completeDailyChallenge() {
        const data = this._getAll();
        const today = new Date().toISOString().split('T')[0];
        data.dailyDate = today;
        data.dailyCompleted = true;
        data.dailyWins = (data.dailyWins || 0) + 1;
        this._saveAll(data);
    },

    // Returns newly unlocked achievements
    recordWin(gameStats) {
        const data = this._getAll();
        data.saved++;
        data.streak++;
        data.totalGames = (data.totalGames || 0) + 1;
        if (data.streak > data.best) data.best = data.streak;

        if (gameStats?.category) {
            if (!data.categoryProgress) data.categoryProgress = {};
            if (!data.categoryProgress[gameStats.category]) data.categoryProgress[gameStats.category] = 0;
            data.categoryProgress[gameStats.category]++;
        }

        // Track word history (last 100)
        if (gameStats?.word) {
            if (!data.wordHistory) data.wordHistory = [];
            data.wordHistory.push(gameStats.word);
            if (data.wordHistory.length > 100) data.wordHistory = data.wordHistory.slice(-100);
        }

        this._saveAll(data);
        return { data, newAchievements: this._checkAchievements(data, { won: true, ...gameStats }) };
    },

    recordLoss(gameStats) {
        const data = this._getAll();
        data.streak = 0;
        data.totalGames = (data.totalGames || 0) + 1;
        data.totalLosses = (data.totalLosses || 0) + 1;

        if (gameStats?.word) {
            if (!data.wordHistory) data.wordHistory = [];
            data.wordHistory.push(gameStats.word);
            if (data.wordHistory.length > 100) data.wordHistory = data.wordHistory.slice(-100);
        }

        this._saveAll(data);
        return { data, newAchievements: this._checkAchievements(data, { won: false, ...gameStats }) };
    },

    setSoundPref(enabled) {
        const data = this._getAll();
        data.soundOn = enabled;
        this._saveAll(data);
    },

    getWordHistory() {
        return this._getAll().wordHistory || [];
    },

    _checkAchievements(data, gameStats) {
        const current = data.achievements || [];
        const newlyUnlocked = [];

        for (const ach of ACHIEVEMENTS) {
            if (!current.includes(ach.id) && ach.check(data, gameStats)) {
                current.push(ach.id);
                newlyUnlocked.push(ach);
            }
        }

        data.achievements = current;
        this._saveAll(data);
        return newlyUnlocked;
    },

    getAllAchievementStatus() {
        const unlocked = this.getAchievements();
        return ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.includes(a.id) }));
    }
};
