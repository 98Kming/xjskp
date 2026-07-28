import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 碧海凉夏 extends BasePage {
  name = '碧海凉夏'
  is = createPageDetector('images/碧海凉夏_1_0.9_455_106_514_176.png')

  免费(): boolean {
    return createRouteAction('images/$免费_0_0.8_201_960_800_1926.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
