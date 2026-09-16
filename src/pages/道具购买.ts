import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/道具购买_1_0.8_453_856_629_908.png',
  购买: 'images/道具购买$$购买_1_0.8_400_1524_528_1603.png',
}

export class 道具购买 extends BasePage {
  name = '道具购买'
  is = createPageDetector(IMG.页面)

  购买(购买_filePath: string = IMG.购买): boolean {
    var maxAction = createRouteAction(IMG.道具最大)
    var buyAction = createRouteAction(购买_filePath)

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

export var 道具购买Page = new 道具购买()
