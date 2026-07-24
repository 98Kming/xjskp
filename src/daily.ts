// src/daily.ts — 日常任务模块
// 自动执行每日操作：导航到各页面并执行对应动作
// 构建产物：dist/daily.js

import { Router } from './router/Router'
import { createTicketAction } from './utils/img'
import { 基地 } from './pages/基地'
import { 随机事件 } from './pages/随机事件'
import { 战斗 } from './pages/战斗'
import { 先锋宝藏 } from './pages/先锋宝藏'
import { 军团 } from './pages/军团'
import { 每日一刀 } from './pages/每日一刀'
import { 异域挑战 } from './pages/异域挑战'
import { 异域挑战军团奖励 } from './pages/异域挑战-军团奖励'
import { 异域挑战个人奖励 } from './pages/异域挑战-个人奖励'
import { 军团商店 } from './pages/军团商店'
import { 道具购买 } from './pages/道具购买'
import { 幸运锦鲤 } from './pages/幸运锦鲤'
import { 幸运锦鲤免费福利 } from './pages/幸运锦鲤-免费福利'
import { 侧栏 } from './pages/侧栏'
import { 邮件 } from './pages/邮件'
import { 巡逻车 } from './pages/巡逻车'
import { 历练大厅 } from './pages/历练大厅'
import { 寰球救援 } from './pages/寰球救援'
import { 寰球远征 } from './pages/寰球远征'
import { 终末危机 } from './pages/终末危机'
import { 食堂 } from './pages/食堂'

var router = Router.getInstance()

// 页面实例（各动作方法通过实例调用）
new 基地()
var 随机事件Page = new 随机事件()
// 侧栏必须在战斗且初始化，否则无法导航到侧栏
new 侧栏()
var 战斗Page = new 战斗()
var 先锋宝藏Page = new 先锋宝藏()
new 军团()
var 每日一刀Page = new 每日一刀()
var 异域挑战Page = new 异域挑战()
var 异域挑战军团奖励Page = new 异域挑战军团奖励()
var 异域挑战个人奖励Page = new 异域挑战个人奖励()
new 军团商店()
var 道具购买Page = new 道具购买()
new 幸运锦鲤()
var 幸运锦鲤免费福利Page = new 幸运锦鲤免费福利()
var 邮件Page = new 邮件()
var 巡逻车Page = new 巡逻车()
var 历练大厅Page = new 历练大厅()
var 寰球救援Page = new 寰球救援()
var 寰球远征Page = new 寰球远征()
var 终末危机Page = new 终末危机()
var 食堂Page = new 食堂()

var totalTasks = 0
var successTasks = 0
var skipTasks = 0
var failTasks = 0

/** 导航到目标页 */
function nav(target: any): boolean {
  try {
    return router.go(target)
  } catch (e: any) {
    // 手动停止时立即终止
    if (e.message && e.message.indexOf('ScriptInterruptedException') >= 0) throw e
    console.log('[日常] ⚠ 导航异常: ' + (e.message || e))
    return false
  }
}

/** 执行一个日常任务 */
function doTask(label: string, action: () => boolean): boolean {
  totalTasks++
  console.log('[日常] 开始: ' + label)
  var start = Date.now()
  try {
    var ok = action()
    var elapsed = ((Date.now() - start) / 1000).toFixed(1)
    if (ok) {
      console.log('[日常] ✅ ' + label + ' (' + elapsed + 's)')
      successTasks++
      return true
    }
    console.log('[日常] ⏭️ ' + label + ' — 跳过 (' + elapsed + 's)')
    skipTasks++
    return false
  } catch (e: any) {
    // 手动停止时立即终止
    if (e.message && e.message.indexOf('ScriptInterruptedException') >= 0) throw e
    var elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log('[日常] ❌ ' + label + ' — ' + (e.message || e) + ' (' + elapsed + 's)')
    failTasks++
    return false
  }
}

export function runDaily(): void {
  totalTasks = 0
  successTasks = 0
  skipTasks = 0
  failTasks = 0

  console.log('')
  console.log('================================')
  console.log('   日常任务 — 开始')
  console.log('================================')
  console.log('')

  // ======== 战斗（默认页，入口：先锋宝藏、幸运锦鲤、侧栏、巡逻车） ========
  doTask('战斗 七日突围', function (): boolean {
    return 战斗Page.click_七日突围()
  })
  doTask('先锋宝藏 免费', function (): boolean {
    if (!nav(先锋宝藏)) return false
    return 先锋宝藏Page.免费()
  })
  doTask('免费福利 领取', function (): boolean {
    if (!nav(幸运锦鲤)) return false
    if (!nav(幸运锦鲤免费福利)) return false
    return 幸运锦鲤免费福利Page.领取奖励()
  })
  doTask('邮件 一键领取', function (): boolean {
    if (!nav(侧栏)) return false
    if (!nav(邮件)) return false
    return 邮件Page.一键领取()
  })
  doTask('巡逻车 领取', function (): boolean {
    if (!nav(巡逻车)) return false
    return 巡逻车Page.领取()
  })

  // ======== 基地（入口：历练大厅、食堂） ========
  doTask('随机事件 领取', function (): boolean {
    if (!nav(基地)) return false
    var anyClaimed = false
    while (true) {
      if (!nav(随机事件)) {
        if (anyClaimed) break  // 已领过，入口消失 → 正常结束
        return false           // 从未出现过入口 → 跳过
      }
      var ok = 随机事件Page.领取()
      if (!ok) {
        if (!anyClaimed) throw new Error('到达随机事件但领取失败')
        break
      }
      anyClaimed = true
      nav(基地)  // 回基地等下轮入口
    }
    return true
  })
  doTask('寰球救援 免费', function (): boolean {
    if (!nav(历练大厅)) return false
    if (!nav(寰球救援)) return false
    return 寰球救援Page.免费()
  })
  doTask('寰球远征 免费', function (): boolean {
    var day = new Date().getDay()
    if (day < 5 && day !== 0) {
      console.log('[日常]   寰球远征仅周五~周末开放')
      return false
    }
    if (!nav(历练大厅)) return false
    if (!nav(寰球远征)) return false
    return 寰球远征Page.免费()
  })
  doTask('终末危机 扫荡', function (): boolean {
    if (!nav(历练大厅)) return false
    if (!nav(终末危机)) return false
    return 终末危机Page.扫荡()
  })
  doTask('食堂 领取', function (): boolean {
    if (!nav(食堂)) return false
    return 食堂Page.领取()
  })

  // ======== 军团 ========
  doTask('军团', function (): boolean {
    if (!nav(军团)) return false
    if (nav(每日一刀)) 每日一刀Page.砍一刀()
    return true
  })
  doTask('异域挑战 扫荡', function (): boolean {
    if (!nav(异域挑战)) return false
    异域挑战Page.扫荡()
    return true
  })
  doTask('军团奖励 领取', function (): boolean {
    if (!nav(异域挑战军团奖励)) return false
    return 异域挑战军团奖励Page.领取()
  })
  doTask('个人奖励 领取', function (): boolean {
    if (!nav(异域挑战个人奖励)) return false
    return 异域挑战个人奖励Page.领取()
  })
  // 军团商店 → 两种入场券
  doTask('救援入场券 购买', function (): boolean {
    if (!nav(军团商店)) return false
    var ticketAction = createTicketAction('images/军团商店_环球救援入场券_1_0.9_115_709_230_827.png', 'images/$军团商店_已售罄_0_0.9_759_0_895_y.png')
    if (!ticketAction()) return false
    sleep(1500)
    return 道具购买Page.购买()
  })
  doTask('远征入场券 购买', function (): boolean {
    if (!nav(军团商店)) return false
    var ticketAction = createTicketAction('images/军团商店_环球远征入场券_1_0.9_114_518_230_633.png', 'images/$军团商店_已售罄_0_0.9_759_0_895_y.png')
    if (!ticketAction()) return false
    sleep(1500)
    return 道具购买Page.购买()
  })

  // 摘要
  console.log('')
  console.log('================================')
  console.log('   日常任务 — 完成')
  console.log('   成功: ' + successTasks + ' | 跳过: ' + skipTasks + ' | 失败: ' + failTasks + ' | 总计: ' + totalTasks)
  console.log('================================')
}

runDaily()
