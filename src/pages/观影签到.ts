import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 观影便利店 } from './观影便利店'

export class 观影签到 extends BasePage {
  name = '观影签到'
  is = createPageDetector('images/观影签到_1_0.9_599_2278_681_2327.png')

  免费领取(): boolean {
    while(createRouteAction('images/观影签到$$免费领取_0_0.9_794_500_961_1200.png')()) {
      click(device.width / 2, device.height - 10)
      sleep(300)
      click(device.width / 2, device.height - 10)
      sleep(200)
    }
    return true
  }

  routes(): Route[] {
    return [
      { target: 观影便利店, action: createRouteAction('images/观影签到$观影便利店_1_0.9_935_2272_1013_2323.png'), imagePath: 'images/观影签到$观影便利店_1_0.9_935_2272_1013_2323.png' },
    ]
  }
}
