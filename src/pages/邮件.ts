import { BasePage, Route } from './BasePage'
import { createPageDetector } from '../utils/img'

export class 邮件 extends BasePage {
  name = '邮件'
  is = createPageDetector('images/邮件_1_0.9_184_750_514_814.png')

  routes(): Route[] {
    return []
  }
}
