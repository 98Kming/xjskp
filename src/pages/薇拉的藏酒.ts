import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, waitObtain } from '../utils/img'
import { 任务 } from './任务'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/薇拉的藏酒_1_0.9_446_1763_594_1803.png',
  购买红枪皮: 'images/薇拉的藏酒$$购买红枪皮_1_0.9_451_1859_633_1917.png',
}

export class 薇拉的藏酒 extends BasePage {
  name = '薇拉的藏酒'
  is = createPageDetector(IMG.页面)
  购买红枪皮Action = createRouteAction(IMG.购买红枪皮)
  购买红枪皮(): boolean {
    if(this.购买红枪皮Action()) {
      sleep(500)
      createRouteAction(IMG.确定)()
      if(waitObtain(800)) {
        sleep(300)
        click(device.width / 2, device.height - 10)
        sleep(500)
        return true
      }
    }
    return false
  }
}
