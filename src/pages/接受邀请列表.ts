import { BasePage, Route } from './BasePage'
import { createPageDetector } from '../utils/img'

// 队员接受邀请列表页(识别图兼作「接受」按钮坐标),入口为战斗/寰球救援页的「副本邀请」按钮
export class 接受邀请列表 extends BasePage {
  name = '接受邀请列表'
  is = createPageDetector('images/接受邀请列表$$_接受_0_0.9_692_660_878_1700.png')
  routes(): Route[] { return [] }
}
