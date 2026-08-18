import { BasePage, Route } from './BasePage'
import { createPageDetector, createTicketAction, getTemplate, imageDetector, screen } from '../utils/img'

export class 观影便利店 extends BasePage {
  name = '观影便利店'
  is = createPageDetector('images/观影便利店_1_0.9_935_2272_1013_2323.png')

  免费(): boolean {
    while (createTicketAction('images/观影便利店_救援入场券_0_0.9_106_500_230_2100.png', 'images/观影便利店_已售罄_0_0.9_837_500_957_2100.png')()) {
      var start = Date.now()
      while (Date.now() - start < 30000) {
        sleep(1000)
        var point = imageDetector('images/_恭喜获得_0_0.85_437_895_641_948.png')
        if (point) {
          log('[观影便利店] 救援入场券门票领取成功(恭喜获得)')
          click(device.width / 2, device.height - 10)
          sleep(800)
          break
        }
      }
    }
    while (createTicketAction('images/观影便利店_远征入场券_0_0.9_109_500_226_2100.png', 'images/观影便利店_已售罄_0_0.9_837_500_957_2100.png')()) {
      var start = Date.now()
      while (Date.now() - start < 30000) {
        sleep(1000)
        var point = imageDetector('images/_恭喜获得_0_0.85_437_895_641_948.png')
        if (point) {
          log('[观影便利店] 远征入场券门票领取成功(恭喜获得)')
          click(device.width / 2, device.height - 10)
          sleep(800)
          break
        }
      }
    }
    return true
  }

  routes(): Route[] {
    return []
  }
}
