import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { Router } from '../router/Router'
import { 异域挑战军团奖励 } from './异域挑战-军团奖励'

export class 异域挑战 extends BasePage {
  name = '异域挑战'
  is = createPageDetector('images/异域挑战$$_扫荡_1_0.9_338_2263_462_2317.png')
  private 确认Action = createRouteAction('images/$确认_0_0.8_540_1200_900_1800.png')

  扫荡(): boolean {
    var ok = createRouteAction('images/异域挑战$$_扫荡_1_0.9_338_2263_462_2317.png')()
    if (ok) {
      sleep(1000)
      this.确认Action()
      // 第二次扫荡：先导航回异域挑战
      Router.getInstance().go(异域挑战)
      createRouteAction('images/异域挑战$$_扫荡_1_0.9_338_2263_462_2317.png')()
      sleep(1000)
      this.确认Action()
    }
    return ok
  }

  routes(): Route[] {
    return [
      { target: 异域挑战军团奖励, action: createRouteAction('images/异域挑战$异域挑战-军团奖励_1_0.9_64_286_116_391.png'), imagePath: 'images/异域挑战$异域挑战-军团奖励_1_0.9_64_286_116_391.png' },
    ]
  }
}
