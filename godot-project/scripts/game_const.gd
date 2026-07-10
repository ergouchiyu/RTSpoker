## 游戏常量
class_name GameConst

# 牌尺寸
const CARD_WIDTH := 50
const CARD_HEIGHT := 70

# 玩家颜色
const PLAYER_COLORS := [Color.RED, Color.CYAN, Color.BLUE, Color.PURPLE]
const PLAYER_NAMES := ["玩家1(下)", "玩家2(上)", "玩家3(左)", "玩家4(右)"]
const PLAYER_SIDES := ["bottom", "top", "left", "right"]

# 单位配置
const INFANTRY_COST := 80
const INFANTRY_HP := 100.0
const INFANTRY_ATTACK := 5.0
const INFANTRY_SPEED := 100.0

# 经济
const INITIAL_SUPPLY := 100.0
const CARD_INCOME_BASE := 0.3
const INITIAL_HAND_SIZE := 10

# 扑克
const SUITS := ["♠", "♥", "♦", "♣"]
const RANKS := ["2","3","4","5","6","7","8","9","10","J","Q","K","A"]
const RANK_VALUES := {"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14}
