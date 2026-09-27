// 模板加载/区域解析复用 utils/img 的 getTemplate/imageNameParser/imageDetector,
// 弹窗识别图复用 sharedImages。坐标为 1080 设计像素,截图用后必须 recycle
import { getTemplate, imageDetector, imageNameParser } from '../utils/img'
import { sharedImages } from '../images'
// 截图权限在 start() 里请求,避免模块加载(main.ts import)时就弹权限框阻塞主窗口创建
/** 读图并按文件名解析匹配阈值(如 _0_0.65 后缀) */
type Tpl = { img: any, threshold: number }
function 读图(path: string): Tpl {
  return { img: getTemplate(path), threshold: imageNameParser(path).threshold }
}
const IMG = {
  ...sharedImages,
  炸弹: './images/探索$$炸弹_0_0.9.png',
  未知块: './images/探索$$未知块_0_0.7.png',
  隐藏物品: './images/探索$$隐藏_0_0.7.png',
  已知1: './images/探索_已知1_0_0.7.png',
  已知2: './images/探索_已知2_0_0.7.png',
  已知3: './images/探索_已知3_0_0.7.png',
  一层储物盒: './images/探索_1层_0_0.9.png',
  二层储物盒11: './images/探索_2层11_0_0.9.png',
  二层储物盒12: './images/探索_2层12_0_0.9.png',
  二层储物盒21: './images/探索_2层21_0_0.9.png',
  二层储物盒22: './images/探索_2层22_0_0.9.png',
  三层储物盒11: './images/探索_3层11_0_0.9.png',
  三层储物盒12: './images/探索_3层12_0_0.9.png',
  三层储物盒21: './images/探索_3层21_0_0.9.png',
  三层储物盒22: './images/探索_3层22_0_0.9.png',
  三层储物盒31: './images/探索_3层31_0_0.9.png',
  三层储物盒32: './images/探索_3层32_0_0.9.png',
  下一层入口: './images/探索$$下一层入口_0_0.65.png',
  无次数: './images/探索_无次数_0_0.97_792_1933_848_1960.png',
}
const img_炸弹 = 读图(IMG.炸弹)
const img_未知 = 读图(IMG.未知块)
const img_已知1 = 读图(IMG.已知1)
const img_已知2 = 读图(IMG.已知2)
const img_已知3 = 读图(IMG.已知3)
const img_隐藏物品 = 读图(IMG.隐藏物品)
const img_1层储物盒 = 读图(IMG.一层储物盒)
const img_2层储物盒11 = 读图(IMG.二层储物盒11)
const img_2层储物盒12 = 读图(IMG.二层储物盒12)
const img_2层储物盒21 = 读图(IMG.二层储物盒21)
const img_2层储物盒22 = 读图(IMG.二层储物盒22)
const img_3层储物盒11 = 读图(IMG.三层储物盒11)
const img_3层储物盒12 = 读图(IMG.三层储物盒12)
const img_3层储物盒21 = 读图(IMG.三层储物盒21)
const img_3层储物盒22 = 读图(IMG.三层储物盒22)
const img_3层储物盒31 = 读图(IMG.三层储物盒31)
const img_3层储物盒32 = 读图(IMG.三层储物盒32)
// 层结束按钮:新版为"下一层入口"
const img_结束 = 读图(IMG.下一层入口)
const img_次数0 = 读图(IMG.无次数)
// "恭喜获得"弹窗:通用模板(寰球救援/兑换码/探索共用)
const img_恭喜获得 = 读图(IMG.恭喜获得)
// ==================== 常量配置 ====================
const ROWS = 6;
const COLS = 5;
const CLICK_OFFSET = 50;    // 格子点击偏移(格子左上角 + 偏移)
const MAX_RETRY = 3;        // 单格识别重试上限,超限按"已知"落定
const MAX_BOX_CLICK = 3;    // 储物盒集齐后点击上限,防入口未出现时空点
enum CellType {
  炸弹 = "炸弹",
  未知 = "未知",
  隐藏物品 = "隐藏物品",
  已知 = "其他",
  储物盒1层 = "一层储物盒",
  储物盒2层 = "二层储物盒",
  储物盒3层 = "三层储物盒",
}
type Cell = {
  weight: number,
  type: CellType,
  j: number,
  i: number,
  isBox: boolean
}
export class 探索 {
  table: Cell[][] = []
  boxPiece = 0
  boxClick = 0   // 集齐后已点盒子的次数,防入口未出现时每轮空点同一坐标
  box?: Cell
  boxType?: CellType.储物盒1层 | CellType.储物盒2层 | CellType.储物盒3层
  startX: number = 0
  startY: number = 0
  width: number = 0
  waitDetectArr: Cell[] = []
  hideCell?: Cell
  bombCell?: Cell
  start() {
    if (!images.requestScreenCapture()) {
      toast('请求截图失败')
      return
    }
    this.init()
    let count = 0
    let noProgress = 0   // 连续无进展计数,防无限空转
    while (++count >= 0) {
      // 关闭"恭喜获得"弹窗(点隐藏物品/入口都会弹),有则关闭并继续下次循环
      if (this.close_恭喜获得()) {
        continue
      }
      let endCap = images.captureScreen()
      let point = images.findImageInRegion(endCap, img_结束.img, this.startX, this.startY, 5 * this.width, 6 * this.width, img_结束.threshold)
      endCap.recycle()
      if (point) {
        // 点隐藏物品(弹恭喜获得),先关闭再点入口,避免弹窗挡住入口按钮
        if (this.hideCell) {
          click(this.hideCell.j * this.width + this.startX + CLICK_OFFSET, this.hideCell.i * this.width + this.startY + CLICK_OFFSET)
          sleep(800)
          this.close_恭喜获得()
        }
        // 点下一层入口(也会弹恭喜获得)
        click(point.x + CLICK_OFFSET, point.y + CLICK_OFFSET)
        sleep(800)
        this.close_恭喜获得()
        this.reset()
        sleep(800)
        continue
      }
      point = imageDetector(IMG.无次数)
      if (point) {
        log("次数为0", img_次数0.threshold)
        break
      }
      // 探索页识别:棋盘底色找不到视为遮挡/离开探索页,关闭弹窗后继续
      let boardCap = images.captureScreen()
      let boardOk = images.findColorInRegion(boardCap, '#F4EFEC', device.width * 0.3, device.height * 0.5, device.width * 0.4, device.height * 0.5, 0.9)
      boardCap.recycle()
      if (!boardOk) {
        log("遮挡")
        click(device.width - 50, device.height - 50)
        sleep(800)
        continue
      }
      if (this.box) {
        // 盒子外形:1层 1格、2层 2x2、3层 3x2;集齐后点盒子左上角格开箱
        let need = this.box.type == CellType.储物盒1层 ? 1 : (this.box.type == CellType.储物盒2层 ? 4 : 6)
        // 加上限:入口没出现时不再每轮空点同一坐标(旧逻辑会一直点到入口出现)
        if (this.boxPiece >= need && this.boxClick < MAX_BOX_CLICK) {
          this.boxClick++
          log("储物盒集齐,点击开箱", this.box.i, this.box.j, this.boxClick)
          click(this.box.j * this.width + this.startX + CLICK_OFFSET, this.box.i * this.width + this.startY + CLICK_OFFSET)
          sleep(800)
          continue
        }
      }
      let fast = this.fastClickCell()
      if (fast == null) {
        log("没有可点的候选格子")
        noProgress++
        if (noProgress >= 10) {
          log("连续无进展10次，退出探索")
          break
        }
        sleep(2000)
        continue
      }
      noProgress = 0
      this.print()
      this.removeWait(fast)
      log(fast)
      log('识别次数：', count, "剩余未开格子：", this.waitDetectArr.length)
      log('------------------------------------------')
      //sleep(2000)
      click(fast.j * this.width + this.startX + CLICK_OFFSET, fast.i * this.width + this.startY + CLICK_OFFSET)

      sleep(1200)

      if (fast.type == CellType.炸弹) {
        // 行列展开:屏幕静止,复用一张截图减少找图次数;重试与超限兜底都在 detectCell 内
        let cap = images.captureScreen()
        for (let i = 0; i < COLS; i++) {
          let tmp = this.table[fast.i][i]
          if (tmp.type == CellType.未知) {
            this.detectCell(tmp, cap, false)
            if (tmp.type != CellType.未知) {
              this.removeWait(tmp)
            }
          }
        }
        for (let i = 0; i < ROWS; i++) {
          let tmp = this.table[i][fast.j]
          if (tmp.type == CellType.未知) {
            this.detectCell(tmp, cap, false)
            if (tmp.type != CellType.未知) {
              this.removeWait(tmp)
            }
          }
        }
        cap.recycle()
      } else {
        let cap = images.captureScreen()
        this.detectCell(fast, cap, false)
        cap.recycle()
        // if (fast.type == CellType.已知) {
        //   // 点开后识别为"其他"可能是动画未结束,等 300ms 重新识别一次
        //   sleep(300)
        //   this.detectCell(fast, images.captureScreen(), false)
        // }
      }
    }

  }
  /**
   * 关闭"恭喜获得"弹窗:识别到则点击其上方 250px 位置,循环直至弹窗消失。
   * 返回是否关闭过弹窗。
   */
  close_恭喜获得(): boolean {
    let closed = false
    for (let i = 0; i < 5; i++) {
      let cap = images.captureScreen()
      let p = images.findImageInRegion(cap, img_恭喜获得.img, device.width * 0.3, device.height * 0.2, device.width * 0.4, device.height * 0.3, img_恭喜获得.threshold)
      cap.recycle()
      if (!p) break
      closed = true
      log("关闭恭喜获得弹窗")
      click(p.x, p.y - 250)
      sleep(800)
    }
    return closed
  }
  init() {
    const img = images.captureScreen();
    // 起点 x 在左上角图右侧(加模板宽);起点 y 在左上角图底部(加模板高);
    // 棋盘宽度再减掉模板图宽度,对齐实际格子区域
    this.startX = 120
    this.startY = 820
    let lenX = 960-120
    let lenY = 1845-820
    this.width = parseInt((lenX / 5 + lenY / 6) / 2 + "")
    log(this.startX, this.startY, this.width)
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        this.detectCell(this.getCell(i, j), img, true)
      }
    }
    img.recycle()
  }

  getCell(i: number, j: number) {
    if (this.table[i] == null) {
      this.table[i] = new Array(5)
    }
    let cell = this.table[i][j]
    if (cell == null) {
      cell = { weight: 0, type: CellType.未知, j: j, i: i, isBox: true }
      this.table[i][j] = cell
    }
    return cell
  }
  /** 入队待探测:按对象去重(炸弹行列扫描/重试会对同一格重复 detect,不去重会堆重复项) */
  pushWait(cell: Cell) {
    if (this.waitDetectArr.indexOf(cell) < 0) {
      this.waitDetectArr.push(cell)
    }
  }
  /** 出队:indexOf 未命中时 splice(-1, 1) 会误删末位元素,必须先判负 */
  removeWait(cell: Cell) {
    let k = this.waitDetectArr.indexOf(cell)
    if (k >= 0) {
      this.waitDetectArr.splice(k, 1)
    }
  }
  reset() {
    this.waitDetectArr = []
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        let cell = this.table[i][j]
        cell.type = CellType.未知
        cell.isBox = true
        cell.weight = 0
        this.waitDetectArr.push(cell)
      }
    }
    this.box = undefined
    this.boxType = undefined
    this.boxPiece = 0
    this.boxClick = 0
    this.hideCell = undefined
    this.bombCell = undefined
  }

  setBox(i: number, j: number, type: CellType.储物盒1层 | CellType.储物盒2层 | CellType.储物盒3层) {
    // 盒子外形(左上角格为 i,j):1层 1x1、2层 2x2、3层 3x2
    let rows = type == CellType.储物盒1层 ? 1 : (type == CellType.储物盒2层 ? 2 : 3)
    let cols = type == CellType.储物盒1层 ? 1 : 2
    // 模板在棋盘边缘误匹配会算出越界盒子:越界时 this.table[-1] 为 undefined,
    // 继续走会在 this.box.isBox 处抛异常;越界一律丢弃
    if (i < 0 || j < 0 || i + rows > ROWS || j + cols > COLS) {
      log("储物盒越界,忽略", i, j, type)
      return
    }
    this.boxPiece += 1
    if (this.box) return
    this.box = this.table[i][j]
    this.boxType = type
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.getCell(r, c).isBox = false
      }
    }
    log(this.box)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.getCell(i + r, j + c).isBox = true
      }
    }
  }

  detectCell(cell: Cell, img: ImageWrapper = images.captureScreen(), first: boolean = true, retry: number = 0) {
    if (!first && this.box && cell.isBox) {
      cell.type = this.boxType!
      this.boxPiece += 1
      log("盒子以定位，当前为盒子部分", cell)
      return
    }
    let x = this.startX + cell.j * this.width
    let y = this.startY + cell.i * this.width
    if (images.findImageInRegion(img, img_未知.img, x, y, this.width, this.width, img_未知.threshold)) {
      this.pushWait(cell)
    } else if (images.findImageInRegion(img, img_隐藏物品.img, x, y, this.width, this.width, img_隐藏物品.threshold)) {
      cell.type = CellType.隐藏物品
      cell.isBox = false
      this.hideCell = cell
    } else if (images.findImageInRegion(img, img_已知1.img, x, y, this.width, this.width, img_已知1.threshold)) {
      cell.type = CellType.已知
      cell.isBox = false
    } else if (images.findImageInRegion(img, img_已知2.img, x, y, this.width, this.width, img_已知2.threshold)) {
      cell.type = CellType.已知
      cell.isBox = false
    } else if (images.findImageInRegion(img, img_已知3.img, x, y, this.width, this.width, img_已知3.threshold)) {
      cell.type = CellType.已知
      cell.isBox = false
    } else if (images.findImageInRegion(img, img_炸弹.img, x, y, this.width, this.width, img_炸弹.threshold)) {
      cell.type = CellType.炸弹
      cell.isBox = false
      this.pushWait(cell)
      this.bombCell = cell
    } else if (images.findImageInRegion(img, img_2层储物盒11.img, x - 5, y - 5, this.width + 10, this.width + 10, img_2层储物盒11.threshold)) {
      cell.type = CellType.储物盒2层
      this.setBox(cell.i, cell.j, CellType.储物盒2层)
    } else if (images.findImageInRegion(img, img_2层储物盒12.img, x - 5, y - 5, this.width + 10, this.width + 10, img_2层储物盒12.threshold)) {
      cell.type = CellType.储物盒2层
      this.setBox(cell.i, cell.j - 1, CellType.储物盒2层)
    } else if (images.findImageInRegion(img, img_2层储物盒21.img, x - 5, y - 5, this.width + 10, this.width + 10, img_2层储物盒21.threshold)) {
      cell.type = CellType.储物盒2层
      this.setBox(cell.i - 1, cell.j, CellType.储物盒2层)
    } else if (images.findImageInRegion(img, img_2层储物盒22.img, x - 5, y - 5, this.width + 10, this.width + 10, img_2层储物盒22.threshold)) {
      cell.type = CellType.储物盒2层
      this.setBox(cell.i - 1, cell.j - 1, CellType.储物盒2层)
    } else if (images.findImageInRegion(img, img_3层储物盒11.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒11.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i, cell.j, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_3层储物盒12.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒12.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i, cell.j - 1, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_3层储物盒21.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒21.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i - 1, cell.j, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_3层储物盒22.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒22.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i - 1, cell.j - 1, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_3层储物盒31.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒31.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i - 2, cell.j, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_3层储物盒32.img, x - 5, y - 5, this.width + 10, this.width + 10, img_3层储物盒32.threshold)) {
      cell.type = CellType.储物盒3层
      this.setBox(cell.i - 2, cell.j - 1, CellType.储物盒3层)
    } else if (images.findImageInRegion(img, img_1层储物盒.img, x - 5, y - 5, this.width + 10, this.width + 10, img_1层储物盒.threshold)) {
      cell.type = CellType.储物盒1层
      this.setBox(cell.i, cell.j, CellType.储物盒1层)
    } else if (retry < MAX_RETRY) {
      // 点开后认不出多半是动画未结束:等一拍重新截图再识别,截图用完即回收
      sleep(1000)
      log("重新识别", cell.i, cell.j, retry + 1)
      let next = images.captureScreen()
      this.detectCell(cell, next, first, retry + 1)
      next.recycle()
    } else {
      // 超限仍认不出:按"已知"落定,避免无限递归
      log("识别失败超限,按已知处理", cell.i, cell.j)
      cell.type = CellType.已知
      cell.isBox = false
    }
  }

  print() {
    for (let i = 0; i < 6; i++) {
      let str = ""
      for (let j = 0; j < 5; j++) {
        let cell = this.table[i][j]
        str += `[${cell.weight}${cell.type.slice(0, 2)}${cell.isBox ? "B" : " "}] `
      }
      log(str)
    }
    let str = ""
    this.waitDetectArr.forEach(cell => {
      str += `[${cell.i},${cell.j}]`
    })
    log(str)
  }

  unknownTypeWeight(cell: Cell) {
    //this.bombCell = this.table[4][1]
    if (cell.type != CellType.未知) {
      return 0
    }
    let weight = 0
    if (!this.box) {
      if (cell.j < 4 && cell.i < 5) {
        if (this.table[cell.i][cell.j + 1].type == CellType.未知 && this.table[cell.i + 1][cell.j].type == CellType.未知 && this.table[cell.i + 1][cell.j + 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j > 0 && cell.i < 5) {
        if (this.table[cell.i][cell.j - 1].type == CellType.未知 && this.table[cell.i + 1][cell.j].type == CellType.未知 && this.table[cell.i + 1][cell.j - 1].type == CellType.未知) {
          weight += 1

        }

      }
      if (cell.j < 4 && cell.i > 0) {
        if (this.table[cell.i][cell.j + 1].type == CellType.未知 && this.table[cell.i - 1][cell.j].type == CellType.未知 && this.table[cell.i - 1][cell.j + 1].type == CellType.未知) {
          weight += 1

        }
      }
      if (cell.j > 0 && cell.i > 0) {
        if (this.table[cell.i][cell.j - 1].type == CellType.未知 && this.table[cell.i - 1][cell.j].type == CellType.未知 && this.table[cell.i - 1][cell.j - 1].type == CellType.未知) {
          weight += 1
        }
      }
      // 三层储物盒
      if (cell.j < 4 && cell.i < 4) {
        if (this.table[cell.i][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i + 2][cell.j].type == CellType.未知 &&
          this.table[cell.i + 2][cell.j + 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j > 0 && cell.i < 4) {
        if (this.table[cell.i][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i + 2][cell.j].type == CellType.未知 &&
          this.table[cell.i + 2][cell.j - 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j < 4 && cell.i < 5 && cell.i > 0) {
        if (this.table[cell.i][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j + 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j > 0 && cell.i < 5 && cell.i > 0) {
        if (this.table[cell.i][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j].type == CellType.未知 &&
          this.table[cell.i + 1][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j - 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j < 4 && cell.i > 1) {
        if (this.table[cell.i][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j + 1].type == CellType.未知 &&
          this.table[cell.i - 2][cell.j].type == CellType.未知 &&
          this.table[cell.i - 2][cell.j + 1].type == CellType.未知) {
          weight += 1
        }
      }
      if (cell.j > 0 && cell.i > 1) {
        if (this.table[cell.i][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j].type == CellType.未知 &&
          this.table[cell.i - 1][cell.j - 1].type == CellType.未知 &&
          this.table[cell.i - 2][cell.j].type == CellType.未知 &&
          this.table[cell.i - 2][cell.j - 1].type == CellType.未知) {
          weight += 1
        }
      }

    }
    if (this.box && cell.isBox) return 1
    if (this.bombCell) return weight
    let boxCount = 0
    let hideWeight = 0
    //log(cell, weight)
    for (let j = 0; j < COLS; j++) {
      let tmp = this.table[cell.i][j];
      if (tmp.type == CellType.未知) {
        weight++
        !cell.isBox && tmp.isBox && boxCount++
      }
      if (tmp.type == CellType.隐藏物品) hideWeight += 6
    }
    for (let i = 0; i < ROWS; i++) {
      let tmp = this.table[i][cell.j];
      if (tmp.type == CellType.未知) {
        weight++
        !cell.isBox && tmp.isBox && boxCount++
      }
      if (tmp.type == CellType.隐藏物品) hideWeight += 6
    }
    if (boxCount > 1 || !this.box) {
      weight += 6 * boxCount + hideWeight
    } else {
      weight = 0
    }
    return weight
  }

  /**
   * table: 5行6列
   * cell 类型：
   * box: 占用空间：1格|2行2列|3行2列，找到box的全部后结束
   * bomb: 点击该bomb能够发现所在行列的所有cell类型
   * hide: bomb未发现且与box处在同一行或列时，该行或列的格子点击优先级更高
   * 目标: 用最少的点击次数，发现box的全部且发现更多cell
   * 算法：
   * 1.未找到box时，当前未知cell可能是box(需满足空间要求)、bomb(table中只有一个)、hide(table中只有一个)
   * 1.1 未找到box且未找到bomb时，当前未知cell的 weight 为所在行列的hideCell(weight：6)、未知cell(weight：1)之和
   * 1.2 未找到box且找到bomb时，当前未知cell的 weight = 1
   * 2.找到box时，当前未知cell是box的一部分时，weight + 3
   * 2.1 找到box且未找到bomb时，当前未知cell的 weight 为所在行列的hideCell(weight：6)、未知cell(weight：1)之和，且所在行列有box的部分大于等于2个时 weight += 6<<count
   * @return weight max cell
   */
  fastClickCell() {
    let fast: Cell | null = null
    for (let cell of this.waitDetectArr) {
      if (this.bombCell == cell) {
        log("炸弹")
        return this.bombCell
      }
      if (fast == null) {
        fast = cell
      }
      cell.weight = this.unknownTypeWeight(cell)
      if (cell.weight > fast.weight) {
        fast = cell
      }
    }
    return fast
  }
}


