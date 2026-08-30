// src/pages/登录.ts — 登录页:游戏重启后可能停在登录页,识别后点"战斗"按钮直接进战斗页
import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 战斗 } from './战斗'

const IMG = {
  // 登录页识别图 + 登录页→战斗页跳转按钮({A}$_{B} 命名,识别与跳转共用)
  页面: 'images/登录$_战斗_1_0.9_428_2009_657_2062.png',
}

export class 登录 extends BasePage {
  name = '登录'
  is = createPageDetector(IMG.页面)

  routes(): Route[] {
    return [
      // 登录页 → 战斗页:点击"战斗"按钮
      { target: 战斗, action: createRouteAction(IMG.页面), imagePath: IMG.页面 },
    ]
  }
}
