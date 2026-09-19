// test/任务通知诊断.ts — 诊断"任务结果通知"的事件总线、计数、文案与渲染
// 运行:推到设备 /sdcard/脚本/xjskp/dist/ 后用 exec 上下文 eval 执行,回读日志
// 纯逻辑部分自动断言;末尾渲染冒烟部分需人眼确认
import { 发布, 订阅, 任务事件 } from '../src/utils/taskBus'

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

summary()
