/**
 * 战斗系统 - 只处理单位受伤，不自动寻敌
 */
class CombatSystem {
    update(dt, players) {
        // 只更新单位状态（移动/攻击），不自动寻敌
        for (const player of players) {
            for (const unit of player.units) {
                unit.update(dt);
            }
        }
    }

    onUnitDeath(unit) {
        // 单位已在 Unit.die() 中从玩家列表移除
    }

    onCardDestroyed(card) {
        const idx = card.owner.hand.indexOf(card);
        if (idx !== -1) card.owner.hand.splice(idx, 1);
        // 通知所有正在攻击这张牌的单位停止
        for (const player of Game.players) {
            for (const unit of player.units) {
                if (unit.target === card) {
                    unit.target = null;
                    unit.state = 'idle';
                }
            }
        }
    }
}
