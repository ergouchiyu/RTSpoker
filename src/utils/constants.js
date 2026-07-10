/**
 * 游戏常量配置
 */
const CONSTANTS = {
    // 游戏设置
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    FPS: 60,
    
    // 扑克设置
    CARD_WIDTH: 60,
    CARD_HEIGHT: 90,
    CARD_HP: 100,
    CARD_INCOME_BASE: 2,
    
    // 玩家设置
    INITIAL_HAND_SIZE: 10,
    MAX_POPULATION: 10,
    INITIAL_SUPPLY: 200,
    
    // 单位设置
    UNITS: {
        INFANTRY: {
            name: '步兵',
            cost: 100,
            hp: 100,
            attack: 5,
            speed: 2,
            trainingTime: 10000, // 10秒
            size: 15
        },
        ENGINEER: {
            name: '工程师',
            cost: 300,
            hp: 50,
            attack: 0,
            speed: 1.5,
            trainingTime: 20000, // 20秒
            size: 12,
            stealThreshold: 0.5 // 只能偷取50%以下完整度的牌
        }
    },
    
    // 维修设置
    REPAIR_SPEED: 2, // HP/秒
    REPAIR_COST: 2, // 补给/秒
    
    // 动态收入（手牌越少，单张收入越高）
    INCOME_TABLE: {
        20: 2,
        15: 2.5,
        10: 3,
        5: 5
    },
    
    // 颜色
    COLORS: {
        BACKGROUND: '#16213e',
        TABLE: '#0f3460',
        CARD_BACK: '#e94560',
        CARD_FRONT: '#fff',
        PLAYER1: '#e94560',
        PLAYER2: '#4ecdc4',
        HP_GREEN: '#2ecc71',
        HP_RED: '#e74c3c',
        SUPPLY: '#f39c12',
        TEXT: '#fff'
    },
    
    // 扑克花色
    SUITS: ['♠', '♥', '♦', '♣'],
    RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    
    // 牌型
    CARD_TYPES: {
        SINGLE: 'single',      // 单张
        PAIR: 'pair',          // 对子
        TRIPLE: 'triple',      // 三条
        STRAIGHT: 'straight',  // 顺子
        BOMB: 'bomb'           // 炸弹（四张相同）
    }
};
