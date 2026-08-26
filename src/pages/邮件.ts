import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/邮件_1_0.9_184_750_514_814.png',
  一键领取: 'images/邮件$$一键领取_1_0.9_445_1813_643_1877.png', // 覆盖共享键($一键领取):本页的"一键领取"按钮图
}

export class 邮件 extends BasePage {
  name = '邮件'
  is = createPageDetector(IMG.页面)

  一键领取(): boolean {
    return createRouteAction(IMG.一键领取)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return []
  }
}
