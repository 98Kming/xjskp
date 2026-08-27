import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, waitObtain } from '../utils/img'
import { 超能之星 } from './超能之星'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/光落彼端$_超能之星_1_0.9_597_1747_711_1812.png', // 识别图兼作跳转按钮:超能之星入口不被点击改变状态,兼作页面识别
  光行千里: 'images/光落彼端$$光行千里_1_0.9_732_814_828_891.png',
}

export class 光落彼端 extends BasePage {
  name = '光落彼端'
  is = createPageDetector(IMG.页面)
  private 光行千里Action = createRouteAction(IMG.光行千里)
  private 超能之星Action = createRouteAction(IMG.页面)

  click_光行千里(): boolean {
    sleep(300)
    if(this.光行千里Action()) {
      return waitObtain(1200,300) && (this.back(), sleep(500), true)
    }
    return false
  }

  routes(): Route[] {
    return [
      { target: 超能之星, action: this.超能之星Action, imagePath: IMG.页面 },
    ]
  }
}
