/**
 * GUESS WHO? - Logic & State Management
 */

const game = {
    roster: JSON.parse(localStorage.getItem('guessWhoRoster')) || [],
    seed: '',
    myTarget: null,

    // 1. Initialize & Roster Management
    init() {
        this.renderRoster();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('char-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCharacter();
        });

        document.getElementById('dark-mode-toggle').addEventListener('click', () => {
            document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        });
    },

    async addCharacter() {
        const nameInput = document.getElementById('char-name');
        const fileInput = document.getElementById('char-image');
        
        if (!fileInput.files[0]) return;

        // Process image: Resize to 150x150 to keep the Game Key small
        const base64 = await this.resizeImage(fileInput.files[0], 150, 150);
        
        const newChar = { id: Date.now(), name: nameInput.name || nameInput.value, img: base64 };
        this.roster.push(newChar);
        this.saveRoster();
        this.renderRoster();
        
        nameInput.value = '';
        fileInput.value = '';
    },

    resizeImage(file, width, height) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    },

    saveRoster() {
        localStorage.setItem('guessWhoRoster', JSON.stringify(this.roster));
    },

    clearRoster() {
        if (confirm("Clear all characters?")) {
            this.roster = [];
            this.saveRoster();
            this.renderRoster();
        }
    },

    renderRoster() {
        const grid = document.getElementById('roster-grid');
        grid.innerHTML = this.roster.map(char => `
            <div class="char-card">
                <img src="${char.img}">
                <p>${char.name}</p>
            </div>
        `).join('');
    },

    // 2. Multiplayer Logic (The Seed System)
    // Deterministic shuffle using a simple PRNG
    seededShuffle(array, seed) {
        let m = array.length, t, i;
        // Simple string to number hash for seed
        let seedNum = seed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        
        const random = () => {
            var x = Math.sin(seedNum++) * 10000;
            return x - Math.floor(x);
        };

        while (m) {
            i = Math.floor(random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    },

    startWithSeed() {
        const seedInput = document.getElementById('game-seed').value;
        if (!seedInput || this.roster.length < 2) {
            alert("Enter a seed and ensure you have at least 2 characters!");
            return;
        }
        this.launchGame(seedInput);
    },

    exportKey() {
        const data = JSON.stringify(this.roster);
        const encoded = btoa(unescape(encodeURIComponent(data)));
        navigator.clipboard.writeText(encoded);
        alert("Game Key copied to clipboard! Send it to your friend.");
    },

    importKey() {
        try {
            const key = document.getElementById('import-key').value;
            const decoded = decodeURIComponent(escape(atob(key)));
            this.roster = JSON.parse(decoded);
            this.saveRoster();
            alert("Roster imported! Now enter a seed to start.");
        } catch (e) {
            alert("Invalid Game Key.");
        }
    },

    // 3. Gameplay Logic
    launchGame(seed) {
        this.seed = seed;
        const shuffled = this.seededShuffle([...this.roster], seed);
        
        // Pick a random target for the player (different for each player)
        // Note: In real Guess Who, you pick your own. Here, we pick one randomly.
        this.myTarget = this.roster[Math.floor(Math.random() * this.roster.length)];
        
        ui.showView('game-screen');
        this.renderBoard(shuffled);
        this.renderTarget();
    },

    renderBoard(characters) {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        characters.forEach(char => {
            const el = document.createElement('div');
            el.className = 'char-card';
            el.innerHTML = `<img src="${char.img}"><p>${char.name}</p>`;
            el.onclick = () => el.classList.toggle('eliminated');
            board.appendChild(el);
        });
    },

    renderTarget() {
        const container = document.getElementById('my-character-card');
        container.innerHTML = `
            <div class="char-card">
                <img src="${this.myTarget.img}">
                <p>${this.myTarget.name}</p>
            </div>
        `;
    },

    promptGuess() {
        const guess = prompt("Who is your opponent's character? (Enter exact name)");
        if (!guess) return;

        // In a no-backend game, you need to tell your opponent your character name 
        // to verify. This is played "honor system" style.
        alert(`You guessed: ${guess}. Ask your opponent if that's correct!`);
        
        if (confirm("Did your opponent say you were right?")) {
            ui.showWin(true, guess);
        }
    }
};

/**
 * UI CONTROLLER - Handling Screen Transitions
 */
const ui = {
    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    },

    showWin(isWin, name) {
        this.showView('win-screen');
        document.getElementById('win-message').innerText = isWin ? "VICTORY!" : "GAME OVER";
        document.getElementById('winner-reveal').innerHTML = `<h3>The character was ${name}</h3>`;
    }
};

// Initialize Game
game.init();