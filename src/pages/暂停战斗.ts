import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗中 } from './战斗中'
import { 战斗结束 } from './战斗结束'

export class 暂停战斗 extends BasePage {
  name = '暂停战斗'
  // 暂停面板上的"暂停"文字标识（兼作页面识别）
  is = createPageDetector('images/暂停战斗_1_0.9_87_1496_258_1540.png')

  /** 返回：继续战斗 */
  继续(): boolean {
    return createRouteAction('images/暂停战斗$back_1_0.9_626_1708_819_1754.png')()
  }

  /** 战斗结束：提前结算退出 */
  结束战斗(): boolean {
    return createRouteAction('images/暂停战斗$$战斗结束_1_0.9_243_1707_336_1755.png')()
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction('images/暂停战斗$back_1_0.9_626_1708_819_1754.png'), imagePath: 'images/暂停战斗$back_1_0.9_626_1708_819_1754.png' },
      { target: 战斗结束, action: createRouteAction('images/暂停战斗$$战斗结束_1_0.9_243_1707_336_1755.png'), imagePath: 'images/暂停战斗$$战斗结束_1_0.9_243_1707_336_1755.png' },
    ]
  }
}
