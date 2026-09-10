import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'
import { 限时活动_免费 } from './限时活动_免费'
import { 限时活动_签到领取 } from './限时活动_签到领取'

const IMG = {
  ...sharedImages,
  页面: 'images/狂欢嘉年华$_火线补给_1_0.9_472_1162_572_1217.png',// 与页面同图:识别图兼作跳转按钮
  枪焰巡演: 'images/狂欢嘉年华$枪焰巡演_1_0.9_339_690_446_750.png',
}

export class 限时活动 extends BasePage {
  name = '限时活动'
  is = createPageDetector(IMG.页面)
  private 限时活动_免费Action = createRouteAction(IMG.页面)
  private 限时活动_签到领取Action = createRouteAction(IMG.枪焰巡演)

  click_限时活动_免费(): boolean {
    return this.限时活动_免费Action()
  }

  click_限时活动_签到领取(): boolean {
    return this.限时活动_签到领取Action()
  }

  routes(): Route[] {
    return [
      { target: 限时活动_免费, action: this.限时活动_免费Action, imagePath: IMG.页面 },
      { target: 限时活动_签到领取, action: this.限时活动_签到领取Action, imagePath: IMG.枪焰巡演 },
    ]
  }
}
