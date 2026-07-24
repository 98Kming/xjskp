import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 异域挑战个人奖励 extends BasePage {
  name = '异域挑战-个人奖励'
  is = createPageDetector('images/异域挑战-个人奖励_1_0.9_354_2017_531_2066.png')

  领取(): boolean {
    return createRouteAction('images/$领取_0_0.8_761_700_864_1500.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
