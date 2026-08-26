import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 观影便利店 } from './观影便利店'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/观影签到_1_0.9_599_2278_681_2327.png',
  免费领取: 'images/观影签到$$免费领取_0_0.9_794_500_961_2000.png',
  观影便利店: 'images/观影签到$观影便利店_1_0.9_935_2272_1013_2323.png', // 覆盖共享键(无前缀识别图):此处指向观影签到→便利店跳转图
}

export class 观影签到 extends BasePage {
  name = '观影签到'
  is = createPageDetector(IMG.页面)

  免费领取(): boolean {
    let flag = false
    while(createRouteAction(IMG.免费领取)()) {
      flag = true
      click(device.width / 2, device.height - 10)
      sleep(300)
      click(device.width / 2, device.height - 10)
      sleep(200)
    }
    return flag
  }

  routes(): Route[] {
    return [
      { target: 观影便利店, action: createRouteAction(IMG.观影便利店), imagePath: IMG.观影便利店 },
    ]
  }
}
