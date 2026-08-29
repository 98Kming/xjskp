import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, imageNameParser, getTemplate, screen, toScreenX, toScreenY, ocrRegion } from '../utils/img'
import { 暂停战斗 } from './暂停战斗'
import { 选择技能 } from './选择技能'
import { 战斗结束 } from './战斗结束'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  暂停: 'images/战斗中$_暂停_1_0.85_66_50_102_200.png',
  倍速关闭: 'images/战斗中_倍速-关闭_0_0.9_45_426_80_456.png',
  倍速开启: 'images/战斗中_倍速-开启_0_0.85_45_426_80_456.png',
}

// 页面识别：暂停按钮 或 顶部已激活技能图标出现均算战斗中
// skipLuminance: 暂停按钮模板左上角是深色像素，亮度对比会被误拒（模板 0.007 vs 屏幕 0.118），跳过亮度检查

export class 战斗中 extends BasePage {
  name = '战斗中'
  暂停_point!: OpenCV.Point
  is(img: ImageWrapper): boolean {
    let point = imageDetector(IMG.暂停, img)
    if (point) {
      this.暂停_point = point
    }
    return !!point
  }

  /** 点击暂停按钮，弹出暂停面板 */
  暂停(): boolean {
    return createRouteAction(IMG.暂停)()
  }

  /** 开启倍速（找到"倍速-关闭"按钮时点击） */
  开倍速(): boolean {
    return createRouteAction(IMG.倍速关闭)()
  }

  /** 检测倍速是否已开启 */
  已开倍速(): boolean {
    return !!imageDetector(IMG.倍速开启)
  }

  /** 确定按钮：原引用 531_1902 为重裁前旧图(已删)，现与选择技能页共用 1670 区域图 */
  确定(): boolean {
    return createRouteAction(IMG.选择技能确定)()
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
    return !!p && !colors.isSimilar(img.pixel(p.x + 6, p.y + 6), '#FEFEFC', 10)
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
      { target: 暂停战斗, action: createRouteAction(IMG.暂停), imagePath: IMG.暂停 },
    ]
  }
}
