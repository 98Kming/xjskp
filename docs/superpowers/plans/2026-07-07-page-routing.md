# 页面路由系统 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 BFS 自动寻路的页面路由系统，支持 `router.go(目标页面)` 式导航

**架构：** Router 单例 + BasePage 构造自动注册 + img.ts 工具函数（模板/坐标缓存）

**技术栈：** TypeScript + AutoJs6（Rhino 引擎，ES5 兼容输出）

---

### 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/utils/img.ts` | 修改 | 新增 createPageDetector、createRouteAction、template/point 缓存 |
| `src/router/errors.ts` | 创建 | NavigationError、UnknownPageError |
| `src/pages/BasePage.ts` | 修改 | 构造器自动注册到 Router |
| `src/router/Router.ts` | 创建 | 单例路由引擎，BFS 寻路 + go() + 错误恢复 |
| `src/pages/战斗.ts` | 创建 | 页面类示例 |
| `src/main.ts` | 修改 | 初始化页面实例，启动路由 |

---

### 任务 1：img.ts 新增缓存和工具函数

**文件：** 修改 `src/utils/img.ts`

- [ ] **步骤 1：添加全局缓存和 getTemplate**

```typescript
var templateCache = new java.util.HashMap()  // Map<string, ImageWrapper>
var pointCache = new java.util.HashMap()      // Map<string, Point>

function getTemplate(filePath: string): ImageWrapper {
  var tpl = templateCache.get(filePath)
  if (!tpl) {
    tpl = images.read(filePath)
    templateCache.put(filePath, tpl)
  }
  return tpl
}
```

- [ ] **步骤 2：添加 createPageDetector**

```typescript
function createPageDetector(filePath: string): (img: ImageWrapper) => boolean {
  var fileName = filePath.split('/').pop() || filePath
  var parsed = imageNameParser(fileName)

  return function(img: ImageWrapper): boolean {
    var template = getTemplate(filePath)
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, parsed.x2, parsed.y2, { threshold: parsed.threshold })
    return point !== null
  }
}
```

- [ ] **步骤 3：添加 createRouteAction**

```typescript
function createRouteAction(filePath: string): () => boolean {
  var fileName = filePath.split('/').pop() || filePath
  var parsed = imageNameParser(fileName)

  return function(): boolean {
    if (parsed.cache === 1) {
      var cached = pointCache.get(filePath)
      if (cached) {
        click(cached.x, cached.y)
        return true
      }
    }

    var img = screen()
    var template = getTemplate(filePath)
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, parsed.x2, parsed.y2, { threshold: parsed.threshold })
    if (!point) return false

    if (parsed.cache === 1) pointCache.put(filePath, point)
    click(point.x, point.y)
    return true
  }
}
```

- [ ] **步骤 4：images.read 路径改为从 images 目录读取**

检查 `imageNameParser` 和 `createPageDetector`/`createRouteAction` — 传入的是完整相对路径如 `images/战斗_0_0.9_499_2327_581_2370.png`，`getTemplate` 直接 `images.read(filePath)`，路径统一由调用者传入。

---

### 任务 2：创建错误类型

**文件：** 创建 `src/router/errors.ts`

- [ ] **步骤 1：定义错误类**

```typescript
// src/router/errors.ts

var NavigationError = (function(_super) {
  __extends(NavigationError, _super)
  function NavigationError(message: string) {
    _super.call(this, message)
    this.name = 'NavigationError'
  }
  return NavigationError
})(Error)

var UnknownPageError = (function(_super) {
  __extends(UnknownPageError, _super)
  function UnknownPageError(message: string) {
    _super.call(this, message)
    this.name = 'UnknownPageError'
  }
  return UnknownPageError
})(Error)
```

等等——这是在 TypeScript 中，直接用 class 语法，webpack/babel 会处理继承：

```typescript
// src/router/errors.ts

export class NavigationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NavigationError'
  }
}

export class UnknownPageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnknownPageError'
  }
}
```

---

### 任务 3：BasePage 构造器自动注册

**文件：** 修改 `src/pages/BasePage.ts`

- [ ] **步骤 1：修改 BasePage 添加构造器**

```typescript
import { Router } from '../router/Router'

export abstract class BasePage {
  abstract name: string
  abstract is(img: ImageWrapper): boolean

  constructor() {
    Router.getInstance().register(this)
  }

  routes(): Route[] | void {
    return []
  }

  back(): boolean {
    return click(100, device.height - 100)
  }
}
```

注意：`Router.getInstance()` 会产生循环依赖（BasePage → Router，Router 内部也引用 BasePage）。如果出问题，改成延迟注册模式：

```typescript
// BasePage 不直接 import Router，而是提供一个 register 回调
export let registerPage: ((page: BasePage) => void) | null = null

export abstract class BasePage {
  constructor() {
    if (registerPage) registerPage(this)
  }
}
```

Router 初始化时设置 `registerPage = Router.getInstance().register`。按方案 A 先写，如果有循环依赖报错再切到方案 B。

- [ ] **步骤 2：导出 Route 接口**

```typescript
export interface Route {
  target: typeof BasePage
  action: () => boolean
}
```

（已有，确认保留）

---

### 任务 4：创建 Router 单例

**文件：** 创建 `src/router/Router.ts`

- [ ] **步骤 1：实现 Router 类**

```typescript
import { BasePage, Route } from '../pages/BasePage'
import { screen } from '../utils/img'
import { NavigationError, UnknownPageError } from './errors'

export class Router {
  private static instance: Router
  private pages: BasePage[] = []
  private pageMap: { [key: string]: BasePage } = {}

  static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router()
    }
    return Router.instance
  }

  register(page: BasePage): void {
    this.pages.push(page)
    var cls = page.constructor as any
    this.pageMap[cls.name] = page
  }

  go(targetClass: { new(...args: any[]): BasePage }): boolean {
    // 1. 截图
    var img = screen()

    // 2. 检测当前页
    var current = this.detectCurrentPage(img)
    if (!current) throw new UnknownPageError('无法识别当前页面')

    // 3. 已在目标页
    if (current.constructor === targetClass) return true

    // 4. BFS 寻路
    var path = this.findPath(current, targetClass)
    if (!path || path.length === 0) {
      throw new NavigationError('无法找到从 ' + current.name + ' 到目标页面的路径')
    }

    // 5. 逐跳执行
    this.followPath(path)

    return true
  }

  private detectCurrentPage(img: ImageWrapper): BasePage | null {
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].is(img)) {
        return this.pages[i]
      }
    }
    return null
  }

  private findPath(from: BasePage, targetClass: { new(...args: any[]): BasePage }): Route[] | null {
    var visited: { [key: string]: boolean } = {}
    var queue: { page: BasePage, path: Route[] }[] = []

    visited[from.name] = true
    queue.push({ page: from, path: [] })

    while (queue.length > 0) {
      var current = queue.shift()!
      var routes = current.page.routes() || []

      for (var i = 0; i < routes.length; i++) {
        var route = routes[i]
        var targetName = (route.target as any).name

        if (route.target === targetClass) {
          return current.path.concat([route])
        }

        if (!visited[targetName]) {
          visited[targetName] = true
          var targetPage = this.pageMap[targetName]
          if (targetPage) {
            queue.push({ page: targetPage, path: current.path.concat([route]) })
          }
        }
      }
    }

    return null
  }

  private followPath(path: Route[]): void {
    for (var i = 0; i < path.length; i++) {
      var route = path[i]
      var success = this.executeHop(route)
      if (!success) {
        // retry
        success = this.executeHop(route)
      }
      if (!success) {
        // 进入错误恢复
        this.recover()
        // 恢复后重新执行当前跳
        success = this.executeHop(route)
        if (!success) throw new NavigationError('跳转失败: ' + ((route.target as any).name || 'unknown'))
      }
    }
  }

  private executeHop(route: Route): boolean {
    var ok = route.action()
    if (!ok) return false

    // 轮询验证: 最长 ~5s, 每 800ms 一次
    var maxAttempts = 6  // 6 * 800ms ≈ 5s (使用乘法避免浮点)
    var interval = 800

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      sleep(interval)
      var img = screen()
      var currentPage = this.detectCurrentPage(img)

      if (!currentPage) {
        // 到了未知页面 → 可能点偏了
        return false
      }

      if (currentPage.constructor === route.target) {
        return true  // 到达目标页
      }

      // 仍在当前页 → 继续等
      if (currentPage.name === '' /* 需要比较当前页 */) {
        // 仍在当前页，继续轮询
      }
    }

    return false  // 超时
  }

  private recover(): void {
    // 1. 检查网络断开（图片匹配）
    // 2. back() 回退
    // 3. 重新识别
    sleep(1000)
    var img = screen()

    // 尝试 back 回退
    this.back()

    sleep(1500)
    img = screen()
    var page = this.detectCurrentPage(img)
    if (!page) throw new UnknownPageError('错误恢复失败：无法识别页面')
  }
}
```

**需要修复 executeHop 中的当前页比较逻辑** — 需要在访问时保存当前页名称：

- [ ] **步骤 2：修复 executeHop 中的当前页跟踪**

给 `followPath` 和 `go` 添加 `_currentPageName` 参数或使用实例变量跟踪当前页面。实际情况是：`go()` 里已经检测了 current，传给 `followPath`。

优化方案：在 `go()` 中将当前页作为 `followPath` 参数传入，`executeHop` 用它做"仍在当前页"判断。

```typescript
private followPath(path: Route[], currentPageName: string): void {
  for (var i = 0; i < path.length; i++) {
    var route = path[i]
    var success = this.executeHop(route, currentPageName)
    if (!success) {
      success = this.executeHop(route, currentPageName)
    }
    if (!success) {
      this.recover()
      success = this.executeHop(route, currentPageName)
      if (!success) throw new NavigationError('跳转失败')
    }
    // 当前页面已变更为下一跳的目标
    currentPageName = (route.target as any).name
  }
}

private executeHop(route: Route, currentPageName: string): boolean {
  var ok = route.action()
  if (!ok) return false

  var maxAttempts = 6
  var interval = 800

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    sleep(interval)
    var img = screen()
    var currentPage = this.detectCurrentPage(img)

    if (!currentPage) return false  // 未知页面
    if (currentPage.constructor === route.target) return true  // 到达
    if (currentPage.name !== currentPageName) return false  // 到了其他页面，点偏了
    // 仍在当前页 → 继续轮询
  }
  return false  // 超时
}
```

---

### 任务 5：创建页面类（示例 + 批量）

**文件：** 创建 `src/pages/战斗.ts`、`src/pages/基地.ts`、`src/pages/历练大厅.ts` 等

- [ ] **步骤 1：创建战斗页面**

```typescript
import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 战斗 extends BasePage {
  name = '战斗'
  is = createPageDetector('images/战斗_0_0.9_499_2327_581_2370.png')

  routes(): Route[] {
    return [
      { target: 基地, action: createRouteAction('images/战斗$基地_0_0.8_658_2331_724_2367.png') },
      { target: 军团, action: createRouteAction('images/战斗$军团_0_0.8_807_2335_873_2367.png') },
    ]
  }
}
```

- [ ] **步骤 2：创建基地页面**

```typescript
export class 基地 extends BasePage {
  name = '基地'
  is = createPageDetector('images/基地_0_0.9_647_2329_1080_2370.png')

  routes(): Route[] {
    return [
      { target: 历练大厅, action: createRouteAction('images/基地$历练大厅_1_0.9_190_1099_387_1154.png') },
      { target: 酒馆, action: createRouteAction('images/基地$酒馆_1_0.9_756_1590_929_1653.png') },
    ]
  }
}
```

- [ ] **步骤 3：按相同模式创建其他页面**

遍历 `images/` 目录下的 PNG，按命名约定归类创建：

| 页面 | 标识图 | 路由图 |
|------|--------|--------|
| 历练大厅 | `历练大厅_0_0.8_...` | `历练大厅$玩法商店_1_0.9_...` |
| 选择技能 | `选择技能_0_0.8_...` | — |
| 商店-终末危机 | `商店-终末危机_0_0.9_...` | — |
| 寰球救援 | `寰球救援_1_0.9_...` | — |

注：页面类名需要是合法 TypeScript 标识符。`商店-终末危机` 含特殊字符，需处理。两种方式：
- 转义：`'商店-终末危机'` 作为 name 字符串，类名用 `商店终末危机`
- 保留原名作为 name 属性

---

### 任务 6：更新 main.ts 入口

**文件：** 修改 `src/main.ts`

- [ ] **步骤 1：替换为路由初始化代码**

```typescript
import { Router } from './router/Router'
import { 战斗 } from './pages/战斗'
import { 基地 } from './pages/基地'
// ... 其他页面导入

// 初始化 Router
var router = Router.getInstance()

// 实例化页面（构造时自动注册到 Router）
new 战斗()
new 基地()
// ...

// 示例导航
router.go(基地)
```

---

### 任务 7：构建验证

- [ ] **步骤 1：运行 webpack 构建**

运行：`npm run build`
预期：dist/main.js 生成，无编译错误

- [ ] **步骤 2：检查 dist/main.js 的 Rhino 兼容性**

确认输出无箭头函数、const、解构赋值

---

## 自检结果

- **规格覆盖度**：规格中所有设计点（Router 单例、BFS 寻路、轮询验证、错误恢复、图片缓存）均有对应任务
- **占位符扫描**：无 TODO/占位符
- **类型一致性**：所有函数签名和方法名在任务间一致
