import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 巡逻车 extends BasePage {
  name = '巡逻车'
  is = createPageDetector('images/巡逻车_1_0.9_298_1017_502_1066.png')

  领取(): boolean {
    return createRouteAction('images/巡逻车$$领取_1_0.9_733_1756_830_1807.png')() && (sleep(800), this.back(), sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
