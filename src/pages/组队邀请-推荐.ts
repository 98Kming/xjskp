import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 组队邀请好友 } from './组队邀请-好友'

// 组队邀请弹窗默认「推荐」tab,推荐 → 好友单向跳转(无反向按钮模板,反向由 back 处理)
export class 组队邀请推荐 extends BasePage {
  name = '组队邀请-推荐'
  is = createPageDetector('images/组队邀请-推荐_1_0.9_160_2059_252_2111.png')
  routes(): Route[] {
    return [
      { target: 组队邀请好友, action: createRouteAction('images/组队邀请-推荐$组队邀请-好友_1_0.9_409_2065_495_2103.png'), imagePath: 'images/组队邀请-推荐$组队邀请-好友_1_0.9_409_2065_495_2103.png' },
    ]
  }
}
