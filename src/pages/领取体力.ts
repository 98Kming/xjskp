import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 领取体力 extends BasePage {
  name = '领取体力'
  is = createPageDetector('images/领取体力_1_0.9_443_857_633_899.png')

  一键领取(): boolean {
    return createRouteAction('images/领取体力$$一键领取_1_0.9_466_1578_637_1620.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
