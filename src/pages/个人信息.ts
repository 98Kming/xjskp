import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 服务器选择 } from './服务器选择'

export class 个人信息 extends BasePage {
  name = '个人信息'
  is = createPageDetector('images/个人信息_1_0.9_153_1999_261_2055.png')

  routes(): Route[] {
    return [
      { target: 服务器选择, action: createRouteAction('images/个人信息$服务器选择_0_0.9_400_1847_887_1898.png'), imagePath: 'images/个人信息$服务器选择_0_0.9_400_1847_887_1898.png' },
    ]
  }
}
