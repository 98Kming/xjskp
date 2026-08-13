import { BasePage, Route } from './BasePage'
import { createRouteAction, ocrRegion, screen, toScreenX, toScreenY, width, height, imageDetector } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from './战斗中'

// 词条查找方案（用户实测特征）：
// 技能词条位于"选择技能"标题图下方，词条组居中对齐（多词条时两边对称），
// 词条周围（弹窗暗色遮罩）明度 < 0.03，词条卡片本身明亮 → 用明度扫描定位卡片
var 暗阈值 = 0.03
// 词条顶部确认：从标题下方第一个暗点往下找第一个亮点行，该行横向连续 100 个亮点
var 顶部连续亮点 = 100
// 词条底部确认：从顶部往下找第一个暗点，纵向连续 10 个暗点（卡片内短暗纹凑不满 10 个）
var 底部连续暗点 = 10
var 最大重试 = 5

/**
 * OCR 块按 x 范围嵌套：B 的 x 区间完全落在 A 内（至少一边严格）→ B 进 A.children，
 * 取 x 区间最紧（面积最小）的包含者为直接父。卡片描述块（宽）包住标题块（窄）。
 * 复制节点构建新树，不修改原 OCR 结果；同级按 y 排序，多卡时输出顺序稳定。
 */
function 嵌套OCR块(nodes: OcrResult[]): OcrResult[] {
  var 副本: any[] = []
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i]
    副本.push({
      level: n.level, confidence: n.confidence, text: n.text,
      language: n.language, bounds: n.bounds, children: []
    })
  }
  var 父: (any | null)[] = []
  for (var i = 0; i < nodes.length; i++) {
    var b = nodes[i].bounds
    var 直接父: any = null
    var 最紧 = Infinity
    for (var j = 0; j < nodes.length; j++) {
      if (i === j) continue
      var a = nodes[j].bounds
      if (!a || !b) continue
      if (a.left <= b.left && b.right <= a.right && (a.left < b.left || b.right < a.right)) {
        var 面积 = (a.right - a.left) * (a.bottom - a.top)
        if (面积 < 最紧) {
          直接父 = 副本[j]
          最紧 = 面积
        }
      }
    }
    父[i] = 直接父
  }
  var 根: any[] = []
  for (var k = 0; k < nodes.length; k++) {
    if (父[k] === null) {
      根.push(副本[k])
    } else {
      父[k].children.push(副本[k])
    }
  }
  // 同级按 y 排序（bounds 为 null 排最前）；副本节点可能有多级嵌套，递归排
  var 按y = function (p: any, q: any): number {
    return (p.bounds ? p.bounds.top : -1) - (q.bounds ? q.bounds.top : -1)
  }
  var 排树 = function (list: any[]): void {
    list.sort(按y)
    for (var s = 0; s < list.length; s++) {
      排树(list[s].children)
    }
  }
  排树(根)
  return 根
}

/** 递归打印嵌套后的 OCR 块，子块缩进两格展示层级 */
function 打印OCR嵌套(nodes: OcrResult[], 缩进: string): void {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i]
    log('[选择技能] OCR识别：' + 缩进 + node.text + '，bounds' + JSON.stringify(node.bounds))
    if (node.children && node.children.length > 0) {
      打印OCR嵌套(node.children, 缩进 + '  ')
    }
  }
}

/** 明度 <= 暗阈值 → 暗点（弹窗遮罩）；img.pixel 实例方法比 images.pixel 快 ~1.2x */
function 暗点(img: ImageWrapper, x: number, y: number): boolean {
  return colors.luminance(img.pixel(x, y)) <= 暗阈值
}

/** y 行最长的亮段（步长 4），宽度 >= 最小宽 才返回；用于确认词条顶部并定扫描列 */
function 行最长亮段(img: ImageWrapper, y: number, 最小宽: number): { x1: number; x2: number } | null {
  var 最长: { x1: number; x2: number } | null = null
  var xi = 0
  while (xi < width) {
    if (!暗点(img, xi, y)) {
      var x1 = xi
      while (xi < width && !暗点(img, xi, y)) {
        xi += 4
      }
      if (xi - x1 >= 最小宽 && (!最长 || xi - x1 > 最长.x2 - 最长.x1)) {
        最长 = { x1: x1, x2: xi }
      }
    } else {
      xi += 4
    }
  }
  return 最长
}

/** y 行亮段总宽（步长 2）：卡片区行总宽接近屏宽，遮罩暗行总宽接近 0，用于底部横向验证 */
function 行亮段总宽(img: ImageWrapper, y: number): number {
  var 总宽 = 0
  var xi = 0
  while (xi < width) {
    if (!暗点(img, xi, y)) {
      var x1 = xi
      while (xi < width && !暗点(img, xi, y)) {
        xi += 2
      }
      总宽 += xi - x1
    } else {
      xi += 2
    }
  }
  return 总宽
}

// type 卡片 = { 名: string; 文: string; 点: [number, number] }
// type 评分卡 = { 序号: number; 点: [number, number]; 权重: number; 规则: RegExp | null; 已选?: boolean }
// type 段 = { x1: number; x2: number }
// type 扫描行 = { y: number; 段: 段[] }
// type 词条块 = { y1: number; y2: number; 行: 扫描行[] }
// type 扫描结果 = {
//   段: 段[]
//   词条块: 词条块
//   卡高: number[]
// }

export class 选择技能 extends BasePage {
  name = '选择技能'
  选择技能_point!: OpenCV.Point
  is(img?: ImageWrapper) {
    // 必须传入外部 img：自行截图会回收 cache_screen_img（若传入图正是缓存图），
    // 导致 detectCurrentPage 后续页面 is() 全部使用已回收的死图
    let point = imageDetector('images/选择技能_0_0.8_438_729_645_1143.png', img)
    if (point) {
      this.选择技能_point = point
    }
    return !!point
  }

  /**
   * 找词条顶部：沿标题起点列（标题左上角 x，4 卡布局下实测落在卡2内，避开了中间缝隙）
   * 纵向找第一个暗点（遮罩暗区），再往下找第一个亮点行（该行横向存在 ≥100px 亮段即词条顶部，
   * 卡片顶是一整条亮线）。不用标题中心列：4 卡布局下中心列必然落在卡片缝隙
   * （中间缝 = 屏幕中心 = 标题中心）。返回顶部 y，未找到返回 -1。
   */
  private 找词组顶部(img: ImageWrapper): number {
    var x = this.选择技能_point.x
    var y = this.选择技能_point.y + 50
    while (y < height && !暗点(img, x, y)) {
      y += 2
    }
    // 从暗点往下找第一个亮点行：该行横向存在 ≥100px 亮段 → 词条顶部
    while (y < height) {
      y += 2
      if (暗点(img, x, y)) continue // 还是暗区，继续找亮点
      if (行最长亮段(img, y, 顶部连续亮点)) return y
    }
    return -1
  }

  /**
   * 找词条底部：沿扫描列从顶部往下找第一个暗段（纵向连续 10 个暗点），
   * 并横向验证该行亮段总宽骤降（< 30% 屏宽）——单列暗区可能是卡片内的暗色元素
   * （图标/文字），整行变暗才是卡片区真正结束。返回底部 y，未找到返回 -1。
   */
  private 找词组底部(img: ImageWrapper, top: number): number {
    var x = this.选择技能_point.x
    var ey = top
    while (ey < height) {
      ey += 2
      if (!暗点(img, x, ey)) continue // 还在卡片内，继续找暗点
      var 暗起点 = ey
      var 连续暗 = 0
      while (ey < height && 暗点(img, x, ey)) {
        连续暗++
        ey += 2
      }
      if (连续暗 >= 底部连续暗点 && 行亮段总宽(img, 暗起点) < width * 0.3) {
        return 暗起点 // 单列暗段 + 整行变暗 → 确认词条底部
      }
      // 卡内局部暗区（横向其他卡仍亮），继续往下找
    }
    return -1
  }

  /**
   * (0-width,y) 从左到右扫描亮段，返回最左亮点 x，未找到返回 -1。
   */
  private 找词组左边(img: ImageWrapper, y: number): number {
    if (y < 0 || y >= height) return -1 // 顶部/底部识别失败时 y 可能是负数，防越界采样
    var x = 0
    while (x < width && 暗点(img, x, y)) {
      x += 2
    }
    return x < width ? x : -1
  }

  /**
   * (0-width,y) 从右到左扫描亮段，返回最右亮点 x，未找到返回 -1。
   */
  private 找词组右边(img: ImageWrapper, y: number): number {
    if (y < 0 || y >= height) return -1 // 顶部/底部识别失败时 y 可能是负数，防越界采样
    var x = width - 1
    while (x >= 0 && 暗点(img, x, y)) {
      x -= 2
    }
    return x >= 0 ? x : -1
  }

  /**
   * 用于切分词条组，分成卡片
   * 从[left + 100, top + 10]开始左到右找到暗段
   * 找到暗段后从上到下找，如果暗段占80%则找到一个间隔
   * 从这个间隔开始左到右找到亮段，如果亮段 > 100 则重复上面步骤
   */
  private 找词组间隔(img: ImageWrapper, left: number, right: number, top: number, bottom: number): number[] {
    var 间隔: number[] = []
    var x = left + 100
    var 扫描y = top + 10 // 卡片顶边亮线下沿，避开顶边亮线本身的宽度影响
    while (x < right - 100) {
      // 跳过暗区找亮段起点
      while (x < right && 暗点(img, x, 扫描y)) x++
      if (x >= right) break
      var 亮起点 = x
      // 亮段终点 = 暗段起点
      while (x < right && !暗点(img, x, 扫描y)) x++
      if (x - 亮起点 < 100) continue // 亮段 < 100 视为碎块（文字笔画/装饰），继续找下一个亮段
      if (x >= right) break
      // 暗段列纵向验证：暗点占比 >= 80% → 卡片缝隙（贯穿卡片全高的暗柱）
      var 暗数 = 0
      var 总 = 0
      for (var y = top; y <= bottom; y += 2) {
        总++
        if (暗点(img, x, y)) 暗数++
      }
      if (总 > 0 && 暗数 / 总 >= 0.8) 间隔.push(x)
    }
    return 间隔
  }

  selectSkill(img: ImageWrapper, identifySkill: boolean = true): boolean {
    let sure_point = imageDetector('images/选择技能$$确定_0_0.9_531_1611_628_1656.png')
    let skillPoints = this.entryPoints(img, identifySkill)
    if (skillPoints.length == 0) {
      return false
    }
    let count = sure_point ? 2 : 1
    let str = "\n"
    for (let i = 0; i < skillPoints.length; i++) {
      let point = skillPoints[i]
      if (i < count) {
        click(point.x, point.y)
        if (sure_point) {
          click(sure_point.x + 200, sure_point.y + 10)
        }
      }
      str += `[${point.name} ${point.weight} ${point.match}]\n`
    }
    log(str)
    return true
  }

  entryPoints(img: ImageWrapper, identifySkill: boolean): SkillPoint[] {
    let top = this.找词组顶部(img)
    let bottom = this.找词组底部(img, top)
    let left = this.找词组左边(img, (top + bottom) / 2)
    let right = this.找词组右边(img, (top + bottom) / 2)
    // 两边的亮段宽度差 > 10px → 认为两边不对称，词组不完整
    // 左边空隙宽 = left（最左亮点 x），右边空隙宽 = width - right（最右亮点 x）
    log(`[选择技能] 词条组范围：top=${top} bottom=${bottom} left=${left} right=${right}`)
    if (Math.abs(left - (width - right)) > left) {
      return []
    }
    let skillPoints: SkillPoint[] = []
    if (identifySkill) {
      let gaps = this.找词组间隔(img, left, right, top, bottom)
      log(gaps)
      gaps.push(right)
      for (let i = 0; i < gaps.length; i++) {
        let ocrResult = ocrRegion(img, left, top, gaps[i] - left, bottom - top)
        if(ocrResult?.children) {
          let name = ocrResult?.children?.map(node => node.text.replace(/\n/g, "")).join(' ')
          let strategy = skillStrategy.weight(name)
          skillPoints.push({
            x: left + 100,
            y: top  + 100,
            name: name,
            weight: strategy.weight,
            match: strategy.match.source
          })
        }
        left = gaps[i]
      }
      return skillPoints.sort((a, b) => b.weight! - a.weight!)
    }
    return [{ x: left + 50, y: top + 50 }]
  }


  // /**
  //  * 列直方图（每 x 列累计亮采样数）→ 阈值分段得到每张卡片的 x 范围：
  //  * 卡片列亮计数高、缝隙列接近 0，用阈值分段（单行分段会被卡片内暗区切碎，直方图不受影响）。
  //  * 无亮段返回 null。
  //  */
  // private 列直方图分段(词条块: 词条块): 段[] | null {
  //   var 直方图: number[] = []
  //   for (var i = 0; i < width; i++) 直方图[i] = 0
  //   for (var r = 0; r < 词条块.行.length; r++) {
  //     var 行段s = 词条块.行[r].段
  //     for (var s = 0; s < 行段s.length; s++) {
  //       for (var cx = 行段s[s].x1; cx < 行段s[s].x2; cx += 2) 直方图[cx]++
  //     }
  //   }
  //   var 峰值 = 0
  //   for (var i = 0; i < width; i++) {
  //     if (直方图[i] > 峰值) 峰值 = 直方图[i]
  //   }
  //   if (峰值 <= 0) return null
  //   var 段阈值 = 峰值 * 0.4 // 卡片列亮计数高、缝隙列接近 0
  //   var 段: 段[] = []
  //   var xi = 0
  //   while (xi < width) {
  //     if (直方图[xi] > 段阈值) {
  //       var c1 = xi
  //       while (xi < width && 直方图[xi] > 段阈值) {
  //         xi += 2
  //       }
  //       段.push({ x1: c1, x2: xi })
  //     } else {
  //       xi += 2
  //     }
  //   }
  //   return 段
  // }

  // /**
  //  * 顶部行边界修正：卡片缝隙仅 1-2px 且逐行漂移（缝隙列直方图计数 66~79 波动），
  //  * 固定阈值切不开；顶部行（卡片顶边）缝隙最清晰，用其亮段边界切分直方图合并段。
  //  */
  // private 顶部行修正(段: 段[], 词条块: 词条块): 段[] {
  //   var 顶部段s = 词条块.行.length > 0 ? 词条块.行[0].段 : []
  //   if (顶部段s.length <= 1) return 段
  //   var 修正段: 段[] = []
  //   for (var k = 0; k < 段.length; k++) {
  //     var 直方段 = 段[k]
  //     var 切点: number[] = []
  //     for (var t = 0; t < 顶部段s.length; t++) {
  //       if (顶部段s[t].x1 > 直方段.x1 + 40 && 顶部段s[t].x1 < 直方段.x2 - 40) {
  //         切点.push(顶部段s[t].x1) // 直方图段内部的卡片左边界 → 切分点
  //       }
  //     }
  //     if (切点.length === 0) {
  //       修正段.push(直方段)
  //     } else {
  //       var 起点 = 直方段.x1
  //       for (var c = 0; c < 切点.length; c++) {
  //         修正段.push({ x1: 起点, x2: 切点[c] })
  //         起点 = 切点[c]
  //       }
  //       修正段.push({ x1: 起点, x2: 直方段.x2 })
  //     }
  //   }
  //   return 修正段
  // }

  // /** 每张卡的高度 = 其 x 范围内最上/最下亮行之差（供加载完成校验） */
  // private 卡高度(词条块: 词条块, 段: 段[]): number[] {
  //   var 卡高: number[] = []
  //   for (var k = 0; k < 段.length; k++) {
  //     var 上 = 词条块.y2
  //     var 下 = 词条块.y1
  //     for (var r = 0; r < 词条块.行.length; r++) {
  //       var 行段s = 词条块.行[r].段
  //       for (var s = 0; s < 行段s.length; s++) {
  //         if (行段s[s].x2 >= 段[k].x1 && 行段s[s].x1 <= 段[k].x2) {
  //           if (词条块.行[r].y < 上) 上 = 词条块.行[r].y
  //           if (词条块.行[r].y > 下) 下 = 词条块.行[r].y
  //         }
  //       }
  //     }
  //     卡高.push(下 - 上)
  //   }
  //   return 卡高
  // }

  // /**
  //  * 扫描标题下方区域，按明度定位词条卡片（卡片在标题下方，周围明度 < 0.03）：
  //  * 1. 找词条顶部/底部（见 找词条顶部/找词条底部），构成词条块
  //  * 2. 词条块内逐行扫描亮段成行数据，再做列直方图分段得到每张卡片的 x 范围
  //  * 3. 顶部行边界修正切分直方图合并段
  //  * 4. 每张卡的高度 = 其 x 范围内最上/最下亮行之差（供加载完成校验）
  //  */
  // private 扫描词条(img: ImageWrapper): 扫描结果 | null {
  //   var 开始 = Date.now()

  //   // 标题锚点由 is() 匹配时写入；未匹配（不在技能弹窗，如测试空/边界场景）时无锚点可扫
  //   if (!this.选择技能_point) {
  //     log('[选择技能] 扫描词条失败：未识别到标题锚点，耗时 ' + (Date.now() - 开始) + 'ms')
  //     return null
  //   }

  //   // 1. 找词条顶部
  //   var top = this.找词条顶部(img)
  //   if (top < 0) {
  //     return null
  //   }
  //   log('[选择技能] 词条顶部' + top + '，耗时 ' + (Date.now() - 开始) + 'ms')

  //   // 2. 找词条底部
  //   var bottom = this.找词条底部(img, top)
  //   if (bottom < 0 || bottom - top < 100) {
  //     return null
  //   }
  //   log('[选择技能] 词条底部' + bottom + '，耗时 ' + (Date.now() - 开始) + 'ms')

  //   // 3. 词条块逐行扫描 + 列直方图分段
  //   var 词条块 = this.扫描词条块(img, top, bottom)
  //   var 段 = this.列直方图分段(词条块)
  //   if (!段) {
  //     return null
  //   }
  //   log('[选择技能] 词条亮段' + 段 + '，耗时 ' + (Date.now() - 开始) + 'ms')
  //   var 直方段数 = 段.length

  //   // 4. 顶部行边界修正切分直方图合并段
  //   段 = this.顶部行修正(段, 词条块)
  //   var 顶段数 = 词条块.行.length > 0 ? 词条块.行[0].段.length : 0

  //   // 5. 每张卡的高度（供加载完成校验）
  //   var 卡高 = this.卡高度(词条块, 段)

  //   log('[选择技能] 扫描词条耗时 ' + (Date.now() - 开始) + 'ms（顶部y' + top + ' 底部y' + bottom + ' 卡' + 段.length + '张 直方段' + 直方段数 + ' 顶段' + 顶段数 + '）')
  //   var ocr结果 = ocrRegion(img, 0, top, width, bottom - top)
  //   if (ocr结果 && ocr结果.children && ocr结果.children.length > 0) {
  //     let results = 嵌套OCR块(ocr结果.children)
  //     log(results)
  //     打印OCR嵌套(results, '')
  //   }
  //   return { 段: 段, 词条块: 词条块, 卡高: 卡高 }
  // }

  // /**
  //  * 词条加载完成校验：
  //  * 1. 段数 >= 3（技能弹窗 3/4 卡，动画中可能只识别出 1-2 张合并段）
  //  * 2. 顶部行亮段 >= 3（顶部行缝隙最清晰，动画中缝隙合并时边界修正失效）
  //  * 3. 最左与最右卡高度大致相等（差 <= 20%）
  //  */
  // private 加载完成(结果: 扫描结果): boolean {
  //   if (结果.段.length < 3) return false
  //   var 顶部行 = 结果.词条块.行.length > 0 ? 结果.词条块.行[0].段 : []
  //   if (顶部行.length < 3) return false // 动画加载中：顶部行亮段合并，边界修正无法切分卡片
  //   var 左 = 结果.卡高[0]
  //   var 右 = 结果.卡高[结果.卡高.length - 1]
  //   var 最大 = Math.max(左, 右)
  //   if (最大 <= 0) return false
  //   return Math.abs(左 - 右) / 最大 <= 0.2
  // }

  // /**
  //  * 定位词条卡片列表（从左到右）。词条可能因入场动画未显示全：
  //  * 反复扫描直到两侧词条高度大致相等（加载完成），最多重试 5 次。
  //  */
  // private 卡片列表(): 卡片[] {
  //   var img = screen()
  //   var 结果: 扫描结果 | null = null
  //   for (var 尝试 = 0; 尝试 < 最大重试; 尝试++) {
  //     结果 = this.扫描词条(img)
  //     if (结果 && this.加载完成(结果)) break
  //     if (尝试 < 最大重试 - 1) {
  //       log('[选择技能] 词条动画加载中（左右高度不等），重新识别 (' + (尝试 + 1) + '/' + 最大重试 + ')')
  //       sleep(600) // 超过 screen() 500ms 缓存窗口，下次取新截图
  //       img = screen()
  //     }
  //   }
  //   if (!结果) return []
  //   // 每张卡：OCR 整卡文字 + 点击卡片上部（技能名区域）
  //   var 卡高 = 结果.词条块.y2 - 结果.词条块.y1
  //   var 点击y = 结果.词条块.y1 + 卡高 * 0.1
  //   var cards: 卡片[] = []
  //   for (var i = 0; i < 结果.段.length; i++) {
  //     var s = 结果.段[i]
  //     if (s.x2 - s.x1 < 60) continue // 过滤过窄的亮段（如文字碎块）
  //     var cx = (s.x1 + s.x2) / 2
  //     var r = ocrRegion(img, s.x1, 结果.词条块.y1, s.x2 - s.x1, 卡高)
  //     var t = r ? r.text.trim() : ''
  //     var 首行 = t.split('\n')[0] || ''
  //     cards.push({ 名: 首行, 文: t, 点: [cx, 点击y] })
  //   }
  //   return cards
  // }

  // /** 按技能策略权重降序评分（含匹配规则），未识别到文字的排最后 */
  // private 卡片评分(cards: 卡片[]): 评分卡[] {
  //   var 评分: 评分卡[] = []
  //   for (var i = 0; i < cards.length; i++) {
  //     var c = cards[i]
  //     if (!c.文) {
  //       评分.push({ 序号: i, 点: c.点, 权重: -1, 规则: null })
  //       continue
  //     }
  //     var w = skillStrategy.weight(c.文)
  //     评分.push({ 序号: i, 点: c.点, 权重: w.weight, 规则: w.match })
  //   }
  //   评分.sort(function (a, b) { return b.权重 - a.权重 })
  //   return 评分
  // }

  // /** 按技能策略权重降序返回卡片序号（0 起，从左到右），未识别到文字的排最后 */
  // 技能排序(): number[] {
  //   return this.卡片评分(this.卡片列表()).map(function (s) { return s.序号 })
  // }

  // /** 点击第 n 张技能卡片（n 从 1 开始，从左到右） */
  // 选技能(n: number): boolean {
  //   var cards = this.卡片列表()
  //   if (n < 1 || n > cards.length) return false
  //   var c = cards[n - 1]
  //   click(toScreenX(c.点[0]), toScreenY(c.点[1]))
  //   return true
  // }

  // /** 找"确定"按钮：找到则点击提交（弹窗关闭），没找到返回 false */
  // private 找确定(): boolean {
  //   return createRouteAction('images/选择技能$$确定_0_0.9_531_1611_628_1656.png')()
  // }

  // /**
  //  * 每组多选技能：有确定按钮的弹窗每组固定选 2 个（每轮点一张卡 + 点一次确定）。
  //  * 第 1 轮确定后弹窗保持同组；第 2 轮确定后弹窗会换新一组词条（或关闭），
  //  * 本方法结束返回，由上层循环（自动战斗/测试）重新检测并扫描新组。
  //  * 无确定按钮的弹窗：点卡片即生效，等弹窗自动关闭。
  //  */
  // 选最优技能(): boolean {
  //   skillStrategy.ensureProgress()
  //   var cards = this.卡片列表()
  //   var 评分 = this.卡片评分(cards)
  //   if (评分.length === 0 || 评分[0].规则 === null) return false
  //   // 打印全部候选（按优先级顺序，未选中的也显示，便于核对选卡依据）。
  //   // 文 的第一行通常就是名称，名称已含在文里时不重复拼接
  //   for (var p = 0; p < 评分.length; p++) {
  //     var 候选卡 = cards[评分[p].序号]
  //     var 展示文 = 候选卡.文
  //     if (展示文.indexOf(候选卡.名) !== 0) {
  //       展示文 = 候选卡.名 + ' ' + 展示文
  //     }
  //     log('[选择技能] 候选' + (p + 1) + ': [' + 展示文.replace(/\n/g, ' ') + '] 权重=' + 评分[p].权重)
  //   }
  //   for (var 轮 = 0; 轮 < 2; 轮++) {
  //     // 按权重从高到低找第一个未选且有规则的卡片（评分列表已按权重降序）
  //     var 候选: 评分卡 | null = null
  //     for (var i = 0; i < 评分.length; i++) {
  //       if (评分[i].规则 && !评分[i].已选) {
  //         候选 = 评分[i]
  //         break
  //       }
  //     }
  //     if (!候选) {
  //       // 本组卡片已全部选完但弹窗未关：可能弹窗已换新组，交由上层重新扫描
  //       log('[选择技能] 本组 ' + 评分.length + ' 张卡片已全部选完，弹窗未关闭')
  //       return true
  //     }
  //     var 规则 = 候选.规则
  //     if (!规则) break // 未识别到文字的卡片跳过
  //     候选.已选 = true
  //     // 按优先级顺序打印本轮选择（评分列表即优先级顺序）
  //     log('[选择技能] 第' + (轮 + 1) + '轮选: [' + cards[候选.序号].名 + '] 权重=' + 候选.权重)
  //     //click(toScreenX(候选.点[0]), toScreenY(候选.点[1]))
  //     // 选中后才局内降权（该技能下次出现时权重 -100）
  //     skillStrategy.onSelected(规则)
  //     // 找"确定"按钮：找到点击提交
  //     if (this.找确定()) {
  //       sleep(600) // 超过 screen() 500ms 缓存窗口，等确定提交后 UI 稳定
  //       if (!this.is(screen())) return true // 弹窗已关闭 → 选择完毕
  //       if (轮 === 1) return true // 第 2 轮确定后弹窗换新组，结束本轮交由上层重新扫描
  //       // 第 1 轮：弹窗保持同组 → 继续选第 2 个
  //     } else {
  //       // 无确定按钮的弹窗点卡片即生效，等弹窗自动关闭
  //       for (var j = 0; j < 4; j++) {
  //         sleep(400)
  //         if (!this.is(screen())) return true
  //       }
  //     }
  //   }
  //   return true
  // }

  // routes(): Route[] {
  //   var self = this
  //   return [
  //     // 点击最优技能卡 → 弹窗关闭回到战斗中
  //     { target: 战斗中, action: function (): boolean { return self.selectSkill(true) }, imagePath: 'images/选择技能_0_0.8_438_729_645_1143.png' },
  //   ]
  // }
}
