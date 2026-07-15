import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 幸运锦鲤免费福利 extends BasePage {
  name = '幸运锦鲤-免费福利'
  is = createPageDetector('images/幸运锦鲤-免费福利_1_0.8_162_966_367_1018.png')

  领取奖励(): boolean {
    return createRouteAction('images/幸运锦鲤-免费福利$$领取奖励_0_0.9_45_1827_981_1870.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
