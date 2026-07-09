// src/pages/BasePage.ts

type RegisterFn = (page: BasePage) => void
var registerFn: RegisterFn | null = null
var pendingPages: BasePage[] = []

export function setRegisterCallback(fn: RegisterFn): void {
  registerFn = fn
  for (var i = 0; i < pendingPages.length; i++) {
    registerFn(pendingPages[i])
  }
  pendingPages = []
}

/** 页面路由出口：从当前页点击某个位置可到达 target 页面 */
export interface Route {
  target: typeof BasePage
  action: () => boolean
  /** 可选：按钮图片路径，用于日志定位问题 */
  imagePath?: string
}

export abstract class BasePage {
  abstract name: string
  abstract is(img: ImageWrapper): boolean

  constructor() {
    if (registerFn) {
      registerFn(this)
    } else {
      pendingPages.push(this)
    }
  }

  routes(): Route[] | void {
    return []
  }

  back(): boolean {
    return click(100, device.height - 100)
  }
}
