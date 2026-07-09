# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoJs6 TypeScript 自动化脚本项目，用于 Android 端 UI 自动化。通过无障碍服务（Accessibility Service）实现手机自动操作，使用图像匹配技术识别页面状态。

## Build Commands

```bash
npm run build        # Webpack 构建 TypeScript → dist/main.js
npx webpack --watch  # 开发模式，监听文件变化自动重新构建
```

构建产物为 `dist/main.js`，是 AutoJs6 执行入口（配置在 project.json 的 `main` 字段）。测试脚本产物为 `dist/test-navigation.js`，可在真机上运行验证导航功能。

**Rhino 兼容：** AutoJs6 使用 Rhino 引擎，不支持 ES6 语法。tsconfig 配置 `target: "es5"`，webpack 配置 `output.environment` 禁用箭头函数/const/解构，确保输出兼容。


### 关键约定

- **页面对象模式**：每个页面继承 `BasePage`，实现 `is()` 方法用图片判断当前页，`routes()` 定义页面跳转路由表
- **图像匹配**：通过屏幕截图与特征图片比对来识别 UI 状态，而非依赖控件 ID
#### 图片命名约定及处理
图片名后缀固定格式`_{0|1}_(0-1]_{x1}_{y1}_{x2}_{y2}`
其中:
- `(0-1]_{x1}_{y1}_{x2}_{y2}`用于`images.findImageInRegion`参数的填充:`let point = images.findImageInRegion(img, template, x1, y1, x2, y2, {0-1})`
- `{0|1}` 值为`0`时不缓存坐标，值为`1`时缓存坐标
- `{x2}` 值为`w`时表示屏幕宽度，`{y2}`值为`h`时表示屏幕高度
图片整体格式:
- `{页面1}${页面2}_{0|1}_(0-1]_{x1}_{y1}_{x2}_{y2}.png`
  point 是`{页面1}`跳转到`{页面2}`的坐标
- `{页面1}$${按钮}_{0|1}_(0-1]_{x1}_{y1}_{x2}_{y2}.png`
  point 是`{页面1}`中`{按钮}`的坐标
- `{页面1}$_{页面2}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png` 
  图片是`{页面1}`的唯一标识，也是`{页面1}`跳转到`{页面2}`的坐标
- `{页面1}$$_{按钮}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png` 
  图片是`{页面1}`的唯一标识，同时 point 是 `{按钮}` 的坐标
- `{页面1}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png`
  页面识别使用，图片是`{页面1}`的唯一标识
- `{页面1}_{标识}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png`
  图片是`{页面1}`中的普通标识，不作页面识别使用
- `${按钮}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png`
  图片是通用功能按钮，不属于任一页面
- `_{标识}_{0|1}_{0-1}_{x1}_{y1}_{x2}_{y2}.png`
  图片是通用标识，不属于任一页面

#### 开发约定
1. 只用该库官方文档中确实存在的 API,并在注释里标出对应的官方文档名称;
2. 如果你不确定某个 API 是否存在,明确告诉我'不确定',不要猜测或编造;
3. 先给一个最小可运行示例,我验证通过后再继续扩展。

#### 测试约定
为代码写有效的测试,并满足:
1. 真实调用被测函数,不要写 1===1 这类废话断言;
2. 期望值要基于正确逻辑,而不是顺着当前代码反推;
3. 覆盖正常、空、异常、边界。写完请告诉我:如果我故意把代码改错,哪些测试会因此失败?

#### 导航测试（test-navigation.ts）约定
- 测试链之间记录前置结果，依赖测试用 `if (前置条件)` 守卫：
  ```
  var ok_幸运锦鲤 = testGo(幸运锦鲤, '⑤ ...')
  if (ok_幸运锦鲤) {
    testGo(幸运锦鲤免费福利, '⑥ ...')  // 只在⑤成功后执行
  } else {
    testSkip('幸运锦鲤不可达，跳过⑥')    // 前置失败时输出原因
  }
  ```
- 跳过的测试用 `testSkip(reason)` 输出原因，不计入 `totalTests`，防止通过率虚低
- 测试统计 `passedTests/totalTests`：跳过的测试不计入 total

## Router 路由引擎设计

### 架构概览

- **文件**：[src/router/Router.ts](src/router/Router.ts)、[src/pages/BasePage.ts](src/pages/BasePage.ts)、[src/router/errors.ts](src/router/errors.ts)
- **模式**：Router 单例 + BFS 寻路 + 逐跳执行
- **Route 接口** `{ target: typeof BasePage, action: () => boolean, imagePath?: string }`，用 class 引用判断到达
- **页面注册**：页面构造函数通过 `setRegisterCallback` 自动注册到 Router；Router 未创建时暂存 `pendingPages`，回调设置后批量注册

### go() 导航主流程

```
① 截图 → detectCurrentPage → 若 null → tryCloseModals → 仍 null → performBack(null)
② 已到目标 → return true
③ findPath BFS → 无路径 → lastNoPathPage 循环检测 → performBack(current) 回退重试
④ executePath 逐跳执行 → 成功 return true
⑤ execResult 处理：
   null(按钮未找到) + 页面未变 → 抛 NavigationError（回退无意义）
   null(按钮未找到) + 页面变了 → performBack 回退重试
   false(超时/偏离) → retryCurrent 检测：
     - null → 加载过渡 → sleep 3s 延等 → 不死循环不回退
     - targetClass → return true
     - ≠ current → replan 重规划（最多 2 次）
     - == current → 抛 NavigationError（按钮匹配有问题）
     - 其他 → performBack 回退重试
⑥ 任何回退 → totalBacks++ → 最多 3 次 → 超限抛 NavigationError
```

### 计数器隔离

| 计数器 | 上限 | 用途 | 重置条件 |
|---|---|---|---|
| `totalBacks` | 3 | 路由失败重试 | 不会重置 |
| `unknownBacks` | 6 | 未知页面逐层回退 | 到达已知页面后归零 |
| `replanLeft` | 2 | 超时后从当前页重新规划 | 每次回退后重置 |

独立计数原因：路由失败和未知页面回退是不同场景——路由失败不该多试；未知页面每层都是真实后退，该允许多步。

### 快速失败机制

| 检测条件 | 行为 | 触发场景 |
|---|---|---|
| 按钮未找到 + 页面未变 | 直接抛 NavigationError | 按钮入口真的不存在 |
| 超时 + 页面未变 | 直接抛 NavigationError | 按钮匹配错误 |
| 连续两次同页无路径 | 直接抛 "回退循环" | 不可达页面的无效回退 |

### executePath 逐跳执行

- 每跳：action() 点击 → 6次×800ms 轮询检测页面切换
- 按钮未找到 → 3次×800ms 恢复轮询（可能上一轮点击已生效）→ 仍失败 return null
- 偏离到其他页 → tryCloseModals + 继续轮询
- 超时 + 页面为 null（过渡加载）→ 额外 8×1000ms 延长等待 → 仍 null return false
- 超时 + 页面已知 → tryCloseModals → 还是没到 return false

### performBack 回退层级

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

### 故障恢复

- `tryCloseModals` — 遍历关闭按钮列表（含重连按钮），弹窗/过渡页遮挡时自动点掉
- `pageChange` — 像素网格采样比对，`is()` 识别失败时用作兜底判断页面是否变化
- `verifyAfterChange` — pageChange 判定后二次确认页面身份

### 技术栈

- TypeScript + Webpack 5 + ts-loader + babel-loader
- 目标运行时为 AutoJs6（Android 环境），非 Node.js 或浏览器
- 构建模式为 `production`（压缩输出到 dist/）
