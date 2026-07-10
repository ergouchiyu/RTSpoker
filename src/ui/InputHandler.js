/**
 * 输入处理器 - 修复：只能选自己兵、右键攻击
 */
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isSelecting = false;
        this.selectStart = { x: 0, y: 0 };
        this.selectEnd = { x: 0, y: 0 };
        this.selectedUnits = [];
        this.bindEvents();
    }

    getMousePos(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.onRightClick(e); });
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        if (this.game.winner) { this.game.restart(); return; }
        const pos = this.getMousePos(e);
        this.isSelecting = true;
        this.selectStart = { ...pos };
        this.selectEnd = { ...pos };
    }

    onMouseMove(e) {
        if (this.isSelecting) this.selectEnd = this.getMousePos(e);
    }

    onMouseUp(e) {
        if (e.button !== 0 || !this.isSelecting) return;
        this.isSelecting = false;
        const pos = this.getMousePos(e);
        const dx = Math.abs(pos.x - this.selectStart.x);
        const dy = Math.abs(pos.y - this.selectStart.y);

        if (dx < 5 && dy < 5) {
            this.handleClick(pos);
        } else {
            this.handleBoxSelect();
        }
    }

    /** 单击：选中/取消手牌 */
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
        // 点空地取消选牌
        cp.deselectAll();
        this.game.updateUI();
    }

    /** 框选：只能选自己的单位 */
    handleBoxSelect() {
        const cp = this.game.currentPlayer;
        const rx = Math.min(this.selectStart.x, this.selectEnd.x);
        const ry = Math.min(this.selectStart.y, this.selectEnd.y);
        const rw = Math.abs(this.selectEnd.x - this.selectStart.x);
        const rh = Math.abs(this.selectEnd.y - this.selectStart.y);

        // 先清除所有选中
        for (const u of this.selectedUnits) u.isSelected = false;
        this.selectedUnits = [];

        // 只选自己的单位
        for (const u of cp.units) {
            if (!u.dead && Helpers.pointInRect(u.x, u.y, rx, ry, rw, rh)) {
                this.selectedUnits.push(u);
                u.isSelected = true;
            }
        }
        console.log(`Selected ${this.selectedUnits.length} own units`);
    }

    /** 右键：指挥选中单位 */
    onRightClick(e) {
        const pos = this.getMousePos(e);
        if (this.selectedUnits.length === 0) {
            console.log('No units selected');
            return;
        }

        const cp = this.game.currentPlayer;

        // 检查是否右键了敌方的牌
        for (const player of this.game.players) {
            if (player === cp) continue; // 跳过自己
            for (const card of player.hand) {
                if (card.containsPoint(pos.x, pos.y)) {
                    // 指挥单位攻击这张牌
                    for (const u of this.selectedUnits) {
                        u.attackTarget(card);
                    }
                    console.log(`Commanding ${this.selectedUnits.length} units to attack card ${card.getDisplayText()}`);
                    this.game.showMsg(`攻击 ${card.getDisplayText()}!`);
                    return;
                }
            }
        }

        // 没点牌，移动到该位置
        const spacing = 25;
        for (let i = 0; i < this.selectedUnits.length; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            this.selectedUnits[i].moveTo(
                pos.x + (col - 2) * spacing,
                pos.y + row * spacing
            );
        }
        console.log(`Moving ${this.selectedUnits.length} units`);
    }

    /** 绘制框选框 */
    drawSelectionBox(ctx) {
        if (!this.isSelecting) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            this.selectStart.x, this.selectStart.y,
            this.selectEnd.x - this.selectStart.x,
            this.selectEnd.y - this.selectStart.y
        );
        ctx.setLineDash([]);
    }
}
