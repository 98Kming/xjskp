import { mainWindow, GameType, GameConfig } from './MainWindow'
import { smallWindow } from './SmallWindows'
import { runDaily, isStopException } from './model/daily'
import { 兑换码 } from './model/兑换码'
import { Game } from './model/Game'
import { skillStrategy } from './utils/技能策略'
import { Router } from './router/Router'
import { find_队友, screenCalls, screenCaptures } from './utils/img'
import { 组队邀请好友 } from './pages/组队邀请-好友'
import { 接受邀请列表 } from './pages/接受邀请列表'
import { 鹊渡仙途 } from './pages/鹊渡仙途'
import { setupDetailLog } from './utils/logger'

// 组队邀请页实例由 pages.ts 注册表创建(识别优先级最低,不与现有页面抢识别);此处仅引用类做 Router 导航
var 兑换码运行中 = false
// 鹊渡仙途 extends BasePage,new 即注册;缓存实例防止重复运行触发 Router 重复注册报错
var 鹊渡仙途Page: 鹊渡仙途 | null = null
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
        if (!鹊渡仙途Page) { 鹊渡仙途Page = new 鹊渡仙途() }
        鹊渡仙途Page.run()
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

// 工作线程互斥:threads 线程与主线程共享模块单例(如 img.ts 的 templateCache),
// 并发任务会互相干扰找图并引发竞态崩溃(getTemplate 空洞 TypeError);
// 线程存活时拒绝再次启动。用 isAlive() 判断而非 finally 复位——shutDownAll 强杀时 finally 不保证执行
var 任务线程: any = null

function start(fun: () => void, 等待熄屏: boolean = true) {
  if (任务线程 && 任务线程.isAlive()) {
    toast('脚本任务正在运行中，请先停止')
    return
  }
  // 详细日志开关:任务启动前按开关配置日志落盘(运行中改开关不生效);配置失败不阻塞任务
  try {
    setupDetailLog(mainWindow.window.详细日志.isChecked())
  } catch (e: any) {
    console.error('[日志] 详细日志配置失败,不影响任务: ' + (e.message || e))
  }
  smallWindow.show("停止")
  // 交互流程(如获取队友信息选人)传 等待熄屏=false:保持游戏前台,跑完/异常都不熄屏
  var 熄屏 = () => {
    if (等待熄屏 && mainWindow.window.执行完息屏.isChecked()) {
      runtime.accessibilityBridge.getService().performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
    }
  }
  任务线程 = threads.start(() => {
    // 截图计数器是模块级累加的,记下起始值,结束时用差值统计本轮开销
    var 起始调用 = screenCalls
    var 起始截图 = screenCaptures
    try {
      sleep(500)
      fun()
      smallWindow.hide()
      熄屏()
    } catch (e: any) {
      // 手动停止不熄屏;其余异常照常熄屏
      var 已停止 = isStopException(e)
      log(!已停止, e)
      smallWindow.close()
      if (!已停止) 熄屏()
    } finally {
      var 本轮调用 = screenCalls - 起始调用
      var 本轮截图 = screenCaptures - 起始截图
      log('本次执行截图:调用', 本轮调用, '次,实际截图', 本轮截图, '次,缓存命中', 本轮调用 - 本轮截图, '次')
      // 线程正常/异常结束时释放引用;被强杀时此处不执行,但 isAlive() 已为 false,不影响下次启动
      任务线程 = null
    }
  })
}