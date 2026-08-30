// src/model/快速退出.ts — 快速退出刷次数:完全复用 Game 战斗循环
// new Game(快速退出配置).start():普通关卡 + exitLevel=1(进战斗立即暂停) + runNum(局数),
// Game 内部 暂停→结算→快速再战 循环(结算页"再战"直接进下一局,免去每局回主界面导航);
// 进战斗的"前往/重新连接"弹窗由 Router 的 closeButtons 统一关闭(前往见 src/utils/img.ts)
// 由日常任务"快速退出N次"开关控制,执行次数从开关配套输入框读取
import { Game } from './Game'
import { GameConfig, GameType } from '../MainWindow'

/** Game 配置:普通关卡 + 进战斗立即暂停退出(exitLevel=1 时 Game 不识别等级直接退出) */
class 快速退出配置 extends GameConfig {
  type: GameType = GameType.普通关卡
  enableStart: boolean = true // 异常回退到战斗页时由 Game 重新 go(战斗中) 兜底
  exitLevel: number = 1
  constructor(次数: number) {
    super()
    this.runNum = 次数
  }
}

export class 快速退出 {
  /** 快速退出刷次数 total 次:Game 循环内完成进战斗→暂停→结算→再战;导航异常由 Game 上抛(Router NavigationError) */
  static start(total: number): boolean {
    new Game(new 快速退出配置(total)).start()
    return true
  }
}
