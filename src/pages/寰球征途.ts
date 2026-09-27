import { BasePage, Route } from './BasePage'
import { createPageDetector, toScreenX, toScreenY, waitForImage, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/寰球征途_1_0.9_32_148_97_194.png',
  免费: 'images/寰球征途$$免费_1_0.7_51_713_106_800.png', // 覆盖共享键($免费):本页免费按钮图
}

export class 寰球征途 extends BasePage {
  name = '寰球征途'
  is = createPageDetector(IMG.页面)

  /**
   * 免费:点击后弹出"恭喜获得",等弹窗出现即视为领取成功(与 寰球救援.广告门票 同款 waitObtain)。
   * 超时按 8 秒取:无广告播放的普通领取,弹窗 1~2 秒内必现;
   * 已领过时点击无效,不按广告门票的 30 秒死等,避免每轮日常白等。
   */
  免费(): boolean {
    var point = waitForImage(IMG.免费, 2000, 600)
    if (point) {
      click(toScreenX(point.x), toScreenY(point.y))
      return waitObtain(1200)
    }
    log('[寰球征途] 未找到免费')
    return false
  }

  routes(): Route[] {
    return []
  }
}
