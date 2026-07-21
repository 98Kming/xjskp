/**
 * 主窗口功能测试 — 在真机上运行，验证 MainWindow 构造、视图绑定、表单规则、配置模型
 *
 * 构建产物：dist/test-main-window.js
 *
 * 测试范围：
 * - MainWindow 构造、show/hide
 * - MainWindowView 全部字段可访问
 * - formRules 按 GameType 切换可见性
 * - GameConfig 校验
 * - 自定义 widget 注册
 */

import { mainWindow, GameConfig, GameType, MainWindowView } from "./MainWindow"
import { driverInstance } from "../component/ReactiveFormDriver"
// 保持脚本存活，等待测试完成
var keepAlive = setInterval(function () {}, 10000)
var totalTests = 0
var passedTests = 0

function assert(condition: boolean, label: string): boolean {
  totalTests++
  if (condition) {
    console.log("  ✅ " + label)
    passedTests++
    return true
  }
  console.log("  ❌ " + label)
  return false
}

function assertThrows(fn: () => void, label: string): boolean {
  totalTests++
  try {
    fn()
    console.log("  ❌ " + label + " — 期望抛出异常但未抛出")
    return false
  } catch (e: any) {
    if (e.message && e.message.indexOf("ScriptInterruptedException") >= 0) throw e
    console.log("  ✅ " + label)
    passedTests++
    return true
  }
}

function assertNotThrows(fn: () => void, label: string): boolean {
  totalTests++
  try {
    fn()
    console.log("  ✅ " + label)
    passedTests++
    return true
  } catch (e: any) {
    if (e.message && e.message.indexOf("ScriptInterruptedException") >= 0) throw e
    console.log("  ❌ " + label + " — 抛出意外异常: " + (e.constructor ? e.constructor.name : "Error") + ": " + e.message)
    return false
  }
}

// ===============================================================
console.log("")
console.log("================================")
console.log("   主窗口功能测试")
console.log("================================")

// ===============================================================
// Phase 1: MainWindow 构造与基础操作
// ===============================================================
console.log("")
console.log("===== Phase 1: 构造与基础操作 =====")

assertNotThrows(function () {
  mainWindow.show()
}, "mainWindow.show() 正常执行")

assertNotThrows(function () {
  mainWindow.hide()
}, "mainWindow.hide() 正常执行")

// 再次 show 供后续测试使用
mainWindow.show()

assert(mainWindow.window !== null && mainWindow.window !== undefined, "mainWindow.window 已初始化")

// ===============================================================
// Phase 2: MainWindowView 视图字段可访问
// ===============================================================
console.log("")
console.log("===== Phase 2: 视图绑定 =====")

var win = mainWindow.window
var checkFields: (keyof MainWindowView)[] = [
  "viewPager",
  "tabHost",
  "模式",
  "开局闪退",
  "执行次数",
  "选择关卡",
  "退出等级",
  "开始游戏",
  "组队",
  "组队_功能",
  "enable_组队",
  "队长",
  "队友信息",
  "自动邀请",
  "自动接受邀请",
  "队友名称",
  "获取队友信息",
  "超时退出",
  "开启倍速",
  "启动",
  "最小化",
  "退出",
  "识别技能",
  "重置技能优先级",
  "邮件",
  "好友_领取体力",
  "好友_一键赠送",
  "先锋宝藏_特惠战令",
  "先锋宝藏_免费抽",
  "碧海凉夏_免费抽",
  "作战计划_签到",
  "寰球救援_领票",
  "商店_超时空军团兵碎片",
  "食堂",
  "军团_每日一刀",
  "军团_异域挑战",
  "军团_军团商店",
  "闪退19次",
  "开始任务",
  "兑换码",
]

var allFieldsAccessible = true
for (var i = 0; i < checkFields.length; i++) {
  var key = checkFields[i]
  var val = win[key]
  if (val === null || val === undefined) {
    console.log("  ❌ 字段未绑定: " + key)
    allFieldsAccessible = false
  }
}
assert(allFieldsAccessible, "MainWindowView 全部 " + checkFields.length + " 个字段可访问")

// 检查 Tab 布局
assert(win.viewPager !== null && typeof win.viewPager.setTitles === "function", "viewPager 已绑定")
assert(win.tabHost !== null && typeof win.tabHost.setupWithViewPager === "function", "tabHost 已绑定")

// 检查特定字段类型
assert(typeof win.退出.setOnClickListener === "function", "退出 按钮有 setOnClickListener")

// ===============================================================
// Phase 3: 技能 SeekBar 字段可访问
// ===============================================================
console.log("")
console.log("===== Phase 3: 技能 SeekBar =====")

var seekBarFields: (keyof MainWindowView)[] = [
  "子弹_seekbar",
  "元素子弹_seekbar",
  "温压弹_seekbar",
  "干冰弹_seekbar",
  "电磁穿刺_seekbar",
  "装甲车_seekbar",
  "冰暴发生器_seekbar",
  "旋风加农_seekbar",
  "燃油弹_seekbar",
  "无人机_seekbar",
]

var seekBarsAccessible = true
for (var j = 0; j < seekBarFields.length; j++) {
  var sk = seekBarFields[j]
  if (win[sk] === null || win[sk] === undefined) {
    console.log("  ❌ seekbar 未绑定: " + sk)
    seekBarsAccessible = false
  }
}
assert(seekBarsAccessible, "全部 " + seekBarFields.length + " 个技能 seekbar 可访问")

// ===============================================================
// Phase 4: GameConfig 配置模型
// ===============================================================
console.log("")
console.log("===== Phase 4: GameConfig =====")

// 验证抽象类不可直接实例化（TypeScript 保证编译期检查）

// 验证 validateConfig() 对非法 type 抛出异常
class TestConfig extends GameConfig {
  type: GameType = undefined as any  // 非法 type
  enableStart: boolean = true
}
var testConfig = new TestConfig()
// extends GameConfig 不存在子类时 testConfig 可能为 undefined
assert(testConfig !== null, "GameConfig 子类可实例化")

// 验证有效 type 不抛异常
class ValidConfig extends GameConfig {
  type: GameType = GameType.普通关卡
  enableStart: boolean = true
}
var validConfig = new ValidConfig()
assertNotThrows(function () { validConfig.validateConfig() }, "validateConfig() 有效 GameType 不抛异常")

// 验证非法 type 抛异常
assertThrows(function () { testConfig.validateConfig() }, "validateConfig() 无效 GameType 抛出异常")

// 验证 runNum 默认值
assert(validConfig.runNum === -1, "runNum 默认值为 -1")
assert(validConfig.selectStage === 0, "selectStage 默认值为 0")
assert(validConfig.exitLevel === 0, "exitLevel 默认值为 0")
assert(validConfig.timeOut === 0, "timeOut 默认值为 0")
assert(validConfig.enableStart === true, "enableStart 默认值为 true")
assert(validConfig.identifySkill === false, "identifySkill 默认值为 false")

// 可修改性验证
validConfig.runNum = 5
assert(validConfig.runNum === 5, "runNum 可修改为 5")
validConfig.selectStage = 3
assert(validConfig.selectStage === 3, "selectStage 可修改为 3")

// ===============================================================
// Phase 5: formRules 可见性规则
// ===============================================================
console.log("")
console.log("===== Phase 5: 表单可见性规则 =====")

// 验证 driverInstance 已加载规则
assertNotThrows(function () { driverInstance.setState(GameType.普通关卡, true) }, "driverInstance.setState(普通关卡, true) 正常执行")

// 验证重置状态
assertNotThrows(function () { driverInstance.setState(GameType.普通关卡, false) }, "driverInstance.setState(普通关卡, false) 正常执行")

// 开局闪退: 对普通关卡/精英关卡显示
assertNotThrows(function () {
  driverInstance.setState(GameType.普通关卡, true)
  driverInstance.setState(GameType.元素试炼, false)
}, "设置 GameType.普通关卡 可见状态")

// 验证切换 GameType 后再次设置不抛异常
assertNotThrows(function () {
  driverInstance.setState(GameType.元素试炼, true)
  driverInstance.setState(GameType.普通关卡, false)
}, "切换 GameType 到 元素试炼")

// ===============================================================
// Phase 6: Widget 注册
// ===============================================================
console.log("")
console.log("===== Phase 6: Widget 注册 =====")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-checkbox id="test-checkbox" /></vertical>')
}, "pref-checkbox widget 可用")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-switch id="test-switch" /></vertical>')
}, "pref-switch widget 可用")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-num-input id="test-num-input" /></vertical>')
}, "pref-num-input widget 可用")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-enable-num-input id="test-enable-num-input" /></vertical>')
}, "pref-enable-num-input widget 可用")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-num-seekbar id="test-num-seekbar" /></vertical>')
}, "pref-num-seekbar widget 可用")

assertNotThrows(function () {
  ui.inflate('<vertical><pref-spinner id="test-spinner" /></vertical>')
}, "pref-spinner widget 可用")

// ===============================================================
// Phase 7: GameType 枚举完整性
// ===============================================================
console.log("")
console.log("===== Phase 7: GameType 枚举 =====")

var gameTypeValues = Object.values(GameType) as string[]
assert(gameTypeValues.length >= 5, "GameType 至少有 5 个值")
assert(gameTypeValues.indexOf("普通关卡") >= 0, "GameType 包含 普通关卡")
assert(gameTypeValues.indexOf("精英关卡") >= 0, "GameType 包含 精英关卡")
assert(gameTypeValues.indexOf("寰球救援") >= 0, "GameType 包含 寰球救援")
assert(gameTypeValues.indexOf("元素试炼") >= 0, "GameType 包含 元素试炼")
assert(gameTypeValues.indexOf("寰球远征_准备") >= 0, "GameType 包含 寰球远征_准备")

// ===============================================================
console.log("")
console.log("================================")
console.log("   测试完成: " + passedTests + "/" + totalTests + " 通过")
if (passedTests === totalTests) {
  console.log("   全部通过")
} else {
  console.log("   失败: " + (totalTests - passedTests) + " 项")
}
console.log("================================")
