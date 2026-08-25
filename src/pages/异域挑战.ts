import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { Router } from '../router/Router'
import { 异域挑战军团奖励 } from './异域挑战-军团奖励'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/异域挑战$$_扫荡_1_0.9_338_2263_462_2317.png',
  军团奖励: 'images/异域挑战$异域挑战-军团奖励_1_0.9_64_286_116_391.png',
}

export class 异域挑战 extends BasePage {
  name = '异域挑战'
  is = createPageDetector(IMG.页面)
  private 确认Action = createRouteAction(IMG.确认)

  扫荡(): boolean {
    var ok = createRouteAction(IMG.页面)()
    if (ok) {
      sleep(1000)
      this.确认Action()
      // 第二次扫荡：先导航回异域挑战
      Router.getInstance().go(异域挑战)
      createRouteAction(IMG.页面)()
      sleep(1000)
      this.确认Action()
      sleep(800)
      this.back()
      sleep(800)
    }
    return ok
  }

  routes(): Route[] {
    return [
      { target: 异域挑战军团奖励, action: createRouteAction(IMG.军团奖励), imagePath: IMG.军团奖励 },
    ]
  }
}
