/**
 * 工具函数
 */
const Helpers = {
    /**
     * 生成随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * 计算两点距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    /**
     * 洗牌算法（Fisher-Yates）
     */
    shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    /**
     * 创建扑克牌组
     */
    createDeck() {
        const deck = [];
        for (const suit of CONSTANTS.SUITS) {
            for (const rank of CONSTANTS.RANKS) {
                deck.push({ suit, rank });
            }
        }
        return Helpers.shuffle(deck);
    },
    
    /**
     * 获取牌的数值（用于比较大小）
     */
    getCardValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank] || 0;
    },
    
    /**
     * 根据手牌数量计算单张收入
     */
    getIncomePerCard(handSize) {
        const table = CONSTANTS.INCOME_TABLE;
        const thresholds = Object.keys(table).map(Number).sort((a, b) => a - b);
        
        for (const threshold of thresholds) {
            if (handSize <= threshold) {
                return table[threshold];
            }
        }
        return table[thresholds[thresholds.length - 1]];
    },
    
    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return Math.floor(num);
    },
    
    /**
     * 限制值在范围内
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * 线性插值
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    /**
     * 检查矩形碰撞
     */
    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },
    
    /**
     * 检查点是否在矩形内
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};
