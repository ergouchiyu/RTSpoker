/**
 * 渲染器 - 修复牌显示 + 降低经济
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

    drawTable() {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;
        const margin = 180;

        // 中央战场
        ctx.fillStyle = '#16213e';
        ctx.fillRect(margin, margin, w - margin * 2, h - margin * 2);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

        // 四个玩家区域
        ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
        ctx.fillRect(0, 0, w, margin);
        ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
        ctx.fillRect(0, h - margin, w, margin);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.fillRect(0, margin, margin, h - margin * 2);
        ctx.fillStyle = 'rgba(155, 89, 182, 0.1)';
        ctx.fillRect(w - margin, margin, margin, h - margin * 2);
    }

    drawPlayerBase(player) {
        const { ctx, canvas } = this;
        const margin = 180;
        let x, y, w, h;

        switch (player.side) {
            case 'bottom':
                x = margin; y = canvas.height - margin;
                w = canvas.width - margin * 2; h = margin;
                break;
            case 'top':
                x = margin; y = 0;
                w = canvas.width - margin * 2; h = margin;
                break;
            case 'left':
                x = 0; y = margin;
                w = margin; h = canvas.height - margin * 2;
                break;
            case 'right':
                x = canvas.width - margin; y = margin;
                w = margin; h = canvas.height - margin * 2;
                break;
        }

        const color = player.id === 0 ? '#e94560' : 
                      player.id === 1 ? '#4ecdc4' : 
                      player.id === 2 ? '#3498db' : '#9b59b6';
        
        // 背景
        ctx.fillStyle = player.isCurrentTurn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
        ctx.fillRect(x, y, w, h);
        
        // 边框
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

        ctx.fillText(`玩家 ${player.id + 1}`, cx, cy - 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`补给: ${Math.floor(player.supply)}`, cx, cy);
        ctx.fillText(`手牌: ${player.hand.length}`, cx, cy + 20);

        if (player.isCurrentTurn) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('当前回合', cx, cy - 50);
        }
    }

    /**
     * 绘制手牌 - 这是关键！
     */
    drawPlayerHand(player) {
        const { ctx } = this;
        const cardW = 45;
        const cardH = 65;
        const gap = 6;
        const total = player.hand.length * (cardW + gap) - gap;

        let startX, startY;

        switch (player.side) {
            case 'bottom':
                startX = (this.canvas.width - total) / 2;
                startY = this.canvas.height - cardH - 15;
                break;
            case 'top':
                startX = (this.canvas.width - total) / 2;
                startY = 15;
                break;
            case 'left':
                startX = 15;
                startY = (this.canvas.height - total) / 2;
                break;
            case 'right':
                startX = this.canvas.width - cardW - 15;
                startY = (this.canvas.height - total) / 2;
                break;
        }

        for (let i = 0; i < player.hand.length; i++) {
            const card = player.hand[i];
            
            // 设置位置
            if (player.side === 'left' || player.side === 'right') {
                card.targetX = startX;
                card.targetY = startY + i * (cardW + gap);
            } else {
                card.targetX = startX + i * (cardW + gap);
                card.targetY = startY;
            }
            
            // 底部玩家看正面，其他看背面
            card.isRevealed = (player.side === 'bottom');
            
            // 绘制牌
            this.drawCard(card);
        }
    }

    /**
     * 绘制单张牌
     */
    drawCard(card) {
        const { ctx } = this;
        const cardW = 45;
        const cardH = 65;
        const x = card.x;
        const y = card.y;

        if (card.isRevealed) {
            // 正面
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, cardW, cardH);
            
            ctx.strokeStyle = card.isSelected ? '#2ecc71' : '#333';
            ctx.lineWidth = card.isSelected ? 3 : 1;
            ctx.strokeRect(x, y, cardW, cardH);

            const isRed = card.suit === '♥' || card.suit === '♦';
            ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.rank, x + cardW / 2, y + cardH / 2 - 8);
            ctx.font = '16px Arial';
            ctx.fillText(card.suit, x + cardW / 2, y + cardH / 2 + 10);
        } else {
            // 背面
            ctx.fillStyle = '#e94560';
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cardW, cardH);
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🂠', x + cardW / 2, y + cardH / 2);
        }

        // 选中高亮
        if (card.isSelected) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 2, y - 2, cardW + 4, cardH + 4);
        }
    }

    drawPlayArea(game) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // 出牌区标题
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('出牌区', cx, cy - 90);

        // 绘制已出的牌
        if (game.playedCardsStack && game.playedCardsStack.length > 0) {
            const stack = game.playedCardsStack;
            const cardW = 40;
            const cardH = 55;
            const maxShow = 15;
            const startIdx = Math.max(0, stack.length - maxShow);
            const gap = 25;

            for (let i = startIdx; i < stack.length; i++) {
                const entry = stack[i];
                const offset = (i - startIdx) * gap;
                const px = cx - (Math.min(maxShow, stack.length) * gap / 2) + offset;
                const py = cy - cardH / 2;

                // 牌背景
                ctx.fillStyle = '#fff';
                ctx.fillRect(px, py, cardW, cardH);
                
                const color = entry.playerId === 0 ? '#e94560' : '#4ecdc4';
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(px, py, cardW, cardH);

                // 牌面
                ctx.fillStyle = color;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entry.card.rank, px + cardW / 2, py + cardH / 2 - 6);
                ctx.font = '12px Arial';
                ctx.fillText(entry.card.suit, px + cardW / 2, py + cardH / 2 + 10);
            }
        }

        // 上一手信息
        if (game.lastPlay) {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`上一手: ${PokerRules.getTypeName(game.lastPlay.type)}`, cx, cy + 50);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('新一轮，任意出牌', cx, cy + 50);
        }
    }

    drawUnits(game) {
        for (const player of game.players) {
            for (const unit of player.units) {
                if (!unit.dead) unit.draw(this.ctx);
            }
        }
    }

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
    }

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

    render(game) {
        this.clear();
        this.drawTable();

        // 绘制玩家基地
        for (const player of game.players) {
            this.drawPlayerBase(player);
        }

        // 绘制手牌
        for (const player of game.players) {
            this.drawPlayerHand(player);
        }

        // 绘制出牌区
        this.drawPlayArea(game);

        // 绘制单位
        this.drawUnits(game);

        // 框选框
        game.inputHandler.drawSelectionBox(this.ctx);

        // UI
        this.drawUI(game);

        // 胜利
        if (game.winner) this.drawVictory(game.winner);
    }
}
