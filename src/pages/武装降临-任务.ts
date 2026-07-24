import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, tryCloseModals } from '../utils/img'

export class 武装降临任务 extends BasePage {
  name = '武装降临-任务'
  is = createPageDetector('images/武装降临-任务_1_0.8_155_422_220_1366.png')

  /**
   * 循环领取：一直点击领取直到找不到按钮，每次点击后处理弹窗
   */
  领取(): boolean {
    var action = createRouteAction('images/武装降临-任务$$领取_0_0.9_760_443_857_1366.png')
    var count = 0
    while (action()) {
      count++
      sleep(800)
      tryCloseModals()
      sleep(500)
    }
    if (count > 0) {
      console.log('  武装降临-任务 领取完成，共领取 ' + count + ' 次')
    }
    return count > 0
  }

  routes(): Route[] {
    return []
  }
}
