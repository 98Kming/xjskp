import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗中 } from './战斗中'
import { 战斗结束 } from './战斗结束'

export class 暂停战斗 extends BasePage {
  name = '暂停战斗'
  // 暂停面板上的"暂停"文字标识（兼作页面识别）
  is = createPageDetector('images/暂停战斗_1_0.9_87_1788_258_1832.png')

  /** 返回：继续战斗 */
  继续(): boolean {
    return createRouteAction('images/暂停战斗$back_1_0.9_626_2000_819_2046.png')()
  }

  /** 战斗结束：提前结算退出 */
  结束战斗(): boolean {
    return createRouteAction('images/暂停战斗$$战斗结束_1_0.9_243_1998_336_2046.png')()
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction('images/暂停战斗$back_1_0.9_626_2000_819_2046.png'), imagePath: 'images/暂停战斗$back_1_0.9_626_2000_819_2046.png' },
      { target: 战斗结束, action: createRouteAction('images/暂停战斗$$战斗结束_1_0.9_243_1998_336_2046.png'), imagePath: 'images/暂停战斗$$战斗结束_1_0.9_243_1998_336_2046.png' },
    ]
  }
}
