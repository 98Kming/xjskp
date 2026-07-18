import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 引航行动时域珍藏 extends BasePage {
  name = '引航行动-时域珍藏'
  is = createPageDetector('images/引航行动-时域珍藏_1_0.9_648_2261_771_2325.png')
  private 免费Action = createRouteAction('images/引航行动-时域珍藏$$免费_1_0.9_335_2262_443_2317.png')

  click_免费(): boolean {
    return this.免费Action() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
