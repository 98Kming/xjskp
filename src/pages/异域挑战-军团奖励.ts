import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 异域挑战个人奖励 } from './异域挑战-个人奖励'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/异域挑战-军团奖励_1_0.9_110_2018_288_2065.png',
  异域挑战个人奖励: 'images/异域挑战-军团奖励$异域挑战-个人奖励_1_0.9_359_2022_523_2071.png',
}

export class 异域挑战军团奖励 extends BasePage {
  name = '异域挑战-军团奖励'
  is = createPageDetector(IMG.页面)

  领取(): boolean {
    return createRouteAction(IMG.奖励领取)() && (sleep(800), this.back(), sleep(800), true)
  }

  routes(): Route[] {
    return [
      { target: 异域挑战个人奖励, action: createRouteAction(IMG.异域挑战个人奖励), imagePath: IMG.异域挑战个人奖励 },
    ]
  }
}
