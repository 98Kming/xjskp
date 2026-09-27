import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, waitForImage } from '../utils/img'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  back: 'images/战斗结束$_back_0_0.9_268_1961_805_2154.png',
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
   * 传入 img 时先在调用方手上这帧找——结算页刚出现时同帧内找图，既不额外截图也不会读到旧帧；
   * 同帧未命中再轮询兜底（全屏动画盖住弹窗时，等一拍重新截图比死守旧帧更稳）。
   *
   * 顺序不能颠倒：waitForImage 内部走 screen(0)，会把截图缓存里那一帧回收掉，
   * 而调用方的 img 通常正是它（Game.ts 的 `img = screen()`），同帧检查放到轮询后面会抛
   * image is recycled。同理本方法返回后，调用方手上这帧可能已失效，不得再用
   * （Game.ts 每轮战斗循环都会重新 screen()）。
   */
  是成功(img?: ImageWrapper): boolean {
    if (img) {
      try {
        // imageDetector 只读传入帧、不回收它；真正回收它的是下面的 waitForImage，
        // 所以同帧检查必须排在前面
        if (imageDetector(IMG.恭喜获得, img)) return true
      } catch (e) {
        // img 已被回收（例如上一轮已经刷新过截图缓存）：跳过同帧检查，交给轮询兜底
        log('[战斗结束] 传入帧已回收，跳过同帧识别')
      }
    }
    return !!waitForImage(IMG.恭喜获得, 800, 300)
  }

  routes(): Route[] {
    return [
      { target: 战斗中, action: createRouteAction(IMG.战斗中), imagePath: IMG.战斗中 },
    ]
  }
}
