import { BasePage, Route } from './BasePage'
import { createPageDetector } from '../utils/img'

export class 选择技能 extends BasePage {
  name = '选择技能'
  is = createPageDetector('images/选择技能_0_0.8_442_729_642_775.png')

  routes(): Route[] {
    return []
  }
}
