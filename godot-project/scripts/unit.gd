## 单位类 - 带碰撞体积，可单击选中
class_name Unit
extends Area2D

enum State { IDLE, MOVING, ATTACKING }

var owner_id: int = -1
var unit_type: String = ""
var hp: float = 100.0
var max_hp: float = 100.0
var attack_damage: float = 5.0
var move_speed: float = 100.0
var state: int = State.IDLE
var is_selected: bool = false

var target_position: Vector2 = Vector2.ZERO
var attack_target = null

func _init(oid: int = -1, utype: String = "infantry", pos: Vector2 = Vector2.ZERO):
	owner_id = oid
	unit_type = utype
	position = pos
	target_position = pos
	
	if utype == "infantry":
		hp = GameConst.INFANTRY_HP
		max_hp = GameConst.INFANTRY_HP
		attack_damage = GameConst.INFANTRY_ATTACK
		move_speed = GameConst.INFANTRY_SPEED

func _ready():
	var collision_shape = CollisionShape2D.new()
	var circle_shape = CircleShape2D.new()
	circle_shape.radius = 15.0
	collision_shape.shape = circle_shape
	add_child(collision_shape)
	
	input_event.connect(_on_input_event)

func _on_input_event(_viewport, event, _shape_idx):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		var gm = get_tree().get_first_node_in_group("game_manager")
		if gm:
			gm.select_unit(self)

func _process(delta: float):
	match state:
		State.IDLE:
			pass
		State.MOVING:
			_update_moving(delta)
		State.ATTACKING:
			_update_attacking(delta)
	queue_redraw()

func move_to(target: Vector2):
	target_position = target
	attack_target = null
	state = State.MOVING

func attack_card(card):
	attack_target = card
	state = State.MOVING

func _update_moving(delta: float):
	var target_pos = Vector2.ZERO
	if attack_target and is_instance_valid(attack_target):
		target_pos = attack_target.global_position + Vector2(GameConst.CARD_WIDTH / 2.0, GameConst.CARD_HEIGHT / 2.0)
	else:
		target_pos = target_position
	
	var direction = (target_pos - position).normalized()
	var distance = position.distance_to(target_pos)
	
	if distance < 5.0:
		position = target_pos
		if attack_target and is_instance_valid(attack_target):
			state = State.ATTACKING
		else:
			state = State.IDLE
	else:
		position += direction * move_speed * delta

func _update_attacking(delta: float):
	if not attack_target or not is_instance_valid(attack_target):
		attack_target = null
		state = State.IDLE
		return
	attack_target.take_damage(attack_damage * delta)

func take_damage(amount: float):
	hp -= amount
	if hp <= 0:
		die()

func die():
	queue_free()

func _draw():
	if is_selected:
		draw_arc(Vector2.ZERO, 18.0, 0, TAU, 32, Color.WHITE, 2.0)
	
	var color: Color = GameConst.PLAYER_COLORS[owner_id]
	draw_circle(Vector2.ZERO, 12.0, color)
	
	var label = "兵" if unit_type == "infantry" else "工"
	draw_string(ThemeDB.fallback_font, Vector2(-6, 5), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
	
	if state == State.ATTACKING:
		draw_string(ThemeDB.fallback_font, Vector2(-6, -18), "!", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.YELLOW)
	
	if hp < max_hp:
		var bar_width = 24.0
		var bar_height = 3.0
		var bar_pos = Vector2(-bar_width / 2.0, -18)
		draw_rect(Rect2(bar_pos, Vector2(bar_width, bar_height)), Color.DARK_GRAY)
		var hp_color = Color.GREEN if hp / max_hp > 0.5 else Color.RED
		draw_rect(Rect2(bar_pos, Vector2(bar_width * hp / max_hp, bar_height)), hp_color)
