## 游戏管理器 - 核心逻辑
class_name GameManager
extends Node

# 玩家数据
var players: Array[Dictionary] = []  # [{hand: [], units: [], supply: float, side: String}]
var current_player_index: int = 0
var is_game_over: bool = false

# 扑克状态
var last_play_type: String = ""
var last_play_rank: int = 0
var last_play_player_id: int = -1
var pass_count: int = 0
var is_first_round: bool = true
var played_stack: Array[Dictionary] = []  # [{card: Card, player_id: int}]

# 选中状态
var selected_cards: Array[Card] = []
var selected_units: Array[Unit] = []

# 回合计时
var turn_timer: float = 0.0
var turn_duration: float = 30.0

# 信号
signal turn_changed(player_id: int)
signal game_over(winner_id: int)
signal message(text: String)

func _ready():
	_start_game(false)

func _start_game(vs_ai: bool):
	players.clear()
	played_stack.clear()
	selected_cards.clear()
	selected_units.clear()
	is_game_over = false
	is_first_round = true
	pass_count = 0
	last_play_player_id = -1
	current_player_index = 0
	
	# 创建玩家
	for i in range(2):
		players.append({
			"id": i,
			"hand": [],
			"units": [],
			"supply": GameConst.INITIAL_SUPPLY,
			"side": GameConst.PLAYER_SIDES[i],
			"is_ai": (i == 1 and vs_ai)
		})
	
	# 发牌
	_deal_cards()
	
	# 开始第一回合
	_start_turn()

func _deal_cards():
	var deck := _create_deck()
	deck.shuffle()
	var idx := 0
	for p in players:
		p.hand.clear()
		for j in range(GameConst.INITIAL_HAND_SIZE):
			var d = deck[idx]
			var card := Card.new(d.suit, d.rank, p.id)
			p.hand.append(card)
			idx += 1

func _create_deck() -> Array:
	var deck := []
	for suit in GameConst.SUITS:
		for rank in GameConst.RANKS:
			deck.append({"suit": suit, "rank": rank})
	return deck

func get_current_player() -> Dictionary:
	return players[current_player_index]

func _start_turn():
	turn_timer = 0.0
	_clear_selection()
	
	var cp := get_current_player()
	
	# 检查是否新一轮
	if last_play_player_id == cp.id or is_first_round:
		last_play_type = ""
		last_play_rank = 0
		pass_count = 0
	
	turn_changed.emit(cp.id)

func _end_turn():
	_clear_selection()
	current_player_index = (current_player_index + 1) % players.size()
	_start_turn()

func _clear_selection():
	for card in selected_cards:
		card.is_selected = false
	selected_cards.clear()
	
	for unit in selected_units:
		unit.is_selected = false
	selected_units.clear()

## 出牌
func play_selected_cards():
	var cp := get_current_player()
	if cp.is_ai:
		return
	if selected_cards.is_empty():
		message.emit("请先选择要出的牌")
		return
	
	# 验证牌型
	var validation := _validate_play(selected_cards)
	if not validation.valid:
		message.emit(validation.reason)
		return
	
	# 出牌成功
	for card in selected_cards:
		_remove_card_from_hand(card, cp.id)
		played_stack.append({"card": card, "player_id": cp.id})
	
	_clear_selection()
	last_play_type = validation.type
	last_play_rank = validation.rank
	last_play_player_id = cp.id
	pass_count = 0
	is_first_round = false
	
	message.emit("玩家%d 出了 %s" % [cp.id + 1, validation.type])
	
	if cp.hand.is_empty():
		is_game_over = true
		game_over.emit(cp.id)
		return
	
	_end_turn()

## 不要
func pass_turn():
	var cp := get_current_player()
	if cp.is_ai:
		return
	if is_first_round and last_play_type == "":
		message.emit("第一轮必须出牌")
		return
	
	_clear_selection()
	pass_count += 1
	message.emit("玩家%d 不要" % [cp.id + 1])
	
	if pass_count >= players.size() - 1:
		# 所有人不要，新一轮
		last_play_type = ""
		last_play_rank = 0
		last_play_player_id = -1
		pass_count = 0
		played_stack.clear()
	
	_end_turn()

## 生产单位
func spawn_unit():
	var cp := get_current_player()
	if cp.supply < GameConst.INFANTRY_COST:
		message.emit("补给不足!")
		return
	
	cp.supply -= GameConst.INFANTRY_COST
	
	# 计算出生点
	var spawn_pos := _get_spawn_position(cp)
	
	var unit := Unit.new(cp.id, "infantry", spawn_pos)
	cp.units.append(unit)
	add_child(unit)
	
	message.emit("玩家%d 生产了步兵" % [cp.id + 1])

func _get_spawn_position(player: Dictionary) -> Vector2:
	var viewport_size := get_viewport().get_visible_rect().size
	var cx := viewport_size.x / 2
	var cy := viewport_size.y / 2
	
	match player.side:
		"bottom":
			return Vector2(cx + randf_range(-100, 100), viewport_size.y - 120)
		"top":
			return Vector2(cx + randf_range(-100, 100), 50)
		"left":
			return Vector2(120, cy + randf_range(-100, 100))
		"right":
			return Vector2(viewport_size.x - 120, cy + randf_range(-100, 100))
	return Vector2(cx, cy)

## 选择卡牌
func select_card(card: Card):
	var cp := get_current_player()
	if card.owner_id != cp.id:
		return  # 不能选别人的牌
	
	card.is_selected = !card.is_selected
	if card.is_selected:
		selected_cards.append(card)
	else:
		selected_cards.erase(card)

## 框选单位 - 只选自己的
func select_units_in_rect(rect: Rect2):
	_clear_selection()
	var cp := get_current_player()
	
	for unit in cp.units:
		if is_instance_valid(unit) and rect.has_point(unit.position):
			unit.is_selected = true
			selected_units.append(unit)

## 右键指挥单位
func command_units_attack_card(target_card: Card):
	if selected_units.is_empty():
		return
	
	# 只能攻击别人的牌
	var cp := get_current_player()
	if target_card.owner_id == cp.id:
		message.emit("不能攻击自己的牌!")
		return
	
	for unit in selected_units:
		if is_instance_valid(unit):
			unit.attack_card(target_card)

func command_units_move_to(pos: Vector2):
	for unit in selected_units:
		if is_instance_valid(unit):
			unit.move_to(pos)

## 验证出牌
func _validate_play(cards: Array[Card]) -> Dictionary:
	if cards.is_empty():
		return {"valid": false, "reason": "没有牌"}
	
	# 获取牌型
	var hand_info := _get_hand_type(cards)
	if not hand_info.valid:
		return {"valid": false, "reason": "无效牌型"}
	
	# 首次出牌，任意牌型
	if last_play_type == "":
		return {"valid": true, "type": hand_info.type, "rank": hand_info.rank, "reason": ""}
	
	# 必须同牌型
	if hand_info.type != last_play_type:
		return {"valid": false, "reason": "必须出" + last_play_type}
	
	# 必须更大
	if hand_info.rank <= last_play_rank:
		return {"valid": false, "reason": "必须比上家大"}
	
	return {"valid": true, "type": hand_info.type, "rank": hand_info.rank, "reason": ""}

func _get_hand_type(cards: Array[Card]) -> Dictionary:
	if cards.is_empty():
		return {"valid": false}
	
	var values := []
	for card in cards:
		values.append(card.get_value())
	values.sort()
	
	# 单张
	if cards.size() == 1:
		return {"valid": true, "type": "单张", "rank": values[0]}
	
	# 对子
	if cards.size() == 2 and values[0] == values[1]:
		return {"valid": true, "type": "对子", "rank": values[0]}
	
	# 三条
	if cards.size() == 3 and values[0] == values[1] and values[1] == values[2]:
		return {"valid": true, "type": "三条", "rank": values[0]}
	
	# 顺子 (5张连续)
	if cards.size() >= 5:
		var is_straight := true
		for i in range(1, values.size()):
			if values[i] != values[i-1] + 1:
				is_straight = false
				break
		if is_straight and values[-1] < 15:  # 不能包含2
			return {"valid": true, "type": "顺子", "rank": values[-1]}
	
	# 炸弹 (四张相同)
	if cards.size() == 4 and values[0] == values[1] and values[1] == values[2] and values[2] == values[3]:
		return {"valid": true, "type": "炸弹", "rank": values[0]}
	
	return {"valid": false}

func _process(delta: float):
	if is_game_over:
		return
	
	turn_timer += delta
	if turn_timer >= turn_duration:
		message.emit("超时!")
		pass_turn()
	
	# 更新经济
	_update_economy(delta)

func _update_economy(delta: float):
	for p in players:
		var income := 0.0
		for card in p.hand:
			income += card.get_income(GameConst.CARD_INCOME_BASE)
		p.supply += income * delta

func _remove_card_from_hand(card: Card, player_id: int):
	var player := players[player_id]
	player.hand.erase(card)
