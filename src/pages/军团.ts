import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗 } from './战斗'
import { 基地 } from './基地'

export class 军团 extends BasePage {
  name = '军团'
  is = createPageDetector('images/军团_0_0.9_795_2303_885_2353.png')

  routes(): Route[] {
    return [
      { target: 战斗, action: createRouteAction('images/$战斗-未选中_0_0.9_504_2328_575_2370.png'), imagePath: 'images/$战斗-未选中_0_0.9_504_2328_575_2370.png' },
      { target: 基地, action: createRouteAction('images/$基地-未选中_0_0.8_658_2331_1080_2367.png'), imagePath: 'images/$基地-未选中_0_0.8_658_2331_1080_2367.png' },
    ]
  }
}
