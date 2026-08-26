import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 服务器选择 } from './服务器选择'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/个人信息_1_0.9_153_1999_261_2055.png',
  服务器选择: 'images/个人信息$服务器选择_0_0.9_400_1847_887_1898.png',
}

export class 个人信息 extends BasePage {
  name = '个人信息'
  is = createPageDetector(IMG.页面)

  routes(): Route[] {
    return [
      { target: 服务器选择, action: createRouteAction(IMG.服务器选择), imagePath: IMG.服务器选择 },
    ]
  }
}
