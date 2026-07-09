import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 玩法商店 extends BasePage {
  name = '玩法商店'
  is = createPageDetector('images/玩法商店_1_0.9_442_485_639_538.png')

  back(): boolean {
    return createRouteAction('images/$关闭1_0_0.8_800_400_1020_600.png')()
  }

  routes(): Route[] {
    return []
  }
}
