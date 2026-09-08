import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 任务 } from './任务'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/丛林遗迹$_任务_1_0.9_42_634_94_674.png',
}

export class 丛林遗迹 extends BasePage {
  name = '丛林遗迹'
  is = createPageDetector(IMG.页面)
  private 任务Action = createRouteAction(IMG.页面)

  click_任务(): boolean {
    return this.任务Action()
  }

  routes(): Route[] {
    return [
      { target: 任务, action: this.任务Action, imagePath: IMG.任务 },
    ]
  }
}
