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

后缀 `_{0|1}_(0-1]_{x1}_{y1}_{x2}_{y2}` 用于 `images.findImageInRegion`：
- `{0|1}` — 缓存模式：`0` 不缓存坐标，`1` 缓存坐标
- `(0-1]` — 匹配阈值（如 `0.9`）
- `{x1}_{y1}_{x2}_{y2}` — 搜索区域；`w`=屏幕宽度，`h`=屏幕高度

**前缀规则：分隔符后带 `_` 则兼作页面识别**

| 前缀 | 含义 | 能否用于 `is()`？ |
|------|------|:---:|
| `{A}${B}` | 从页面A到页面B的跳转按钮 | ❌ 纯点击坐标 |
| `{A}$_{B}` | A的页面识别图 + A→B跳转按钮 | ✅ |
| `{A}$${按钮}` | 页面A内的按钮 | ❌ 纯点击坐标 |
| `{A}$$_{按钮}` | A的页面识别图 + A内按钮坐标 | ✅ |
| `{A}_{标识}` | A的纯页面识别图 | ✅ |
| `{A}_{元素}` | A上的普通元素，不作识别 | ❌ |
| `${按钮}` | 通用按钮，无页面归属 | ❌ |
| `_{标识}` | 通用标识，无页面归属 | ✅ |

**一句话：`$`/`$$` 后面紧跟着 `_` 的才能当页面识别用。** 我上次选 `$$免费`（无 `_`）是错的，应该选 `$$_开始游戏`（有 `_`）。

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
- 每个测试独立调用 `testGo(目标页)`，Router 自动处理多跳路由和回退，不手工写"回X"步骤
- 仅子页面（需从父页面进入）保留跳过：父页面不可达时，子页面测试跳过
- `testSkip(reason)` 跳过时不计入 `totalTests`，防止通过率虚低
- `testGo` 不打印 "→ label"，Router 的 `[导航 前往]` 替代了分隔和声明作用

## Router 路由引擎

核心文件：[src/router/Router.ts](src/router/Router.ts)、[src/pages/BasePage.ts](src/pages/BasePage.ts)、[src/router/errors.ts](src/router/errors.ts)
完整设计文档：[docs/superpowers/specs/2026-07-09-router-design.md](docs/superpowers/specs/2026-07-09-router-design.md)

### 技术栈

- TypeScript + Webpack 5 + ts-loader + babel-loader
- 目标运行时为 AutoJs6（Android 环境），非 Node.js 或浏览器
- 构建模式为 `production`（压缩输出到 dist/）

### 路由效率原则

**保证稳定性的前提下，尽量减少找图次数。** `images.findImageInRegion` 和 `detectCurrentPage`（遍历全部页面调 `is()`）是性能瓶颈，任何路由优化优先减少其调用次数，而非缩短等待时间。
- pageChange 像素采样（20×20 网格）比找图轻量，作为"页面已变"信号
- 检测到变化后 **等稳定 + 只查 1 次**，不降间隔不跳出轮询
- 图片的 cache=1 优先使用，复用坐标比重新找图高效
