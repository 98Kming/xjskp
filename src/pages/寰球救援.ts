import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, tryCloseModals } from '../utils/img'

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector('images/寰球救援_1_0.9_418_2081_472_2107.png')

  免费(): boolean {
    var action = createRouteAction('images/寰球救援$$免费_0_0.8_48_713_118_773.png')
    for (var i = 0; i < 3; i++) {
      if (action()) {
        sleep(1000)
        this.back()
        //tryCloseModals()
        sleep(500)
        if (action()) {
          sleep(1000)
          this.back()
          //tryCloseModals()
          sleep(500)
        }
        return true
      }
      sleep(1000)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
