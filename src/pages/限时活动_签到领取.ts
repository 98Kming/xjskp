import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/枪焰巡演_1_0.8_427_2348_501_2394.png',
  签到: 'images/枪焰巡演$$可领取_0_0.9_100_686_540_2000.png',
}

export class 限时活动_签到领取 extends BasePage {
  name = '限时活动_签到领取'
  is = createPageDetector(IMG.页面)
  private 签到Action = createRouteAction(IMG.签到)

  click_签到领取(): boolean {
    return this.签到Action() && (sleep(1600), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
