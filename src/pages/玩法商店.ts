import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageNameParser, width, height, toScreenX, toScreenY } from '../utils/img'
import { sharedImages } from '../images'
import { scrollFind } from '../utils/scroll'
import { 道具购买Page } from './道具购买'

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
    let parsed = imageNameParser(IMG.超时空军团兵)
    let point = scrollFind(IMG.超时空军团兵, 'top', parsed.x1, parsed.y1, width, height * 0.7)
    if (!point) return false
    // 真机验证过的偏移：横向半宽取解析区域宽(非模板宽)，纵向取模板上边缘(非中心)，勿按惯例"修正"
    var cx = toScreenX(width - point.x - parsed.w / 2)
    var cy = toScreenY(point.y)
    log(`[玩法商店] 找到 ${IMG.超时空军团兵} 在 (${cx}, ${cy})`)
    click(cx, cy)
    sleep(800)
    return 道具购买Page.购买(IMG.购买)
  }

  routes(): Route[] {
    return []
  }
}
