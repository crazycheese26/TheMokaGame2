import { game } from './main.js';

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * 15;
        this.vy = Math.sin(angle) * 15;
        this.size = 4;
        this.active = true;
        this.color = '#ffff00';
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > window.gameState.width || this.y < 0 || this.y > window.gameState.height) {
            this.active = false;
        }
        // Trail effect
        if (Math.random() < 0.3) game.particles.create(this.x, this.y, this.color, 2);
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 6;
        this.hp = 3;
        this.color = '#ffffff';
        this.dashCooldown = 0;
        this.invincibleTimer = 0;
        this.angle = 0;
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
        game.bullets.push(new Bullet(this.x, this.y, this.angle));
        // Recoil
        this.x -= Math.cos(this.angle) * 2;
        this.y -= Math.sin(this.angle) * 2;
    }

    dash() {
        if (this.dashCooldown > 0) return;

        const mouse = window.gameState.mouse;
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        this.x += Math.cos(angle) * 100;
        this.y += Math.sin(angle) * 100;
        this.dashCooldown = 60;

        game.particles.createExplosion(this.x, this.y, '#00f3ff');
    }

    takeDamage() {
        if (this.invincibleTimer > 0) return false;
        this.hp--;
        this.invincibleTimer = 60;
        game.particles.createExplosion(this.x, this.y, '#ff0000');
        return this.hp <= 0;
    }

    draw(ctx) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-10, -10, 20, 20);

        // Gun
        ctx.fillStyle = '#ccc';
        ctx.fillRect(10, -4, 15, 8);

        ctx.restore();
        ctx.shadowBlur = 0;
    }
}
