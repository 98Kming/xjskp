import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, toScreenX, toScreenY } from '../utils/img'
import { 基地 } from './基地'
import { 军团 } from './军团'
import { 幸运锦鲤 } from './幸运锦鲤'
import { 侧栏 } from './侧栏'
import { 巡逻车 } from './巡逻车'
import { 个人信息 } from './个人信息'
import { 先锋宝藏 } from './先锋宝藏'
import { 碧海凉夏 } from './碧海凉夏'
import { 武装降临 } from './武装降临'
import { 缘聚七夕 } from './缘聚七夕'
import { 战斗中 } from './战斗中'
import { 组队邀请推荐 } from './组队邀请-推荐'
import { 接受邀请列表 } from './接受邀请列表'
import { 观影签到 } from './观影签到'
import { scrollFind } from '../utils/scroll'
import { 影映观礼 } from './影映观礼'

export class 战斗 extends BasePage {
  name = '战斗'
  is = createPageDetector('images/战斗_0_0.9_499_2327_581_2370.png')
  private 七日突围Action = createRouteAction('images/战斗$$七日突围_0_0.9_987_976_1051_1022.png')

  click_七日突围(): boolean {
    return this.七日突围Action() && (sleep(1200), this.back(), sleep(800), this.back(), sleep(800), true)
  }

  scrollDown() {
    swipe(toScreenX(50), toScreenY(900), toScreenX(50), toScreenY(600),300)
    swipe(toScreenX(50), toScreenY(600), toScreenX(120), toScreenY(600),100)
    sleep(500)
  }

  scrollUp() {
    swipe(toScreenX(50), toScreenY(600), toScreenX(50), toScreenY(900),300)
    swipe(toScreenX(50), toScreenY(900), toScreenX(120), toScreenY(900),100)
    sleep(500)
  }

  routes(): Route[] {
    var self = this
    return [
      // 主线关卡 → 进入战斗中
      { target: 战斗中, action: createRouteAction('images/战斗$战斗中_1_0.9_410_1524_668_1643.png'), imagePath: 'images/战斗$战斗中_1_0.9_410_1524_668_1643.png' },
      { target: 基地, action: createRouteAction('images/$基地-未选中_0_0.8_658_2331_1080_2367.png'), imagePath: 'images/$基地-未选中_0_0.8_658_2331_1080_2367.png' },
      { target: 军团, action: createRouteAction('images/$军团-未选中_0_0.8_807_2335_1080_2367.png'), imagePath: 'images/$军团-未选中_0_0.8_807_2335_1080_2367.png' },
      {
        target: 幸运锦鲤, action: function (): boolean {
          var action = createRouteAction('images/战斗$幸运锦鲤_0_0.7_30_542_118_617.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$幸运锦鲤_0_0.7_30_542_118_617.png'
      },
      { target: 侧栏, action: createRouteAction('images/战斗$侧栏_1_0.9_974_378_1040_447.png'), imagePath: 'images/战斗$侧栏_1_0.9_974_378_1040_447.png' },
      { target: 巡逻车, action: createRouteAction('images/战斗$巡逻车_1_0.7_58_1917_169_1955.png'), imagePath: 'images/战斗$巡逻车_1_0.7_58_1917_169_1955.png' },
      { target: 个人信息, action: function (): boolean { click(toScreenX(100), toScreenY(200)); return true } },
      {
        target: 先锋宝藏, action: function (): boolean {
          var action = createRouteAction('images/战斗$先锋宝藏_0_0.8_64_500_118_1049.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$先锋宝藏_0_0.8_64_500_118_1049.png'
      },
      {
        target: 碧海凉夏, action: function (): boolean {
          var action = createRouteAction('images/战斗$碧海凉夏_0_0.8_45_398_112_1200.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$碧海凉夏_0_0.8_45_398_112_1200.png'
      },
      {
        target: 武装降临, action: function (): boolean {
          var action = createRouteAction('images/战斗$武装降临_0_0.8_11_382_132_411.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$武装降临_0_0.8_11_382_132_411.png'
      },
      {
        target: 观影签到, action: function (): boolean {
          let point = scrollFind('images/战斗$观影签到_0_0.8_37_350_115_1200.png', 'top', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          point = scrollFind('images/战斗$观影签到_0_0.8_37_350_115_1200.png', 'bottom', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          return false
        }, imagePath: 'images/战斗$观影签到_0_0.8_37_350_115_1200.png'
      },
      {
        target: 影映观礼, action: function (): boolean {
          let point = scrollFind('images/战斗$影映观礼_0_0.8_49_350_113_1200.png', 'top', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          point = scrollFind('images/战斗$影映观礼_0_0.8_49_350_113_1200.png', 'bottom', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          return false
        }, imagePath: 'images/战斗$影映观礼_0_0.8_49_350_113_1200.png'
      },
      {
        target: 缘聚七夕, action: function (): boolean {
          var action = createRouteAction('images/战斗$缘聚七夕_1_0.8_45_428_122_482.png')
          return action()
        }, imagePath: 'images/战斗$缘聚七夕_1_0.8_45_428_122_482.png'
      },
      // 队长:组队邀请弹窗(默认推荐 tab)
      { target: 组队邀请推荐, action: createRouteAction('images/$邀请_0_0.9_806_1641_892_1686.png'), imagePath: 'images/$邀请_0_0.9_806_1641_892_1686.png' },
      // 队员:接受邀请列表
      { target: 接受邀请列表, action: createRouteAction('images/$副本邀请_1_0.9_854_1820_989_1856.png'), imagePath: 'images/$副本邀请_1_0.9_854_1820_989_1856.png' },
    ]
  }
}
