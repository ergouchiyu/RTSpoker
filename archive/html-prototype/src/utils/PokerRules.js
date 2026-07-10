/**
 * 扑克牌规则系统 - 四幺四规则
 */
const PokerRules = {
    /**
     * 检查出牌是否合法
     * @param {Array} cards - 要出的牌
     * @param {Array} lastPlay - 上一手出的牌（null表示首次出牌）
     * @returns {Object} { valid: boolean, type: string, rank: number }
     */
    validatePlay(cards, lastPlay) {
        if (cards.length === 0) return { valid: false };
        
        // 检查牌型
        const handType = this.getHandType(cards);
        if (!handType) return { valid: false };
        
        // 首次出牌，任意牌型都可以
        if (!lastPlay) {
            return { valid: true, type: handType.type, rank: handType.rank };
        }
        
        // 必须牌型相同
        if (handType.type !== lastPlay.type) {
            return { valid: false };
        }
        
        // 必须比上一手大
        if (handType.rank <= lastPlay.rank) {
            return { valid: false };
        }
        
        return { valid: true, type: handType.type, rank: handType.rank };
    },
    
    /**
     * 获取牌型
     */
    getHandType(cards) {
        if (cards.length === 0) return null;
        
        // 排序
        const sorted = [...cards].sort((a, b) => a.getValue() - b.getValue());
        
        // 单张
        if (cards.length === 1) {
            return { type: 'single', rank: sorted[0].getValue() };
        }
        
        // 对子
        if (cards.length === 2 && sorted[0].getValue() === sorted[1].getValue()) {
            return { type: 'pair', rank: sorted[0].getValue() };
        }
        
        // 三条
        if (cards.length === 3 && 
            sorted[0].getValue() === sorted[1].getValue() && 
            sorted[1].getValue() === sorted[2].getValue()) {
            return { type: 'triple', rank: sorted[0].getValue() };
        }
        
        // 顺子 (5张或以上连续)
        if (cards.length >= 5 && this.isStraight(sorted)) {
            return { type: 'straight', rank: sorted[sorted.length - 1].getValue(), length: cards.length };
        }
        
        // 炸弹 (四张相同)
        if (cards.length === 4 && 
            sorted[0].getValue() === sorted[1].getValue() && 
            sorted[1].getValue() === sorted[2].getValue() && 
            sorted[2].getValue() === sorted[3].getValue()) {
            return { type: 'bomb', rank: sorted[0].getValue() };
        }
        
        return null;
    },
    
    /**
     * 检查是否是顺子
     */
    isStraight(sorted) {
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].getValue() !== sorted[i - 1].getValue() + 1) {
                return false;
            }
        }
        // 不能包含2
        return sorted[sorted.length - 1].getValue() < 15;
    },
    
    /**
     * 获取牌型名称
     */
    getTypeName(type) {
        const names = {
            'single': '单张',
            'pair': '对子',
            'triple': '三条',
            'straight': '顺子',
            'bomb': '炸弹'
        };
        return names[type] || '未知';
    }
};
