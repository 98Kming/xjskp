# Router 优化 V2 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 解决导航测试中两个效率瓶颈 — performBack 死循环空转和超时轮询等满 4.8s

**架构：** 在 `go()` 主循环加同页回退计数器（连续 2 次即抛异常）；在 `executePath()` 轮询循环用 `pageChange()` 提前检测页面变化并跳出

**技术栈：** TypeScript / AutoJs6 / images 模块

**设计文档：** `docs/superpowers/specs/2026-07-09-router-design.md` → "Router 优化记录" 章节

---

### 任务 1：performBack 死循环检测

**文件：**
- 修改：`src/router/Router.ts:48-180`

**背景：** 当页面 `back()` 返回 false（无退路按钮）+ 物理回退点击也无效时，performBack 始终回到同一页。go() 主循环会重复执行 5 轮（maxBacks=5）才放弃，浪费 ~25s。

**方案：** 在 `go()` 中维护连续失败计数器，`performBack` 对同一页面连续失败 2 次 → 立即抛异常。

- [ ] **步骤 1：在 Router 类添加死循环追踪字段**

在 `src/router/Router.ts` 类定义中添加两个私有字段：

```typescript
private _backLoopPage: string = ''
private _backLoopCount = 0
```

放在 `private lastFailImageInfo: string = ''` 后面。

- [ ] **步骤 2：添加死循环检测辅助方法**

```typescript
/** 在 performBack 返回 null 后调用，检测同页回退死循环 */
private checkBackDeadLoop(pageName: string): void {
  if (pageName === this._backLoopPage) {
    this._backLoopCount++
    if (this._backLoopCount >= 2) {
      throw new NavigationError('回退死循环: ' + pageName + ' 无出口')
    }
  } else {
    this._backLoopPage = pageName
    this._backLoopCount = 1
  }
}

private clearBackDeadLoop(): void {
  this._backLoopPage = ''
  this._backLoopCount = 0
}
```

- [ ] **步骤 3：在 go() 中三个 performBack 调用点加检测**

go() 中有 3 处调用 `performBack`：

**位置 ①：`findPath` 无路径时（约 88-99 行）**
```typescript
if (!path || path.length === 0) {
  log('[导航] 从"' + current.name + '"无法到达"' + targetName + '"，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
  var backResult = this.performBack(current)
  if (!backResult) {
    if (current) this.checkBackDeadLoop(current.name)
    current = null
  } else {
    this.clearBackDeadLoop()
    current = backResult
  }
  ...
}
```

**位置 ②：`execResult === null` 且页面变了（约 123-128 行）**
```typescript
// 页面变了（过渡动画残留），回退重试
log('[导航] 按钮不可达，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
var backName = current ? current.name : ''
current = this.performBack(current)
if (!current && backName) {
  this.checkBackDeadLoop(backName)
}
totalBacks++
```

**位置 ③：`execResult === false` 且页面不同（约 175-179 行）**
```typescript
log('[导航] 路径执行失败，页面:' + retryCurrent.name + '，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
var backName3 = retryCurrent ? retryCurrent.name : ''
current = this.performBack(retryCurrent)
if (!current) {
  log('[导航] 建议检查目标页面入口是否存在')
  if (backName3) this.checkBackDeadLoop(backName3)
}
```

关键原则：`checkBackDeadLoop` 仅在 `performBack` 返回 null（回退无效）后调用，传入的是回退前的页面名。`clearBackDeadLoop` 仅在 `performBack` 返回非 null（回退成功到不同页）后调用。

- [ ] **步骤 4：performBack 成功时清空计数器**

3 个位置中，`performBack` 返回非 null 的路径都要调用 `this.clearBackDeadLoop()`：

**位置 ①：**
```typescript
var backResult = this.performBack(current)
if (!backResult) {
  if (current) this.checkBackDeadLoop(current.name)
  current = null
} else {
  this.clearBackDeadLoop()
  current = backResult
}
```

**位置 ②：** `performBack` 返回非 null 时 `current` 被赋值，走到 `continue` 后下一轮循环重新 detect。在 `performBack` 返回非 null 后立即清空即可：
```typescript
var backName = current ? current.name : ''
current = this.performBack(current)
if (!current) {
  if (backName) this.checkBackDeadLoop(backName)
} else {
  this.clearBackDeadLoop()
}
```

**位置 ③：**
```typescript
current = this.performBack(retryCurrent)
if (!current) {
  log('[导航] 建议检查目标页面入口是否存在')
  if (retryCurrent) this.checkBackDeadLoop(retryCurrent.name)
} else {
  this.clearBackDeadLoop()
}
```

- [ ] **步骤 5：构建验证**

```bash
npm run build 2>&1 | tail -10
```

预期：build success，无 TypeScript 错误。

- [ ] **步骤 6：Commit**

```bash
git add src/router/Router.ts
git commit -m "router: performBack 死循环检测，连续2次回退同页即抛异常"
```

---

### 任务 2：轮询 pageChange 加速

**文件：**
- 修改：`src/router/Router.ts:230-268`（executePath 轮询循环）

**背景：** 按钮点击成功后，目标页已加载但 `is()` 图片匹配暂时不识别，轮询固定 6×800ms=4.8s 再加 8×1s 延长等待，浪费 ~12s。

**方案：** 点击后截图 `beforeFrame`，轮询期间用 `pageChange(beforeFrame)` 检测连续 2 轮像素变化 → sleep(1200) 等页面稳定 → 只做 1 次 `detectCurrentPage`。命中则完成，未命中则立即返回（跳过剩余轮询和超时 fallback），让调用方处理。

- [ ] **步骤 1：在 executePath 循环中加 beforeFrame + pageChange 检测**

找到 executePath 中的轮询循环（约 230-268 行），修改为：

```typescript
var maxAttempts = 6
var interval = 800
var hopOk = false
var landedPage: string | null = null
var deviated = false
var beforeFrame = screen()       // ← 新增：点击前截图
var changedCount = 0              // ← 新增：pageChange 连续变化计数

for (var attempt = 0; attempt < maxAttempts; attempt++) {
  sleep(interval)
  var frame = screen()
  var page = this.detectCurrentPage(frame)

  // ← 新增：pageChange 加速检测 — 像素变化后缩短轮询间隔加速 is() 识别
  if (!page || page.name === startName) {
    if (pageChange(beforeFrame)) {
      changedCount++
      if (changedCount >= 2 && interval > 200) {
        interval = 200  // 降间隔而非 break，避免过渡动画误判进入慢 fallback
        log('[导航] 第' + (i + 1) + '跳: pageChange 检测到页面变化，轮询间隔降至 200ms（attempt=' + attempt + '）')
      }
    } else {
      changedCount = 0
    }
  }

  if (!page) {
    landedPage = null
    continue
  }
  // ... 后续逻辑不变
}
```

关键点：
- `beforeFrame` 在点击后、轮询开始前截图，作为变化基准
- `pageChange(beforeFrame)` 用基础截图 vs 当前帧做像素变化检测
- 只有 `detectCurrentPage` 返回 null 或同页时（即 is() 没认出新页）才走加速逻辑
- 连续 2 轮变化后，**降低轮询间隔至 200ms**（而非跳出轮询），让 is() 更密集地尝试识别
- 间隔最低 200ms，防止过渡动画误判后进入超时 fallback 路径（8s 延长 + 关弹窗）
- 不设 `break`，保持原有 6 次检测次数上限

注意：pageChange 内部调用 `screen(0, false)` 重新截图，与轮询中 `var frame = screen(0, false)` 互不影响。

- [ ] **步骤 2：构建验证**

```bash
npm run build 2>&1 | tail -10
```

预期：build success。

- [ ] **步骤 3：Commit**

```bash
git add src/router/Router.ts
git commit -m "router: 轮询 pageChange 加速，页面变化提前跳出避免等满4.8s"
```

---

### 验证方案

构建后在真机运行测试（或通过 autojs-helper 连接）：

1. **死循环检测：** 在 `战斗` 页导航 `选择技能`，预期 ~5s 内抛 "回退死循环: 战斗 无出口"，而非等满 25s
2. **pageChange 加速：** 导航 `军团`，观察日志是否出现 "pageChange 检测到页面变化，提前跳出轮询"，耗时从 ~30s 降至 ~15s 以内

---

### TypeScript 接口提醒

`pageChange` 函数签名：
```typescript
export function pageChange(beforeImg: ImageWrapper): boolean
```

已在 `src/utils/img.ts` 中定义，无需修改。只需确保在 Router.ts 顶部从 `'../utils/img'` import 了 `pageChange`。

当前 import 行：
```typescript
import { imageNameParser, pageChange, screen, tryCloseModals } from '../utils/img'
```

`pageChange` 已包含。无需额外修改。
