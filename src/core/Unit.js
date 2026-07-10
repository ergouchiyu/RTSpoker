/**
 * 单位类 - 只在玩家指挥时行动
 */
class Unit {
    constructor(type, owner, x, y) {
        this.id = Helpers.generateId();
        this.type = type;
        this.owner = owner;
        const config = CONSTANTS.UNITS[type.toUpperCase()];
        this.name = config.name;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.attack = config.attack;
        this.speed = config.speed;
        this.size = config.size;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.state = 'idle'; // idle / moving / attacking
        this.isSelected = false;
        this.dead = false; // 标记是否死亡
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.state = 'moving';
    }

    attackTarget(card) {
        this.target = card;
        this.state = 'moving';
    }

    update(dt) {
        if (this.dead) return;

        switch (this.state) {
            case 'idle':
                break;
            case 'moving':
                this.updateMoving(dt);
                break;
            case 'attacking':
                this.updateAttacking(dt);
                break;
        }
    }

    updateMoving(dt) {
        if (this.target) {
            this.targetX = this.target.x + CONSTANTS.CARD_WIDTH / 2;
            this.targetY = this.target.y + CONSTANTS.CARD_HEIGHT / 2;
        }
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
            this.x = this.targetX;
            this.y = this.targetY;
            if (this.target) {
                this.state = 'attacking';
            } else {
                this.state = 'idle';
            }
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    updateAttacking(dt) {
        if (!this.target || this.target.hp <= 0) {
            this.target = null;
            this.state = 'idle';
            return;
        }
        this.target.takeDamage(this.attack * dt / 1000);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        // 从玩家列表移除
        this.owner.removeUnit(this);
        // 从游戏选择列表移除
        if (typeof Game !== 'undefined') {
            Game.onUnitDestroyed(this);
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();

        const color = this.owner.id === 0 ? CONSTANTS.COLORS.PLAYER1 : CONSTANTS.COLORS.PLAYER2;

        // 选中光环
        if (this.isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.type === 'infantry') {
            // 步兵 - 圆形+头盔
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size * 0.3, this.size * 0.6, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.size, this.y);
            ctx.lineTo(this.x + this.size + 10, this.y - 5);
            ctx.stroke();
        } else {
            // 工程师 - 圆形+黄帽
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size * 0.5, this.size * 0.7, Math.PI, 0);
            ctx.fill();
        }

        // 状态指示
        if (this.state === 'attacking') {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔', this.x, this.y - this.size - 12);
        }

        // 血条
        if (this.hp < this.maxHp) {
            const bw = this.size * 2;
            const bh = 4;
            const bx = this.x - bw / 2;
            const by = this.y - this.size - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
        }

        ctx.restore();
    }

    containsPoint(px, py) {
        return Helpers.distance(px, py, this.x, this.y) <= this.size;
    }
}
