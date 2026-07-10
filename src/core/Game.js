/**
 * 游戏主类 - 四幺四扑克 + RTS
 */
const Game = {
    canvas: null,
    renderer: null,
    inputHandler: null,
    players: [],
    currentPlayerIndex: 0,
    winner: null,
    economySystem: null,
    combatSystem: null,
    repairSystem: null,
    lastTime: 0,
    deltaTime: 0,
    turnTimer: 0,
    turnDuration: 30000,
    isTurnActive: false,
    
    // 扑克相关
    lastPlay: null,           // 上一手出的牌
    lastPlayPlayer: null,     // 上一手出牌的玩家
    passCount: 0,             // 连续跳过次数
    isFirstRound: true,       // 是否是第一轮（第一轮必须出牌）

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this);
        this.economySystem = new EconomySystem();
        this.combatSystem = new CombatSystem();
        this.repairSystem = new RepairSystem();
    },

    start() {
        document.getElementById('start-screen').style.display = 'none';
        this.players = [new Player(0, false), new Player(1, false)];
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = null;
        this.passCount = 0;
        this.isFirstRound = true;
        this.startTurn();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    startAI() {
        document.getElementById('start-screen').style.display = 'none';
        this.players = [new Player(0, false), new Player(1, true)];
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = null;
        this.passCount = 0;
        this.isFirstRound = true;
        this.startTurn();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    dealInitialCards() {
        const deck = Helpers.createDeck();
        for (let i = 0; i < this.players.length; i++) {
            const hand = [];
            for (let j = 0; j < CONSTANTS.INITIAL_HAND_SIZE; j++) {
                const d = deck[i * CONSTANTS.INITIAL_HAND_SIZE + j];
                hand.push(new Card(d.suit, d.rank, this.players[i]));
            }
            this.players[i].dealCards(hand);
        }
    },

    get currentPlayer() { return this.players[this.currentPlayerIndex]; },

    startTurn() {
        this.isTurnActive = true;
        this.turnTimer = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].isCurrentTurn = (i === this.currentPlayerIndex);
        }
        this.currentPlayer.deselectAll();
        this.updateUI();
        
        // 检查是否必须出牌（上一手是自己出的，或者第一轮）
        if (this.lastPlayPlayer === this.currentPlayer || this.isFirstRound) {
            this.lastPlay = null;
            this.passCount = 0;
        }
    },

    /**
     * 出牌 - 需要符合扑克规则
     */
    playSelectedCards() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;

        const selected = player.getSelectedCards();
        if (selected.length === 0) {
            this.showMsg('请先选择要出的牌');
            return;
        }

        // 验证牌型
        const validation = PokerRules.validatePlay(selected, this.lastPlay);
        if (!validation.valid) {
            // 给出具体错误提示
            const handType = PokerRules.getHandType(selected);
            if (!handType) {
                this.showMsg('无效的牌型');
            } else if (this.lastPlay && handType.type !== this.lastPlay.type) {
                this.showMsg(`必须出${PokerRules.getTypeName(this.lastPlay.type)}`);
            } else if (this.lastPlay && handType.rank <= this.lastPlay.rank) {
                this.showMsg('出的牌必须比上家大');
            } else {
                this.showMsg('无效的出牌');
            }
            return;
        }

        // 出牌成功
        for (const card of selected) player.playCard(card);
        player.deselectAll();
        
        // 更新上一手
        this.lastPlay = { type: validation.type, rank: validation.rank, cards: selected };
        this.lastPlayPlayer = player;
        this.passCount = 0;
        this.isFirstRound = false;

        this.showMsg(`玩家${player.id + 1} 出了 ${PokerRules.getTypeName(validation.type)}`);

        // 检查胜利
        if (this.checkVictory()) return;

        // 结束回合
        setTimeout(() => this.endTurn(), 800);
    },

    /**
     * 不要 - 跳过
     */
    passTurn() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;

        // 第一轮不能跳过
        if (this.isFirstRound && !this.lastPlay) {
            this.showMsg('第一轮必须出牌');
            return;
        }

        player.deselectAll();
        this.passCount++;
        
        this.showMsg(`玩家${player.id + 1} 不要`);

        // 如果所有人都跳过，重新开始新一轮
        if (this.passCount >= this.players.length - 1) {
            setTimeout(() => {
                this.lastPlay = null;
                this.lastPlayPlayer = null;
                this.passCount = 0;
                this.endTurn();
            }, 400);
        } else {
            setTimeout(() => this.endTurn(), 400);
        }
    },

    endTurn() {
        this.currentPlayer.deselectAll();
        this.inputHandler.selectedUnits = [];
        for (const u of this.currentPlayer.units) u.isSelected = false;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.startTurn();
    },

    spawnUnit(type) {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        const config = CONSTANTS.UNITS[type.toUpperCase()];
        if (!player.canAfford(config.cost)) { this.showMsg('补给不足!'); return; }
        if (player.isPopulationFull()) { this.showMsg('人口已满!'); return; }

        player.spendSupply(config.cost);
        const cx = this.canvas.width / 2;
        const baseY = player.side === 'bottom' ? this.canvas.height - 60 : 60;
        const unit = new Unit(type, player, cx + (Math.random() - 0.5) * 100, baseY);
        player.addUnit(unit);

        console.log(`Spawned ${type} for Player ${player.id} at y=${baseY}`);
        this.showMsg(`玩家${player.id + 1} 生产了 ${config.name}`);
    },

    startRepair() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        const selected = player.getSelectedCards();
        if (selected.length === 0) { this.showMsg('先选中一张牌'); return; }
        for (const card of selected) this.repairSystem.startRepair(card, player);
    },

    showMsg(text) {
        const el = document.getElementById('msg-overlay');
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => el.classList.remove('show'), 1500);
    },

    updateUI() {
        const cp = this.currentPlayer;
        document.getElementById('turn-text').textContent =
            `玩家 ${cp.id + 1} 的回合` + (cp.isAI ? ' (AI思考中...)' : '');
        
        // 显示上一手信息
        const lastPlayText = this.lastPlay ? 
            `上一手: ${PokerRules.getTypeName(this.lastPlay.type)}` : 
            '新一轮，任意出牌';
        document.getElementById('last-play').textContent = lastPlayText;
        
        document.getElementById('p1-supply').textContent = Math.floor(this.players[0].supply);
        document.getElementById('p1-cards').textContent = this.players[0].hand.length;
        document.getElementById('p2-supply').textContent = Math.floor(this.players[1].supply);
        document.getElementById('p2-cards').textContent = this.players[1].hand.length;
        
        // 出牌按钮状态
        const selectedCount = cp.getSelectedCards().length;
        const canPass = !this.isFirstRound || this.lastPlay;
        document.getElementById('btn-play').disabled = (selectedCount === 0 || cp.isAI);
        document.getElementById('btn-pass').disabled = (!canPass || cp.isAI);
    },

    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.update(this.deltaTime);
        this.renderer.render(this);
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(dt) {
        if (this.winner) return;
        if (this.isTurnActive) {
            this.turnTimer += dt;
            const left = Math.max(0, Math.ceil((this.turnDuration - this.turnTimer) / 1000));
            document.getElementById('turn-timer').textContent = left + 's';
            if (this.turnTimer >= this.turnDuration) {
                this.showMsg('超时! 自动跳过');
                this.passTurn();
            }
        }
        for (const p of this.players) {
            p.update(dt);
            p.updateHandPositions(this.canvas.width, this.canvas.height);
        }
        this.economySystem.update(dt, this.players);
        this.combatSystem.update(dt, this.players);
        this.repairSystem.update(dt);
        if (this.currentPlayer.isAI && this.isTurnActive) this.updateAI(dt);
        this.updateUI();
        this.checkVictory();
    },

    updateAI(dt) {
        if (!this._aiTimer) this._aiTimer = 0;
        this._aiTimer += dt;
        if (this._aiTimer < 2000) return;
        this._aiTimer = 0;

        const p = this.currentPlayer;
        
        // AI策略：找能出的牌
        const validPlays = this.findValidPlays(p.hand);
        
        if (validPlays.length > 0 && Math.random() < 0.7) {
            // 70%概率出牌
            const play = validPlays[Math.floor(Math.random() * validPlays.length)];
            for (const card of play) card.isSelected = true;
            this.playSelectedCards();
        } else {
            // 跳过或生产单位
            if (Math.random() < 0.3 && p.canAfford(CONSTANTS.UNITS.INFANTRY.cost)) {
                this.spawnUnit('infantry');
            } else {
                this.passTurn();
            }
        }
    },

    /**
     * 找出所有能出的牌组合
     */
    findValidPlays(hand) {
        const plays = [];
        
        // 单张
        for (const card of hand) {
            const validation = PokerRules.validatePlay([card], this.lastPlay);
            if (validation.valid) plays.push([card]);
        }
        
        // 对子
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                if (hand[i].getValue() === hand[j].getValue()) {
                    const pair = [hand[i], hand[j]];
                    const validation = PokerRules.validatePlay(pair, this.lastPlay);
                    if (validation.valid) plays.push(pair);
                }
            }
        }
        
        // 三条
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    if (hand[i].getValue() === hand[j].getValue() && 
                        hand[j].getValue() === hand[k].getValue()) {
                        const triple = [hand[i], hand[j], hand[k]];
                        const validation = PokerRules.validatePlay(triple, this.lastPlay);
                        if (validation.valid) plays.push(triple);
                    }
                }
            }
        }
        
        return plays;
    },

    checkVictory() {
        for (const p of this.players) {
            if (p.hasWon()) {
                this.winner = p;
                this.showMsg(`🎉 玩家 ${p.id + 1} 获胜！`);
                return true;
            }
        }
        return false;
    },

    onCardDestroyed(card) { this.combatSystem.onCardDestroyed(card); },
    onUnitDestroyed(unit) {
        this.combatSystem.onUnitDeath(unit);
        const idx = this.inputHandler.selectedUnits.indexOf(unit);
        if (idx !== -1) this.inputHandler.selectedUnits.splice(idx, 1);
    },

    restart() {
        this.winner = null;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.inputHandler.selectedUnits = [];
        this.lastPlay = null;
        this.lastPlayPlayer = null;
        this.passCount = 0;
        this.isFirstRound = true;
        document.getElementById('msg-overlay').classList.remove('show');
        this.start();
    }
};
