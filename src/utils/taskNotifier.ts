// src/utils/taskNotifier.ts — 结果通知的渲染层
// 职责:订阅 taskBus,把汇总渲染到右上角计数条悬浮窗,并在整轮结束时发系统通知。
// 开关关闭时全部短路:不建窗、不发通知,也不影响 taskReport 继续计数。
import { FloatWindow } from '../../component/FloatWindow'
import { 订阅, 任务事件 } from './taskBus'
import { 本轮汇总, 汇总结果, 格式化计数条 } from './taskReport'

// 脚本 global 对象。autojs6 类型声明里没有 global,tsconfig 的 typeRoots 又限定了
// ./types 与 ./declarations(不含 @types/node),所以这里补一条模块内的 ambient 声明。
declare var global: any

/** 计数条悬浮窗(单例)。独立于 SmallWindows.ts 的 smallWindow:
 *  后者的 close() 里是 threads.shutDownAll(),共用会误杀任务线程。 */
class 计数条窗口 extends FloatWindow<{ 计数: View & JsTextView }> {
  private 已显示 = false
  constructor() {
    super('layoutFile:../layout/status.xml', false)
    this.window.setPosition(device.width - 150, 60)
    this.draggable()
  }
  /** 写文字并确保可见(doTask 跑在子线程,必须走 ui.run) */
  显示(文字: string): void {
    ui.run(() => {
      this.window.计数.setText(文字)
      if (!this.已显示) {
        this.已显示 = true
        this.mView.setVisibility(0)
      }
    })
  }
}

var 窗口: 计数条窗口 | null = null
var 启用 = false
var 已订阅 = false

/** 订阅只注册一次;每次调用按传入值刷新启用状态 */
export function 初始化通知(开启: boolean): void {
  启用 = 开启
  if (已订阅) return
  已订阅 = true
  订阅(处理事件)
}

function 处理事件(e: 任务事件): void {
  try {
    if (!启用) return
    if (e.类型 === '本轮开始') {
      刷新计数条(本轮汇总())
      return
    }
    if (e.类型 === '任务结束') {
      刷新计数条(本轮汇总())
      return
    }
    if (e.类型 === '整轮结束') {
      刷新计数条(本轮汇总())
    }
  } catch (err: any) {
    // 订阅者异常会冒泡进 doTask 被误判成任务失败,这里必须兜住
    console.log('[通知] 处理事件失败: ' + (err && err.message ? err.message : err))
  }
}

function 刷新计数条(汇总: 汇总结果): void {
  var 文字 = 格式化计数条(汇总)
  if (!窗口) 窗口 = new 计数条窗口()
  窗口.显示(文字)
  // 诊断观测点:把当前文字暴露到 global,供 test/任务通知诊断.ts 断言
  global.__计数条文字 = 文字
}
