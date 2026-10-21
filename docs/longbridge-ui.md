---
name: longbridge-ui
description: 用长桥（Longbridge）风格改造 ruoyi-option-web 页面 UI 时使用。包含设计变量、组件规范、页面映射、响应式规则、改造流程与验收清单。只改样式与布局，不改接口、业务逻辑与权限逻辑。
---

# 长桥风格 UI 规范与改造 Skill（longbridge-ui）

> 参考站点：<https://longbridge.com/hk/zh-CN>（仅观察首页，桌面 + 手机）。
> 适用项目：ruoyi-option-web（Vue 3 + Vite + Element Plus 2.13）。
> 本文件既是**风格规范文档**，也是给 AI / 开发者执行改造时使用的 **Skill**。

---

## 0. 用法

| 场景 | 做法 |
| --- | --- |
| 让 AI 改某一页 | 提示词中点名：「按 `docs/longbridge-ui.md` 改造 今日 页」 |
| 让 AI 自动加载 | 复制到 `.claude/skills/longbridge-ui/SKILL.md`（frontmatter 已就绪），描述命中“长桥风格 / UI 改造”时自动加载 |
| 人工开发 | 先读第 1–3 节（原则与变量），再按第 5 节页面映射、第 7 节流程执行 |
| 新增规则 | 追加到第 9 节「迭代记录」，并同步修改对应章节 |

---

## 1. 设计原则与禁止项

### 1.1 原则
1. **只借鉴风格，不搬素材**：借鉴配色、字号层级、圆角、留白、毛玻璃、胶囊按钮、深浅区块交替等视觉语言。
2. **只改样式与布局**：不改接口调用、数据结构、路由、业务逻辑、权限判断（`features` / 角色控制）。
3. **功能保留**：W1–W8 已上线功能（如 W3/W4 的提示条、盘后标签、W7 “暂未开放”占位等）必须完整保留，只调整其外观。
4. **信息优先**：本项目是数据型工具，长桥的营销式大留白要“收敛”使用——Hero/页头可大气，数据区保持紧凑可读。
5. **一致性**：所有颜色、字号、圆角、阴影使用第 3 节变量，不写魔法值。

### 1.2 禁止项（不可复刻 / 不得使用）
- 长桥 Logo、品牌名、"LB CJK Quote" 等自有字体。
- 首屏视频、3D 渲染图标/插画、产品截图、奖项与第三方 Logo。
- 牌照 / 合规 / 免责声明原文、联系方式、社交账号。
- 行情、AI、资讯等数据不得抓取长桥，需接本项目自有接口。
- 视频 / 3D 效果仅允许用 CSS 渐变、SVG、（可选）Lottie 做**近似**。

---

## 2. 长桥视觉特征速览

- **配色**：近黑文字 + 白 / 浅灰背景，深色 Hero 区，青绿色（#00B8B8 / #00F0C4）作为唯一强调色。
- **字体层级**：超大粗标题（48px/700，行高 1）+ 16/14px 灰色正文，对比强烈。
- **形状**：按钮全部胶囊（radius 9999px），图标按钮为正圆，卡片 16–20px 大圆角。
- **质感**：滚动后导航为浅色毛玻璃；深色区使用半透明描边与毛玻璃输入框。
- **节奏**：区块背景 #F9FAFB / #F1F3F4 / #FFF 交替；深浅区块穿插。
- **行情色**：港式**涨红跌绿**（涨 粉红 #E8467C 系，跌 青绿系）。
- **结构**：顶部提示条 → 导航 → 左侧悬浮竖向图标栏 → 深色 Hero → 内容区块 → 多列页脚；右下角圆形悬浮按钮。

---

## 3. 设计变量（Design Tokens）

在 `src/styles.css` 顶部新增（或新建 `src/styles/tokens.css` 并在 `main.js` 中于 Element Plus 样式之后引入）：

```css
:root {
  /* —— 颜色 —— */
  --lb-text: #070a13;            /* 主文字 */
  --lb-text-2: #4b5563;          /* 正文灰 */
  --lb-text-3: #6b7280;          /* 辅助灰 */
  --lb-text-4: #a8aaad;          /* 弱化/占位 */
  --lb-white: #ffffff;
  --lb-black: #000000;

  --lb-accent: #00b8b8;          /* 主强调：青绿 */
  --lb-accent-bright: #00f0c4;   /* 亮青：深色区高亮 */
  --lb-accent-soft: rgba(0, 184, 184, .10); /* 强调浅底 */

  --lb-bg: #f9fafb;              /* 页面背景 */
  --lb-bg-2: #f1f3f4;            /* 区块背景 A */
  --lb-bg-3: #f0f2f4;            /* 区块背景 B */
  --lb-surface: #ffffff;         /* 卡片 */
  --lb-border: #e5e7eb;          /* 分隔线 */

  --lb-dark: #070a13;            /* 深色区底 */
  --lb-dark-grad: linear-gradient(180deg, #000 0%, #04262a 100%);
  --lb-on-dark: rgba(255, 255, 255, .9);
  --lb-on-dark-2: rgba(255, 255, 255, .7);
  --lb-on-dark-border: rgba(255, 255, 255, .2);

  --lb-up: #e8467c;              /* 涨（港式红） */
  --lb-down: #00b8b8;            /* 跌（港式绿） */
  --lb-flat: #6b7280;
  --lb-warn: #f59e0b;
  --lb-danger: #ef4444;

  /* —— 字体 —— */
  --lb-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Avenir, Helvetica,
             "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  --lb-font-num: "SF Mono", "Roboto Mono", Menlo, Consolas, monospace; /* 数字列可选 */

  /* —— 字号阶梯（px / 字重 / 行高）—— */
  --lb-fs-display: 48px;  /* 700 / 1      Hero 标题 */
  --lb-fs-h1: 36px;       /* 600 / 1.15   区块标题 */
  --lb-fs-h2: 24px;       /* 600 / 1.3    卡片组标题 */
  --lb-fs-h3: 18px;       /* 600 / 1.4    卡片标题 */
  --lb-fs-body: 16px;     /* 400 / 1.6    正文 */
  --lb-fs-sm: 14px;       /* 400 / 1.5    次要正文、表格 */
  --lb-fs-xs: 12px;       /* 400 / 1.5    说明、免责小字 */

  /* —— 圆角 —— */
  --lb-r-pill: 9999px;
  --lb-r-xl: 20px;        /* 大卡片 */
  --lb-r-lg: 16px;        /* 普通卡片 */
  --lb-r-md: 12px;        /* 输入框、小卡 */
  --lb-r-sm: 8px;         /* 标签、表格容器 */

  /* —— 阴影 —— */
  --lb-shadow-1: 0 1px 2px rgba(7, 10, 19, .04), 0 1px 3px rgba(7, 10, 19, .06);
  --lb-shadow-2: 0 8px 24px rgba(7, 10, 19, .08);
  --lb-shadow-3: 0 16px 40px rgba(7, 10, 19, .12);

  /* —— 间距（4 的倍数）—— */
  --lb-sp-1: 4px;  --lb-sp-2: 8px;  --lb-sp-3: 12px; --lb-sp-4: 16px;
  --lb-sp-5: 24px; --lb-sp-6: 32px; --lb-sp-7: 48px; --lb-sp-8: 64px;

  /* —— 毛玻璃 —— */
  --lb-glass-light: rgba(255, 255, 255, .72);
  --lb-glass-dark: rgba(255, 255, 255, .08);
  --lb-blur: saturate(180%) blur(16px);

  /* —— 布局 —— */
  --lb-container: 1200px;
  --lb-nav-h: 64px;
  --lb-sidebar-w: 80px;
  --lb-ease: cubic-bezier(.2, .8, .2, 1);
}
```

**断点**：`≥1280` 桌面 / `768–1279` 平板 / `<768` 手机。

---

## 4. 组件规范

### 4.1 顶部提示条（Announcement Bar）
- 高 36–40px，底色 `--lb-accent`，文字 `--lb-text` 14px，居中；右侧 × 关闭（16px 图标）。
- 用于承载现有 W3/W4 提示信息，**不改其显示逻辑**，仅换外观。关闭状态沿用现有存储方式。

### 4.2 导航栏（Top Nav）
- 高 `--lb-nav-h`，左 Logo（本项目自有）、中部菜单、右侧圆形图标按钮。
- 初始：在深色 Hero 上透明，文字白色；滚动 > 8px 后：`background: var(--lb-glass-light); backdrop-filter: var(--lb-blur);` 文字转 `--lb-text`，底部 1px `--lb-border`。
- 菜单项 15–16px/500；激活态：文字 `--lb-text` + 下方 2px 青绿短线或青绿浅底胶囊。
- 可选：指数/标的滚动条（mini 行情 pill，见 4.10）——仅当有自有接口数据时启用。

### 4.3 左侧竖向图标栏（Side Rail）
- 宽 `--lb-sidebar-w`，左侧悬浮、垂直居中，胶囊形容器（radius 40px），`--lb-glass-light` + 毛玻璃 + `--lb-shadow-2`。
- 图标 24px + 下方 11–12px 文字，项间距 12px；激活项：青绿浅底圆角块 + 图标青绿。
- 底部：黑色正圆按钮（40px，白色图标），用于头像/登录/设置入口。
- 适合映射 OptionLayout 的主菜单（今日/信息/进行/跟踪/结算/战绩/学堂/更新/设置）。手机端隐藏，改为底部 Tab 或抽屉菜单。

### 4.4 圆形图标按钮（Icon Button）
- 40×40 正圆；浅色区：白底 + 1px `--lb-border`；深色区：`--lb-glass-dark` + 1px `--lb-on-dark-border`。
- hover：背景加深 4%，`transition: .2s var(--lb-ease)`。

### 4.5 胶囊按钮（Pill Button）
| 类型 | 样式 | 场景 |
| --- | --- | --- |
| 主（深色区） | 白底黑字，18–20px/700，高 48px，padding 12px 48px | Hero 主 CTA |
| 主（浅色区） | 黑底白字，16–18px/600，高 48px（大号 64px） | 区块 CTA、提交 |
| 强调 | `--lb-accent` 底、白/黑字 | 关键操作（谨慎使用，每屏 ≤1） |
| 次要 | 透明底 + 1px 描边，文字同色 | 取消、次级操作 |
| 小号 | 高 32px，14px，padding 6px 16px | 表格行内、筛选 |
- 全部 `border-radius: var(--lb-r-pill)`；hover 轻微上浮 `translateY(-1px)` + 阴影；disabled 透明度 .4。

### 4.6 深色 Hero / 页头（Dark Hero）
- 背景 `--lb-dark-grad`，可叠加 CSS/SVG 青绿光线（径向渐变 `radial-gradient(circle at 50% 120%, rgba(0,240,196,.35), transparent 60%)`）替代视频。
- 标题 `--lb-fs-display`/700/行高 1，`--lb-on-dark`；副文 16px `--lb-on-dark-2`；居中或左对齐。
- 数据页页头高度 200–280px（营销页可 420px+），底部可放 KPI 胶囊或主按钮。
- 下方说明小字 12px `--lb-on-dark-2`。

### 4.7 大圆角卡片（Card）
- `--lb-surface` 底，`--lb-r-xl`（大）/`--lb-r-lg`（普通），padding 24–32px，`--lb-shadow-1`，hover `--lb-shadow-2`。
- 结构：图标（48px，青绿线性图标或渐变圆底，**不用 3D 图**）→ 标题 `--lb-fs-h3` → 灰色说明 `--lb-fs-sm` `--lb-text-2`。
- 栅格：2×2 / 3 列；间距 24px。灰底区块上放白卡片形成层次。

### 4.8 资讯 / 课程卡（Feed Card）
- 圆角 `--lb-r-lg`，封面 16:9（圆角同卡片），标题 16px/600 两行截断，元信息 12px `--lb-text-3`。
- 横向轮播：可轻微错落（奇数卡 `translateY(16px)`），底部分页点：灰点 6px，激活为 20px 黑色胶囊。
- 免责小字置于轮播下方，12px `--lb-text-4`。

### 4.9 KPI / 统计块
- 数字 28–36px/700（`font-variant-numeric: tabular-nums`），标签 12–14px `--lb-text-3`。
- 涨跌数字用 `--lb-up` / `--lb-down`，并配 ▲▼ 符号（色盲友好）。

### 4.10 行情 / 数据 Pill
- 高 28–32px，胶囊；内容：名称 + 价格 + 涨跌幅（+ 可选 48×16 迷你走势 SVG）。
- 涨：文字 `--lb-up`，底 `rgba(232,70,124,.08)`；跌：文字 `--lb-down`，底 `--lb-accent-soft`。

### 4.11 标签 / 徽标（Tag / Badge）
- 胶囊，高 22–24px，12px/500，padding 0 10px。
- 默认：黑底白字（长桥资产标签样式）；状态：浅底同色字（成功青绿、警示琥珀、危险红、中性灰）。
- 现有“盘后”等标签沿用此样式。

### 4.12 表格（Element Plus el-table）
- 容器白底 `--lb-r-lg` + `overflow:hidden`；表头背景 `--lb-bg`，12–13px/500 `--lb-text-3`；行高 48px；仅保留水平分隔线 `--lb-border`；hover 行 `--lb-bg`。
- 数字列右对齐 + tabular-nums。

### 4.13 表单输入
- 高 44–48px，`--lb-r-md`（搜索框用胶囊），1px `--lb-border`，focus：边框 `--lb-accent` + `0 0 0 3px var(--lb-accent-soft)`。
- 深色区输入框：`--lb-glass-dark` + 毛玻璃 + 白字，胶囊形（参考长桥 AI 区输入框）。

### 4.14 空状态 / 占位
- 居中：64px 线性图标（`--lb-text-4`）+ 16px/600 标题 + 14px 灰说明 + 可选次要胶囊按钮。
- W7 “暂未开放”占位：卡片保持，右上角灰色胶囊徽标“暂未开放”，整体 `opacity:.6`，不可点击态保持现有逻辑。

### 4.15 页脚（Footer）
- 背景 `--lb-bg-2`，多列链接（14px `--lb-text-2`，标题 14px/600 `--lb-text`），底部 12px 风险提示（使用本项目自有文案）。

### 4.16 悬浮按钮（FAB）
- 右下角 56px 正圆，深灰 `#1f2937` 底白图标，`--lb-shadow-3`；距边 24px。可用于“回到顶部”或“帮助”。

### 4.17 Element Plus 覆盖建议
在全局样式中覆盖 Element Plus CSS 变量（放在 `element-plus/dist/index.css` 之后）：

```css
:root {
  --el-color-primary: #00b8b8;
  --el-color-primary-light-3: #4dcdcd;
  --el-color-primary-light-5: #80dbdb;
  --el-color-primary-light-7: #b3eaea;
  --el-color-primary-light-9: #e6f8f8;
  --el-color-primary-dark-2: #009393;
  --el-text-color-primary: var(--lb-text);
  --el-text-color-regular: var(--lb-text-2);
  --el-text-color-secondary: var(--lb-text-3);
  --el-border-color: var(--lb-border);
  --el-bg-color-page: var(--lb-bg);
  --el-border-radius-base: 12px;
  --el-font-family: var(--lb-font);
}
.el-button { border-radius: var(--lb-r-pill); }
.el-card { border-radius: var(--lb-r-lg); border: none; box-shadow: var(--lb-shadow-1); }
.el-dialog { border-radius: var(--lb-r-xl); }
.el-tag { border-radius: var(--lb-r-pill); }
.el-message { max-width: calc(100vw - 32px); } /* 保留现有规则 */
```

---

## 5. 页面映射（ruoyi-option-web → 长桥区块风格）

| 页面（src/views） | 推荐结构 | 关键要点 |
| --- | --- | --- |
| 布局 `layout/OptionLayout.vue` | 顶部提示条 + 毛玻璃导航 + 左侧竖向图标栏 + 右下 FAB | 菜单项与权限显示逻辑不变 |
| 今日 `today` | 深色 Hero 页头（日期、问候、KPI 胶囊）→ 2×2 白卡片 | 提示条、盘后标签保留 |
| 信息 `info` | 浅色页头 + 数据 Pill 横条 + 卡片/表格 | 涨跌色用港式 |
| 进行 `active` | KPI 统计块 + 白底圆角表格 | 状态用胶囊标签 |
| 跟踪 `tracks` | 卡片列表 / 表格，行内小号胶囊按钮 | 数字 tabular-nums |
| 结算 `settlement` | KPI 块 + 表格 + 灰底合计区 | 金额右对齐 |
| 战绩 `scorecard` | 深色 Hero 大数字（胜率/收益）→ 3 列卖点式统计卡 | 图表配色用青绿 + 港式红 |
| 学堂 `academy` | 资讯卡轮播（错落）+ 分页点 + 课程网格 | 封面自有素材 |
| 更新 `updates` | 浅色页头 → 重点更新大卡片 → 时间线（青绿节点）+ 胶囊分类筛选 + 胶囊搜索框 | 视频/示意图、阅读进度功能保留 |
| 设置 `settings` | 灰底 + 合规式白色大卡片分组列表 | W7 “暂未开放”占位样式见 4.14 |
| 登录 `login` / 注册 `register` | 深色渐变全屏 + 居中毛玻璃卡片 + 胶囊输入框与白色主按钮 | 校验/接口逻辑不变 |

---

## 6. 响应式规则

| 断点 | 规则 |
| --- | --- |
| 桌面 ≥1280 | 内容 `max-width: var(--lb-container)` 居中；左侧图标栏显示；卡片 2–3 列 |
| 平板 768–1279 | 左侧图标栏收窄为仅图标（64px）或改顶部菜单；卡片 2 列；Hero 标题 36px |
| 手机 <768 | 隐藏左侧栏，改底部 Tab / 抽屉菜单；导航右侧仅保留圆形图标按钮；卡片单列；Hero 标题 28–32px 允许换行；按钮高 44px、宽度 100%；表格横向滚动或改卡片列表；页面左右 padding 16px |
- 所有可点击区域 ≥ 44×44（手机）。
- 毛玻璃需提供降级：`@supports not (backdrop-filter: blur(1px)) { background: rgba(255,255,255,.95); }`。
- 尊重 `prefers-reduced-motion`：关闭轮播自动播放与位移动画。

---

## 7. 改造流程（Skill 执行步骤）

1. **读规范**：通读本文件第 1、3、4 节，确认目标页在第 5 节的映射。
2. **建分支**：在 `uiStyle`（或其子分支）上工作，不直接改 main。
3. **改前截图**：桌面（1440×900）+ 手机（390×844）各一张，可用 `/data/web/pw.cjs`（Playwright）截图，存档对比。
4. **先变量后组件**：首次改造先落地第 3 节 tokens 与 4.17 Element Plus 覆盖；之后每页只用变量。
5. **只改样式**：仅修改 `<template>` 结构类名/包裹层与 `<style>`；**不得**修改 `<script>` 中的接口、数据处理、权限、路由逻辑（如需调整，先说明原因并征得同意）。
6. **改后截图对比**：同尺寸截图，对照第 8 节验收清单逐项自检。
7. **构建验证**：`npm run build` 无报错；控制台无新增 error。
8. **一页一提交**：提交信息格式 `style(<页面>): 长桥风格改造（要点…）`，例：`style(today): 长桥风格改造（深色页头、KPI 胶囊、2×2 卡片）`。
9. **汇报**：列出改动页面、截图对比、遗留问题；新规则写入第 9 节。

---

## 8. 验收清单

**视觉**
- [ ] 颜色、字号、圆角、阴影全部来自 tokens，无魔法值
- [ ] 强调色仅青绿，每屏强调按钮 ≤ 1 个
- [ ] 按钮为胶囊、图标按钮为正圆、卡片 16–20px 圆角
- [ ] 涨红跌绿（港式）且有 ▲▼ 辅助
- [ ] 深浅区块层次清晰，正文对比度 ≥ 4.5:1

**合规**
- [ ] 未使用长桥 Logo / 字体 / 视频 / 3D 图 / 截图 / 文案 / 第三方 Logo
- [ ] 数据均来自本项目接口

**功能**
- [ ] 接口、业务、权限、路由逻辑未改动
- [ ] W1–W8 功能（提示条、盘后标签、更新页筛选/搜索/阅读进度、W7 占位等）正常
- [ ] `npm run build` 通过，控制台无新增报错

**响应式**
- [ ] 1440 / 1024 / 390 三档宽度无溢出、无遮挡
- [ ] 手机端左侧栏已隐藏且有替代导航，点击区域 ≥ 44px
- [ ] 毛玻璃降级与 reduced-motion 生效

---

## 9. 迭代记录

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 初版 | v1.0 | 基于长桥首页（桌面 + 手机）观察整理：tokens、17 类组件、11 个页面映射、响应式、流程与验收清单 |

> 已知缺口：长桥“平台特色”下拉面板与内页未观察；如需补充下拉菜单/内页样式，追加至此并更新第 4 节。
