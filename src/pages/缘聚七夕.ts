import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 鹊桥祈缘 } from './鹊桥祈缘'
import { 相思赴约 } from './相思赴约'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/缘聚七夕$_鹊桥祈缘_1_0.9_139_766_247_839.png',
  鹊桥祈缘: 'images/缘聚七夕$_鹊桥祈缘_1_0.9_139_766_247_839.png', // 与页面同图:识别图兼作跳转按钮
  相思赴约: 'images/缘聚七夕$相思赴约_1_0.9_508_1872_623_1972.png',
}

export class 缘聚七夕 extends BasePage {
  name = '缘聚七夕'
  is = createPageDetector(IMG.页面)
  private 鹊桥祈缘Action = createRouteAction(IMG.鹊桥祈缘)
  private 相思赴约Action = createRouteAction(IMG.相思赴约)

  click_鹊桥祈缘(): boolean {
    return this.鹊桥祈缘Action()
  }

  click_相思赴约(): boolean {
    return this.相思赴约Action()
  }

  routes(): Route[] {
    return [
      { target: 鹊桥祈缘, action: this.鹊桥祈缘Action, imagePath: IMG.鹊桥祈缘 },
      { target: 相思赴约, action: this.相思赴约Action, imagePath: IMG.相思赴约 },
    ]
  }
}
