// src/daily.ts — 日常任务模块
// 自动执行每日操作：导航到各页面并执行对应动作
// 构建产物：dist/daily.js

import { mainWindow } from "./MainWindow"
import { Router } from './router/Router'
import { createTicketAction, imageDetector } from './utils/img'
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
import { 引航行动 } from './pages/引航行动'
import { 引航行动时域珍藏 } from './pages/引航行动-时域珍藏'
import { 引航行动每日观察 } from './pages/引航行动-每日观察'
import { 好友 } from './pages/好友'
import { 个人信息 } from './pages/个人信息'
import { 服务器选择 } from './pages/服务器选择'

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
var 引航行动Page = new 引航行动()
var 引航行动时域珍藏Page = new 引航行动时域珍藏()
var 引航行动每日观察Page = new 引航行动每日观察()
var 好友Page = new 好友()

var totalTasks = 0
var successTasks = 0
var skipTasks = 0
var failTasks = 0
var currentServer: string | null = null

/** 检查主窗口日常开关是否开启 */
function isDailyEnabled(id: string): boolean {
  var view = (mainWindow.window as any)[id]
  if (!view) return false
  var widget = view.widget
  if (widget && typeof widget.isChecked === 'function') {
    return widget.isChecked()
  }
  return false
}

/** 导航到目标页 */
function nav(target: any): boolean {
  try {
    return router.go(target)
  } catch (e: any) {
    // 手动停止时立即终止
    if (e.message && e.message.indexOf('ScriptInterruptedException') >= 0) throw e
    var serverTag = currentServer ? ' [' + currentServer + ']' : ''
    console.log('[日常] ⚠ 导航异常: ' + (e.message || e) + serverTag)
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
    if (e.message && e.message.indexOf('InterruptedException') >= 0) throw e
    var elapsed = ((Date.now() - start) / 1000).toFixed(1)
    var serverTag = currentServer ? ' [' + currentServer + ']' : ''
    console.log('[日常] ❌ ' + label + ' — ' + (e.message || e) + serverTag + ' (' + elapsed + 's)')
    failTasks++
    return false
  }
}

export function setCurrentServer(name: string | null): void {
  currentServer = name
}

new 个人信息()
var 服务器选择Page = new 服务器选择()

/** 执行全部日常任务（不含摘要，支持多服复用） */
function executeDailyTasks(): void {

  // ======== 战斗（默认页，入口：先锋宝藏、幸运锦鲤、侧栏、巡逻车） ========
  if (isDailyEnabled('战斗_七日突围')) {
    doTask('战斗 七日突围', function (): boolean {
      if (!nav(战斗)) return false
      return 战斗Page.click_七日突围()
    })
  }
  if (isDailyEnabled('先锋宝藏_免费抽')) {
    doTask('先锋宝藏 免费', function (): boolean {
      if (!nav(先锋宝藏)) return false
      return 先锋宝藏Page.免费()
    })
  }
  if (isDailyEnabled('幸运锦鲤_免费福利')) {
    doTask('免费福利 领取', function (): boolean {
      if (!nav(幸运锦鲤)) return false
      if (!nav(幸运锦鲤免费福利)) return false
      return 幸运锦鲤免费福利Page.领取奖励()
    })
  }
  if (isDailyEnabled('邮件')) {
    doTask('邮件 一键领取', function (): boolean {
      if (!nav(侧栏)) return false
      if (!nav(邮件)) return false
      return 邮件Page.一键领取()
    })
  }
  if (isDailyEnabled('巡逻车_领取')) {
    doTask('巡逻车 领取', function (): boolean {
      if (!nav(巡逻车)) return false
      return 巡逻车Page.领取()
    })
  }

  // ======== 引航行动（限时活动 2026/07/25 截止）========
  var 引航行动可达 = false
  var 引航行动开关开启 = isDailyEnabled('引航行动_时域珍藏') || isDailyEnabled('引航行动_每日观察')
  if (引航行动开关开启) {
    引航行动可达 = nav(引航行动)
  }
  if (isDailyEnabled('引航行动_时域珍藏')) {
    doTask('引航行动-时域珍藏 免费', function (): boolean {
      if (Date.now() >= new Date(2026, 6, 25).getTime()) {
        console.log('[日常]   引航行动限时活动已结束')
        return false
      }
      if (!引航行动可达) return false
      if (!nav(引航行动时域珍藏)) return false
      return 引航行动时域珍藏Page.click_免费()
    })
  }
  if (isDailyEnabled('引航行动_每日观察')) {
    doTask('引航行动-每日观察 领取', function (): boolean {
      if (Date.now() >= new Date(2026, 6, 25).getTime()) {
        console.log('[日常]   引航行动限时活动已结束')
        return false
      }
      if (!引航行动可达) return false
      if (!nav(引航行动每日观察)) return false
      return 引航行动每日观察Page.领取()
    })
  }

  // ======== 基地（入口：历练大厅、食堂） ========
  if (isDailyEnabled('寰球救援_领票')) {
    doTask('寰球救援 免费', function (): boolean {
      if (!nav(历练大厅)) return false
      if (!nav(寰球救援)) return false
      return 寰球救援Page.免费()
    })
  }
  if (isDailyEnabled('寰球远征_免费')) {
    doTask('寰球远征 免费', function (): boolean {
    var day = new Date().getDay()
    if (day < 5 && day !== 0) {
      console.log('[日常]   寰球远征仅周五~周末开放')
      return false
    }
    if (!nav(历练大厅)) return false
    if (imageDetector('images/历练大厅_远征-未开启_1_0.9_573_1599_866_1644.png')) {
      console.log('[日常]   寰球远征未开启')
      return false
    }
    if (!nav(寰球远征)) return false
    return 寰球远征Page.免费()
  })
  }
  if (isDailyEnabled('终末危机_扫荡')) {
    doTask('终末危机 扫荡', function (): boolean {
      var hour = new Date().getHours()
      if (hour < 12 || hour >= 23) {
        console.log('[日常]   终末危机仅在 12:00~23:00 开放')
        return false
      }
      if (!nav(历练大厅)) return false
      if (!nav(终末危机)) return false
      return 终末危机Page.扫荡()
    })
  }
  if (isDailyEnabled('食堂')) {
    doTask('食堂 领取', function (): boolean {
      if (!nav(食堂)) return false
      return 食堂Page.领取()
    })
  }
  if (isDailyEnabled('随机事件_领取')) {
    doTask('随机事件 领取', function (): boolean {
      if (!nav(基地)) return false
      var anyClaimed = false
      while (true) {
        if (!nav(随机事件)) {
          if (anyClaimed) break  // 已领过，入口消失 → 正常结束
          return false           // 从未出现过入口 → 跳过
        }
        // 检测结束状态（已领完/需看广告），正常结束
        if (随机事件Page.hasEnded()) {
          if (!anyClaimed) {
            console.log('[日常] 随机事件 已结束')
            return true
          }
          break
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
  }
  // ======== 军团（任一子功能开启时导航） ========
  var 军团功能开启 = isDailyEnabled('军团_每日一刀') || isDailyEnabled('军团_异域挑战') || isDailyEnabled('军团_军团商店')
  if (军团功能开启) {
    doTask('军团', function (): boolean {
      if (!nav(军团)) return false
      return true
    })
  }
  if (isDailyEnabled('军团_每日一刀')) {
    doTask('每日一刀 砍一刀', function (): boolean {
      if (!nav(军团)) return false
      if (!nav(每日一刀)) return false
      return 每日一刀Page.砍一刀()
    })
  }
  if (isDailyEnabled('军团_异域挑战')) {
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
  }
  if (isDailyEnabled('军团_军团商店')) {
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
  }

  // ======== 好友 ========
  if (isDailyEnabled('好友_领取体力')) {
    doTask('好友 领取体力', function (): boolean {
      if (!nav(好友)) return false
      return 好友Page.领取体力()
    })
  }
  if (isDailyEnabled('好友_一键赠送')) {
    doTask('好友 一键赠送', function (): boolean {
      if (!nav(好友)) return false
      return 好友Page.一键赠送()
    })
  }

  // ======== 未实现的功能（有开关、无页面逻辑） ========
  // TODO: 先锋宝藏_特惠战令 — 需实现 先锋宝藏Page.特惠战令()
  // TODO: 碧海凉夏_免费抽 — 需实现 碧海凉夏Page.免费抽()
  // TODO: 作战计划_签到 — 需实现 作战计划Page.签到()
  // TODO: 商店_超时空军团兵碎片 — 需实现 商店Page.超时空军团兵碎片()
  // TODO: 兑换码 — 需实现 兑换码Page.兑换()
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

  executeDailyTasks()

  // 多账号：切换区服重新执行
  if (isDailyEnabled('全部账号')) {
    while (nav(服务器选择)) {
      var server = 服务器选择Page.next()
      if (!server) break
      currentServer = server
      console.log('')
      console.log('--- 切换服务器: ' + server + ' ---')
      console.log('')
      executeDailyTasks()
      sleep(1000)
    }
    currentServer = null
  }

  // 摘要
  console.log('')
  console.log('================================')
  console.log('   日常任务 — 完成' + (currentServer ? ' [' + currentServer + ']' : ''))
  console.log('   成功: ' + successTasks + ' | 跳过: ' + skipTasks + ' | 失败: ' + failTasks + ' | 总计: ' + totalTasks)
  console.log('================================')
}


