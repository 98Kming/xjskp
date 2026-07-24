# Router 路由引擎设计

## 架构概览

- **文件**：[src/router/Router.ts](../../src/router/Router.ts)、[src/pages/BasePage.ts](../../src/pages/BasePage.ts)、[src/router/errors.ts](../../src/router/errors.ts)
- **模式**：Router 单例 + BFS 寻路 + 逐跳执行
- **Route 接口** `{ target: typeof BasePage, action: () => boolean, imagePath?: string }`，用 class 引用判断到达
- **页面注册**：页面构造函数通过 `setRegisterCallback` 自动注册到 Router；Router 未创建时暂存 `pendingPages`，回调设置后批量注册

## go() 导航主流程

```
while (totalBacks < 3 && unknownBacks < 6):
  ① 截图 → detectCurrentPage
     若 null → tryCloseModals → 仍 null → performBack(null) → unknownBacks++
     若已知 → unknownBacks = 0
  ② 已到目标 → 打印 [导航 链路] → return true
  ③ findPath BFS → 无路径 → lastNoPathPage 循环检测 → performBack(current) → totalBacks++
  ④ 打印 [导航 前往: 目标] + [导航 路径: A→B] + executePath 逐跳执行
  ⑤ execResult 处理：
     null(按钮未找到) + 页面未变 → 打印链路 → 抛 NavigationError
     null(按钮未找到) + 页面变了 → performBack → totalBacks++
     false(超时/偏离) → retryCurrent 检测：
       - null → [导航 页面加载过渡中] → sleep 3s 再检
       - targetClass → 打印链路 → return true
       - ≠ current → replan 重规划（最多 2 次）
       - == current → 打印链路 → 抛 NavigationError
       - 其他 → performBack → totalBacks++
  ⑥ 循环出口 → 打印 [导航 链路] → 抛对应的 NavigationError
```

每一步结束后打印 `[导航] 链路: 页面A → 页面B → ...`，展示从起点到终点的完整路径（含"未知"页）。导航开始打印 `[导航] 前往: 目标页`，不预设起点。

## 计数器隔离

| 计数器 | 上限 | 用途 | 重置条件 |
|---|---|---|---|
| `totalBacks` | 3 | 路由失败重试 | 不会重置 |
| `unknownBacks` | 6 | 未知页面逐层回退 | 到达已知页面后归零 |
| `replanLeft` | 2 | 超时后从当前页重新规划 | 每次回退后重置 |

独立计数原因：路由失败和未知页面回退是不同场景——路由失败不该多试；未知页面每层都是真实后退，该允许多步。

## 快速失败机制

| 检测条件 | 行为 | 触发场景 |
|---|---|---|
| 按钮未找到 + 页面未变 | 直接抛 NavigationError | 按钮入口真的不存在 |
| 超时 + 页面未变 | 直接抛 NavigationError | 按钮匹配错误 |
| 连续两次同页无路径 | 直接抛 "回退循环" | 不可达页面的无效回退 |
| performBack 连续 2 次同页无效 | 直接抛 "回退死循环" | 页面无退路（back() 无效 + 物理点击无效） |

## executePath 逐跳执行

- 每跳：action() 点击 → 6次×800ms 轮询检测页面切换
- 按钮未找到 → 3次×800ms 恢复轮询（可能上一轮点击已生效）→ 仍失败 return null
- 偏离到其他页 → tryCloseModals + 继续轮询
- 超时 + 页面为 null（过渡加载）→ 额外 8×1000ms 延长等待 → 仍 null return false
- 超时 + 页面已知 → tryCloseModals → 还是没到 return false
- **pageChange 加速（2026-07-11 优化）**：轮询期间检测到 pageChange(点击前截图) 连续 2 轮变化但 is() 不识别 → 提前结束轮询，进入过渡/偏离处理

## performBack 回退层级

**已知页面**（`performBack(page)`）：
1. `page.back()` 单次左下角点击
2. `detectCurrentPage` 识别 → 变了 → 成功
3. 无法识别 → `pageChange()` 比对截图 → 变了 → 成功
4. 页面未变 → `tryCloseModals` 关闭弹窗 → 重检测
5. 备选点击 `(width/2, height-50)`
6. 全失败 → return false

**未知页面**（`performBack(null)`）：
1. 双击底部：`click(100, height-100)` + `click(width/2, height-100)`
2. 同上 2-6 步

## 故障恢复

- `tryCloseModals` — 遍历关闭按钮列表（含重连按钮），弹窗/过渡页遮挡时自动点掉
- `pageChange` — 像素网格采样比对，`is()` 识别失败时用作兜底判断页面是否变化
- `verifyAfterChange` — pageChange 判定后二次确认页面身份


┌─────────────────────────────────────┐
│          router.go(target)          │
│  单例 Router，BFS 寻路，逐跳执行     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  while totalBacks<5 && unknown<6    │
│  (每次循环重新截图)                   │
└────────────────┬────────────────────┘
                 │
                 ▼
       ┌─────────────────┐
       │ detectCurrentPage│
       │ 遍历20页逐一 is()│     否
       │ 找到匹配则返回    ├────────┐
       └────────┬────────┘        │
                │ 是               │
                ▼                 ▼
       ┌─────────────────┐ ┌──────────────────┐
       │  未知页面处理     │ │ tryCloseModals() │
       │  已到目标? → ✅   │ │ sleep(1500)      │
       │  totalBacks==0   │ │ 重新识别         │
       │  则打"前往X"日志  │ │ 仍未知?          │
       └────────┬────────┘ │ performBack(null)│
                │          │ unknownBacks++   │
                ▼          └──────────────────┘
       ┌─────────────────┐
       │  findPath BFS   │
       │ 从当前页沿routes│
       │ 搜索目标页       │
       └────────┬────────┘
                │
       ┌────────┴────────┐
       │  有路径?         │
       └┬───────────────┬┘
        │ 否            │ 是
        ▼               ▼
┌─────────────────┐  ┌──────────────────────┐
│ performBack()   │  │  logPath(current,path)│
│ totalBacks++    │  │  executePath(path)    │
│ continue(重试)   │  └──────────┬───────────┘
└─────────────────┘             │
                         ┌──────┴──────┐
                         │ execResult?  │
                         └┬──────┬────┬┘
                          │      │    │
                     ┌────┘      │    └──────┐
                     ▼           ▼           ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ true ✅   │ │ null     │ │ false    │
              │ 到目标页  │ │ 按钮未找 │ │ 超时/偏离│
              │ 返回成功  │ │ 到       │ └────┬─────┘
              └──────────┘ └────┬─────┘      │
                                │            │
                    ┌───────────┴──┐  ┌──────┴──────┐
                    │ 页面不变?     │  │ retryCurrent?│
                    └┬──────────┬──┘  └┬──┬──────┬──┘
                     │ 是      │ 否    │  │      │
                     ▼        ▼       ▼  │      ▼
              ┌──────────┐ ┌────────┐ ┌──┴───┐ ┌──────┐
              │ 抛异常    │ │perf-  │ │ null │ │已到  │
              │"入口未开" │ │ormBack│ │加载过│ │目标? │
              └──────────┘ │total+1│ │渡处理│ │✅    │
                           └────────┘ └──────┘ └──────┘
                                     ┌──────┐
                                     │页面变 │
                                     │了?   │
                                     └─┬──┬─┘
                                      │  │
                                      ▼  ▼
                                ┌────────┐ ┌──────────┐
                                │重规划×2 │ │ 页面未变  │
                                │有路径→重│ │ 抛异常    │
                                │试       │ │"匹配问题" │
                                └────────┘ └──────────┘


═══════════════════ executePath(path) 单跳执行 ═══════════════════

  ┌────────────────┐
  │ startName =     │
  │ detectCurrent   │
  │ Page(screen())  │
  └────────┬───────┘
           │
           ▼
  ┌────────────────┐
  │ route.action() │───→ 点按钮（找图+点击）
  └────────┬───────┘
           │
     ┌─────┴──────┐
     │ 成功?       │
     └┬───────────┬┘
      │ 否        │ 是
      ▼           ▼
  ┌────────┐ ┌──────────────────────┐
  │ 直接   │ │ 主轮询 6×800ms       │
  │ return │ │ sleep(800) → screen()│
  │ null   │ │ detectCurrentPage()  │
  └────────┘ │                      │
             │ ┌──────────────────┐ │
             │ │ 已到目标页? → ✅ │ │
             │ │ 偏离(不同页)?    │ │
             │ │ → tryCloseModals │ │
             │ │ → 继续轮询       │ │
             │ │ 同页且attempt=3? │ │
             │ │ → 重试一次点击   │ │
             │ └──────────────────┘ │
             └──────────┬───────────┘
                        │
                  ┌─────┴──────┐
                  │ hopOk?      │
                  └┬───────────┬┘
                   │ 否       │ 是 → 下一跳/完成
                   ▼
             ┌─────────────────────┐
             │ 超时处理             │
             │ landedPage===null   │
             │ → 扩展等待 8×1s     │
             │ landedPage===已知   │
             │ → tryCloseModals    │
             │ → 确认页面          │
             │ 仍失败 → return     │
             │ false               │
             └─────────────────────┘


═══════════════════ performBack(page) 单次回退 ═══════════════════

  ┌─────────────────────────┐
  │ 截图 beforeImg          │
  │ detectCurrentPage(before)│
  └────────┬────────────────┘
           │
     ┌─────┴──────┐
     │ page存在?    │
     └┬───────────┬┘
      │ 是       │ 否
      ▼          ▼
  ┌────────┐  ┌──────────────┐
  │page.   │  │物理点击×2     │
  │back()  │  │底部回退手势   │
  └───┬────┘  └──────┬───────┘
      │               │
      ▼               ▼
  ┌────────┐  ┌─────────────┐
  │成功?   │  │sleep(1500)  │
  │失败    │  │+ 识别页面   │
  │(无sleep)│  └──────┬──────┘
  └───┬────┘          │
      │               ▼
      ▼        ┌──────────────┐
  ┌───────┐    │ 页面变了?     │──→ ✅ 回退成功
  │sleep  │    └┬─────────────┘
  │(1500) │     │ 否
  └───┬───┘     ▼
      │   ┌──────────────┐
      ▼   │ 页面未知?     │──→ pageChange(beforeImg)
  ┌───────┐│  截图变化了?  │──→ ✅ (回退生效但未知)
  │ 识别  │└──────┬───────┘
  │ 页面  │       │ 否
  └───────┘       ▼
           ┌──────────────┐
           │ tryCloseModals│──→ 关了弹窗后重检测
           │ + 备选回退    │──→ 底部中间点击
           └──────┬───────┘
                  ▼
            ┌──────────┐
            │ 全部无效   │
            │ return    │
            │ false     │
            └──────────┘


═══════════════════ 寻路 findPath BFS ═══════════════════

  当前页 → 取routes()
          ↓
  queue = [{page: from, path: []}]
  visited = {from: true}
          ↓
  循环: 出队 → routes() → 遍历
          ↓
   ┌──────────────────────┐
   │ route.target == goal │──→ 返回 path+[route]
   │ ?                    │
   └──────┬───────────────┘
          │ 否
          ▼
   visited[target]?
   ┌────┴────┐
   │ 未访问   │→ 入队 {page:target, path:path+[route]}
   │ 已访问   │→ 跳过
   └─────────┘
          ↓
   queue为空 → 返回 null (无路径)


═══════════════════ Router 优化记录 ═══════════════════

以下按时间记录 Router 路由引擎的效率优化。

## 2026-07-11: performBack 死循环检测 + 超时 pageChange 加速

### 背景

从导航测试日志发现两个耗时大头：
1. `performBack(战斗)` 因战斗页无退路，重复 5 轮直到 maxBacks=5 才放弃，浪费 ~25s
2. 军团、异域挑战-个人奖励因页面切换后 is() 识别慢，轮询等满 6×800ms=4.8s 再加 8×1s 延长等待，各浪费 ~12s

### 优化一：performBack 死循环检测

**触发场景：** 页面 back() 返回 false（无退路按钮），物理回退点击无效，performBack 始终回到同一页面。

**改动位置：** `go()` 主循环

**实现：** 在 go() 中维护两个变量：
- `lastBackPage: string | null` — 上次 performBack 调用时的页面名
- `sameBackCount: number` — 连续 back 同页的计数

每次 `performBack(page)` 返回 null 后：
1. 重新 detect 当前页面
2. 若当前页面 === `lastBackPage` → `sameBackCount++`
3. 若 `sameBackCount >= 2` → 抛 `NavigationError("回退死循环: 页面" + name + "无出口")`
4. 否则 → 记录当前页到 `lastBackPage`，重置 `sameBackCount = 0`

任何一次 performBack 成功落到不同页 → 两个计数器归零。

**流程图：**
```
performBack(current) 返回 null
     │
     ▼
detectCurrentPage(screen())
     │
     ├─ 当前页 === lastBackPage → sameBackCount++
     │    └─ sameBackCount >= 2 → 抛异常（死循环）
     │
     └─ 当前页 !== lastBackPage → 更新 lastBackPage，sameBackCount = 0
```

### 优化二：~~轮询 pageChange 加速~~ 已回退

2026-07-11 尝试了 4 个版本后回退。pageChange 像素比对作为"页面已变"信号不可靠：
- 过渡动画触发误判，加速后 fallback 路径比原始轮询还慢
- `return false` 提前退出导致寰球救援等页面识别失败
- 原始 6×800ms 简单轮询稳定可靠，从"减少找图次数"角度出发更优

**最终结论：executePath 保持原始简单轮询，不做 pageChange 加速。**

### 效果预期

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 无退路页面死循环 | 25s（5 轮空转） | ~5s（2 轮后立即抛异常） |
| 超时不可识别页（玩法商店） | 86.6s | ~20s |
| 初始页面无法识别（致命未知） | 600s（20页×30s） | ~30s（第1页失败后跳过） |

### 优化日志

| 版本 | 方案 | 问题 |
|------|------|------|
| — | **死循环检测**：performBack 连续 2 次同页无效抛异常 | 减少无退路页面空转 25s→5s |
| — | **致命未知标记**：`_fatalUnknown` 标记，后续导航直接跳过 | 初始页面无法识别时省 570s |
| — | **timeoutBacks 独立**：超时重试上限 2，与路由失败 5 分离 | 不可识别页 86.6s→20s |
| — | **超时延长 8s→2s**：`landedPage===null` 时不再 8×1s 轮询 | 每轮省 6s |
| — | **过渡等待 3s→1s**：`!retryCurrent` 时 sleep 缩短 | 每轮省 2s |
| — | **maxAttempts 6→4**：轮询次数缩减 | 每轮省 1.6s |
| — | **重试点击提前**：attempt>=1 即重试，不等 attempt=3 | 寰球救援 6s→3.5s |

### pageChange 加速尝试（已全部回退）

| 版本 | 方案 | 结论 |
|------|------|------|
| v1 | pageChange → break 跳出轮询 | 过渡动画误判后更慢 |
| v2 | pageChange → 降间隔至 200ms | 找图次数不变，不可识别页仍慢 |
| v3 | pageChange → 等稳定 → 查 1 次 → break | 仍走超时处理块 |
| v4 | pageChange → 等稳定 → 查 1 次 → return false | 寰球救援 1.3s→❌ |
| Revert | 移除全部 pageChange 加速 | pageChange 加速引入的问题 > 解决的问题 |

### 相关代码

- `src/router/Router.ts` — go() 主循环 + executePath() 轮询
- `src/utils/img.ts` — pageChange()（已有，无需修改）

## 2026-07-13: route.action 首次调用加重试，支持延迟入口按钮

### 背景

导航测试发现 `基地 → 随机事件` 的入口按钮（`基地$随机事件`）有延迟出现（动画/弹窗加载），但 `executePath()` 中 `route.action()` 只调一次，按钮未出现就直接判负返回 null，导致导航失败。

### 改动位置

`executePath()` 首次 action 调用处（`src/router/Router.ts:254`）

### 实现

在首次 `route.action()` 调用前加 for 循环，最多重试 3 次，每次间隔 800ms（最长等 ~1.6s）：

```
之前: action() → false → return null
之后: action() → false → 800ms → action() → false → 800ms → action() → true → 继续
```

不修改后续的页面跳转确认轮询（原有 `maxAttempts=4` × `interval=800ms` 逻辑不变）。

### 设计考量

- **只加在 executePath 层**：不改 `createRouteAction`（避免影响纯点击场景的语义）
- **最多 3 次**：平衡等入口延迟和失败快速反馈
- **日志区分**：重试时打印 `[导航] 第i跳: 按钮未找到，800ms后重试`，最终失败打印原 failInfo
- **找图次数影响**：延迟出现的入口平均多 ~1-2 次找图，可接受