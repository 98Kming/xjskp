import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/终末危机$$_扫荡_1_0.9_269_2085_371_2139.png',
}

export class 终末危机 extends BasePage {
  name = '终末危机'
  is = createPageDetector(IMG.页面)
  private 确认Action = createRouteAction(IMG.确认)

  扫荡(): boolean {
    var ok = createRouteAction(IMG.页面)()
    if (ok) {
      sleep(1000)
      if(this.确认Action()) {
        click(device.width / 2, device.height - 10)
        sleep(300)
        click(device.width / 2, device.height - 10)
        sleep(200)
      }
    }
    return ok
  }

  routes(): Route[] {
    return []
  }
}
