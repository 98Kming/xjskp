import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/食堂$$_一键领取_1_0.9_442_2268_641_2325.png',
}

export class 食堂 extends BasePage {
  name = '食堂'
  // 用「一键领取」按钮作为页面特征检测
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    return createRouteAction(IMG.页面)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
