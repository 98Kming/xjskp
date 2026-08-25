import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/巡逻车_1_0.9_298_1017_502_1066.png',
}

export class 巡逻车 extends BasePage {
  name = '巡逻车'
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    return createRouteAction(IMG.任务领取)() && (click(device.width / 2, device.height - 10), sleep(300), click(device.width / 2, device.height - 10), sleep(200), true)
  }

  routes(): Route[] {
    return []
  }
}
