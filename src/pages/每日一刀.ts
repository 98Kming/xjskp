import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/每日一刀_1_0.9_260_1556_560_1599.png',
  砍一刀: 'images/每日一刀$$砍一刀_1_0.9_462_2022_621_2088.png',
  零元购: 'images/每日一刀$$零元购_1_0.9_477_2020_609_2088.png',
}

export class 每日一刀 extends BasePage {
  name = '每日一刀'
  is = createPageDetector(IMG.页面)
  private 关闭 = createRouteAction(IMG.关闭2)

  砍一刀(): boolean {
    // 优先找砍一刀按钮，找不到则尝试零元购
    return (createRouteAction(IMG.砍一刀)()
      || createRouteAction(IMG.零元购)())
      && (sleep(800), this.back(), sleep(800), true)
  }

  back(): boolean {
    return this.关闭()
  }

  routes(): Route[] {
    return []
  }
}
