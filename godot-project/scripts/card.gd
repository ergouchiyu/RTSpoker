## 扑克牌类
class_name Card
extends Node2D

var suit: String = ""
var rank: String = ""
var owner_id: int = -1       # 归属玩家ID，不可变
var hp: float = 100.0
var max_hp: float = 100.0
var is_selected: bool = false
var is_face_up: bool = false  # 是否正面显示

func _init(s: String, r: String, oid: int):
	suit = s
	rank = r
	owner_id = oid

func get_value() -> int:
	return GameConst.RANK_VALUES.get(rank, 0)

func get_display() -> String:
	return suit + rank

func get_income(base_income: float) -> float:
	return base_income * (hp / max_hp)

func take_damage(amount: float):
	hp = max(0, hp - amount)

func repair(amount: float):
	hp = min(max_hp, hp + amount)

func _draw():
	var rect := Rect2(Vector2.ZERO, Vector2(GameConst.CARD_WIDTH, GameConst.CARD_HEIGHT))
	
	if is_face_up:
		# 正面 - 白底
		draw_rect(rect, Color.WHITE)
		var color := Color.RED if (suit == "♥" or suit == "♦") else Color.BLACK
		draw_string(ThemeDB.fallback_font, Vector2(8, 25), rank, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, color)
		draw_string(ThemeDB.fallback_font, Vector2(8, 50), suit, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, color)
	else:
		# 背面 - 玩家颜色
		var color: Color = GameConst.PLAYER_COLORS[owner_id]
		draw_rect(rect, color)
		draw_rect(rect, Color.BLACK, false, 1.0)
	
	# 选中高亮
	if is_selected:
		draw_rect(rect, Color.GREEN, false, 3.0)
	
	# 血条（受损时显示）
	if hp < max_hp:
		var bar_width := GameConst.CARD_WIDTH - 4.0
		var bar_height := 4.0
		var bar_pos := Vector2(2, GameConst.CARD_HEIGHT + 2)
		draw_rect(Rect2(bar_pos, Vector2(bar_width, bar_height)), Color.DARK_GRAY)
		var hp_color := Color.GREEN if hp / max_hp > 0.5 else Color.RED
		draw_rect(Rect2(bar_pos, Vector2(bar_width * hp / max_hp, bar_height)), hp_color)

func contains_point(point: Vector2) -> bool:
	var rect := Rect2(global_position, Vector2(GameConst.CARD_WIDTH, GameConst.CARD_HEIGHT))
	return rect.has_point(point)
