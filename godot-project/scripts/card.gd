## 扑克牌 - owner_id 创建时绑定，不可变
class_name Card
extends Area2D

var suit: String = ""
var rank: String = ""
var owner_id: int = -1
var hp: float = 100.0
var max_hp: float = 100.0
var is_selected: bool = false
var is_face_up: bool = false

func _init(s: String = "", r: String = "", oid: int = -1):
	suit = s
	rank = r
	owner_id = oid

func _ready():
	var col = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(GameConst.CARD_WIDTH, GameConst.CARD_HEIGHT)
	col.shape = shape
	col.position = Vector2(GameConst.CARD_WIDTH / 2.0, GameConst.CARD_HEIGHT / 2.0)
	add_child(col)
	input_event.connect(_on_input_event)

func _on_input_event(_viewport, event, _shape_idx):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		var gm = get_tree().get_first_node_in_group("game_manager")
		if gm:
			gm.select_card(self)

func get_value() -> int:
	return GameConst.RANK_VALUES.get(rank, 0)

func get_income(base_income: float) -> float:
	return base_income * (hp / max_hp)

func take_damage(amount: float):
	hp = max(0, hp - amount)
	queue_redraw()

func _draw():
	var rect = Rect2(Vector2.ZERO, Vector2(GameConst.CARD_WIDTH, GameConst.CARD_HEIGHT))
	
	if is_face_up:
		draw_rect(rect, Color.WHITE)
		var color = Color.RED if (suit == "♥" or suit == "♦") else Color.BLACK
		draw_string(ThemeDB.fallback_font, Vector2(8, 25), rank, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, color)
		draw_string(ThemeDB.fallback_font, Vector2(8, 50), suit, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, color)
	else:
		var color: Color = GameConst.PLAYER_COLORS[owner_id]
		draw_rect(rect, color)
		draw_rect(rect, Color.BLACK, false, 1.0)
	
	if is_selected:
		draw_rect(rect, Color.GREEN, false, 3.0)
	
	if hp < max_hp:
		var bw = GameConst.CARD_WIDTH - 4.0
		var bh = 4.0
		var bp = Vector2(2, GameConst.CARD_HEIGHT + 2)
		draw_rect(Rect2(bp, Vector2(bw, bh)), Color.DARK_GRAY)
		var hc = Color.GREEN if hp / max_hp > 0.5 else Color.RED
		draw_rect(Rect2(bp, Vector2(bw * hp / max_hp, bh)), hc)
