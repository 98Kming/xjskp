import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector('images/寰球救援_1_0.9_418_2081_472_2107.png')

  免费(): boolean {
    return createRouteAction('images/寰球救援$$免费_1_0.8_48_713_118_773.png')()
  }

  routes(): Route[] {
    return []
  }
}
