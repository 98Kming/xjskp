export const width = 1080
export const height = width / device.width * device.height
console.log('屏幕宽高:', width, height, '设备宽高:', device.width, device.height, files.cwd())
import { imageBasePath } from '../config'
import { sharedImages } from '../images'
let last_capture_time = 0
let cache_screen_img: ImageWrapper | null = null
var pointCache = new java.util.HashMap()
var regionCache = new java.util.HashMap()
// 模板缓存 LRU:数组头部最久未用、尾部最近使用,超上限淘汰并 recycle,防止 Dalvik 堆被模板 Bitmap 撑满
var templateCache: { key: string; img: ImageWrapper }[] = []
var TEMPLATE_CACHE_MAX = 120
export let recycleImgs: ImageWrapper[] = []


/** 两矩形重叠面积占较小矩形面积的比例，无重叠返回 0 */
function rectOverlapRatio(a: Rect | null, b: Rect | null): number {
  if (!a || !b) return 0
  var overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  var overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  if (overlapW <= 0 || overlapH <= 0) return 0
  var overlap = overlapW * overlapH
  var minArea = Math.min((a.right - a.left) * (a.bottom - a.top), (b.right - b.left) * (b.bottom - b.top))
  return minArea > 0 ? overlap / minArea : 0
}

/**
 * 递归去掉重复区域大于 50% 且内容被包含的节点，返回去重后的新树（纯 JS 对象）：
 * 先清理子节点内部，再过滤与父节点冗余的子节点（子文本被父包含），
 * 最后子节点两两去重（文本互相包含时保留索引小者，相同文本也只留一个）。
 * 空文本节点不参与去重（父节点可能仅作分组，bounds 为 null 时直接跳过）。
 * children 可能是 Java 数组/列表（无 map/forEach 方法），用 length/size 索引遍历。
 */
function removeOcrRedundant(node: OcrResult): OcrResult {
  var children: OcrResult[] = []
  var rawChildren: any = node.children
  if (rawChildren) {
    var len = rawChildren.length != null ? rawChildren.length : rawChildren.size()
    for (var i = 0; i < len; i++) {
      var child: OcrResult = rawChildren[i] != null ? rawChildren[i] : rawChildren.get(i)
      children.push(removeOcrRedundant(child))
    }
  }
  // 子节点与父节点冗余：子文本被父文本包含且重叠 >50% → 去掉子
  var filtered: OcrResult[] = []
  for (var i = 0; i < children.length; i++) {
    var child = children[i]
    if (child.text && node.text && node.text.includes(child.text) && rectOverlapRatio(node.bounds, child.bounds) > 0.5) {
      continue
    }
    filtered.push(child)
  }
  // 子节点两两去重：重叠 >50% 且文本互相包含（相同文本保索引小者）→ 去掉被包含者
  var keep: OcrResult[] = []
  for (var i = 0; i < filtered.length; i++) {
    var redundant = false
    for (var j = 0; j < filtered.length; j++) {
      if (i === j || redundant) continue
      if (rectOverlapRatio(filtered[i].bounds, filtered[j].bounds) > 0.5 && filtered[i].text && filtered[j].text &&
        (filtered[j].text === filtered[i].text ? i > j : filtered[j].text.includes(filtered[i].text))) {
        redundant = true
      }
    }
    if (!redundant) keep.push(filtered[i])
  }
  return {
    level: node.level,
    confidence: node.confidence,
    text: node.text,
    language: node.language,
    bounds: node.bounds,
    children: keep
  }
}

/**
 * 区域 OCR：裁剪指定区域识别，返回 OcrResult（含 bounds 树）。
 * 区域越界自动 clamp 到图片范围内（images.clip 越界抛异常）；裁剪图用后 recycle 防泄漏。
 */
export function ocrRegion(img: ImageWrapper, x: number = 0, y: number = 0, w: number = img.getWidth(), h: number = img.getHeight()): OcrResult | null {
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + w > img.getWidth()) w = img.getWidth() - x
  if (y + h > img.getHeight()) h = img.getHeight() - y
  if (w <= 0 || h <= 0) return null
  var c = images.clip(img, x, y, w, h)
  if (c) {
    try {
      let result = gmlkit.ocr(c, 'zh')
      // 结果处理，识别结果重复区域大于50%且内容被包含，则去掉重复区域，避免父子层级冗余
      return removeOcrRedundant(result)
    } finally {
      c.recycle()
    }
  }
  return null
}

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
  // 线性查找(模板数量有上限,字符串比较开销可忽略)
  for (var i = 0; i < templateCache.length; i++) {
    // 防御:threads 并发时 splice/shift 可能让数组出现空洞(与 main.ts start 互斥双保险)
    if (templateCache[i] == null) continue
    if (templateCache[i].key === filePath) {
      var hit = templateCache[i]
      // 移到末尾表示最近使用
      if (i !== templateCache.length - 1) {
        templateCache.splice(i, 1)
        templateCache.push(hit)
      }
      return hit.img
    }
  }
  // 仅在 CWD 就是 imageBasePath 目录时才不拼接
  // let cwd = files.cwd().replace(/\/+$/, '')
  // let base = imageBasePath.replace(/\/+$/, '')
  // let path = cwd === base || cwd.endsWith('/' + base) ? filePath : imageBasePath + filePath
  var template = images.read(filePath)
  if (template == null) {
    template = images.read(imageBasePath + filePath)
    if (template == null) {
      throw new Error(`模板图片不存在: ${files.cwd()}${filePath}`)
    }
  }
  templateCache.push({ key: filePath, img: template })
  // 超出上限淘汰最久未用(头部)。
  // 注意:不 recycle 淘汰项——createPageDetector/createRouteAction 闭包和
  // 兑换码静态字段长期持有模板引用,recycle 会导致 use-after-recycle;
  // 无引用的模板由 GC 回收即可
  if (templateCache.length > TEMPLATE_CACHE_MAX) {
    templateCache.shift()
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
    // 只保留最近 50 张的引用,防数组无限增长(图片已 recycle,引用丢弃即可被 GC)
    if (recycleImgs.length > 50) {
      recycleImgs.splice(0, recycleImgs.length - 50)
    }
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
    // AutoJs6 文档「images.resize」：第二个参数为目标尺寸 [w, h]
    // （images.scale 的 fx/fy 是缩放倍率而非目标尺寸，传 1080/2376 会把原图放大 1080×2376 倍直接 OOM）
    img = images.resize(img, [width, height])
    // AutoX.js：缩放生成的图 bitmap 是惰性的，images.pixel 读 y>=1400 区域抛 NPE
    // （"Attempt to read from null array"），getBitmap() 强制实体化后 pixel 正常
    img.getBitmap()
  }
  cache_screen_img = img
  return img
}

/** 等待距上次截图至少 interval 后强制截新图。
 *  screen() 默认 500ms 缓存窗口会返回旧帧，等画面稳定后再看、或页面刚操作过要看新画面的场景用它 */
export function waitScreen(interval: number = 500): ImageWrapper {
  var elapsed = Date.now() - last_capture_time
  var remain = interval - elapsed
  if (remain > 0) {
    sleep(remain)
  }
  return screen(0)
}
interface ImgP {
  filePath: string,
  point1: number[],
  point2: OpenCV.Point,
}
export const imgMap = new Map<string, ImgP>()
function a(filePath: string, point: OpenCV.Point) {
  // 从完整路径中提取文件名
  const baseName = filePath.split('/').pop()!.replace(/\.[^.]+$/, '')
  // 优先匹配完整 6 段后缀: _cache_threshold_x1_y1_x2_y2
  const fullRegex = /_([01])_([01](?:\.\d+)?)_([^_]+)_([^_]+)_([^_]+)_([^_]+)$/
  const fullMatch = baseName.match(fullRegex)
  if (fullMatch) {
    const [, cacheStr, thresholdStr, x1Str, y1Str, x2Str, y2Str] = fullMatch
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
    // let img = getTemplate(filePath)
    // log(y2-y1-img.getHeight(),y2,y1,img.getHeight())
    //if(Math.abs(y2-y1-img.getHeight()) < 20) {
      imgMap.set(filePath, { filePath, point1: [x1, y1], point2: point })
    //}
  }
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
var refHeight = 2400

/**
 * 搜索区域扩展。
 * 基准 refHeight=2400：重裁图片均按 2400 屏高裁剪。
 * - 低屏(如 1920)：假设 UI 顶部对齐(底部为导航栏/状态栏差异)，内容整体上移 (2400-height)px
 * - 高屏(>2400)：假设底部对齐，向下扩展 (height-2400)px
 * 若游戏实际按等比缩放布局，此固定偏移模型会错位，需改为乘法换算。
 */
function expandRegion(x1: number, y1: number, x2: number, y2: number): [number, number, number, number] {
  x1 = Math.max(x1 - 5, 0)
  x2 = Math.min(x2 + 5, width)
  let h = y2 - y1
  if (height > refHeight) {
    y2 = Math.min(y2 + height - refHeight, height)
  } else if (height < refHeight) {
    y1 = Math.max(y1 - refHeight + height, 0)
    y2 = Math.min(y2, height)
  }
  y1 = Math.max(y1 - 5, 0)
  y2 = Math.min(y2 + 5, height)
  if(y2 - y1 < h) {
   if(y1 > 0) {
     y1 = Math.max(y1 - h, 0)
   } else {
     y2 = Math.min(y2 + h, height)
   }
  }
  return [x1, y1, x2, y2]
}

/**
 * 1080 系坐标 → 物理屏幕坐标。
 * 找图在缩放后的 1080x2376 图上进行，点击必须映射回设备实际分辨率
 * （如 1440x3168），否则点击位置偏移。1080 宽设备上恒等映射，无影响。
 */
export function toScreenX(x: number): number {
  return Math.round(x * device.width / width)
}
export function toScreenY(y: number): number {
  return Math.round(y * device.height / height)
}

export interface PageDetector {
  (img: ImageWrapper): boolean
  detectImagePath: string
}

export function imageDetector(filePath: string, img?: ImageWrapper): OpenCV.Point | null {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  img || (img = screen())
  // 搜索区域放大到不小于模板尺寸：模板比区域大时 matchTemplate 结果尺寸为负，
  // OpenCV 抛 "(-215:Assertion failed) s >= 0 function 'setSize'" 直接崩掉整个脚本
  var rw = Math.max(parsed.x2 - parsed.x1, template.width)
  var rh = Math.max(parsed.y2 - parsed.y1, template.height)
  if (parsed.x1 + rw > img.width || parsed.y1 + rh > img.height) {
    throw new Error('搜索区域小于模板尺寸，请检查' + filePath)
  }
  let point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
  if (point) {
    a(filePath, point)
  }
  return point
}

export function createPageDetector(filePath: string, skipLuminance?: boolean): PageDetector {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1

  /**
   * 模板亮度一致性检查：模板与匹配点亮度差 <50% 才接受。
   * AutoX.js 对 images.resize 后的截图在 y>=1500 区域调 pixel 会抛 NPE
   * （"Attempt to read from null array"），此时跳过检查直接接受匹配，
   * findImageInRegion 的阈值匹配已足够可靠，亮度检查只是防黑屏误匹配的附加防护。
   */
  function luminanceOk(template: ImageWrapper, img: ImageWrapper, point: OpenCV.Point, filePath: string): boolean {
    try {
      var tplPixel = images.pixel(template, 0, 0)
      var scrPixel = images.pixel(img, point.x, point.y)
      var lum1 = colors.luminance(tplPixel)
      var lum2 = colors.luminance(scrPixel)
      if (lum2 === 0) return false
      var percentDiff = (Math.abs(lum2 - lum1) / lum2) * 100
      if (percentDiff < 50) {
        return true
      }
      return false
    } catch (e) {
      // resize 截图像素读取失败 → 跳过亮度检查
      return true
    }
  }

  var fn = function (img: ImageWrapper): boolean {
    var cached = regionCache.get(filePath)
    if (cached) {
      var point = images.findImageInRegion(img, template, cached.x1, cached.y1, cached.x2 - cached.x1, cached.y2 - cached.y1, parsed.threshold)
      if (point) {
        return skipLuminance || luminanceOk(template, img, point, filePath)
      }
      // 缓存区域找不到 → 暂时被遮挡或页面过渡，保留缓存下次重试
      return false
    }
    // 无缓存 → 全量搜索
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    if (skipLuminance || luminanceOk(template, img, point, filePath)) {
      a(filePath, point)
      return true
    }
    return false
  } as PageDetector
  fn.detectImagePath = filePath
  return fn
}

export function createRouteAction(filePath: string): (img?: ImageWrapper) => boolean {
  var parsed = imageNameParser(filePath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  var template = getTemplate(filePath)

  // cache=1: 带区域缓存，首次匹配后缩小搜索范围（避免盲点，兼顾速度）
  if (parsed.cache === 1) {
    return function (img?: ImageWrapper): boolean {
      var cached = regionCache.get(filePath)
      if (cached) {
        img || (img = screen())
        
        var point = images.findImageInRegion(img, template, cached.x1, cached.y1, cached.x2 - cached.x1, cached.y2 - cached.y1, parsed.threshold)
        if (point) {
          click(toScreenX(point.x + template.width / 2), toScreenY(point.y + template.height / 2))
          a(filePath, point)
          return true
        }
        // 缓存区域找不到 → 暂时被遮挡或页面过渡，保留缓存下次重试
        return false
      }
      img || (img = screen())
      var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
      //log('尝试匹配模板:', filePath, `[${parsed.x1},${parsed.y1}-${parsed.x2},${parsed.y2}]`, point ? `结果: 找到坐标(${point.x}, ${point.y})` : '结果: 未找到')
      if (!point) return false
      var cx = toScreenX(point.x + template.width / 2)
      var cy = toScreenY(point.y + template.height / 2)
      regionCache.put(filePath, {
        x1: Math.max(point.x - 5, 0),
        y1: Math.max(point.y - 5, 0),
        x2: Math.min(point.x + template.width + 5, width),
        y2: Math.min(point.y + template.height + 5, height)
      })
      click(cx, cy)
      a(filePath, point)
      return true
    }
  }

  // cache=0: 每次重新截图匹配
  return function (img?: ImageWrapper): boolean {
    img || (img = screen())
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    click(toScreenX(point.x + template.width / 2), toScreenY(point.y + template.height / 2))
    a(filePath, point)
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
    // var searchH = height - searchY
    // if (searchH <= 0) return false

    // 在标识下方区域找目标按钮，取最上方的一个
    let targetPoint = findImageMinYPoint(targetPath, searchY, img)
    if(!targetPoint) return false
    click(toScreenX(targetPoint.x + targetTemplate.width / 2), toScreenY(targetPoint.y + targetTemplate.height / 2))
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
      var cx = toScreenX(width - point.x - template.width / 2)
      var cy = toScreenY(point.y + template.height / 2)
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
    var cx = toScreenX(width - point.x)
    var cy = toScreenY(point.y + template.height / 2)
    log('镜像点击:', filePath, `坐标(${cx}, ${cy})`)
    click(cx, cy)
    return true
  }
}

/**
 * 入场券镜像点击（含已售罄检测）：
 * 找入场券图片，若找到则在入场券右侧区域查找已售罄，
 * 已售罄则返回 false（跳过），否则执行镜像坐标点击。
 * ticketPath 按标准图片命名解析；soldOutPath 走 getTemplate（先直读，失败再拼 imageBasePath）。
 */
export function createTicketAction(ticketPath: string, soldOutPath: string): () => boolean {
  var parsed = imageNameParser(ticketPath)
  var template = getTemplate(ticketPath)
  var rw = parsed.x2 - parsed.x1
  var rh = parsed.y2 - parsed.y1
  var soldOutTemplate = getTemplate(soldOutPath)

  return function (): boolean {
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false

    // 入场券右侧查找已售罄（soldOutTemplate 可能为 null，跳过检测）
    if (soldOutTemplate) {
      var checkX = point.x + template.width
      var checkW = width - checkX
      var soldOutPoint = images.findImageInRegion(img, soldOutTemplate, checkX, point.y, checkW, template.height, 0.9)
      if (soldOutPoint) {
        log('[入场券] 已售罄，跳过:', ticketPath)
        return false
      }
    }

    var cx = toScreenX(width - point.x - template.width / 2)
    var cy = toScreenY(point.y + template.height / 2)
    log('镜像点击:', ticketPath, `坐标(${cx}, ${cy})`)
    click(cx, cy)
    return true
  }
}

var closeButtons: (() => boolean)[] = [
  createRouteAction(sharedImages.重新连接),
  createRouteAction(sharedImages.跳过),
  createRouteAction(sharedImages.关闭1),
  createRouteAction(sharedImages.确定),
  createRouteAction(sharedImages.前往),
]
const colors_关闭_无框_多点: [number, number, string][] = [[4, 13, "#fde6bc"], [6, 21, "#fce4bb"], [13, 42, "#fadda4"], [16, 48, "#fdd59d"], [-1, 24, "#fbe3ba"], [14, 22, "#fce4bb"], [21, 18, "#ffebc4"], [29, 15, "#fff8d8"], [0, 2, "#fee6bc"], [4, 7, "#fde5bb"], [2, 19, "#fde9c4"], [10, 24, "#fce4bb"], [15, 47, "#f3cb93"], [-15, 29, "#fee9c4"], [12, 23, "#fce4bb"]]
const colors_关闭_无框_多点_exclude: [number, number, string][] = [[-8, 14, "#1b1209"], [0, 43, "#1b110a"], [26, 35, "#191009"], [14, 11, "#1b1108"]]
const colors_关闭_无框 = "#fff8d3"
const colors_关闭_无框2_多点: [number, number, string][] = [[4, 5, "#ebdab8"], [10, 11, "#ebdab9"], [17, 17, "#ebdab8"], [30, 26, "#eed4a9"], [32, 29, "#f1d5a4"], [-1, 31, "#ead9b9"], [2, 26, "#ebdab8"], [9, 21, "#ebdab8"], [17, 13, "#ebdab8"], [31, -4, "#f8ead1"], [25, 3, "#eddcbc"]]
const colors_关闭_无框2_多点_exclude: [number, number, string][] = [[12, -6, "#0d0a07"], [36, 12, "#201b11"], [17, 35, "#13110c"], [15, 40, "#110c07"], [38, 17, "#090704"]]
const colors_关闭_无框2 = "#ebdab8"

export function tryCloseModals(): boolean {
  // 优先：图片模板匹配（重新连接、确定等已知弹窗），
  // 放在多点找色之前，避免弹窗下层按钮被误点
  for (var k = 0; k < closeButtons.length; k++) {
    if (closeButtons[k]()) return true
  }

  // 降级：多点找色检测无框关闭按钮（可能在弹窗下层，但无模板匹配时值得一试）
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
      click(toScreenX(point.x), toScreenY(point.y + 30))
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
      click(toScreenX(point.x), toScreenY(point.y + 30))
      return true
    }
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


export function findImageMinYPoint(filePath: string, startY: number = -1, img?: ImageWrapper) {
  var parsed = imageNameParser(filePath)
  var template = getTemplate(filePath)
  img || (img = screen())
  // 在标识下方区域找目标按钮，取最上方的一个
  if(startY === -1) {
    startY = parsed.y1
  }
  let imgHeight = Math.max(parsed.y2 - startY, template.getHeight())
  if(imgHeight + startY > height) {
    return null;
  }
  return images.matchTemplate(img, template, {
    region: [parsed.x1, startY, parsed.x2 - parsed.x1, imgHeight],
    threshold: parsed.threshold,
    max: 20
  }).topmost()?.point
}

function uniqueDescMatches(matches: org.autojs.autojs.core.image.TemplateMatching.Match[]) {
  const seen = new Set<string>();
  return matches.filter(match => {
    const key = match.point.y + "";
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).sort((a, b) => b.point.y - a.point.y);
}

const img_组队邀请_邀请 = imageNameParser("images/组队邀请-好友$$邀请好友_0_0.9_690_665_946_1700.png")
const img_组队邀请_接受 = imageNameParser(sharedImages.接受)
export function find_队友(isLeader: boolean) {
  let temps: Teammate[] = []
  let x
  while (true) {
    let img = screen(0)
    let template = getTemplate(isLeader ? img_组队邀请_邀请.rawFileName : img_组队邀请_接受.rawFileName)
    let result = images.matchTemplate(img, template,
      { threshold: img_组队邀请_邀请.threshold, region: [img_组队邀请_邀请.x1, img_组队邀请_邀请.y1, img_组队邀请_邀请.x2 - img_组队邀请_邀请.x1, img_组队邀请_邀请.y2 - img_组队邀请_邀请.y1] })
    let size = temps.length
    let matches = uniqueDescMatches(result.matches)
    log(matches)
    let arr: Teammate[] = []
    for (let match of matches) {
      let temp
      x = 300
      temp = images.clip(img, x, match.point.y, 390, template.getHeight() / 2)
      let exists
      for (let it of temps) {
        if (images.findImage(it.img, temp, { threshold: 0.9 })) {
          temp.recycle()
          exists = true
          break
        }
      }
      if (exists) {
        break
      }
      arr.push({ img: temp, name: ocrRegion(temp)?.text || "" })
    }
    for (let i = arr.length - 1; i >= 0; i--) {
      temps.push(arr[i])
    }
    if (size == temps.length || temps.length < 5) {
      break
    }
    gesture(300, [width * 0.3, height * 0.7], [width * 0.4, height * 0.3])
    sleep(100)
    gesture(100, [width * 0.3, height * 0.7], [width * 0.7, height * 0.7])
    sleep(700)
  }
  return temps
}

export function select_队友(teammate: Teammate): OpenCV.Point | null {
  // 最多滑动 5 次,找不到返回 null(防队友不在列表时无限滑动卡死)
  for (var i = 0; i < 5; i++) {
    let img = screen()
    let point = images.findImageInRegion(img, teammate.img,
      0, height * 0.1, width, height * 0.8, 0.9)
    if (point) {
      point.x = width - point.x
      point.y += 50
      return point
    }
    gesture(300, [width * 0.3, height * 0.7], [width * 0.4, height * 0.3])
    sleep(200)
    gesture(100, [width * 0.3, height * 0.7], [width * 0.7, height * 0.7])
    sleep(700)
  }
  return null
}

export function waitObtain(timeout: number, interval: number = 1000): boolean {
  var beginTime = Date.now()
  while (true) {
    let now = Date.now()
    if (now < timeout + beginTime) {
      sleep(interval)
    }
    var point = imageDetector(sharedImages.恭喜获得, screen(0))
    if (point) {
      log('[waitObtain] 恭喜获得出现，领取成功')
      click(toScreenX(point.x), toScreenY(point.y + 100))
      sleep(200)
      click(device.width / 2, device.height - 10)
      return true
    }
    if (now >= timeout + beginTime) {
      return false
    }
  }
}