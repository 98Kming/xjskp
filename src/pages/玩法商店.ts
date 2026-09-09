import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, getTemplate, imageNameParser, screen, width, height, toScreenX, toScreenY } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/玩法商店_1_0.9_108_2024_291_2071.png',
  超时空军团兵: 'images/_超时空军团兵_0_0.9_125_100_208_h.png',
  购买: 'images/玩法商店$$购买_1_0.9_464_1528_532_1597.png',
}

export class 玩法商店 extends BasePage {
  name = '玩法商店'
  is = createPageDetector(IMG.页面)

  back(): boolean {
    return createRouteAction(IMG.关闭1)()
  }

  /** 购买超时空军团兵碎片：向上滚动 → 找商品（镜像点击）→ 最大 → 购买 */
  buy_超时空军团兵(): boolean {
    swipe(toScreenX(width / 2), toScreenY(height * 0.7), toScreenX(width / 2), toScreenY(height * 0.3), 300)
    sleep(800)

    var parsed = imageNameParser(IMG.超时空军团兵)
    var rw = parsed.w
    var rh = parsed.h
    var template = getTemplate(IMG.超时空军团兵)
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false

    // 镜像点击（和入场券购买一致）
    var cx = toScreenX(width - point.x - template.width / 2)
    var cy = toScreenY(point.y + template.height / 2)
    click(cx, cy)
    sleep(1500)

    // 最大
    var maxAction = createRouteAction(IMG.道具最大)
    for (var i = 0; i < 3; i++) {
      if (maxAction()) break
      sleep(800)
    }
    sleep(500)

    // 购买（玩法商店专用按钮图）
    var buyAction = createRouteAction(IMG.购买)
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
