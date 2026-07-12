import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 武装降临任务 } from './武装降临-任务'

export class 武装降临 extends BasePage {
  name = '武装降临'
  is = createPageDetector('images/武装降临_1_0.9_741_1858_875_1891.png')
  private 任务Action = createRouteAction('images/武装降临$武装降临-任务_1_0.9_50_363_115_424.png')

  click_任务(): boolean {
    return this.任务Action()
  }

  routes(): Route[] {
    return [
      { target: 武装降临任务, action: this.任务Action, imagePath: 'images/武装降临$武装降临-任务_1_0.9_50_363_115_424.png' },
    ]
  }
}
