import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 邮件 extends BasePage {
  name = '邮件'
  is = createPageDetector('images/邮件_1_0.9_184_750_514_814.png')

  一键领取(): boolean {
    return createRouteAction('images/邮件$$一键领取_1_0.9_445_1813_643_1877.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
