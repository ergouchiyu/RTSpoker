/**
 * 扑克牌类
 */
class Card {
    constructor(suit, rank, owner) {
        this.id = Helpers.generateId();
        this.suit = suit;
        this.rank = rank;
        this.owner = owner;
        
        // 状态
        this.hp = CONSTANTS.CARD_HP;
        this.maxHp = CONSTANTS.CARD_HP;
        this.income = CONSTANTS.CARD_INCOME_BASE;
        
        // 位置
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // 动画
        this.isRevealed = false; // 是否正面显示
        this.isAnimating = false;
        this.animationProgress = 0;
        
        // 选中状态
        this.isSelected = false;
        
        // 维修状态
        this.isRepairing = false;
    }
    
    /**
     * 获取牌的显示文本
     */
    getDisplayText() {
        return `${this.suit}${this.rank}`;
    }
    
    /**
     * 获取牌的数值
     */
    getValue() {
        return Helpers.getCardValue(this.rank);
    }
    
    /**
     * 获取完整度百分比
     */
    getHpPercent() {
        return this.hp / this.maxHp;
    }
    
    /**
     * 获取实际收入（考虑完整度）
     */
    getActualIncome() {
        return this.income * this.getHpPercent();
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.onDestroy();
        }
    }
    
    /**
     * 维修恢复
     */
    repair(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    
    /**
     * 销毁时调用
     */
    onDestroy() {
        // 通知游戏系统
        if (typeof Game !== 'undefined') {
            Game.onCardDestroyed(this);
        }
    }
    
    /**
     * 更新位置（平滑移动）
     */
    update(deltaTime) {
        // 移动到目标位置
        const moveSpeed = 0.1;
        this.x = Helpers.lerp(this.x, this.targetX, moveSpeed);
        this.y = Helpers.lerp(this.y, this.targetY, moveSpeed);
        
        // 检查是否到达目标位置
        if (Helpers.distance(this.x, this.y, this.targetX, this.targetY) < 1) {
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }
    
    /**
     * 绘制牌
     */
    draw(ctx) {
        ctx.save();
        
        const { CARD_WIDTH, CARD_HEIGHT, COLORS } = CONSTANTS;
        
        // 绘制牌背或牌面
        if (this.isRevealed) {
            this.drawFront(ctx);
        } else {
            this.drawBack(ctx);
        }
        
        // 绘制完整度条
        if (this.hp < this.maxHp) {
            this.drawHpBar(ctx);
        }
        
        // 绘制选中状态
        if (this.isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4);
        }
        
        // 绘制维修状态
        if (this.isRepairing) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔧', this.x + CARD_WIDTH / 2, this.y - 5);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制牌面
     */
    drawFront(ctx) {
        const { CARD_WIDTH, CARD_HEIGHT, COLORS } = CONSTANTS;
        
        // 牌背景
        ctx.fillStyle = COLORS.CARD_FRONT;
        ctx.fillRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);
        
        // 牌边框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);
        
        // 花色颜色
        const isRed = this.suit === '♥' || this.suit === '♦';
        ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
        
        // 牌面文字
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.rank, this.x + CARD_WIDTH / 2, this.y + 30);
        
        // 花色
        ctx.font = '24px Arial';
        ctx.fillText(this.suit, this.x + CARD_WIDTH / 2, this.y + 60);
    }
    
    /**
     * 绘制牌背
     */
    drawBack(ctx) {
        const { CARD_WIDTH, CARD_HEIGHT, COLORS } = CONSTANTS;
        
        // 牌背背景
        ctx.fillStyle = COLORS.CARD_BACK;
        ctx.fillRect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT);
        
        // 牌背图案
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🂠', this.x + CARD_WIDTH / 2, this.y + 50);
    }
    
    /**
     * 绘制完整度条
     */
    drawHpBar(ctx) {
        const { CARD_WIDTH, CARD_HEIGHT, COLORS } = CONSTANTS;
        
        const barWidth = CARD_WIDTH - 10;
        const barHeight = 6;
        const barX = this.x + 5;
        const barY = this.y + CARD_HEIGHT + 5;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const hpPercent = this.getHpPercent();
        const hpColor = hpPercent > 0.5 ? COLORS.HP_GREEN : COLORS.HP_RED;
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        
        // 数字
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(this.hp)}`, this.x + CARD_WIDTH / 2, barY + barHeight + 12);
    }
    
    /**
     * 检查点击
     */
    containsPoint(px, py) {
        return Helpers.pointInRect(px, py, this.x, this.y, CONSTANTS.CARD_WIDTH, CONSTANTS.CARD_HEIGHT);
    }
}
