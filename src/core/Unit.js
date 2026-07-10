/**
 * 单位类
 */
class Unit {
    constructor(type, owner, x, y) {
        this.id = Helpers.generateId();
        this.type = type;
        this.owner = owner;
        
        // 从配置获取属性
        const config = CONSTANTS.UNITS[type.toUpperCase()];
        this.name = config.name;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.attack = config.attack;
        this.speed = config.speed;
        this.size = config.size;
        
        // 位置
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        
        // 目标
        this.target = null; // 目标牌或单位
        this.state = 'idle'; // idle, moving, attacking, stealing
        
        // 动画
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    /**
     * 设置移动目标
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.state = 'moving';
    }
    
    /**
     * 设置攻击目标
     */
    attackTarget(target) {
        this.target = target;
        this.state = 'moving';
    }
    
    /**
     * 获取是否是工程师
     */
    isEngineer() {
        this.type === 'engineer';
    }
    
    /**
     * 更新
     */
    update(deltaTime) {
        // 动画更新
        this.animTimer += deltaTime;
        if (this.animTimer > 500) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
        
        // 状态机
        switch (this.state) {
            case 'idle':
                // 闲逛
                break;
                
            case 'moving':
                this.updateMoving(deltaTime);
                break;
                
            case 'attacking':
                this.updateAttacking(deltaTime);
                break;
                
            case 'stealing':
                this.updateStealing(deltaTime);
                break;
        }
    }
    
    /**
     * 更新移动状态
     */
    updateMoving(deltaTime) {
        // 如果有攻击目标，移动到目标位置
        if (this.target) {
            this.targetX = this.target.x + CONSTANTS.CARD_WIDTH / 2;
            this.targetY = this.target.y + CONSTANTS.CARD_HEIGHT / 2;
        }
        
        // 计算方向
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
            // 到达目标
            this.x = this.targetX;
            this.y = this.targetY;
            
            // 如果有攻击目标，开始攻击
            if (this.target) {
                if (this.type === 'engineer' && this.canSteal(this.target)) {
                    this.state = 'stealing';
                } else {
                    this.state = 'attacking';
                }
            } else {
                this.state = 'idle';
            }
        } else {
            // 移动
            const moveX = (dx / dist) * this.speed;
            const moveY = (dy / dist) * this.speed;
            this.x += moveX;
            this.y += moveY;
        }
    }
    
    /**
     * 更新攻击状态
     */
    updateAttacking(deltaTime) {
        if (!this.target || this.target.hp <= 0) {
            this.target = null;
            this.state = 'idle';
            return;
        }
        
        // 攻击
        this.target.takeDamage(this.attack * deltaTime / 1000);
    }
    
    /**
     * 更新偷取状态
     */
    updateStealing(deltaTime) {
        if (!this.target || this.target.hp <= 0) {
            this.target = null;
            this.state = 'idle';
            return;
        }
        
        // 工程师偷取牌
        // 这里简化处理：直接将牌转移到自己手中
        this.stealCard(this.target);
    }
    
    /**
     * 检查是否可以偷取
     */
    canSteal(card) {
        return card.getHpPercent() <= CONSTANTS.UNITS.ENGINEER.stealThreshold;
    }
    
    /**
     * 偷取牌
     */
    stealCard(card) {
        // 从原主人手中移除
        const originalOwner = card.owner;
        const index = originalOwner.hand.indexOf(card);
        if (index !== -1) {
            originalOwner.hand.splice(index, 1);
        }
        
        // 转移到自己主人手中
        card.owner = this.owner;
        card.hp = card.maxHp; // 恢复完整度
        this.owner.hand.push(card);
        
        // 销毁工程师
        this.hp = 0;
        
        if (typeof Game !== 'undefined') {
            Game.onUnitDestroyed(this);
        }
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.onDestroy();
        }
    }
    
    /**
     * 销毁时调用
     */
    onDestroy() {
        if (typeof Game !== 'undefined') {
            Game.onUnitDestroyed(this);
        }
    }
    
    /**
     * 绘制
     */
    draw(ctx) {
        ctx.save();
        
        // 绘制单位
        const color = this.owner.id === 0 ? CONSTANTS.COLORS.PLAYER1 : CONSTANTS.COLORS.PLAYER2;
        ctx.fillStyle = color;
        
        // 根据类型绘制不同形状
        if (this.type === 'infantry') {
            this.drawInfantry(ctx);
        } else if (this.type === 'engineer') {
            this.drawEngineer(ctx);
        }
        
        // 绘制血条
        if (this.hp < this.maxHp) {
            this.drawHpBar(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制步兵
     */
    drawInfantry(ctx) {
        const color = this.owner.id === 0 ? CONSTANTS.COLORS.PLAYER1 : CONSTANTS.COLORS.PLAYER2;
        
        // 身体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 头盔
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.3, this.size * 0.6, Math.PI, 0);
        ctx.fill();
        
        // 武器
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + this.size, this.y);
        ctx.lineTo(this.x + this.size + 10, this.y - 5);
        ctx.stroke();
    }
    
    /**
     * 绘制工程师
     */
    drawEngineer(ctx) {
        const color = this.owner.id === 0 ? CONSTANTS.COLORS.PLAYER1 : CONSTANTS.COLORS.PLAYER2;
        
        // 身体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 安全帽
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.5, this.size * 0.7, Math.PI, 0);
        ctx.fill();
        
        // 工具
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(this.x + this.size - 2, this.y - 5, 12, 4);
        ctx.fillRect(this.x + this.size + 8, this.y - 8, 4, 10);
    }
    
    /**
     * 绘制血条
     */
    drawHpBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 8;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? CONSTANTS.COLORS.HP_GREEN : CONSTANTS.COLORS.HP_RED;
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
    
    /**
     * 检查点击
     */
    containsPoint(px, py) {
        return Helpers.distance(px, py, this.x, this.y) <= this.size;
    }
}
