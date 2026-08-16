import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 鹊桥祈缘 } from './鹊桥祈缘'
import { 相思赴约 } from './相思赴约'

export class 缘聚七夕 extends BasePage {
  name = '缘聚七夕'
  is = createPageDetector('images/缘聚七夕$_鹊桥祈缘_1_0.9_139_766_247_839.png')
  private 鹊桥祈缘Action = createRouteAction('images/缘聚七夕$_鹊桥祈缘_1_0.9_139_766_247_839.png')
  private 相思赴约Action = createRouteAction('images/缘聚七夕$相思赴约_1_0.9_508_1872_623_1972.png')

  click_鹊桥祈缘(): boolean {
    return this.鹊桥祈缘Action()
  }

  click_相思赴约(): boolean {
    return this.相思赴约Action()
  }

  routes(): Route[] {
    return [
      { target: 鹊桥祈缘, action: this.鹊桥祈缘Action, imagePath: 'images/缘聚七夕$_鹊桥祈缘_1_0.9_139_766_247_839.png' },
      { target: 相思赴约, action: this.相思赴约Action, imagePath: 'images/缘聚七夕$相思赴约_1_0.9_508_1872_623_1972.png' },
    ]
  }
}
