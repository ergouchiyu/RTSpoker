/**
 * 游戏主类 - 核心逻辑
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
    lastPlay: null,
    lastPlayPlayerId: -1,
    passCount: 0,
    isFirstRound: true,
    playedCardsStack: [],

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
        this.players = [
            new Player(0, false, 'bottom'),
            new Player(1, false, 'top')
        ];
        this.startGame();
    },

    startAI() {
        document.getElementById('start-screen').style.display = 'none';
        this.players = [
            new Player(0, false, 'bottom'),
            new Player(1, true, 'top')
        ];
        this.startGame();
    },

    startGame() {
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayerId = -1;
        this.passCount = 0;
        this.isFirstRound = true;
        this.playedCardsStack = [];
        this.winner = null;
        this.inputHandler.clearSelection();
        this.startTurn();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    dealInitialCards() {
        const deck = Helpers.createDeck();
        let idx = 0;
        for (const p of this.players) {
            const hand = [];
            for (let j = 0; j < CONSTANTS.INITIAL_HAND_SIZE; j++) {
                const d = deck[idx++];
                hand.push(new Card(d.suit, d.rank, p));
            }
            p.dealCards(hand);
        }
    },

    get currentPlayer() { return this.players[this.currentPlayerIndex]; },

    startTurn() {
        this.isTurnActive = true;
        this.turnTimer = 0;
        // 设置当前回合标记
        this.players.forEach((p, i) => p.isCurrentTurn = (i === this.currentPlayerIndex));
        // 清除所有选中状态
        this.currentPlayer.deselectAll();
        this.inputHandler.clearSelection();
        // 检查是否新一轮
        if (this.lastPlayPlayerId === this.currentPlayer.id || this.isFirstRound) {
            this.lastPlay = null;
            this.passCount = 0;
        }
        this.updateUI();
    },

    endTurn() {
        // 清除选中
        this.currentPlayer.deselectAll();
        this.inputHandler.clearSelection();
        // 切换玩家
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.startTurn();
    },

    /** 出牌 */
    playSelectedCards() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;
        const selected = player.getSelectedCards();
        if (selected.length === 0) { this.showMsg('请先选择要出的牌'); return; }

        const validation = PokerRules.validatePlay(selected, this.lastPlay);
        if (!validation.valid) {
            const ht = PokerRules.getHandType(selected);
            if (!ht) this.showMsg('无效牌型');
            else if (this.lastPlay && ht.type !== this.lastPlay.type) this.showMsg(`必须出${PokerRules.getTypeName(this.lastPlay.type)}`);
            else if (this.lastPlay && ht.rank <= this.lastPlay.rank) this.showMsg('必须比上家大');
            else this.showMsg('无效出牌');
            return;
        }

        // 出牌成功
        selected.forEach(c => {
            player.playCard(c);
            this.playedCardsStack.push({ card: c, playerId: player.id });
        });
        player.deselectAll();
        this.lastPlay = { type: validation.type, rank: validation.rank };
        this.lastPlayPlayerId = player.id;
        this.passCount = 0;
        this.isFirstRound = false;
        this.showMsg(`${player.name} 出了 ${PokerRules.getTypeName(validation.type)}`);
        if (this.checkVictory()) return;
        setTimeout(() => this.endTurn(), 800);
    },

    /** 不要 */
    passTurn() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;
        if (this.isFirstRound && !this.lastPlay) { this.showMsg('第一轮必须出牌'); return; }
        player.deselectAll();
        this.passCount++;
        this.showMsg(`${player.name} 不要`);
        if (this.passCount >= this.players.length - 1) {
            setTimeout(() => { this.lastPlay = null; this.lastPlayPlayerId = -1; this.passCount = 0; this.playedCardsStack = []; this.endTurn(); }, 400);
        } else {
            setTimeout(() => this.endTurn(), 400);
        }
    },

    /** 生产单位 - 严格绑定到 currentPlayer */
    spawnUnit(type) {
        const player = this.currentPlayer;  // 当前回合玩家
        if (!player.isCurrentTurn) return;
        const cfg = CONSTANTS.UNITS[type.toUpperCase()];
        if (!player.canAfford(cfg.cost)) { this.showMsg('补给不足!'); return; }
        if (player.isPopulationFull()) { this.showMsg('人口已满!'); return; }

        player.spendSupply(cfg.cost);

        // 出生点在玩家基地位置
        let baseX, baseY;
        const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
        switch (player.side) {
            case 'bottom': baseX = cx + (Math.random()-0.5)*200; baseY = this.canvas.height - 130; break;
            case 'top':    baseX = cx + (Math.random()-0.5)*200; baseY = 50; break;
            case 'left':   baseX = 130; baseY = cy + (Math.random()-0.5)*200; break;
            case 'right':  baseX = this.canvas.width - 130; baseY = cy + (Math.random()-0.5)*200; break;
        }

        const unit = new Unit(type, player, baseX, baseY);  // owner = player
        player.addUnit(unit);  // 加入玩家的单位列表
        this.showMsg(`${player.name} 生产了 ${cfg.name}`);
    },

    startRepair() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        const selected = player.getSelectedCards();
        if (selected.length === 0) { this.showMsg('先选中一张牌'); return; }
        selected.forEach(c => this.repairSystem.startRepair(c, player));
    },

    showMsg(text) {
        const el = document.getElementById('msg');
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => el.classList.remove('show'), 1500);
    },

    updateUI() {
        const cp = this.currentPlayer;
        document.getElementById('turn-info').textContent = `${cp.name} 回合${cp.isAI ? '(AI)' : ''}`;
        const left = Math.max(0, Math.ceil((this.turnDuration - this.turnTimer) / 1000));
        document.getElementById('timer').textContent = `${left}s`;
        document.getElementById('last-play').textContent = this.lastPlay ? `上一手: ${PokerRules.getTypeName(this.lastPlay.type)}` : '新一轮';
        document.getElementById('p1-s').textContent = Math.floor(this.players[0].supply);
        document.getElementById('p1-c').textContent = this.players[0].hand.length;
        document.getElementById('p2-s').textContent = Math.floor(this.players[1]?.supply || 0);
        document.getElementById('p2-c').textContent = this.players[1]?.hand.length || 0;
        document.getElementById('btn-play').disabled = (cp.getSelectedCards().length === 0 || cp.isAI);
        document.getElementById('btn-pass').disabled = ((!this.lastPlay && this.isFirstRound) || cp.isAI);
    },

    gameLoop(now = 0) {
        this.deltaTime = now - this.lastTime;
        this.lastTime = now;
        this.update(this.deltaTime);
        this.renderer.render(this);
        requestAnimationFrame(t => this.gameLoop(t));
    },

    update(dt) {
        if (this.winner) return;
        if (this.isTurnActive) {
            this.turnTimer += dt;
            if (this.turnTimer >= this.turnDuration) { this.showMsg('超时!'); this.passTurn(); }
        }
        this.players.forEach(p => { p.update(dt); p.updateHandPositions(this.canvas.width, this.canvas.height); });
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
        const plays = this.findValidPlays(p.hand);
        if (plays.length > 0 && Math.random() < 0.6) {
            const play = plays[Math.floor(Math.random() * plays.length)];
            play.forEach(c => c.isSelected = true);
            this.playSelectedCards();
        } else if (Math.random() < 0.3 && p.canAfford(CONSTANTS.UNITS.INFANTRY.cost)) {
            this.spawnUnit('infantry');
        } else {
            this.passTurn();
        }
    },

    findValidPlays(hand) {
        const plays = [];
        hand.forEach(c => { if (PokerRules.validatePlay([c], this.lastPlay).valid) plays.push([c]); });
        for (let i = 0; i < hand.length; i++)
            for (let j = i+1; j < hand.length; j++)
                if (hand[i].getValue() === hand[j].getValue()) {
                    const pair = [hand[i], hand[j]];
                    if (PokerRules.validatePlay(pair, this.lastPlay).valid) plays.push(pair);
                }
        return plays;
    },

    checkVictory() {
        for (const p of this.players) {
            if (p.hasWon()) { this.winner = p; this.showMsg(`🎉 ${p.name} 获胜！`); return true; }
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
        this.inputHandler.clearSelection();
        this.startGame();
    }
};
