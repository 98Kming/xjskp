import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/华诞献礼_1_0.9_732_2271_880_2330.png',
  免费: 'images/华诞献礼$$免费_1_0.9_212_2058_339_2110.png', // 覆盖共享键($免费通用按钮):本页免费按钮
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
