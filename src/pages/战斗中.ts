import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, imageNameParser, getTemplate, screen, toScreenX, toScreenY, ocrRegion } from '../utils/img'
import { 暂停战斗 } from './暂停战斗'
import { 选择技能 } from './选择技能'
import { 战斗结束 } from './战斗结束'

// 页面识别：暂停按钮 或 顶部已激活技能图标出现均算战斗中
// skipLuminance: 暂停按钮模板左上角是深色像素，亮度对比会被误拒（模板 0.007 vs 屏幕 0.118），跳过亮度检查
var 暂停检测 = createPageDetector('images/战斗中$_暂停_1_0.9_66_50_102_200.png', true)
var 已激活技能检测 = createPageDetector('images/战斗中_已激活技能_0_0.9_404_0_674_740.png')

export class 战斗中 extends BasePage {
  name = '战斗中'
  暂停_point!: OpenCV.Point
  is(img: ImageWrapper): boolean {
    let point = imageDetector('images/战斗中$_暂停_1_0.9_66_50_102_200.png', img)
    if (point) {
      this.暂停_point = point
    }
    return !!point
  }

  /** 点击暂停按钮，弹出暂停面板 */
  暂停(): boolean {
    return createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_200.png')()
  }

  /** 开启 15 倍速（找到"15倍速-关闭"按钮时点击） */
  开15倍速(): boolean {
    return createRouteAction('images/战斗中$$15倍速-关闭_1_0.9_49_325_115_353.png')()
  }

  /** 检测 15 倍速是否已开启 */
  已开15倍速(): boolean {
    return !!imageDetector('images/战斗中_15倍速-开启_0_0.9_43_326_119_352.png')
  }

  /** 技能选择弹窗是否出现（弹窗标题"选择技能"识别，与选择技能页共用识别图） */
  技能弹窗出现(): boolean {
    return !!imageDetector('images/选择技能_0_0.8_438_729_645_1143.png')
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

  /** 确定（技能弹窗确认按钮） */
  确定(): boolean {
    return createRouteAction('images/选择技能$$确定_0_0.9_531_1611_628_1656.png')()
  }

  等级(): number {
    let temp = images.clip(screen(), 506, this.暂停_point.y + 50, 60, 35)
    let ocrResult = ocrRegion(temp, 0, 0, 100, 50)
    temp.recycle()
    if (ocrResult) {
      const matchResult = ocrResult.text.match(/^[^@]+/)
      let num = matchResult ? matchResult[0].replace(/\D/g, "") : ""
      if (num && parseInt(num) <= 20 && parseInt(num) >= 1) {
        return parseInt(num)
      }
    }
    return 0
  }

  /** 暂停按钮处像素不再是按钮色 → 有上层窗口遮挡（暂停面板/弹窗会使按钮变色） */
  hasUplayer(img: ImageWrapper): boolean {
    let p = this.暂停_point
    return !!p && !colors.isSimilar(img.pixel(p.x + 18, p.y + 18), '#ffffff', 10)
  }

  // /**
  //  * 战斗循环：每 1s 检测一次页面，技能弹窗出现时自动选技能（同组多选），
  //  * 战斗结束页出现时退出。与 选择技能 互相 import（循环依赖），
  //  * 但均在方法调用时才引用对方，运行时安全。
  //  */
  // 自动战斗(): void {
  //   var 选择技能Page = new 选择技能()
  //   var 战斗结束Page = new 战斗结束()
  //   var 倍速检查 = 0
  //   while (true) {
  //     sleep(1000)
  //     var img = screen()
  //     // 技能弹窗：自动选技能（弹窗关闭后 continue 重新检测）
  //     if (选择技能Page.is(img)) {
  //       log('[战斗中] 技能弹窗，自动选择技能')
  //       选择技能Page.选最优技能()
  //       continue
  //     }
  //     // 战斗结束：退出循环
  //     if (战斗结束Page.is(img)) {
  //       log('[战斗中] 战斗结束')
  //       break
  //     }
  //     // 仍在战斗中：每 5 次循环检查一次 15 倍速（减少找图次数）
  //     倍速检查++
  //     if (倍速检查 % 5 === 0 && !this.已开15倍速()) {
  //       this.开15倍速()
  //     }
  //   }
  // }

  routes(): Route[] {
    return [
      // 点暂停 → 暂停面板
      { target: 暂停战斗, action: createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_200.png'), imagePath: 'images/战斗中$_暂停_1_0.9_66_50_102_200.png' },
    ]
  }
}
