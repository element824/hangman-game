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

        this.cacheDOM();
        this.bindEvents();
        this.initMenu();
        this.loadSoundPref();
    }

    cacheDOM() {
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultModal = document.getElementById('result-modal');

        // Menu
        this.categoryButtonsContainer = document.getElementById('category-buttons');
        this.randomBtn = document.getElementById('random-btn');
        this.menuSaved = document.getElementById('menu-saved');
        this.menuBest = document.getElementById('menu-best');

        // Game
        this.categoryLabel = document.getElementById('category-label');
        this.wordDisplay = document.getElementById('word-display');
        this.hintArea = document.getElementById('hint-area');
        this.alphabetGrid = document.getElementById('alphabet-grid');
        this.gameSaved = document.getElementById('game-saved');
        this.gameBest = document.getElementById('game-best');
        this.wrongCountEl = document.getElementById('wrong-count');

        // Characters
        this.characterGroup = document.getElementById('character-group');
        this.balloon = document.getElementById('balloon');
        this.monster = document.getElementById('monster');

        // Buttons
        this.homeBtn = document.getElementById('home-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.soundBtn = document.getElementById('sound-btn');

        // Modal
        this.resultTitle = document.getElementById('result-title');
        this.resultWord = document.getElementById('result-word');
        this.resultMessage = document.getElementById('result-message');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.menuBtn = document.getElementById('menu-btn');
    }

    bindEvents() {
        this.randomBtn.addEventListener('click', () => this.startRandomGame());
        this.homeBtn.addEventListener('click', () => this.showMenu());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.soundBtn.addEventListener('click', () => this.toggleSound());
        this.playAgainBtn.addEventListener('click', () => this.startGame(this.currentCategory));
        this.menuBtn.addEventListener('click', () => this.showMenu());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.gameScreen.classList.contains('active') && !this.gameOver) {
                const key = e.key.toUpperCase();
                if (/^[A-Z]$/.test(key)) {
                    this.guessLetter(key);
                }
            }
        });
    }

    initMenu() {
        // Build category buttons
        Object.keys(WORD_BANK).forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.innerHTML = `<span class="emoji">${WORD_BANK[cat].emoji}</span><span>${cat}</span>`;
            btn.addEventListener('click', () => this.startGame(cat));
            this.categoryButtonsContainer.appendChild(btn);
        });

        this.updateStats();
    }

    updateStats() {
        const saved = storage.getSaved();
        const best = storage.getBest();
        this.menuSaved.textContent = saved;
        this.menuBest.textContent = best;
        this.gameSaved.textContent = saved;
        this.gameBest.textContent = best;
    }

    loadSoundPref() {
        const soundOn = storage.getSoundPref();
        audio.enabled = soundOn;
        this.updateSoundBtn();
    }

    toggleSound() {
        const enabled = audio.toggle();
        storage.setSoundPref(enabled);
        this.updateSoundBtn();
        if (enabled) audio.play('click');
    }

    updateSoundBtn() {
        this.soundBtn.textContent = audio.enabled ? '🔊' : '🔇';
    }

    showMenu() {
        audio.play('click');
        this.updateStats();
        this.gameScreen.classList.remove('active');
        this.resultModal.classList.add('hidden');
        this.menuScreen.classList.add('active');
    }

    showGame() {
        this.menuScreen.classList.remove('active');
        this.resultModal.classList.add('hidden');
        this.gameScreen.classList.add('active');
    }

    startRandomGame() {
        const categories = Object.keys(WORD_BANK);
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        this.startGame(randomCat);
    }

    startGame(category) {
        audio.play('click');
        this.currentCategory = category;
        this.categoryLabel.textContent = category;
        this.guessedLetters = new Set();
        this.wrongCount = 0;
        this.gameOver = false;
        this.hintUsed = false;

        // Pick a random word
        const wordList = WORD_BANK[category].words;
        const entry = wordList[Math.floor(Math.random() * wordList.length)];
        this.currentWord = entry.word;
        this.currentHint = entry.hint;

        this.renderWord();
        this.renderAlphabet();
        this.renderWrongPips();
        this.resetCharacters();
        this.hintArea.classList.remove('visible');
        this.hintArea.textContent = '';

        this.showGame();
        this.updateStats();
    }

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
        this.characterGroup.className = 'character-group level-0';
        this.balloon.className = 'balloon';
        this.monster.className = 'monster';
        this.characterGroup.style.opacity = '1';
    }

    guessLetter(letter) {
        if (this.gameOver || this.guessedLetters.has(letter)) return;

        this.guessedLetters.add(letter);

        // Update alphabet button
        const btn = this.alphabetGrid.querySelector(`[data-letter="${letter}"]`);
        if (!btn) return;

        if (this.currentWord.includes(letter)) {
            // Correct guess
            btn.classList.add('used', 'correct');
            audio.play('correct');
            this.revealLetters(letter);
            this.checkWin();
        } else {
            // Wrong guess
            btn.classList.add('used', 'wrong');
            audio.play('wrong');
            this.wrongCount++;
            this.renderWrongPips();
            this.updateCharacterPosition();

            // Shake effect
            this.gameScreen.classList.add('shake');
            setTimeout(() => this.gameScreen.classList.remove('shake'), 400);

            this.checkLose();
        }
    }

    revealLetters(letter) {
        const slots = this.wordDisplay.querySelectorAll('.letter-slot');
        slots.forEach(slot => {
            if (slot.dataset.letter === letter) {
                slot.textContent = letter;
                slot.classList.add('revealed');
            }
        });
    }

    updateCharacterPosition() {
        this.characterGroup.className = `character-group level-${this.wrongCount}`;

        // Monster gets angrier
        if (this.wrongCount >= 4) {
            this.monster.classList.add('angry');
        }
    }

    checkWin() {
        const uniqueLetters = new Set(this.currentWord.replace(/ /g, '').split(''));
        const allGuessed = [...uniqueLetters].every(l => this.guessedLetters.has(l));

        if (allGuessed) {
            this.gameOver = true;
            const data = storage.recordWin();
            this.updateStats();

            // Win animation
            this.characterGroup.classList.add('win-float');
            this.monster.classList.remove('angry');
            this.monster.classList.add('happy');
            audio.play('win');

            setTimeout(() => this.showResult(true), 1500);
        }
    }

    checkLose() {
        if (this.wrongCount >= this.maxWrong) {
            this.gameOver = true;
            storage.recordLoss();
            this.updateStats();

            // Lose animation
            this.balloon.classList.add('pop');
            setTimeout(() => {
                this.characterGroup.classList.add('lose-fall');
            }, 300);
            audio.play('lose');

            // Reveal the word
            setTimeout(() => {
                const slots = this.wordDisplay.querySelectorAll('.letter-slot');
                slots.forEach(slot => {
                    if (slot.dataset.letter && !slot.textContent) {
                        slot.textContent = slot.dataset.letter;
                        slot.style.color = 'var(--accent-red)';
                        slot.classList.add('revealed');
                    }
                });
            }, 800);

            setTimeout(() => this.showResult(false), 2200);
        }
    }

    showResult(won) {
        this.resultTitle.textContent = won ? '🎉 SAVED!' : '💀 GAME OVER';
        this.resultTitle.className = won ? 'win' : 'lose';
        this.resultWord.textContent = `The word was: ${this.currentWord}`;
        this.resultMessage.textContent = won
            ? `Great job! Streak: ${storage.getStreak()}`
            : `The monster got them... Try again!`;
        this.resultModal.classList.remove('hidden');
    }

    showHint() {
        if (this.gameOver) return;
        audio.play('reveal');
        this.hintArea.textContent = `💡 ${this.currentHint}`;
        this.hintArea.classList.add('visible');
        this.hintUsed = true;
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
});
