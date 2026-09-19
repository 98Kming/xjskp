// src/utils/taskReport.ts — 本轮任务汇总(计数 / 明细 / 文案)
// 职责:订阅 taskBus,累加本轮结果;提供纯函数生成计数条文字与通知文案。
// 不依赖 UI 与 Android API,可在任何 JS 环境执行。
import { 订阅, 任务事件, 任务结束事件 } from './taskBus'

export interface 明细项 {
  状态: '跳过' | '异常'
  名: string
  原因: string          // 原始值,可能为空串;兜底文案由格式化函数负责
  服?: string
}

export interface 汇总结果 {
  成功: number
  跳过: number
  异常: number
  条数: number          // 恒等于 成功 + 跳过 + 异常
  明细: 明细项[]        // 跳过与异常,按发生顺序
}

function 空汇总(): 汇总结果 {
  return { 成功: 0, 跳过: 0, 异常: 0, 条数: 0, 明细: [] }
}

var 当前: 汇总结果 = 空汇总()

/** 取本轮汇总快照 */
export function 本轮汇总(): 汇总结果 {
  return 当前
}

/** 清空本轮计数与明细(由「本轮开始」事件自动触发,也可手工调用,仅诊断脚本会用) */
export function 重置本轮(): void {
  当前 = 空汇总()
}

function 记录(e: 任务结束事件): void {
  当前.条数++
  if (e.状态 === '成功') {
    当前.成功++
    return
  }
  if (e.状态 === '跳过') 当前.跳过++
  else 当前.异常++
  当前.明细.push({
    状态: e.状态,
    名: e.名,
    原因: e.原因 ? e.原因 : '',
    服: e.服,
  })
}

// 订阅在模块加载时完成;taskNotifier 在本模块之后加载,因此订阅顺序恒为
// taskReport 先于 taskNotifier —— notifier 读到的汇总总是已累加的最新值。
订阅(function (e: 任务事件): void {
  try {
    if (e.类型 === '本轮开始') {
      重置本轮()
      return
    }
    if (e.类型 === '任务结束') {
      记录(e)
      return
    }
  } catch (err: any) {
    console.log('[汇总] 处理事件失败: ' + (err && err.message ? err.message : err))
  }
})
