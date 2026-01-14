import { Game } from './game.js';
import { Editor } from './editor.js';
import { Story } from './story.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Global State
window.gameState = {
    mode: 'MENU', // MENU, PLAY, EDITOR, CUTSCENE
    width: 0,
    height: 0,
    ctx: ctx,
    canvas: canvas,
    keys: {},
    mouse: { x: 0, y: 0, isDown: false },
    dt: 0,
    lastTime: 0
};

// Sub-systems
let game = null;
let editor = null;
let story = null;

function resize() {
    window.gameState.width = window.innerWidth;
    window.gameState.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
window.addEventListener('keydown', (e) => {
    window.gameState.keys[e.key] = true;
    if (window.gameState.mode === 'PLAY') game.onKeyDown(e.key);
});
window.addEventListener('keyup', (e) => window.gameState.keys[e.key] = false);
window.addEventListener('mousedown', (e) => {
    window.gameState.mouse.isDown = true;
    if (window.gameState.mode === 'PLAY') game.onMouseDown(e);
});
window.addEventListener('mouseup', () => window.gameState.mouse.isDown = false);
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    window.gameState.mouse.x = e.clientX - rect.left;
    window.gameState.mouse.y = e.clientY - rect.top;
});
// Touch support
window.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        window.gameState.mouse.isDown = true;
        window.gameState.mouse.x = e.touches[0].clientX;
        window.gameState.mouse.y = e.touches[0].clientY;
    }
}, { passive: false });
window.addEventListener('touchend', () => window.gameState.mouse.isDown = false);

// Init Systems
game = new Game();
editor = new Editor();
story = new Story();

// UI Buttons
document.getElementById('btn-story').addEventListener('click', () => {
    document.getElementById('title-screen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('title-screen').classList.add('hidden');
        story.startStoryMode();
    }, 500);
});

document.getElementById('btn-endless').addEventListener('click', () => {
    document.getElementById('title-screen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('title-screen').classList.add('hidden');
        game.start('ENDLESS');
    }, 500);
});

document.getElementById('btn-editor').addEventListener('click', () => {
    document.getElementById('title-screen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('title-screen').classList.add('hidden');
        editor.start();
    }, 500);
});

// Main Loop
// Main Loop
function loop(timestamp) {
    if (!window.gameState.lastTime) window.gameState.lastTime = timestamp;
    const dt = (timestamp - window.gameState.lastTime) / 1000;
    window.gameState.lastTime = timestamp;
    window.gameState.dt = Math.min(dt, 0.1); // Cap dt to prevent huge jumps on lag spike

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background Grid (Syntrowave style)
    drawGrid(timestamp);

    // Update & Draw based on mode
    if (window.gameState.mode === 'PLAY') {
        game.update(window.gameState.dt);
        game.draw();
    } else if (window.gameState.mode === 'EDITOR') {
        editor.update(window.gameState.dt);
        editor.draw();
    } else if (window.gameState.mode === 'CUTSCENE') {
        story.update(window.gameState.dt);
        // background is enough
    }

    requestAnimationFrame(loop);
}

function drawGrid(time) {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Moving grid floor effect
    const speed = 50;
    const offset = (time * 0.05) % 50;

    for (let x = 0; x <= canvas.width; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = offset; y <= canvas.height; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

requestAnimationFrame(loop);

export { game, editor, story };
