import { createPageDetector, createRouteAction, getTemplate, imageDetector, imageNameParser, toScreenX, toScreenY, waitObtain, waitScreen } from '../utils/img'
import { BasePage } from "./BasePage";
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/任务_1_0.9_124_679_160_751.png',
}

export class 任务 extends BasePage {
  name = '任务'
  is = createPageDetector(IMG.页面)
  领取(): boolean {
    let count = 0
    let point = imageDetector(IMG.任务领取1)
    let parsed
    if(!point) {
      point = imageDetector(IMG.任务领取2)
      parsed = imageNameParser(IMG.任务领取2)
    } else {
      parsed = imageNameParser(IMG.任务领取1)
    }
    let failCount = 0
    while (point) {
      click(toScreenX(point.x), toScreenY(point.y))
      if(!waitObtain(2000, 200)) {
        if(failCount > 2) {
          let matches = images.matchTemplate(waitScreen(100), getTemplate(parsed.rawFileName), { region: [parsed.x1, parsed.y1, parsed.w, parsed.h] ,threshold: 0.8 })
          point = Array.from(matches.points).find(it => Math.abs(it.y - point!.y) > getTemplate(parsed.rawFileName).getHeight()) || null
        }
        failCount++
      } else {
        failCount = 0
        count++
        sleep(500)
      }
      point = imageDetector(parsed.rawFileName)
    }
    if (count > 0) {
      console.log('任务 领取完成，共领取 ' + count + ' 次')
    }
    return count > 0
   
  }
}