import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/相思赴约_1_0.9_64_1654_117_1694.png',
  签到: 'images/相思赴约$$签到_1_0.9_829_1686_934_1743.png',
}

export class 相思赴约 extends BasePage {
  name = '相思赴约'
  is = createPageDetector(IMG.页面)
  private 签到Action = createRouteAction(IMG.签到)

  click_签到(): boolean {
    return this.签到Action() && (sleep(1600), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
