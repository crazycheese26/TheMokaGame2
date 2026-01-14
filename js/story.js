import { game } from './main.js';

const LEVEL_SEQUENCES = {
    0: [ // Level 1: The Kitchen Counter (Intro -> EspressoBot)
        // Removed disruptive intro dialogue
        { time: 3, type: 'BASIC', count: 1, pos: 'TOP' },
        { time: 6, type: 'BASIC', count: 2, pos: 'RANDOM' },
        { time: 10, type: 'BASIC', count: 3, pos: 'CIRCLE' },
        { time: 15, type: 'WAIT' },
        { time: 16, type: 'DIALOGUE', text: "ALERT: STAIN DETECTED. SPEED INCREASED." },
        { time: 18, type: 'BASIC', count: 5, pos: 'RANDOM' },
        { time: 25, type: 'WAIT' },
        { time: 26, type: 'DIALOGUE', text: "WARNING: HIGH VELOCITY TARGET APPROACHING." },
        { time: 28, type: 'ESPRESSO_BOT', count: 1, pos: 'TOP' }
    ],
    1: [ // Level 2: The Cafe Floor (Horde -> FrappeQueen)
        { time: 1, type: 'DIALOGUE', text: "SYSTEM: SECTOR 1 CLEAR. DESCENDING." },
        { time: 3, type: 'BASIC', count: 3, pos: 'TOP' },
        { time: 8, type: 'BASIC', count: 4, pos: 'LEFT' },
        { time: 12, type: 'BASIC', count: 4, pos: 'RIGHT' },
        { time: 18, type: 'WAIT' },
        { time: 19, type: 'DIALOGUE', text: "HEAVY RESISTANCE. THEY ARE MULTIPLYING." },
        { time: 21, type: 'BASIC', count: 8, pos: 'CIRCLE' },
        { time: 30, type: 'WAIT' },
        { time: 31, type: 'DIALOGUE', text: "WARNING: MASSIVE BIO-SIGNATURE DETECTED." },
        { time: 33, type: 'FRAPPE_QUEEN', count: 1, pos: 'TOP' }
    ],
    2: [ // Level 3: The Coffee Machine (Chaos -> MokaMan)
        { time: 1, type: 'DIALOGUE', text: "SYSTEM: SOURCE LOCATED. THE MOKA POT." },
        { time: 3, type: 'BASIC', count: 5, pos: 'RANDOM' },
        { time: 8, type: 'BASIC', count: 5, pos: 'RANDOM' },
        { time: 13, type: 'ESPRESSO_BOT', count: 1, pos: 'LEFT' }, // Mini-boss return
        { time: 20, type: 'BASIC', count: 8, pos: 'CIRCLE' },
        { time: 25, type: 'WAIT' },
        { time: 26, type: 'DIALOGUE', text: "FINAL WARNING: THE ROAST IS HERE." },
        { time: 28, type: 'MOKA_BOSS', count: 1, pos: 'TOP' }
    ]
};

const NARRATIVE_TEXT = [
    { title: "EPISODE 1: SPOON AWAKENING", text: "You are the Last Clean Spoon.\n\nThe kitchen has fallen to the Roast.\nEspresso shots zoom past like bullets.\n\nYour mission: Scoop them up.\nStay shiny." },
    { title: "EPISODE 2: THE SUGAR RUSH", text: "Quality Control failed.\n\nThe Frappe Queen creates abonimbations.\nShe is slow, but she stains deep.\n\nDo not let the foam harden." },
    { title: "EPISODE 3: THE FINAL BREW", text: "You have reached the Source.\n\nThe Moka Pot boils with rage.\n\nCleanse the machine.\nEnd the cycle.\n\nFor the cutlery drawer!" }
];

export class Story {
    constructor() {
        this.currentLevel = 0;
        this.overlay = document.getElementById('story-overlay');
        this.titleEl = document.getElementById('story-title');
        this.textEl = document.getElementById('story-text');
        this.btnContinue = document.getElementById('btn-continue');

        this.typewriterInterval = null;
        this.fullText = "";

        // Skip Handler
        document.addEventListener('keydown', (e) => {
            if (window.gameState.mode === 'CUTSCENE' && (e.key === ' ' || e.key === 'Enter')) {
                this.skipTypewriter();
            }
        });

        // Ensure button also proceeds
        this.btnContinue.addEventListener('click', () => {
            this.startLevel();
        });
    }

    startStoryMode() {
        this.currentLevel = 0;
        this.showCutscene();
    }

    showCutscene() {
        window.gameState.mode = 'CUTSCENE';
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');

        const data = NARRATIVE_TEXT[this.currentLevel] || { title: "VICTORY", text: "You stayed clean and sexy.\nReturn to the cupboard, hero." };

        this.titleEl.innerText = data.title;
        this.textEl.innerText = "";
        this.fullText = data.text;
        this.btnContinue.classList.add('hidden');

        // Add "Press Space to Skip" hint
        if (!document.getElementById('skip-hint')) {
            const hint = document.createElement('div');
            hint.id = 'skip-hint';
            hint.innerText = "[SPACE] to Skip";
            hint.className = "absolute bottom-4 right-4 text-gray-500 text-xs animate-pulse";
            this.overlay.appendChild(hint);
        }

        // Typewriter effect
        let i = 0;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            this.textEl.innerText += this.fullText.charAt(i);
            i++;
            if (i >= this.fullText.length) {
                this.finishTypewriter();
            }
        }, 50);
    }

    skipTypewriter() {
        if (this.btnContinue.classList.contains('hidden')) {
            // Instant finish
            this.finishTypewriter();
        } else {
            // Already finished, prevent accidental double skip/start logic if needed
            // But usually space to start level is fine too if we bind it
            if (window.gameState.mode === 'CUTSCENE') {
                // Check if it's a Dialogue event or Level Start event
                // Currently btnContinue logic handles Level Start.
                // Dialogue events handle their own onclick.
                // Let's rely on the button click for Next Level to be safe
                this.btnContinue.click();
            }
        }
    }

    finishTypewriter() {
        clearInterval(this.typewriterInterval);
        this.textEl.innerText = this.fullText;
        this.btnContinue.classList.remove('hidden');
    }

    startLevel() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');

        // Load Sequence for this level
        const sequence = LEVEL_SEQUENCES[this.currentLevel];

        if (sequence) {
            import('./main.js').then(m => {
                m.game.start('LEVEL', { level: this.currentLevel, sequence: sequence });
            });
        } else {
            // Victory / End
            alert("CAMPAIGN COMPLETE! You are the shiniest spoon.");
            window.location.reload();
        }
    }

    // ... (rest same) ...

    update() {
        // Background animation for cutscene?
    }

    nextLevel() {
        this.currentLevel++;
        this.showCutscene();
    }

    showDialogue(text, onComplete) {
        window.gameState.mode = 'CUTSCENE';
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');

        this.titleEl.innerText = "INCOMING TRANSMISSION";
        this.textEl.innerText = "";
        this.fullText = text; // Store full text for skipper
        this.btnContinue.classList.add('hidden');

        // Override global skip handler temporarily or ensure it works
        // The global handler in constructor calls skipTypewriter which triggers btnContinue
        // We need btnContinue to define what happens NEXT

        this.btnContinue.onclick = () => {
            this.finishDialogue(onComplete);
        };

        // Typewriter
        let i = 0;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            this.textEl.innerText += text.charAt(i);
            i++;
            if (i >= text.length) {
                this.readyToContinueDialogue(onComplete);
            }
        }, 50);
    }

    readyToContinueDialogue(onComplete) {
        clearInterval(this.typewriterInterval);
        this.textEl.innerText = this.fullText;
        this.btnContinue.classList.remove('hidden');
    }

    finishDialogue(onComplete) {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
        window.gameState.mode = 'PLAY';
        if (onComplete) onComplete();
        // Restore default listener
        this.btnContinue.onclick = () => this.startLevel();
    }
}
