import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, screen, waitObtain, waitScreen } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/鹊渡仙途$$_任务2_1_0.9_1003_330_1048_375.png',
  任务1: 'images/鹊渡仙途$$任务_1_0.9_52_439_110_490.png',
  任务2: 'images/鹊渡仙途$$_任务2_1_0.9_1003_330_1048_375.png',
  三倍: 'images/鹊渡仙途$$3倍_1_0.9_649_2175_697_2204.png',
  跳过动画: 'images/鹊渡仙途$$跳过动画_1_0.9_864_2269_1044_2311.png',
  道具不足: 'images/_道具不足_1_0.9_402_1226_656_1274.png',
  摇骰子: 'images/鹊渡仙途_摇骰子_1_0.9_368_612_701_691.png',
  机关: 'images/鹊渡仙途$$机关_1_0.9_144_1052_945_1674.png',
}

export class 鹊渡仙途 extends BasePage {
  name = '鹊桥祈缘'
  is = createPageDetector(IMG.页面)
  private 任务1 = createRouteAction(IMG.任务1)
  private 任务2 = createRouteAction(IMG.任务2)
  private 任务2_领取 = createRouteAction(IMG.一键领取)
  private 三倍 = createRouteAction(IMG.三倍)
  private 跳过动画 = createRouteAction(IMG.跳过动画)

  run(): boolean {
    log('3倍', this.三倍())
    log('跳过动画', this.跳过动画())
    while (true) {
      click(device.width / 2, device.height - 100)
      click(device.width / 2, device.height - 100)
      log('抽奖')
      if (imageDetector(IMG.道具不足, waitScreen(100))) {
        let flag = false
        log('道具不足')
        if (this.任务1()) {
          log('任务1')
          let point
          while (point = imageDetector(IMG.任务领取, waitScreen(500))) {
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
        while (point = imageDetector(IMG.摇骰子, screen(0))) {
          log('摇骰子')
          click(device.width / 2, device.height / 2 - 100)
          sleep(500)
        }
        while (point = imageDetector(IMG.机关, screen(0))) {
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
