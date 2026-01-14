import { game } from './main.js';

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * 18; // Slightly faster
        this.vy = Math.sin(angle) * 18;
        this.angle = angle;
        this.size = 3;
        this.active = true;
        this.color = '#00f3ff'; // Neon Cyan
        this.trailTimer = 0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > window.gameState.width || this.y < 0 || this.y > window.gameState.height) {
            this.active = false;
        }
        // Trail effect - more frequent
        this.trailTimer++;
        if (this.trailTimer % 2 === 0) game.particles.create(this.x, this.y, '#ffffff', 1);
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // Core (White hot)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2); // Capsule shape
        ctx.fill();

        // Outer Aura (Cyan)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20; // Adjusted for image
        this.speed = 6;
        this.hp = 3;
        this.color = '#00f3ff';
        this.dashCooldown = 0;
        this.invincibleTimer = 0;
        this.angle = 0;

        // Load Sprite
        this.sprite = new Image();
        this.sprite.src = "Spoon.webp";
    }

    reset() {
        this.hp = 3;
        this.dashCooldown = 0;
        this.invincibleTimer = 0;
    }

    update() {
        // Movement
        const keys = window.gameState.keys;
        let dx = 0, dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            this.x += (dx / len) * this.speed;
            this.y += (dy / len) * this.speed;
        }

        // Mouse Aim
        const mouse = window.gameState.mouse;
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Boundaries
        this.x = Math.max(this.size, Math.min(window.gameState.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(window.gameState.height - this.size, this.y));

        // Timers
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
    }

    shoot() {
        game.bullets.push(new Bullet(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, this.angle));
        // Recoil
        this.x -= Math.cos(this.angle) * 4;
        this.y -= Math.sin(this.angle) * 4;
    }

    dash() {
        if (this.dashCooldown > 0) return;

        const mouse = window.gameState.mouse;
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        this.x += Math.cos(angle) * 120;
        this.y += Math.sin(angle) * 120;
        this.dashCooldown = 60;

        game.particles.createExplosion(this.x, this.y, '#00f3ff');
    }

    takeDamage() {
        if (this.invincibleTimer > 0) return false;
        this.hp--;
        this.invincibleTimer = 60;
        game.particles.createExplosion(this.x, this.y, '#ffffff'); // White explosion
        return this.hp <= 0;
    }

    draw(ctx) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Base Rotation (Aim)
        // Image is upright (tip at top), so we need to add 90 degrees (PI/2) 
        // because 0 degrees in canvas is 3 o'clock (Right), but our sprite is 12 o'clock (Up).
        ctx.rotate(this.angle + Math.PI / 2);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Draw Sprite
        // Assuming sprite is roughly square or we draw it centered
        const w = 40;
        const h = 60; // Make it a bit elongated
        try {
            ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        } catch (e) {
            // Fallback drawing if image fails/not loaded yet
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, -20, 10, 40);
        }

        ctx.restore();
    }
}
