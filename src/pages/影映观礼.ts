import { BasePage, Route } from './BasePage'
import { createPageDetector, getTemplate, imageNameParser, screen, toScreenX, toScreenY, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/影映观礼_1_0.9_206_783_300_863.png',
  观看领取: 'images/影映观礼$$观看领取_1_0.8_342_1000_529_1920.png',
  免费领取: 'images/影映观礼$$免费领取_0_0.9_342_1000_529_1920.png',
}

export class 影映观礼 extends BasePage {
  name = '影映观礼'
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    let 观看领取 = imageNameParser(IMG.观看领取)
    let 免费领取 = imageNameParser(IMG.免费领取)
    let 免费领取模板 = getTemplate(免费领取.rawFileName)
    while (true) {
      var targetResult = images.matchTemplate(screen(), getTemplate(观看领取.rawFileName), {
        region: [观看领取.x1, 观看领取.y1, 观看领取.x2 - 观看领取.x1, 观看领取.y2 - 观看领取.y1],
        threshold: 观看领取.threshold,
        max: 20
      })?.topmost()
      if (targetResult) {
        click(toScreenX(targetResult.point.x), toScreenY(targetResult.point.y))
        if (waitObtain(30000)) {
          sleep(500)
          continue
        }
      }
      targetResult = images.matchTemplate(screen(), 免费领取模板, {
        region: [免费领取.x1, 免费领取.y1, 免费领取.x2 - 免费领取.x1, 免费领取.y2 - 免费领取.y1],
        threshold: 免费领取.threshold,
        max: 20
      })?.topmost()
      if (targetResult) {
        // matchTemplate 返回左上角，点击按钮中心；只点一次，避免 createRouteAction 后又重复点击
        click(toScreenX(targetResult.point.x + 免费领取模板.width / 2), toScreenY(targetResult.point.y + 免费领取模板.height / 2))
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
