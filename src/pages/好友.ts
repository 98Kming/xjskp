import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 好友 extends BasePage {
  name = '好友'
  is = createPageDetector('images/好友$$一键赠送_1_0.9_237_1883_411_1924.png')

  领取体力(): boolean {
    return createRouteAction('images/好友$$领取体力_1_0.9_681_1885_851_1924.png')()
  }

  一键赠送(): boolean {
    return createRouteAction('images/好友$$一键赠送_1_0.9_237_1883_411_1924.png')()
  }

  routes(): Route[] {
    return []
  }
}
