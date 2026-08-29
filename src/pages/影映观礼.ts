import { BasePage, Route } from './BasePage'
import { createPageDetector, findImageMinYPoint, getTemplate, imageNameParser, screen, toScreenX, toScreenY, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/影映观礼_1_0.9_325_875_470_943.png',
  观看领取: 'images/影映观礼$$观看领取_1_0.8_342_1000_529_1920.png',
  观看领取2: 'images/影映观礼$$观看领取2_1_0.9_358_1000_522_1920.png',
  免费领取: 'images/影映观礼$$免费领取_0_0.9_342_1000_529_1920.png',
  免费领取2: 'images/影映观礼$$免费领取2_0_0.9_374_1000_625_1920.png',
}

export class 影映观礼 extends BasePage {
  name = '影映观礼'
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    while (true) {
      var point = findImageMinYPoint(IMG.观看领取) || findImageMinYPoint(IMG.观看领取2)
      if (point) {
        click(toScreenX(point.x), toScreenY(point.y))
        if (waitObtain(30000)) {
          sleep(500)
          continue
        }
      }
      point = findImageMinYPoint(IMG.免费领取) || findImageMinYPoint(IMG.免费领取2)
      if (point) {
        // matchTemplate 返回左上角，点击按钮中心；只点一次，避免 createRouteAction 后又重复点击
        click(toScreenX(point.x), toScreenY(point.y))
        if (waitObtain(2000)) {
          sleep(500)
          continue
        }
      }
      return true
    }
  }

  routes(): Route[] {
    return []
  }
}
