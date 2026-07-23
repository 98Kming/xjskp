import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, getTemplate, imageNameParser, screen, width, height } from '../utils/img'

export class 玩法商店 extends BasePage {
  name = '玩法商店'
  is = createPageDetector('images/玩法商店_1_0.9_108_1732_291_1779.png')

  back(): boolean {
    return createRouteAction('images/$关闭1_0_0.8_800_400_1020_600.png')()
  }

  /** 购买超时空军团兵碎片：向上滚动 → 找商品（镜像点击）→ 最大 → 购买 */
  buy_超时空军团兵(): boolean {
    swipe(width / 2, height * 0.7, width / 2, height * 0.3, 300)
    sleep(800)

    var parsed = imageNameParser('images/_超时空军团兵_0_0.9_125_100_208_h.png')
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    var template = getTemplate('images/_超时空军团兵_0_0.9_125_100_208_h.png')
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false

    // 镜像点击（和入场券购买一致）
    var cx = width - point.x - template.width / 2
    var cy = point.y + template.height / 2
    click(cx, cy)
    sleep(1500)

    // 最大
    var maxAction = createRouteAction('images/道具购买$$最大_1_0.9_751_1127_810_1161.png')
    for (var i = 0; i < 3; i++) {
      if (maxAction()) break
      sleep(800)
    }
    sleep(500)

    // 购买（玩法商店专用按钮图）
    var buyAction = createRouteAction('images/玩法商店$$购买_1_0.9_464_1528_532_1597.png')
    for (var j = 0; j < 3; j++) {
      if (buyAction()) return true
      sleep(800)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
