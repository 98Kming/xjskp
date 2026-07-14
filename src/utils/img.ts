export const width = 1080
export const height = width / device.width * device.height
console.log('屏幕宽高:', width, height, '设备宽高:', device.width, device.height)
import { imageBasePath } from '../config'
let last_capture_time = 0
let cache_screen_img: ImageWrapper | null = null
var templateCache = new java.util.HashMap()
var pointCache = new java.util.HashMap()

export function getTemplate(filePath: string): ImageWrapper {
  var template = templateCache.get(filePath)
  if (!template) {
    template = images.read(imageBasePath+filePath)
    if(template == null){
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
  y1 = Math.max(y1 - (2400 / 10)*1.25, 0)
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

export function createPageDetector(filePath: string): PageDetector {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1

  var fn = function (img: ImageWrapper): boolean {
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
    percentDiff < 50 &&log('[亮度] 模板:', lum1.toFixed(5), '屏幕:', lum2.toFixed(5),percentDiff, filePath)
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

  // cache=1: 带坐标缓存，首次匹配后直接复用坐标
  if (parsed.cache === 1) {
    return function (): boolean {
      var cached = pointCache.get(filePath)
      if (cached) {
        click(cached.x, cached.y)
        return true
      }
      var img = screen()
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      log('尝试匹配模板:', filePath, `[${parsed.x1},${parsed.y1}-${parsed.x2},${parsed.y2}]`, point ? `结果: 找到坐标(${point.x}, ${point.y})` : '结果: 未找到')
      if (!point) return false
      var cx = point.x + template.width / 2
      var cy = point.y + template.height / 2
      pointCache.put(filePath, { x: cx, y: cy })
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

    // 在标识下方区域找目标按钮
    var targetPoint = images.findImageInRegion(img, targetTemplate,
      0, searchY, width, searchH, targetParsed.threshold)
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

  // 兜底：图片模板匹配（关闭1 + 重新连接）
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