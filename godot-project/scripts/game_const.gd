## 游戏常量
class_name GameConst

const CARD_WIDTH := 50.0
const CARD_HEIGHT := 70.0

const PLAYER_COLORS := [Color(0.9, 0.2, 0.3), Color(0.2, 0.8, 0.8)]
const PLAYER_NAMES := ["你", "AI"]
const PLAYER_SIDES := ["bottom", "top"]

const INFANTRY_COST := 80.0
const INFANTRY_HP := 100.0
const INFANTRY_ATTACK := 5.0
const INFANTRY_SPEED := 100.0

const INITIAL_SUPPLY := 100.0
const CARD_INCOME_BASE := 0.3
const INITIAL_HAND_SIZE := 10

const SUITS := ["♠", "♥", "♦", "♣"]
const RANKS := ["2","3","4","5","6","7","8","9","10","J","Q","K","A"]
const RANK_VALUES := {"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14}
# 王牌
const JOKER_SMALL := "小王"
const JOKER_BIG := "大王"
const JOKER_VALUE := 15  # 小王值15，大王值16
const JOKER_VALUE_BIG := 16

const HUMAN_PLAYER_ID := 0
