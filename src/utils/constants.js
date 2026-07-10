/**
 * 游戏常量配置 - 降低经济速度
 */
const CONSTANTS = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    FPS: 60,
    
    CARD_WIDTH: 45,
    CARD_HEIGHT: 65,
    CARD_HP: 100,
    CARD_INCOME_BASE: 0.5,  // 从2降到0.5
    
    INITIAL_HAND_SIZE: 10,
    MAX_POPULATION: 10,
    INITIAL_SUPPLY: 100,    // 从200降到100
    
    UNITS: {
        INFANTRY: {
            name: '步兵',
            cost: 80,        // 从100降到80
            hp: 100,
            attack: 5,
            speed: 1.5,
            trainingTime: 10000,
            size: 12
        },
        ENGINEER: {
            name: '工程师',
            cost: 200,       // 从300降到200
            hp: 50,
            attack: 0,
            speed: 1,
            trainingTime: 20000,
            size: 10,
            stealThreshold: 0.5
        }
    },
    
    REPAIR_SPEED: 2,
    REPAIR_COST: 1,          // 从2降到1
    
    // 动态收入表 - 大幅降低
    INCOME_TABLE: {
        20: 0.5,             // 从2降到0.5
        15: 0.6,             // 从2.5降到0.6
        10: 0.8,             // 从3降到0.8
        5: 1.0               // 从5降到1.0
    },
    
    COLORS: {
        BACKGROUND: '#1a1a2e',
        TABLE: '#16213e',
        CARD_BACK: '#e94560',
        CARD_FRONT: '#fff',
        PLAYER1: '#e94560',
        PLAYER2: '#4ecdc4',
        PLAYER3: '#3498db',
        PLAYER4: '#9b59b6',
        HP_GREEN: '#2ecc71',
        HP_RED: '#e74c3c',
        SUPPLY: '#f39c12',
        TEXT: '#fff'
    },
    
    SUITS: ['♠', '♥', '♦', '♣'],
    RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    
    CARD_TYPES: {
        SINGLE: 'single',
        PAIR: 'pair',
        TRIPLE: 'triple',
        STRAIGHT: 'straight',
        BOMB: 'bomb'
    }
};
