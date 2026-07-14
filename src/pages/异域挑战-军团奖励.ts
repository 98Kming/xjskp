import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 异域挑战个人奖励 } from './异域挑战-个人奖励'

export class 异域挑战军团奖励 extends BasePage {
  name = '异域挑战-军团奖励'
  is = createPageDetector('images/异域挑战-军团奖励_1_0.9_110_2018_288_2065.png')

  领取(): boolean {
    return createRouteAction('images/$领取_0_0.8_761_700_864_1500.png')() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return [
      { target: 异域挑战个人奖励, action: createRouteAction('images/异域挑战-军团奖励$异域挑战-个人奖励_1_0.9_359_2022_523_2071.png'), imagePath: 'images/异域挑战-军团奖励$异域挑战-个人奖励_1_0.9_359_2022_523_2071.png' },
    ]
  }
}
