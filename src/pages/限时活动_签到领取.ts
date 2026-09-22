import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/皓月佳期_1_0.9_46_1704_195_1755.png',
  签到: 'images/皓月佳期$$签到_1_0.9_829_1669_938_1720.png',
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
