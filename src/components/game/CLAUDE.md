# 组件层 CLAUDE.md

## 组件职责

### app-shell.tsx
- 唯一布局入口，桌面430px居中壳 + 移动端全屏
- Header: 📓成员手册 + 时间显示 + 章节 + BGM + 菜单 + 📜记录
- TabContent: AnimatePresence mode="wait" 切换三个Tab
- TabBar: 3按钮(场景/对话/人物) + 发光指示器 + safe-area
- 三向手势: touchStart/touchEnd, dx>60px + dy<1.5x
- RecordSheet: 内联右侧滑入组件，倒序时间线

### dashboard-drawer.tsx
- 左侧滑入信息抽屉 (85vw max 380px)
- 固定头部 FrontPage: 2×2网格(期数/时段/章节/积分)
- Reorder.Group 拖拽排序，5段: members/scenes/objectives/inventory/ranking
- 成员轮播: AnimatePresence + 方向变体 + 触摸滑动 + 分页点
- 排序持久化: localStorage `rm-dash-order`

### tab-dialogue.tsx
- 富消息路由: type优先(scene-transition/episode-change) → role(system/user/assistant)
- NPC气泡: 左侧28px圆形立绘头像 + charColor左边框
- 快捷操作: 2×2网格，4个预设动作
- 输入区: 背包按钮 + 输入框 + 发送按钮
- InventorySheet: 底部弹出背包面板
- LetterCard: 首次进入时的游戏介绍

### tab-scene.tsx
- SceneHero: 9:16大图 + 渐变遮罩 + 场景信息
- 成员标签: 2列网格，点击 → selectCharacter + 切character Tab
- 场景列表: 2列网格，locked/unlocked/current状态

### tab-character.tsx
- PortraitHero: 9:16立绘 + 渐变遮罩 + 角色信息
- 全局属性条: GLOBAL_STAT_METAS 驱动
- 当前角色信任度条
- SVG RelationGraph: 环形布局，中心"我" + 8NPC节点 + 连线 + 信任值
- 关系列表: 全部成员卡片，头像+信任信息
- CharacterDossier: 全屏右滑入，50vh呼吸立绘 + 标签 + 信任度 + 性格 + 说话风格 + 触发暗示

## 数据流

```
store.ts (useGameStore)
  ├→ App.tsx (gameStarted, endingType, resetGame, clearSave)
  ├→ app-shell.tsx (activeTab, showDashboard, showRecords, currentEpisode)
  ├→ dashboard-drawer.tsx (characters, characterStats, globalStats, inventory)
  ├→ tab-dialogue.tsx (messages, isTyping, streamingContent, sendMessage)
  ├→ tab-scene.tsx (currentScene, unlockedScenes, selectScene)
  └→ tab-character.tsx (characters, characterStats, globalStats, selectCharacter)
```

## 关键模式

- CSS前缀: `const P = 'rm'`，所有className用模板字面量
- 动画: Framer Motion，spring物理 + AnimatePresence
- 覆层: 两层结构(backdrop onClick=onClose + content stopPropagation)
- 丰富消息: Message.type 字段优先路由，无type则按role
- 资源渲染: portrait字段直接 `<img src={char.portrait}>`
