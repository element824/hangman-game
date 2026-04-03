class HangmanGame {
    constructor() {
        this.maxWrong = 7;
        this.currentWord = null;
        this.currentHint = '';
        this.currentCategory = '';
        this.guessedLetters = new Set();
        this.wrongCount = 0;
        this.gameOver = false;
        this.hintUsed = false;
        this.isDaily = false;
        this.startTime = 0;
        this.confettiCtx = null;

        this.cacheDOM();
        this.bindEvents();
        this.initMenu();
        this.loadSoundPref();
        this.initConfetti();
        this.updateMonsterEyes();
    }

    cacheDOM() {
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultModal = document.getElementById('result-modal');
        this.achievementsModal = document.getElementById('achievements-modal');

        this.categoryButtonsContainer = document.getElementById('category-buttons');
        this.randomBtn = document.getElementById('random-btn');
        this.dailyBtn = document.getElementById('daily-btn');
        this.dailyStatus = document.getElementById('daily-status');
        this.achievementsBtn = document.getElementById('achievements-btn');
        this.achievementCount = document.getElementById('achievement-count');
        this.achievementsList = document.getElementById('achievements-list');
        this.achCloseBtn = document.getElementById('ach-close-btn');

        this.menuSaved = document.getElementById('menu-saved');
        this.menuBest = document.getElementById('menu-best');
        this.menuStreak = document.getElementById('menu-streak');
        this.menuStreakCard = document.getElementById('menu-streak-card');
        this.menuStreakIcon = document.getElementById('menu-streak-icon');

        this.categoryLabel = document.getElementById('category-label');
        this.wordDisplay = document.getElementById('word-display');
        this.hintArea = document.getElementById('hint-area');
        this.alphabetGrid = document.getElementById('alphabet-grid');
        this.gameSaved = document.getElementById('game-saved');
        this.gameBest = document.getElementById('game-best');
        this.gameStreak = document.getElementById('game-streak');
        this.gameStreakIndicator = document.getElementById('game-streak-indicator');
        this.gameStreakFire = document.getElementById('game-streak-fire');
        this.wrongCountEl = document.getElementById('wrong-count');
        this.difficultyDots = document.getElementById('difficulty-dots');
        this.gameScene = document.getElementById('game-scene');

        this.characterGroup = document.getElementById('character-group');
        this.balloon = document.getElementById('balloon');
        this.monster = document.getElementById('monster');
        this.gameLeft = document.querySelector('.game-left');

        this.homeBtn = document.getElementById('home-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.soundBtn = document.getElementById('sound-btn');
        this.soundIcon = document.getElementById('sound-icon');

        this.resultEmoji = document.getElementById('result-emoji');
        this.resultTitle = document.getElementById('result-title');
        this.resultWord = document.getElementById('result-word');
        this.resultMessage = document.getElementById('result-message');
        this.rsWrong = document.getElementById('rs-wrong');
        this.rsHint = document.getElementById('rs-hint');
        this.rsTime = document.getElementById('rs-time');
        this.rsStreak = document.getElementById('rs-streak');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.shareBtn = document.getElementById('share-btn');
        this.menuBtn = document.getElementById('menu-btn');

        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.toastContainer = document.getElementById('toast-container');
    }

    bindEvents() {
        this.randomBtn.addEventListener('click', () => this.startRandomGame());
        this.dailyBtn.addEventListener('click', () => this.startDailyChallenge());
        this.homeBtn.addEventListener('click', () => this.showMenu());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.soundBtn.addEventListener('click', () => this.toggleSound());
        this.playAgainBtn.addEventListener('click', () => {
            if (this.isDaily) this.showMenu();
            else this.startGame(this.currentCategory);
        });
        this.shareBtn.addEventListener('click', () => this.shareScore());
        this.menuBtn.addEventListener('click', () => this.showMenu());
        this.achievementsBtn.addEventListener('click', () => this.showAchievements());
        this.achCloseBtn.addEventListener('click', () => this.achievementsModal.classList.add('hidden'));

        document.addEventListener('keydown', (e) => {
            if (this.gameScreen.classList.contains('active') && !this.gameOver) {
                const key = e.key.toUpperCase();
                if (/^[A-Z]$/.test(key)) {
                    this.guessLetter(key);
                }
            }
            if (e.key === 'Escape') {
                this.resultModal.classList.add('hidden');
                this.achievementsModal.classList.add('hidden');
            }
        });
    }

    // ===== MENU =====
    initMenu() {
        Object.keys(WORD_BANK).forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.setAttribute('role', 'listitem');
            btn.setAttribute('aria-label', `Play ${cat} category`);

            const progress = this.getCategoryProgress(cat);
            const total = WORD_BANK[cat].words.length;
            const pct = Math.min((progress / total) * 100, 100);

            btn.innerHTML = `
                <span class="emoji">${WORD_BANK[cat].emoji}</span>
                <span>${cat}</span>
                <div class="cat-progress"><div class="cat-progress-fill" style="width:${pct}%"></div></div>
            `;
            btn.addEventListener('click', () => this.startGame(cat));
            this.categoryButtonsContainer.appendChild(btn);
        });

        this.updateStats();
        this.updateDailyStatus();
        this.updateAchievementCount();
    }

    getCategoryProgress(cat) {
        const progress = storage.getCategoryProgress();
        return progress[cat] || 0;
    }

    updateStats() {
        const saved = storage.getSaved();
        const best = storage.getBest();
        const streak = storage.getStreak();

        this.menuSaved.textContent = saved;
        this.menuBest.textContent = best;
        this.menuStreak.textContent = streak;
        this.gameSaved.textContent = saved;
        this.gameBest.textContent = best;
        this.gameStreak.textContent = streak;

        // Fire effect for active streaks
        const isOnFire = streak >= 3;
        this.menuStreakCard.classList.toggle('on-fire', isOnFire);
        this.gameStreakIndicator.classList.toggle('on-fire', isOnFire);
        this.menuStreakIcon.textContent = isOnFire ? '🔥' : '💫';
        this.gameStreakFire.textContent = isOnFire ? '🔥' : '💫';
    }

    updateDailyStatus() {
        const daily = storage.getDailyStatus();
        if (daily.completed) {
            this.dailyBtn.classList.add('completed');
            this.dailyStatus.textContent = '✅ Completed today!';
        } else {
            this.dailyBtn.classList.remove('completed');
            this.dailyStatus.textContent = 'New word every day!';
        }
    }

    updateAchievementCount() {
        const count = storage.getAchievements().length;
        this.achievementCount.textContent = `${count}/${ACHIEVEMENTS.length}`;
    }

    updateCategoryButtons() {
        const btns = this.categoryButtonsContainer.querySelectorAll('.category-btn');
        const cats = Object.keys(WORD_BANK);
        btns.forEach((btn, i) => {
            const cat = cats[i];
            const progress = this.getCategoryProgress(cat);
            const total = WORD_BANK[cat].words.length;
            const pct = Math.min((progress / total) * 100, 100);
            const fill = btn.querySelector('.cat-progress-fill');
            if (fill) fill.style.width = `${pct}%`;
        });
    }

    // ===== SOUND =====
    loadSoundPref() {
        audio.enabled = storage.getSoundPref();
        this.updateSoundBtn();
    }

    toggleSound() {
        const enabled = audio.toggle();
        storage.setSoundPref(enabled);
        this.updateSoundBtn();
        if (enabled) audio.play('click');
    }

    updateSoundBtn() {
        this.soundIcon.textContent = audio.enabled ? '🔊' : '🔇';
    }

    // ===== NAVIGATION =====
    showMenu() {
        audio.play('click');
        this.updateStats();
        this.updateDailyStatus();
        this.updateCategoryButtons();
        this.updateAchievementCount();
        this.gameScreen.classList.remove('active');
        this.resultModal.classList.add('hidden');
        this.menuScreen.classList.add('active');
    }

    showGame() {
        this.menuScreen.classList.remove('active');
        this.resultModal.classList.add('hidden');
        this.gameScreen.classList.add('active');
    }

    // ===== DAILY CHALLENGE =====
    startDailyChallenge() {
        const daily = storage.getDailyStatus();
        if (daily.completed) {
            this.showToast('📅 Already completed today! Come back tomorrow.', 'streak');
            return;
        }
        // Deterministic daily word based on date
        const today = new Date().toISOString().split('T')[0];
        const seed = this.hashString(today);
        const cats = Object.keys(WORD_BANK);
        const cat = cats[seed % cats.length];
        const words = WORD_BANK[cat].words;
        const wordEntry = words[seed % words.length];

        this.isDaily = true;
        this.currentCategory = cat;
        this.currentWord = wordEntry.word;
        this.currentHint = wordEntry.hint;
        this._initGameState();
        this.categoryLabel.textContent = `📅 Daily · ${cat}`;
        this.showGame();
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // ===== GAME START =====
    startRandomGame() {
        const cats = Object.keys(WORD_BANK);
        this.startGame(cats[Math.floor(Math.random() * cats.length)]);
    }

    startGame(category) {
        audio.play('click');
        this.isDaily = false;
        this.currentCategory = category;

        // Pick word, avoiding recently played words
        const wordList = WORD_BANK[category].words;
        const history = storage.getWordHistory();
        let available = wordList.filter(w => !history.includes(w.word));
        if (available.length === 0) available = wordList; // All played, reset

        const entry = available[Math.floor(Math.random() * available.length)];
        this.currentWord = entry.word;
        this.currentHint = entry.hint;

        this._initGameState();
        this.categoryLabel.textContent = category;
        this.showGame();
    }

    _initGameState() {
        this.guessedLetters = new Set();
        this.wrongCount = 0;
        this.gameOver = false;
        this.hintUsed = false;
        this.startTime = Date.now();

        this.renderWord();
        this.renderAlphabet();
        this.renderWrongPips();
        this.resetCharacters();
        this.renderDifficulty();
        this.hintArea.classList.remove('visible');
        this.hintArea.textContent = '';
        this.updateStats();
    }

    // ===== DIFFICULTY INDICATOR =====
    renderDifficulty() {
        const len = this.currentWord.replace(/ /g, '').length;
        let level = 1; // easy
        if (len >= 7) level = 2;
        if (len >= 10) level = 3;

        this.difficultyDots.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'diff-dot' + (i < level ? ' active' : '');
            if (level === 3 && i < level) dot.classList.add('hard');
            this.difficultyDots.appendChild(dot);
        }
    }

    // ===== RENDERING =====
    renderWord() {
        this.wordDisplay.innerHTML = '';
        for (const char of this.currentWord) {
            const slot = document.createElement('div');
            slot.className = 'letter-slot';
            if (char === ' ') {
                slot.classList.add('space');
            } else {
                const isGuessed = this.guessedLetters.has(char);
                slot.textContent = isGuessed ? char : '';
                slot.dataset.letter = char;
                if (isGuessed) slot.classList.add('revealed');
            }
            this.wordDisplay.appendChild(slot);
        }
    }

    renderAlphabet() {
        this.alphabetGrid.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letter;
            btn.dataset.letter = letter;
            btn.setAttribute('aria-label', `Guess letter ${letter}`);
            btn.addEventListener('click', () => this.guessLetter(letter));
            this.alphabetGrid.appendChild(btn);
        }
    }

    renderWrongPips() {
        this.wrongCountEl.innerHTML = '';
        for (let i = 0; i < this.maxWrong; i++) {
            const pip = document.createElement('div');
            pip.className = 'wrong-pip' + (i < this.wrongCount ? ' active' : '');
            this.wrongCountEl.appendChild(pip);
        }
    }

    resetCharacters() {
        this.characterGroup.className = 'character-group level-0 idle';
        this.balloon.className = 'balloon';
        this.monster.className = 'monster';
        this.characterGroup.style.opacity = '1';
    }

    // ===== GUESSING =====
    guessLetter(letter) {
        if (this.gameOver || this.guessedLetters.has(letter)) return;
        this.guessedLetters.add(letter);

        const btn = this.alphabetGrid.querySelector(`[data-letter="${letter}"]`);
        if (!btn) return;

        if (this.currentWord.includes(letter)) {
            btn.classList.add('used', 'correct');
            audio.play('correct');
            this.revealLetters(letter);

            // Correct pulse feedback
            this.gameLeft.classList.add('correct-pulse');
            setTimeout(() => this.gameLeft.classList.remove('correct-pulse'), 300);

            this.checkWin();
        } else {
            btn.classList.add('used', 'wrong');
            audio.play('wrong');
            this.wrongCount++;
            this.renderWrongPips();
            this.updateCharacterPosition();

            // Scene shake
            this.gameScene.classList.add('shake');
            setTimeout(() => this.gameScene.classList.remove('shake'), 400);

            // Monster bounces excitedly
            this.monster.classList.add('excited');
            setTimeout(() => this.monster.classList.remove('excited'), 500);

            this.checkLose();
        }
    }

    revealLetters(letter) {
        const slots = this.wordDisplay.querySelectorAll('.letter-slot');
        let delay = 0;
        slots.forEach(slot => {
            if (slot.dataset.letter === letter) {
                setTimeout(() => {
                    slot.textContent = letter;
                    slot.classList.add('revealed');
                }, delay);
                delay += 80; // Stagger reveal for multiple same letters
            }
        });
    }

    updateCharacterPosition() {
        // Remove idle, add scared at higher wrong counts
        this.characterGroup.classList.remove('idle');
        this.characterGroup.className = `character-group level-${this.wrongCount}`;

        if (this.wrongCount >= 5) {
            this.characterGroup.classList.add('scared');
        }
        if (this.wrongCount >= 4) {
            this.monster.classList.add('angry');
        }
    }

    // ===== MONSTER EYES (track stickman) =====
    updateMonsterEyes() {
        const update = () => {
            const charGroup = this.characterGroup;
            const monsterEl = this.monster;
            if (!charGroup || !monsterEl) {
                requestAnimationFrame(update);
                return;
            }

            const charRect = charGroup.getBoundingClientRect();
            const monsterRect = monsterEl.getBoundingClientRect();

            if (charRect.width > 0 && monsterRect.width > 0) {
                const dx = (charRect.left + charRect.width / 2) - (monsterRect.left + monsterRect.width / 2);
                const dy = (charRect.top + charRect.height / 2) - (monsterRect.top + monsterRect.height / 2);
                const maxOffset = 3;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const ox = (dx / dist) * maxOffset;
                const oy = Math.min((dy / dist) * maxOffset, 0); // Only look up

                const pupils = monsterEl.querySelectorAll('.monster-pupil');
                pupils.forEach(p => {
                    p.style.transform = `translate(${ox}px, ${oy}px)`;
                });
            }

            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    // ===== WIN / LOSE =====
    checkWin() {
        const uniqueLetters = new Set(this.currentWord.replace(/ /g, '').split(''));
        if (![...uniqueLetters].every(l => this.guessedLetters.has(l))) return;

        this.gameOver = true;
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        const gameStats = {
            category: this.currentCategory,
            word: this.currentWord,
            wrongCount: this.wrongCount,
            hintUsed: this.hintUsed,
            time: elapsed,
        };

        const { data, newAchievements } = storage.recordWin(gameStats);
        if (this.isDaily) storage.completeDailyChallenge();

        this.updateStats();

        // Win animations
        this.characterGroup.classList.remove('idle', 'scared');
        this.characterGroup.classList.add('win-float');
        this.monster.classList.remove('angry');
        this.monster.classList.add('happy');
        audio.play('win');
        this.fireConfetti();

        // Streak milestone toasts
        const streak = storage.getStreak();
        if (streak === 3) this.showToast('🔥 3 streak! You\'re on fire!', 'streak');
        else if (streak === 5) this.showToast('🔥🔥 5 streak! Unstoppable!', 'streak');
        else if (streak === 10) this.showToast('💎 10 streak! LEGENDARY!', 'streak');

        // Achievement toasts
        newAchievements.forEach((a, i) => {
            setTimeout(() => {
                this.showToast(`${a.icon} Achievement: ${a.name}`, 'achievement');
                audio.play('reveal');
            }, 500 + i * 800);
        });

        setTimeout(() => this.showResult(true, gameStats), 1800);
    }

    checkLose() {
        if (this.wrongCount < this.maxWrong) return;

        this.gameOver = true;
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        const gameStats = {
            category: this.currentCategory,
            word: this.currentWord,
            wrongCount: this.wrongCount,
            hintUsed: this.hintUsed,
            time: elapsed,
        };

        const { newAchievements } = storage.recordLoss(gameStats);
        this.updateStats();

        // Lose animations
        this.characterGroup.classList.remove('idle', 'scared');
        this.balloon.classList.add('pop');
        setTimeout(() => this.characterGroup.classList.add('lose-fall'), 300);
        audio.play('lose');

        // Reveal unrevealed letters
        setTimeout(() => {
            const slots = this.wordDisplay.querySelectorAll('.letter-slot');
            let delay = 0;
            slots.forEach(slot => {
                if (slot.dataset.letter && !slot.textContent) {
                    setTimeout(() => {
                        slot.textContent = slot.dataset.letter;
                        slot.classList.add('revealed-wrong');
                    }, delay);
                    delay += 60;
                }
            });
        }, 800);

        newAchievements.forEach((a, i) => {
            setTimeout(() => this.showToast(`${a.icon} Achievement: ${a.name}`, 'achievement'), 500 + i * 800);
        });

        setTimeout(() => this.showResult(false, gameStats), 2400);
    }

    // ===== RESULT MODAL =====
    showResult(won, gameStats) {
        const streak = storage.getStreak();
        const messages = won ? [
            'The stickman lives to see another day! 🎉',
            streak >= 5 ? `Incredible! ${streak} in a row! 🔥` : 'Great save!',
            gameStats.wrongCount === 0 ? 'Flawless victory! ✨' : `Saved with ${this.maxWrong - gameStats.wrongCount} guesses to spare!`,
            gameStats.time < 30 ? 'Speed demon! ⚡' : 'Well played!',
        ] : [
            'The monster got them... 💀',
            'So close! Try again?',
            'Don\'t give up! The stickman needs you!',
            'That was a tough one!',
        ];

        this.resultEmoji.textContent = won ? '🎉' : '💀';
        this.resultTitle.textContent = won ? 'SAVED!' : 'GAME OVER';
        this.resultTitle.className = won ? 'win' : 'lose';
        this.resultWord.textContent = this.currentWord;
        this.resultMessage.textContent = messages[Math.floor(Math.random() * messages.length)];

        this.rsWrong.textContent = `${gameStats.wrongCount}/${this.maxWrong}`;
        this.rsHint.textContent = gameStats.hintUsed ? 'Yes' : 'No';
        this.rsTime.textContent = this.formatTime(gameStats.time);
        this.rsStreak.textContent = won ? streak : '0 💔';

        this.resultModal.classList.remove('hidden');
        this.playAgainBtn.focus();
    }

    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    // ===== HINT =====
    showHint() {
        if (this.gameOver) return;
        audio.play('reveal');
        this.hintArea.textContent = `💡 ${this.currentHint}`;
        this.hintArea.classList.add('visible');
        this.hintUsed = true;
    }

    // ===== SHARE =====
    shareScore() {
        audio.play('click');
        const streak = storage.getStreak();
        const won = this.resultTitle.className === 'win';
        const pips = Array.from({ length: this.maxWrong }, (_, i) => i < this.wrongCount ? '🟥' : '⬜').join('');

        const text = [
            `🎃 Gosford Sheela${this.isDaily ? ' (Daily)' : ''}`,
            `${won ? '✅' : '❌'} ${this.currentCategory}`,
            pips,
            won ? `🔥 Streak: ${streak}` : 'Better luck next time!',
            '',
        ].join('\n');

        if (navigator.share) {
            navigator.share({ text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('📋 Copied to clipboard!', 'milestone');
            }).catch(() => {});
        }
    }

    // ===== ACHIEVEMENTS =====
    showAchievements() {
        audio.play('click');
        const all = storage.getAllAchievementStatus();
        this.achievementsList.innerHTML = '';

        all.forEach(a => {
            const div = document.createElement('div');
            div.className = `ach-item ${a.unlocked ? 'unlocked' : 'locked'}`;
            div.innerHTML = `
                <span class="ach-icon">${a.unlocked ? a.icon : '🔒'}</span>
                <div class="ach-info">
                    <div class="ach-name">${a.name}</div>
                    <div class="ach-desc">${a.desc}</div>
                </div>
            `;
            this.achievementsList.appendChild(div);
        });

        this.achievementsModal.classList.remove('hidden');
    }

    // ===== TOAST =====
    showToast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // ===== CONFETTI =====
    initConfetti() {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
        this.confettiCtx = this.confettiCanvas.getContext('2d');
        window.addEventListener('resize', () => {
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
        });
    }

    fireConfetti() {
        const ctx = this.confettiCtx;
        const W = this.confettiCanvas.width;
        const H = this.confettiCanvas.height;
        const colors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#e91e63', '#ff9800'];
        const particles = [];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: W / 2 + (Math.random() - 0.5) * 200,
                y: H * 0.5,
                vx: (Math.random() - 0.5) * 12,
                vy: -Math.random() * 14 - 4,
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.25 + Math.random() * 0.15,
                opacity: 1,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, W, H);
            let alive = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.vy += p.gravity;
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                p.opacity -= 0.005;

                if (p.opacity > 0 && p.y < H + 20) {
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            });

            if (alive) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, W, H);
        };

        requestAnimationFrame(animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
});
