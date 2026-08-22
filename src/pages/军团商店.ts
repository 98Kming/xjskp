import { BasePage, Route } from './BasePage'
import { createMirroredAction, createPageDetector } from '../utils/img'
import { 道具购买 } from './道具购买'

export class 军团商店 extends BasePage {
  name = '军团商店'
  is = createPageDetector('images/军团商店_1_0.9_156_2016_254_2069.png')

  routes(): Route[] {
    return [
      // 两个入场券都点开道具购买弹窗，由道具购买的购买动作路由到对应玩法
      { target: 道具购买, action: createMirroredAction('images/军团商店_环球救援入场券_1_0.9_115_1000_230_1118.png'), imagePath: 'images/军团商店_环球救援入场券_1_0.9_115_1000_230_1118.png' },
      { target: 道具购买, action: createMirroredAction('images/军团商店_环球远征入场券_1_0.9_114_808_230_923.png'), imagePath: 'images/军团商店_环球远征入场券_1_0.9_114_808_230_923.png' },
    ]
  }
}
