import { BasePage } from './BasePage'
import { createPageDetector, width, getTemplate, screen, findImageMinYPoint, ocrText, toScreenX, toScreenY, imageDetector } from '../utils/img'
import { scroll, scrollFind } from '../utils/scroll'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/服务器选择_1_0.9_103_2024_283_2067.png',
  选中: 'images/服务器选择_选中_0_0.9_95_560_117_1900.png',
  未选中: 'images/服务器选择_未选中_0_0.9_92_560_106_1900.png',
}

export class 服务器选择 extends BasePage {
  name = '服务器选择'
  is = createPageDetector(IMG.页面)

  /**
   * scrollFind 向上找选中标识，在选中下方找未选中。
   * 下方没有则再滚动一次，重新找选中→找下方未选中。
   */
  next(): string | null {
    var imgPath_选中 = IMG.选中
    var point = scrollFind(imgPath_选中, "top", 200, 550, 450, 1800)
    if (!point) {
      console.log('[服务器选择] 未找到当前选中服务器')
      return null
    }
    // 2. 在选中标识下方找未选中
    var img = screen()
    let serverName = this.goNextServer(point, img)
    if (serverName) {
      return serverName
    }
    // 3. 下方没有（当前在列表末尾），再滚动一次
    if (scroll("top", 200, 550, 450, 1800)) {
      img = screen()
      // 重新找选中（一次滚动不会滚出屏幕），在其下方找未选中
      point = imageDetector(imgPath_选中, img)
      if (point) {
        return this.goNextServer(point, img)
      }
    }
    console.log('[服务器选择] 未找到可切换的服务器')
    return null
  }

  private goNextServer(选中_point: OpenCV.Point, img: ImageWrapper) {
    let imgPath_未选中 = IMG.未选中
    let tpl_未选中 = getTemplate(imgPath_未选中)
    let 未选中_point = findImageMinYPoint(imgPath_未选中, 选中_point.y, img)
    if (未选中_point && 未选中_point.y > 选中_point.y) {
      let userName2 = ocrText(img, 未选中_point.x + tpl_未选中.width, 未选中_point.y, width - tpl_未选中.width - 未选中_point.x, tpl_未选中.height).replace(/[\r\n]/g, '')
      console.log('[服务器选择] 切换到下一个服务器', userName2)
      click(toScreenX(未选中_point.x + 50), toScreenY(未选中_point.y + 50))
      return userName2.replace(/[\r\n\t\f\v\\\/:\*\?"<>\|]+/g, '').replace(/\s+/g, ' ').trim()
    }
    return null
  }
}
