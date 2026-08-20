import { getTemplate, imageNameParser, screen, toScreenX, toScreenY } from "./img"

/**
 * 滚动一次并检测是否生效。
 * direction 是手指滑动方向：'top' = 从下往上滑(看下方内容)、'bottom' = 从上往下滑(看上方内容)、'left'/'right' 为横向。
 * 第二次 swipe 是横向小幅拖动，打断第一次 swipe 带来的惯性滚动，让列表停在当前位置。
 * 返回 false 表示滑动后画面未变化(已滑到底/顶)，true 表示滚动生效。
 */
export function scroll(direction: 'left' | 'right' | 'top' | 'bottom', x1: number, y1: number, x2: number, y2: number) {
  let img = screen()
  let scrollX = (x2 - x1) / 3
  let scrollY = (y2 - y1) / 3
  let centerX = (x1 + x2) / 2
  let centerY = (y1 + y2) / 2
  switch (direction) {
    case "left":
      swipe(toScreenX(centerX + scrollX), toScreenY(centerY), toScreenX(centerX), toScreenY(centerY), 300)
      swipe(toScreenX(centerX), toScreenY(centerY), toScreenX(centerX), toScreenY(centerY + scrollY), 300)
      break
    case "right":
      swipe(toScreenX(centerX), toScreenY(centerY), toScreenX(centerX + scrollX), toScreenY(centerY), 300)
      swipe(toScreenX(centerX + scrollX), toScreenY(centerY), toScreenX(centerX + scrollX), toScreenY(centerY + scrollY), 300)
      break
    case "top":
      swipe(toScreenX(centerX), toScreenY(centerY + scrollY), toScreenX(centerX), toScreenY(centerY), 300)
      swipe(toScreenX(centerX), toScreenY(centerY), toScreenX(centerX + scrollX), toScreenY(centerY), 300)
      break
    case "bottom":
      swipe(toScreenX(centerX), toScreenY(centerY), toScreenX(centerX), toScreenY(centerY + scrollY), 300)
      swipe(toScreenX(centerX), toScreenY(centerY + scrollY), toScreenX(centerX + scrollX), toScreenY(centerY + scrollY), 300)
  }
  sleep(800)
  var afterImg = screen(0, false)
  let clipImg = images.clip(afterImg, x1, y1, x2 - x1,  y2 - y1)
  // 在滚动前截图 img 中找滚动后的裁剪图：找到说明页面未变化(已滑到底)，找不到说明滚动生效
  var changed = !images.findImageInRegion(img, clipImg, x1, y1, x2 - x1,  y2 - y1, 0.95)
  // 无论是否变化都要回收：滚动成功的分支此前漏回收 img/clipImg，循环滚动会泄漏 Bitmap
  clipImg.recycle()
  img.recycle()
  if (!changed) {
    console.log('滑动后未发生页面变化，停止滚动')
    return false
  }
  return true
}

export function scrollFind(imgPath: string, direction: 'left' | 'right' | 'top' | 'bottom', x1: number, y1: number, x2: number, y2: number, maxScroll: number = 20) {
  var parsed = imageNameParser(imgPath)
  var template = getTemplate(imgPath)
  for (var i = 0; i < maxScroll; i++) {
    let img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, parsed.x2 - parsed.x1, parsed.y2 - parsed.y1, parsed.threshold)
    if (point) {
      return point
    }
    if(!scroll(direction, x1, y1, x2, y2)) {
      break
    }
  }
  return null
}