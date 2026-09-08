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
import { 鎏金罗盘 } from './鎏金罗盘'
import { 光落彼端 } from './光落彼端'
import { 战斗中 } from './战斗中'
import { 组队邀请推荐 } from './组队邀请-推荐'
import { 接受邀请列表 } from './接受邀请列表'
import { 观影签到 } from './观影签到'
import { scrollFind } from '../utils/scroll'
import { 影映观礼 } from './影映观礼'
import { sharedImages } from '../images'
import { 丛林遗迹 } from './丛林遗迹'

const IMG = {
  ...sharedImages,
  页面: 'images/战斗_0_0.9_499_2327_581_2370.png',
  七日突围: 'images/战斗$$七日突围_0_0.9_987_976_1051_1022.png',
  战斗中: 'images/战斗$战斗中_1_0.9_410_1816_668_1935.png',
  侧栏: 'images/战斗$侧栏_1_0.9_974_378_1040_447.png',
  巡逻车: 'images/战斗$巡逻车_1_0.7_58_1917_169_1955.png',
  光落彼端: 'images/战斗$光落彼端_1_0.8_75_439_105_463.png',
}

export class 战斗 extends BasePage {
  name = '战斗'
  is = createPageDetector(IMG.页面)
  private 七日突围Action = createRouteAction(IMG.七日突围)

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
      { target: 战斗中, action: createRouteAction(IMG.战斗中), imagePath: IMG.战斗中 },
      { target: 基地, action: createRouteAction(IMG.基地未选中), imagePath: IMG.基地未选中 },
      { target: 军团, action: createRouteAction(IMG.军团未选中), imagePath: IMG.军团未选中 },
      {
        target: 幸运锦鲤, action: function (): boolean {
          var action = createRouteAction(IMG.战斗幸运锦鲤)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗幸运锦鲤
      },
      { target: 侧栏, action: createRouteAction(IMG.侧栏), imagePath: IMG.侧栏 },
      { target: 巡逻车, action: createRouteAction(IMG.巡逻车), imagePath: IMG.巡逻车 },
      { target: 个人信息, action: function (): boolean { click(toScreenX(100), toScreenY(200)); return true } },
      {
        target: 先锋宝藏, action: function (): boolean {
          var action = createRouteAction(IMG.战斗先锋宝藏)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗先锋宝藏
      },
      {
        target: 碧海凉夏, action: function (): boolean {
          var action = createRouteAction(IMG.战斗碧海凉夏)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗碧海凉夏
      },
      {
        target: 武装降临, action: function (): boolean {
          var action = createRouteAction(IMG.战斗武装降临)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗武装降临
      },
      {
        target: 丛林遗迹, action: function (): boolean {
          var action = createRouteAction(IMG.战斗丛林遗迹)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗丛林遗迹
      },
      {
        target: 鎏金罗盘, action: function (): boolean {
          var action = createRouteAction(IMG.战斗鎏金罗盘)
          if (action()) return true
          self.scrollDown()
          if (action()) return true
          self.scrollUp()
          return action()
        }, imagePath: IMG.战斗鎏金罗盘
      },
      {
        target: 观影签到, action: function (): boolean {
          let point = scrollFind(IMG.战斗观影签到, 'top', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          point = scrollFind(IMG.战斗观影签到, 'bottom', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          return false
        }, imagePath: IMG.战斗观影签到
      },
      {
        target: 影映观礼, action: function (): boolean {
          let point = scrollFind(IMG.战斗影映观礼, 'top', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          point = scrollFind(IMG.战斗影映观礼, 'bottom', 20, 500, 140, 1200, 8)
          if(point) {
            click(toScreenX(point.x), toScreenY(point.y))
            return true
          }
          return false
        }, imagePath: IMG.战斗影映观礼
      },
      {
        target: 光落彼端, action: function (): boolean {
          var action = createRouteAction(IMG.光落彼端)
          return action()
        }, imagePath: IMG.光落彼端
      },
      // 队长:组队邀请弹窗(默认推荐 tab)
      { target: 组队邀请推荐, action: createRouteAction(IMG.邀请), imagePath: IMG.邀请 },
      // 队员:接受邀请列表
      { target: 接受邀请列表, action: createRouteAction(IMG.副本邀请), imagePath: IMG.副本邀请 },
    ]
  }
}
