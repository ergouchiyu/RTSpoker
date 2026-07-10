/**
 * 游戏主类
 */
const Game = {
    // 核心系统
    canvas: null,
    renderer: null,
    inputHandler: null,
    
    // 游戏状态
    players: [],
    currentPlayerIndex: 0,
    winner: null,
    
    // 子系统
    economySystem: null,
    combatSystem: null,
    repairSystem: null,
    
    // 时间
    lastTime: 0,
    deltaTime: 0,
    
    /**
     * 初始化游戏
     */
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this);
        
        // 初始化子系统
        this.economySystem = new EconomySystem();
        this.combatSystem = new CombatSystem();
        this.repairSystem = new RepairSystem();
        
        // 绑定UI按钮
        this.bindUI();
        
        console.log('Game initialized');
    },
    
    /**
     * 绑定UI
     */
    bindUI() {
        // 这里可以添加更多UI绑定
    },
    
    /**
     * 开始游戏（本地2人）
     */
    start() {
        // 隐藏开始界面
        document.getElementById('start-screen').style.display = 'none';
        
        // 创建玩家
        this.players = [
            new Player(0, false),
            new Player(1, false)
        ];
        
        // 发牌
        this.dealInitialCards();
        
        // 设置当前回合
        this.currentPlayerIndex = 0;
        this.players[0].isCurrentTurn = true;
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    /**
     * 开始游戏（vs AI）
     */
    startAI() {
        // 隐藏开始界面
        document.getElementById('start-screen').style.display = 'none';
        
        // 创建玩家
        this.players = [
            new Player(0, false),
            new Player(1, true)
        ];
        
        // 发牌
        this.dealInitialCards();
        
        // 设置当前回合
        this.currentPlayerIndex = 0;
        this.players[0].isCurrentTurn = true;
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    /**
     * 发初始手牌
     */
    dealInitialCards() {
        const deck = Helpers.createDeck();
        
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const hand = [];
            
            for (let j = 0; j < CONSTANTS.INITIAL_HAND_SIZE; j++) {
                const cardData = deck[i * CONSTANTS.INITIAL_HAND_SIZE + j];
                const card = new Card(cardData.suit, cardData.rank, player);
                hand.push(card);
            }
            
            player.dealCards(hand);
        }
    },
    
    /**
     * 获取当前玩家
     */
    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    },
    
    /**
     * 游戏循环
     */
    gameLoop(currentTime = 0) {
        // 计算 deltaTime
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新
        this.update(this.deltaTime);
        
        // 渲染
        this.renderer.render(this);
        
        // 继续循环
        requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    /**
     * 更新游戏
     */
    update(deltaTime) {
        // 如果游戏结束，不更新
        if (this.winner) return;
        
        // 更新玩家
        for (const player of this.players) {
            player.update(deltaTime);
            player.updateHandPositions(this.canvas.width, this.canvas.height);
        }
        
        // 更新子系统
        this.economySystem.update(deltaTime, this.players);
        this.combatSystem.update(deltaTime, this.players);
        this.repairSystem.update(deltaTime);
        
        // AI更新
        if (this.currentPlayer.isAI) {
            this.updateAI(deltaTime);
        }
        
        // 检查胜利
        this.checkVictory();
    },
    
    /**
     * 更新AI
     */
    updateAI(deltaTime) {
        // 简单AI：随机出牌和生产单位
        const player = this.currentPlayer;
        
        // 随机出牌
        if (Math.random() < 0.01 && player.hand.length > 0) {
            const randomCard = player.hand[Math.floor(Math.random() * player.hand.length)];
            this.playCards([randomCard]);
        }
        
        // 随机生产单位
        if (Math.random() < 0.02 && player.canAfford(CONSTANTS.UNITS.INFANTRY.cost)) {
            this.spawnUnit('infantry');
        }
    },
    
    /**
     * 出牌
     */
    playCards(cards) {
        const player = this.currentPlayer;
        
        // 出牌
        for (const card of cards) {
            player.playCard(card);
        }
        
        // 取消选中
        player.deselectAll();
        
        // 检查胜利
        this.checkVictory();
    },
    
    /**
     * 生产单位
     */
    spawnUnit(type) {
        const player = this.currentPlayer;
        const config = CONSTANTS.UNITS[type.toUpperCase()];
        
        // 检查资源
        if (!player.canAfford(config.cost)) {
            console.log('Not enough supply');
            return;
        }
        
        // 检查人口
        if (player.isPopulationFull()) {
            console.log('Population full');
            return;
        }
        
        // 消耗资源
        player.spendSupply(config.cost);
        
        // 创建单位
        const baseX = player.side === 'bottom' ? 
            this.canvas.width / 2 : 
            this.canvas.width / 2;
        const baseY = player.side === 'bottom' ? 
            this.canvas.height - 50 : 
            50;
        
        const unit = new Unit(type, player, baseX, baseY);
        player.addUnit(unit);
        
        console.log(`Spawned ${type} for player ${player.id}`);
    },
    
    /**
     * 开始维修
     */
    startRepair() {
        const player = this.currentPlayer;
        const selectedCards = player.getSelectedCards();
        
        if (selectedCards.length === 0) {
            console.log('No card selected');
            return;
        }
        
        for (const card of selectedCards) {
            this.repairSystem.startRepair(card, player);
        }
    },
    
    /**
     * 结束回合
     */
    endTurn() {
        // 取消选中
        this.currentPlayer.deselectAll();
        
        // 切换玩家
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // 设置当前回合
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].isCurrentTurn = (i === this.currentPlayerIndex);
        }
    },
    
    /**
     * 检查胜利
     */
    checkVictory() {
        for (const player of this.players) {
            if (player.hasWon()) {
                this.winner = player;
                console.log(`Player ${player.id} wins!`);
                break;
            }
        }
    },
    
    /**
     * 牌被摧毁时调用
     */
    onCardDestroyed(card) {
        this.combatSystem.onCardDestroyed(card);
    },
    
    /**
     * 单位被摧毁时调用
     */
    onUnitDestroyed(unit) {
        this.combatSystem.onUnitDeath(unit);
    },
    
    /**
     * 重新开始
     */
    restart() {
        this.winner = null;
        this.players = [];
        this.currentPlayerIndex = 0;
        
        // 重新开始
        if (this.players.length > 0 && this.players[0].isAI) {
            this.startAI();
        } else {
            this.start();
        }
    }
};
