/**
 * 输入处理器 - 严格限制只能操作自己的单位
 */
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isSelecting = false;
        this.selectStart = {x:0,y:0};
        this.selectEnd = {x:0,y:0};
        this.selectedUnits = [];  // 当前选中的单位（只可能是当前玩家的）
        this.bindEvents();
    }

    getMousePos(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', e => { if (e.button===0) this.onLeftDown(e); });
        this.canvas.addEventListener('mousemove', e => this.onMove(e));
        this.canvas.addEventListener('mouseup', e => { if (e.button===0) this.onLeftUp(e); });
        this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this.onRightClick(e); });
    }

    /** 清除所有选中状态 */
    clearSelection() {
        this.selectedUnits.forEach(u => u.isSelected = false);
        this.selectedUnits = [];
    }

    onLeftDown(e) {
        if (this.game.winner) { this.game.restart(); return; }
        const pos = this.getMousePos(e);
        this.isSelecting = true;
        this.selectStart = {...pos};
        this.selectEnd = {...pos};
    }

    onMove(e) {
        if (this.isSelecting) this.selectEnd = this.getMousePos(e);
    }

    onLeftUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        const pos = this.getMousePos(e);
        const dx = Math.abs(pos.x - this.selectStart.x);
        const dy = Math.abs(pos.y - this.selectStart.y);
        if (dx < 5 && dy < 5) this.handleClick(pos);
        else this.handleBoxSelect();
    }

    /** 点击：选中/取消手牌 */
    handleClick(pos) {
        const cp = this.game.currentPlayer;
        if (!cp.isCurrentTurn) return;
        for (const card of cp.hand) {
            if (card.containsPoint(pos.x, pos.y)) {
                card.isSelected = !card.isSelected;
                this.game.updateUI();
                return;
            }
        }
        cp.deselectAll();
        this.game.updateUI();
    }

    /** 框选：只选自己的单位 */
    handleBoxSelect() {
        const cp = this.game.currentPlayer;
        this.clearSelection();

        const rx = Math.min(this.selectStart.x, this.selectEnd.x);
        const ry = Math.min(this.selectStart.y, this.selectEnd.y);
        const rw = Math.abs(this.selectEnd.x - this.selectStart.x);
        const rh = Math.abs(this.selectEnd.y - this.selectStart.y);

        // 只遍历当前玩家的单位
        for (const u of cp.units) {
            if (!u.dead && Helpers.pointInRect(u.x, u.y, rx, ry, rw, rh)) {
                this.selectedUnits.push(u);
                u.isSelected = true;
            }
        }
    }

    /** 右键：指挥选中的单位 */
    onRightClick(e) {
        const pos = this.getMousePos(e);
        if (this.selectedUnits.length === 0) return;

        const cp = this.game.currentPlayer;

        // 检查是否点了敌方的牌
        for (const player of this.game.players) {
            if (player.id === cp.id) continue;  // 跳过自己
            for (const card of player.hand) {
                if (card.containsPoint(pos.x, pos.y)) {
                    this.selectedUnits.forEach(u => u.attackTarget(card));
                    this.game.showMsg(`攻击 ${card.getDisplayText()}!`);
                    return;
                }
            }
        }

        // 移动到空地
        const spacing = 25;
        this.selectedUnits.forEach((u, i) => {
            u.moveTo(pos.x + (i % 5 - 2) * spacing, pos.y + Math.floor(i / 5) * spacing);
        });
    }

    /** 绘制框选框 */
    drawSelectionBox(ctx) {
        if (!this.isSelecting) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4,4]);
        ctx.strokeRect(
            this.selectStart.x, this.selectStart.y,
            this.selectEnd.x - this.selectStart.x,
            this.selectEnd.y - this.selectStart.y
        );
        ctx.setLineDash([]);
    }
}
