import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗 } from './战斗'
import { 基地 } from './基地'
import { 异域挑战 } from './异域挑战'
import { 每日一刀 } from './每日一刀'
import { 军团商店 } from './军团商店'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/军团_0_0.9_795_2327_885_2377.png',
  异域挑战: 'images/军团$异域挑战_1_0.8_117_946_266_985.png',
  每日一刀: 'images/军团$每日一刀_1_0.9_539_1445_686_1481.png',
  军团商店: 'images/军团$军团商店_1_0.9_697_1105_847_1142.png',
}

export class 军团 extends BasePage {
  name = '军团'
  is = createPageDetector(IMG.页面)

  routes(): Route[] {
    return [
      { target: 战斗, action: createRouteAction(IMG.战斗未选中), imagePath: IMG.战斗未选中 },
      { target: 基地, action: createRouteAction(IMG.基地未选中), imagePath: IMG.基地未选中 },
      { target: 异域挑战, action: createRouteAction(IMG.异域挑战), imagePath: IMG.异域挑战 },
      { target: 每日一刀, action: createRouteAction(IMG.每日一刀), imagePath: IMG.每日一刀 },
      { target: 军团商店, action: createRouteAction(IMG.军团商店), imagePath: IMG.军团商店 },
    ]
  }
}
