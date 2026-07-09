export const width = 1080
export const height = width / device.width * device.height
console.log('屏幕宽高:', width, height, '设备宽高:', device.width, device.height)
let last_capture_time = 0
let cache_screen_img: ImageWrapper | null = null
var templateCache = new java.util.HashMap()
var pointCache = new java.util.HashMap()

function getTemplate(filePath: string): ImageWrapper {
  var template = templateCache.get(filePath)
  if (!template) {
    template = images.read("向僵尸开炮/"+filePath)
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
  y1 = Math.max(y1 - 150, 0)
  x2 = Math.min(x2 + 10, width)
  if (y2 > refHeight) {
    y1 = Math.min(height - (y2 - y1), y1)
    y2 = height
  } else {
    y2 += height - refHeight
  }
  return [x1, y1, x2, y2]
}

export function createPageDetector(filePath: string): (img: ImageWrapper) => boolean {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1

  return function (img: ImageWrapper): boolean {
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
    return percentDiff < 50;
  }
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
      log('尝试匹配模板:', filePath, '结果:', point ? `找到坐标(${point.x}, ${point.y})` : '未找到', '区域', parsed.x1, parsed.y1, rw, rh)
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

var closeButtons: (() => boolean)[] = [
  createRouteAction('images/$关闭1_0_0.8_800_400_1020_600.png'),
  createRouteAction('images/$关闭2_0_0.8_800_400_1020_600.png'),
  createRouteAction('images/重新连接_1_0.9_635_1460_847_1513.png'),
]

export function tryCloseModals(): boolean {
  for (var i = 0; i < closeButtons.length; i++) {
    if (closeButtons[i]()) return true
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