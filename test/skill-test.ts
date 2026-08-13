// test/skill-test.ts — 自动选择技能流程测试（真机运行）
// 运行：AutoJs6 打开 dist/skill-test.js 执行
// 状态一：设备停在技能选择弹窗（3 卡或 4 卡）→ 完整流程测试（解析→策略排序→自动选择→验证弹窗关闭回战斗中）
// 状态二：不在弹窗 → 空/边界测试 + 提示手动进入弹窗后重跑
// 注意：完整流程会真实点击选中技能（游戏继续战斗），请在技能弹窗出现时运行
import { Router } from '../src/router/Router'
import { 选择技能 } from '../src/pages/选择技能'
import { 暂停战斗 } from '../src/pages/暂停战斗'
import { 战斗中 } from '../src/pages/战斗中'
import { 战斗结束 } from '../src/pages/战斗结束'
import { screen } from '../src/utils/img'
import { mainWindow } from '../src/MainWindow'
import { skillStrategy } from '../src/utils/技能策略'

// 注册页面（顺序与 daily.ts 一致：选择技能 > 暂停战斗 > 战斗中 > 战斗结束）
var router = Router.getInstance()
new 选择技能()
new 暂停战斗()
new 战斗中()
new 战斗结束()

var 技能页 = new 选择技能()
var total = 0
var pass = 0

function assert(cond: boolean, label: string): void {
  total++
  if (cond) {
    pass++
    console.log('✅ ' + label)
  } else {
    console.log('❌ ' + label)
  }
}

function summary(): void {
  console.log('')
  console.log('================================')
  console.log('   结果: ' + pass + '/' + total + ' 通过')
  console.log('================================')
}
mainWindow.hide()
sleep(500)
console.log('')
console.log('===== 自动选择技能测试 =====')
console.log('状态: ' + (技能页.is(screen()) ? '在技能弹窗' : '不在技能弹窗'))

if (!技能页.is(screen())) {
  // ===== 不在弹窗：空/边界测试 =====
  console.log('')
  console.log('--- 空/边界: 不在技能弹窗 ---')
  // var cards: any[] = (技能页 as any).卡片列表()
  // assert(cards.length === 0, '卡片列表为空（不误识别弹窗外的怪物名/标题文字）')
  // assert(技能页.技能排序().length === 0, '技能排序为空')
  // assert(!技能页.选技能(1), '选技能(1) 返回 false 不误点')
  // assert(!技能页.选技能(0), '选技能(0) 越界返回 false')
  // assert(!技能页.选技能(9), '选技能(9) 越界返回 false')
  // assert(!技能页.选最优技能(), '选最优技能返回 false 不误点')
  console.log('')
  console.log('--- 技能策略: weightDecay 每次选择后权重衰减 ---')
  var 技能名 = '每次射击连发数+1' // 命中规则 /.*每.*发.*数.*/
  var 规则引用 = skillStrategy.weight(技能名).match
  var 条目: any = null
  var 策略s: any[] = (skillStrategy as any).STRATEGY
  for (var i = 0; i < 策略s.length; i++) {
    if (策略s[i].match === 规则引用) { 条目 = 策略s[i]; break }
  }
  assert(!!条目, '找到连发规则条目')
  skillStrategy.resetPriority()
  条目.weightDecay = 100
  var w0 = skillStrategy.weight(技能名).weight
  skillStrategy.onSelected(规则引用)
  var w1 = skillStrategy.weight(技能名).weight
  assert(w1 === w0 - 100, '选中1次后权重减100: ' + w0 + ' → ' + w1)
  skillStrategy.onSelected(规则引用)
  var w2 = skillStrategy.weight(技能名).weight
  assert(w2 === w0 - 200, '选中2次后权重再减100: ' + w1 + ' → ' + w2)
  skillStrategy.resetPriority()
  var w3 = skillStrategy.weight(技能名).weight
  assert(w3 === w0, 'resetPriority 后权重恢复: ' + w2 + ' → ' + w3)
  delete 条目.weightDecay

  console.log('')
  console.log('提示: 手动进入技能弹窗后重跑本脚本，执行完整流程测试')
  summary()
} else {
  // ===== 在弹窗：完整流程测试 =====
  console.log('')
  console.log('--- 页面识别 ---')
  var page = router.detectCurrentPage(screen())
  assert(!!page && page.name === '选择技能', 'Router 识别当前页为 选择技能（而非 战斗中）')

  console.log('')
  console.log('--- 卡片解析 ---')
  // var cards: any[] = (技能页 as any).卡片列表()
  // assert(cards.length === 3 || cards.length === 4, '卡片数量为 3 或 4，实际: ' + cards.length)
  // for (var i = 0; i < cards.length; i++) {
  //   var c = cards[i]
  //   assert(!!c.名, '卡' + (i + 1) + ' 技能名非空: [' + c.名 + ']')
  //   assert(c.文.indexOf(c.名) >= 0, '卡' + (i + 1) + ' 文字包含技能名')
  //   assert(c.点[0] >= 0 && c.点[0] <= 1080 && c.点[1] > 700 && c.点[1] < 1900,
  //     '卡' + (i + 1) + ' 点击点在弹窗内 (' + c.点[0] + ',' + c.点[1] + ')')
  //   console.log('  卡' + (i + 1) + ' [' + c.名 + '] 文[' + c.文 + ']')
  // }

  // console.log('')
  // console.log('--- 策略排序 ---')
  // var 评分: any[] = (技能页 as any).卡片评分(cards)
  // assert(评分.length === cards.length, '排序结果数 = 卡片数')
  // var 降序 = true
  // for (var i = 1; i < 评分.length; i++) {
  //   if (评分[i - 1].权重 < 评分[i].权重) 降序 = false
  // }
  // assert(降序, '权重降序排列')
  // for (var i = 0; i < 评分.length; i++) {
  //   var 卡 = cards[评分[i].序号]
  //   console.log('  第' + (i + 1) + '优: 卡' + (评分[i].序号 + 1) + ' [' + 卡.名 + '] 权重=' + 评分[i].权重 +
  //     ' 规则=' + (评分[i].规则 ? 评分[i].规则.source : '无'))
  // }

  console.log('')
  console.log('--- 自动选择（循环选技能直到识别到战斗中）---')
  var 次数 = 0
  var 上限 = 30 // 防死循环上限
  var 开始 = Date.now()
  var cur: any = null
  //while (次数 < 上限) {
    sleep(800)
    cur = router.detectCurrentPage(screen())
    log(cur ? '  当前识别页面: ' + cur.name : '  当前识别页面: 未知')
    //if (cur && cur.name === '战斗中') break
    if (cur && cur.name === '选择技能') {
      次数++
      var ok = 技能页.selectSkill(screen(), true)
      console.log('  第' + 次数 + '次选择: ' + (ok ? '成功' : '失败'))
      //if (!ok) break // 选择失败（OCR/点击问题），停止循环
      //continue
    }
    console.log('  进入非技能弹窗/战斗中状态: ' + (cur ? cur.name : '未知') + '，停止循环')
    //break
  //}
  var 用时 = ((Date.now() - 开始) / 1000).toFixed(1)
  console.log('  总耗时: ' + 用时 + 's，选择次数: ' + 次数)
  assert(次数 >= 1, '至少执行了一次技能选择')
  assert(!!cur && cur.name === '战斗中', '循环结束后识别为战斗中，实际: ' + (cur ? cur.name : '未知'))

  summary()
    var 战斗中_page = new 战斗中()
    if(战斗中_page.is(screen())){
      log(战斗中_page.等级())
    }
  
}
