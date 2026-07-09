/**
 * 导航功能测试 — 在真机上运行，验证路由系统各功能
 * 覆盖全部 13 个页面的 is() 检测和路由可达性
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
new 食堂()
new 邮件()

var totalTests = 0
var passedTests = 0

function testGo(target: any, label: string, expectSuccess: boolean = true): boolean {
  totalTests++
  console.log('')
  console.log('  → ' + label)
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

function testSkip(reason: string) {
  console.log('')
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

// ①-② 锚点到基地 → 战斗
testGo(基地, '① 基地')
testPageDetected('基地')
testGo(战斗, '② 战斗')
testPageDetected('战斗')
testAction(function() { return 战斗Page.click_七日突围() }, '战斗 七日突围')

// ③-④ 军团（回头路）
testGo(军团, '③ 军团')
testPageDetected('军团')
testGo(战斗, '④ 回战斗')

// ⑤-⑧ 幸运锦鲤 → 免费福利
var ok_幸运锦鲤 = testGo(幸运锦鲤, '⑤ 幸运锦鲤')
if (ok_幸运锦鲤) {
  testPageDetected('幸运锦鲤')
  var ok_免费福利 = testGo(幸运锦鲤免费福利, '⑥ 幸运锦鲤-免费福利')
  if (ok_免费福利) {
    testPageDetected('幸运锦鲤-免费福利')
    testAction(function() { return 幸运锦鲤免费福利Page.领取奖励() }, '免费福利 领取奖励')
    testGo(幸运锦鲤, '⑦ 回幸运锦鲤')
  } else {
    testSkip('幸运锦鲤-免费福利不可达，跳过⑦')
  }
  testGo(战斗, '⑧ 回战斗')
} else {
  testSkip('幸运锦鲤不可达，跳过⑥⑦⑧')
}

// ⑨-⑪ 侧栏 → 邮件
var ok_侧栏 = testGo(侧栏, '⑨ 侧栏')
if (ok_侧栏) {
  testPageDetected('侧栏')
  var ok_邮件 = testGo(邮件, '⑩ 邮件')
  if (ok_邮件) {
    testPageDetected('邮件')
  } else {
    testSkip('邮件不可达，跳过⑪')
  }
  testGo(战斗, '⑪ 回战斗')
} else {
  testSkip('侧栏不可达，跳过⑩⑪')
}

// ⑫-⑬ 巡逻车
var ok_巡逻车 = testGo(巡逻车, '⑫ 巡逻车')
if (ok_巡逻车) {
  testPageDetected('巡逻车')
  testAction(function() { return 巡逻车Page.领取() }, '巡逻车 领取')
} else {
  testSkip('巡逻车不可达，跳过领取')
}
testGo(基地, '⑬ 回基地')

// ⑭-⑱ 历练大厅 → 寰球救援 → 玩法商店
var ok_历练大厅 = testGo(历练大厅, '⑭ 历练大厅')
if (ok_历练大厅) {
  testPageDetected('历练大厅')
  testGo(寰球救援, '⑮ 寰球救援')
  testGo(历练大厅, '⑯ 回历练大厅')
  var ok_玩法商店 = testGo(玩法商店, '⑰ 玩法商店')
  if (ok_玩法商店) {
    testPageDetected('玩法商店')
  } else {
    testSkip('玩法商店不可达，跳过⑱')
  }
}
testGo(基地, '⑱ 回基地')

// ⑲-⑳ 食堂
var ok_食堂 = testGo(食堂, '⑲ 食堂')
if (ok_食堂) {
  testPageDetected('食堂')
}
testGo(基地, '⑳ 回基地')

// ===============================================================
// Phase 3: 特殊场景
// ===============================================================
console.log('')
console.log('===== Phase 3: 特殊场景 =====')

testGo(基地, '㉑ 重复导航（已在基地）')
testGo(选择技能, '㉒ 不可达（选择技能）', false)

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
