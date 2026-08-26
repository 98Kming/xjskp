import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 任务 } from './任务'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/鎏金罗盘_1_0.9_509_1371_596_1436.png',
}

export class 鎏金罗盘 extends BasePage {
  name = '鎏金罗盘'
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
