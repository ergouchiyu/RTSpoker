## 游戏管理器 - 核心逻辑
## 严格权限：人类只能操作玩家0，AI自动操作玩家1
class_name GameManager
extends Node

var players: Array = []
var current_player_index: int = 0
var is_game_over: bool = false

var last_play_type: String = ""
var last_play_rank: int = 0
var last_play_player_id: int = -1
var pass_count: int = 0
var is_first_round: bool = true
var played_stack: Array = []

var selected_cards: Array = []
var selected_units: Array = []

var turn_timer: float = 0.0
var turn_duration: float = 30.0
var main_scene: Node2D

# AI 相关
var ai_action_timer: float = 0.0
var ai_action_delay: float = 1.5  # AI 行动前等待 1.5 秒
var ai_state: String = "idle"  # idle, thinking, acting, done
var ai_supply_threshold: float = 80.0  # AI 攒够80补给就造兵（降低门槛让AI更积极）

signal turn_changed_signal(player_id: int)
signal game_over_signal(winner_id: int)
signal message_signal(text: String)

func _ready():
	main_scene = get_parent()
	add_to_group("game_manager")

func start_game():
	_start_game()

func _start_game():
	for p in players:
		for card in p["hand"]:
			if is_instance_valid(card):
				card.queue_free()
		for unit in p["units"]:
			if is_instance_valid(unit):
				unit.queue_free()
	
	players.clear()
	played_stack.clear()
	selected_cards.clear()
	selected_units.clear()
	is_game_over = false
	is_first_round = true
	pass_count = 0
	last_play_player_id = -1
	current_player_index = 0
	ai_state = "idle"
	ai_action_timer = 0.0
	
	# 玩家0 = 人类，玩家1 = AI
	players.append({
		"id": 0,
		"hand": [],
		"units": [],
		"supply": GameConst.INITIAL_SUPPLY,
		"side": GameConst.PLAYER_SIDES[0],
		"is_ai": false
	})
	players.append({
		"id": 1,
		"hand": [],
		"units": [],
		"supply": GameConst.INITIAL_SUPPLY,
		"side": GameConst.PLAYER_SIDES[1],
		"is_ai": true
	})
	
	_deal_cards()
	_start_turn()

func _deal_cards():
	var deck = _create_deck()
	deck.shuffle()
	var idx = 0
	for p in players:
		p["hand"].clear()
		for j in range(GameConst.INITIAL_HAND_SIZE):
			var d = deck[idx]
			var card = Card.new(d["suit"], d["rank"], p["id"])
			p["hand"].append(card)
			main_scene.add_child(card)
			idx += 1

func _create_deck() -> Array:
	var deck = []
	for suit in GameConst.SUITS:
		for rank in GameConst.RANKS:
			deck.append({"suit": suit, "rank": rank})
	return deck

func get_current_player() -> Dictionary:
	return players[current_player_index]

func is_human_turn() -> bool:
	var cp = get_current_player()
	return not cp["is_ai"]

## ==================== 回合管理 ====================

func _start_turn():
	turn_timer = 0.0
	_clear_selection()
	
	var cp = get_current_player()
	
	if last_play_player_id == cp["id"] or is_first_round:
		last_play_type = ""
		last_play_rank = 0
		pass_count = 0
	
	turn_changed_signal.emit(cp["id"])
	
	# AI 回合 → 进入 AI 思考状态
	if cp["is_ai"]:
		ai_state = "thinking"
		ai_action_timer = 0.0

func _end_turn():
	_clear_selection()
	current_player_index = (current_player_index + 1) % players.size()
	_start_turn()

func _clear_selection():
	for card in selected_cards:
		if is_instance_valid(card):
			card.is_selected = false
	selected_cards.clear()
	for unit in selected_units:
		if is_instance_valid(unit):
			unit.is_selected = false
	selected_units.clear()

## ==================== 人类操作（严格限制玩家0） ====================

func select_card(card):
	# 只有人类回合 + 人类自己的牌才能选
	if not is_human_turn():
		return
	if card.owner_id != GameConst.HUMAN_PLAYER_ID:
		return
	
	if not selected_units.is_empty():
		_clear_selection()
	
	card.is_selected = !card.is_selected
	if card.is_selected:
		selected_cards.append(card)
	else:
		selected_cards.erase(card)

func select_unit(unit):
	# 只有人类的兵才能选
	if unit.owner_id != GameConst.HUMAN_PLAYER_ID:
		return
	
	if not selected_cards.is_empty():
		_clear_selection()
	
	if not Input.is_key_pressed(KEY_SHIFT):
		for u in selected_units:
			if is_instance_valid(u):
				u.is_selected = false
		selected_units.clear()
	
	unit.is_selected = !unit.is_selected
	if unit.is_selected:
		selected_units.append(unit)
	else:
		selected_units.erase(unit)

func select_units_in_rect(rect: Rect2):
	# 只选人类玩家的兵
	var human = players[GameConst.HUMAN_PLAYER_ID]
	
	if not selected_cards.is_empty():
		_clear_selection()
	else:
		for unit in selected_units:
			if is_instance_valid(unit):
				unit.is_selected = false
		selected_units.clear()
	
	for unit in human["units"]:
		if is_instance_valid(unit) and rect.has_point(unit.position):
			unit.is_selected = true
			selected_units.append(unit)

func play_selected_cards():
	if not is_human_turn():
		return
	if selected_cards.is_empty():
		message_signal.emit("请先选择要出的牌")
		return
	
	var validation = _validate_play(selected_cards)
	if not validation["valid"]:
		message_signal.emit(validation["reason"])
		return
	
	var card_names = []
	for card in selected_cards:
		_remove_card_from_hand(card, 0)
		card.in_play_area = true
		card.is_face_up = true
		card.queue_redraw()
		played_stack.append({"card": card, "player_id": 0})
		card_names.append(card.suit + card.rank)
	
	_clear_selection()
	last_play_type = validation["type"]
	last_play_rank = validation["rank"]
	last_play_player_id = 0
	pass_count = 0
	is_first_round = false
	
	message_signal.emit("你出了 %s (%s)" % [validation["type"], " ".join(card_names)])
	
	var cp = get_current_player()
	if cp["hand"].is_empty():
		is_game_over = true
		game_over_signal.emit(0)
		return
	
	_end_turn()

func pass_turn():
	if not is_human_turn():
		return
	if is_first_round and last_play_type == "":
		message_signal.emit("第一轮必须出牌")
		return
	
	_clear_selection()
	pass_count += 1
	message_signal.emit("你选择不要")
	
	if pass_count >= players.size() - 1:
		_clear_played_stack()
		_end_turn()

func spawn_unit():
	if not is_human_turn():
		return
	var cp = get_current_player()
	if cp["supply"] < GameConst.INFANTRY_COST:
		message_signal.emit("补给不足!")
		return
	
	cp["supply"] -= GameConst.INFANTRY_COST
	var pos = _get_spawn_position(cp)
	var unit = Unit.new(0, "infantry", pos)
	cp["units"].append(unit)
	main_scene.add_child(unit)
	message_signal.emit("你生产了步兵")

func command_units_attack_card(target_card):
	if selected_units.is_empty():
		return
	if target_card.owner_id == GameConst.HUMAN_PLAYER_ID:
		message_signal.emit("不能攻击自己的牌!")
		return
	
	for unit in selected_units:
		if is_instance_valid(unit):
			unit.attack_card(target_card)

func command_units_move_to(pos: Vector2):
	for unit in selected_units:
		if is_instance_valid(unit):
			unit.move_to(pos)

## ==================== AI 逻辑（玩家1自动操作） ====================

func _process(delta: float):
	if is_game_over:
		return
	if players.is_empty():
		return
	
	turn_timer += delta
	if is_human_turn() and turn_timer >= turn_duration:
		message_signal.emit("超时!")
		pass_turn()
	
	_update_economy(delta)
	_update_ai_behavior(delta)

func _update_ai_behavior(delta: float):
	if not is_human_turn():
		# AI 回合
		if ai_state == "thinking":
			ai_action_timer += delta
			if ai_action_timer >= ai_action_delay:
				ai_state = "acting"
				_ai_take_action()
		else:
			# AI 的兵自动攻击人类玩家的牌
			_ai_command_units()
	
	# AI 攒够钱自动造兵（非回合也能造？不，回合制）
	# AI 只在自己回合造兵
	if not is_human_turn():
		var ai = players[1]
		if ai["supply"] >= ai_supply_threshold and ai["units"].size() < 5:
			_ai_spawn_unit()

func _ai_take_action():
	# AI 尝试出牌
	var ai = players[1]
	var play = _ai_find_play(ai["hand"])
	
	if play != null:
		# 出牌
		var card_names = []
		for card in play:
			_remove_card_from_hand(card, 1)
			card.in_play_area = true
			card.is_face_up = true
			card.queue_redraw()
			played_stack.append({"card": card, "player_id": 1})
			card_names.append(card.suit + card.rank)
		last_play_type = _get_hand_type(play)["type"]
		last_play_rank = _get_hand_type(play)["rank"]
		last_play_player_id = 1
		pass_count = 0
		is_first_round = false
		message_signal.emit("AI出了 %s (%s)" % [last_play_type, " ".join(card_names)])
		
		if ai["hand"].is_empty():
			is_game_over = true
			game_over_signal.emit(1)
			return
	else:
		# 不要
		pass_count += 1
		message_signal.emit("AI选择不要")
		if pass_count >= players.size() - 1:
			_clear_played_stack()
	
	ai_state = "done"
	_end_turn()

func _ai_find_play(hand: Array) -> Variant:
	# 简单AI：找最小的合法牌型
	var cards_by_value = []
	for card in hand:
		cards_by_value.append(card)
	cards_by_value.sort_custom(func(a, b): return a.get_value() < b.get_value())
	
	# 尝试出最小的单张
	for card in cards_by_value:
		var play = [card]
		var validation = _validate_play(play)
		if validation["valid"]:
			return play
	
	return null

func _ai_spawn_unit():
	var ai = players[1]
	ai["supply"] -= GameConst.INFANTRY_COST
	var pos = _get_spawn_position(ai)
	var unit = Unit.new(1, "infantry", pos)
	ai["units"].append(unit)
	main_scene.add_child(unit)

func _ai_command_units():
	var ai = players[1]
	var human = players[0]
	
	# AI 的兵自动攻击人类玩家存活的最弱的牌
	for unit in ai["units"]:
		if is_instance_valid(unit) and unit.state == Unit.State.IDLE:
			# 找人类玩家血量最低的牌
			var weakest = null
			var lowest_hp = 9999.0
			for card in human["hand"]:
				if is_instance_valid(card) and card.hp < lowest_hp:
					lowest_hp = card.hp
					weakest = card
			if weakest:
				unit.attack_card(weakest)

## ==================== 工具方法 ====================

func _clear_played_stack():
	last_play_type = ""
	last_play_rank = 0
	last_play_player_id = -1
	pass_count = 0
	for entry in played_stack:
		if is_instance_valid(entry["card"]):
			entry["card"].queue_free()
	played_stack.clear()

func _get_spawn_position(player: Dictionary) -> Vector2:
	var vs = main_scene.get_viewport_rect().size
	var cx = vs.x / 2.0
	var cy = vs.y / 2.0
	match player["side"]:
		"bottom":
			return Vector2(cx + randf_range(-100, 100), vs.y - 120)
		"top":
			return Vector2(cx + randf_range(-100, 100), 50)
	return Vector2(cx, cy)

func _update_economy(delta: float):
	for p in players:
		var income = 0.0
		for card in p["hand"]:
			if is_instance_valid(card):
				income += card.get_income(GameConst.CARD_INCOME_BASE)
		p["supply"] += income * delta

func _validate_play(cards: Array) -> Dictionary:
	if cards.is_empty():
		return {"valid": false, "reason": "没有牌"}
	var hi = _get_hand_type(cards)
	if not hi["valid"]:
		return {"valid": false, "reason": "无效牌型"}
	if last_play_type == "":
		return {"valid": true, "type": hi["type"], "rank": hi["rank"], "reason": ""}
	if hi["type"] != last_play_type:
		return {"valid": false, "reason": "必须出" + last_play_type}
	if hi["rank"] <= last_play_rank:
		return {"valid": false, "reason": "必须比上家大"}
	return {"valid": true, "type": hi["type"], "rank": hi["rank"], "reason": ""}

func _get_hand_type(cards: Array) -> Dictionary:
	if cards.is_empty():
		return {"valid": false}
	var values = []
	for card in cards:
		values.append(card.get_value())
	values.sort()
	
	if cards.size() == 1:
		return {"valid": true, "type": "单张", "rank": values[0]}
	if cards.size() == 2 and values[0] == values[1]:
		return {"valid": true, "type": "对子", "rank": values[0]}
	if cards.size() == 3 and values[0] == values[1] and values[1] == values[2]:
		return {"valid": true, "type": "三条", "rank": values[0]}
	if cards.size() >= 5:
		var is_straight = true
		for i in range(1, values.size()):
			if values[i] != values[i-1] + 1:
				is_straight = false
				break
		if is_straight and values[-1] < 15:
			return {"valid": true, "type": "顺子", "rank": values[-1]}
	if cards.size() == 4 and values[0] == values[1] and values[1] == values[2] and values[2] == values[3]:
		return {"valid": true, "type": "炸弹", "rank": values[0]}
	return {"valid": false}

func _remove_card_from_hand(card, player_id: int):
	var player = players[player_id]
	player["hand"].erase(card)
