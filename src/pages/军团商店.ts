import { BasePage, Route } from './BasePage'
import { createMirroredAction, createPageDetector } from '../utils/img'
import { 道具购买 } from './道具购买'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/军团商店_1_0.9_156_2016_254_2069.png',
}

export class 军团商店 extends BasePage {
  name = '军团商店'
  is = createPageDetector(IMG.页面)

  routes(): Route[] {
    return [
      // 两个入场券都点开道具购买弹窗，由道具购买的购买动作路由到对应玩法
      { target: 道具购买, action: createMirroredAction(IMG.环球救援券), imagePath: IMG.环球救援券 },
      { target: 道具购买, action: createMirroredAction(IMG.环球远征券), imagePath: IMG.环球远征券 },
    ]
  }
}
