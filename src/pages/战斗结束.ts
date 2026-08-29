import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  back: 'images/战斗结束$_back_0_0.9_400_1961_805_2154.png',
  战斗中: 'images/战斗结束$战斗中_1_0.9_228_1962_422_2010.png',
}

export class 战斗结束 extends BasePage {
  name = '战斗结束'
  // 右下角 back 按钮，兼作页面识别（$_ 格式）
  is = createPageDetector(IMG.back)

  back(): boolean {
    return createRouteAction(IMG.back)()
  }

  /** 再次挑战：回到战斗中 */
  再战(): boolean {
    return createRouteAction(IMG.战斗中)()
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction(IMG.战斗中), imagePath: IMG.战斗中 },
    ]
  }
}
