/**
 * 渲染器 - 简化版，UI用HTML，Canvas只画游戏内容
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

    render(game) {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;

        // 清屏
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // 中央战场
        ctx.fillStyle = '#16213e';
        ctx.fillRect(120, 40, w - 240, h - 100);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(120, 40, w - 240, h - 100);

        // 玩家基地背景
        for (const p of game.players) {
            this.drawBase(p, w, h);
        }

        // 手牌（每个玩家）
        for (const p of game.players) {
            this.drawHand(p);
        }

        // 出牌区
        this.drawPlayArea(game);

        // 单位
        for (const p of game.players) {
            for (const u of p.units) {
                if (!u.dead) u.draw(ctx);
            }
        }

        // 框选框
        game.inputHandler.drawSelectionBox(ctx);

        // 操作提示
        ctx.fillStyle = '#555';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('左键选牌→出牌 | 框选兵→右键敌方牌攻击', w / 2, h - 2);
    }

    drawBase(player, w, h) {
        const { ctx } = this;
        const margin = 120;
        let x, y, bw, bh;

        switch (player.side) {
            case 'bottom':
                x = margin; y = h - margin + 10;
                bw = w - margin * 2; bh = margin - 10;
                break;
            case 'top':
                x = margin; y = 0;
                bw = w - margin * 2; bh = 40;
                break;
            case 'left':
                x = 0; y = 40;
                bw = margin; bh = h - 100;
                break;
            case 'right':
                x = w - margin; y = 40;
                bw = margin; bh = h - 100;
                break;
        }

        const color = player.id === 0 ? '#e94560' : '#4ecdc4';
        ctx.fillStyle = player.isCurrentTurn ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y, bw, bh);

        if (player.isCurrentTurn) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, bw, bh);
        }

        // 玩家名和信息
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = x + bw / 2;
        const cy = y + bh / 2;

        if (player.side === 'top') {
            ctx.fillText(`P${player.id+1} | 补给:${Math.floor(player.supply)} | 牌:${player.hand.length}`, cx, cy);
        } else if (player.side === 'bottom') {
            ctx.fillText(`P${player.id+1} | 补给:${Math.floor(player.supply)} | 牌:${player.hand.length}`, cx, cy - 15);
            if (player.isCurrentTurn) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = '12px Arial';
                ctx.fillText('你的回合', cx, cy + 10);
            }
        } else {
            ctx.save();
            ctx.translate(cx, cy);
            if (player.side === 'left') ctx.rotate(-Math.PI / 2);
            else ctx.rotate(Math.PI / 2);
            ctx.fillText(`P${player.id+1} 牌:${player.hand.length}`, 0, 0);
            ctx.restore();
        }
    }

    drawHand(player) {
        const { ctx } = this;
        const cardW = CONSTANTS.CARD_WIDTH;
        const cardH = CONSTANTS.CARD_HEIGHT;

        for (const card of player.hand) {
            const x = card.x;
            const y = card.y;

            if (card.isRevealed) {
                // 正面
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, cardW, cardH);
                ctx.strokeStyle = card.isSelected ? '#2ecc71' : '#666';
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

                if (card.isSelected) {
                    ctx.strokeStyle = '#2ecc71';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x - 2, y - 2, cardW + 4, cardH + 4);
                }
            } else {
                // 背面
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(x, y, cardW, cardH);
                ctx.strokeStyle = '#922b21';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cardW, cardH);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(x + 5, y + 5, cardW - 10, cardH - 10);
            }
        }
    }

    drawPlayArea(game) {
        const { ctx, canvas } = this;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - 20;

        if (!game.playedCardsStack || game.playedCardsStack.length === 0) {
            ctx.fillStyle = '#444';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('出牌区', cx, cy);
            return;
        }

        const stack = game.playedCardsStack;
        const cardW = 38;
        const cardH = 52;
        const gap = 22;
        const maxShow = 18;
        const startIdx = Math.max(0, stack.length - maxShow);
        const showCount = Math.min(maxShow, stack.length);
        const totalW = showCount * gap;
        const startX = cx - totalW / 2;

        for (let i = startIdx; i < stack.length; i++) {
            const entry = stack[i];
            const offset = (i - startIdx) * gap;
            const px = startX + offset;
            const py = cy - cardH / 2;

            ctx.fillStyle = '#fff';
            ctx.fillRect(px, py, cardW, cardH);
            const color = entry.playerId === 0 ? '#e94560' : '#4ecdc4';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, cardW, cardH);

            const isRed = entry.card.suit === '♥' || entry.card.suit === '♦';
            ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entry.card.rank, px + cardW / 2, py + cardH / 2 - 5);
            ctx.font = '14px Arial';
            ctx.fillText(entry.card.suit, px + cardW / 2, py + cardH / 2 + 10);
        }

        // 上一手提示
        if (game.lastPlay) {
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`上一手: ${PokerRules.getTypeName(game.lastPlay.type)}`, cx, cy + 45);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('新一轮，任意出牌', cx, cy + 45);
        }
    }
}
