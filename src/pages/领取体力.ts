import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/领取体力_1_0.9_443_857_633_899.png',
  一键领取: 'images/领取体力$$一键领取_1_0.9_466_1578_637_1620.png', // 覆盖共享键($一键领取):本页的"一键领取"按钮图
}

export class 领取体力 extends BasePage {
  name = '领取体力'
  is = createPageDetector(IMG.页面)

  一键领取(): boolean {
    return createRouteAction(IMG.一键领取)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
