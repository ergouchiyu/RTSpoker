/**
 * 扑克牌类
 */
class Card {
    constructor(suit, rank, owner) {
        this.id = Helpers.generateId();
        this.suit = suit;
        this.rank = rank;
        this.owner = owner;
        this.hp = CONSTANTS.CARD_HP;
        this.maxHp = CONSTANTS.CARD_HP;
        this.income = CONSTANTS.CARD_INCOME_BASE;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.isRevealed = false;
        this.isSelected = false;
        this.isRepairing = false;
    }

    getDisplayText() { return `${this.suit}${this.rank}`; }
    getValue() { return Helpers.getCardValue(this.rank); }
    getHpPercent() { return this.hp / this.maxHp; }
    getActualIncome() { return this.income * this.getHpPercent(); }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) this.onDestroy();
    }

    repair(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

    onDestroy() {
        if (typeof Game !== 'undefined') Game.onCardDestroyed(this);
    }

    update(deltaTime) {
        const moveSpeed = 0.15;
        this.x = Helpers.lerp(this.x, this.targetX, moveSpeed);
        this.y = Helpers.lerp(this.y, this.targetY, moveSpeed);
    }

    draw(ctx) {
        ctx.save();
        const { CARD_WIDTH, CARD_HEIGHT } = CONSTANTS;

        if (this.isRevealed) {
            // 牌面
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);
            ctx.strokeStyle = this.isSelected ? '#e94560' : '#333';
            ctx.lineWidth = this.isSelected ? 3 : 1;
            ctx.strokeRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);

            const isRed = this.suit === '♥' || this.suit === '♦';
            ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.rank, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2 - 8);
            ctx.font = '18px Arial';
            ctx.fillText(this.suit, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2 + 12);
        } else {
            // 牌背
            ctx.fillStyle = '#e94560';
            ctx.fillRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🂠', this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2);
        }

        // 选中高亮
        if (this.isSelected) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4);
        }

        // 完整度条（如果受损）
        if (this.hp < this.maxHp) {
            const barW = CARD_WIDTH - 6;
            const barH = 4;
            const barX = this.x + 3;
            const barY = this.y + CARD_HEIGHT + 3;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = this.getHpPercent() > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(barX, barY, barW * this.getHpPercent(), barH);
        }

        ctx.restore();
    }

    containsPoint(px, py) {
        return Helpers.pointInRect(px, py, this.x, this.y, CONSTANTS.CARD_WIDTH, CONSTANTS.CARD_HEIGHT);
    }
}
