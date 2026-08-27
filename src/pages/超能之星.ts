import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/超能之星_1_0.9_739_2238_872_2310.png',
  免费: 'images/超能之星$$免费_1_0.8_240_2050_370_2113.png', // 覆盖共享键($免费通用按钮):本页免费按钮
}

export class 超能之星 extends BasePage {
  name = '超能之星'
  is = createPageDetector(IMG.页面)
  private 免费Action = createRouteAction(IMG.免费)

  click_免费(): boolean {
    sleep(300)
    if(this.免费Action()) {
      return waitObtain(2000,300) && (this.back(), sleep(500), true)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
