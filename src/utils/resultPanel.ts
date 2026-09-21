// src/utils/resultPanel.ts — 主界面「结果」页的渲染层
// 职责:订阅 taskBus,把本轮汇总渲染到主界面第 5 个 tab(layout/layout.xml 结果页)。
//       维护面板状态(未执行/执行中/完成/已停止),含手动停止兜底:小球「停止」走
//       threads.shutDownAll() 硬杀线程,daily 的 finally 不保证执行,「整轮结束」可能不送达;
//       故用心跳 + 注入的线程存活判定定格「已停止」,否则面板会永远停在「执行中」。
// 与 taskNotifier 无关:那个管悬浮计数条与系统通知,本模块只管结果页;两者都从 taskReport 读汇总。
// 不受「执行结果通知」开关影响:结果页是只读视图,恒常刷新。
import { 订阅, 任务事件 } from './taskBus'
import { 本轮汇总, 格式化计数条, 格式化完整明细 } from './taskReport'

export type 面板状态 = '未执行' | '执行中' | '完成' | '已停止'

/** 结果页的三个 text(id 见 layout/layout.xml 第 5 页) */
export interface 结果面板视图 {
  结果标题: JsTextView
  结果计数: JsTextView
  结果明细: JsTextView
}

var 视图: 结果面板视图 | null = null
var 判定运行中: (() => boolean) | null = null
var 当前状态: 面板状态 = '未执行'
var 当前时刻: Date | null = null
var 已订阅 = false
var 心跳handler: any = null
var 心跳中 = false
var 心跳间隔 = 1000

/** 装配:注入视图与线程存活判定。可重复调用(只换注入项),订阅只注册一次
 *  ——诊断脚本据此先注入假视图、后注入真窗口。不传判定函数时不启用心跳。 */
export function 绑定结果面板(目标: 结果面板视图, 运行中判定?: () => boolean): void {
  视图 = 目标
  判定运行中 = 运行中判定 ? 运行中判定 : null
  渲染()
  if (已订阅) return
  已订阅 = true
  订阅(处理事件)
}

/** 状态行文字,如 "本轮完成 09:05:03"。时刻为 null(未执行)时不拼时间 */
export function 格式化结果标题(状态: 面板状态, 时刻: Date | null): string {
  var 前缀 = 状态 === '未执行' ? '本轮尚未执行'
    : 状态 === '执行中' ? '本轮执行中'
    : 状态 === '完成' ? '本轮完成'
    : '本轮已停止'
  if (状态 === '未执行' || !时刻) return 前缀
  return 前缀 + ' ' + 格式化时刻(时刻)
}

function 格式化时刻(d: Date): string {
  var pad = function (n: number): string { return n < 10 ? '0' + n : '' + n }
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function 空明细占位(状态: 面板状态): string {
  return 状态 === '未执行'
    ? '执行日常任务后，这里列出本轮的跳过与异常项'
    : '本轮无跳过与异常'
}

function 处理事件(e: 任务事件): void {
  try {
    if (e.类型 === '本轮开始') {
      当前状态 = '执行中'
      当前时刻 = new Date()
      停心跳()
      渲染()
      确保心跳()
      return
    }
    if (e.类型 === '任务结束') {
      // 实时刷新:每个任务结束即更新结果页,不必等整轮结束。
      // 硬杀会漏收本事件(发布遍历被中断),那时状态停在执行中,由心跳按线程已死定格,兜底不在这里。
      当前状态 = '执行中'
      渲染()
      确保心跳()
      return
    }
    if (e.类型 === '整轮结束') {
      当前状态 = e.结果 === '完成' ? '完成' : '已停止'
      当前时刻 = new Date()
      停心跳()
      渲染()
    }
  } catch (err: any) {
    // 订阅者异常会冒泡进 doTask 被误判成任务失败,这里必须兜住
    console.log('[结果页] 处理事件失败: ' + (err && err.message ? err.message : err))
  }
}

function 渲染(): void {
  if (!视图) return
  // 现取活引用:本轮开始会整体换新对象,缓存会停在旧数据上
  var 汇总 = 本轮汇总()
  var 标题 = 格式化结果标题(当前状态, 当前时刻)
  var 计数 = 格式化计数条(汇总)
  var 明细 = 格式化完整明细(汇总)
  if (!明细) 明细 = 空明细占位(当前状态)
  // 事件来自任务子线程、心跳来自定时器线程,写视图必须回到 UI 线程
  ui.run(function (): void {
    try {
      var 目标 = 视图
      if (!目标) return
      目标.结果标题.setText(标题)
      目标.结果计数.setText(计数)
      目标.结果明细.setText(明细)
    } catch (err: any) {
      // ui.run 的调用方是异步的,体内异常已脱离上面的 try/catch,需单独兜住
      console.log('[结果页] 写视图失败: ' + (err && err.message ? err.message : err))
    }
  })
}

/** 进入「执行中」时开始心跳;未注入判定函数(诊断脚本注入假视图)时不启用 */
function 确保心跳(): void {
  if (心跳中 || !判定运行中) return
  心跳中 = true
  排下一次心跳()
}

/** 真机实测(AutoX.js v6):setInterval 在脚本线程与 ui.run 内都不触发(脚本线程 sleep 期间
 *  计数恒为 0),故不能用。备选里独立线程 while+sleep 可用,但会被 threads.shutDownAll()
 *  连同任务线程一起杀掉,正好死在最需要它的场景。只有主线程 Handler 两个问题都没有。 */
function 排下一次心跳(): void {
  if (!心跳handler) 心跳handler = new android.os.Handler(android.os.Looper.getMainLooper())
  心跳handler.postDelayed(new java.lang.Runnable({ run: 心跳 }), 心跳间隔)
}

/** 必须清掉挂起的回调,否则脚本每秒空转到结束 */
function 停心跳(): void {
  if (!心跳中) return
  心跳中 = false
  if (心跳handler) 心跳handler.removeCallbacksAndMessages(null)
}

/** 线程已死却仍是「执行中」= 用户点了小球「停止」(shutDownAll 硬杀,「整轮结束」没送达) */
function 心跳(): void {
  try {
    if (当前状态 !== '执行中') {
      停心跳()
      return
    }
    if (判定运行中 && 判定运行中()) {
      排下一次心跳()
      return
    }
    当前状态 = '已停止'
    当前时刻 = new Date()
    停心跳()
    渲染()
  } catch (err: any) {
    console.log('[结果页] 心跳失败: ' + (err && err.message ? err.message : err))
  }
}
