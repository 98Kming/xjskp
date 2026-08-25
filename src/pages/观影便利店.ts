import { BasePage, Route } from './BasePage'
import { createPageDetector, createTicketAction, getTemplate, imageDetector, screen, waitObtain } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  救援入场券: 'images/观影便利店_救援入场券_0_0.9_106_500_230_2100.png',
  远征入场券: 'images/观影便利店_远征入场券_0_0.9_109_500_226_2100.png',
  已售罄: 'images/观影便利店_已售罄_0_0.9_837_500_957_2100.png',
}

export class 观影便利店 extends BasePage {
  name = '观影便利店'
  is = createPageDetector(IMG.观影便利店)

  免费(): boolean {
    while (createTicketAction(IMG.救援入场券, IMG.已售罄)()) {
      if(waitObtain(30000)){
        sleep(500)
      }
    }
    while (createTicketAction(IMG.远征入场券, IMG.已售罄)()) {
      if(waitObtain(30000)){
        sleep(500)
      }
    }
    return true
  }

  routes(): Route[] {
    return []
  }
}
