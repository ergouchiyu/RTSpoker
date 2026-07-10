/**
 * 经济系统
 */
class EconomySystem {
    constructor() {
        this.incomeTimer = 0;
        this.incomeInterval = 1000; // 每秒结算一次
    }
    
    /**
     * 更新经济系统
     */
    update(deltaTime, players) {
        this.incomeTimer += deltaTime;
        
        // 每秒结算收入
        if (this.incomeTimer >= this.incomeInterval) {
            this.incomeTimer -= this.incomeInterval;
            this.processIncome(players);
        }
    }
    
    /**
     * 处理收入
     */
    processIncome(players) {
        for (const player of players) {
            const income = player.getTotalIncome();
            player.addSupply(income);
        }
    }
    
    /**
     * 获取玩家收入信息
     */
    getIncomeInfo(player) {
        const baseIncome = player.getIncomePerCard();
        const cardCount = player.getHandSize();
        const totalIncome = player.getTotalIncome();
        
        return {
            baseIncome,
            cardCount,
            totalIncome,
            supply: player.supply
        };
    }
    
    /**
     * 计算维修费用
     */
    getRepairCost(deltaTime) {
        return CONSTANTS.REPAIR_COST * deltaTime / 1000;
    }
}
