import { Player } from './player.js';
import { Enemy, MokaBoss, EspressoBot, FrappeQueen } from './enemies.js';
import { ParticleSystem } from './particles.js';

export class Game {
    constructor() {
        this.entities = [];
        this.bullets = [];
        this.particles = new ParticleSystem();
        this.player = new Player(0, 0);
        this.wave = 1;
        this.score = 0;
        this.coffeeRush = 0; // 0-100
        this.isPaused = false;
        this.spawnTimer = 0;

        // DOM Elements
        this.ui = document.getElementById('game-ui');
        this.scoreDisplay = document.getElementById('score-display');
        this.waveDisplay = document.getElementById('wave-display');
        this.enemiesLeftDisplay = document.getElementById('enemies-left');
        this.healthBar = document.getElementById('health-bar');
        this.rushMeter = document.getElementById('rush-meter');
    }

    start(type = 'ENDLESS', levelData = null) {
        window.gameState.mode = 'PLAY';
        this.ui.classList.remove('hidden');
        this.isPaused = false;
        this.reset();

        // Initial setup
        this.player.x = window.gameState.width / 2;
        this.player.y = window.gameState.height / 2;

        if (type === 'LEVEL') {
            this.gameMode = 'LEVEL';
            this.levelParams = levelData;

            if (levelData.sequence) {
                // Sequencer Mode
                this.isSequenced = true;
                this.waveEvents = [...levelData.sequence]; // Copy events
                this.levelTimer = 0;
                this.maxWaves = 1; // It's one big wave sequence
                this.spawnRate = 0; // Handled by sequencer
            } else {
                // Legacy / Story Mode
                this.isSequenced = false;
                this.maxWaves = 3 + (levelData.level * 2);
                this.spawnRate = Math.max(10, 60 - (levelData.level * 5));
            }
        } else {
            this.gameMode = 'ENDLESS';
            this.isSequenced = false;
            this.maxWaves = Infinity;
            this.spawnRate = 60;
        }
        this.startWave();
    }

    reset() {
        this.entities = [];
        this.bullets = [];
        this.particles.clear();
        this.player.reset();
        this.score = 0;
        this.wave = 1;
        this.wave = 1;
        this.coffeeRush = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.enemiesInWave = 0;
        this.levelTimer = 0;
        this.isSequenced = false; // Reset sequence flag
        this.waveEvents = []; // Clear wave events
        this.isWaitingForClear = false;
        this.updateUI();
    }

    startWave() {
        // Calculate enemies for this wave
        this.enemiesInWave = 5 + (this.wave * 3);
        this.spawnTimer = 0;
        this.updateUI();
    }

    loadLevel(data) {
        // Parse level JSON and spawn enemies at specific coords
        // For MVP, just endless spawning
    }

    onKeyDown(key) {
        if (key === ' ' || key === 'Space') this.player.dash();
    }

    onMouseDown(e) {
        this.player.shoot();
    }

    update() {
        if (this.isPaused) return;

        // Spawning Logic

        if (this.isSequenced) {
            // Sequencer Logic
            if (!this.isWaitingForClear) {
                this.levelTimer += 1 / 60;
            } else {
                if (this.entities.length === 0) {
                    this.isWaitingForClear = false;
                }
            }

            // Find events ready to trigger
            if (!this.isWaitingForClear) {
                for (let i = this.waveEvents.length - 1; i >= 0; i--) {
                    const ev = this.waveEvents[i];
                    if (this.levelTimer >= ev.time) {
                        this.executeEvent(ev);
                        this.waveEvents.splice(i, 1);
                    }
                }
            }

            // End condition for Sequencer? When events empty and no entities
            if (this.waveEvents.length === 0 && this.entities.length === 0 && !this.bossSpawned) {
                this.handleWin(); // Or next wave?
            }

        } else if (!this.bossSpawned) {
            this.spawnTimer++;
            // In story mode, stop spawning if we reached boss wave
            const canSpawn = this.gameMode === 'ENDLESS' || this.wave < this.maxWaves;

            // Faster spawn logic
            const currentSpawnRate = Math.max(15, this.spawnRate - (this.wave * 2));

            if (canSpawn && this.spawnTimer > currentSpawnRate && this.enemiesInWave > 0) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }

            // Trigger Boss in Story Mode
            if (this.gameMode === 'LEVEL' && this.wave >= this.maxWaves && this.entities.length === 0) {
                // Determine Boss type based on Level
                const level = this.levelParams.level || 0;
                let bossType = 'MOKA_BOSS';
                if (level % 3 === 1) bossType = 'ESPRESSO_BOT';
                else if (level % 3 === 2) bossType = 'FRAPPE_QUEEN';

                this.spawnBoss(bossType);
            }
        }

        // Entities
        this.player.update();

        this.bullets.forEach((b, i) => {
            b.update();
            if (!b.active) this.bullets.splice(i, 1);
        });

        this.entities.forEach((e, i) => {
            e.update(this.player);
            if (!e.active) this.entities.splice(i, 1);
        });

        this.particles.update();

        this.checkCollisions();
    }

    executeEvent(ev) {
        if (ev.type === 'WAIT') {
            this.isWaitingForClear = true;
        } else if (ev.type === 'DIALOGUE') {
            this.isPaused = true;
            import('./main.js').then(m => {
                m.story.showDialogue(ev.text, () => {
                    this.isPaused = false;
                });
            });
        } else {
            for (let k = 0; k < (ev.count || 1); k++) {
                if (ev.type === 'BOSS' || ev.type === 'MOKA_BOSS' || ev.type === 'ESPRESSO_BOT' || ev.type === 'FRAPPE_QUEEN') {
                    this.spawnBoss(ev.type);
                } else {
                    this.spawnEnemy(ev.pos);
                }
            }
        }
    }

    spawnEnemy(posOverride = null) {
        // Optimization: Don't spawn if too many entities
        if (this.entities.length > 300) return;

        const edge = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
        let x, y;
        const pad = 50;
        const w = window.gameState.width;
        const h = window.gameState.height;

        let posType = posOverride || ["TOP", "RIGHT", "BOTTOM", "LEFT"][edge];
        if (posType === 'RANDOM') posType = ["TOP", "RIGHT", "BOTTOM", "LEFT"][Math.floor(Math.random() * 4)];

        switch (posType) {
            case 'TOP': x = Math.random() * w; y = -pad; break;
            case 'RIGHT': x = w + pad; y = Math.random() * h; break;
            case 'BOTTOM': x = Math.random() * w; y = h + pad; break;
            case 'LEFT': x = -pad; y = Math.random() * h; break;
            case 'CIRCLE':
                const angle = Math.random() * Math.PI * 2;
                x = w / 2 + Math.cos(angle) * (w / 1.5);
                y = h / 2 + Math.sin(angle) * (h / 1.5);
                break;
            default: x = Math.random() * w; y = -pad; break;
        }

        this.entities.push(new Enemy(x, y, this.wave));
    }

    spawnBoss(type = 'MOKA_BOSS') {
        this.bossSpawned = true;
        let boss;
        let name = "MOKA MAN";

        if (type === 'ESPRESSO_BOT') {
            boss = new EspressoBot(window.gameState.width / 2, -100);
            name = "ESPRESSO BOT";
        } else if (type === 'FRAPPE_QUEEN') {
            boss = new FrappeQueen(window.gameState.width / 2, -100);
            name = "FRAPPE QUEEN";
        } else {
            boss = new MokaBoss(window.gameState.width / 2, -100);
        }

        boss.y = 100;
        this.entities.push(boss);

        // UI Alert
        const alert = document.createElement('div');
        alert.innerText = `WARNING: ${name} APPROACHING`;
        alert.className = "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-black text-4xl animate-pulse whitespace-nowrap";
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    checkCollisions() {
        // Bullets vs Enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            for (let j = this.entities.length - 1; j >= 0; j--) {
                const e = this.entities[j];
                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                if (dist < e.size + b.size) {
                    e.takeDamage(1);
                    b.active = false;
                    this.particles.createExplosion(e.x, e.y, e.color);
                    if (!e.active) {
                        this.score += 100;
                        this.coffeeRush = Math.min(100, this.coffeeRush + 5);
                        this.enemiesInWave--;

                        if (this.enemiesInWave <= 0) {
                            if (this.gameMode === 'ENDLESS' || this.wave < this.maxWaves) {
                                this.wave++;
                                this.startWave();
                            }
                        }
                        this.updateUI();
                    }

                    if (e instanceof MokaBoss && !e.active) {
                        this.bossDefeated = true;
                        this.handleWin();
                    }
                    break;
                }
            }
        }

        // Player vs Enemies
        for (let e of this.entities) {
            const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
            if (dist < this.player.size + e.size) {
                if (this.player.takeDamage()) {
                    this.handleGameOver();
                }
                this.updateUI();
            }
        }
    }

    updateUI() {
        this.scoreDisplay.innerText = this.score;
        this.waveDisplay.innerText = this.wave;
        this.enemiesLeftDisplay.innerText = this.gameMode === 'LEVEL' && this.wave >= this.maxWaves ? 'BOSS' : Math.max(0, this.enemiesInWave);
        this.rushMeter.style.width = `${this.coffeeRush}%`;

        let hearts = '';
        for (let i = 0; i < this.player.hp; i++) hearts += '♥';
        this.healthBar.innerText = hearts;
    }

    draw() {
        const ctx = window.gameState.ctx;
        this.bullets.forEach(b => b.draw(ctx));
        this.entities.forEach(e => e.draw(ctx));
        this.particles.draw(ctx);
        this.player.draw(ctx);
    }
    handleWin() {
        if (this.gameMode === 'LEVEL') {
            if (this.isSequenced) {
                // Determine if we should really end or just loop?
                // For Editor, we probably want to stop.
                this.isPaused = true;
                alert("SEQUENCE COMPLETE!");
                // Return to editor?
                window.gameState.mode = 'EDITOR';
                this.ui.classList.add('hidden');
                document.getElementById('editor-ui').classList.remove('hidden');
            } else {
                this.isPaused = true;
                import('./main.js').then(m => m.story.nextLevel());
            }
        } else {
            // Endless mode boss kill bonus
            this.score += 5000;
            this.bossSpawned = false; // Spawn another later?
            this.wave += 5;
            this.updateUI();
        }
    }

    handleGameOver() {
        if (this.isSequenced && this.levelParams && this.levelParams.level === 999) {
            // We are in Editor Test Mode
            alert("GAME OVER! Returning to Editor...");
            this.isPaused = true;
            this.ui.classList.add('hidden');
            document.getElementById('editor-ui').classList.remove('hidden');
            window.gameState.mode = 'EDITOR';
        } else {
            // Normal Game Over
            alert("GAME OVER! Score: " + this.score);
            window.location.reload();
        }
    }
}
