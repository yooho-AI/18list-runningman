# Running Man：传奇赛季 — AI 综艺竞技游戏

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Pages

## 架构

```
18list-runningman/
├── worker/index.js              - ☆ CF Worker API 代理（备用，未部署）
├── public/
│   ├── audio/bgm.mp3            - 背景音乐
│   ├── characters/              - 8 角色立绘 9:16 竖版 (1152x2048)
│   └── scenes/                  - 6 场景背景 9:16 竖版 (1152x2048)
├── src/
│   ├── main.tsx                 - ☆ React 入口
│   ├── vite-env.d.ts            - Vite 类型声明
│   ├── App.tsx                  - 根组件: 三阶段开场(摄影棚灯光→成员闪切→角色选择+姓名输入) + GameScreen + EndingModal + MenuOverlay
│   ├── lib/
│   │   ├── script.md            - ★ 剧本直通：五模块原文（零转换注入 prompt）
│   │   ├── data.ts              - ★ UI 薄层：类型(含富消息扩展) + 8角色 + 6场景 + 8道具 + 3章节 + 6事件 + 8结局 + 4角色类型
│   │   ├── store.ts             - ★ 状态中枢：Zustand + 富消息插入(场景/换期) + 抽屉状态 + StoryRecord + Analytics + 双轨解析 + 链式反应
│   │   ├── parser.ts            - AI 回复解析（8角色着色 + 数值着色）
│   │   ├── analytics.ts         - Umami 埋点（rm_ 前缀）
│   │   ├── stream.ts            - ☆ SSE 流式通信
│   │   ├── bgm.ts               - ☆ 背景音乐
│   │   └── hooks.ts             - ☆ useMediaQuery / useIsMobile
│   ├── styles/
│   │   ├── globals.css          - 全局基础样式（rm- 前缀）
│   │   ├── opening.css          - 开场样式：摄影棚灯光 + 成员闪切 + 角色选择
│   │   └── rich-cards.css       - 富UI组件：场景卡 + 期变卡 + 档案卡 + NPC气泡 + DashboardDrawer + RecordSheet + SVG关系图 + Toast
│   └── components/game/
│       ├── app-shell.tsx        - 居中壳 + Header(📓+📜) + 三向手势 + Tab路由 + TabBar + DashboardDrawer + RecordSheet + Toast
│       ├── dashboard-drawer.tsx - 成员手册(左抽屉)：扉页+成员轮播+场景网格+目标+道具+属性概览。Reorder拖拽排序
│       ├── tab-dialogue.tsx     - 对话 Tab：富消息路由(SceneCard/EpisodeCard逐字打字机/NPC头像气泡) + 快捷操作 + 背包
│       ├── tab-scene.tsx        - 场景 Tab：9:16大图 + 角色标签 + 地点列表
│       └── tab-character.tsx    - 人物 Tab：立绘 + 全局属性 + 信任度 + SVG RelationGraph + 关系列表 + CharacterDossier 全屏档案
├── index.html
├── package.json
├── vite.config.ts               - ☆
├── tsconfig*.json               - ☆
└── wrangler.toml                - ☆
```

★ = 种子文件 ☆ = 零修改模板

## 核心设计

- **综艺竞技**：8位RM成员 + 4角色类型选择（能力者/脑力者/综艺人/社交达人）
- **双轨数值**：4全局属性（体力/智商/综艺感/积分）+ 每角色独立信任度(-100~+100)
- **暗金主题**：深色底(#0d1117)+金黄(#FFB800)，rm- CSS 前缀
- **3时段制**：每期3时段（上午/下午/晚上），15期共45时间槽
- **剧本直通**：script.md 存五模块原文，?raw import 注入 prompt
- **8结局**：BE×2 + TE×2 + HE×2 + SE×1 + NE×1，优先级 BE→TE→HE→SE→NE
- **链式反应**：金钟国信任≥60 → 能力者同盟，刘在石信任≥70 → 综艺感+5，等

## 富UI组件系统

| 组件 | 位置 | 触发 | 视觉风格 |
|------|------|------|----------|
| SpotlightLogo | App.tsx | 开场Phase1 | 摄影棚灯光+扫射光+星光粒子+弹跳LOGO+shimmer CTA |
| MemberMontage | App.tsx | 开场Phase2 | 8角色立绘顺序闪现(1.8s/人)，交替左右滑入 |
| RoleSelection | App.tsx | 开场Phase3 | 2×2角色类型卡片+属性预览pill+姓名输入 |
| DashboardDrawer | dashboard-drawer | Header📓+右滑手势 | 左侧滑入：扉页网格+成员轮播+场景网格+目标checklist+道具pill+属性排名 |
| RecordSheet | app-shell | Header📜+左滑手势 | 右侧滑入事件记录：时间线倒序+金色圆点 |
| SceneTransitionCard | tab-dialogue | selectScene | 场景背景+Ken Burns(8s)+渐变遮罩+金色角标 |
| EpisodeCard | tab-dialogue | 换期 | 渐变条纹+弹簧落入+逐字打字机(80ms)+章节名 |
| RelationGraph | tab-character | 始终可见 | SVG环形布局，中心🏃+8NPC立绘节点+连线+信任值标签 |
| CharacterDossier | tab-character | 点击角色 | 全屏右滑入+50vh立绘呼吸动画+信任阶段+触发暗示 |
| Toast | app-shell | saveGame | TabBar上方弹出2s消失 |

## 三向手势导航

- **右滑**（任意主Tab内容区）→ 左侧成员手册
- **左滑**（任意主Tab内容区）→ 右侧事件记录
- Header 按钮（📓/📜）同等触发
- 手册内组件支持拖拽排序（Reorder + localStorage `rm-dash-order` 持久化）

## 富消息机制

Message 类型扩展 `type` 字段路由渲染：
- `scene-transition` → SceneTransitionCard（selectScene 触发）
- `episode-change` → EpisodeCard（advanceTime 换期时触发）
- NPC 消息带 `character` 字段 → 28px 圆形立绘头像

## Analytics 集成

- `trackGameStart` / `trackPlayerCreate` → App.tsx 开场
- `trackGameContinue` → App.tsx 继续游戏
- `trackTimeAdvance` / `trackChapterEnter` → store.ts advanceTime
- `trackEndingReached` → store.ts checkEnding
- `trackBetrayalAttempt` → store.ts sendMessage
- `trackSceneUnlock` / `trackAllianceFormed` → store.ts

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
