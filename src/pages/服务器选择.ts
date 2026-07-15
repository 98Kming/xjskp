import { BasePage } from './BasePage'
import { createPageDetector, width, height, getTemplate, scrollFind, screen, imageNameParser, findImageMinYPoint } from '../utils/img'

/** AutoXJS Google ML Kit OCR（运行时可选） */
declare var gml: { ocr: (img: any, region: number[]) => string[] }

export class 服务器选择 extends BasePage {
  name = '服务器选择'
  is = createPageDetector('images/服务器选择_1_0.9_103_2024_283_2067.png')

  /**
   * scrollFind 向上找选中标识，在选中下方找未选中。
   * 下方没有则再滚动一次，重新找选中→找下方未选中。
   */
  next(): boolean {
    var imgPath_选中 = 'images/服务器选择_选中_0_0.9_95_250_117_1588.png'
    var imgPath_未选中 = 'images/服务器选择_未选中_0_0.9_92_250_106_1882.png'

    // 1. scrollFind 向上滚动找选中标识
    var point = scrollFind(imgPath_选中, width / 2, height * 0.7, width / 2, height * 0.3, width / 3)
    if (!point) {
      console.log('[服务器选择] 未找到当前选中服务器')
      return false
    }

    var tpl_选中 = getTemplate(imgPath_选中)
    var tpl_未选中 = getTemplate(imgPath_未选中)
    var parsed_选中 = imageNameParser(imgPath_选中)
    var parsed_未选中 = imageNameParser(imgPath_未选中)

    var rw_选中 = parsed_选中.x2 - parsed_选中.x1
    var rh_选中 = parsed_选中.y2 - parsed_选中.y1

    // 2. 在选中标识下方找未选中
    var searchY = point.y + tpl_选中.height
    var img = screen()
    var result = findImageMinYPoint(img, tpl_未选中,
      parsed_未选中.x1, searchY,
      parsed_未选中.x2 - parsed_未选中.x1, parsed_未选中.y2 - searchY,
      parsed_未选中.threshold)
    if (result) {
      //click(result.x + tpl_未选中.width / 2, result.y + tpl_未选中.height / 2)
      sleep(200)
      let userName = ''
      if (typeof gml !== 'undefined') {
        try { userName = gml.ocr(img, [result.x + tpl_未选中.width, result.y, tpl_未选中.width, tpl_未选中.height])[0] || '' } catch (e) {}
      } else if (typeof ocr !== 'undefined') {
        try { userName = ocr(img, [result.x + tpl_未选中.width, result.y, tpl_未选中.width, tpl_未选中.height])[0] || '' } catch (e) {}
      }
      console.log('[服务器选择] 切换到下一个服务器', userName)
      click(width / 4, searchY + 50)
      return true
    }
    // 3. 下方没有（当前在列表末尾），再滚动一次
    swipe(width / 2, height * 0.7, width / 2, height * 0.3, 300)
    swipe(width / 2 + 100, height * 0.3, width / 2, height * 0.3, 300)
    sleep(800)
    var img2 = screen()
    // 重新找选中（一次滚动不会滚出屏幕），在其下方找未选中
    var point2 = images.findImageInRegion(img2, tpl_选中,
      parsed_选中.x1, parsed_选中.y1, rw_选中, rh_选中, parsed_选中.threshold)
    if (point2) {
      var searchY2 = point2.y + tpl_选中.height
      var result2 = findImageMinYPoint(img2, tpl_未选中,
        parsed_未选中.x1, searchY2,
        parsed_未选中.x2 - parsed_未选中.x1, parsed_未选中.y2 - searchY2,
        parsed_未选中.threshold)
      if (result2) {
        //click(result2.x + tpl_未选中.width / 2, result2.y + tpl_未选中.height / 2)
        let userName2 = ''
        if (typeof gml !== 'undefined') {
          try { userName2 = gml.ocr(img2, [result2.x + tpl_未选中.width, result2.y, tpl_未选中.width, tpl_未选中.height])[0] || '' } catch (e) {}
        } else if (typeof ocr !== 'undefined') {
          try { userName2 = ocr(img2, [result2.x + tpl_未选中.width, result2.y, tpl_未选中.width, tpl_未选中.height])[0] || '' } catch (e) {}
        }
        console.log('[服务器选择] 切换到下一个服务器', userName2)
        click(width / 4, searchY2 + 50)
        return true
      }
    }
    console.log('[服务器选择] 未找到可切换的服务器')
    return false
  }
}
