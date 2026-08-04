import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, width, height, getTemplate, imageNameParser } from '../utils/img'

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector('images/寰球救援_1_0.9_418_2081_472_2107.png')
  private static img_恭喜获得 = getTemplate('images/兑换码_恭喜获得_1_0.9_438_602_637_656.jpg')

  /**
   * 广告门票:点击后看广告,40 秒内出现"恭喜获得"即视为成功。
   * 出现恭喜获得后点击其上方 200px 关闭弹窗并返回。
   */
  广告门票(): boolean {
    // 点击广告门票按钮中心上方 20px
    var filePath = 'images/寰球救援$$广告门票_1_0.9_25_651_88_707.png'
    var parsed = imageNameParser(filePath)
    var tpl = getTemplate(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    sleep(2000)
    var point = images.findImageInRegion(screen(), tpl, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(point.x + tpl.width / 2, point.y - 20)
    log('[寰球救援] 已点击广告门票,等待广告结束...')
    var start = Date.now()
    while (Date.now() - start < 40000) {
      sleep(1000)
      var point = images.findImageInRegion(screen(), 寰球救援.img_恭喜获得,
        width * 0.3, height * 0.2, width * 0.4, height * 0.3, 0.9)
      if (point) {
        log('[寰球救援] 广告门票领取成功(恭喜获得)')
        click(point.x, point.y - 200)
        sleep(800)
        this.back()
        sleep(800)
        return true
      }
    }
    log('[寰球救援] 广告门票 40 秒内未出现恭喜获得')
    return false
  }

  免费(): boolean {
    var action = createRouteAction('images/寰球救援$$免费_1_0.8_48_713_118_773.png')
    for (var i = 0; i < 3; i++) {
      if (action()) {
        sleep(1000)
        this.back()
        //tryCloseModals()
        sleep(500)
        if (action()) {
          sleep(1000)
          this.back()
          //tryCloseModals()
          sleep(500)
        }
        return true
      }
      sleep(1000)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
