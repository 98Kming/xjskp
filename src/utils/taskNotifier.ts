// src/utils/taskNotifier.ts — 结果通知的渲染层
// 职责:订阅 taskBus,把汇总渲染到右上角计数条悬浮窗,并在整轮结束时发系统通知。
// 开关关闭时不建窗、隐藏已有窗、不发通知,也不影响 taskReport 继续计数。
import { FloatWindow } from '../../component/FloatWindow'
import { 订阅, 任务事件 } from './taskBus'
import {
  本轮汇总, 汇总结果,
  格式化计数条, 格式化通知标题, 格式化通知正文, 格式化通知明细,
} from './taskReport'

// 脚本 global 对象。autojs6 类型声明里没有 global,tsconfig 的 typeRoots 又限定了
// ./types 与 ./declarations(不含 @types/node),所以这里补一条模块内的 ambient 声明。
declare var global: any

/** 让窗口不接收触摸:计数条是只读 HUD,不能挡住小球「停止」或游戏按钮的点击。
 *  反射改 LayoutParams.flags 的写法同 component/FloatWindow.ts:67-92 的 windowOutSideDisableFocus;
 *  实测 updateWindowLayoutParams 必须在 UI 线程调用,否则抛 CalledFromWrongThreadException。 */
function 使触摸穿透(win: any): void {
  var 字段 = win.getClass().getDeclaredField('mWindow')
  字段.setAccessible(true)
  var mWindow = 字段.get(win)
  var 参数字段 = mWindow.getClass().getSuperclass().getDeclaredField('mWindowLayoutParams')
  参数字段.setAccessible(true)
  var params = 参数字段.get(mWindow)
  params.flags |= android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
  ui.run(() => {
    mWindow.updateWindowLayoutParams(params)
  })
}

/** 计数条纵向位置(px):贴屏幕顶部(k 指定)。
 *  注:右上角悬浮小球占 y 20~114.5、x 930~1061,贴顶后计数条会与它视觉重叠;
 *  计数条已设 FLAG_NOT_TOUCHABLE,重叠只影响观感,不影响小球点击。 */
var 计数条顶部px = 0

/** 计数条悬浮窗(单例)。独立于 SmallWindows.ts 的 smallWindow:
 *  后者的 close() 里是 threads.shutDownAll(),共用会误杀任务线程。
 *  不可触摸(FLAG_NOT_TOUCHABLE):只读 HUD,避免遮挡小球「停止」的点击 */
class 计数条窗口 extends FloatWindow<{ 计数: View & JsTextView }> {
  constructor() {
    super('layoutFile:../layout/status.xml', false)
    // 宽度由内容撑开(布局不写 w),所以每次布局变化后都要重新贴右边
    var 自身 = this
    this.mView.addOnLayoutChangeListener(new android.view.View.OnLayoutChangeListener({
      onLayoutChange: function (v: View, l: number, t: number, r: number, b: number,
        ol: number, ot: number, orr: number, ob: number): void {
        自身.贴右边()
      }
    }))
    使触摸穿透(this.window)
  }
  /** 写文字并显示。调用方负责 ui.run(建窗与写视图都算 UI 操作) */
  显示(文字: string): void {
    this.window.计数.setText(文字)
    // 实测 floaty 窗口的框只增不减:文字变短不会自动缩回,需手动触发一次重新布局。
    // 缩回后会再触发 OnLayoutChangeListener,由 贴右边 把右边缘贴齐。
    this.mView.requestLayout()
    this.mView.setVisibility(0)
    this.贴右边()
  }
  /** 隐藏(开关关闭时撤窗用) */
  隐藏(): void {
    this.mView.setVisibility(8)
  }
  /** 右边缘贴屏幕右边。宽度是内容自适应的,只能取当前实际宽度 */
  private 贴右边(): void {
    var 宽 = this.mView.getWidth()
    if (宽 <= 0) return
    var 目标x = device.width - 宽
    // x 没变就不调 setPosition,避免无谓的重排
    if (this.window.getX() !== 目标x) this.window.setPosition(目标x, 计数条顶部px)
  }
}

var 窗口: 计数条窗口 | null = null
var 启用 = false
var 已订阅 = false
/** 通知 id 固定,同一设备上本轮覆盖上一轮,通知栏不堆积 */
var 通知ID = 1919
/** 通知渠道 id,Android 8(API 26)+ 必须 */
var 渠道ID = 'xjskp_result'

/** 订阅只注册一次;每次调用按传入值刷新启用状态 */
export function 初始化通知(开启: boolean): void {
  启用 = 开启
  if (!开启 && 窗口) {
    // 关掉开关时撤掉上一轮留下的计数条,否则它会带着旧数字僵在屏上
    var 旧 = 窗口
    ui.run(() => { 旧.隐藏() })
  }
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
    if (e.类型 === '任务结束' || e.类型 === '战斗结果') {
      刷新计数条(本轮汇总())
      return
    }
    if (e.类型 === '整轮结束') {
      刷新计数条(本轮汇总())
      发送通知(e.结果)
    }
  } catch (err: any) {
    // 订阅者异常会冒泡进 doTask 被误判成任务失败,这里必须兜住
    console.log('[通知] 处理事件失败: ' + (err && err.message ? err.message : err))
  }
}

function 刷新计数条(汇总: 汇总结果): void {
  var 文字 = 格式化计数条(汇总)
  // 建窗与写文字都是 UI 操作:doTask 跑在子线程,必须在 ui.run 里做
  ui.run(() => {
    if (!窗口) 窗口 = new 计数条窗口()
    窗口.显示(文字)
  })
  // 诊断观测点:把当前文字暴露到 global,供 test/任务通知诊断.ts 断言
  global.__计数条文字 = 文字
}

/** Android 8(API 26)起通知必须归属渠道;低版本没有渠道概念,直接跳过 */
function 确保渠道(nm: any): void {
  if (device.sdkInt < 26) return
  var 渠道 = new android.app.NotificationChannel(渠道ID, '脚本执行结果',
    android.app.NotificationManager.IMPORTANCE_DEFAULT)
  // 幂等:重复创建只更新名称与描述
  nm.createNotificationChannel(渠道)
}

function 发送通知(结果: '完成' | '已停止'): void {
  var 汇总 = 本轮汇总()
  var 标题 = 格式化通知标题(汇总, 结果)
  var 正文 = 格式化通知正文(汇总)
  var 明细 = 格式化通知明细(汇总)
  try {
    // Android 原生 API: context.getSystemService(NOTIFICATION_SERVICE) / NotificationChannel
    //                   / Notification.Builder / NotificationManager.notify
    // 设备实测: API 33, areNotificationsEnabled() 为 true, 无需运行时申请权限
    var nm = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE)
    确保渠道(nm)
    // API 26+ 的 Builder 构造函数必须带渠道 id;低版本用单参构造
    var 构造器 = device.sdkInt >= 26
      ? new android.app.Notification.Builder(context, 渠道ID)
      : new android.app.Notification.Builder(context)
    构造器.setContentTitle(标题)
    构造器.setContentText(正文)
    if (明细) {
      // 展开态长文本
      构造器.setStyle(new android.app.Notification.BigTextStyle().bigText(明细))
    }
    // setSmallIcon 必须调用,缺了小图标 notify() 不报错但通知不显示
    构造器.setSmallIcon(android.R.drawable.ic_dialog_info)
    构造器.setAutoCancel(true)
    nm.notify(通知ID, 构造器.build())
    console.log('[通知] 已发送: ' + 标题)
  } catch (e: any) {
    console.log('[通知] 发送失败: ' + (e && e.message ? e.message : e))
    // 降级: 结果仍进日志与详细日志文件
    console.log('[通知] 降级输出: ' + 标题 + ' | ' + 正文)
    toast('通知发送失败，结果见运行日志')
  }
}
