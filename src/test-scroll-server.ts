/**
 * 服务器选择 — 滚动列表查找选中服务器测试
 * 构建产物：dist/test-scroll-server.js
 *
 * 验证 scrollFind选中() 方法：
 *   往上翻找选中标识 → 找到则点击 → 找不到则继续翻 → 到底则停止
 */

import { Router } from './router/Router'
import { screen } from './utils/img'
import { 个人信息 } from './pages/个人信息'
import { 服务器选择 } from './pages/服务器选择'

var router = Router.getInstance()

new 个人信息()
var 服务器选择Page = new 服务器选择()

var totalTests = 0
var passedTests = 0

function testGo(target: any, label: string): boolean {
  totalTests++
  var start = Date.now()
  try {
    var ok = router.go(target)
    var elapsed = (Date.now() - start) / 1000
    if (ok) {
      console.log('  ✅ ' + label + ' (' + elapsed.toFixed(1) + 's)')
      passedTests++
      return true
    }
    console.log('  ❌ ' + label + ' (' + elapsed.toFixed(1) + 's)')
    return false
  } catch (e: any) {
    var elapsed = (Date.now() - start) / 1000
    console.log('  ❌ ' + label + ' (' + elapsed.toFixed(1) + 's)')
    console.log('     错误: ' + ((e.constructor ? e.constructor.name : 'Error') || 'Error') + ': ' + e.message)
    return false
  }
}

function testAction(action: () => boolean, label: string): boolean {
  totalTests++
  var ok = action()
  if (ok) passedTests++
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label)
  return ok
}

function testSkip(reason: string) {
  console.log('  ⏭️ 跳过: ' + reason)
}

// ===============================================================
console.log('')
console.log('================================')
console.log('   服务器选择 — 滚动查找测试')
console.log('================================')

var startImg = screen()
console.log('截图尺寸: ' + startImg.width + ' x ' + startImg.height)

var initPage = router.detectCurrentPage(startImg)
console.log('当前页面: ' + (initPage ? initPage.name : '未知'))

// ===============================================================
console.log('')
console.log('===== 导航到 服务器选择 =====')


var ok_服务器选择 = testGo(服务器选择, '服务器选择')
if (ok_服务器选择) {
  console.log('')
  console.log('===== 滚动查找选中服务器 =====')
  testAction(function() { return 服务器选择Page.next() != null }, 'scrollFind选中')
} else {
  testSkip('服务器选择不可达')
}

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
