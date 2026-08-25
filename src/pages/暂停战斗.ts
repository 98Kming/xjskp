import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗中 } from './战斗中'
import { 战斗结束 } from './战斗结束'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/暂停战斗_1_0.9_87_1788_258_1832.png',
  back: 'images/暂停战斗$back_1_0.9_626_2000_819_2046.png',
  战斗结束: 'images/暂停战斗$$战斗结束_1_0.9_243_1998_336_2046.png',
}

export class 暂停战斗 extends BasePage {
  name = '暂停战斗'
  // 暂停面板上的"暂停"文字标识（兼作页面识别）
  is = createPageDetector(IMG.页面)

  /** 返回：继续战斗 */
  继续(): boolean {
    return createRouteAction(IMG.back)()
  }

  /** 战斗结束：提前结算退出 */
  结束战斗(): boolean {
    return createRouteAction(IMG.战斗结束)()
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction(IMG.back), imagePath: IMG.back },
      { target: 战斗结束, action: createRouteAction(IMG.战斗结束), imagePath: IMG.战斗结束 },
    ]
  }
}
