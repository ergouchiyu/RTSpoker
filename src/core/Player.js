/**
 * 玩家类
 */
class Player {
    constructor(id, isAI = false) {
        this.id = id;
        this.isAI = isAI;
        
        // 资源
        this.supply = CONSTANTS.INITIAL_SUPPLY;
        this.population = 0;
        this.maxPopulation = CONSTANTS.MAX_POPULATION;
        
        // 手牌
        this.hand = [];
        
        // 部队
        this.units = [];
        
        // 出过的牌（已打出的牌）
        this.playedCards = [];
        
        // 当前回合
        this.isCurrentTurn = false;
        
        // 位置（用于布局）
        this.side = id === 0 ? 'bottom' : 'top';
    }
    
    /**
     * 发牌
     */
    dealCards(cards) {
        this.hand = cards;
    }
    
    /**
     * 获取手牌数量
     */
    getHandSize() {
        return this.hand.length;
    }
    
    /**
     * 获取单张牌的收入
     */
    getIncomePerCard() {
        return Helpers.getIncomePerCard(this.hand.length);
    }
    
    /**
     * 获取总收入
     */
    getTotalIncome() {
        let total = 0;
        for (const card of this.hand) {
            total += card.getActualIncome() * this.getIncomePerCard();
        }
        return total;
    }
    
    /**
     * 增加补给
     */
    addSupply(amount) {
        this.supply += amount;
    }
    
    /**
     * 消耗补给
     */
    spendSupply(amount) {
        if (this.supply >= amount) {
            this.supply -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * 检查是否可以购买
     */
    canAfford(cost) {
        return this.supply >= cost;
    }
    
    /**
     * 检查人口是否已满
     */
    isPopulationFull() {
        return this.population >= this.maxPopulation;
    }
    
    /**
     * 添加单位
     */
    addUnit(unit) {
        this.units.push(unit);
        this.population++;
    }
    
    /**
     * 移除单位
     */
    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index !== -1) {
            this.units.splice(index, 1);
            this.population--;
        }
    }
    
    /**
     * 出牌
     */
    playCard(card) {
        const index = this.hand.indexOf(card);
        if (index !== -1) {
            this.hand.splice(index, 1);
            this.playedCards.push(card);
            return true;
        }
        return false;
    }
    
    /**
     * 检查是否获胜（手牌为空）
     */
    hasWon() {
        return this.hand.length === 0;
    }
    
    /**
     * 获取选中的牌
     */
    getSelectedCards() {
        return this.hand.filter(card => card.isSelected);
    }
    
    /**
     * 取消所有选中
     */
    deselectAll() {
        for (const card of this.hand) {
            card.isSelected = false;
        }
    }
    
    /**
     * 更新手牌位置
     */
    updateHandPositions(canvasWidth, canvasHeight) {
        const { CARD_WIDTH, CARD_HEIGHT } = CONSTANTS;
        const padding = 10;
        const totalWidth = this.hand.length * (CARD_WIDTH + padding) - padding;
        const startX = (canvasWidth - totalWidth) / 2;
        
        let y;
        if (this.side === 'bottom') {
            y = canvasHeight - CARD_HEIGHT - 80; // 底部留空给UI
        } else {
            y = 80; // 顶部留空给UI
        }
        
        for (let i = 0; i < this.hand.length; i++) {
            const card = this.hand[i];
            card.targetX = startX + i * (CARD_WIDTH + padding);
            card.targetY = y;
            card.isRevealed = this.side === 'bottom'; // 底部玩家看正面
        }
    }
    
    /**
     * 更新
     */
    update(deltaTime) {
        // 更新手牌
        for (const card of this.hand) {
            card.update(deltaTime);
        }
        
        // 更新单位
        for (const unit of this.units) {
            unit.update(deltaTime);
        }
    }
    
    /**
     * 绘制
     */
    draw(ctx) {
        // 绘制手牌
        for (const card of this.hand) {
            card.draw(ctx);
        }
        
        // 绘制单位
        for (const unit of this.units) {
            unit.draw(ctx);
        }
    }
}
