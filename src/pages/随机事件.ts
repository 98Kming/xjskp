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
   * 尝试领取随机事件：依次查找 n 个领取按钮，找到则点击，然后点确定
   */
  领取(): boolean {
    for (var i = 0; i < this.领取列表.length; i++) {
      if (this.领取列表[i]()) {
        sleep(1000)
        tryCloseModals()
        return true
      }
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
