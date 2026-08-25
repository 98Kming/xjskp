import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 任务 } from './任务'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/武装降临_1_0.9_741_2338_875_2371.png',
}

export class 武装降临 extends BasePage {
  name = '武装降临'
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
