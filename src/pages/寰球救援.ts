import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, width, height, getTemplate, imageNameParser, toScreenX, toScreenY } from '../utils/img'
import { 组队邀请推荐 } from './组队邀请-推荐'
import { 接受邀请列表 } from './接受邀请列表'
import { 战斗中 } from './战斗中'

export class 寰球救援 extends BasePage {
  name = '寰球救援'
  is = createPageDetector('images/寰球救援_1_0.9_30_152_87_182.png')
  private static img_恭喜获得 = getTemplate('images/_恭喜获得_0_0.85_437_895_641_948.png')

  /**
   * 广告门票:点击后看广告,40 秒内出现"恭喜获得"即视为成功。
   * 出现恭喜获得后点击其上方 200px 关闭弹窗并返回。
   */
  广告门票(): boolean {
    // 点击广告门票按钮中心上方 20px
    var filePath = 'images/寰球救援$$广告门票_1_0.9_25_651_88_707.png'
    var parsed = imageNameParser(filePath)
    var tpl = getTemplate(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    sleep(2000)
    var point = images.findImageInRegion(screen(), tpl, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(toScreenX(point.x + tpl.width / 2), toScreenY(point.y - 20))
    log('[寰球救援] 已点击广告门票,等待广告结束...')
    var start = Date.now()
    while (Date.now() - start < 40000) {
      sleep(1000)
      // 阈值 0.85：1440 设备截图缩放后模板相似度实测 0.8877，0.9 匹配不上
      var point = images.findImageInRegion(screen(), 寰球救援.img_恭喜获得,
        width * 0.3, height * 0.2, width * 0.4, height * 0.3, 0.85)
      if (point) {
        log('[寰球救援] 广告门票领取成功(恭喜获得)')
        click(device.width / 2, device.height - 10)
        sleep(300)
        return true
      }
    }
    log('[寰球救援] 广告门票 40 秒内未出现恭喜获得')
    return false
  }

  免费(): boolean {
    var action = createRouteAction('images/寰球救援$$免费_1_0.8_48_713_118_773.png')
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
      { target: 组队邀请推荐, action: createRouteAction('images/$邀请_0_0.9_806_1641_892_1686.png'), imagePath: 'images/$邀请_0_0.9_806_1641_892_1686.png' },
      // 队员:接受邀请列表
      { target: 接受邀请列表, action: createRouteAction('images/$副本邀请_1_0.9_854_1820_989_1856.png'), imagePath: 'images/$副本邀请_1_0.9_854_1820_989_1856.png' },
      // 开始游戏按钮,组队完成后点击进入战斗
      { target: 战斗中, action: createRouteAction('images/寰球救援$战斗中_1_0.9_412_2065_476_2145.png'), imagePath: 'images/寰球救援$战斗中_1_0.9_412_2065_476_2145.png' },
    ]
  }
}
