import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 引航行动时域珍藏 } from './引航行动-时域珍藏'
import { 引航行动每日观察 } from './引航行动-每日观察'

export class 引航行动 extends BasePage {
  name = '引航行动'
  is = createPageDetector('images/引航行动$_引航行动-每日观察_1_0.9_382_1537_442_1623.png')
  private 时域珍藏Action = createRouteAction('images/引航行动$引航行动-时域珍藏_1_0.9_766_520_875_624.png')
  private 每日观察Action = createRouteAction('images/引航行动$_引航行动-每日观察_1_0.9_382_1537_442_1623.png')

  click_时域珍藏(): boolean {
    return this.时域珍藏Action()
  }

  click_每日观察(): boolean {
    return this.每日观察Action()
  }

  routes(): Route[] {
    return [
      { target: 引航行动时域珍藏, action: this.时域珍藏Action, imagePath: 'images/引航行动$引航行动-时域珍藏_1_0.9_766_520_875_624.png' },
      { target: 引航行动每日观察, action: this.每日观察Action, imagePath: 'images/引航行动$_引航行动-每日观察_1_0.9_382_1537_442_1623.png' },
    ]
  }
}
