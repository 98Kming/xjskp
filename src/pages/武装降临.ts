import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 任务 } from './任务'

export class 武装降临 extends BasePage {
  name = '武装降临'
  is = createPageDetector('images/武装降临_1_0.9_741_2338_875_2371.png')
  private 任务Action = createRouteAction('images/$任务_1_0.9_51_482_99_526.png')

  click_任务(): boolean {
    return this.任务Action()
  }

  routes(): Route[] {
    return [
      { target: 任务, action: this.任务Action, imagePath: 'images/$任务_1_0.9_51_482_99_526.png' },
    ]
  }
}
