import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 基地 } from './基地'
import { 军团 } from './军团'
import { 幸运锦鲤 } from './幸运锦鲤'
import { 侧栏 } from './侧栏'
import { 巡逻车 } from './巡逻车'
import { 个人信息 } from './个人信息'
import { 先锋宝藏 } from './先锋宝藏'
import { 武装降临 } from './武装降临'
import { 引航行动 } from './引航行动'

export class 战斗 extends BasePage {
  name = '战斗'
  is = createPageDetector('images/战斗_0_0.9_499_2327_581_2370.png')
  private 七日突围Action = createRouteAction('images/战斗$$七日突围_0_0.9_987_976_1051_1022.png')

  click_七日突围(): boolean {
    return this.七日突围Action() && (sleep(800), this.back(), sleep(800), true)
  }

  scrollDown() {
    swipe(50, 900, 50, 600,300)
    swipe(50, 600, 120, 600,100)
    sleep(500)
  }

  scrollUp() {
    swipe(50, 600, 50, 900,300)
    swipe(50, 900, 120, 900,100)
    sleep(500)
  }

  routes(): Route[] {
    var self = this
    return [
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
      { target: 个人信息, action: function (): boolean { click(100, 200); return true } },
      {
        target: 先锋宝藏, action: function (): boolean {
          var action = createRouteAction('images/战斗$先锋宝藏_0_0.8_64_1010_118_1049.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$先锋宝藏_0_0.8_64_1010_118_1049.png'
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
        target: 引航行动, action: function (): boolean {
          var action = createRouteAction('images/战斗$引航行动_0_0.85_51_400_119_1178.png')
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: 'images/战斗$引航行动_0_0.85_51_400_119_1178.png'
      },
    ]
  }
}
