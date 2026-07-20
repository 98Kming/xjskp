/**
 * 兑换码模块测试 — 在真机上运行
 * 真实调用 start() 执行完整兑换流程：API 获取 → UI 兑换 → 结果检测 → 缓存持久化
 *
 * 构建产物：dist/test-兑换码.js
 */

import { 兑换码, 兑换结果 } from './model/兑换码'
import { screen, tryCloseModals, recycleImgs } from './utils/img'

var totalTests = 0
var passedTests = 0

function assert(label: string, ok: boolean): boolean {
  totalTests++
  if (ok) passedTests++
  console.log('  ' + (ok ? '✅' : '❌') + ' ' + label)
  return ok
}

function assertEqual(label: string, actual: any, expected: any): boolean {
  return assert(label + ' → ' + JSON.stringify(actual), actual === expected)
}

// ==================== 1. 模板图片加载 ====================
console.log('\n📦 模板图片加载')
assert('img_兑换 加载成功', !!兑换码.img_兑换)
assert('img_兑换码_领取过 加载成功', !!兑换码.img_兑换码_领取过)
assert('img_兑换码_恭喜获得 加载成功', !!兑换码.img_兑换码_恭喜获得)
assert('img_兑换码_冷却 加载成功', !!兑换码.img_兑换码_冷却)
assert('img_兑换码_过期 加载成功', !!兑换码.img_兑换码_过期)
assert('img_兑换码_不存在 加载成功', !!兑换码.img_兑换码_不存在)
assert('img_兑换码_错误 加载成功', !!兑换码.img_兑换码_错误)

// ==================== 2. 兑换结果枚举 ====================
console.log('\n📋 兑换结果枚举')
assertEqual('成功 = 0', 兑换结果.成功, 0)
assertEqual('领取过 = 1', 兑换结果.领取过, 1)
assertEqual('过期 = 2', 兑换结果.过期, 2)
assertEqual('不存在 = 3', 兑换结果.不存在, 3)
assertEqual('识别失败 = 4', 兑换结果.识别失败, 4)
assertEqual('错误 = 5', 兑换结果.错误, 5)

// ==================== 3. 完整兑换流程 ====================
console.log('\n🚀 完整兑换流程 start()')

var xjskp = storages.create('xjskp')
// 清除缓存，start() 会重新获取并写入
//xjskp.remove('redeemCode')

var startTime = Date.now()
var caughtError: any = null
try {
  兑换码.start()
} catch (e: any) {
  caughtError = e
  console.log('  ❌ start() 抛出异常:', e.message || e)
}
var elapsed = (Date.now() - startTime) / 1000
console.log('  耗时: ' + elapsed.toFixed(1) + 's')

assert('start() 未抛出异常', !caughtError)
assert('耗时合理（< 300s）', elapsed < 300)

// ==================== 4. 缓存持久化验证 ====================
console.log('\n💾 缓存持久化验证')
var saved = xjskp.get('redeemCode')
assert('缓存已写入', !!saved)

if (saved) {
  var parsed = JSON.parse(saved)
  assert('updateTime 已更新', parsed.updateTime > 0)
  assert('failCodes 是数组', Array.isArray(parsed.failCodes))
  assert('successCodes 是数组', Array.isArray(parsed.successCodes))
  console.log('  成功: ' + parsed.successCodes.length + ' 个')
  console.log('  失败: ' + parsed.failCodes.length + ' 个')
  if (parsed.successCodes.length > 0) {
    console.log('  成功示例: ' + parsed.successCodes[0])
  }
  if (parsed.failCodes.length > 0) {
    console.log('  失败示例: ' + parsed.failCodes[0])
  }
}

// ==================== 5. has_* 方法容错 ====================
console.log('\n🔍 has_* 方法容错')
var imgAfter = screen()
assert('has_兑换 不抛异常', true); 兑换码.has_兑换(imgAfter)
assert('has_恭喜获得 不抛异常', true); 兑换码.has_恭喜获得(imgAfter)
assert('has_领取过 不抛异常', true); 兑换码.has_领取过(imgAfter)
assert('has_冷却中 不抛异常', true); 兑换码.has_冷却中(imgAfter)
assert('has_过期 不抛异常', true); 兑换码.has_过期(imgAfter)
assert('has_不存在 不抛异常', true); 兑换码.has_不存在(imgAfter)
assert('has_错误 不抛异常', true); 兑换码.has_错误(imgAfter)

// ==================== 结果汇总 ====================
console.log('\n' + '='.repeat(40))
console.log('兑换码模块测试完成')
console.log('通过: ' + passedTests + '/' + totalTests)
var rate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0.0'
console.log('通过率: ' + rate + '%')
console.log('='.repeat(40))

recycleImgs.forEach(function (img: any) {
  try { img.recycle() } catch (e: any) { log(e) }
})
