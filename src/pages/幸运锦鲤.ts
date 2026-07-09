import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 幸运锦鲤免费福利 } from './幸运锦鲤-免费福利'

export class 幸运锦鲤 extends BasePage {
  name = '幸运锦鲤'
  is = createPageDetector('images/幸运锦鲤_1_0.9_916_781_1068_830.png')

  routes(): Route[] {
    return [
      { target: 幸运锦鲤免费福利, action: createRouteAction('images/幸运锦鲤$幸运锦鲤-免费福利_1_0.8_965_881_1060_915.png'), imagePath: 'images/幸运锦鲤$幸运锦鲤-免费福利_1_0.8_965_881_1060_915.png' },
    ]
  }
}
