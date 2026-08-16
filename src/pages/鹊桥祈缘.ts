import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 鹊桥祈缘 extends BasePage {
  name = '鹊桥祈缘'
  is = createPageDetector('images/鹊桥祈缘_1_0.9_768_2277_845_2321.png')
  private 免费Action = createRouteAction('images/鹊桥祈缘$$免费_1_0.9_220_2062_339_2113.png')

  click_免费(): boolean {
    return this.免费Action() && (sleep(1200), this.back(), sleep(1200), true)
  }

  routes(): Route[] {
    return []
  }
}
