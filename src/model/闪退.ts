// src/model/闪退.ts — 闪退刷奖励:进战斗点"开始游戏"后立即强制结束游戏(闪退),快速刷局次奖励
// 由日常任务"闪退19次"开关控制,执行次数从开关配套输入框读取;重复执行次数过多时游戏可能进黑名单,慎用
import { Router } from '../router/Router'
import { 战斗 } from '../pages/战斗'
import { smallWindow } from '../SmallWindows'
import { createRouteAction, imageDetector, screen } from '../utils/img'
import { getRecentAppsSorted } from '../utils/app'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  // 战斗页"开始游戏"按钮(与 战斗.ts 页面私有图保持一致)
  战斗中: 'images/战斗$战斗中_1_0.9_410_1816_668_1935.png',
  // 前往弹窗按钮(通用图):点击后回主界面
  前往: 'images/$前往_1_0.9_662_1461_767_1510.png',
}

const 每轮重连重试上限 = 3  // 点"重新连接"回主界面后重新点开始游戏的重试次数
const 连续失败上限 = 5     // 连续进不了战斗则放弃(游戏可能未正常启动)

/** 从最近应用列表获取游戏包名(含 xjskp 的最新应用),获取失败返回 null */
function 获取游戏包名(): string | null {
  var 最近应用 = getRecentAppsSorted(10)
  for (var i = 0; i < 最近应用.length; i++) {
    if (最近应用[i].packageName.indexOf('xjskp') >= 0) {
      return 最近应用[i].packageName
    }
  }
  return null
}

export class 闪退 {
  /** 闪退刷奖励 total 次,全部完成返回 true;游戏无法正常启动时返回 false */
  static start(total: number): boolean {
    // 包名从最近应用列表获取,不写死(兼容多客户端)
    var 游戏包名 = 获取游戏包名()
    if (!游戏包名) {
      toast('未找到[向僵尸开炮],请授予使用情况访问权限')
      return false
    }
    var num = 0   // 已成功闪退次数
    var errNum = 0 // 连续失败次数
    while (num < total) {
      launch(游戏包名)
      sleep(1200)
      // 登录页由 Router 自动识别并跳转战斗页(登录页已注册路由,go(战斗) 会从登录页点"战斗"按钮直达)
      // 进战斗页点"开始游戏";点开始后检查弹窗:前往弹窗点"前往"、重新连接弹窗点击重连,均回主界面后重新点开始游戏;继续挑战不处理
      var 已开始 = false
      for (var i = 0; i < 每轮重连重试上限; i++) {
        var ok = this.开始一局()
        if (ok) sleep(200) // 原逻辑:点开始游戏后等 200ms 再截图检查弹窗
        var img = screen()
        if (imageDetector(IMG.前往, img)) {
          log('前往弹窗,点击前往后重新开始')
          createRouteAction(IMG.前往)(img)
          sleep(1000)
          continue
        }
        if (imageDetector(IMG.重新连接, img)) {
          log('重新连接弹窗,点击后重新开始')
          createRouteAction(IMG.重新连接)(img)
          sleep(1000)
          continue
        }
        if (!ok) break // 无弹窗但导航失败 = 游戏异常,按连续失败计数
        已开始 = true
        break
      }
      if (!已开始) {
        errNum++
        if (errNum > 连续失败上限) {
          toast('请检查[向僵尸开炮]是否正常启动')
          return false
        }
        continue
      }
      // 已点开始游戏 → 在加载页立即强制结束(闪退),不等进战斗,快速获取参与奖励
      shell('am force-stop ' + 游戏包名, true)
      num++
      errNum = 0
      log('闪退执行' + num + '次')
      ui.run(() => {
        smallWindow.window.btn.setText('停止(' + num + ')')
      })
      sleep(1200)
    }
    launch(游戏包名)
    return true
  }

  /** 导航到战斗页并点击"开始游戏"按钮(点击成功即视为开始,不等识别进战斗中页);导航异常视为失败 */
  private static 开始一局(): boolean {
    try {
      if (!Router.getInstance().go(战斗)) return false
      return createRouteAction(IMG.战斗中)()
    } catch (e) {
      return false
    }
  }
}
