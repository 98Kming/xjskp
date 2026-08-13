import { GameConfig, GameType } from "../MainWindow"
import { smallWindow } from "../SmallWindows"
import { Router } from '../router/Router'
import { screen, width, height, toScreenX, toScreenY, tryCloseModals, select_队友, getTemplate } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from '../pages/战斗中'
import { 暂停战斗 } from '../pages/暂停战斗'
import { 战斗结束 } from '../pages/战斗结束'
import { 选择技能 } from '../pages/选择技能'
import { 寰球救援 } from '../pages/寰球救援'
import { 战斗 } from '../pages/战斗'

enum GameStatus {
  战斗中, 退出战斗, 战斗结束
}
export class Game {
  static img_元素试炼_挑战 = getTemplate("images/元素试炼_挑战.png")
  static img_元素试炼_开始游戏 = getTemplate("images/元素试炼_开始游戏.png")
  constructor(private gameConfig: GameConfig) { }

  private 战斗中Page = new 战斗中()
  private 暂停战斗Page = new 暂停战斗()
  private 战斗结束Page = new 战斗结束()
  private 选择技能Page = new 选择技能()
  private 寰球救援Page = new 寰球救援()
  private 战斗Page = new 战斗()

  private enable_倍速 = false
  private level = 0
  private runNum = 0
  private status: GameStatus = GameStatus.战斗结束
  private startTime = 0
  倍速() {
    if (this.enable_倍速) return
    if (this.战斗中Page.已开15倍速()) {
      this.enable_倍速 = true
    } else {
      this.战斗中Page.开15倍速()
    }
  }
  currentLevel(): number {
    if (!this.level && this.战斗中Page.暂停_point) {
      this.level = this.战斗中Page.等级()
      console.log("ocr level: " + this.level)
    }
    return this.level
  }
  reset() {
    this.enable_倍速 = false
    this.level = 1
    this.runNum++
    this.status = GameStatus.战斗结束
    // 重置技能优先级
    this.gameConfig.identifySkill && skillStrategy.resetPriority()
    ui.run(() => {
      smallWindow.window.btn.setText("停止(" + this.runNum + ")")
    })
  }

  private battleHandler(img: ImageWrapper): boolean {
    if (this.选择技能Page.is(img)) {
      // 6秒内选择技能当成头选宝石效果，不提升等级
      this.选择技能Page.selectSkill(img, this.gameConfig.identifySkill) && Date.now() - this.startTime > 6 * 1000 && this.level && this.level++
      return true
    } else if (this.暂停战斗Page.is(img)) {
      log("暂停中")
      if (this.status == GameStatus.退出战斗) {
        this.暂停战斗Page.结束战斗()
      } else {
        this.暂停战斗Page.继续()
      }
      return true
    } else if (this.战斗结束Page.is(img)) {
      log("返回中")
      // 一局结束
      this.战斗结束Page.back()
      this.reset()
    } else {
      if (tryCloseModals()) {
        log("关闭弹窗")
      } else {
        click(width / 2, height - 10)
        log("尝试关闭战斗中未知窗口")
      }
    }
    return false
  }
  队长_准备(): boolean {
    if (this.gameConfig.invite) {
      if (this.gameConfig.teammate == undefined) {
        toast("未选择队员")
        throw new Error("未选择队员")
      }
      // TODO: 退队检测(旧 退队_point)待补：已在队伍中时先退队
      // TODO: 组队邀请页对象未建(见 2026-08-12-组队邀请页面-design.md)，需先路由到邀请页；
      //       注意 select_队友 是死循环(找不到会无限滑动)，前置导航缺失时调用会卡死
      let point = select_队友(this.gameConfig.teammate)
      if (point) {
        click(toScreenX(point.x), toScreenY(point.y))
        sleep(2000)
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
      // TODO: 副本邀请弹窗检测(旧 副本邀请_point)待补；select_队友 为死循环，弹窗未出现时调用会卡死
      let point = select_队友(this.gameConfig.teammate)
      if (point) {
        click(toScreenX(point.x), toScreenY(point.y))
        sleep(1200)
      }
    }
    return false
  }
  prepare_精英关卡(): boolean {
    if (this.gameConfig.enableTeam) {
      if (this.gameConfig.isLeader) {
        if (this.队长_准备()) {
          return Router.getInstance().go(战斗中)
        }
      } else {
        if (!this.队员_准备()) {
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
          return Router.getInstance().go(战斗中)
        }
      } else {
        if (!this.队员_准备()) {
          return Router.getInstance().go(寰球救援)
        }
      }
    }
    return true
  }
  prepare_元素试炼(): boolean {
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
    do {

      if (!this.战斗中Page.is(screen())) {
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
      while (this.status != GameStatus.战斗结束 || this.战斗中Page.is(img)) {
        if (this.战斗中Page.hasUplayer(img)) {
          if (this.battleHandler(img)) {
            log('战斗中上层窗口处理完成')
            this.status = GameStatus.战斗中
          }
        } else {
          this.status = GameStatus.战斗中
          if (this.gameConfig.timeOut && Date.now() - this.startTime > this.gameConfig.timeOut * 60 * 1000) {
            log('战斗超时 返回')
            this.status = GameStatus.退出战斗
            this.战斗中Page.暂停()
          }
          // 队长开启倍速
          if (this.gameConfig.isLeader) this.倍速()
          // 开启提前退出功能
          if (this.gameConfig.exitLevel) {
            // 如果提前退出等级为1直接退出，不识别当前等级;或者当前等级大于等于提前退出等级
            if (this.gameConfig.exitLevel == 1 || this.currentLevel() >= this.gameConfig.exitLevel) {
              log('提前退出')
              this.status = GameStatus.退出战斗
              this.战斗中Page.暂停()
              sleepTime = 800
            }
          }
        }
        sleep(sleepTime)
        img = screen()
      }
      if (this.status == GameStatus.战斗结束) {
        log('游戏次数', this.runNum)
      }

    } while (this.runNum != this.gameConfig.runNum && sleep(2000) == undefined)
  }
}