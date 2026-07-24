import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗 } from './战斗'
import { 基地 } from './基地'
import { 异域挑战 } from './异域挑战'
import { 每日一刀 } from './每日一刀'
import { 军团商店 } from './军团商店'

export class 军团 extends BasePage {
  name = '军团'
  is = createPageDetector('images/军团_0_0.9_795_2303_885_2353.png')

  routes(): Route[] {
    return [
      { target: 战斗, action: createRouteAction('images/$战斗-未选中_0_0.9_504_2328_575_2370.png'), imagePath: 'images/$战斗-未选中_0_0.9_504_2328_575_2370.png' },
      { target: 基地, action: createRouteAction('images/$基地-未选中_0_0.8_658_2331_1080_2367.png'), imagePath: 'images/$基地-未选中_0_0.8_658_2331_1080_2367.png' },
      { target: 异域挑战, action: createRouteAction('images/军团$异域挑战_1_0.8_117_946_266_985.png'), imagePath: 'images/军团$异域挑战_1_0.8_117_946_266_985.png' },
      { target: 每日一刀, action: createRouteAction('images/军团$每日一刀_1_0.9_539_1445_686_1481.png'), imagePath: 'images/军团$每日一刀_1_0.9_539_1445_686_1481.png' },
      { target: 军团商店, action: createRouteAction('images/军团$军团商店_1_0.9_697_814_847_851.png'), imagePath: 'images/军团$军团商店_1_0.9_697_814_847_851.png' },
    ]
  }
}
