/**
 * 战斗系统
 */
class CombatSystem {
    constructor() {
        // 战斗配置
    }
    
    /**
     * 更新战斗系统
     */
    update(deltaTime, players) {
        for (const player of players) {
            for (const unit of player.units) {
                this.updateUnitCombat(unit, deltaTime, players);
            }
        }
    }
    
    /**
     * 更新单位战斗
     */
    updateUnitCombat(unit, deltaTime, players) {
        // 如果单位空闲，寻找目标
        if (unit.state === 'idle') {
            this.findTarget(unit, players);
        }
    }
    
    /**
     * 寻找目标
     */
    findTarget(unit, players) {
        // 寻找最近的敌方牌
        let nearestCard = null;
        let nearestDistance = Infinity;
        
        for (const player of players) {
            if (player === unit.owner) continue;
            
            for (const card of player.hand) {
                const dist = Helpers.distance(
                    unit.x, unit.y,
                    card.x + CONSTANTS.CARD_WIDTH / 2,
                    card.y + CONSTANTS.CARD_HEIGHT / 2
                );
                
                if (dist < nearestDistance) {
                    nearestDistance = dist;
                    nearestCard = card;
                }
            }
        }
        
        // 如果找到目标，移动过去
        if (nearestCard) {
            unit.attackTarget(nearestCard);
        }
    }
    
    /**
     * 处理单位死亡
     */
    onUnitDeath(unit) {
        unit.owner.removeUnit(unit);
    }
    
    /**
     * 处理牌被摧毁
     */
    onCardDestroyed(card) {
        // 从玩家手中移除
        const index = card.owner.hand.indexOf(card);
        if (index !== -1) {
            card.owner.hand.splice(index, 1);
        }
    }
}
