// src/utils/taskBus.ts — 任务事件总线
// 职责:定义事件契约,提供订阅/发布。不持有业务状态,不依赖 UI 与 Android API。
// 发布为同步调用:订阅者按注册顺序依次执行,任一订阅者抛出的异常会向上冒泡到发布方。

/** 单个任务结束时发布 */
export interface 任务结束事件 {
  类型: '任务结束'
  名: string                              // doTask 的 label
  状态: '成功' | '跳过' | '异常'
  原因?: string                           // 跳过/异常的原因;成功时无
  耗时: number                            // 秒,一位小数
  服?: string                             // 当前区服(多账号模式用于定位)
}

/** 一轮开始时发布,订阅者据此清零 / 重置 UI。日常(runDaily)与顶层战斗(Game.start)共用。
 *  模式决定计数条初始格式:日常 "✅ 0  ⏭ 0  ❌ 0";战斗 "✅ 0  ❌ 0"(胜/负,无跳过项)。
 *  不传按日常处理。 */
export interface 本轮开始事件 {
  类型: '本轮开始'
  模式?: '日常' | '战斗'
}

/** runDaily 结束时发布(正常返回或异常中断都会发) */
export interface 整轮结束事件 {
  类型: '整轮结束'
  结果: '完成' | '已停止'
}

/** 每局战斗结算时发布。仅顶层战斗(GameConfig.上报战斗结果)产出;
 *  日常子任务(快速退出)不上报——它的"失败"是预期结果,且计数条归日常所有 */
export interface 战斗结果事件 {
  类型: '战斗结果'
  成功: boolean     // 结算页识别到「恭喜获得」= 成功,否则失败(战败或提前退出)
  服?: string
}

export type 任务事件 = 任务结束事件 | 本轮开始事件 | 整轮结束事件 | 战斗结果事件

var 监听器: Array<(e: 任务事件) => void> = []

/** 订阅事件,返回取消订阅函数(只摘掉本次注册的这一个监听器,不影响其它订阅者) */
export function 订阅(fn: (e: 任务事件) => void): () => void {
  监听器.push(fn)
  return function (): void {
    var i = 监听器.indexOf(fn)
    if (i >= 0) 监听器.splice(i, 1)
  }
}

export function 发布(e: 任务事件): void {
  // 遍历快照:订阅者可能在回调里取消自己的订阅,直接遍历原数组会因 splice 位移而漏掉后续监听器
  var 快照 = 监听器.slice()
  for (var i = 0; i < 快照.length; i++) {
    快照[i](e)
  }
}
