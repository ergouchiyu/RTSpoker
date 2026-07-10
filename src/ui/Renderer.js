/**
 * 渲染器
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 设置画布大小
        this.resize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }
    
    /**
     * 调整画布大小
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * 清除画布
     */
    clear() {
        this.ctx.fillStyle = CONSTANTS.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 绘制牌桌
     */
    drawTable() {
        const { ctx, canvas } = this;
        const tablePadding = 100;
        
        // 牌桌背景
        ctx.fillStyle = CONSTANTS.COLORS.TABLE;
        ctx.fillRect(
            tablePadding,
            tablePadding,
            canvas.width - tablePadding * 2,
            canvas.height - tablePadding * 2
        );
        
        // 牌桌边框
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            tablePadding,
            tablePadding,
            canvas.width - tablePadding * 2,
            canvas.height - tablePadding * 2
        );
    }
    
    /**
     * 绘制玩家信息
     */
    drawPlayerInfo(player) {
        const { ctx, canvas } = this;
        
        const x = 20;
        const y = player.side === 'bottom' ? canvas.height - 150 : 20;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 200, 80);
        
        // 玩家名称
        ctx.fillStyle = CONSTANTS.COLORS.TEXT;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`玩家 ${player.id + 1}`, x + 10, y + 25);
        
        // 补给
        ctx.fillStyle = CONSTANTS.COLORS.SUPPLY;
        ctx.font = '14px Arial';
        ctx.fillText(`补给: ${Helpers.formatNumber(player.supply)}`, x + 10, y + 45);
        
        // 人口
        ctx.fillStyle = CONSTANTS.COLORS.TEXT;
        ctx.fillText(`人口: ${player.population}/${player.maxPopulation}`, x + 10, y + 65);
    }
    
    /**
     * 绘制游戏状态
     */
    drawGameState(game) {
        const { ctx, canvas } = this;
        
        // 绘制当前回合指示
        ctx.fillStyle = CONSTANTS.COLORS.TEXT;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `玩家 ${game.currentPlayerIndex + 1} 的回合`,
            canvas.width / 2,
            30
        );
        
        // 绘制手牌数量
        ctx.font = '14px Arial';
        ctx.fillText(
            `手牌: ${game.players[0].hand.length} vs ${game.players[1].hand.length}`,
            canvas.width / 2,
            55
        );
    }
    
    /**
     * 绘制胜利界面
     */
    drawVictory(player) {
        const { ctx, canvas } = this;
        
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 胜利文字
        ctx.fillStyle = CONSTANTS.COLORS.HP_GREEN;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `玩家 ${player.id + 1} 获胜！`,
            canvas.width / 2,
            canvas.height / 2 - 20
        );
        
        // 提示
        ctx.fillStyle = CONSTANTS.COLORS.TEXT;
        ctx.font = '24px Arial';
        ctx.fillText(
            '点击重新开始',
            canvas.width / 2,
            canvas.height / 2 + 30
        );
    }
    
    /**
     * 绘制所有内容
     */
    render(game) {
        this.clear();
        this.drawTable();
        
        // 绘制玩家
        for (const player of game.players) {
            player.draw(this.ctx);
            this.drawPlayerInfo(player);
        }
        
        // 绘制游戏状态
        this.drawGameState(game);
        
        // 绘制胜利界面
        if (game.winner) {
            this.drawVictory(game.winner);
        }
    }
}
