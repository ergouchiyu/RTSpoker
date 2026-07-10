/**
 * 渲染器 - 重新设计布局
 * 4个玩家在上下左右，中间是出牌区和战场
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制牌桌布局
     */
    drawTable() {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;
        const margin = 180; // 玩家区域宽度

        // 中央战场区域
        ctx.fillStyle = '#16213e';
        ctx.fillRect(margin, margin, w - margin * 2, h - margin * 2);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

        // 四个玩家区域背景
        // 上方
        ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
        ctx.fillRect(0, 0, w, margin);
        // 下方
        ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
        ctx.fillRect(0, h - margin, w, margin);
        // 左方
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.fillRect(0, margin, margin, h - margin * 2);
        // 右方
        ctx.fillStyle = 'rgba(155, 89, 182, 0.1)';
        ctx.fillRect(w - margin, margin, margin, h - margin * 2);
    }

    /**
     * 绘制玩家信息（作为基地）
     */
    drawPlayerBase(player, canvasWidth, canvasHeight) {
        const { ctx } = this;
        const margin = 180;
        let x, y, w, h;

        switch (player.side) {
            case 'bottom':
                x = margin; y = canvasHeight - margin;
                w = canvasWidth - margin * 2; h = margin;
                break;
            case 'top':
                x = margin; y = 0;
                w = canvasWidth - margin * 2; h = margin;
                break;
            case 'left':
                x = 0; y = margin;
                w = margin; h = canvasHeight - margin * 2;
                break;
            case 'right':
                x = canvasWidth - margin; y = margin;
                w = margin; h = canvasHeight - margin * 2;
                break;
        }

        // 基地背景
        const color = player.id === 0 ? '#e94560' : 
                      player.id === 1 ? '#4ecdc4' : 
                      player.id === 2 ? '#3498db' : '#9b59b6';
        
        ctx.fillStyle = player.isCurrentTurn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)';
        ctx.fillRect(x, y, w, h);
        
        // 边框（当前回合高亮）
        if (player.isCurrentTurn) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
        }

        // 玩家信息
        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = x + w / 2;
        const cy = y + h / 2;

        // 玩家名
        ctx.fillText(`玩家 ${player.id + 1}`, cx, cy - 30);
        
        // 补给和手牌
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`补给: ${Math.floor(player.supply)}`, cx, cy);
        ctx.fillText(`手牌: ${player.hand.length}`, cx, cy + 20);
        ctx.fillText(`人口: ${player.population}/${player.maxPopulation}`, cx, cy + 40);

        // 当前回合标记
        if (player.isCurrentTurn) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('回合中', cx, cy - 50);
        }
    }

    /**
     * 绘制手牌（在玩家区域）
     */
    drawHand(player, canvasWidth, canvasHeight) {
        const { ctx } = this;
        const cardW = 50;
        const cardH = 70;
        const gap = 5;
        const totalW = player.hand.length * (cardW + gap) - gap;

        let startX, startY;
        let isVertical = false;

        switch (player.side) {
            case 'bottom':
                startX = (canvasWidth - totalW) / 2;
                startY = canvasHeight - cardH - 20;
                break;
            case 'top':
                startX = (canvasWidth - totalW) / 2;
                startY = 20;
                break;
            case 'left':
                startX = 20;
                startY = (canvasHeight - totalW) / 2;
                isVertical = true;
                break;
            case 'right':
                startX = canvasWidth - cardW - 20;
                startY = (canvasHeight - totalW) / 2;
                isVertical = true;
                break;
        }

        for (let i = 0; i < player.hand.length; i++) {
            const card = player.hand[i];
            if (isVertical) {
                card.targetX = startX;
                card.targetY = startY + i * (cardW + gap);
            } else {
                card.targetX = startX + i * (cardW + gap);
                card.targetY = startY;
            }
            card.isRevealed = (player.side === 'bottom'); // 只有底部玩家看正面
        }
    }

    /**
     * 绘制出牌区（中央）
     */
    drawPlayArea(game) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // 出牌区标题
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('出牌区', cx, cy - 80);

        // 绘制所有已出的牌
        if (game.playedCardsStack && game.playedCardsStack.length > 0) {
            const stack = game.playedCardsStack;
            const cardW = 50;
            const cardH = 70;
            const maxShow = 20; // 最多显示20张
            const startIdx = Math.max(0, stack.length - maxShow);

            for (let i = startIdx; i < stack.length; i++) {
                const entry = stack[i];
                const offset = (i - startIdx) * 30;
                const px = cx - 100 + offset;
                const py = cy - 30;

                // 牌背景
                const color = entry.playerId === 0 ? '#e94560' : '#4ecdc4';
                ctx.fillStyle = '#fff';
                ctx.fillRect(px, py, cardW, cardH);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(px, py, cardW, cardH);

                // 牌面
                ctx.fillStyle = color;
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(entry.card.getDisplayText(), px + cardW / 2, py + 25);

                // 玩家标记
                ctx.font = '10px Arial';
                ctx.fillText(`P${entry.playerId + 1}`, px + cardW / 2, py + cardH - 5);
            }
        }

        // 上一手信息
        if (game.lastPlay) {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`上一手: ${PokerRules.getTypeName(game.lastPlay.type)}`, cx, cy + 60);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('新一轮，任意出牌', cx, cy + 60);
        }
    }

    /**
     * 绘制单位
     */
    drawUnits(game) {
        for (const player of game.players) {
            for (const unit of player.units) {
                unit.draw(this.ctx);
            }
        }
    }

    /**
     * 绘制UI
     */
    drawUI(game) {
        const { ctx, canvas } = this;

        // 回合信息
        const cp = game.currentPlayer;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`玩家 ${cp.id + 1} 的回合`, canvas.width / 2, 30);

        // 计时器
        const timeLeft = Math.max(0, Math.ceil((game.turnDuration - game.turnTimer) / 1000));
        ctx.fillStyle = timeLeft < 10 ? '#e74c3c' : '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText(`${timeLeft}s`, canvas.width / 2, 55);

        // 操作提示
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText('左键选牌 → 出牌 | 框选单位 → 右键指挥', canvas.width / 2, canvas.height - 10);
    }

    /**
     * 绘制胜利界面
     */
    drawVictory(player) {
        const { ctx, canvas } = this;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`玩家 ${player.id + 1} 获胜！`, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('点击重新开始', canvas.width / 2, canvas.height / 2 + 50);
    }

    /**
     * 主渲染
     */
    render(game) {
        this.clear();
        this.drawTable();

        // 绘制玩家基地和手牌
        for (const player of game.players) {
            this.drawPlayerBase(player, this.canvas.width, this.canvas.height);
            this.drawHand(player, this.canvas.width, this.canvas.height);
        }

        // 绘制出牌区
        this.drawPlayArea(game);

        // 绘制单位
        this.drawUnits(game);

        // 绘制框选框
        game.inputHandler.drawSelectionBox(this.ctx);

        // 绘制UI
        this.drawUI(game);

        // 绘制胜利界面
        if (game.winner) {
            this.drawVictory(game.winner);
        }
    }
}
