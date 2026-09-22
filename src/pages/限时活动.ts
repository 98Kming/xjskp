import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'
import { 限时活动_免费 } from './限时活动_免费'
import { 限时活动_签到领取 } from './限时活动_签到领取'

const IMG = {
  ...sharedImages,
  页面: 'images/桂韵中秋$_桂礼盈仓_1_0.8_318_971_441_1026.png',// 与页面同图:识别图兼作跳转按钮
  签到领取: 'images/桂韵中秋$皓月佳期_1_0.9_808_1558_931_1626.png',
}

export class 限时活动 extends BasePage {
  name = '限时活动'
  is = createPageDetector(IMG.页面)
  private 限时活动_免费Action = createRouteAction(IMG.页面)
  private 限时活动_签到领取Action = createRouteAction(IMG.签到领取)

  click_限时活动_免费(): boolean {
    return this.限时活动_免费Action()
  }

  click_限时活动_签到领取(): boolean {
    return this.限时活动_签到领取Action()
  }

  routes(): Route[] {
    return [
      { target: 限时活动_免费, action: this.限时活动_免费Action, imagePath: IMG.页面 },
      { target: 限时活动_签到领取, action: this.限时活动_签到领取Action, imagePath: IMG.签到领取 },
    ]
  }
}
