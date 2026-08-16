import { BasePage, Route } from './BasePage'
import { createPageDetector } from '../utils/img'

// 组队邀请弹窗「好友」tab(队长邀请列表),无路由出口,返回靠 Router back
export class 组队邀请好友 extends BasePage {
  name = '组队邀请-好友'
  is = createPageDetector('images/组队邀请-好友_1_0.9_409_2065_495_2103.png')
  routes(): Route[] { return [] }
}
