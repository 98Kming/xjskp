import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/异域挑战-个人奖励_1_0.9_354_2017_531_2066.png',
}

export class 异域挑战个人奖励 extends BasePage {
  name = '异域挑战-个人奖励'
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    return createRouteAction(IMG.奖励领取)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
