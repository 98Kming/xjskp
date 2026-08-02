import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 再别前线机械传说 } from './再别前线-机械传说'
import { 再别前线太空撤离 } from './再别前线-太空撤离'
import { 再别前线废土互市 } from './再别前线-废土互市'

export class 再别前线 extends BasePage {
  name = '再别前线'
  is = createPageDetector('images/再别前线$机械传说_1_0.9_515_878_600_954.png')
  private 机械传说Action = createRouteAction('images/再别前线$机械传说_1_0.9_515_878_600_954.png')
  private 太空撤离Action = createRouteAction('images/再别前线$太空撤离_1_0.9_192_1051_273_1127.png')
  private 废土互市Action = createRouteAction('images/再别前线$废土互市_1_0.9_809_1524_889_1597.png')

  click_机械传说(): boolean {
    return this.机械传说Action()
  }

  click_太空撤离(): boolean {
    return this.太空撤离Action()
  }

  click_废土互市(): boolean {
    return this.废土互市Action()
  }

  routes(): Route[] {
    return [
      { target: 再别前线机械传说, action: this.机械传说Action, imagePath: 'images/再别前线$机械传说_1_0.9_515_878_600_954.png' },
      { target: 再别前线太空撤离, action: this.太空撤离Action, imagePath: 'images/再别前线$太空撤离_1_0.9_192_1051_273_1127.png' },
      { target: 再别前线废土互市, action: this.废土互市Action, imagePath: 'images/再别前线$废土互市_1_0.9_809_1524_889_1597.png' },
    ]
  }
}
