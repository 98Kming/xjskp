import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageNameParser, getTemplate, screen, toScreenX, toScreenY } from '../utils/img'

export class 寰球远征 extends BasePage {
  name = '寰球远征'
  is = createPageDetector('images/寰球远征$$_开始游戏_1_0.9_515_1741_614_1829.png')

  免费(): boolean {
    var filePath = 'images/寰球远征$$免费_1_0.8_50_812_109_827.png'
    var parsed = imageNameParser(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    var template = getTemplate(filePath)
    for (var i = 0; i < 3; i++) {
      var img = screen()
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      if (point) {
        click(toScreenX(point.x + template.width / 2), toScreenY(point.y + template.height / 2 - 10))
        sleep(1000)
        this.back()
        sleep(500)
        return true
      }
      sleep(1000)
    }
    return false
  }

  开始游戏(): boolean {
    var action = createRouteAction('images/寰球远征$$_开始游戏_1_0.9_515_1741_614_1829.png')
    return action()
  }

  routes(): Route[] {
    return []
  }
}
