/**
 * 玩家类
 */
class Player {
    constructor(id, isAI = false, side = 'bottom') {
        this.id = id;
        this.isAI = isAI;
        this.side = side; // bottom, top, left, right
        
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
        if (this.supply >= amount) {
            this.supply -= amount;
            return true;
        }
        return false;
    }

    canAfford(cost) { return this.supply >= cost; }
    isPopulationFull() { return this.population >= this.maxPopulation; }

    addUnit(unit) {
        this.units.push(unit);
        this.population++;
    }

    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index !== -1) {
            this.units.splice(index, 1);
            this.population--;
        }
    }

    playCard(card) {
        const index = this.hand.indexOf(card);
        if (index !== -1) {
            this.hand.splice(index, 1);
            this.playedCards.push(card);
            return true;
        }
        return false;
    }

    hasWon() { return this.hand.length === 0; }

    getSelectedCards() { return this.hand.filter(card => card.isSelected); }

    deselectAll() {
        for (const card of this.hand) card.isSelected = false;
    }

    updateHandPositions(canvasWidth, canvasHeight) {
        const { CARD_WIDTH, CARD_HEIGHT } = CONSTANTS;
        const padding = 5;
        const totalWidth = this.hand.length * (CARD_WIDTH + padding) - padding;
        const totalHeight = this.hand.length * (CARD_WIDTH + padding) - padding;

        switch (this.side) {
            case 'bottom': {
                const startX = (canvasWidth - totalWidth) / 2;
                const y = canvasHeight - CARD_HEIGHT - 20;
                for (let i = 0; i < this.hand.length; i++) {
                    this.hand[i].targetX = startX + i * (CARD_WIDTH + padding);
                    this.hand[i].targetY = y;
                    this.hand[i].isRevealed = true;
                }
                break;
            }
            case 'top': {
                const startX = (canvasWidth - totalWidth) / 2;
                const y = 20;
                for (let i = 0; i < this.hand.length; i++) {
                    this.hand[i].targetX = startX + i * (CARD_WIDTH + padding);
                    this.hand[i].targetY = y;
                    this.hand[i].isRevealed = false;
                }
                break;
            }
            case 'left': {
                const x = 20;
                const startY = (canvasHeight - totalHeight) / 2;
                for (let i = 0; i < this.hand.length; i++) {
                    this.hand[i].targetX = x;
                    this.hand[i].targetY = startY + i * (CARD_WIDTH + padding);
                    this.hand[i].isRevealed = false;
                }
                break;
            }
            case 'right': {
                const x = canvasWidth - CARD_HEIGHT - 20;
                const startY = (canvasHeight - totalHeight) / 2;
                for (let i = 0; i < this.hand.length; i++) {
                    this.hand[i].targetX = x;
                    this.hand[i].targetY = startY + i * (CARD_WIDTH + padding);
                    this.hand[i].isRevealed = false;
                }
                break;
            }
        }
    }

    update(deltaTime) {
        for (const card of this.hand) card.update(deltaTime);
        for (const unit of this.units) unit.update(deltaTime);
    }

    draw(ctx) {
        for (const card of this.hand) card.draw(ctx);
        for (const unit of this.units) unit.draw(ctx);
    }
}
