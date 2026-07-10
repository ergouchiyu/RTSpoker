/**
 * 渲染器 - 使用 player.color 统一颜色
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    render(game) {
        const { ctx, canvas } = this;
        const w = canvas.width, h = canvas.height;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // 中央战场
        ctx.fillStyle = '#16213e';
        ctx.fillRect(100, 35, w - 200, h - 95);

        // 玩家基地背景
        game.players.forEach(p => this.drawBase(p, w, h));

        // 手牌
        game.players.forEach(p => this.drawHand(p));

        // 出牌区
        this.drawPlayArea(game);

        // 单位
        game.players.forEach(p => p.units.forEach(u => { if (!u.dead) u.draw(ctx); }));

        // 框选框
        game.inputHandler.drawSelectionBox(ctx);

        // 操作提示
        ctx.fillStyle = '#555';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('左键选牌→出牌 | 框选兵→右键敌方牌攻击', w/2, h - 2);
    }

    drawBase(player, w, h) {
        const { ctx } = this;
        const m = 100;
        let x, y, bw, bh;
        switch (player.side) {
            case 'bottom': x=m; y=h-m; bw=w-m*2; bh=m; break;
            case 'top':    x=m; y=0;   bw=w-m*2; bh=35; break;
            case 'left':   x=0; y=35;  bw=m; bh=h-95; break;
            case 'right':  x=w-m; y=35; bw=m; bh=h-95; break;
        }
        ctx.fillStyle = player.isCurrentTurn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y, bw, bh);
        if (player.isCurrentTurn) {
            ctx.strokeStyle = player.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, bw, bh);
        }
        ctx.fillStyle = player.color;
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = x + bw/2, cy = y + bh/2;
        if (player.side === 'top') {
            ctx.fillText(`${player.name} 牌:${player.hand.length} 补给:${Math.floor(player.supply)}`, cx, cy);
        } else if (player.side === 'bottom') {
            ctx.fillText(`${player.name} 牌:${player.hand.length} 补给:${Math.floor(player.supply)}`, cx, cy - 12);
            if (player.isCurrentTurn) { ctx.fillStyle='#2ecc71'; ctx.font='12px Arial'; ctx.fillText('你的回合', cx, cy+12); }
        } else {
            ctx.save(); ctx.translate(cx, cy);
            if (player.side==='left') ctx.rotate(-Math.PI/2); else ctx.rotate(Math.PI/2);
            ctx.fillText(`${player.name} 牌:${player.hand.length}`, 0, 0);
            ctx.restore();
        }
    }

    drawHand(player) {
        const { ctx } = this;
        const cw = CONSTANTS.CARD_WIDTH, ch = CONSTANTS.CARD_HEIGHT;
        for (const card of player.hand) {
            const x = card.x, y = card.y;
            if (card.isRevealed) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, cw, ch);
                ctx.strokeStyle = card.isSelected ? '#2ecc71' : '#666';
                ctx.lineWidth = card.isSelected ? 3 : 1;
                ctx.strokeRect(x, y, cw, ch);
                const isRed = card.suit==='♥'||card.suit==='♦';
                ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(card.rank, x+cw/2, y+ch/2-8);
                ctx.font = '16px Arial';
                ctx.fillText(card.suit, x+cw/2, y+ch/2+10);
            } else {
                ctx.fillStyle = player.color;
                ctx.fillRect(x, y, cw, ch);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cw, ch);
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🂠', x+cw/2, y+ch/2);
            }
        }
    }

    drawPlayArea(game) {
        const { ctx, canvas } = this;
        const cx = canvas.width/2, cy = canvas.height/2 - 20;
        if (!game.playedCardsStack.length) {
            ctx.fillStyle = '#444'; ctx.font = '13px Arial'; ctx.textAlign = 'center';
            ctx.fillText('出牌区', cx, cy); return;
        }
        const stack = game.playedCardsStack;
        const cw = 38, ch = 52, gap = 22, maxShow = 18;
        const start = Math.max(0, stack.length - maxShow);
        const showN = Math.min(maxShow, stack.length);
        const sx = cx - showN * gap / 2;
        for (let i = start; i < stack.length; i++) {
            const e = stack[i], off = (i-start)*gap;
            const px = sx + off, py = cy - ch/2;
            ctx.fillStyle = '#fff'; ctx.fillRect(px, py, cw, ch);
            ctx.strokeStyle = CONSTANTS.PLAYER_COLORS[e.playerId];
            ctx.lineWidth = 2; ctx.strokeRect(px, py, cw, ch);
            const isRed = e.card.suit==='♥'||e.card.suit==='♦';
            ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';
            ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(e.card.rank, px+cw/2, py+ch/2-5);
            ctx.font = '14px Arial'; ctx.fillText(e.card.suit, px+cw/2, py+ch/2+10);
        }
        if (game.lastPlay) {
            ctx.fillStyle = '#e94560'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
            ctx.fillText(`上一手: ${PokerRules.getTypeName(game.lastPlay.type)}`, cx, cy + 45);
        } else {
            ctx.fillStyle = '#2ecc71'; ctx.font = '13px Arial'; ctx.textAlign = 'center';
            ctx.fillText('新一轮，任意出牌', cx, cy + 45);
        }
    }
}
