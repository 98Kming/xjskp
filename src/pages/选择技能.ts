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
    let point = imageDetector('images/选择技能_0_0.8_438_708_645_910.png', img)
    if (point) {
      this.选择技能_point = point
    }
    return !!point
  }


  selectSkill(img: ImageWrapper, identifySkill: boolean = true): boolean {
    let sure_point = imageDetector('images/选择技能$$确定_0_0.9_531_1670_628_1947.png', img)
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
      return skillPoints.sort((a, b) => b.weight! - a.weight!)
    }
    return [{ x: cards[0].left + 50, y: cards[0].top + 50 }]
  }
}