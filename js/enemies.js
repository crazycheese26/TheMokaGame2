export class Enemy {
    constructor(x, y, level = 1) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.speed = 2 + (level * 0.1);
        this.hp = 1 + Math.floor(level / 5);
        this.active = true;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.active = false;
        }
    }

    update(player) {
        // Chase Logic
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Triangle shape
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 5, this.y - 5, 4, 4);
        ctx.fillRect(this.x + 1, this.y - 5, 4, 4);
    }
}

export class MokaBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.size = 60;
        this.color = '#7f1d1d'; // Red-900
        this.hp = 100;
        this.maxHp = 100;
        this.phase = 0;
    }

    update(player) {
        // Boss Logic
        this.phaseTimer = (this.phaseTimer || 0) + 1;

        if (this.action === 'CHARGE') {
            this.x += Math.cos(this.angle) * this.speed * 3;
            this.y += Math.sin(this.angle) * this.speed * 3;
            if (this.phaseTimer > 60) {
                this.action = 'CHASE';
                this.phaseTimer = 0;
            }
        } else {
            // Chase
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.angle = angle;
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Randomly Charge
            if (this.phaseTimer > 120 && Math.random() < 0.02) {
                this.action = 'CHARGE';
                this.phaseTimer = 0;
            }
        }

        // Bounce off walls
        if (this.x < 0 || this.x > window.innerWidth) this.x -= Math.cos(this.angle) * 10;
        if (this.y < 0 || this.y > window.innerHeight) this.y -= Math.sin(this.angle) * 10;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shake effect if hit
        if (this.hitTimer > 0) {
            ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
            this.hitTimer--;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fff';
        ctx.font = '20px Orbitron';
        ctx.fillText("MOKA MAN", -50, -80);

        // Angry Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-20, -10); ctx.lineTo(-10, -5); ctx.lineTo(-20, 0); // Left Eye
        ctx.moveTo(20, -10); ctx.lineTo(10, -5); ctx.lineTo(20, 0); // Right Eye
        ctx.fill();

        // HP Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(-50, -70, 100, 10);
        ctx.fillStyle = 'red';
        ctx.fillRect(-50, -70, 100 * (this.hp / this.maxHp), 10);

        ctx.restore();
    }
}

export class EspressoBot extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.size = 40;
        this.color = '#facc15'; // Yellow-400
        this.hp = 60;
        this.maxHp = 60;
        this.speed = 5; // Fast!
        this.phaseTimer = 0;
    }

    update(player) {
        this.phaseTimer++;

        if (this.phaseTimer > 120) {
            // Teleport / Zip
            const angle = Math.random() * Math.PI * 2;
            this.x = player.x + Math.cos(angle) * 200;
            this.y = player.y + Math.sin(angle) * 200;
            this.phaseTimer = 0;
        } else {
            // Jittery chase
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }

        // Bounds
        this.x = Math.max(0, Math.min(window.innerWidth, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.phaseTimer * 0.2); // Spin

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();

        // Name tag static
        ctx.fillStyle = '#fff';
        ctx.font = '16px Orbitron';
        ctx.fillText("ESPRESSO BOT", this.x - 60, this.y - 60);

        // HP
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 40, this.y - 50, 80 * (this.hp / this.maxHp), 8);
    }
}

export class FrappeQueen extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.size = 80;
        this.color = '#e5e7eb'; // Gray-200
        this.hp = 200; // Tank
        this.maxHp = 200;
        this.speed = 1; // Slow
        this.spawnCooldown = 0;
    }

    update(player) {
        // Slow approach
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        this.spawnCooldown++;
        if (this.spawnCooldown > 300) { // Every 5s
            // Spawn foam minions (simulated by Game logic ideally, but check if we can spawn here)
            // Since we don't have access to Game.entities here easily without circular dep or passing game,
            // we'll just heal slightly for now, or rely on Game logic?
            // Actually, let's just make her shoot projectiles if we had projectile logic.
            // For now, simple self-heal to simulate "shielding" with foam/cream
            this.hp = Math.min(this.maxHp, this.hp + 10);
            this.spawnCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.moveTo(-40, -60);
        ctx.lineTo(-20, -100);
        ctx.lineTo(0, -60);
        ctx.lineTo(20, -100);
        ctx.lineTo(40, -60);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = '24px Orbitron';
        ctx.fillText("FRAPPE QUEEN", this.x - 80, this.y - 110);

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 60, this.y - 100, 120 * (this.hp / this.maxHp), 12);
    }
}

// Global expose for Game.js dynamic instantiation
window.EspressoBot = EspressoBot;
window.FrappeQueen = FrappeQueen;
