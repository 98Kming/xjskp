// src/utils/taskBus.ts — 任务事件总线
// 职责:定义事件契约,提供订阅/发布/清空。不持有业务状态,不依赖 UI 与 Android API。
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

/** runDaily 开始时发布,订阅者据此清零 / 重置 UI */
export interface 本轮开始事件 {
  类型: '本轮开始'
}

/** runDaily 结束时发布(正常返回或异常中断都会发) */
export interface 整轮结束事件 {
  类型: '整轮结束'
  结果: '完成' | '已停止'
}

export type 任务事件 = 任务结束事件 | 本轮开始事件 | 整轮结束事件

var 监听器: Array<(e: 任务事件) => void> = []

export function 订阅(fn: (e: 任务事件) => void): void {
  监听器.push(fn)
}

export function 发布(e: 任务事件): void {
  for (var i = 0; i < 监听器.length; i++) {
    监听器[i](e)
  }
}

export function 清空订阅(): void {
  监听器 = []
}
