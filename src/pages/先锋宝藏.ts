import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 先锋宝藏 extends BasePage {
  name = '先锋宝藏'
  is = createPageDetector('images/先锋宝藏_1_0.9_457_1065_624_1124.png')

  免费(): boolean {
    return createRouteAction('images/$免费_0_0.8_201_960_800_1926.png')()
  }

  routes(): Route[] {
    return []
  }
}
