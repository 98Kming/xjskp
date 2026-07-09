# 页面路由系统设计

## 概述

为游戏自动化脚本实现页面路由系统。通过 BFS 寻路 + 逐跳执行，支持 `router.go(目标页面)` 式导航，包含错误恢复机制。

## 架构

```
src/
  router/
    Router.ts      路由引擎（单例，BFS + 执行 + 错误恢复）
    errors.ts      错误类型
  pages/
    BasePage.ts    基类（已有，小幅调整）
    战斗.ts
    基地.ts
    历练大厅.ts
    选择技能.ts
    商店终末危机.ts
    寰球救援.ts
  utils/
    img.ts         已有，新增 createRouteAction / createPageDetector
  main.ts          入口，实例化页面
```

## 核心设计

### BasePage

```typescript
export abstract class BasePage {
  abstract name: string
  abstract is(img: ImageWrapper): boolean

  constructor() {
    Router.getInstance().register(this)  // 构造时自动注册
  }

  routes(): Route[] | void { return [] }
  back(): boolean { return click(100, device.height - 100) }
}
```

### Router（单例）

```
Router.getInstance()             → 单例
Router.register(page)            → 注册页面
Router.go(targetClass)           → 导航到目标页
```

**go() 流程**：
1. `screen()` 截图
2. `detectCurrentPage()` → 遍历所有已注册页面的 `.is()` 找匹配
3. 已在目标页 → return true
4. BFS 寻路找最短路径
5. 逐跳执行：
   - 执行 `route.action()` 点击
   - **轮询验证**（每跳最长 ~5s，每 800ms 截图一次）：
     - 到达目标页 → 继续下一跳
     - 仍在当前页 → 继续等（性能慢）
     - 到了未知页 → 进入错误恢复
   - 超时仍在当前页 → retry action（最多 2 次），仍失败则进入错误恢复
6. 全部完成 → return true

### BFS 寻路

从当前页出发，遍历各页 `routes()` 构建有向图，visited 防循环。不可达抛 `NavigationError`。

### 错误恢复

仅导航跳转失败时触发：
1. 检测网络断开弹窗 → 点重连，继续
2. 未知页面 → `back()` 回退
3. 重新识别当前页
4. 回到已知页 → 重新执行 `go()`
5. 仍失败 → 抛异常

### 错误类型

```typescript
class NavigationError extends Error    // 寻路不可达 / 跳转失败
class UnknownPageError extends Error   // 未知页面
```

### img.ts 新增工具函数

**缓存机制**（全局，以图片路径为 key）：
- `templateCache: Map<string, ImageWrapper>` — 避免重复 read 图片
- `pointCache: Map<string, Point>` — 坐标缓存（对应文件名 cache=1）

**createPageDetector(filePath)**：
- 传入图片路径，返回 `(img) => boolean` 检测函数
- `imageNameParser` 只从路径中取文件名做解析
- 内部走 `getTemplate(filePath)` 统一缓存

**createRouteAction(filePath)**：
- 传入图片路径，返回 `() => boolean` 点击函数
- 若 cache=1 且有缓存坐标 → 直接点击返回
- 否则走图像匹配，命中后缓存坐标（如果 cache=1）再点击

### 启动流程（main.ts）

```typescript
Router.getInstance()
new 战斗()
new 基地()
// ... 所有页面实例化即注册

router.go(基地)
router.go(历练大厅)
```

## 设计决策

- **单例模式**：避免全局传递，页面构造时自动注册
- **BFS 寻路**：页面少，简单可靠
- **轮询验证**：action 后每 800ms 截图验证，最长等 5s，适应性能波动
- **网络断开被动处理**：仅在错误恢复中检查，不在主流程主动检测
- **Rhino 兼容**：无箭头函数/const/解构/装饰器
- **图片缓存以路径为 key**：统一管理模板读取和坐标缓存，适配多级目录
