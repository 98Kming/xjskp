import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 相思赴约 extends BasePage {
  name = '相思赴约'
  is = createPageDetector('images/相思赴约_1_0.9_64_1654_117_1694.png')
  private 签到Action = createRouteAction('images/相思赴约$$签到_1_0.9_829_1686_934_1743.png')

  click_签到(): boolean {
    return this.签到Action() && (sleep(1600), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
