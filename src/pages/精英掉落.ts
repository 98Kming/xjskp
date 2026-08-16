import { BasePage } from './BasePage'
import { createRouteAction, imageDetector } from '../utils/img'
import { 战斗中 } from './战斗中'

// 精英掉落弹窗：打精英怪掉落奖励时弹出，仅战斗中出现，点 back 按钮关闭。
// 命名 {A}$$_{按钮}：兼作页面识别图 + A 内按钮坐标
var 弹窗图 = 'images/精英掉落$$_back_1_0.9_460_1605_619_1645.png'

export class 精英掉落 extends BasePage {
  name = '精英掉落'
  // 精英掉落弹窗只在战斗中弹出，识别到即处于战斗中
  hostPage = 战斗中
  is(img: ImageWrapper) {
    return !!imageDetector(弹窗图, img)
  }

  /** 关闭弹窗（点 back 按钮） */
  关闭弹窗(): boolean {
    return createRouteAction(弹窗图)()
  }
}
