import { BasePage, Route } from './BasePage'
import { createAnchoredAction, createPageDetector, createRouteAction, screen, height, imageDetector } from '../utils/img'
import { 玩法商店 } from './玩法商店'
import { 寰球救援 } from './寰球救援'
import { 寰球远征 } from './寰球远征'
import { 寰球征途 } from './寰球征途'
import { 终末危机 } from './终末危机'
import { sharedImages } from '../images'
import { scroll, scrollFind } from '../utils/scroll'

const IMG = {
  ...sharedImages,
  玩法商店: 'images/历练大厅$_玩法商店_1_0.8_940_391_1005_435.png',
  救援: 'images/历练大厅_救援_1_0.9_181_468_274_2135.png',
  远征: 'images/历练大厅_远征_1_0.9_181_468_274_2135.png',
  征途: 'images/历练大厅_征途_1_0.9_181_468_273_2135.png',
  征途未开启: 'images/历练大厅_征途-未开启_1_0.9_497_450_642_2150.png',
  终末危机: 'images/历练大厅_终末危机_0_0.9_88_468_275_2135.png',
  远征未开启: 'images/历练大厅_远征-未开启_1_0.9_573_450_866_2150.png',
}

export class 历练大厅 extends BasePage {
  name = '历练大厅'
  // 无纯页面标识图，用右上角固定位置的「玩法商店」按钮兼作页面特征（$_ 命名即此意）。
  // 旧版用「远征」图识别：该按钮在左侧滚动列表里，滚一下就移出屏幕，识别不稳
  is = createPageDetector(IMG.玩法商店)

  routes(): Route[] {
    return [
      { target: 玩法商店, action: createRouteAction(IMG.玩法商店), imagePath: IMG.玩法商店 },
      {
        target: 寰球救援, action: createAnchoredAction(
          IMG.救援,
          IMG.挑战
        )
      },
      {
        target: 寰球征途, action: (): boolean => {
          if (imageDetector(IMG.征途未开启)) {
            return false
          }
          if (createAnchoredAction(IMG.征途, IMG.挑战)()) {
            return true
          }
          scroll("top", 88, height * 0.2, 1000, height * 0.8)
          return !imageDetector(IMG.征途未开启) && createAnchoredAction(IMG.征途, IMG.挑战)()
        }
      },
      {
        target: 寰球远征, action: (): boolean => {
          if (imageDetector(IMG.远征未开启)) {
            return false
          }
          if (createAnchoredAction(IMG.远征, IMG.挑战)()) {
            return true
          }
          scroll("top", 88, height * 0.2, 1000, height * 0.8)
          return !imageDetector(IMG.远征未开启) && createAnchoredAction(IMG.远征, IMG.挑战)()
        }
      },
      {
        target: 终末危机, action: (): boolean => {
          if (!scrollFind(IMG.终末危机, "top", 88, height * 0.2, 1000, height * 0.8)) {
            return false
          }
          if (createAnchoredAction(IMG.终末危机, IMG.挑战)()) {
            return true
          }
          scroll("top", 88, height * 0.2, 1000, height * 0.8)
          return createAnchoredAction(IMG.终末危机, IMG.挑战)()
        }
      }
    ]
  }
}
