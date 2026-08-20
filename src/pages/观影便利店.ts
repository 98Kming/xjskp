import { BasePage, Route } from './BasePage'
import { createPageDetector, createTicketAction, getTemplate, imageDetector, screen, waitObtain } from '../utils/img'

export class 观影便利店 extends BasePage {
  name = '观影便利店'
  is = createPageDetector('images/观影便利店_1_0.9_935_2272_1013_2323.png')

  免费(): boolean {
    while (createTicketAction('images/观影便利店_救援入场券_0_0.9_106_500_230_2100.png', 'images/观影便利店_已售罄_0_0.9_837_500_957_2100.png')()) {
      if(waitObtain(30000)){
        sleep(500)
      }
    }
    while (createTicketAction('images/观影便利店_远征入场券_0_0.9_109_500_226_2100.png', 'images/观影便利店_已售罄_0_0.9_837_500_957_2100.png')()) {
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
