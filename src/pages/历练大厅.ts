import { BasePage, Route } from './BasePage'
import { createAnchoredAction, createPageDetector, createRouteAction } from '../utils/img'
import { 玩法商店 } from './玩法商店'
import { 寰球救援 } from './寰球救援'
import { 寰球远征 } from './寰球远征'

export class 历练大厅 extends BasePage {
  name = '历练大厅'
  // 无纯页面标识图，使用「远征」按钮作为页面特征检测
  is = createPageDetector('images/历练大厅_远征_1_0.9_181_1296_274_1339.png')

  routes(): Route[] {
    return [
      { target: 玩法商店, action: createRouteAction('images/历练大厅$玩法商店_1_0.8_940_391_1005_435.png'), imagePath: 'images/历练大厅$玩法商店_1_0.8_940_391_1005_435.png' },
      { target: 寰球救援, action: createAnchoredAction(
        'images/历练大厅_救援_1_0.9_181_938_274_988.png',
        'images/$挑战_0_0.9.png'
      ) },
      { target: 寰球远征, action: createAnchoredAction(
        'images/历练大厅_远征_1_0.9_181_1296_274_1339.png',
        'images/$挑战_0_0.9.png'
      ) },
    ]
  }
}
