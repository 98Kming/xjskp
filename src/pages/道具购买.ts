import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 道具购买 extends BasePage {
  name = '道具购买'
  is = createPageDetector('images/道具购买_0_0.8_453_565_629_617.png')

  最大(): boolean {
    var action = createRouteAction('images/道具购买$$最大_1_0.9_751_1127_810_1161.png')
    for (var i = 0; i < 3; i++) {
      if (action()) return true
      sleep(800)
    }
    return false
  }

  购买(): boolean {
    var maxAction = createRouteAction('images/道具购买$$最大_1_0.9_751_1127_810_1161.png')
    var buyAction = createRouteAction('images/道具购买$$购买_1_0.8_400_1232_528_1311.png')

    for (var i = 0; i < 3; i++) {
      if (maxAction()) break
      sleep(800)
    }
    sleep(500)

    for (var j = 0; j < 3; j++) {
      if (buyAction() && (sleep(800), this.back(), sleep(800), true)) return true
      sleep(800)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
