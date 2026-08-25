import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/先锋宝藏_1_0.9_457_1065_624_1124.png',
}

export class 先锋宝藏 extends BasePage {
  name = '先锋宝藏'
  is = createPageDetector(IMG.页面)

  免费(): boolean {
    return createRouteAction(IMG.免费)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
