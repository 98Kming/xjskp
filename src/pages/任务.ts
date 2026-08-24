import { createPageDetector, createRouteAction, getTemplate, imageDetector, imageNameParser, toScreenX, toScreenY, waitObtain, waitScreen } from '../utils/img'
import { BasePage } from "./BasePage";

export class 任务 extends BasePage {
  name = '任务'
  is = createPageDetector('images/任务_1_0.9_124_679_160_715.png')
  领取(): boolean {
    let count = 0
    let point = imageDetector('images/任务$$领取_0_0.9_600_443_w_h.png')
    let parsed = imageNameParser('images/任务$$领取_0_0.9_600_443_w_h.png')
    let failCount = 0
    while (point) {
      click(toScreenX(point.x), toScreenY(point.y))
      if(!waitObtain(2000, 200)) {
        point = imageDetector('images/任务$$领取_0_0.9_600_443_w_h.png')
        if(failCount > 2) {
          let matches = images.matchTemplate(waitScreen(100), getTemplate(parsed.rawFileName), { region: [parsed.x1, parsed.y1, parsed.x2 - parsed.x1, parsed.y2 - parsed.y1] ,threshold: 0.8 })
          point = Array.from(matches.points).find(it => Math.abs(it.y - point!.y) > getTemplate(parsed.rawFileName).getHeight()) || null
        }
        failCount++
      } else {
        failCount = 0
        count++
        sleep(500)
      }
    }
    if (count > 0) {
      console.log('任务 领取完成，共领取 ' + count + ' 次')
    }
    return count > 0
   
  }
}