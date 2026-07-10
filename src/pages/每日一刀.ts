import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'

export class 每日一刀 extends BasePage {
  name = '每日一刀'
  is = createPageDetector('images/每日一刀_1_0.9_456_1935_766_1975.png')
  private 关闭 = createRouteAction('images/$关闭2_0_0.8_800_400_1020_600.png')

  砍一刀(): boolean {
    return createRouteAction('images/每日一刀$$砍一刀_1_0.9_462_2022_621_2088.png')()
  }

  back(): boolean {
    return this.关闭()
  }

  routes(): Route[] {
    return []
  }
}
