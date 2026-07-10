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
    lastPlay: null,
    lastPlayPlayer: null,
    passCount: 0,
    isFirstRound: true,
    playedCardsStack: [], // 所有出过的牌（显示在中央）

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
            new Player(1, false, 'top'),
            // 后续可以扩展4人
            // new Player(2, false, 'left'),
            // new Player(3, false, 'right'),
        ];
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = null;
        this.passCount = 0;
        this.isFirstRound = true;
        this.playedCardsStack = [];
        this.startTurn();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    startAI() {
        document.getElementById('start-screen').style.display = 'none';
        this.players = [
            new Player(0, false, 'bottom'),
            new Player(1, true, 'top'),
        ];
        this.dealInitialCards();
        this.currentPlayerIndex = 0;
        this.lastPlay = null;
        this.lastPlayPlayer = null;
        this.passCount = 0;
        this.isFirstRound = true;
        this.playedCardsStack = [];
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
        
        if (this.lastPlayPlayer === this.currentPlayer || this.isFirstRound) {
            this.lastPlay = null;
            this.passCount = 0;
        }
        this.updateUI();
    },

    playSelectedCards() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;

        const selected = player.getSelectedCards();
        if (selected.length === 0) {
            this.showMsg('请先选择要出的牌');
            return;
        }

        const validation = PokerRules.validatePlay(selected, this.lastPlay);
        if (!validation.valid) {
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

        // 出牌成功 - 添加到显示栈
        for (const card of selected) {
            player.playCard(card);
            this.playedCardsStack.push({
                card: card,
                playerId: player.id,
                time: Date.now()
            });
        }
        player.deselectAll();
        
        this.lastPlay = { type: validation.type, rank: validation.rank, cards: selected };
        this.lastPlayPlayer = player;
        this.passCount = 0;
        this.isFirstRound = false;

        this.showMsg(`玩家${player.id + 1} 出了 ${PokerRules.getTypeName(validation.type)}`);

        if (this.checkVictory()) return;
        setTimeout(() => this.endTurn(), 800);
    },

    passTurn() {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn || player.isAI) return;

        if (this.isFirstRound && !this.lastPlay) {
            this.showMsg('第一轮必须出牌');
            return;
        }

        player.deselectAll();
        this.passCount++;
        this.showMsg(`玩家${player.id + 1} 不要`);

        if (this.passCount >= this.players.length - 1) {
            setTimeout(() => {
                this.lastPlay = null;
                this.lastPlayPlayer = null;
                this.passCount = 0;
                this.playedCardsStack = []; // 新一轮清空出牌区
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

    /**
     * 生产单位 - 在玩家基地位置生成
     */
    spawnUnit(type) {
        const player = this.currentPlayer;
        if (!player.isCurrentTurn) return;
        const config = CONSTANTS.UNITS[type.toUpperCase()];
        if (!player.canAfford(config.cost)) { this.showMsg('补给不足!'); return; }
        if (player.isPopulationFull()) { this.showMsg('人口已满!'); return; }

        player.spendSupply(config.cost);
        
        // 根据玩家位置确定出生点
        let baseX, baseY;
        const margin = 180;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        switch (player.side) {
            case 'bottom':
                baseX = cx + (Math.random() - 0.5) * 200;
                baseY = this.canvas.height - margin - 20;
                break;
            case 'top':
                baseX = cx + (Math.random() - 0.5) * 200;
                baseY = margin + 20;
                break;
            case 'left':
                baseX = margin + 20;
                baseY = cy + (Math.random() - 0.5) * 200;
                break;
            case 'right':
                baseX = this.canvas.width - margin - 20;
                baseY = cy + (Math.random() - 0.5) * 200;
                break;
        }
        
        const unit = new Unit(type, player, baseX, baseY);
        player.addUnit(unit);
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
        const turnText = document.getElementById('turn-text');
        if (turnText) {
            turnText.textContent = `玩家 ${cp.id + 1} 的回合` + (cp.isAI ? ' (AI)' : '');
        }
        
        const lastPlayEl = document.getElementById('last-play');
        if (lastPlayEl) {
            lastPlayEl.textContent = this.lastPlay ? 
                `上一手: ${PokerRules.getTypeName(this.lastPlay.type)}` : 
                '新一轮，任意出牌';
        }
        
        const p1Supply = document.getElementById('p1-supply');
        const p1Cards = document.getElementById('p1-cards');
        const p2Supply = document.getElementById('p2-supply');
        const p2Cards = document.getElementById('p2-cards');
        
        if (p1Supply) p1Supply.textContent = Math.floor(this.players[0].supply);
        if (p1Cards) p1Cards.textContent = this.players[0].hand.length;
        if (p2Supply) p2Supply.textContent = Math.floor(this.players[1]?.supply || 0);
        if (p2Cards) p2Cards.textContent = this.players[1]?.hand.length || 0;
        
        const selectedCount = cp.getSelectedCards().length;
        const canPass = !this.isFirstRound || this.lastPlay;
        const btnPlay = document.getElementById('btn-play');
        const btnPass = document.getElementById('btn-pass');
        if (btnPlay) btnPlay.disabled = (selectedCount === 0 || cp.isAI);
        if (btnPass) btnPass.disabled = (!canPass || cp.isAI);
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
        const validPlays = this.findValidPlays(p.hand);
        
        if (validPlays.length > 0 && Math.random() < 0.7) {
            const play = validPlays[Math.floor(Math.random() * validPlays.length)];
            for (const card of play) card.isSelected = true;
            this.playSelectedCards();
        } else if (Math.random() < 0.3 && p.canAfford(CONSTANTS.UNITS.INFANTRY.cost)) {
            this.spawnUnit('infantry');
        } else {
            this.passTurn();
        }
    },

    findValidPlays(hand) {
        const plays = [];
        for (const card of hand) {
            if (PokerRules.validatePlay([card], this.lastPlay).valid) plays.push([card]);
        }
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                if (hand[i].getValue() === hand[j].getValue()) {
                    const pair = [hand[i], hand[j]];
                    if (PokerRules.validatePlay(pair, this.lastPlay).valid) plays.push(pair);
                }
            }
        }
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    if (hand[i].getValue() === hand[j].getValue() && 
                        hand[j].getValue() === hand[k].getValue()) {
                        const triple = [hand[i], hand[j], hand[k]];
                        if (PokerRules.validatePlay(triple, this.lastPlay).valid) plays.push(triple);
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
        this.playedCardsStack = [];
        document.getElementById('msg-overlay').classList.remove('show');
        this.start();
    }
};
