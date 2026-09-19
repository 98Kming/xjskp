// test/任务通知诊断.ts — 诊断"任务结果通知"的事件总线、计数、文案与渲染
// 运行:推到设备 /sdcard/脚本/xjskp/dist/ 后用 exec 上下文 eval 执行,回读日志
// 纯逻辑部分自动断言;末尾渲染冒烟部分需人眼确认
import { 发布, 订阅, 清空订阅, 任务事件 } from '../src/utils/taskBus'

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
console.log('')
console.log('--- 总线: 订阅与发布 ---')
清空订阅()
var 收到: string[] = []
订阅(function (e: 任务事件): void { 收到.push('订阅A:' + e.类型) })
订阅(function (e: 任务事件): void { 收到.push('订阅B:' + e.类型) })
发布({ 类型: '本轮开始' })
assert(收到.length === 2, '两个订阅者各收到一次, 实际 ' + 收到.length)
assert(收到[0] === '订阅A:本轮开始' && 收到[1] === '订阅B:本轮开始', '按注册顺序同步调用, 实际 [' + 收到.join(' | ') + ']')

清空订阅()
发布({ 类型: '本轮开始' })
assert(收到.length === 2, '清空订阅后不再收到, 实际 ' + 收到.length)

console.log('')
console.log('--- 总线: 订阅者异常向上冒泡(契约行为) ---')
清空订阅()
订阅(function (): void { throw new Error('订阅者故意抛错') })
var 冒泡 = false
try {
  发布({ 类型: '本轮开始' })
} catch (e: any) {
  冒泡 = true
}
assert(冒泡, '订阅者抛错会冒泡到发布方(所以订阅者必须自行 try/catch)')
清空订阅()

summary()
