import { game } from './main.js';

const STORY_DATA = [
    {
        title: "EPISODE 1: THE BREWING STORM",
        text: "The Moka Pot has boiled over.\n\nAfter years of peaceful brewing, something has gone wrong.\nThe beans are restless.\n\nYou are the last clean Spoon.\nSurvive."
    },
    {
        title: "EPISODE 2: CAFFEINE OVERDOSE",
        text: "They are getting faster.\n\nThe caffeine levels are critical.\nDo not let them stain you."
    }
];

export class Story {
    constructor() {
        this.currentLevel = 0;
        this.overlay = document.getElementById('story-overlay');
        this.titleEl = document.getElementById('story-title');
        this.textEl = document.getElementById('story-text');
        this.btnContinue = document.getElementById('btn-continue');

        this.btnContinue.addEventListener('click', () => {
            this.startLevel();
        });

        this.typewriterInterval = null;
    }

    startStoryMode() {
        this.currentLevel = 0;
        this.showCutscene();
    }

    showCutscene() {
        window.gameState.mode = 'CUTSCENE';
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');

        const data = STORY_DATA[this.currentLevel] || { title: "VICTORY", text: "You have cleansed the pot.\nReturn to the cupboard, hero." };

        this.titleEl.innerText = data.title;
        this.textEl.innerText = "";
        this.btnContinue.classList.add('hidden');

        // Typewriter effect
        let i = 0;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            this.textEl.innerText += data.text.charAt(i);
            i++;
            if (i >= data.text.length) {
                clearInterval(this.typewriterInterval);
                this.btnContinue.classList.remove('hidden');
            }
        }, 50);
    }

    startLevel() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
        // Start game with level params
        game.start('LEVEL', { level: this.currentLevel });
    }

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
        this.btnContinue.classList.add('hidden');

        // Typewriter
        let i = 0;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            this.textEl.innerText += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(this.typewriterInterval);
                this.btnContinue.classList.remove('hidden');

                // One-time listener for this dialogue
                this.btnContinue.onclick = () => {
                    this.overlay.classList.add('hidden');
                    this.overlay.classList.remove('flex');
                    window.gameState.mode = 'PLAY';
                    if (onComplete) onComplete();
                    // Restore default listener
                    this.btnContinue.onclick = () => this.startLevel();
                };
            }
        }, 50);
    }
}
