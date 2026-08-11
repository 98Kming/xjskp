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
// 战斗中升级会连弹多组词条（每组选 2 个 + 确定后换新组），最多连选组数，防弹窗异常不关时死循环
var 最大弹窗组数 = 6

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

type 卡片 = { 名: string; 文: string; 点: [number, number] }
type 评分卡 = { 序号: number; 点: [number, number]; 权重: number; 规则: RegExp | null; 已选?: boolean }
type 扫描行 = { y: number; 段: { x1: number; x2: number }[] }
type 扫描结果 = {
  段: { x1: number; x2: number }[]
  词条块: { y1: number; y2: number; 行: 扫描行[] }
  卡高: number[]
}

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
   * 扫描标题下方区域，按明度定位词条卡片（卡片在标题下方，周围明度 < 0.03）：
   * 1. 沿标题起点列（标题左上角 x）纵向找第一个暗点（遮罩暗区），再往下找第一个亮点行，
   *    该行横向存在 ≥100px 亮段即词条顶部（卡片顶是一整条亮线）。
   *    不用标题中心列：4 卡布局下中心列必然落在卡片缝隙（中间缝 = 屏幕中心 = 标题中心），
   *    起点列实测落在卡2内
   * 2. 从顶部沿扫描列往下找第一个暗段（纵向连续 10 个暗点）即词条底部（卡片内暗纹凑不满）
   * 3. 词条块内逐行扫描亮段成行数据，再做列直方图（每 x 列累计亮采样数），
   *    卡片列亮计数高、缝隙列接近 0，用阈值分段得到每张卡片的精确 x 范围
   *    （单行分段会被卡片内暗区切碎，直方图不受影响）
   * 4. 每张卡的高度 = 其 x 范围内最上/最下亮行之差（供加载完成校验）
   */
  private 扫描词条(img: ImageWrapper): 扫描结果 | null {
    var 开始 = Date.now()
    var w = width
    var h = height

    // 1. 沿标题起点列（标题左上角 x，4 卡布局下实测落在卡2内，避开了中间缝隙）纵向找第一个暗点
    var x = this.选择技能_point.x
    var y = this.选择技能_point.y + 50
    while (y < h && !暗点(img, x, y)) {
      y += 2
    }
    // 2. 从暗点往下找第一个亮点行：该行横向存在 ≥100px 亮段 → 词条顶部
    var top = -1
    while (y < h) {
      y += 2
      if (暗点(img, x, y)) continue // 还是暗区，继续找亮点
      if (行最长亮段(img, y, 顶部连续亮点)) {
        top = y
        break
      }
    }
    if (top < 0) {
      log('[选择技能] 扫描词条失败：未找到词条顶部，耗时 ' + (Date.now() - 开始) + 'ms')
      return null
    }

    // 2. 沿扫描列从顶部往下找第一个暗段（纵向连续 10 个暗点），
    //    并横向验证该行亮段总宽骤降（< 30% 屏宽）——单列暗区可能是卡片内的
    //    暗色元素（图标/文字），整行变暗才是卡片区真正结束
    var bottom = -1
    var ey = top
    while (ey < h) {
      ey += 2
      if (!暗点(img, x, ey)) continue // 还在卡片内，继续找暗点
      var 暗起点 = ey
      var 连续暗 = 0
      while (ey < h && 暗点(img, x, ey)) {
        连续暗++
        ey += 2
      }
      if (连续暗 >= 底部连续暗点 && 行亮段总宽(img, 暗起点) < width * 0.3) {
        bottom = 暗起点 // 单列暗段 + 整行变暗 → 确认词条底部
        break
      }
      // 卡内局部暗区（横向其他卡仍亮），继续往下找
    }
    if (bottom < 0 || bottom - top < 100) {
      log('[选择技能] 扫描词条失败：卡片高度异常（top=' + top + ' bottom=' + bottom + '），耗时 ' + (Date.now() - 开始) + 'ms')
      return null
    }

    // 4. 词条块内逐行扫描亮段（纵向步长 4、横向步长 2：横向步长 2 保证 4px 级
    //    卡片缝隙被采样到，避免相邻卡亮段合并；纵向 4 节省采样量）
    var 词条块 = { y1: top, y2: bottom, 行: <扫描行[]>[] }
    for (var ry = top; ry <= bottom; ry += 4) {
      var 段s: { x1: number; x2: number }[] = []
      var xi = 0
      while (xi < w) {
        if (!暗点(img, xi, ry)) {
          var x1 = xi
          while (xi < w && !暗点(img, xi, ry)) {
            xi += 2
          }
          if (xi - x1 >= 60) 段s.push({ x1: x1, x2: xi }) // 过滤过窄的亮段（如文字碎块）
        } else {
          xi += 2
        }
      }
      if (段s.length > 0) 词条块.行.push({ y: ry, 段: 段s })
    }

    // 5. 列直方图（每 x 列累计亮采样数）→ 阈值分段得到每张卡片的 x 范围
    var 直方图: number[] = []
    for (var i = 0; i < w; i++) 直方图[i] = 0
    for (var r = 0; r < 词条块.行.length; r++) {
      var 行段s = 词条块.行[r].段
      for (var s = 0; s < 行段s.length; s++) {
        for (var cx = 行段s[s].x1; cx < 行段s[s].x2; cx += 2) 直方图[cx]++
      }
    }
    var 峰值 = 0
    for (var i = 0; i < w; i++) {
      if (直方图[i] > 峰值) 峰值 = 直方图[i]
    }
    if (峰值 <= 0) {
      log('[选择技能] 扫描词条失败：词条块内无亮段，耗时 ' + (Date.now() - 开始) + 'ms')
      return null
    }
    var 段阈值 = 峰值 * 0.4 // 卡片列亮计数高、缝隙列接近 0
    var 段: { x1: number; x2: number }[] = []
    var xi2 = 0
    while (xi2 < w) {
      if (直方图[xi2] > 段阈值) {
        var c1 = xi2
        while (xi2 < w && 直方图[xi2] > 段阈值) {
          xi2 += 2
        }
        段.push({ x1: c1, x2: xi2 })
      } else {
        xi2 += 2
      }
    }

    // 6. 顶部行边界修正：卡片缝隙仅 1-2px 且逐行漂移（缝隙列直方图计数 66~79 波动），
    //    固定阈值切不开；顶部行（卡片顶边）缝隙最清晰，用其亮段边界切分直方图合并段
    var 直方段数 = 段.length
    var 顶部段s = 词条块.行.length > 0 ? 词条块.行[0].段 : []
    if (顶部段s.length > 1) {
      var 修正段: { x1: number; x2: number }[] = []
      for (var k = 0; k < 段.length; k++) {
        var 直方段 = 段[k]
        var 切点: number[] = []
        for (var t = 0; t < 顶部段s.length; t++) {
          if (顶部段s[t].x1 > 直方段.x1 + 40 && 顶部段s[t].x1 < 直方段.x2 - 40) {
            切点.push(顶部段s[t].x1) // 直方图段内部的卡片左边界 → 切分点
          }
        }
        if (切点.length === 0) {
          修正段.push(直方段)
        } else {
          var 起点 = 直方段.x1
          for (var c = 0; c < 切点.length; c++) {
            修正段.push({ x1: 起点, x2: 切点[c] })
            起点 = 切点[c]
          }
          修正段.push({ x1: 起点, x2: 直方段.x2 })
        }
      }
      段 = 修正段
    }

    // 6. 每张卡的高度 = x 范围内最上/最下亮行之差
    var 卡高: number[] = []
    for (var k = 0; k < 段.length; k++) {
      var 上 = bottom
      var 下 = top
      for (var r = 0; r < 词条块.行.length; r++) {
        var 行段s2 = 词条块.行[r].段
        for (var s2 = 0; s2 < 行段s2.length; s2++) {
          if (行段s2[s2].x2 >= 段[k].x1 && 行段s2[s2].x1 <= 段[k].x2) {
            if (词条块.行[r].y < 上) 上 = 词条块.行[r].y
            if (词条块.行[r].y > 下) 下 = 词条块.行[r].y
          }
        }
      }
      卡高.push(下 - 上)
    }

    log('[选择技能] 扫描词条耗时 ' + (Date.now() - 开始) + 'ms（顶部y' + top + ' 底部y' + bottom + ' 卡' + 段.length + '张 直方段' + 直方段数 + ' 顶段' + 顶部段s.length + '）')
    return { 段: 段, 词条块: 词条块, 卡高: 卡高 }
  }

  /**
   * 词条加载完成校验：
   * 1. 段数 >= 3（技能弹窗 3/4 卡，动画中可能只识别出 1-2 张合并段）
   * 2. 顶部行亮段 >= 3（顶部行缝隙最清晰，动画中缝隙合并时边界修正失效）
   * 3. 最左与最右卡高度大致相等（差 <= 20%）
   */
  private 加载完成(结果: 扫描结果): boolean {
    if (结果.段.length < 3) return false
    var 顶部行 = 结果.词条块.行.length > 0 ? 结果.词条块.行[0].段 : []
    if (顶部行.length < 3) return false // 动画加载中：顶部行亮段合并，边界修正无法切分卡片
    var 左 = 结果.卡高[0]
    var 右 = 结果.卡高[结果.卡高.length - 1]
    var 最大 = Math.max(左, 右)
    if (最大 <= 0) return false
    return Math.abs(左 - 右) / 最大 <= 0.2
  }

  /**
   * 定位词条卡片列表（从左到右）。词条可能因入场动画未显示全：
   * 反复扫描直到两侧词条高度大致相等（加载完成），最多重试 5 次。
   */
  private 卡片列表(): 卡片[] {
    var img = screen()
    var 结果: 扫描结果 | null = null
    for (var 尝试 = 0; 尝试 < 最大重试; 尝试++) {
      结果 = this.扫描词条(img)
      if (结果 && this.加载完成(结果)) break
      if (尝试 < 最大重试 - 1) {
        log('[选择技能] 词条动画加载中（左右高度不等），重新识别 (' + (尝试 + 1) + '/' + 最大重试 + ')')
        sleep(600) // 超过 screen() 500ms 缓存窗口，下次取新截图
        img = screen()
      }
    }
    if (!结果) return []
    // 每张卡：OCR 整卡文字 + 点击卡片上部（技能名区域）
    var 卡高 = 结果.词条块.y2 - 结果.词条块.y1
    var 点击y = 结果.词条块.y1 + 卡高 * 0.1
    var cards: 卡片[] = []
    for (var i = 0; i < 结果.段.length; i++) {
      var s = 结果.段[i]
      if (s.x2 - s.x1 < 60) continue // 过滤过窄的亮段（如文字碎块）
      var cx = (s.x1 + s.x2) / 2
      var r = ocrRegion(img, s.x1, 结果.词条块.y1, s.x2 - s.x1, 卡高)
      var t = r ? r.text.trim() : ''
      var 首行 = t.split('\n')[0] || ''
      cards.push({ 名: 首行, 文: t, 点: [cx, 点击y] })
    }
    return cards
  }

  /** 按技能策略权重降序评分（含匹配规则），未识别到文字的排最后 */
  private 卡片评分(cards: 卡片[]): 评分卡[] {
    var 评分: 评分卡[] = []
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i]
      if (!c.文) {
        评分.push({ 序号: i, 点: c.点, 权重: -1, 规则: null })
        continue
      }
      var w = skillStrategy.weight(c.文)
      评分.push({ 序号: i, 点: c.点, 权重: w.weight, 规则: w.match })
    }
    评分.sort(function (a, b) { return b.权重 - a.权重 })
    return 评分
  }

  /** 按技能策略权重降序返回卡片序号（0 起，从左到右），未识别到文字的排最后 */
  技能排序(): number[] {
    return this.卡片评分(this.卡片列表()).map(function (s) { return s.序号 })
  }

  /** 点击第 n 张技能卡片（n 从 1 开始，从左到右） */
  选技能(n: number): boolean {
    var cards = this.卡片列表()
    if (n < 1 || n > cards.length) return false
    var c = cards[n - 1]
    click(toScreenX(c.点[0]), toScreenY(c.点[1]))
    return true
  }

  /** 找"确定"按钮：找到则点击提交（弹窗关闭），没找到返回 false */
  private 找确定(): boolean {
    return createRouteAction('images/选择技能$$确定_0_0.9_531_1611_628_1656.png')()
  }

  /**
   * 连续选择直到弹窗关闭：战斗中升级会连弹多组词条（每组选 2 个，确定后换新组），
   * 本方法内循环重扫直到弹窗关闭，一次调用完成全部连弹。
   * 最大组数保护：弹窗异常不关时强制退出，交由上层兜底。
   */
  选最优技能(): boolean {
    skillStrategy.ensureProgress()
    for (var 组 = 0; 组 < 最大弹窗组数; 组++) {
      var cards = this.卡片列表()
      var 评分 = this.卡片评分(cards)
      if (评分.length === 0 || 评分[0].规则 === null) {
        // 第 1 组就识别失败 → 正常失败；已选过组（弹窗已关）→ 成功
        if (组 === 0) return false
        log('[选择技能] 词条识别结束，弹窗已关闭（共选 ' + 组 + ' 组）')
        return true
      }
      if (组 > 0) log('[选择技能] 弹窗换新组，继续选择（第 ' + (组 + 1) + ' 组）')
      // 打印全部候选（按优先级顺序，未选中的也显示，便于核对选卡依据）。
      // 文 的第一行通常就是名称，名称已含在文里时不重复拼接
      for (var p = 0; p < 评分.length; p++) {
        var 候选卡 = cards[评分[p].序号]
        var 展示文 = 候选卡.文
        if (展示文.indexOf(候选卡.名) !== 0) {
          展示文 = 候选卡.名 + ' ' + 展示文
        }
        log('[选择技能] 候选' + (p + 1) + ': [' + 展示文.replace(/\n/g, ' ') + '] 权重=' + 评分[p].权重)
      }
      for (var 轮 = 0; 轮 < 2; 轮++) {
        // 按权重从高到低找第一个未选且有规则的卡片（评分列表已按权重降序）
        var 候选: 评分卡 | null = null
        for (var i = 0; i < 评分.length; i++) {
          if (评分[i].规则 && !评分[i].已选) {
            候选 = 评分[i]
            break
          }
        }
        if (!候选) {
          // 本组卡片已全部选完但弹窗未关：可能弹窗已换新组，交由外层组循环重新扫描
          log('[选择技能] 本组 ' + 评分.length + ' 张卡片已全部选完，弹窗未关闭')
          break
        }
        var 规则 = 候选.规则
        if (!规则) break // 未识别到文字的卡片跳过
        候选.已选 = true
        // 按优先级顺序打印本轮选择（评分列表即优先级顺序）
        log('[选择技能] 第' + (轮 + 1) + '轮选: [' + cards[候选.序号].名 + '] 权重=' + 候选.权重)
        click(toScreenX(候选.点[0]), toScreenY(候选.点[1]))
        // 选中后才局内降权（该技能下次出现时权重 -100）
        skillStrategy.onSelected(规则)
        // 找"确定"按钮：找到点击提交
        if (this.找确定()) {
          sleep(600) // 超过 screen() 500ms 缓存窗口，等确定提交后 UI 稳定
          if (!this.is(screen())) return true // 弹窗已关闭 → 选择完毕
          if (轮 === 1) break // 第 2 轮确定后弹窗换新组 → 结束本轮，外层组循环重新扫描
          // 第 1 轮：弹窗保持同组 → 继续选第 2 个
        } else {
          // 无确定按钮的弹窗点卡片即生效，等弹窗自动关闭
          var 弹窗已关 = false
          for (var j = 0; j < 4; j++) {
            sleep(400)
            if (!this.is(screen())) {
              弹窗已关 = true
              break
            }
          }
          if (弹窗已关) return true
        }
      }
    }
    log('[选择技能] 已达最大弹窗组数(' + 最大弹窗组数 + ')，弹窗未关闭，交由上层兜底')
    return true
  }

  routes(): Route[] {
    var self = this
    return [
      // 点击最优技能卡 → 弹窗关闭回到战斗中
      { target: 战斗中, action: function (): boolean { return self.选最优技能() }, imagePath: 'images/选择技能_0_0.8_438_729_645_1143.png' },
    ]
  }
}
