import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, imageNameParser, getTemplate, screen, toScreenX, toScreenY } from '../utils/img'
import { 暂停战斗 } from './暂停战斗'

// 页面识别：暂停按钮 或 顶部已激活技能图标出现均算战斗中
var 暂停检测 = createPageDetector('images/战斗中$_暂停_1_0.9_66_50_102_87.png')
var 已激活技能检测 = createPageDetector('images/战斗中_已激活技能_0_0.9_404_0_674_740.png')

export class 战斗中 extends BasePage {
  name = '战斗中'
  is = function (img: ImageWrapper): boolean {
    return 暂停检测(img) || 已激活技能检测(img)
  }

  /** 点击暂停按钮，弹出暂停面板 */
  暂停(): boolean {
    return createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_87.png')()
  }

  /** 开启 15 倍速（找到"15倍速-关闭"按钮时点击） */
  开15倍速(): boolean {
    return createRouteAction('images/战斗中$$15倍速-关闭_1_0.9_49_325_115_353.png')()
  }

  /** 检测 15 倍速是否已开启 */
  已开15倍速(): boolean {
    return imageDetector('images/战斗中_15倍速-开启_0_0.9_43_326_119_352.png')
  }

  /** 选择技能（技能弹窗出现时） */
  选择技能(): boolean {
    return createRouteAction('images/战斗中$$选择技能_1_0.9_440_436_643_486.png')()
  }

  /** 已激活技能（顶部技能图标）出现时点击其匹配点上方 20px */
  点击已激活技能(): boolean {
    var filePath = 'images/战斗中_已激活技能_0_0.9_404_0_674_740.png'
    var parsed = imageNameParser(filePath)
    var template = getTemplate(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(toScreenX(point.x + template.width / 2), toScreenY(point.y - 20))
    return true
  }

  /** 确定（弹窗确认按钮） */
  确定(): boolean {
    return createRouteAction('images/战斗中$$确定_0_0.9_531_1611_628_1656.png')()
  }

  routes(): Route[] {
    return [
      // 点暂停 → 暂停面板
      { target: 暂停战斗, action: createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_87.png'), imagePath: 'images/战斗中$_暂停_1_0.9_66_151_104_189.png' },
    ]
  }
}
