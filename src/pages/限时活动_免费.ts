import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/桂礼盈仓_1_0.9_724_2279_891_2321.png',
  免费: 'images/桂礼盈仓$$免费_1_0.9_217_2061_342_2115.png', // 覆盖共享键($免费通用按钮):本页免费按钮
}

export class 限时活动_免费 extends BasePage {
  name = '限时活动_免费'
  is = createPageDetector(IMG.页面)
  private 免费Action = createRouteAction(IMG.免费)

  click_免费(): boolean {
    sleep(800)
    return this.免费Action() && (waitObtain(2000,500), sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
