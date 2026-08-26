import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, getTemplate, imageNameParser, toScreenX, toScreenY, waitObtain, imageDetector } from '../utils/img'
import { 组队邀请推荐 } from './组队邀请-推荐'
import { 接受邀请列表 } from './接受邀请列表'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/寰球救援_1_0.9_30_152_87_182.png',
  广告门票: 'images/寰球救援$$广告门票_1_0.9_25_754_88_990.png',
  免费: 'images/寰球救援$$免费_1_0.8_48_728_118_788.png', // 覆盖共享键($免费):本页免费按钮图
  战斗中: 'images/寰球救援$战斗中_1_0.9_412_2065_476_2145.png',
}

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector(IMG.页面)

  /**
   * 广告门票:点击后看广告,30 秒内出现"恭喜获得"即视为成功。
   */
  广告门票(): boolean {
    // 点击广告门票按钮中心上方 20px
    var filePath = IMG.广告门票
    var parsed = imageNameParser(filePath)
    var tpl = getTemplate(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    sleep(2000)
    var point = images.findImageInRegion(screen(), tpl, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(toScreenX(point.x + tpl.width / 2), toScreenY(point.y - 20))
    log('[寰球救援] 已点击广告门票,等待广告结束...')
    if(waitObtain(30000)){
      return true
    }
    log('[寰球救援] 广告门票 30 秒内未出现恭喜获得')
    return false
  }

  免费(): boolean {
    var action = createRouteAction(IMG.免费)
    for (var i = 0; i < 3; i++) {
      if (action()) {
        click(device.width / 2, device.height - 10)
        sleep(300)
        click(device.width / 2, device.height - 10)
        sleep(200)
        if (action()) {
          click(device.width / 2, device.height - 10)
          sleep(300)
          click(device.width / 2, device.height - 10)
          sleep(200)
        }
        return true
      }
      sleep(800)
    }
    return false
  }

  routes(): Route[] {
    return [
      // 队长:组队邀请弹窗(默认推荐 tab)
      { target: 组队邀请推荐, action: createRouteAction(IMG.邀请), imagePath: IMG.邀请 },
      // 队员:接受邀请列表
      { target: 接受邀请列表, action: createRouteAction(IMG.副本邀请), imagePath: IMG.副本邀请 },
      // 开始游戏按钮,组队完成后点击进入战斗
      { target: 战斗中, action: createRouteAction(IMG.战斗中), imagePath: IMG.战斗中 },
    ]
  }
}
