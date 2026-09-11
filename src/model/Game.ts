import { GameConfig, GameType } from "../MainWindow"
import { smallWindow } from "../SmallWindows"
import { Router } from '../router/Router'
import { screen, width, height, toScreenX, toScreenY, tryCloseModals, select_队友, createRouteAction, imageDetector } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from '../pages/战斗中'
import { 暂停战斗 } from '../pages/暂停战斗'
import { 战斗结束 } from '../pages/战斗结束'
import { 选择技能 } from '../pages/选择技能'
import { 精英掉落 } from '../pages/精英掉落'
import { 寰球救援 } from '../pages/寰球救援'
import { 战斗 } from '../pages/战斗'
import { 组队邀请推荐 } from '../pages/组队邀请-推荐'
import { 组队邀请好友 } from '../pages/组队邀请-好友'
// 页面实例统一来自注册表 pages.ts(重复 new 会触发 Router 重复注册报错)；识别优先级见 pages.ts 内分组注释
import { 战斗中Page, 暂停战斗Page, 战斗结束Page, 选择技能Page, 战斗Page, 寰球救援Page, 接受邀请列表Page } from './pages'
// 精英掉落仅在战斗模式注册(不占日常模式识别次数):懒创建单例,Game 重复启动不重复注册
var 精英掉落单例: 精英掉落 | null = null
import { sharedImages } from '../images'
// 页面级图片映射：sharedImages 透传共享键 + 本页私有键
const IMG = {
  ...sharedImages,
  已激活技能: 'images/战斗中_已激活技能_0_0.9_404_0_674_740.png',
  退队: 'images/_退队_1_0.9_885_1620_958_1860.png',
  踢出: 'images/_踢出_1_0.9_887_1823_956_1857.png',
}
enum GameStatus {
  战斗中, 退出战斗, 战斗结束
}
export class Game {
  // images.read 缺失返回 null 不抛异常(与 getTemplate 不同),模板未提供时不阻塞脚本启动
  static img_元素试炼_挑战 = images.read("./images/元素试炼_挑战.png")
  static img_元素试炼_开始游戏 = images.read("./images/元素试炼_开始游戏.png")
  constructor(private gameConfig: GameConfig) {
    // 懒创建:首次启动注册精英掉落,重复启动复用同一实例(避免 Router 重复注册报错)
    if (!精英掉落单例) { 精英掉落单例 = new 精英掉落() }
    this.精英掉落Page = 精英掉落单例
  }

  private 精英掉落Page: 精英掉落

  private enable_倍速 = false
  private 倍速尝试 = 0 // 每局开倍速尝试次数,防找不到按钮时无限点击
  private level = 0
  private runNum = 0
  private status: GameStatus = GameStatus.战斗结束
  private startTime = 0
  private 已入队 = false // 队员接受邀请成功,等待队长开战,不再执行准备导航
  倍速() {
    if (this.enable_倍速) return
    if (this.倍速尝试 >= 3) return // 每局最多尝试 3 次
    this.倍速尝试++
    if (战斗中Page.已开倍速()) {
      this.enable_倍速 = true
    } else {
      log('开启倍速', 战斗中Page.开倍速())
    }
  }
  currentLevel(): number {
    if (!this.level && 战斗中Page.暂停_point) {
      this.level = 战斗中Page.等级()
      console.log("ocr level: " + this.level)
    }
    return this.level
  }
  reset() {
    this.enable_倍速 = false
    this.倍速尝试 = 0
    this.level = 1
    this.runNum++
    this.status = GameStatus.战斗结束
    this.已入队 = false // 新一局重新走组队准备
    // 重置技能优先级
    this.gameConfig.identifySkill && skillStrategy.resetPriority()
    ui.run(() => {
      smallWindow.window.btn.setText("停止(" + this.runNum + ")")
    })
  }

  /** 检测战斗内弹窗页类型（按优先级短路），无弹窗返回 null；暂停按钮识别偶发失败时兜底信号 */
  private 检测弹窗(img: ImageWrapper): 选择技能 | 暂停战斗 | 战斗结束 | 精英掉落 | null {
    if (选择技能Page.is(img)) return 选择技能Page
    if (暂停战斗Page.is(img)) return 暂停战斗Page
    if (战斗结束Page.is(img)) return 战斗结束Page
    if (this.精英掉落Page.is(img)) return this.精英掉落Page
    return null
  }

  private battleHandler(img: ImageWrapper, modalPage: 选择技能 | 暂停战斗 | 战斗结束 | 精英掉落 | null): boolean {
    if (modalPage === 选择技能Page) {
      log("选择技能中")
      // 6秒内选择技能当成头选宝石效果，不提升等级
      选择技能Page.selectSkill(img, this.gameConfig.identifySkill) && Date.now() - this.startTime > 6 * 1000 && this.level && this.level++
      return true
    } else if (modalPage === 暂停战斗Page) {
      log("暂停中")
      if (this.status == GameStatus.退出战斗) {
        暂停战斗Page.结束战斗()
      } else {
        暂停战斗Page.继续()
      }
      return true
    } else if (modalPage === 战斗结束Page) {
      log("返回中")
      // 快速再战会绕过外层 do-while 的局数停止判定(reset 内 runNum++ 后直接进下一局);
      // 本局结束时 runNum 尚未 +1,已是最后一局(runNum == gameConfig.runNum - 1)时不再战,否则局数配置失效无限打
      if (this.runNum < this.gameConfig.runNum - 1 && 战斗结束Page.再战()) {
        log("战斗结束→快速再战")
        this.reset()
        return true
      }
      // 无快速入口或已是最后一局 → 回退主界面,外层循环重新准备/收尾
      战斗结束Page.back()
      this.reset()
      return false
    } else if (modalPage === this.精英掉落Page) {
      log("精英掉落弹窗，关闭")
      this.精英掉落Page.关闭弹窗()
      return true
    } else if (createRouteAction(IMG.重新连接)()) {
      log("重新连接中")
      return false
    }
    let 已激活技能_point = imageDetector(IMG.已激活技能)
    if (已激活技能_point) {
      click(toScreenX(已激活技能_point.x), toScreenY(已激活技能_point.y) - 100)
      log('已激活技能')
    } else if (imageDetector(IMG.关闭1)) {
      log("游戏中聊天框不处理")
    } else {
      click(width / 2, height - 10)
      log("尝试关闭战斗中未知窗口")
    }
    return false
  }
  队长_准备(): boolean {
    if (this.gameConfig.invite) {
      if (this.gameConfig.teammate == undefined) {
        toast("未选择队员")
        throw new Error("未选择队员")
      }
      // 已在队伍中(退队按钮出现)→ 无需重复邀请
      if (imageDetector(IMG.踢出)) {
        return true
      }
      // 路由到组队邀请弹窗(默认推荐 tab)→ 切好友 tab
      Router.getInstance().go(组队邀请好友)
      // 循环邀请直到离开邀请页(队友确认后弹窗关闭);加次数上限防队友不在线时无限卡死
      var 邀请次数 = 0
      do {
        let point = select_队友(this.gameConfig.teammate)
        if (point) {
          click(toScreenX(point.x), toScreenY(point.y))
        } else {
          // 好友列表找不到队友 → 返回关闭邀请弹窗,外层循环重新邀请
          click(device.width / 2, device.height - 100)
          sleep(1000)
          break
        }
        sleep(2000)
        邀请次数++
      } while (imageDetector(IMG.组队邀请好友) && 邀请次数 < 10)
      // 离开邀请页后确认进队
      if (imageDetector(IMG.踢出)) {
        return true
      }
    }
    return false
  }
  队员_准备(): boolean {
    if (this.gameConfig.acceptInvite) {
      if (this.gameConfig.teammate == undefined) {
        toast("未选择队长")
        throw new Error("未选择队长")
      }
      // 副本邀请按钮(队长发出邀请后战斗页出现)→ 点击进入接受邀请列表
      if (createRouteAction(IMG.副本邀请)()) {
        sleep(1200)
      }
      // 在 接受邀请列表 页 → 找队长点击接受
      if (接受邀请列表Page.is(screen())) {
        let point = select_队友(this.gameConfig.teammate)
        if (point) {
          click(toScreenX(point.x), toScreenY(point.y))
          this.已入队 = true // 已接受邀请,等待队长开战
          return true
        }
      }
    }
    return false
  }
  prepare_精英关卡(): boolean {
    if (this.gameConfig.enableTeam) {
      if (this.gameConfig.isLeader) {
        if (this.队长_准备()) {
          // 仅当开启"开始游戏"才导航进战斗,否则停在组队界面
          return this.gameConfig.enableStart && Router.getInstance().go(战斗中)
        }
      } else {
        // 已入队(接受邀请成功)后不再执行准备/导航,只等战斗开始
        if (!this.已入队 && !this.队员_准备()) {
          return Router.getInstance().go(战斗)
        }
      }
    }
    return true
  }
  prepare_寰球救援(): boolean {
    if (this.gameConfig.enableTeam) {
      if (this.gameConfig.isLeader) {
        if (!Router.getInstance().go(寰球救援)) {
          return false
        }
        if (this.队长_准备()) {
          // 仅当开启"开始游戏"才导航进战斗,否则停在组队界面
          return this.gameConfig.enableStart && Router.getInstance().go(战斗中)
        }
      } else {
        // 已入队(接受邀请成功)后不再执行准备/导航,只等战斗开始
        if (!this.已入队 && !this.队员_准备()) {
          return Router.getInstance().go(寰球救援)
        }
      }
    }
    return true
  }
  prepare_元素试炼(): boolean {
    if (!Game.img_元素试炼_挑战 || !Game.img_元素试炼_开始游戏) {
      log("元素试炼模板缺失(待真机截图补充),跳过")
      return false
    }
    let point = images.findImageInRegion(screen(), Game.img_元素试炼_挑战,
      width * 0.3, height * 0.2, width * 0.4, height * 0.6)
    if (point) {
      click(toScreenX(point.x), toScreenY(point.y))
      sleep(500)
    }
    point = images.findImageInRegion(screen(), Game.img_元素试炼_开始游戏,
      width * 0.2, height * 0.6, width * 0.6, height * 0.3)
    if (point) {
      return click(toScreenX(point.x), toScreenY(point.y))
    }
    return false
  }
  start() {
    // 每次启动重新读取技能页 seekbar 配置(拖动后再次启动要生效)并重置局内计数
    skillStrategy.resetProgress()
    do {
      // 战斗弹窗(选择技能等)只在战斗中弹出,检测到弹窗也视为已在战斗,跳过准备导航
      var 准备img = screen()
      var 准备弹窗 = this.检测弹窗(准备img)
      if (!战斗中Page.is(准备img) && !准备弹窗) {
        // 战斗前准备
        if (this.status == GameStatus.战斗结束) {
          if (this.gameConfig.type == GameType.寰球救援) {
            this.prepare_寰球救援()
          } else if (this.gameConfig.type == GameType.精英关卡) {
            this.prepare_精英关卡()
          } else if (this.gameConfig.type == GameType.普通关卡) {
            this.gameConfig.enableStart && Router.getInstance().go(战斗中)
          } else if (this.gameConfig.type == GameType.元素试炼) {
            this.gameConfig.enableStart && this.prepare_元素试炼()
          } else {
            // 寰球远征_准备 等未支持模式：防死循环，提示后退出
            log("不支持的关卡类型: " + this.gameConfig.type)
            return
          }
        }
      }
      let img = screen()
      this.startTime = Date.now()
      let sleepTime = 2000
      // 弹窗页每轮检测一次，while 条件与 battleHandler 共用（避免重复找图）；
      // 暂停按钮识别偶发失败时，弹窗识别兜底保证仍被处理
      var modalPage = this.检测弹窗(img)
      while (this.status != GameStatus.战斗结束 || 战斗中Page.is(img) || modalPage) {
        if (modalPage || 战斗中Page.hasUplayer(img)) {
          if (this.battleHandler(img, modalPage)) {
            log('战斗中上层窗口处理完成')
            this.status = GameStatus.战斗中
          }
        } else {
          this.status = GameStatus.战斗中
          if (this.gameConfig.timeOut && Date.now() - this.startTime > this.gameConfig.timeOut * 60 * 1000) {
            log('战斗超时 返回')
            this.status = GameStatus.退出战斗
            战斗中Page.暂停()
          }
          // 开关开启时尝试开 15 倍速(每局最多 3 次)
          if (this.gameConfig.倍速) this.倍速()
          // 开启提前退出功能
          if (this.gameConfig.exitLevel) {
            // 如果提前退出等级为1直接退出，不识别当前等级;或者当前等级大于等于提前退出等级
            if (this.gameConfig.exitLevel == 1 || this.currentLevel() >= this.gameConfig.exitLevel) {
              log('提前退出')
              this.status = GameStatus.退出战斗
              战斗中Page.暂停()
              sleepTime = 800
            }
          }
        }
        sleep(sleepTime)
        img = screen()
        modalPage = this.检测弹窗(img)
      }
      if (this.status == GameStatus.战斗结束) {
        log('游戏次数', this.runNum)
      }

    } while (this.runNum != this.gameConfig.runNum && sleep(2000) == undefined)
  }
}