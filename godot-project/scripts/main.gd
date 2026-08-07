## 主场景 - 渲染和输入处理
extends Node2D

@onready var game_manager: GameManager = $GameManager

var is_selecting := false
var select_start := Vector2.ZERO
var select_end := Vector2.ZERO

var ui_layer: CanvasLayer
var turn_label: Label
var supply_label: Label
var cards_label: Label
var message_label: Label
var play_button: Button
var pass_button: Button
var spawn_button: Button

func _ready():
	_setup_ui()
	_connect_signals()
	game_manager.start_game()

func _setup_ui():
	ui_layer = CanvasLayer.new()
	add_child(ui_layer)
	
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	ui_layer.add_child(vbox)
	
	turn_label = Label.new()
	vbox.add_child(turn_label)
	
	supply_label = Label.new()
	vbox.add_child(supply_label)
	
	cards_label = Label.new()
	vbox.add_child(cards_label)
	
	var hbox = HBoxContainer.new()
	hbox.position = Vector2(get_viewport_rect().size.x / 2 - 150, get_viewport_rect().size.y - 60)
	ui_layer.add_child(hbox)
	
	play_button = Button.new()
	play_button.text = "出牌"
	play_button.pressed.connect(_on_play_pressed)
	hbox.add_child(play_button)
	
	pass_button = Button.new()
	pass_button.text = "不要"
	pass_button.pressed.connect(_on_pass_pressed)
	hbox.add_child(pass_button)
	
	spawn_button = Button.new()
	spawn_button.text = "造兵"
	spawn_button.pressed.connect(_on_spawn_pressed)
	hbox.add_child(spawn_button)
	
	message_label = Label.new()
	message_label.position = Vector2(get_viewport_rect().size.x / 2 - 100, get_viewport_rect().size.y / 2)
	message_label.add_theme_font_size_override("font_size", 24)
	ui_layer.add_child(message_label)

func _connect_signals():
	game_manager.turn_changed_signal.connect(_on_turn_changed)
	game_manager.game_over_signal.connect(_on_game_over)
	game_manager.message_signal.connect(_on_message)

func _on_turn_changed(player_id: int):
	_update_ui()
	if player_id == 1:
		message_label.text = "AI 回合..."
	else:
		message_label.text = "你的回合"

func _on_game_over(winner_id: int):
	if winner_id == 0:
		message_label.text = "你赢了!"
	else:
		message_label.text = "AI赢了!"

func _on_message(text: String):
	message_label.text = text

func _on_play_pressed():
	game_manager.play_selected_cards()

func _on_pass_pressed():
	game_manager.pass_turn()

func _on_spawn_pressed():
	game_manager.spawn_unit()

func _update_ui():
	if game_manager.players.is_empty():
		return
	var cp = game_manager.get_current_player()
	var is_human = game_manager.is_human_turn()
	
	turn_label.text = "玩家%d (%s)" % [cp["id"] + 1, "AI" if cp["is_ai"] else "你"]
	supply_label.text = "补给: %d" % int(cp["supply"])
	cards_label.text = "手牌: %d" % cp["hand"].size()
	
	# 只有人类回合才能点按钮
	play_button.disabled = not is_human or game_manager.selected_cards.is_empty()
	pass_button.disabled = not is_human or (game_manager.is_first_round and game_manager.last_play_type == "")
	spawn_button.disabled = not is_human or cp["supply"] < GameConst.INFANTRY_COST

func _input(event: InputEvent):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				is_selecting = true
				select_start = event.position
				select_end = event.position
			else:
				is_selecting = false
				_handle_left_release()
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_handle_right_click(event.position)
	
	if event is InputEventMouseMotion and is_selecting:
		select_end = event.position
		queue_redraw()

func _handle_left_release():
	var rect = Rect2(
		Vector2(min(select_start.x, select_end.x), min(select_start.y, select_end.y)),
		abs(select_end - select_start)
	)
	
	if rect.size.x > 5 or rect.size.y > 5:
		game_manager.select_units_in_rect(rect)
	
	queue_redraw()

func _handle_right_click(pos: Vector2):
	var ai = game_manager.players[1]
	
	for card in ai["hand"]:
		if is_instance_valid(card):
			var card_center = card.position + Vector2(GameConst.CARD_WIDTH / 2.0, GameConst.CARD_HEIGHT / 2.0)
			if pos.distance_to(card_center) < GameConst.CARD_WIDTH:
				game_manager.command_units_attack_card(card)
				queue_redraw()
				return
	
	# 移动到空地
	game_manager.command_units_move_to(pos)
	queue_redraw()

func _process(_delta: float):
	_update_ui()
	queue_redraw()

func _draw():
	_draw_table()
	_draw_hands()
	_draw_play_area()
	_draw_selection_box()

func _draw_table():
	var size = get_viewport_rect().size
	var margin = 100.0
	draw_rect(Rect2(margin, 40, size.x - margin * 2, size.y - 100), Color(0.09, 0.13, 0.24))
	
	for player in game_manager.players:
		var color: Color = GameConst.PLAYER_COLORS[player["id"]]
		var bg = color * 0.1
		match player["side"]:
			"bottom":
				draw_rect(Rect2(margin, size.y - margin, size.x - margin * 2, margin), bg)
			"top":
				draw_rect(Rect2(margin, 0, size.x - margin * 2, 40), bg)
			"left":
				draw_rect(Rect2(0, 40, margin, size.y - 100), bg)
			"right":
				draw_rect(Rect2(size.x - margin, 40, margin, size.y - 100), bg)

func _draw_hands():
	var size = get_viewport_rect().size
	for player in game_manager.players:
		var hand: Array = player["hand"]
		var cc = hand.size()
		var tw = cc * (GameConst.CARD_WIDTH + 6) - 6
		var sx = 0.0
		var sy = 0.0
		match player["side"]:
			"bottom":
				sx = (size.x - tw) / 2.0
				sy = size.y - GameConst.CARD_HEIGHT - 55
			"top":
				sx = (size.x - tw) / 2.0
				sy = 35
			_:
				continue
		for i in range(cc):
			var card = hand[i]
			if is_instance_valid(card):
				# 跳过已出到出牌区的牌
				if card.in_play_area:
					continue
				var cy_offset = 0.0
				if card.is_selected:
					cy_offset = -20.0
				card.position = Vector2(sx + i * (GameConst.CARD_WIDTH + 6), sy + cy_offset)
				card.is_face_up = (player["side"] == "bottom")

func _draw_play_area():
	var size = get_viewport_rect().size
	var cx = size.x / 2.0
	var cy = size.y / 2.0 - 20
	
	if game_manager.played_stack.is_empty():
		draw_string(ThemeDB.fallback_font, Vector2(cx - 30, cy), "出牌区", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.GRAY)
		return
	
	var stack = game_manager.played_stack
	var sx = cx - stack.size() * 11
	for i in range(stack.size()):
		var entry: Dictionary = stack[i]
		var card = entry["card"]
		if is_instance_valid(card):
			card.position = Vector2(sx + i * 22, cy - 26)
			# 出牌区的牌全部正面朝上
			if not card.is_face_up:
				card.is_face_up = true
				card.queue_redraw()  # Godot 4 改属性必须手动触发重绘

func _draw_selection_box():
	if is_selecting:
		var rect = Rect2(
			Vector2(min(select_start.x, select_end.x), min(select_start.y, select_end.y)),
			abs(select_end - select_start)
		)
		draw_rect(rect, Color(1, 1, 1, 0.3), true)
		draw_rect(rect, Color.WHITE, false, 1.0)
