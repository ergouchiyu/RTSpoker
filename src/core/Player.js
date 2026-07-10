/**
 * 玩家类 - 修复手牌位置不被UI挡住
 */
class Player {
    constructor(id, isAI = false, side = 'bottom') {
        this.id = id;
        this.isAI = isAI;
        this.side = side;
        this.supply = CONSTANTS.INITIAL_SUPPLY;
        this.population = 0;
        this.maxPopulation = CONSTANTS.MAX_POPULATION;
        this.hand = [];
        this.units = [];
        this.playedCards = [];
        this.isCurrentTurn = false;
    }

    dealCards(cards) { this.hand = cards; }
    getHandSize() { return this.hand.length; }
    getIncomePerCard() { return Helpers.getIncomePerCard(this.hand.length); }

    getTotalIncome() {
        let total = 0;
        for (const card of this.hand) {
            total += card.getActualIncome() * this.getIncomePerCard();
        }
        return total;
    }

    addSupply(amount) { this.supply += amount; }
    spendSupply(amount) {
        if (this.supply >= amount) { this.supply -= amount; return true; }
        return false;
    }
    canAfford(cost) { return this.supply >= cost; }
    isPopulationFull() { return this.population >= this.maxPopulation; }

    addUnit(unit) { this.units.push(unit); this.population++; }
    removeUnit(unit) {
        const idx = this.units.indexOf(unit);
        if (idx !== -1) { this.units.splice(idx, 1); this.population--; }
    }

    playCard(card) {
        const idx = this.hand.indexOf(card);
        if (idx !== -1) { this.hand.splice(idx, 1); this.playedCards.push(card); return true; }
        return false;
    }

    hasWon() { return this.hand.length === 0; }
    getSelectedCards() { return this.hand.filter(c => c.isSelected); }
    deselectAll() { for (const c of this.hand) c.isSelected = false; }

    updateHandPositions(cw, ch) {
        const cardW = CONSTANTS.CARD_WIDTH;
        const cardH = CONSTANTS.CARD_HEIGHT;
        const gap = 6;
        const total = this.hand.length * (cardW + gap) - gap;

        // UI 避让距离
        const bottomMargin = 55;  // 底部按钮栏高度
        const topMargin = 30;     // 顶部信息栏高度
        const sideMargin = 20;

        let startX, startY;

        switch (this.side) {
            case 'bottom':
                startX = (cw - total) / 2;
                startY = ch - cardH - bottomMargin;
                break;
            case 'top':
                startX = (cw - total) / 2;
                startY = topMargin;
                break;
            case 'left':
                startX = sideMargin;
                startY = (ch - total) / 2;
                break;
            case 'right':
                startX = cw - cardW - sideMargin;
                startY = (ch - total) / 2;
                break;
        }

        for (let i = 0; i < this.hand.length; i++) {
            const card = this.hand[i];
            if (this.side === 'left' || this.side === 'right') {
                card.targetX = startX;
                card.targetY = startY + i * (cardW + gap);
            } else {
                card.targetX = startX + i * (cardW + gap);
                card.targetY = startY;
            }
            card.isRevealed = (this.side === 'bottom');
        }
    }

    update(dt) {
        for (const c of this.hand) c.update(dt);
        for (const u of this.units) u.update(dt);
    }

    draw(ctx) {
        for (const c of this.hand) c.draw(ctx);
        for (const u of this.units) if (!u.dead) u.draw(ctx);
    }
}
