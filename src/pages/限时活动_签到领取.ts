import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/踏览神州_1_0.9_23_1708_133_1782.png',
  签到: 'images/踏览神州$$签到_1_0.9_807_1671_943_1724.png',
}

export class 限时活动_签到领取 extends BasePage {
  name = '限时活动_签到领取'
  is = createPageDetector(IMG.页面)
  private 签到Action = createRouteAction(IMG.签到)

  click_签到领取(): boolean {
    sleep(500)
    return this.签到Action() && (sleep(1600), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
