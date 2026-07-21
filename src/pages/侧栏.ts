import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 邮件 } from './邮件'
import { 好友 } from './好友'

export class 侧栏 extends BasePage {
  name = '侧栏'
  // 侧栏$_邮件 格式标识：既是侧栏页的唯一标识，也是跳转到邮件的按钮
  is = createPageDetector('images/侧栏$_邮件_1_0.9_882_528_947_561.png')

  // 打开和关闭是同一个 toggle 按钮
  back(): boolean {
    return createRouteAction('images/侧栏$$back_1_0.9_974_393_1025_442.png')()
  }

  routes(): Route[] {
    return [
      { target: 邮件, action: createRouteAction('images/侧栏$_邮件_1_0.9_882_528_947_561.png'), imagePath: 'images/侧栏$_邮件_1_0.9_882_528_947_561.png' },
      { target: 好友, action: createRouteAction('images/侧栏$好友_1_0.9_804_751_1028_814.png'), imagePath: 'images/侧栏$好友_1_0.9_804_751_1028_814.png' },
    ]
  }
}
