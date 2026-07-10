/**
 * 导航功能测试 — 在真机上运行，验证路由系统各功能
 * 覆盖全部 18 个页面的 is() 检测和路由可达性
 *
 * 构建产物：dist/test-navigation.js
 *
 * 每个测试直接调用 testGo(目标页)，Router 自动处理路由，
 * 不关心当前页面状态、不维护链间状态。
 * 仅子页面（父页面不可达则不可能进入）保留跳过逻辑。
 */

import { Router } from './router/Router'
import { screen } from './utils/img'
import { 战斗 } from './pages/战斗'
import { 基地 } from './pages/基地'
import { 历练大厅 } from './pages/历练大厅'
import { 选择技能 } from './pages/选择技能'
import { 寰球救援 } from './pages/寰球救援'
import { 军团 } from './pages/军团'
import { 幸运锦鲤 } from './pages/幸运锦鲤'
import { 幸运锦鲤免费福利 } from './pages/幸运锦鲤-免费福利'
import { 玩法商店 } from './pages/玩法商店'
import { 侧栏 } from './pages/侧栏'
import { 巡逻车 } from './pages/巡逻车'
import { 食堂 } from './pages/食堂'
import { 邮件 } from './pages/邮件'
import { 个人信息 } from './pages/个人信息'
import { 服务器选择 } from './pages/服务器选择'
import { 异域挑战 } from './pages/异域挑战'
import { 异域挑战军团奖励 } from './pages/异域挑战-军团奖励'
import { 异域挑战个人奖励 } from './pages/异域挑战-个人奖励'
import { 先锋宝藏 } from './pages/先锋宝藏'
import { 每日一刀 } from './pages/每日一刀'
import { 终末危机 } from './pages/终末危机'

var router = Router.getInstance()

new 侧栏()
var 战斗Page = new 战斗()
new 基地()
new 历练大厅()
new 选择技能()
new 寰球救援()
new 军团()
var 幸运锦鲤免费福利Page = new 幸运锦鲤免费福利()
new 幸运锦鲤()
new 玩法商店()
var 巡逻车Page = new 巡逻车()
var 食堂Page = new 食堂()
var 邮件Page = new 邮件()
new 个人信息()
new 服务器选择()
var 异域挑战Page = new 异域挑战()
var 异域挑战军团奖励Page = new 异域挑战军团奖励()
var 异域挑战个人奖励Page = new 异域挑战个人奖励()
var 先锋宝藏Page = new 先锋宝藏()
var 每日一刀Page = new 每日一刀()
var 终末危机Page = new 终末危机()

var totalTests = 0
var passedTests = 0

function testGo(target: any, label: string, expectSuccess: boolean = true): boolean {
  totalTests++
  var start = Date.now()
  try {
    var ok = router.go(target)
    var elapsed = (Date.now() - start) / 1000
    if (ok === expectSuccess) {
      console.log('  ✅ ' + label + ' (' + elapsed.toFixed(1) + 's)')
      passedTests++
      return true
    }
    console.log('  ❌ ' + label + ' — 期望' + (expectSuccess ? '成功' : '失败') + '，实际' + (ok ? '成功' : '失败') + ' (' + elapsed.toFixed(1) + 's)')
    return false
  } catch (e: any) {
    var elapsed = (Date.now() - start) / 1000
    if (!expectSuccess) {
      console.log('  ✅ ' + label + ' — 预期失败 ✓ (' + elapsed.toFixed(1) + 's)')
      console.log('     错误: ' + ((e.constructor ? e.constructor.name : 'Error') || 'Error') + ': ' + e.message)
      passedTests++
      return true
    }
    console.log('  ❌ ' + label + ' (' + elapsed.toFixed(1) + 's)')
    console.log('     错误: ' + ((e.constructor ? e.constructor.name : 'Error') || 'Error') + ': ' + e.message)
    return false
  }
}

function testPageDetected(expectedName: string): boolean {
  totalTests++
  var img = screen()
  var page = router.detectCurrentPage(img)
  var match = page !== null && page.name === expectedName
  if (match) passedTests++
  console.log('  ' + (match ? '✅' : '❌') + ' 页面识别: ' + expectedName + ' → ' + (match ? '匹配' : '实际为 ' + (page ? page.name : '未知')))
  return match
}

function testAction(action: () => boolean, label: string): boolean {
  totalTests++
  var ok = action()
  if (ok) passedTests++
  console.log('  ' + (ok ? '✅' : '❌') + ' 按钮: ' + label)
  return ok
}

function testActionOptional(action: () => boolean, label: string): boolean {
  var ok = action()
  // 不增减 totalTests/passedTests，可选操作找不到不视为失败
  console.log('  ' + (ok ? '✅' : '⏭️') + ' 按钮: ' + label + (ok ? '' : ' （无可操作项）'))
  return ok
}

function testSkip(reason: string) {
  console.log('  ⏭️ 跳过: ' + reason)
}

// ===============================================================
console.log('')
console.log('================================')
console.log('   页面路由测试 — 全量覆盖')
console.log('================================')

var startImg = screen()
console.log('截图尺寸: ' + startImg.width + ' x ' + startImg.height)

// ===============================================================
// Phase 1: 页面识别摸底
// ===============================================================
console.log('')
console.log('===== Phase 1: 页面识别 =====')
var initImg = screen()
var initPage = router.detectCurrentPage(initImg)
console.log('当前识别为: ' + (initPage ? initPage.name : '未知'))

// ===============================================================
// Phase 2: 全页面导航覆盖
// 每个测试独立调用 testGo，Router 自动路由，不维护链间状态
// ===============================================================
console.log('')
console.log('===== Phase 2: 导航覆盖 =====')

// 每个 testGo 独立，Router 自动处理多跳路由和回退，不需要手工"回X"步骤
testGo(基地, '① 基地')
testPageDetected('基地')
testGo(战斗, '② 战斗')
testPageDetected('战斗')
testAction(function() { return 战斗Page.click_七日突围() }, '战斗 七日突围')

// 军团
testGo(军团, '③ 军团')
testPageDetected('军团')

// 每日一刀（从军团进入）
testGo(每日一刀, '㉑ 每日一刀')
testPageDetected('每日一刀')
testActionOptional(function() { return 每日一刀Page.砍一刀() }, '每日一刀 砍一刀')

// 异域挑战 → 军团奖励 → 个人奖励
var ok_异域挑战 = testGo(异域挑战, '⑰ 异域挑战')
if (ok_异域挑战) {
  testPageDetected('异域挑战')
  testAction(function() { return 异域挑战Page.扫荡() }, '异域挑战 扫荡')
  var ok_军团奖励 = testGo(异域挑战军团奖励, '⑱ 异域挑战-军团奖励')
  if (ok_军团奖励) {
    testPageDetected('异域挑战-军团奖励')
    testActionOptional(function() { return 异域挑战军团奖励Page.领取() }, '军团奖励 领取')
    var ok_个人奖励 = testGo(异域挑战个人奖励, '⑲ 异域挑战-个人奖励')
    if (ok_个人奖励) {
      testPageDetected('异域挑战-个人奖励')
        testActionOptional(function() { return 异域挑战个人奖励Page.领取() }, '个人奖励 领取')
    } else {
      testSkip('异域挑战-个人奖励不可达')
    }
  } else {
    testSkip('异域挑战-军团奖励不可达，跳过个人奖励')
  }
} else {
  testSkip('异域挑战不可达，跳过军团奖励和个人奖励')
}

// 幸运锦鲤 → 免费福利
var ok_幸运锦鲤 = testGo(幸运锦鲤, '④ 幸运锦鲤')
if (ok_幸运锦鲤) {
  testPageDetected('幸运锦鲤')
  var ok_免费福利 = testGo(幸运锦鲤免费福利, '⑤ 免费福利')
  if (ok_免费福利) {
    testPageDetected('幸运锦鲤-免费福利')
    testAction(function() { return 幸运锦鲤免费福利Page.领取奖励() }, '免费福利 领取奖励')
  } else {
    testSkip('幸运锦鲤-免费福利不可达')
  }
} else {
  testSkip('幸运锦鲤不可达，跳过免费福利')
}

// 侧栏 → 邮件
var ok_侧栏 = testGo(侧栏, '⑥ 侧栏')
if (ok_侧栏) {
  testPageDetected('侧栏')
  var ok_邮件 = testGo(邮件, '⑦ 邮件')
  if (ok_邮件) {
    testPageDetected('邮件')
    testActionOptional(function() { return 邮件Page.一键领取() }, '邮件 一键领取')
  } else {
    testSkip('邮件不可达')
  }
} else {
  testSkip('侧栏不可达，跳过邮件')
}

// 巡逻车
var ok_巡逻车 = testGo(巡逻车, '⑧ 巡逻车')
if (ok_巡逻车) {
  testPageDetected('巡逻车')
  testActionOptional(function() { return 巡逻车Page.领取() }, '巡逻车 领取')
} else {
  testSkip('巡逻车不可达，跳过领取')
}

// 历练大厅 → 寰球救援 → 玩法商店 → 终末危机
var ok_历练大厅 = testGo(历练大厅, '⑨ 历练大厅')
if (ok_历练大厅) {
  testPageDetected('历练大厅')
  testGo(寰球救援, '⑩ 寰球救援')
  var ok_玩法商店 = testGo(玩法商店, '⑪ 玩法商店')
  if (ok_玩法商店) {
    testPageDetected('玩法商店')
  } else {
    testSkip('玩法商店不可达')
  }
  var ok_终末危机 = testGo(终末危机, '终末危机')
  if (ok_终末危机) {
    testPageDetected('终末危机')
    testAction(function() { return 终末危机Page.扫荡() }, '终末危机 扫荡')
  } else {
    testSkip('终末危机不可达')
  }
}

// 先锋宝藏
var ok_先锋宝藏 = testGo(先锋宝藏, '⑳ 先锋宝藏')
if (ok_先锋宝藏) {
  testPageDetected('先锋宝藏')
} else {
  testSkip('先锋宝藏不可达')
}

// 食堂
testGo(食堂, '⑫ 食堂')
testPageDetected('食堂')
testActionOptional(function() { return 食堂Page.领取() }, '食堂 一键领取')

// 个人信息 → 服务器选择
var ok_个人信息 = testGo(个人信息, '⑬ 个人信息')
if (ok_个人信息) {
  testPageDetected('个人信息')
  var ok_服务器选择 = testGo(服务器选择, '⑭ 服务器选择')
  if (ok_服务器选择) {
    testPageDetected('服务器选择')
  } else {
    testSkip('服务器选择不可达')
  }
} else {
  testSkip('个人信息不可达，跳过服务器选择')
}

// ===============================================================
// Phase 3: 特殊场景
// ===============================================================
console.log('')
console.log('===== Phase 3: 特殊场景 =====')

testGo(基地, '⑮ 重复导航')
testGo(选择技能, '⑯ 不可达（选择技能）', false)

// ===============================================================
console.log('')
console.log('================================')
console.log('   测试完成: ' + passedTests + '/' + totalTests + ' 通过')
if (passedTests === totalTests) {
  console.log('   全部通过 🎉')
} else {
  console.log('   失败: ' + (totalTests - passedTests) + ' 项')
}
console.log('================================')
