import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 历练大厅 } from './历练大厅'
import { 食堂 } from './食堂'
import { 战斗 } from './战斗'
import { 军团 } from './军团'
import { 随机事件 } from './随机事件'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/基地_0_0.9_647_2329_1080_2370.png',
  历练大厅: 'images/基地$历练大厅_1_0.9_190_1099_387_1154.png',
  食堂: 'images/基地$食堂_1_0.9_726_1006_821_1061.png',
}

export class 基地 extends BasePage {
  name = '基地'
  is = createPageDetector(IMG.页面)

  routes(): Route[] {
    return [
      { target: 历练大厅, action: createRouteAction(IMG.历练大厅), imagePath: IMG.历练大厅 },
      { target: 食堂, action: createRouteAction(IMG.食堂), imagePath: IMG.食堂 },
      { target: 战斗, action: createRouteAction(IMG.战斗未选中), imagePath: IMG.战斗未选中 },
      { target: 军团, action: createRouteAction(IMG.军团未选中), imagePath: IMG.军团未选中 },
      { target: 随机事件, action: createRouteAction(IMG.基地随机事件), imagePath: IMG.基地随机事件 },
    ]
  }
}
