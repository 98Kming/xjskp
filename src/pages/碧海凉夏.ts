import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/碧海凉夏_1_0.9_455_106_514_176.png',
}

export class 碧海凉夏 extends BasePage {
  name = '碧海凉夏'
  is = createPageDetector(IMG.页面)

  免费(): boolean {
    return createRouteAction(IMG.免费)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
