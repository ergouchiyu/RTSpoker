/**
 * 输入处理器
 */
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }
    
    /**
     * 处理点击
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 如果游戏结束，重新开始
        if (this.game.winner) {
            this.game.restart();
            return;
        }
        
        // 检查是否点击了手牌
        this.handleCardClick(x, y);
        
        // 检查是否点击了单位
        this.handleUnitClick(x, y);
    }
    
    /**
     * 处理右键点击
     */
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 取消选中
        this.game.currentPlayer.deselectAll();
    }
    
    /**
     * 处理牌点击
     */
    handleCardClick(x, y) {
        const currentPlayer = this.game.currentPlayer;
        
        for (const card of currentPlayer.hand) {
            if (card.containsPoint(x, y)) {
                // 选中/取消选中
                card.isSelected = !card.isSelected;
                
                // 如果选中，检查是否可以出牌
                if (card.isSelected) {
                    this.checkPlayCards();
                }
                
                break;
            }
        }
    }
    
    /**
     * 处理单位点击
     */
    handleUnitClick(x, y) {
        const currentPlayer = this.game.currentPlayer;
        
        for (const unit of currentPlayer.units) {
            if (unit.containsPoint(x, y)) {
                // 选中单位
                this.game.selectedUnit = unit;
                break;
            }
        }
    }
    
    /**
     * 检查是否可以出牌
     */
    checkPlayCards() {
        const currentPlayer = this.game.currentPlayer;
        const selectedCards = currentPlayer.getSelectedCards();
        
        // 这里可以添加出牌规则检查
        // 目前简化为单张出牌
        if (selectedCards.length === 1) {
            this.game.playCards(selectedCards);
        }
    }
}
