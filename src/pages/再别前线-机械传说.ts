import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 再别前线机械传说 extends BasePage {
  name = '再别前线-机械传说'
  is = createPageDetector('images/机械传说_1_0.9_635_2061_715_2116.png')
  private 免费Action = createRouteAction('images/机械传说$$免费_1_0.9_221_2056_332_2116.png')

  click_免费(): boolean {
    return this.免费Action() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
