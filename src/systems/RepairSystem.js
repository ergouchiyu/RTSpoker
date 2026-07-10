/**
 * 维修系统
 */
class RepairSystem {
    constructor() {
        this.repairingCards = new Map(); // card -> { timer, cost }
    }
    
    /**
     * 开始维修
     */
    startRepair(card, player) {
        // 检查是否已经在维修
        if (this.repairingCards.has(card)) {
            return false;
        }
        
        // 检查是否需要维修
        if (card.hp >= card.maxHp) {
            return false;
        }
        
        // 检查是否有足够资源（至少需要1秒的维修费用）
        if (!player.canAfford(CONSTANTS.REPAIR_COST)) {
            return false;
        }
        
        // 开始维修
        this.repairingCards.set(card, {
            player: player,
            timer: 0
        });
        
        card.isRepairing = true;
        return true;
    }
    
    /**
     * 停止维修
     */
    stopRepair(card) {
        if (this.repairingCards.has(card)) {
            this.repairingCards.delete(card);
            card.isRepairing = false;
        }
    }
    
    /**
     * 更新维修系统
     */
    update(deltaTime) {
        const cardsToStop = [];
        
        for (const [card, data] of this.repairingCards) {
            // 检查是否维修完成
            if (card.hp >= card.maxHp) {
                cardsToStop.push(card);
                continue;
            }
            
            // 检查玩家是否有足够资源
            const cost = CONSTANTS.REPAIR_COST * deltaTime / 1000;
            if (!data.player.spendSupply(cost)) {
                cardsToStop.push(card);
                continue;
            }
            
            // 恢复完整度
            const repairAmount = CONSTANTS.REPAIR_SPEED * deltaTime / 1000;
            card.repair(repairAmount);
        }
        
        // 停止维修
        for (const card of cardsToStop) {
            this.stopRepair(card);
        }
    }
    
    /**
     * 获取维修状态
     */
    isRepairing(card) {
        return this.repairingCards.has(card);
    }
    
    /**
     * 获取维修进度
     */
    getRepairProgress(card) {
        if (!this.repairingCards.has(card)) {
            return 0;
        }
        return card.getHpPercent();
    }
}
