import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, tryCloseModals } from '../utils/img'

export class 随机事件 extends BasePage {
  name = '随机事件'
  is = createPageDetector('images/随机事件_1_0.9_441_624_637_682.png')
  private 结束Action = createRouteAction('images/随机事件$$领取-结束_0_0.9_435_1425_654_1482.png')

  private 领取列表 = [
    createRouteAction('images/随机事件$$领取-答应交易_0_0.9_263_1138_444_1192.png'),
    createRouteAction('images/随机事件$$领取-确定_0_0.9_478_1134_613_1192.png'),
    createRouteAction('images/随机事件$$领取-立即隔离_0_0.9_254_1139_451_1192.png'),
    createRouteAction('images/随机事件$$领取-立即净化_0_0.9_264_1432_445_1480.png'),
    createRouteAction('images/随机事件$$领取-批准进入_0_0.9_269_1432_444_1482.png'),
    createRouteAction('images/随机事件$$领取-委婉拒绝_0_0.9_254_1139_451_1192.png'),
    createRouteAction('images/随机事件$$领取-加强巡逻_0_0.9_637_1134_816_1192.png'),
    createRouteAction('images/随机事件$$领取-优先民生_0_0.9_639_1434_817_1479.png'),
    createRouteAction('images/随机事件$$领取-前往搜救_0_0.9_266_1434_441_1481.png'),
    createRouteAction('images/随机事件$$领取-暂时收留_0_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-没收严惩_0_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-允许进入_0_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-出兵支援_0_0.9_269_1432_444_1482.png'),
  ]

  /**
   * 领取随机事件：轮询领取列表，扫到就点，直到无新按钮
   */
  领取(): boolean {
    var claimed = false
    var idleRounds = 0
    while (true) {
      var found = false
      for (var i = 0; i < this.领取列表.length; i++) {
        // 出现结束按钮说明事件已完成，不点直接返回
        if (this.结束Action()) return true
        if (this.领取列表[i]()) {
          sleep(1000)
          tryCloseModals()
          claimed = true
          found = true
          idleRounds = 0
          break  // 扫到就点，下一轮从头再扫
        }
      }
      if (!found) {
        if (claimed) break  // 领过且本轮无新按钮 → 结束
        idleRounds++
        if (idleRounds >= 5) break  // 等约 4 秒仍无按钮 → 放弃
        sleep(800)                  // 还没出现过，等入口
      }
    }
    return claimed
  }

  routes(): Route[] {
    return []
  }
}
