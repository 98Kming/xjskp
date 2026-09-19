// test/任务通知诊断.ts — 诊断"任务结果通知"的事件总线、计数、文案与渲染
// 运行:推到设备 /sdcard/脚本/xjskp/dist/ 后用 exec 上下文 eval 执行,回读日志
// 纯逻辑部分自动断言;末尾渲染冒烟部分需人眼确认
import { 发布, 订阅, 任务事件 } from '../src/utils/taskBus'
import { 本轮汇总, 重置本轮 } from '../src/utils/taskReport'

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

console.log('')
console.log('===== 任务结果通知诊断 =====')

// ---------- 事件总线 ----------
// 注意:只用订阅返回的句柄摘掉自己注册的监听器,不做全局清空
// ——taskReport/taskNotifier 在模块体里注册订阅,全局清空会把它们一起抹掉
console.log('')
console.log('--- 总线: 订阅与发布 ---')
var 收到: string[] = []
var 取消A = 订阅(function (e: 任务事件): void { 收到.push('订阅A:' + e.类型) })
var 取消B = 订阅(function (e: 任务事件): void { 收到.push('订阅B:' + e.类型) })
发布({ 类型: '本轮开始' })
assert(收到.length === 2, '两个订阅者各收到一次, 实际 ' + 收到.length)
assert(收到[0] === '订阅A:本轮开始' && 收到[1] === '订阅B:本轮开始', '按注册顺序同步调用, 实际 [' + 收到.join(' | ') + ']')

取消A()
取消B()
发布({ 类型: '本轮开始' })
assert(收到.length === 2, '取消订阅后不再收到, 实际 ' + 收到.length)

console.log('')
console.log('--- 总线: 取消只影响自己 ---')
var 留着的 = 0
var 临时 = 0
var 取消临时 = 订阅(function (): void { 临时++ })
var 取消留着 = 订阅(function (): void { 留着的++ })
取消临时()
发布({ 类型: '本轮开始' })
assert(留着的 === 1 && 临时 === 0, '取消一个订阅者不影响另一个, 实际 留着=' + 留着的 + ' 临时=' + 临时)
取消留着()

console.log('')
console.log('--- 总线: 订阅者异常向上冒泡(契约行为) ---')
var 取消异常 = 订阅(function (): void { throw new Error('订阅者故意抛错') })
var 冒泡 = false
try {
  发布({ 类型: '本轮开始' })
} catch (e: any) {
  冒泡 = true
}
assert(冒泡, '订阅者抛错会冒泡到发布方(所以订阅者必须自行 try/catch)')
取消异常()

// ---------- 计数与明细 ----------
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
console.log('--- 计数: 三态混合 ---')
发布({ 类型: '本轮开始' })
成功('A'); 成功('B'); 跳过('C'); 异常('D')
var s = 本轮汇总()
assert(s.成功 === 2 && s.跳过 === 1 && s.异常 === 1,
  '三项计数 2/1/1, 实际 ' + s.成功 + '/' + s.跳过 + '/' + s.异常)
assert(s.条数 === 4, '条数 = 成功+跳过+异常 = 4, 实际 ' + s.条数)
assert(s.明细.length === 2, '明细只收跳过与异常, 实际 ' + s.明细.length)

console.log('')
console.log('--- 计数: 空轮 ---')
发布({ 类型: '本轮开始' })
var 空 = 本轮汇总()
assert(空.成功 === 0 && 空.跳过 === 0 && 空.异常 === 0 && 空.条数 === 0, '四项全 0')
assert(空.明细.length === 0, '明细为空')

console.log('')
console.log('--- 计数: 同名任务计多条 ---')
发布({ 类型: '本轮开始' })
成功('快速退出'); 成功('快速退出'); 成功('快速退出')
assert(本轮汇总().条数 === 3, '同名 3 次计 3 条(次数=条数语义), 实际 ' + 本轮汇总().条数)

console.log('')
console.log('--- 计数: 明细保留原始原因 ---')
发布({ 类型: '本轮开始' })
异常('无原因任务')
assert(本轮汇总().明细[0].原因 === '', '数据层存原始空串, 不预先兜底')

console.log('')
console.log('--- 计数: 重置本轮 ---')
发布({ 类型: '本轮开始' })
成功('X')
assert(本轮汇总().条数 === 1, '重置前 1 条')
重置本轮()
assert(本轮汇总().条数 === 0 && 本轮汇总().明细.length === 0, '重置本轮后清零')

console.log('')
console.log('--- 总线: 回调内取消自己不吞掉后续订阅者 ---')
// 覆盖 taskBus.ts 里 发布 遍历快照的行为:若直接遍历原数组,splice 位移会漏掉后一个监听器
var 甲收 = 0
var 乙收 = 0
var 取消甲 = 订阅(function (): void { 甲收++; 取消甲() })
var 取消乙 = 订阅(function (): void { 乙收++ })
发布({ 类型: '本轮开始' })
assert(甲收 === 1 && 乙收 === 1, '甲在回调里取消自己后,乙仍收到本次事件, 实际 甲=' + 甲收 + ' 乙=' + 乙收)
取消乙()

summary()
