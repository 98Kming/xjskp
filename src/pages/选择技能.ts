import { BasePage } from './BasePage'
import { ocrRegion, imageDetector, width } from '../utils/img'
import { skillStrategy } from '../utils/技能策略'
import { 战斗中 } from './战斗中'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/选择技能_0_0.8_438_708_645_910.png',
  选择技能_限时: 'images/选择技能_限时_0_0.9_430_602_642_910.png',
}

export class 选择技能 extends BasePage {
  name = '选择技能'
  // 技能弹窗只在战斗中弹出（游戏机制），识别到选择技能即处于战斗中
  hostPage = 战斗中
  选择技能_point!: OpenCV.Point
  is(img: ImageWrapper) {
    // 必须传入外部 img：自行截图会回收 cache_screen_img（若传入图正是缓存图），
    // 导致 detectCurrentPage 后续页面 is() 全部使用已回收的死图
    let point = imageDetector(IMG.页面, img) || imageDetector(IMG.选择技能_限时, img)
    if (point) {
      this.选择技能_point = point
    }
    return !!point
  }


  selectSkill(img: ImageWrapper, identifySkill: boolean = true): boolean {
    let sure_point = imageDetector(IMG.选择技能确定, img)
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
        log(`[选择技能] 选中技能 ${point.name}`, i, count)
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
    let cards: Rect[] = []
    // ── 第一步：裁剪+灰度+二值化全 Mat 原生（submat 零拷贝视图）+ 行和定位两端 ──
    // 注意：roi 是 img.mat 的视图，img 被回收后数据失效（调用链中 OCR 也在用 img，安全）
    let roi = img.mat.submat(_top, img.mat.rows(), 0, img.mat.cols())
    let th = new org.opencv.core.Mat()
    org.opencv.imgproc.Imgproc.cvtColor(roi, th, org.opencv.imgproc.Imgproc.COLOR_BGR2GRAY)
    org.opencv.imgproc.Imgproc.threshold(th, th, 0, 255, org.opencv.imgproc.Imgproc.THRESH_OTSU)
    roi.release()

    let cols = th.cols()   // 1080
    let rows = th.rows()   // 1700

    // ── 行 reduce + get 整块 ──
    let rowSum = new org.opencv.core.Mat()
    org.opencv.core.Core.reduce(th, rowSum, 1, org.opencv.core.Core.REDUCE_SUM, org.opencv.core.CvType.CV_32S)

    let rowSumArr = java.lang.reflect.Array.newInstance(java.lang.Integer.TYPE, rows)
    rowSum.get(0, 0, rowSumArr)
    rowSum.release()
    // ── JS 找 top / bottom ──
    let threshRow = 64 * cols          // 白像素 > 25%
    let top = -1, bottom = -1
    for (let y = 0; y < rows; y++) {
      if (rowSumArr[y] > threshRow) { top = y; break }
    }
    if (top >= 0) {
      for (let y = rows - 1; y >= top; y--) {
        if (rowSumArr[y] > threshRow) { bottom = y; break }
      }
    }
    let gaps = []
    if (top >= 0) {
      // ── 列 reduce + get 整块 ──
      let region = th.submat(top, bottom + 1, 0, cols)
      let regionRows = region.rows()
      let colSum = new org.opencv.core.Mat()
      org.opencv.core.Core.reduce(region, colSum, 0, org.opencv.core.Core.REDUCE_SUM, org.opencv.core.CvType.CV_32S)
      region.release()
      let colSumArr = java.lang.reflect.Array.newInstance(java.lang.Integer.TYPE, cols)
      colSum.get(0, 0, colSumArr)
      colSum.release()
      // ── JS 合并黑段（gap ≤ 50 列视为同段）──
      let whiteLimit = 0.02 * 255 * regionRows   // 黑占比 > 98% ⟺ 白像素 < 2%
      let blackSegs = []
      let segStart = -1
      let lastX = -1
      for (let x = 0; x < cols; x++) {
        if (colSumArr[x] < whiteLimit) {
          if (segStart === -1) {
            segStart = x
          } else if (x > lastX + 50) {
            blackSegs.push([segStart, lastX])
            segStart = x
          }
          lastX = x
        }
      }
      if (segStart !== -1) blackSegs.push([segStart, lastX])

      // ── JS 由黑段夹出白段 ──
      for (let i = 0; i < blackSegs.length - 1; i++) {
        let s = blackSegs[i][1] + 1
        let e = blackSegs[i + 1][0] - 1
        if (e >= s) gaps.push([s, e])
      }
      for (let i = 0; i < gaps.length; i++) {
        cards.push({
          left: gaps[i][0],
          right: gaps[i][1],
          top: top + _top,
          bottom: bottom + _top
        })
      }
    }
    th.release()
    return cards
  }

  entryPoints(img: ImageWrapper, identifySkill: boolean): SkillPoint[] {
    let cards = this.findSkillCard(img, this.选择技能_point.y + 100)
    // cards[0].left + cards[last].right - width 即「左边距 - 右边距」，超过 10 说明卡片区没铺满或偏移
    if (cards.length == 0 || Math.abs(cards[0].left + cards[cards.length - 1].right - width) > 10) {
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
      return skillPoints.sort((a, b) => b.weight! - a.weight!)
    }
    return [{ x: cards[0].left + 50, y: cards[0].top + 50 }]
  }
}