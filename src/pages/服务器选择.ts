import { BasePage } from './BasePage'
import { createPageDetector, imageNameParser, screen, width, height, getTemplate } from '../utils/img'

export class 服务器选择 extends BasePage {
  name = '服务器选择'
  is = createPageDetector('images/服务器选择_1_0.9_103_2024_283_2067.png')

  scrollFind(filePath: string): [number, number] | null {
    var parsed = imageNameParser(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    var template = getTemplate(filePath)

    for (var i = 0; i < 20; i++) {
      var img = screen()
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      if (point) {
        var cx = point.x + template.width + 60
        var cy = point.y + template.height + 10
        console.log('[服务器选择] 找到选中标识 坐标:(' + point.x + ',' + point.y + ') 点击:(' + cx + ',' + cy + ')')
        return [cx, cy]
      }
      // 向上滚动：从屏幕下方滑到上方
      swipe(width / 2, height * 0.7, width / 2, height * 0.3, 300)
      swipe(width / 2, height * 0.3, width / 3, height * 0.3, 300)
      sleep(600)
    }
    return null
  }

  /**
   * 滚动列表查找当前选中服务器的选中标识。
   * 从当前位置向上滚动，每滚一次重新截图找图，
   * 找到后返回坐标[x + 60, y + 10]
   */
  next() {
    return this.scrollFind('images/服务器选择_选中_0_0.9_95_250_117_1588.png')
  }
}
