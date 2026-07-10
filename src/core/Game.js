/**
 * 游戏主类 - 回合制出牌 + 实时RTS
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
        this.startTurn();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    startAI() {
        document.getElementById('start-screen').style.display = 'none';
        this.players = [new Player(0, false), new Player(1, true)];
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
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
    },

    /** 出牌：打出当前玩家选中的牌 */
    playSelectedCards() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        if (player.isAI) return;

        const selected = player.getSelectedCards();
        if (selected.length === 0) return;

        // 打出选中的牌
        for (const card of selected) {
            player.playCard(card);
        }
        player.deselectAll();

        this.showMsg(`玩家${player.id + 1} 出了 ${selected.length} 张牌`);

        // 检查胜利
        if (this.checkVictory()) return;

        // 结束回合
        setTimeout(() => this.endTurn(), 600);
    },

    /** 不要：跳过回合不出牌 */
    passTurn() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        if (player.isAI) return;

        player.deselectAll();
        this.showMsg(`玩家${player.id + 1} 不要`);

        setTimeout(() => this.endTurn(), 400);
    },

    endTurn() {
        this.currentPlayer.deselectAll();
        // 清除单位选择
        this.inputHandler.selectedUnits = [];
        for (const u of this.currentPlayer.units) u.isSelected = false;

        // 下一个玩家
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
    },

    startRepair() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        const selected = player.getSelectedCards();
        if (selected.length === 0) { this.showMsg('先选中一张牌'); return; }
        for (const card of selected) {
            this.repairSystem.startRepair(card, player);
        }
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

        document.getElementById('p1-supply').textContent = Math.floor(this.players[0].supply);
        document.getElementById('p1-cards').textContent = this.players[0].hand.length;
        document.getElementById('p2-supply').textContent = Math.floor(this.players[1].supply);
        document.getElementById('p2-cards').textContent = this.players[1].hand.length;

        // 出牌按钮：只有选中牌才能点
        const selectedCount = cp.getSelectedCards().length;
        document.getElementById('btn-play').disabled = (selectedCount === 0 || cp.isAI);
        document.getElementById('btn-pass').disabled = cp.isAI;
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

        // 回合计时
        if (this.isTurnActive) {
            this.turnTimer += dt;
            const left = Math.max(0, Math.ceil((this.turnDuration - this.turnTimer) / 1000));
            document.getElementById('turn-timer').textContent = left + 's';
            if (this.turnTimer >= this.turnDuration) {
                this.showMsg('超时! 自动跳过');
                this.passTurn();
            }
        }

        // 所有玩家实时更新（单位持续移动/攻击）
        for (const p of this.players) {
            p.update(dt);
            p.updateHandPositions(this.canvas.width, this.canvas.height);
        }

        this.economySystem.update(dt, this.players);
        this.combatSystem.update(dt, this.players);
        this.repairSystem.update(dt);

        // AI
        if (this.currentPlayer.isAI && this.isTurnActive) {
            this.updateAI(dt);
        }

        this.updateUI();
        this.checkVictory();
    },

    updateAI(dt) {
        if (!this._aiTimer) this._aiTimer = 0;
        this._aiTimer += dt;
        if (this._aiTimer < 2000) return;
        this._aiTimer = 0;

        const p = this.currentPlayer;
        // AI: 30%概率出一张随机牌，30%概率生产步兵，40%概率跳过
        const roll = Math.random();
        if (roll < 0.3 && p.hand.length > 0) {
            const card = p.hand[Math.floor(Math.random() * p.hand.length)];
            card.isSelected = true;
            this.playSelectedCards();
        } else if (roll < 0.6 && p.canAfford(CONSTANTS.UNITS.INFANTRY.cost)) {
            this.spawnUnit('infantry');
        } else {
            this.passTurn();
        }
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
        document.getElementById('msg-overlay').classList.remove('show');
        this.start();
    }
};
