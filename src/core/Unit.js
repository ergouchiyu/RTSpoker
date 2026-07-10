/**
 * 单位类 - 颜色完全由 owner.color 决定
 */
class Unit {
    constructor(type, owner, x, y) {
        this.id = Helpers.generateId();
        this.type = type;
        this.owner = owner;           // Player 对象，不可变
        const cfg = CONSTANTS.UNITS[type.toUpperCase()];
        this.name = cfg.name;
        this.maxHp = cfg.hp;
        this.hp = cfg.hp;
        this.attack = cfg.attack;
        this.speed = cfg.speed;
        this.size = cfg.size;
        this.x = x; this.y = y;
        this.targetX = x; this.targetY = y;
        this.target = null;
        this.state = 'idle';
        this.isSelected = false;
        this.dead = false;
    }

    moveTo(x, y) { this.targetX = x; this.targetY = y; this.target = null; this.state = 'moving'; }
    attackTarget(card) { this.target = card; this.state = 'moving'; }

    update(dt) {
        if (this.dead) return;
        if (this.state === 'moving') this.updateMoving(dt);
        else if (this.state === 'attacking') this.updateAttacking(dt);
    }

    updateMoving(dt) {
        if (this.target) {
            this.targetX = this.target.x + CONSTANTS.CARD_WIDTH / 2;
            this.targetY = this.target.y + CONSTANTS.CARD_HEIGHT / 2;
        }
        const dx = this.targetX - this.x, dy = this.targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
            this.x = this.targetX; this.y = this.targetY;
            this.state = this.target ? 'attacking' : 'idle';
        } else {
            this.x += (dx/dist) * this.speed;
            this.y += (dy/dist) * this.speed;
        }
    }

    updateAttacking(dt) {
        if (!this.target || this.target.hp <= 0) { this.target = null; this.state = 'idle'; return; }
        this.target.takeDamage(this.attack * dt / 1000);
    }

    takeDamage(v) { this.hp -= v; if (this.hp <= 0) this.die(); }
    die() {
        this.dead = true;
        this.owner.removeUnit(this);
        Game.onUnitDestroyed(this);
    }

    draw(ctx) {
        if (this.dead) return;
        const color = this.owner.color;  // 用 owner 的固定颜色

        // 选中光环
        if (this.isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 身体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 类型标记
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'infantry' ? '兵' : '工', this.x, this.y);

        // 攻击状态
        if (this.state === 'attacking') {
            ctx.fillStyle = '#ff0';
            ctx.font = '12px Arial';
            ctx.fillText('⚔', this.x, this.y - this.size - 10);
        }

        // 血条
        if (this.hp < this.maxHp) {
            const bw = this.size * 2, bh = 3;
            const bx = this.x - bw/2, by = this.y - this.size - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
        }
    }

    containsPoint(px, py) { return Helpers.distance(px, py, this.x, this.y) <= this.size; }
}
