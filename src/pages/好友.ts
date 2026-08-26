import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 领取体力 } from './领取体力'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/好友_1_0.9_111_2038_284_2086.png',
  一键赠送: 'images/好友$$一键赠送_1_0.9_237_1883_411_1924.png',
  领取体力: 'images/好友$领取体力_1_0.9_681_1885_851_1924.png',
}

export class 好友 extends BasePage {
  name = '好友'
  is = createPageDetector(IMG.页面)

  一键赠送(): boolean {
    return createRouteAction(IMG.一键赠送)()
  }

  routes(): Route[] {
    return [
      { target: 领取体力, action: createRouteAction(IMG.领取体力), imagePath: IMG.领取体力 },
    ]
  }
}
