/**
 * 玩家类 - 每个玩家有固定id、固定颜色、固定位置
 */
class Player {
    constructor(id, isAI, side) {
        this.id = id;                    // 0,1,2,3 不可变
        this.isAI = isAI;
        this.side = side;                // bottom,top,left,right 不可变
        this.color = CONSTANTS.PLAYER_COLORS[id];  // 固定颜色
        this.name = CONSTANTS.PLAYER_NAMES[id];
        this.supply = CONSTANTS.INITIAL_SUPPLY;
        this.population = 0;
        this.maxPopulation = CONSTANTS.MAX_POPULATION;
        this.hand = [];
        this.units = [];
        this.isCurrentTurn = false;
    }
    dealCards(cards) { this.hand = cards; }
    getIncomePerCard() { return Helpers.getIncomePerCard(this.hand.length); }
    getTotalIncome() {
        return this.hand.reduce((sum, c) => sum + c.getActualIncome() * this.getIncomePerCard(), 0);
    }
    addSupply(v) { this.supply += v; }
    spendSupply(v) { if (this.supply >= v) { this.supply -= v; return true; } return false; }
    canAfford(v) { return this.supply >= v; }
    isPopulationFull() { return this.population >= this.maxPopulation; }
    addUnit(u) { this.units.push(u); this.population++; }
    removeUnit(u) {
        const i = this.units.indexOf(u);
        if (i !== -1) { this.units.splice(i, 1); this.population--; }
    }
    playCard(c) {
        const i = this.hand.indexOf(c);
        if (i !== -1) { this.hand.splice(i, 1); return true; }
        return false;
    }
    hasWon() { return this.hand.length === 0; }
    getSelectedCards() { return this.hand.filter(c => c.isSelected); }
    deselectAll() { this.hand.forEach(c => c.isSelected = false); }
    deselectAllUnits() { this.units.forEach(u => u.isSelected = false); }

    updateHandPositions(cw, ch) {
        const cw2 = CONSTANTS.CARD_WIDTH, ch2 = CONSTANTS.CARD_HEIGHT, gap = 6;
        const total = this.hand.length * (cw2 + gap) - gap;
        let sx, sy;
        switch (this.side) {
            case 'bottom': sx = (cw - total)/2; sy = ch - ch2 - 55; break;
            case 'top':    sx = (cw - total)/2; sy = 35; break;
            case 'left':   sx = 15; sy = (ch - total)/2; break;
            case 'right':  sx = cw - cw2 - 15; sy = (ch - total)/2; break;
        }
        for (let i = 0; i < this.hand.length; i++) {
            const c = this.hand[i];
            if (this.side === 'left' || this.side === 'right') {
                c.targetX = sx; c.targetY = sy + i * (cw2 + gap);
            } else {
                c.targetX = sx + i * (cw2 + gap); c.targetY = sy;
            }
            c.isRevealed = (this.side === 'bottom');
        }
    }

    update(dt) {
        this.hand.forEach(c => c.update(dt));
        this.units.forEach(u => u.update(dt));
    }
}
