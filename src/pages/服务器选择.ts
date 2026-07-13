import { BasePage } from './BasePage'
import { createPageDetector, imageNameParser, screen, width, height, scrollFind } from '../utils/img'

export class 服务器选择 extends BasePage {
  name = '服务器选择'
  is = createPageDetector('images/服务器选择_1_0.9_103_2024_283_2067.png')

  /**
   * 滚动列表查找当前选中服务器的选中标识。
   * 从当前位置向上滚动，每滚一次重新截图找图，
   * 找到后返回坐标[x + 60, y + 10]
   */
  next() {
      return scrollFind( 'images/服务器选择_选中_0_0.9_95_250_117_1588.png')
  }
}
