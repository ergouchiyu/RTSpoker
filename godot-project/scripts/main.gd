## 主场景 - 渲染和输入处理
extends Node2D

@onready var game_manager: GameManager = $GameManager

# 框选状态
var is_selecting := false
var select_start := Vector2.ZERO
var select_end := Vector2.ZERO

# UI 节点
var ui_layer: CanvasLayer
var turn_label: Label
var supply_label: Label
var cards_label: Label
var message_label: Label
var play_button: Button
var pass_button: Button

func _ready():
	_setup_ui()
	_connect_signals()

func _setup_ui():
	ui_layer = CanvasLayer.new()
	add_child(ui_layer)
	
	var vbox := VBoxContainer.new()
	vbox.position = Vector2(10, 10)
	ui_layer.add_child(vbox)
	
	turn_label = Label.new()
	vbox.add_child(turn_label)
	
	supply_label = Label.new()
	vbox.add_child(supply_label)
	
	cards_label = Label.new()
	vbox.add_child(cards_label)
	
	# 按钮栏
	var hbox := HBoxContainer.new()
	hbox.position = Vector2(get_viewport_rect().size.x / 2 - 200, get_viewport_rect().size.y - 60)
	ui_layer.add_child(hbox)
	
	play_button = Button.new()
	play_button.text = "♠ 出牌"
	play_button.pressed.connect(_on_play_pressed)
	hbox.add_child(play_button)
	
	pass_button = Button.new()
	pass_button.text = "✋ 不要"
	pass_button.pressed.connect(_on_pass_pressed)
	hbox.add_child(pass_button)
	
	var spawn_button := Button.new()
	spawn_button.text = "🎯 步兵"
	spawn_button.pressed.connect(_on_spawn_pressed)
	hbox.add_child(spawn_button)
	
	# 消息
	message_label = Label.new()
	message_label.position = Vector2(get_viewport_rect().size.x / 2 - 100, get_viewport_rect().size.y / 2)
	message_label.add_theme_font_size_override("font_size", 24)
	ui_layer.add_child(message_label)

func _connect_signals():
	game_manager.turn_changed.connect(_on_turn_changed)
	game_manager.game_over.connect(_on_game_over)
	game_manager.message.connect(_on_message)

func _on_turn_changed(_player_id: int):
	_update_ui()

func _on_game_over(winner_id: int):
	message_label.text = "🎉 玩家%d 获胜！" % [winner_id + 1]

func _on_message(text: String):
	message_label.text = text
	await get_tree().create_timer(1.5).timeout
	if message_label.text == text:
		message_label.text = ""

func _on_play_pressed():
	game_manager.play_selected_cards()

func _on_pass_pressed():
	game_manager.pass_turn()

func _on_spawn_pressed():
	game_manager.spawn_unit()

func _update_ui():
	var cp := game_manager.get_current_player()
	turn_label.text = "玩家%d 的回合" % [cp.id + 1]
	supply_label.text = "补给: %d" % int(cp.supply)
	cards_label.text = "手牌: %d" % cp.hand.size()
	
	# 更新按钮状态
	play_button.disabled = game_manager.selected_cards.is_empty() or cp.is_ai
	pass_button.disabled = (game_manager.is_first_round and game_manager.last_play_type == "") or cp.is_ai

func _input(event: InputEvent):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				is_selecting = true
				select_start = event.position
				select_end = event.position
			else:
				is_selecting = false
				_handle_left_release(event.position)
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_handle_right_click(event.position)
	
	if event is InputEventMouseMotion and is_selecting:
		select_end = event.position
		queue_redraw()

func _handle_left_release(pos: Vector2):
	# 检查是否是框选（移动超过5像素）
	var rect := Rect2(
		Vector2(min(select_start.x, select_end.x), min(select_start.y, select_end.y)),
		abs(select_end - select_start)
	)
	
	if rect.size.x > 5 or rect.size.y > 5:
		# 框选单位
		game_manager.select_units_in_rect(rect)
	
	queue_redraw()

func _handle_right_click(pos: Vector2):
	var cp := game_manager.get_current_player()
	
	# 检查是否点击了敌方的牌
	for player in game_manager.players:
		if player.id == cp.id:
			continue
		for card in player.hand:
			if is_instance_valid(card) and card.get_global_rect().has_point(pos):
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
	var size := get_viewport_rect().size
	var margin := 100.0
	
	# 中央战场
	draw_rect(Rect2(margin, 40, size.x - margin * 2, size.y - 100), Color(0.09, 0.13, 0.24))
	
	# 玩家区域背景
	for player in game_manager.players:
		var color: Color = GameConst.PLAYER_COLORS[player.id]
		var bg_color := color * 0.1
		match player.side:
			"bottom":
				draw_rect(Rect2(margin, size.y - margin, size.x - margin * 2, margin), bg_color)
			"top":
				draw_rect(Rect2(margin, 0, size.x - margin * 2, 40), bg_color)
			"left":
				draw_rect(Rect2(0, 40, margin, size.y - 100), bg_color)
			"right":
				draw_rect(Rect2(size.x - margin, 40, margin, size.y - 100), bg_color)

func _draw_hands():
	var size := get_viewport_rect().size
	
	for player in game_manager.players:
		var hand: Array = player.hand
		var card_count := hand.size()
		var total_width := card_count * (GameConst.CARD_WIDTH + 6) - 6
		
		var start_x: float
		var start_y: float
		
		match player.side:
			"bottom":
				start_x = (size.x - total_width) / 2
				start_y = size.y - GameConst.CARD_HEIGHT - 55
			"top":
				start_x = (size.x - total_width) / 2
				start_y = 35
			_:
				continue
		
		for i in range(card_count):
			var card: Card = hand[i]
			if is_instance_valid(card):
				card.position = Vector2(start_x + i * (GameConst.CARD_WIDTH + 6), start_y)
				card.is_face_up = (player.side == "bottom")

func _draw_play_area():
	var size := get_viewport_rect().size
	var cx := size.x / 2
	var cy := size.y / 2 - 20
	
	if game_manager.played_stack.is_empty():
		draw_string(ThemeDB.fallback_font, Vector2(cx - 30, cy), "出牌区", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.GRAY)
		return
	
	# 绘制已出的牌
	var stack := game_manager.played_stack
	var start_x := cx - stack.size() * 11
	
	for i in range(stack.size()):
		var entry: Dictionary = stack[i]
		var card: Card = entry.card
		if is_instance_valid(card):
			card.position = Vector2(start_x + i * 22, cy - 26)
			card.is_face_up = true

func _draw_selection_box():
	if is_selecting:
		var rect := Rect2(
			Vector2(min(select_start.x, select_end.x), min(select_start.y, select_end.y)),
			abs(select_end - select_start)
		)
		draw_rect(rect, Color(1, 1, 1, 0.3), true)
		draw_rect(rect, Color.WHITE, false, 1.0)
