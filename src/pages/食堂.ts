import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 食堂 extends BasePage {
  name = '食堂'
  // 用「一键领取」按钮作为页面特征检测
  is = createPageDetector('images/食堂$$_一键领取_1_0.9_442_2245_641_2302.png')

  routes(): Route[] {
    return []
  }
}
