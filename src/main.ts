// import { Router } from './router/Router'
// import { 战斗 } from './pages/战斗'
// import { 基地 } from './pages/基地'
// import { 历练大厅 } from './pages/历练大厅'
// import { 选择技能 } from './pages/选择技能'
// import { 寰球救援 } from './pages/寰球救援'
// import { 军团 } from './pages/军团'
// import { 幸运锦鲤 } from './pages/幸运锦鲤'
// import { 幸运锦鲤免费福利 } from './pages/幸运锦鲤-免费福利'
// import { 玩法商店 } from './pages/玩法商店'
// import { 侧栏 } from './pages/侧栏'
// import { 巡逻车 } from './pages/巡逻车'
// import { 食堂 } from './pages/食堂'
// import { 邮件 } from './pages/邮件'
// import { 个人信息 } from './pages/个人信息'
// import { 服务器选择 } from './pages/服务器选择'
// import { 异域挑战 } from './pages/异域挑战'
// import { 异域挑战军团奖励 } from './pages/异域挑战-军团奖励'
// import { 异域挑战个人奖励 } from './pages/异域挑战-个人奖励'
// import { 先锋宝藏 } from './pages/先锋宝藏'
// import { 每日一刀 } from './pages/每日一刀'
// import { 寰球远征 } from './pages/寰球远征'
// import { 军团商店 } from './pages/军团商店'
// import { 道具购买 } from './pages/道具购买'
// import { 武装降临 } from './pages/武装降临'
// import { 武装降临任务 } from './pages/武装降临-任务'
// import { 随机事件 } from './pages/随机事件'
// import { 缘聚七夕 } from './pages/缘聚七夕'
// import { 鹊桥祈缘 } from './pages/鹊桥祈缘'
// import { 相思赴约 } from './pages/相思赴约'
import { mainWindow, GameType, GameConfig } from './MainWindow'
import { smallWindow } from './SmallWindows'
import { runDaily } from './model/daily'
import { getRecentAppsSorted, launchPackageByShell } from './utils/app'
import { 兑换码 } from './model/兑换码'
import { 探索 } from './model/探索'
import { Game } from './model/Game'
import { skillStrategy } from './utils/技能策略'
import { Router } from './router/Router'
import { find_队友 } from './utils/img'
import { 组队邀请推荐 } from './pages/组队邀请-推荐'
import { 组队邀请好友 } from './pages/组队邀请-好友'
import { 接受邀请列表 } from './pages/接受邀请列表'

// var router = Router.getInstance()

// new 侧栏()
// new 战斗()
// new 基地()
// new 历练大厅()
// new 选择技能()
// new 寰球救援()
// new 寰球远征()
// new 军团()
// // 幸运锦鲤免费福利 需要在幸运锦鲤前实例化
// new 幸运锦鲤免费福利()
// new 幸运锦鲤()
// new 玩法商店()
// new 巡逻车()
// new 食堂()
// new 邮件()
// new 个人信息()
// new 服务器选择()
// new 异域挑战()
// new 异域挑战军团奖励()
// new 异域挑战个人奖励()
// new 先锋宝藏()
// new 每日一刀()
// new 军团商店()
// new 道具购买()
// new 武装降临()
// new 武装降临任务()
// new 随机事件()
// new 缘聚七夕()
// new 鹊桥祈缘()
// new 相思赴约()

//router.go(基地)
// 组队邀请页对象注册(Router 识别与寻路依赖;注册顺序靠后,识别优先级最低,不与现有页面抢识别)
new 组队邀请推荐()
new 组队邀请好友()
new 接受邀请列表()
var 兑换码运行中 = false
var 探索运行中 = false
// 获取队友信息选中的队友(Teammate 含截图引用,每次流程重新获取覆盖)
let teammate: Teammate | undefined
var 获取队友信息运行中 = false
/** 从主窗口 UI 控件读取战斗配置 */
class UiGameConfig extends GameConfig {
  type: GameType
  enableStart: boolean
  constructor() {
    super()
    this.type = mainWindow.window.模式.getSelectedItem() as GameType
    this.runNum = mainWindow.window.执行次数.widget.getValue() || -1
    this.exitLevel = mainWindow.window.退出等级.widget.getValue() || 0
    this.timeOut = mainWindow.window.超时退出.widget.getValue() || 0
    this.enableStart = mainWindow.window.开始游戏.widget.isChecked()
    this.enableTeam = mainWindow.window.enable_组队.widget.isChecked()
    this.isLeader = mainWindow.window.队长.widget.isChecked()
    this.invite = mainWindow.window.自动邀请.widget.isChecked()
    this.acceptInvite = mainWindow.window.自动接受邀请.widget.isChecked()
    this.identifySkill = mainWindow.window.识别技能.widget.isChecked()
    this.倍速 = mainWindow.window.开启倍速.widget.isChecked()
    // teammate 由"获取队友信息"流程注入(模块级变量,见下方按钮绑定)
    this.teammate = teammate
  }
}
var keepAlive = setInterval(function () {}, 10000)
mainWindow.window.启动.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    if (mainWindow.window.tabHost.getSelectedTabPosition() == 2) {
        start(runDaily)
        return
      }
    // 功能页:按模式进入对应战斗
    start(function () {
      new Game(new UiGameConfig()).start()
    })
  }
}))
mainWindow.window.重置技能优先级.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    // 恢复 seekbar 到布局默认进度，再读取配置并重置局内计数
    skillStrategy.resetUi()
    skillStrategy.resetProgress()
    toast('技能优先级已重置')
  }
}))
mainWindow.window.最小化.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    smallWindow.show('主界面')
  }
}))
mainWindow.window.退出.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    threads.shutDownAll()
    engines.myEngine().forceStop()
  }
}))
mainWindow.window.兑换码.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    if (兑换码运行中) {
      console.log('[兑换码] 正在运行中，请等待完成')
      toast('兑换码正在运行中')
      return
    }
    兑换码运行中 = true
    start(function () {
      try {
        兑换码.start()
      } catch (e: any) {
        console.error('[兑换码] 异常: ' + (e.message || e))
      } finally {
        兑换码运行中 = false
      }
    })
  }
}))
mainWindow.window.探索.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    if (探索运行中) {
      console.log('[探索] 正在运行中，请等待完成')
      toast('探索正在运行中')
      return
    }
    探索运行中 = true
    start(function () {
      try {
        new 探索().start()
      } catch (e: any) {
        console.error('[探索] 异常: ' + (e.message || e))
      } finally {
        探索运行中 = false
      }
    })
  }
}))

mainWindow.window.获取队友信息.setOnClickListener(new android.view.View.OnClickListener({
  onClick() {
    if (获取队友信息运行中) {
      toast('正在获取队友信息中')
      return
    }
    获取队友信息运行中 = true
    // 不等待熄屏:选人是交互流程,保持游戏前台
    start(function () {
      try {
        teammate = 获取队友信息(mainWindow.window.队长.widget.isChecked())
      } catch (e: any) {
        console.error('[获取队友信息] 异常: ' + (e.message || e))
      } finally {
        获取队友信息运行中 = false
      }
    }, false)
  }
}))

/** 获取队友信息:路由到邀请页(队长:组队邀请-好友 / 队员:接受邀请列表),OCR 识别队友名供选择 */
function 获取队友信息(isLeader: boolean): Teammate | undefined {
  let teammates: Teammate[] = []
  do {
    try {
      // Router 失败抛 NavigationError(非返回 false),视为打开失败
      Router.getInstance().go(isLeader ? 组队邀请好友 : 接受邀请列表)
    } catch (e: any) {
      toast('打开邀请页面失败')
      return undefined
    }
    teammates = find_队友(isLeader)
  } while (teammates.length === 0 && sleep(2000))
  let options: string[] = []
  teammates.forEach(it => options.push(it.name))
  let i = dialogs.select('请选择名字相似的好友', options) as number
  for (let j = 0; j < teammates.length; j++) {
    if (j != i) {
      teammates[j].img.recycle()
    }
  }
  if (i < 0) {
    // 用户取消选择(取消时上面已回收全部截图)
    return undefined
  }
  let t = teammates[i]
  ui.run(() => {
    mainWindow.window.队友名称.setText(t.name)
  })
  return t
}

function start(fun: () => void, 等待熄屏: boolean = true) {
  smallWindow.show("停止")
  threads.start(() => {
    try {
      sleep(500)
      fun()
      smallWindow.hide()
      // 切 AutoJs6 前台等系统超时自动熄屏(游戏窗口 KEEP_SCREEN_ON 永不超时,AutoJs6 窗口可正常超时熄灭);
      // 交互流程(如获取队友信息选人)传 false,保持游戏前台
      if (等待熄屏) {
        launch(context.getPackageName())
      }
    } catch (e: any) {
      log(e.javaException == "com.stardust.autojs.runtime.exception.ScriptInterruptedException", e)
      smallWindow.close()
    } finally {

    }
  })
}