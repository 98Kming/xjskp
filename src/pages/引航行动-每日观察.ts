import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, tryCloseModals } from '../utils/img'

export class 引航行动每日观察 extends BasePage {
  name = '引航行动-每日观察'
  is = createPageDetector('images/引航行动-每日观察_1_0.9_35_248_163_337.png')

  /**
   * 循环领取：一直点击可领取直到找不到按钮，每次点击后处理弹窗
   */
  领取(): boolean {
    return createRouteAction('images/引航行动-每日观察$$可领取_0_0.9_80_652_580_1843.png')() && (sleep(800), this.back(), sleep(800), true)
  
  }

  routes(): Route[] {
    return []
  }
}
