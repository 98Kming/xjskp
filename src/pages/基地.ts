import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction } from '../utils/img'
import { 历练大厅 } from './历练大厅'
import { 食堂 } from './食堂'
import { 战斗 } from './战斗'
import { 军团 } from './军团'

export class 基地 extends BasePage {
  name = '基地'
  is = createPageDetector('images/基地_0_0.9_647_2329_735_2370.png')

  routes(): Route[] {
    return [
      { target: 历练大厅, action: createRouteAction('images/基地$历练大厅_1_0.9_190_1099_387_1154.png'), imagePath: 'images/基地$历练大厅_1_0.9_190_1099_387_1154.png' },
      { target: 食堂, action: createRouteAction('images/基地$食堂_1_0.9_726_1023_821_1074.png'), imagePath: 'images/基地$食堂_1_0.9_726_1023_821_1074.png' },
      { target: 战斗, action: createRouteAction('images/$战斗-未选中_0_0.9_504_2328_575_2370.png'), imagePath: 'images/$战斗-未选中_0_0.9_504_2328_575_2370.png' },
      { target: 军团, action: createRouteAction('images/$军团-未选中_0_0.8_807_2335_873_2367.png'), imagePath: 'images/$军团-未选中_0_0.8_807_2335_873_2367.png' },
    ]
  }
}
