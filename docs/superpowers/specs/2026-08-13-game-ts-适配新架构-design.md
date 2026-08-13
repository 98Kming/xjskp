# Game.ts 适配新架构设计

日期：2026-08-13
状态：已批准

## 背景

`src/model/Game.ts` 是废弃代码（引用已删除的 `../pages/public`、`../global`、`../util`），当前 import 全注释、57 个编译错误。新架构已就位：`pages/` 页面对象（战斗中/暂停战斗/战斗结束/选择技能）、`utils/img.ts`（imageDetector/带缓存 action/find_队友/select_队友/tryCloseModals）、Router 单例、`utils/技能策略.ts`（weightDecay）。

本次目标：把 Game 的战斗主控（状态机、循环、倍速、等级、提前退出、超时）适配到新架构，恢复编译，并在 main.ts 接入。

用户决策：
- 精英掉落弹窗处理：**暂不处理**（旧 `page_精英掉落` 移除）
- 组队流程：**单机优先，组队兼容**（保留框架，缺失检测后续补）

## 方案

方案 A（已批准）：Game 保留状态机结构，页面操作委托给新页面实例；main.ts 新增 GameConfig 子类从 UI 读值接入。

## 设计

### 1. 依赖与页面实例

```ts
import { GameConfig, GameType } from '../MainWindow'
import { smallWindow } from '../SmallWindows'
import { Router } from '../router/Router'
import { screen, tryCloseModals, select_队友, getTemplate } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from '../pages/战斗中'
import { 暂停战斗 } from '../pages/暂停战斗'
import { 战斗结束 } from '../pages/战斗结束'
import { 选择技能 } from '../pages/选择技能'
import { 寰球救援 } from '../pages/寰球救援'
import { 战斗 } from '../pages/战斗'
```

Game 类内部持有页面实例（字段）。实例 new 时会重复注册到 Router（Router.register 不去重），但仅增加几次 is() 调用，无功能影响；Router.go() 内部自行 new 实例。

### 2. 战斗循环适配

**倍速**：删除旧多点找色（colors_倍速/倍速_point），改用 `战斗中.已开15倍速()/开15倍速()`：

```ts
private 倍速() {
  if (this.enable_倍速) return
  if (战斗中Page.已开15倍速()) {
    this.enable_倍速 = true
  } else {
    战斗中Page.开15倍速()
  }
}
```

**等级**：`currentLevel` 改用 `战斗中.等级()`（OCR 暂停按钮右侧区域），保留 Game 层 level 缓存：

```ts
private currentLevel(img: ImageWrapper): number {
  if (!this.level && 战斗中Page.暂停_point) {
    this.level = 战斗中Page.等级()
    console.log("ocr level: " + this.level)
  }
  return this.level
}
```

**hasUplayer**：`pages/战斗中.ts` 新增方法，用暂停模板中心点像素判断被上层窗口遮挡：

```ts
/** 暂停按钮处像素不再是按钮色 → 有上层窗口遮挡 */
hasUplayer(img: ImageWrapper): boolean {
  let p = this.暂停_point
  return !!p && !colors.isSimilar(img.pixel(p.x + 18, p.y + 18), '#ffffff', 10)
}
```

偏移 +18 为模板中心估计值，**需真机验证**（旧代码 +5，模板尺寸不同）。

**battleHandler 映射**：

| 旧页面 | 新实现 |
|--------|--------|
| `page_选择技能.is/back` | `选择技能Page.is(img)` + `selectSkill(img, identifySkill)`；失败不点底部兜底，下轮重试 |
| `page_精英掉落` | 去掉（暂不处理） |
| `page_暂停`（继续/退出） | `暂停战斗Page.is` + `.继续()` / `.结束战斗()` |
| `page_返回`（战斗结束） | `战斗结束Page.is` + `.back()`，reset() 后落回 return false（保持旧行为） |
| `page_重新连接` | `tryCloseModals()`（已含重新连接/跳过/关闭等通用弹窗） |
| 关闭_point（聊天框） | 保留兜底：点击屏幕底部 |

选择技能弹窗内等级提升逻辑保留：`selectSkill(...) && Date.now() - this.startTime > 6000 && this.level && this.level++`（6 秒内视为头选宝石效果）。

**start() 主循环**改动点：
- `page_战斗中.is(screen.capture())` → `战斗中Page.is(screen())`
- `screen.capture()` → `screen()`
- `page_战斗中.hasUplayer(img)` → `战斗中Page.hasUplayer(img)`
- `page_战斗中.back()`（超时/提前退出）→ `战斗中Page.暂停()`（点暂停按钮弹面板）
- 循环终止条件、runNum 计数、reset() 保持不变

### 3. 准备流程适配

- `prepare_普通关卡`：`gameConfig.enableStart && Router.getInstance().go(战斗中)`
- `prepare_精英关卡`/`prepare_寰球救援`：保留队长/队员分支结构，`PageRoute.goto(page_X, 1, 1)` → `Router.getInstance().go(X)`（新 Router.go 无第二、三参数）
- `prepare_元素试炼`：保留找图点击逻辑，`screen.capture()` → `screen()`，`images.read` → `getTemplate`（带缓存与路径兜底）
- **组队兼容**：
  - `队长_准备`：teammate 校验保留（undefined 时 toast+throw）；`退队_point` 检测 → TODO；邀请 → `select_队友(teammate)` 找到后点击 + sleep(2000)；循环直到离开组队页 → TODO（组队邀请页对象未建，见 2026-08-12-组队邀请页面-design.md）
  - `队员_准备`：`副本邀请_point` 检测 → TODO；接受邀请 → `select_队友(teammate)` 点击 + sleep(1200)

### 4. main.ts 接入

新增 `UiGameConfig extends GameConfig`，构造时从 UI 读值：
- type ← `模式.getSelectedItem() as GameType`
- runNum ← `执行次数.getValue() || -1`（RUN_FOREVER）
- exitLevel ← `退出等级.getValue() || 0`
- timeOut ← `超时退出.getValue() || 0`
- enableStart ← `开始游戏.isChecked()`
- enableTeam ← `enable_组队.isChecked()`
- isLeader ← `队长.isChecked()`
- invite ← `自动邀请.isChecked()`
- acceptInvite ← `自动接受邀请.isChecked()`
- identifySkill ← `识别技能.isChecked()`
- teammate ← TODO（获取队友信息按钮未绑定，需外部注入 Teammate）

启动按钮改为：

```ts
if (tab == 2) { start(runDaily); return }
start(function () {
  new Game(new UiGameConfig()).start()
})
```

即功能页所有模式（普通/精英/寰球救援/元素试炼）都走 Game；`寰球远征_准备` 模式在 Game.start() 中无对应分支（旧行为，落空）。

### 5. 遗留 TODO（本轮不做）

- 精英掉落弹窗处理（旧 `page_精英掉落`）
- 退队检测（旧 `退队_point`）、副本邀请弹窗检测（旧 `副本邀请_point`）
- 组队邀请页对象（组队邀请-好友/推荐）与「获取队友信息」UI 流程
- hasUplayer 偏移量、等级 OCR 区域需真机验证

## 测试

- `npm run build` 通过（0 编译错误）
- test/skill-test.ts 现有技能策略测试保持通过
- 真机验证项：倍速、等级 OCR、hasUplayer、四种准备流程、组队邀请
