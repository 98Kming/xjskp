import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, tryCloseModals } from '../utils/img'

export class 随机事件 extends BasePage {
  name = '随机事件'
  is = createPageDetector('images/随机事件_1_0.9_441_624_637_682.png')

  private 领取列表 = [
    createRouteAction('images/随机事件$$领取-答应交易_0_0.9_263_1138_444_1192.png'),
    createRouteAction('images/随机事件$$领取-确定_0_0.9_478_1134_613_1192.png'),
    createRouteAction('images/随机事件$$领取-立即隔离_0_0.9_254_1139_451_1192.png'),
    createRouteAction('images/随机事件$$领取-委婉拒绝_0_0.9_254_1139_451_1192.png'),
    createRouteAction('images/随机事件$$领取-加强巡逻_0_0.9_637_1134_816_1192.png'),
  ]

  /**
   * 尝试领取随机事件：可多次领取，直到 6 秒内无新按钮
   */
  领取(): boolean {
    var deadline = Date.now() + 6000
    var claimed = false
    while (Date.now() < deadline) {
      var found = false
      for (var i = 0; i < this.领取列表.length; i++) {
        if (this.领取列表[i]()) {
          sleep(1000)
          tryCloseModals()
          claimed = true
          found = true
          break  // 扫到就点，下一轮从头再扫
        }
      }
      if (!found) {
        if (claimed) break  // 领过且本轮无新按钮 → 结束
        sleep(800)          // 还没出现过，等入口
      }
    }
    return claimed
  }

  routes(): Route[] {
    return []
  }
}
