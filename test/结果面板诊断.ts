// test/结果面板诊断.ts — 诊断主界面「结果」页:格式化纯函数、面板状态机、真窗口渲染
// 运行:推到设备后用 exec 上下文 eval 执行,回读日志。A/B 段自动断言,C 段需人眼确认
//
// 故意改错时谁会红:
//   格式化完整明细 误用带上限的 追加节 → A 段"第 6 条列出"/"不折叠"、C 段"第 30 条"
//   取明细 不过滤状态(混入成功项)     → A 段不折叠用例、B 段"明细不含成功项"
//   只在「整轮结束」才渲染             → B 段"任务结束实时刷新"
//   心跳被删/不启动                    → B 段"线程死后定格已停止"
//   存活判定写反                       → B 段"线程存活时心跳不定格"或"定格"必红其一
//   渲染不包 ui.run                    → 真机 C 段抛 CalledFromWrongThreadException(纯逻辑段抓不到)
//   setTitles 漏加 '结果'              → C 段"tab 数 5"
//   明细 text 加了 maxLines            → C 段"第 30 条跳过与第 12 条异常都在"
import { 发布 } from '../src/utils/taskBus'
import { 本轮汇总, 格式化计数条, 格式化通知明细, 格式化完整明细 } from '../src/utils/taskReport'
import { 绑定结果面板, 格式化结果标题 } from '../src/utils/resultPanel'
import { mainWindow } from '../src/MainWindow'

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

function 成功(名: string): void {
  发布({ 类型: '任务结束', 名: 名, 状态: '成功', 耗时: 1 })
}
function 跳过(名: string, 原因?: string, 服?: string): void {
  发布({ 类型: '任务结束', 名: 名, 状态: '跳过', 原因: 原因, 耗时: 1, 服: 服 })
}
function 异常(名: string, 原因?: string): void {
  发布({ 类型: '任务结束', 名: 名, 状态: '异常', 原因: 原因, 耗时: 1 })
}

console.log('')
console.log('===== 结果面板诊断 =====')

// ---------- A 段: 纯逻辑 ----------
console.log('')
console.log('--- A1: 未绑定视图时发布事件不抛 ---')
// resultPanel 在模块加载时不订阅(订阅只发生在 绑定结果面板 里),此处尚未绑定。
// 若 handler 抛错会冒泡进 doTask 被误判成任务失败,所以这条必须绿
var 未绑定抛错 = ''
try {
  发布({ 类型: '本轮开始' })
  跳过('未绑定时', '原因')
} catch (e: any) {
  未绑定抛错 = e && e.message ? e.message : '' + e
}
assert(未绑定抛错 === '', '未绑定时发布事件不抛, 实际 [' + 未绑定抛错 + ']')

console.log('')
console.log('--- A2: 空轮 ---')
发布({ 类型: '本轮开始' })
assert(格式化完整明细(本轮汇总()) === '',
  '空轮返回空串, 实际 [' + 格式化完整明细(本轮汇总()) + ']')

console.log('')
console.log('--- A3: 不折叠(核心) 与通知折叠的对照 ---')
发布({ 类型: '本轮开始' })
for (var i = 1; i <= 6; i++) 跳过('任务' + i, '原因' + i)
for (var j = 1; j <= 7; j++) 异常('异常' + j, '原因' + j)
var 完整 = 格式化完整明细(本轮汇总())
var 通知 = 格式化通知明细(本轮汇总())
assert(完整.indexOf('任务6') >= 0, '第 6 条跳过仍列出, 实际 [' + 完整 + ']')
assert(完整.indexOf('异常7') >= 0, '第 7 条异常仍列出')
assert(完整.indexOf('… 其余') < 0, '完整明细不折叠, 实际 [' + 完整 + ']')
assert(通知.indexOf('… 其余') >= 0, '对照:通知仍折叠(面板存在的理由), 实际 [' + 通知 + ']')
assert(通知.indexOf('见「结果」页') >= 0, '折叠文案指向结果页, 实际 [' + 通知 + ']')

console.log('')
console.log('--- A4: 行数、节序与节内顺序 ---')
var 行数组 = 完整.split('\n')
assert(行数组.length === 15, '两行节标题 + 13 条明细 = 15 行, 实际 ' + 行数组.length)
assert(行数组[0] === '跳过 6 项', '首行为跳过节标题, 实际 [' + 行数组[0] + ']')
assert(行数组[1] === '· 任务1 — 原因1', '节内保持发生顺序, 实际 [' + 行数组[1] + ']')
assert(行数组[7] === '异常 7 项', '第 8 行为异常节标题, 实际 [' + 行数组[7] + ']')
assert(完整.indexOf('跳过 6 项') < 完整.indexOf('异常 7 项'), '跳过节排在异常节之前')

console.log('')
console.log('--- A5: 服前缀与原因兜底 ---')
发布({ 类型: '本轮开始' })
跳过('军团 每日一刀', '未找到入口', 'S123')
var 带服 = 格式化完整明细(本轮汇总())
assert(带服.indexOf('· [S123] 军团 每日一刀 — 未找到入口') >= 0,
  '服务器前缀, 实际 [' + 带服 + ']')
发布({ 类型: '本轮开始' })
异常('无原因任务')
var 缺失 = 格式化完整明细(本轮汇总())
assert(缺失.indexOf('— 未知原因') >= 0, '原因缺失兜底, 实际 [' + 缺失 + ']')
assert(缺失.indexOf('undefined') < 0, '不出现 undefined')

console.log('')
console.log('--- A6: 标题文案(含补零) ---')
var 定刻 = new Date(2026, 8, 21, 9, 5, 3)
assert(格式化结果标题('未执行', null) === '本轮尚未执行',
  '未执行, 实际 [' + 格式化结果标题('未执行', null) + ']')
assert(格式化结果标题('执行中', 定刻) === '本轮执行中 09:05:03',
  '执行中且补零, 实际 [' + 格式化结果标题('执行中', 定刻) + ']')
assert(格式化结果标题('完成', 定刻) === '本轮完成 09:05:03',
  '完成, 实际 [' + 格式化结果标题('完成', 定刻) + ']')
assert(格式化结果标题('已停止', 定刻) === '本轮已停止 09:05:03',
  '已停止, 实际 [' + 格式化结果标题('已停止', 定刻) + ']')
assert(格式化结果标题('完成', null) === '本轮完成',
  '时刻为 null 时不拼时间, 实际 [' + 格式化结果标题('完成', null) + ']')

// ---------- B 段: 状态机(假视图 + 注入判定) ----------
console.log('')
console.log('--- B 段: 状态机 ---')
var 记录 = { 标题: '', 计数: '', 明细: '', 写入次数: 0 }
function 造假视图(): any {
  return {
    结果标题: { setText: function (t: string): void { 记录.标题 = t; 记录.写入次数++ } },
    结果计数: { setText: function (t: string): void { 记录.计数 = t; 记录.写入次数++ } },
    结果明细: { setText: function (t: string): void { 记录.明细 = t; 记录.写入次数++ } },
  }
}
var 运行中 = true
绑定结果面板(造假视图(), function (): boolean { return 运行中 })
sleep(500)
assert(记录.标题 === '本轮尚未执行', '注入即渲染未执行态, 实际 [' + 记录.标题 + ']')

发布({ 类型: '本轮开始' })
sleep(500)
assert(记录.标题.indexOf('本轮执行中') === 0, '本轮开始 → 执行中, 实际 [' + 记录.标题 + ']')
assert(记录.计数 === '✅ 0  ⏭ 0  ❌ 0', '计数清零, 实际 [' + 记录.计数 + ']')
assert(记录.明细 === '本轮无跳过与异常', '空轮占位, 实际 [' + 记录.明细 + ']')

成功('成功任务')
跳过('跳过任务', '原因A')
sleep(500)
assert(记录.计数 === '✅ 1  ⏭ 1  ❌ 0', '任务结束实时刷新计数, 实际 [' + 记录.计数 + ']')
assert(记录.明细.indexOf('· 跳过任务 — 原因A') >= 0, '明细含跳过项, 实际 [' + 记录.明细 + ']')
assert(记录.明细.indexOf('成功任务') < 0, '明细不含成功项, 实际 [' + 记录.明细 + ']')

console.log('')
console.log('--- B2: 线程存活时心跳不定格 ---')
sleep(1300)
assert(记录.标题.indexOf('本轮执行中') === 0, '判定为存活时不定格, 实际 [' + 记录.标题 + ']')

console.log('')
console.log('--- B3: 线程死后心跳定格「已停止」 ---')
运行中 = false
sleep(1600)
assert(记录.标题.indexOf('本轮已停止') === 0, '线程死后定格已停止, 实际 [' + 记录.标题 + ']')
var 定格次数 = 记录.写入次数
sleep(1600)
assert(记录.写入次数 === 定格次数,
  '定格后心跳不再产生写入, 实际 ' + 定格次数 + ' → ' + 记录.写入次数)

console.log('')
console.log('--- B4: 新一轮能重新启动心跳 ---')
运行中 = true
发布({ 类型: '本轮开始' })
sleep(400)
assert(记录.标题.indexOf('本轮执行中') === 0, '新一轮重置为执行中, 实际 [' + 记录.标题 + ']')
运行中 = false
sleep(1600)
assert(记录.标题.indexOf('本轮已停止') === 0, '新一轮心跳仍能定格, 实际 [' + 记录.标题 + ']')

console.log('')
console.log('--- B5: 整轮结束定格「完成」并停心跳 ---')
运行中 = true
发布({ 类型: '本轮开始' })
sleep(400)
成功('A')
sleep(400)
发布({ 类型: '整轮结束', 结果: '完成' })
sleep(500)
assert(记录.标题.indexOf('本轮完成') === 0, '整轮结束 → 完成, 实际 [' + 记录.标题 + ']')
var 完成次数 = 记录.写入次数
sleep(1300)
assert(记录.写入次数 === 完成次数,
  '整轮结束后心跳已停, 实际 ' + 完成次数 + ' → ' + 记录.写入次数)

// ---------- C 段: 真窗口渲染冒烟(需人眼确认) ----------
console.log('')
console.log('--- C 段: 真窗口渲染冒烟 ---')
绑定结果面板(mainWindow.window, function (): boolean { return true })
发布({ 类型: '本轮开始' })
for (var m = 1; m <= 30; m++) 跳过('冒烟跳过' + m, '原因' + m)
for (var n = 1; n <= 12; n++) 异常('冒烟异常' + n, '原因' + n)
跳过('带服任务', '未找到入口', 'S123')
发布({ 类型: '整轮结束', 结果: '完成' })
sleep(1500)

assert(mainWindow.window.viewPager.getCurrentItem() === 0,
  '整轮结束不自动切页(仍在功能页), 实际 index ' + mainWindow.window.viewPager.getCurrentItem())
assert(mainWindow.window.tabHost.getTabCount() === 5,
  'tab 数为 5(setTitles 漏加会变 4), 实际 ' + mainWindow.window.tabHost.getTabCount())

// TabLayout.Tab 没有 getText(),名字只能从 TabView 里翻出来;
// TabView 的嵌套层数随 Material 版本变化,所以递归找第一个 TextView
function 递归找文本(v: any): string {
  if (!v) return ''
  if (v instanceof android.widget.TextView) return String(v.getText())
  if (v instanceof android.view.ViewGroup) {
    for (var i = 0; i < v.getChildCount(); i++) {
      var 找到 = 递归找文本(v.getChildAt(i))
      if (找到) return 找到
    }
  }
  return ''
}
var 第五个Tab文字 = '(取不到)'
try {
  var 取到的 = 递归找文本(mainWindow.window.tabHost.getTabAt(4).view)
  if (取到的) 第五个Tab文字 = 取到的
} catch (e: any) {
  第五个Tab文字 = '(异常:' + (e && e.message ? e.message : e) + ')'
}
assert(第五个Tab文字 === '结果', '第 5 个 tab 名为 结果, 实际 [' + 第五个Tab文字 + ']')

ui.run(function (): void { mainWindow.window.viewPager.setCurrentItem(4) })
sleep(1500)

var 真标题 = String(mainWindow.window.结果标题.text())
var 真计数 = String(mainWindow.window.结果计数.text())
var 真明细 = String(mainWindow.window.结果明细.text())
var 汇 = 本轮汇总()

assert(真标题.indexOf('本轮完成') === 0, '标题以 本轮完成 开头, 实际 [' + 真标题 + ']')
assert(真计数 === 格式化计数条(汇), '计数行与汇总一致, 实际 [' + 真计数 + ']')
assert(真明细 === 格式化完整明细(汇), '明细与完整格式化逐字一致, 实际 [' + 真明细 + ']')
assert(真明细.indexOf('冒烟跳过30') >= 0 && 真明细.indexOf('冒烟异常12') >= 0,
  '末条跳过与末条异常都在(未被 maxLines 之类截断)')
assert(真明细.indexOf('… 其余') < 0, '结果页明细不折叠')
assert(真明细.indexOf('[S123]') >= 0, '带服条目前缀正确')

summary()
console.log('')
console.log('【人眼确认】切到「结果」页后请核对:')
console.log('  1. 明细区可上下滚动, 滚到底能看到 冒烟跳过30')
console.log('  2. 标题行与计数行都没被明细挤掉')
console.log('  3. 功能/技能/日常/设置 四个 tab 的文字没被截断(5 个 tab 是否撑宽主窗口)')
