import { BasePage } from './BasePage'
import { ocrRegion, imageDetector, width } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from './战斗中'

export class 选择技能 extends BasePage {
  name = '选择技能'
  // 技能弹窗只在战斗中弹出（游戏机制），识别到选择技能即处于战斗中
  hostPage = 战斗中
  选择技能_point!: OpenCV.Point
  is(img: ImageWrapper) {
    // 必须传入外部 img：自行截图会回收 cache_screen_img（若传入图正是缓存图），
    // 导致 detectCurrentPage 后续页面 is() 全部使用已回收的死图
    let point = imageDetector('images/选择技能_0_0.8_438_724_645_782.png', img)
    if (point) {
      this.选择技能_point = point
    }
    return !!point
  }


  selectSkill(img: ImageWrapper, identifySkill: boolean = true): boolean {
    let sure_point = imageDetector('images/选择技能$$确定_0_0.9_531_1902_628_1947.png', img)
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
        // 选中后局内降权(priority/weightDecay),下次出现时权重降低
        if (point.match) {
          skillStrategy.onSelected(point.match)
        }
        if (sure_point) {
          click(sure_point.x, sure_point.y + 10)
        }
      }
      str += `[${point.name} ${point.weight} ${point.match ? point.match.source : ''}]\n`
    }
    log(str)
    return true
  }

  findSkillCard(img: ImageWrapper, _top: number): Rect[] {
    // ── 第一步：裁剪+灰度+二值化全 Mat 原生（submat 零拷贝视图）+ 行和定位两端 ──
    // 注意：roi 是 img.mat 的视图，img 被回收后数据失效（调用链中 OCR 也在用 img，安全）
    let roi = img.mat.submat(_top, img.mat.rows(), 0, img.mat.cols())
    let th = new org.opencv.core.Mat()
    org.opencv.imgproc.Imgproc.cvtColor(roi, th, org.opencv.imgproc.Imgproc.COLOR_BGR2GRAY) // 4通道→灰度（AutoJs6 的 grayscale 即此 code）
    org.opencv.imgproc.Imgproc.threshold(th, th, 0, 255, org.opencv.imgproc.Imgproc.THRESH_OTSU) // 原位二值化
    let cols = th.cols()
    let rowSum = new org.opencv.core.Mat()
    org.opencv.core.Core.reduce(th, rowSum, 1, org.opencv.core.Core.REDUCE_SUM, org.opencv.core.CvType.CV_32S)
    let mask = new org.opencv.core.Mat()
    org.opencv.core.Core.compare(rowSum, new org.opencv.core.Scalar(102 * cols), mask, org.opencv.core.Core.CMP_GT) // 白像素>40% ⟺ 行和>102*cols
    let pts = new org.opencv.core.Mat()
    org.opencv.core.Core.findNonZero(mask, pts) // CV_32SC2，按行扫描序 → 天然有序
    let top = pts.rows() > 0 ? pts.get(0, 0)[1] : -1
    let bottom = pts.rows() > 0 ? pts.get(pts.rows() - 1, 0)[1] : -1
    if (top >= 0) {
      // 第二轮复用前先回收第一轮掩码/点集（否则丢引用泄漏 ~1MB）
      mask.release()
      pts.release()
      // ── 第二步：复用 th（submat 不拷贝像素），两端间列和 → 黑列段（卡片缝隙）──
      let region = th.submat(top, bottom + 1, 0, cols)
      let colSum = new org.opencv.core.Mat()
      org.opencv.core.Core.reduce(region, colSum, 0, org.opencv.core.Core.REDUCE_SUM, org.opencv.core.CvType.CV_32S)
      let rows = region.rows()
      let whiteNum = 0.02 * 255 * rows // 黑占比 > 98% ⟺ 白像素 < 2%
      mask = new org.opencv.core.Mat()
      org.opencv.core.Core.compare(colSum, new org.opencv.core.Scalar(whiteNum), mask, org.opencv.core.Core.CMP_LT)
      pts = new org.opencv.core.Mat()
      org.opencv.core.Core.findNonZero(mask, pts)

      // 连续黑列合并成段，只保留每段的起始 x
      let gaps = [] // 每个元素 = 一个连续黑段的起始 x
      let lastX = -51 // 当前段末尾 x（初始 -2，保证第 1 个点必开新段）
      for (let i = 0; i < pts.rows(); i++) {
        let x = pts.get(i, 0)[0]
        if (x > lastX + 50) gaps.push(x) // 与上一黑列不连续,且小于50的容错 → 开新段，记录起始
        lastX = x // 更新当前段末尾
      }
      let cards: Rect[] = []
      for (let i = 1; i < gaps.length; i++) {
        cards.push({
          left: gaps[i - 1],
          right: gaps[i],
          top: top + _top,
          bottom: bottom + _top
        })
      }
      th.release(); rowSum.release(); mask.release(); pts.release()
      roi.release(); region.release(); colSum.release() // 视图 release 只减引用计数，不影响原图
      return cards
    }
    th.release(); rowSum.release(); mask.release(); pts.release()
    roi.release()
    return []
  }

  entryPoints(img: ImageWrapper, identifySkill: boolean): SkillPoint[] {

    // OTSU 模式要求单通道图（CV_8UC1），截图是 4 通道 RGBA（CV_8UC4）会抛异常，
    // 先 images.grayscale 转灰度（AutoJs6 文档「images.grayscale」）；OTSU 自动算阈值，120 参数被忽略
    // let tmp1 = images.grayscale(img)
    // let t = Date.now()
    // let tmp = images.threshold(tmp1, 0, 255, "OTSU")
    // log(tmp.getBitmap())
    // log(`OTSU 耗时：${Date.now() - t} ms`)
    // tmp1.recycle()
    // let top = this.找词组顶部(tmp)
    // if (top < 0) {
    //   log('[选择技能] 未找到词条顶部，不识别')
    //   return []
    // }
    // let bottom = this.找词组底部(tmp, top)
    // let left = this.找词组左边(tmp, (top + bottom) / 2)
    // let right = this.找词组右边(tmp, (top + bottom) / 2)
    // // 右边空隙宽(width - right)比左边空隙宽(left)大 20px 以上 → 词条组偏左，词组不完整
    // log(`[选择技能] 词条组范围：top=${top} bottom=${bottom} left=${left} right=${right}`)
    // if (left + right + 20 < width) {
    //   log('[选择技能] 词条组不完整，不识别')
    //   tmp.recycle()
    //   return []
    // }

    let cards = this.findSkillCard(img, this.选择技能_point.y + 50)
    if (cards.length == 0 || cards[cards.length - 1].right < width - 30) {
      return []
    }
    let skillPoints: SkillPoint[] = []
    if (identifySkill) {
      cards.forEach(card => {
        let ocrResult = ocrRegion(img, card.left, card.top, card.right - card.left, card.bottom - card.top)
        if (ocrResult?.children) {
          let name = ocrResult?.children?.map(node => node.text.replace(/\n/g, "")).join(' ')
          let strategy = skillStrategy.weight(name)
          skillPoints.push({
            x: card.left + 100,
            y: card.top + 100,
            name: name,
            weight: strategy.weight,
            match: strategy.match
          })
        }
      })
      // let gaps = this.找词组间隔(tmp, left, right, top, bottom)
      // tmp.recycle()
      // if (gaps.length < 2) {
      //   log('[选择技能] 词条组不完整，不识别')
      // }
      // log(gaps)
      // gaps.push(right)
      // for (let i = 0; i < gaps.length; i++) {
      //   let ocrResult = ocrRegion(img, left, top, gaps[i] - left, bottom - top)
      //   if (ocrResult?.children) {
      //     let name = ocrResult?.children?.map(node => node.text.replace(/\n/g, "")).join(' ')
      //     let strategy = skillStrategy.weight(name)
      //     skillPoints.push({
      //       x: left + 100,
      //       y: top + 100,
      //       name: name,
      //       weight: strategy.weight,
      //       match: strategy.match
      //     })
      //   }
      //   left = gaps[i]
      return skillPoints.sort((a, b) => b.weight! - a.weight!)
    }
    return [{ x: cards[0].left + 50, y: cards[0].top + 50 }]
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
  //   return createRouteAction('images/选择技能$$确定_0_0.9_531_1902_628_1947.png')()
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
