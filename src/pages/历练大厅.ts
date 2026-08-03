import { BasePage, Route } from './BasePage'
import { createAnchoredAction, createPageDetector, createRouteAction, getTemplate, imageNameParser, screen, width, height } from '../utils/img'
import { 玩法商店 } from './玩法商店'
import { 寰球救援 } from './寰球救援'
import { 寰球远征 } from './寰球远征'
import { 终末危机 } from './终末危机'

export class 历练大厅 extends BasePage {
  name = '历练大厅'
  // 无纯页面标识图，使用「远征」按钮作为页面特征检测
  is = createPageDetector('images/历练大厅_远征_1_0.9_181_1296_274_1700.png')

  routes(): Route[] {
    return [
      { target: 玩法商店, action: createRouteAction('images/历练大厅$玩法商店_1_0.8_940_391_1005_435.png'), imagePath: 'images/历练大厅$玩法商店_1_0.8_940_391_1005_435.png' },
      { target: 寰球救援, action: createAnchoredAction(
        'images/历练大厅_救援_1_0.9_181_938_274_1700.png',
        'images/$挑战_0_0.9.png'
      ) },
      { target: 寰球远征, action: createAnchoredAction(
        'images/历练大厅_远征_1_0.9_181_1296_274_1700.png',
        'images/$挑战_0_0.9.png'
      ) },
      { target: 终末危机, action: (): boolean => {
        var anchorPath = 'images/历练大厅_终末危机_1_0.9_88_400_275_1782.png'
        var anchorParsed = imageNameParser(anchorPath)
        var anchorTpl = getTemplate(anchorPath)
        var challengeTpl = getTemplate('images/$挑战_0_0.9.png')

        function 找锚点下方挑战(): boolean {
          var img = screen()
          var pt = images.findImageInRegion(img, anchorTpl,
            anchorParsed.x1, anchorParsed.y1,
            anchorParsed.x2 - anchorParsed.x1,
            anchorParsed.y2 - anchorParsed.y1,
            anchorParsed.threshold)
          if (!pt) return false
          // 在锚点下方区域找挑战（只取最上方一个，避免匹配到列表里其他挑战）
          var searchY = pt.y + anchorTpl.height
          var result = images.matchTemplate(img, challengeTpl, {
            region: [0, searchY, width, height - searchY],
            threshold: 0.9,
          })
          if (!result || !result.matches || result.matches.length === 0) return false
          var p = result.matches[0].point
          click(p.x + challengeTpl.width / 2, p.y + challengeTpl.height / 2)
          return true
        }

        if (找锚点下方挑战()) return true
        // 终末危机在列表底部，挑战可能在可视区外，滑一次再查（两段式：滑动+点停惯性）
        console.log('[历练大厅] 终末危机挑战按钮未找到，滚动一次重试')
        swipe(width / 2, height * 0.6, width / 2, height * 0.3, 300)
        swipe(width / 2, height * 0.3, width / 2 + 50, height * 0.3, 100)
        sleep(800)
        return 找锚点下方挑战()
      }, imagePath: 'images/$挑战_0_0.9.png' },
    ]
  }
}
