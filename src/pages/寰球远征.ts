import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 寰球远征 extends BasePage {
  name = '寰球远征'
  is = createPageDetector('images/寰球远征$$_开始游戏_1_0.8_515_1741_614_1829.png')

  免费(): boolean {
    var action = createRouteAction('images/寰球远征$$免费_1_0.8_47_766_110_808.png')
    for (var i = 0; i < 3; i++) {
      let flag = action() 
      sleep(1000)
      if (flag) {
        return true
      }
    }
    return false
  }

  开始游戏(): boolean {
    var action = createRouteAction('images/寰球远征$$_开始游戏_1_0.8_515_1741_614_1829.png')
    for (var i = 0; i < 3; i++) {
      if (action()) return true
      sleep(1000)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
