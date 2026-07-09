import { BasePage, Route } from './BasePage'
import { createPageDetector } from '../utils/img'

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector('images/寰球救援_1_0.9_418_2081_472_2107.png')

  routes(): Route[] {
    return []
  }
}
