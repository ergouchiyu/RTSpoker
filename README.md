# Card RTS - 四幺四扑克 × 实时策略

**一边打扑克，一边实时派兵偷袭对方的手牌**

## 项目简介

Card RTS 是一款创新的混合类型游戏，将四幺四扑克与实时策略（RTS）完美结合。

### 核心玩法

- **手牌产资源** - 每张扑克牌持续产生补给
- **出牌推进胜利** - 目标是最先出完所有牌
- **派兵骚扰** - 用步兵攻击对手的牌，降低完整度

### 四幺四规则

- 可出：单张、对子、三条、顺子、炸弹
- 必须比上家大，且牌型相同
- 第一轮必须出牌
- 所有人不要则新一轮

---

## 开发环境

### 引擎

- **Godot 4.x** (Standard 版本，不需要 .NET)
- **语言：** GDScript

### 安装

1. 下载 Godot 4: https://godotengine.org/download/windows
2. 解压到任意目录
3. 运行 Godot.exe

### 导入项目

1. 打开 Godot
2. 点击 "导入"
3. 选择 `godot-project/project.godot`
4. 点击 "导入并编辑"

### 运行

按 `F5` 或点击右上角 ▶ 按钮

---

## 项目结构

```
godot-project/
├── project.godot          # 项目配置
├── scenes/
│   └── Main.tscn          # 主场景
└── scripts/
    ├── game_const.gd      # 常量（颜色、数值）
    ├── card.gd            # 扑克牌类
    ├── unit.gd            # 单位类
    ├── game_manager.gd    # 游戏逻辑
    └── main.gd            # 渲染和输入
```

---

## 核心设计

### 阵营系统

```gdscript
# 每个玩家创建时绑定，不可变
Player(0) → color: RED    → side: bottom
Player(1) → color: CYAN   → side: top
```

### 单位归属

```gdscript
# 单位创建时绑定 owner_id，不可变
func _init(oid: int, utype: String, pos: Vector2):
    owner_id = oid  # 绑定，不可变
```

### 选择限制

```gdscript
# 框选只选自己的单位
func select_units_in_rect(rect: Rect2):
    var cp := get_current_player()
    for unit in cp.units:  # 只遍历自己的单位
        if rect.has_point(unit.position):
            unit.is_selected = true
```

### 回合管理

```gdscript
# 切换回合时清除所有选中
func _start_turn():
    _clear_selection()  # 清除牌和单位的选中状态
```

---

## 操作说明

| 操作 | 说明 |
|------|------|
| **左键点击手牌** | 选中/取消选中 |
| **点击"出牌"按钮** | 打出选中的牌 |
| **点击"不要"按钮** | 跳过本回合 |
| **左键拖拽** | 框选己方单位 |
| **右键敌方牌** | 指挥单位攻击 |
| **右键空地** | 移动单位 |

---

## 开发计划

### Phase 0：核心玩法（当前）

- [x] 扑克牌系统
- [x] 出牌规则
- [x] 单位系统
- [x] 回合制
- [ ] 单位攻击
- [ ] 胜利条件

### Phase 1：完善系统

- [ ] 工程师（偷牌）
- [ ] 维修系统
- [ ] AI 对手
- [ ] 数值平衡

### Phase 2：多人联机

- [ ] 网络架构
- [ ] 房间系统
- [ ] 匹配系统

### Phase 3：内容扩展

- [ ] 新兵种
- [ ] 道具系统
- [ ] 多种扑克规则

---

## 历史版本

旧版 HTML 原型在 `archive/html-prototype/` 目录中。

---

## 许可证

MIT License
