import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, screen, waitObtain, waitScreen } from '../utils/img'

export class 鹊渡仙途 extends BasePage {
  name = '鹊桥祈缘'
  is = createPageDetector('images/鹊渡仙途$$_任务2_1_0.9_1003_330_1048_375.png')
  private 任务1 = createRouteAction('images/鹊渡仙途$$任务_1_0.9_52_439_110_490.png')
  private 任务2 = createRouteAction('images/鹊渡仙途$$_任务2_1_0.9_1003_330_1048_375.png')
  private 任务2_领取 = createRouteAction('images/$一键领取_0_0.8_96_2005_289_2051.png')
  private 三倍 = createRouteAction('images/鹊渡仙途$$3倍_1_0.9_649_2175_697_2204.png')
  private 跳过动画 = createRouteAction('images/鹊渡仙途$$跳过动画_1_0.9_864_2269_1044_2311.png')

  run(): boolean {
    log('3倍', this.三倍())
    log('跳过动画', this.跳过动画())
    while (true) {
      click(device.width / 2, device.height - 100)
      click(device.width / 2, device.height - 100)
      log('抽奖')
      if (imageDetector('images/_道具不足_1_0.9_402_1226_656_1274.png', waitScreen(100))) {
        let flag = false
        log('道具不足')
        if (this.任务1()) {
          log('任务1')
          let point
          while (point = imageDetector('images/任务$$领取_0_0.9_600_443_w_h.png', waitScreen(500))) {
            flag = true
            log('领取道具')
            click(point.x, point.y)
            sleep(500)
            if (waitObtain(2000, 200)) {
              log('领取道具[✅]')
            }
          }
        }
        if(!flag) {
          log('任务1无可领取道具')
          click(device.width / 2, device.height - 100)
        }
        if (this.任务2(waitScreen(100))) {
          log('任务2')
          if (this.任务2_领取(waitScreen(800))) {
            log('领取道具')
            if (waitObtain(2000, 200)) {
              flag = true
              log('领取道具[✅]')
            }
            sleep(500)
            this.back()
          }
        }
        if (!flag) {
          return true
        }
      } else if (waitObtain(2000, 200)) {
        log('抽奖[✅]')
      } else {
        let point
        while (point = imageDetector('images/鹊渡仙途_摇骰子_1_0.9_368_612_701_691.png', screen(0))) {
          log('摇骰子')
          click(device.width / 2, device.height / 2 - 100)
          sleep(500)
        }
        while (point = imageDetector('images/鹊渡仙途$$机关_1_0.9_144_1052_945_1674.png', screen(0))) {
          log('机关')
          click(point.x, point.y)
          sleep(500)
        }
      }
    }
  }

  routes(): Route[] {
    return []
  }
}
