import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 领取体力 } from './领取体力'

export class 好友 extends BasePage {
  name = '好友'
  is = createPageDetector('images/好友_1_0.9_111_1746_284_1794.png')

  一键赠送(): boolean {
    return createRouteAction('images/好友$$一键赠送_1_0.9_237_1883_411_1924.png')()
  }

  routes(): Route[] {
    return [
      { target: 领取体力, action: createRouteAction('images/好友$领取体力_1_0.9_681_1885_851_1924.png'), imagePath: 'images/好友$领取体力_1_0.9_681_1885_851_1924.png' },
    ]
  }
}
