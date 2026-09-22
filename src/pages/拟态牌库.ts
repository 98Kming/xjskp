import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 任务 } from './任务'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/拟态牌库_1_0.9_918_1633_972_1662.png',
}

export class 拟态牌库 extends BasePage {
  name = '拟态牌库'
  is = createPageDetector(IMG.页面)
  private 任务Action = createRouteAction(IMG.任务)

  click_任务(): boolean {
    return this.任务Action()
  }

  routes(): Route[] {
    return [
      { target: 任务, action: this.任务Action, imagePath: IMG.任务 },
    ]
  }
}
