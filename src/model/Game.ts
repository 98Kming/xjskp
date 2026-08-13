import { GameConfig, GameType } from "../MainWindow"
import { smallWindow } from "../SmallWindows"
import { Router } from '../router/Router'
import { screen, width, height, tryCloseModals, select_队友, getTemplate } from '../utils/img'
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
  倍速(img: ImageWrapper) {
    if (this.enable_倍速) return
    if (!this.倍速_point) {
      this.倍速_point = images.findMultiColors(img, Game.colors_倍速, Game.colors_倍速_多点,
        { region: [0, 0, screen.width * 0.2, screen.height * 0.4], threshold: 26 })
    }
    if (this.倍速_point) {
      let x = this.倍速_point.x
      while (--x > 0) {
        let color = images.pixel(img, x, this.倍速_point.y)
        if (colors.isSimilar(color, "#ee8800", 10)) {
          this.enable_倍速 = true
          return
        }
      }
      click(this.倍速_point.x + 10, this.倍速_point.y + 10)
    }
  }
  currentLevel(img: ImageWrapper) {
    if (!this.level && page_战斗中.暂停_point) {
      let temp = images.clip(img, screen.width / 2 - 50, page_战斗中.暂停_point.y, 100, page_战斗中.暂停_point.y + 100)
      let ocrResult = ocrPointFind(ocr_zh(temp), "级")
      temp.recycle()
      if (ocrResult) {
        const matchResult = ocrResult.text.match(/^[^@]+/)
        let num = matchResult ? matchResult[0].replace(/\D/g, "") : ""
        if (num && parseInt(num) <= 20 && parseInt(num) >= 1) {
          this.level = parseInt(num)
        }
      }
      console.log("ocr level: " + this.level)
    }
    // console.log("level: " + this.level)
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

  battleHandler(img: ImageWrapper): boolean {
    if (page_选择技能.is(img)) {
      // 6秒内选择技能当成头选宝石效果，不提升等级
      page_选择技能.back(this.gameConfig.identifySkill) && Date.now() - this.startTime > 6 * 1000 && this.level && this.level++
      return true
    } else if (page_精英掉落.is(img)) {
      log("精英掉落中")
      page_精英掉落.back()
      return true
    } else if (page_暂停.is(img)) {
      log("暂停中")
      if (this.status == GameStatus.退出战斗) {
        page_暂停.退出()
      } else {
        page_暂停.back()
      }
      return true
    } else if (page_返回.is(img)) {
      log("返回中")
      // 一局结束
      page_返回.back()
      this.reset()
    } else if (page_重新连接.is(img)) {
      log("重新连接中")
      page_重新连接.back()
    } else {
      if (关闭_point(img)) {
        log("游戏中聊天框不处理")
      } else {
        click(screen.width / 2, screen.height - 10)
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
      if (退队_point()) {
        return true
      }
      if (PageRoute.goto(page_组队邀请_好友)) {
        do {
          page_组队邀请_好友.click_邀请(this.gameConfig.teammate)
          sleep(2000)
        } while (page_组队邀请_好友.is(screen.capture()))
      }
    }
    if (退队_point()) {
      return true
    }
    return false
  }
  队员_准备(): boolean {
    if (this.gameConfig.acceptInvite) {
      if (this.gameConfig.teammate == undefined) {
        toast("未选择队长")
        throw new Error("未选择队长")
      }
      let point = 副本邀请_point()
      if (point) {
        click(point.x, point.y)
        sleep(1200)
      }
      if (page_组队邀请_接受邀请列表.is(screen.capture())) {
        return page_组队邀请_接受邀请列表.click_接受邀请(this.gameConfig.teammate)
      }
    }
    return false
  }
  prepare_精英关卡(): boolean {
    if (this.gameConfig.enableTeam) {
      if (this.gameConfig.isLeader) {
        if (this.队长_准备()) {
          return PageRoute.goto(page_战斗中, 1, 1)
        }
      } else {
        if (!this.队员_准备()) {
          return PageRoute.goto(page_战斗, 1, 1)
        }
      }
    }
    return true
  }
  prepare_寰球救援(): boolean {
    if (this.gameConfig.enableTeam) {
      if (this.gameConfig.isLeader) {
        if (!PageRoute.goto(page_寰球救援, 1, 1)) {
          return false
        }
        if (this.队长_准备()) {
          return PageRoute.goto(page_战斗中, 1, 1)
        }
      } else {
        if (!this.队员_准备()) {
          return PageRoute.goto(page_寰球救援, 1, 1)
        }
      }
    }
    return true
  }
  prepare_元素试炼(): boolean {
    let point = images.findImageInRegion(screen.capture(), Game.img_元素试炼_挑战,
      screen.width * 0.3, screen.height * 0.2, screen.width * 0.4, screen.height * 0.6)
    if (point) {
      click(point.x, point.y)
      sleep(500)
    }
    point = images.findImageInRegion(screen.capture(), Game.img_元素试炼_开始游戏,
      screen.width * 0.2, screen.height * 0.6, screen.width * 0.6, screen.height * 0.3)
    if (point) {
      return click(point.x, point.y)
    }
    return false
  }
  start() {
    do {
      
      if (!page_战斗中.is(screen.capture())) {
        // 战斗前准备
        if (this.status == GameStatus.战斗结束) {
          if (this.gameConfig.type == GameType.寰球救援) {
            this.prepare_寰球救援()
          } else if (this.gameConfig.type == GameType.精英关卡) {
            this.prepare_精英关卡()
          } else if (this.gameConfig.type == GameType.普通关卡) {
            this.gameConfig.enableStart && PageRoute.goto(page_战斗中)
          } else if (this.gameConfig.type == GameType.元素试炼) {
            this.gameConfig.enableStart && this.prepare_元素试炼()
          }
        }
      }
      let img = screen.capture()
      this.startTime = Date.now()
      let sleepTime = 2000
      while (this.status != GameStatus.战斗结束 || page_战斗中.is(img)) {
        if (page_战斗中.hasUplayer(img)) {
          if (this.battleHandler(img)) {
            log('战斗中上层窗口处理完成')
            this.status = GameStatus.战斗中
          }
        } else {
          this.status = GameStatus.战斗中
          if (this.gameConfig.timeOut && Date.now() - this.startTime > this.gameConfig.timeOut * 60 * 1000) {
            log('战斗超时 返回')
            this.status = GameStatus.退出战斗
            page_战斗中.back()
          }
          // 队长开启倍速
          if (this.gameConfig.isLeader) this.倍速(img)
          // 开启提前退出功能
          if (this.gameConfig.exitLevel) {
            // 如果提前退出等级为1直接退出，不识别当前等级;或者当前等级大于等于提前退出等级
            if (this.gameConfig.exitLevel == 1 || this.currentLevel(img) >= this.gameConfig.exitLevel) {
              log('提前退出')
              this.status = GameStatus.退出战斗
              page_战斗中.back()
              sleepTime = 800
            }
          }
        }
        sleep(sleepTime)
        img = screen.capture()
      }
      if (this.status == GameStatus.战斗结束) {
        log('游戏次数', this.runNum)
      }

    } while (this.runNum != this.gameConfig.runNum && sleep(2000) == undefined)
  }
}