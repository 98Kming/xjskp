export const width = 1080
export const height = width / device.width * device.height
console.log('屏幕宽高:', width, height, '设备宽高:', device.width, device.height)
import { imageBasePath } from '../config'
let last_capture_time = 0
let cache_screen_img: ImageWrapper | null = null
var templateCache = new java.util.HashMap()
var pointCache = new java.util.HashMap()
var regionCache = new java.util.HashMap()
export let recycleImgs: ImageWrapper[] = []

/** AutoXJS Google ML Kit OCR（运行时可选） */
declare var gmlkit: { ocr: (img: any, lang: string) => { text: string } }
/** AutoXJS Google ML Kit OCR（部分 fork 缩写名） */
declare var gml: { ocr: (img: any, region: number[]) => string[] }

/**
 * 从图片指定区域 OCR 取文字，三路降级兼容 AutoX.js 和 AutoJs6。
 * gmlkit（原版 AutoX.js）→ gml（fork 缩写）→ AutoJs6 ocr
 */
export function ocrText(img: any, x: number, y: number, w: number, h: number): string {
  var text = ''
  try { if (typeof gmlkit !== 'undefined') { var c = images.clip(img, x, y, w, h); if (c) { try { text = gmlkit.ocr(c, 'zh').text || '' } finally { c.recycle() } } } } catch (e) { }
  if (!text && typeof gml !== 'undefined') { try { text = gml.ocr(img, [x, y, w, h])[0] || '' } catch (e) { } }
  if (!text && typeof ocr !== 'undefined') { try { text = ocr.recognizeText(img, { region: [x, y, w, h] })[0] || '' } catch (e) { } }
  return text
}
export function getTemplate(filePath: string): ImageWrapper {
  var template = templateCache.get(filePath)
  if (!template) {
    template = images.read(imageBasePath + filePath)
    if (template == null) {
      throw new Error(`模板图片不存在: ${filePath}`)
    }
    templateCache.put(filePath, template)
  }
  return template
}

export function screen(interval: number = 500, recycle: boolean = true): ImageWrapper {
  const now = Date.now()
  if (cache_screen_img && now < last_capture_time + interval) {
    try {
      cache_screen_img.ensureNotRecycled()
      return cache_screen_img
    } catch (e) {
      console.warn("截图已被回收，重新截图", e)
    }
  }
  if (recycle && cache_screen_img) {
    cache_screen_img.recycle()
    recycleImgs.push(cache_screen_img)
  }
  let img
  try {
    img = captureScreen();
  } catch (e) {
    var retries = 10
    while (!images.requestScreenCapture() && retries > 0) {
      sleep(1000)
      retries--
    }
    if (retries === 0) throw new Error('截图权限请求失败')
    img = captureScreen();
  }
  last_capture_time = Date.now()
  if (img.width != width) {
    img = images.scale(img, width, height)
  }
  cache_screen_img = img
  return img
}


export function imageNameParser(filePath: string): ImageParseResult {
  // 从完整路径中提取文件名
  const baseName = filePath.split('/').pop()!.replace(/\.[^.]+$/, '')
  // 优先匹配完整 6 段后缀: _cache_threshold_x1_y1_x2_y2
  const fullRegex = /_([01])_([01](?:\.\d+)?)_([^_]+)_([^_]+)_([^_]+)_([^_]+)$/
  const fullMatch = baseName.match(fullRegex)
  if (fullMatch) {
    const [, cacheStr, thresholdStr, x1Str, y1Str, x2Str, y2Str] = fullMatch
    const cache = parseInt(cacheStr) as 0 | 1
    const threshold = parseFloat(thresholdStr)
    const parseCoordinate = (value: string): number => {
      if (value === 'w') return width
      if (value === 'h') return height
      const num = parseInt(value);
      if (isNaN(num)) throw new Error(`无效的坐标值: ${value}`)
      return num;
    }
    const x1 = parseCoordinate(x1Str)
    const y1 = parseCoordinate(y1Str)
    const x2 = parseCoordinate(x2Str)
    const y2 = parseCoordinate(y2Str)
    const [expandedX1, expandedY1, expandedX2, expandedY2] = expandRegion(x1, y1, x2, y2)
    return { cache, threshold, x1: expandedX1, y1: expandedY1, x2: expandedX2, y2: expandedY2, rawFileName: filePath }
  }
  // 兼容无坐标格式: _cache_threshold，搜索区域默认为全屏
  const shortRegex = /_([01])_([01](?:\.\d+)?)$/
  const shortMatch = baseName.match(shortRegex)
  if (shortMatch) {
    const [, cacheStr, thresholdStr] = shortMatch
    return {
      cache: parseInt(cacheStr) as 0 | 1,
      threshold: parseFloat(thresholdStr),
      x1: 0,
      y1: 0,
      x2: width,
      y2: height,
      rawFileName: filePath
    }
  }
  throw new Error(`无效的文件名格式: ${filePath}`)
}

var refWidth = 1080
var refHeight = 1920

function expandRegion(x1: number, y1: number, x2: number, y2: number): [number, number, number, number] {
  x1 = Math.max(x1 - 10, 0)
  // 纵向扩展 300px：refHeight=1920, 按 2400 作为实际屏高基数计算偏移
  // (2400/10)*1.25 = 300px，覆盖底部状态栏/导航栏差异
  y1 = Math.max(y1 - (2400 / 10) * 1.25, 0)
  x2 = Math.min(x2 + 10, width)
  if (y2 > refHeight) {
    y1 = Math.min(height - (y2 - y1), y1)
    y2 = height
  } else {
    y2 += height - refHeight
  }
  return [x1, y1, x2, y2]
}

export interface PageDetector {
  (img: ImageWrapper): boolean
  detectImagePath: string
}

export function imageDetector(filePath: string): boolean {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  let img = screen()
  var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
  return !!point
}

export function createPageDetector(filePath: string): PageDetector {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1

  var fn = function (img: ImageWrapper): boolean {
    var cached = regionCache.get(filePath)
    if (cached) {
      var point = images.findImageInRegion(img, template, cached.x1, cached.y1, cached.x2 - cached.x1, cached.y2 - cached.y1, parsed.threshold)
      if (point) {
        var tplPixel = images.pixel(template, 0, 0)
        var scrPixel = images.pixel(img, point.x, point.y)
        let lum1 = colors.luminance(tplPixel);
        let lum2 = colors.luminance(scrPixel);
        if (lum2 !== 0) {
          let percentDiff = (Math.abs(lum2 - lum1) / lum2) * 100;
          if (percentDiff < 50) return true
        }
      }
      // 缓存区域找不到 → 暂时被遮挡或页面过渡，保留缓存下次重试
      return false
    }
    // 无缓存 → 全量搜索
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    var tplPixel = images.pixel(template, 0, 0)
    var scrPixel = images.pixel(img, point.x, point.y)
    let lum1 = colors.luminance(tplPixel);
    let lum2 = colors.luminance(scrPixel);
    if (lum2 === 0) {
      log('[检测] 亮度为0，跳过匹配')
      return false
    }
    // 计算亮度下降百分比
    let percentDiff = (Math.abs(lum2 - lum1) / lum2) * 100;
    percentDiff < 50 && log('[亮度] 模板:', lum1.toFixed(5), '屏幕:', lum2.toFixed(5), percentDiff, filePath)
    if (parsed.cache === 1 && percentDiff < 50) {
      regionCache.put(filePath, {
        x1: Math.max(point.x - 5, 0),
        y1: Math.max(point.y - 5, 0),
        x2: Math.min(point.x + template.width + 5, width),
        y2: Math.min(point.y + template.height + 5, height)
      })
    }
    return percentDiff < 50;
  } as PageDetector
  fn.detectImagePath = filePath
  return fn
}

export function createRouteAction(filePath: string): () => boolean {
  var parsed = imageNameParser(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  var template = getTemplate(filePath)

  // cache=1: 带区域缓存，首次匹配后缩小搜索范围（避免盲点，兼顾速度）
  if (parsed.cache === 1) {
    return function (): boolean {
      var cached = regionCache.get(filePath)
      if (cached) {
        var img = screen()
        var point = images.findImageInRegion(img, template, cached.x1, cached.y1, cached.x2 - cached.x1, cached.y2 - cached.y1, parsed.threshold)
        if (point) {
          click(point.x + template.width / 2, point.y + template.height / 2)
          return true
        }
        // 缓存区域找不到 → 暂时被遮挡或页面过渡，保留缓存下次重试
        return false
      }
      var img = screen()
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      //log('尝试匹配模板:', filePath, `[${parsed.x1},${parsed.y1}-${parsed.x2},${parsed.y2}]`, point ? `结果: 找到坐标(${point.x}, ${point.y})` : '结果: 未找到')
      if (!point) return false
      var cx = point.x + template.width / 2
      var cy = point.y + template.height / 2
      regionCache.put(filePath, {
        x1: Math.max(point.x - 5, 0),
        y1: Math.max(point.y - 5, 0),
        x2: Math.min(point.x + template.width + 5, width),
        y2: Math.min(point.y + template.height + 5, height)
      })
      click(cx, cy)
      return true
    }
  }

  // cache=0: 每次重新截图匹配
  return function (): boolean {
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(point.x + template.width / 2, point.y + template.height / 2)
    return true
  }
}

/**
 * 锚点定位式点击：先找标识图(anchor)，在标识下方区域找目标按钮(target)，
 * 用于多个相同按钮需按位置区分的场景（如寰球救援/远征共用挑战按钮图）。
 * anchorPath 需有坐标（限定锚点搜索区域），targetPath 坐标被忽略（改用锚点动态区域）。
 */
export function createAnchoredAction(anchorPath: string, targetPath: string): () => boolean {
  var anchorParsed = imageNameParser(anchorPath)
  var anchorTemplate = getTemplate(anchorPath)
  var arw = anchorParsed.x2 - anchorParsed.x1
  var arh = anchorParsed.y2 - anchorParsed.y1

  var targetParsed = imageNameParser(targetPath)
  var targetTemplate = getTemplate(targetPath)

  return function (): boolean {
    var img = screen()
    // 找标识图
    var anchorPoint = images.findImageInRegion(img, anchorTemplate,
      anchorParsed.x1, anchorParsed.y1, arw, arh, anchorParsed.threshold)
    if (!anchorPoint) return false

    // 标识图底部即搜索起点
    var searchY = anchorPoint.y + anchorTemplate.height
    var searchH = height - searchY
    if (searchH <= 0) return false

    // 在标识下方区域找目标按钮，取最上方的一个
    var targetResult = images.matchTemplate(img, targetTemplate, {
      region: [0, searchY, width, searchH],
      threshold: targetParsed.threshold,
    })
    if (!targetResult || !targetResult.matches || targetResult.matches.length === 0) return false
    var topMatch = targetResult.matches[0]
    for (var mi = 1; mi < targetResult.matches.length; mi++) {
      if (targetResult.matches[mi].point.y < topMatch.point.y) {
        topMatch = targetResult.matches[mi]
      }
    }
    var targetPoint = topMatch.point
    if (!targetPoint) return false

    click(targetPoint.x + targetTemplate.width / 2, targetPoint.y + targetTemplate.height / 2)
    return true
  }
}

/**
 * 镜像坐标点击：找图后点击 device.width - 图片.x, 图片.y + 图片.height / 2
 * 入场券类按钮专用：图片在屏幕左侧匹配，点击右侧对应位置。
 * 支持 cache=1 坐标缓存。
 */
export function createMirroredAction(filePath: string): () => boolean {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1

  if (parsed.cache === 1) {
    return function (): boolean {
      var cached = pointCache.get(filePath)
      if (cached) {
        click(cached.x, cached.y)
        return true
      }
      var img = screen()
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      if (!point) return false
      var cx = device.width - point.x - template.width / 2
      var cy = point.y + template.height / 2
      pointCache.put(filePath, { x: cx, y: cy })
      log('镜像点击:', filePath, `坐标(${cx}, ${cy})`)
      click(cx, cy)
      return true
    }
  }

  return function (): boolean {
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    var cx = device.width - point.x
    var cy = point.y + template.height / 2
    log('镜像点击:', filePath, `坐标(${cx}, ${cy})`)
    click(cx, cy)
    return true
  }
}

/**
 * 入场券镜像点击（含已售罄检测）：
 * 找入场券图片，若找到则在入场券右侧区域查找已售罄，
 * 已售罄则返回 false（跳过），否则执行镜像坐标点击。
 * ticketPath 按标准图片命名解析；soldOutPath 用 images.read 直接加载。
 */
export function createTicketAction(ticketPath: string, soldOutPath: string): () => boolean {
  var parsed = imageNameParser(ticketPath)
  var template = getTemplate(ticketPath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  var soldOutTemplate = images.read(imageBasePath + soldOutPath)

  return function (): boolean {
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false

    // 入场券右侧查找已售罄
    var checkX = point.x + template.width
    var checkW = width - checkX
    var soldOutPoint = images.findImageInRegion(img, soldOutTemplate, checkX, point.y, checkW, template.height, 0.9)
    if (soldOutPoint) {
      log('[入场券] 已售罄，跳过:', ticketPath)
      return false
    }

    var cx = device.width - point.x - template.width / 2
    var cy = point.y + template.height / 2
    log('镜像点击:', ticketPath, `坐标(${cx}, ${cy})`)
    click(cx, cy)
    return true
  }
}

var closeButtons: (() => boolean)[] = [
  createRouteAction('images/$关闭1_0_0.8_800_400_1020_600.png'),
  createRouteAction('images/重新连接_1_0.9_635_1460_847_1513.png'),
  createRouteAction('images/$确定_0_0.8_494_1000_764_1600.png'),
]
const colors_关闭_无框_多点: [number, number, string][] = [[4, 13, "#fde6bc"], [6, 21, "#fce4bb"], [13, 42, "#fadda4"], [16, 48, "#fdd59d"], [-1, 24, "#fbe3ba"], [14, 22, "#fce4bb"], [21, 18, "#ffebc4"], [29, 15, "#fff8d8"], [0, 2, "#fee6bc"], [4, 7, "#fde5bb"], [2, 19, "#fde9c4"], [10, 24, "#fce4bb"], [15, 47, "#f3cb93"], [-15, 29, "#fee9c4"], [12, 23, "#fce4bb"]]
const colors_关闭_无框_多点_exclude: [number, number, string][] = [[-8, 14, "#1b1209"], [0, 43, "#1b110a"], [26, 35, "#191009"], [14, 11, "#1b1108"]]
const colors_关闭_无框 = "#fff8d3"
const colors_关闭_无框2_多点: [number, number, string][] = [[4, 5, "#ebdab8"], [10, 11, "#ebdab9"], [17, 17, "#ebdab8"], [30, 26, "#eed4a9"], [32, 29, "#f1d5a4"], [-1, 31, "#ead9b9"], [2, 26, "#ebdab8"], [9, 21, "#ebdab8"], [17, 13, "#ebdab8"], [31, -4, "#f8ead1"], [25, 3, "#eddcbc"]]
const colors_关闭_无框2_多点_exclude: [number, number, string][] = [[12, -6, "#0d0a07"], [36, 12, "#201b11"], [17, 35, "#13110c"], [15, 40, "#110c07"], [38, 17, "#090704"]]
const colors_关闭_无框2 = "#ebdab8"

export function tryCloseModals(): boolean {
  // 多点找色检测无框关闭按钮（替换关闭2的图片匹配）
  var img = screen()
  var point = images.findMultiColors(img, colors_关闭_无框, colors_关闭_无框_多点, {
    region: [img.width * 0.8, 0, img.width * 0.2, img.height * 0.4], threshold: 26
  })
  if (point) {
    var excluded = false
    for (var i = 0; i < colors_关闭_无框_多点_exclude.length; i++) {
      var item = colors_关闭_无框_多点_exclude[i]
      if (images.detectsColor(img, colors_关闭_无框, point.x + item[0], point.y + item[1], 26, "diff")) {
        excluded = true
        break
      }
    }
    if (!excluded) {
      click(point.x, point.y + 30)
      return true
    }
  }

  // 第二组多点找色
  point = images.findMultiColors(img, colors_关闭_无框2, colors_关闭_无框2_多点, {
    region: [img.width * 0.82, 0, img.width * 0.18, img.height * 0.4], threshold: 20
  })
  if (point) {
    var excluded2 = false
    for (var j = 0; j < colors_关闭_无框2_多点_exclude.length; j++) {
      var item2 = colors_关闭_无框2_多点_exclude[j]
      if (images.detectsColor(img, colors_关闭_无框2, point.x + item2[0], point.y + item2[1], 26, "diff")) {
        excluded2 = true
        break
      }
    }
    if (!excluded2) {
      click(point.x, point.y + 30)
      return true
    }
  }

  // 兜底：图片模板匹配
  for (var k = 0; k < closeButtons.length; k++) {
    if (closeButtons[k]()) return true
  }
  return false
}

/** 像素采样对比前后截图。网格取色 + colors.isSimilar，允许一定比例差异兼容动态元素 */
export function pageChange(beforeImg: ImageWrapper): boolean {
  var afterImg = screen(0, false)
  var cols = 20
  var rows = Math.round(cols * afterImg.height / afterImg.width)
  var stepX = Math.floor(afterImg.width / (cols + 1))
  var stepY = Math.floor(afterImg.height / (rows + 1))
  var mismatches = 0
  var total = 0

  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var x = (col + 1) * stepX
      var y = (row + 1) * stepY
      if (!colors.isSimilar(
        images.pixel(beforeImg, x, y),
        images.pixel(afterImg, x, y),
        25, "diff"
      )) mismatches++
      total++
    }
  }

  return (mismatches / total) > 0.03
}


export function scrollFind(imgPath: string, x1: number, y1: number, x2: number, y2: number, x3: number, maxScroll: number = 20): OpenCV.Point | null {
  var parsed = imageNameParser(imgPath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  var template = getTemplate(imgPath)
  for (var i = 0; i < maxScroll; i++) {
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (point) {
      // var cx = point.x + template.width + 60
      // var cy = point.y + template.height + 10
      // console.log('[服务器选择] 找到选中标识 坐标:(' + point.x + ',' + point.y + ') 点击:(' + cx + ',' + cy + ')')
      return point
    }
    // 向上滚动：从屏幕下方滑到上方
    swipe(x1, y1, x2, y2, 300)
    swipe(x2, y2, x3, y2, 300)
    sleep(800)
    var afterImg = screen(0, false)
    let x = Math.min(x1, x2, x3)
    let y = Math.min(y1, y2)
    let w = Math.max(x1, x2, x3) - x
    let h = Math.max(y1, y2) - y
    let clipImg = images.clip(afterImg, x, y, w, h)
    if (images.findImageInRegion(img, clipImg, x, y, w, h, 0.99)) {
      clipImg.recycle()
      img.recycle()
      // 滑动后未发生页面变化，说明已滑到底部，停止滚动
      console.log('[服务器选择] 滑动后未发生页面变化，已滑到底部，停止滚动')
      break
    }
    clipImg.recycle()
    img.recycle()
  }
  return null
}

export function findImageMinYPoint(img: ImageWrapper, template: ImageWrapper, x: number, y: number, w: number, h: number, threshold: number) {
  // 在标识下方区域找目标按钮，取最上方的一个
  var targetResult = images.matchTemplate(img, template, {
    region: [x, y, w, h,],
    threshold: threshold,
    max: 20
  })
  if (!targetResult || !targetResult.matches || targetResult.matches.length === 0) return false
  var topMatch = targetResult.matches[0]
  for (var mi = 1; mi < targetResult.matches.length; mi++) {
    if (targetResult.matches[mi].point.y < topMatch.point.y) {
      topMatch = targetResult.matches[mi]
    }
  }
  return topMatch.point
}