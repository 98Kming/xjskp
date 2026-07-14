import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 终末危机 extends BasePage {
  name = '终末危机'
  is = createPageDetector('images/终末危机$$_扫荡_1_0.9_269_2085_371_2139.png')
  private 确认Action = createRouteAction('images/$确认_0_0.8_540_1200_900_1800.png')

  扫荡(): boolean {
    var ok = createRouteAction('images/终末危机$$_扫荡_1_0.9_269_2085_371_2139.png')()
    if (ok) {
      sleep(1000)
      this.确认Action()
    }
    return ok
  }

  routes(): Route[] {
    return []
  }
}
