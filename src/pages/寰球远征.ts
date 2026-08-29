import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageNameParser, getTemplate, screen, toScreenX, toScreenY } from '../utils/img'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/寰球远征$$_开始游戏_1_0.9_515_2220_614_2308.png', // 页面识别图兼作开始游戏按钮
  免费: 'images/寰球远征$$免费_1_0.8_50_793_109_930.png', // 覆盖共享键($免费):本页免费按钮图
}

export class 寰球远征 extends BasePage {
  name = '寰球远征'
  is = createPageDetector(IMG.页面)

  免费(): boolean {
    var filePath = IMG.免费
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
    var action = createRouteAction(IMG.页面)
    return action()
  }

  routes(): Route[] {
    return [
      // 开始游戏 → 进入战斗中
      { target: 战斗中, action: createRouteAction(IMG.页面), imagePath: IMG.页面 },
    ]
  }
}
