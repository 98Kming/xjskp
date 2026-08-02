import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 再别前线太空撤离 extends BasePage {
  name = '再别前线-太空撤离'
  is = createPageDetector('images/太空撤离_1_0.9_4_1465_77_1565.png')
  private 签到Action = createRouteAction('images/太空撤离$$签到_0_0.9_218_1137_923_1864.png')

  click_签到(): boolean {
    return this.签到Action() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
