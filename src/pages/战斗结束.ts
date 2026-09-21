import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector } from '../utils/img'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  back: 'images/战斗结束$_back_0_0.9_400_1961_805_2154.png',
  战斗中: 'images/战斗结束$战斗中_1_0.9_228_1962_422_2010.png',
  恭喜获得: 'images/战斗结束_恭喜获得_1_0.8_456_704_634_739.png',
}

export class 战斗结束 extends BasePage {
  name = '战斗结束'
  // 右下角 back 按钮，兼作页面识别（$_ 格式）
  is = createPageDetector(IMG.back)

  back(): boolean {
    return createRouteAction(IMG.back)()
  }

  /** 再次挑战：回到战斗中 */
  再战(): boolean {
    return createRouteAction(IMG.战斗中)()
  }

  /**
   * 本局胜负：结算页上的「恭喜获得」是静态元素，识别到即胜利，没有则失败（战败或提前退出）。
   * 传入 img 复用调用方手上那帧——结算页刚出现时同帧内找图，既不额外截图也不会读到旧帧。
   */
  是成功(img?: ImageWrapper): boolean {
    if (imageDetector(IMG.恭喜获得, img)) {
      return true
    }
    // TODO 临时取证：留帧确认战败是真战败还是识别错误，验证完删除本行，上面分支也可还原为单行判空
    img && images.save(img, '/sdcard/结束' + Date.now() + '.png')
    return false
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction(IMG.战斗中), imagePath: IMG.战斗中 },
    ]
  }
}
