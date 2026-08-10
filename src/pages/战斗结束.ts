import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗中 } from './战斗中'

export class 战斗结束 extends BasePage {
  name = '战斗结束'
  // 右下角 back 按钮，兼作页面识别（$_ 格式）
  is = createPageDetector('images/战斗结束$_back_0_0.9_400_1940_805_2020.png')

  back(): boolean {
    return createRouteAction('images/战斗结束$_back_0_0.9_400_1940_805_2020.png')()
  }

  /** 再次挑战：回到战斗中 */
  再战(): boolean {
    return createRouteAction('images/战斗结束$战斗中_1_0.9_228_1671_422_1719.png')()
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction('images/战斗结束$战斗中_1_0.9_228_1671_422_1719.png'), imagePath: 'images/战斗结束$战斗中_1_0.9_228_1671_422_1719.png' },
    ]
  }
}
