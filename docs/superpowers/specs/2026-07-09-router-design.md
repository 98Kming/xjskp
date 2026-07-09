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

## executePath 逐跳执行

- 每跳：action() 点击 → 6次×800ms 轮询检测页面切换
- 按钮未找到 → 3次×800ms 恢复轮询（可能上一轮点击已生效）→ 仍失败 return null
- 偏离到其他页 → tryCloseModals + 继续轮询
- 超时 + 页面为 null（过渡加载）→ 额外 8×1000ms 延长等待 → 仍 null return false
- 超时 + 页面已知 → tryCloseModals → 还是没到 return false

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
