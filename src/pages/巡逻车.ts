import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 巡逻车 extends BasePage {
  name = '巡逻车'
  is = createPageDetector('images/巡逻车_1_0.9_298_1017_502_1066.png')

  领取(): boolean {
    return createRouteAction('images/任务$$领取_0_0.9_600_443_w_h.png')() && (click(device.width / 2, device.height - 10), sleep(300), click(device.width / 2, device.height - 10), sleep(200), true)
  }

  routes(): Route[] {
    return []
  }
}
