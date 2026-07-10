/**
 * 游戏常量
 */
const CONSTANTS = {
    CARD_WIDTH: 45,
    CARD_HEIGHT: 65,
    CARD_HP: 100,
    CARD_INCOME_BASE: 0.3,
    INITIAL_HAND_SIZE: 10,
    MAX_POPULATION: 10,
    INITIAL_SUPPLY: 100,
    UNITS: {
        INFANTRY: { name: '步兵', cost: 80, hp: 100, attack: 5, speed: 1.5, size: 12 },
        ENGINEER: { name: '工程师', cost: 200, hp: 50, attack: 0, speed: 1, size: 10 }
    },
    REPAIR_SPEED: 2,
    REPAIR_COST: 1,
    INCOME_TABLE: { 20: 0.3, 15: 0.4, 10: 0.5, 5: 0.8 },
    // 每个玩家固定颜色
    PLAYER_COLORS: ['#e94560', '#4ecdc4', '#3498db', '#9b59b6'],
    PLAYER_NAMES: ['玩家1(下)', '玩家2(上)', '玩家3(左)', '玩家4(右)'],
    SUITS: ['♠', '♥', '♦', '♣'],
    RANKS: ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
};
