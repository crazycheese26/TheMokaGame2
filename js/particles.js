export class ParticleSystem {
    constructor() {
        this.poolSize = 500;
        this.pool = new Array(this.poolSize).fill(null).map(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff', size: 2, decay: 0.05, active: false
        }));
    }

    create(x, y, color, size, speed = 1) {
        // Find first inactive particle
        const p = this.pool.find(p => !p.active);
        if (p) {
            p.active = true;
            p.x = x;
            p.y = y;
            p.color = color;
            p.size = size;
            p.life = 1.0;
            const angle = Math.random() * Math.PI * 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.decay = Math.random() * 0.05 + 0.02;
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.create(x, y, color, Math.random() * 3 + 1, Math.random() * 5);
        }
    }

    update() {
        for (let i = 0; i < this.poolSize; i++) {
            const p = this.pool[i];
            if (p.active) {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) p.active = false;
            }
        }
    }

    draw(ctx) {
        // Optimization: Batch similar colors? For now just simple loop is fine with 500 cap
        // Actually, let's use globalAlpha once per batch if we group by alpha, but life varies.
        // Just draw.
        for (let i = 0; i < this.poolSize; i++) {
            const p = this.pool[i];
            if (p.active) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    }

    clear() {
        this.pool.forEach(p => p.active = false);
    }
}
