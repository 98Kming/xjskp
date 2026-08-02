// 使用 AutoJs6 全局 API(colors/images/click 等),不依赖项目 util 模块
import { imageNameParser } from '../utils/img'
// 截图权限在 start() 里请求,避免模块加载(main.ts import)时就弹权限框阻塞主窗口创建
/** 读图并按文件名解析匹配阈值(如 _0_0.65 后缀) */
type Tpl = { img: any, threshold: number }
function 读图(path: string): Tpl {
  return { img: images.read(path), threshold: imageNameParser(path).threshold }
}
const img_炸弹 = 读图("./images/探索$$炸弹_0_0.65.png")
const img_未知 = 读图("./images/探索$$未知块_0_0.9.png")
const img_隐藏物品 = 读图("./images/探索$$隐藏物品_0_0.9.png")
const img_边界_左上 = 读图("./images/探索_左上角_0_0.9_73_775_109_809.png")
const img_边界_右下 = 读图("./images/探索_右下角_0_0.9_973_1834_1007_1868.png")
const img_1层储物盒 = 读图("./images/探索_1层储物盒_0_0.9.png")
const img_2层储物盒11 = 读图("./images/探索_2层储物盒11_0_0.9.png")
const img_2层储物盒12 = 读图("./images/探索_2层储物盒12_0_0.9.png")
const img_2层储物盒21 = 读图("./images/探索_2层储物盒21_0_0.9.png")
const img_2层储物盒22 = 读图("./images/探索_2层储物盒22_0_0.9.png")
const img_3层储物盒11 = 读图("./images/探索_3层储物盒11_0_0.9.png")
const img_3层储物盒12 = 读图("./images/探索_3层储物盒12_0_0.9.png")
const img_3层储物盒21 = 读图("./images/探索_3层储物盒21_0_0.9.png")
const img_3层储物盒22 = 读图("./images/探索_3层储物盒22_0_0.9.png")
const img_3层储物盒31 = 读图("./images/探索_3层储物盒31_0_0.9.png")
const img_3层储物盒32 = 读图("./images/探索_3层储物盒32_0_0.9.png")
// 层结束按钮:新版为"下一层入口"
const img_结束 = 读图("./images/探索$$下一层入口_0_0.65.png")
const img_次数0 = 读图("./images/探索_无次数_0_0.97_609_1937_663_1966.png")
// "恭喜获得"弹窗:复用兑换码的恭喜获得图
const img_恭喜获得 = 读图("./images/兑换码_恭喜获得_1_0.9_438_602_637_656.jpg")
// ==================== 常量配置 ====================
const ROWS = 6;
const COLS = 5;
const CLICK_OFFSET = 50;
const SLEEP_CLICK = 1200;
const SLEEP_SHORT = 800;
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
    }
    this.init()
    let count = 0
    let noProgress = 0   // 连续无进展计数,防无限空转
    while (++count >= 0) {
      // 关闭"恭喜获得"弹窗(点隐藏物品/入口都会弹),有则关闭并继续下次循环
      if (this.close_恭喜获得()) {
        continue
      }
      let point = images.findImageInRegion(images.captureScreen(), img_结束.img, this.startX, this.startY, 5 * this.width, 6 * this.width, img_结束.threshold)
      if (point) {
        // 点隐藏物品(弹恭喜获得),先关闭再点入口,避免弹窗挡住入口按钮
        if (this.hideCell) {
          click(this.hideCell.j * this.width + this.startX + 50, this.hideCell.i * this.width + this.startY + 50)
          sleep(800)
          this.close_恭喜获得()
        }
        // 点下一层入口(也会弹恭喜获得)
        click(point.x + 50, point.y + 50)
        sleep(800)
        this.close_恭喜获得()
        this.reset()
        sleep(800)
        continue
      }
      point = images.findImageInRegion(images.captureScreen(), img_次数0.img, device.width * 0.5, device.height * 0.75, device.width * 0.2, device.height * 0.15, img_次数0.threshold)
      if (point) {
        log("次数为0", img_次数0.threshold)
        break
      }
      // 探索页识别:棋盘左上角找不到视为遮挡/离开探索页,关闭弹窗后继续
      if (!images.findImage(images.captureScreen(), img_边界_左上.img, { threshold: img_边界_左上.threshold })) {
        log("遮挡")
        click(device.width - 50, device.height - 50)
        sleep(800)
        continue
      }
      if (this.box) {
        let flag = false
        if ((this.box.type == CellType.储物盒1层 && this.boxPiece == 1)) {
          flag = true
        }
        if (this.box.type == CellType.储物盒2层 && this.boxPiece == 4) {
          flag = true
        }
        if (this.box.type == CellType.储物盒3层 && this.boxPiece == 6) {
          flag = true
        }
        if (flag) {
          //let type = this.box.type
          click(this.box.j * this.width + this.startX + 50, this.box.i * this.width + this.startY + 50)
          sleep(800)
          continue
        }
      }
      let fast = this.fastClickCell()
      if (fast == null) {
        log("8888888888888888888888")
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
      this.waitDetectArr.splice(this.waitDetectArr.indexOf(fast), 1)
      log(fast)
      log('识别次数：', count, "剩余未开格子：", this.waitDetectArr.length)
      log('------------------------------------------')
      //sleep(2000)
      click(fast.j * this.width + this.startX + 50, fast.i * this.width + this.startY + 50)

      sleep(1200)

      if (fast.type == CellType.炸弹) {
        // 行列展开:屏幕静止,复用一张截图减少找图次数;单格重试上限3次防死循环
        let cap = images.captureScreen()
        let i = -1
        let retry = 0
        while (++i < 5) {
          let tmp = this.table[fast.i][i]
          if (tmp.type == CellType.未知) {
            this.detectCell(tmp, cap, false)
            if (tmp.type != CellType.未知) {
              this.waitDetectArr.splice(this.waitDetectArr.indexOf(tmp), 1)
            } else {
              retry++
              if (retry > 3) {
                log(tmp.i, tmp.j, "识别失败超3次，跳过")
                continue
              }
              log(tmp.i, tmp.j, tmp.type, "cell 识别失败")
              i--
              sleep(1000)
            }
          }
        }
        i = -1
        retry = 0
        while (++i < 6) {
          let tmp = this.table[i][fast.j]
          if (tmp.type == CellType.未知) {
            this.detectCell(tmp, cap, false)
            if (tmp.type != CellType.未知) {
              this.waitDetectArr.splice(this.waitDetectArr.indexOf(tmp), 1)
            } else {
              retry++
              if (retry > 3) {
                log(tmp.i, tmp.j, "识别失败超3次，跳过")
                continue
              }
              log(tmp.i, tmp.j, tmp.type, "cell 识别失败")
              i--
              sleep(1000)
            }
          }
        }
        cap.recycle()
      } else {
        this.detectCell(fast, images.captureScreen(), false)
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
      let p = images.findImageInRegion(images.captureScreen(), img_恭喜获得.img, device.width * 0.3, device.height * 0.2, device.width * 0.4, device.height * 0.3, img_恭喜获得.threshold)
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
    let left_top = images.findImage(img, img_边界_左上.img, { threshold: img_边界_左上.threshold })
    let right_bottom = images.findImage(img, img_边界_右下.img, { threshold: img_边界_右下.threshold })
    if (!left_top || !right_bottom) {
      return
    }
    // 起点 x 在左上角图右侧(加模板宽);起点 y 在左上角图底部(加模板高);
    // 棋盘宽度再减掉模板图宽度,对齐实际格子区域
    this.startX = left_top.x + img_边界_左上.img.getWidth()
    this.startY = left_top.y + img_边界_左上.img.getHeight()
    let lenX = right_bottom.x + img_边界_右下.img.getWidth() - this.startX - img_边界_左上.img.getWidth()
    let lenY = right_bottom.y - this.startY
    this.width = parseInt((lenX / 5 + lenY / 6) / 2 + "")
    log(this.startX, this.startY, this.width)
    for (let i = 0; i < 6; i++) {
      // if (this.table[i] == null) {
      //   this.table[i] = new Array(5)
      // }
      for (let j = 0; j < 5; j++) {
        this.detectCell(this.getCell(i, j), img, true)
      }
    }
    //log("----------------------初始化表格-------------------------")
    //this.waitDetectArr.forEach(cell => cell.weight = this.unknownTypeWeight(cell))
    //this.print()
    //log("----------------------初始化表格-------------------------")
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
    // log("----------------------重置表格-------------------------")
    this.box = undefined
    this.boxType = undefined
    this.boxPiece = 0
    this.hideCell = undefined
    this.bombCell = undefined
    //this.waitDetectArr.forEach(cell => cell.weight = this.unknownTypeWeight(cell))
    //this.print()
    //log("----------------------重置表格-------------------------")
  }

  setBox(i: number, j: number, type: CellType.储物盒1层 | CellType.储物盒2层 | CellType.储物盒3层) {
    this.boxPiece += 1
    if (this.box) return
    this.box = this.table[i][j]
    this.boxType = type
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 5; j++) {
        this.getCell(i, j).isBox = false
      }
    }
    log(this.box)
    this.box.isBox = true
    if (type == CellType.储物盒2层) {
      this.getCell(i, j + 1).isBox = true
      this.getCell(i + 1, j).isBox = true
      this.getCell(i + 1, j + 1).isBox = true
    } else if (type == CellType.储物盒3层) {
      this.getCell(i, j + 1).isBox = true
      this.getCell(i + 1, j).isBox = true
      this.getCell(i + 1, j + 1).isBox = true
      this.getCell(i + 2, j).isBox = true
      this.getCell(i + 2, j + 1).isBox = true
    }
  }

  // private detectCell(cell: Cell, img: ImageWrapper) {
  //   const x = this.startX + cell.j * this.width;
  //   const y = this.startY + cell.i * this.width;
  //   const w = this.width;

  //   // 隐藏物品
  //   if (images.findImageInRegion(img, img_隐藏物品, x, y, w, w)) {
  //     cell.type = CellType.隐藏物品;
  //     cell.isBox = false;
  //     this.hideCell = cell;
  //     return;
  //   }

  //   // 炸弹
  //   if (images.findImageInRegion(img, img_炸弹, x, y, w, w)) {
  //     cell.type = CellType.炸弹;
  //     cell.isBox = false;
  //     this.bombCell = cell;
  //     this.waitDetectArr.push(cell);
  //     return;
  //   }

  //   // 储物盒（合并匹配）
  //   const patterns = [
  //     { img: img_1层储物盒, di: 0, dj: 0, type: CellType.储物盒1层 },
  //     { img: img_2层储物盒11, di: 0, dj: 0, type: CellType.储物盒2层 },
  //     { img: img_2层储物盒12, di: 0, dj: -1, type: CellType.储物盒2层 },
  //     { img: img_2层储物盒21, di: -1, dj: 0, type: CellType.储物盒2层 },
  //     { img: img_2层储物盒22, di: -1, dj: -1, type: CellType.储物盒2层 },
  //     { img: img_3层储物盒11, di: 0, dj: 0, type: CellType.储物盒3层 },
  //     { img: img_3层储物盒12, di: 0, dj: -1, type: CellType.储物盒3层 },
  //     { img: img_3层储物盒21, di: -1, dj: 0, type: CellType.储物盒3层 },
  //     { img: img_3层储物盒22, di: -1, dj: -1, type: CellType.储物盒3层 },
  //     { img: img_3层储物盒31, di: -2, dj: 0, type: CellType.储物盒3层 },
  //     { img: img_3层储物盒32, di: -2, dj: -1, type: CellType.储物盒3层 },
  //   ];

  //   for (const p of patterns) {
  //     if (images.findImageInRegion(img, p.img, x, y, w, w)) {
  //       const ri = cell.i + p.di;
  //       const rj = cell.j + p.dj;
  //       cell.type = p.type;
  //       this.setBox(ri, rj, p.type);
  //       return;
  //     }
  //   }

  //   // 默认处理
  //   if (images.findImageInRegion(img, img_未知, x, y, w, w)) {
  //     this.waitDetectArr.push(cell);
  //   } else {
  //     cell.type = CellType.已知;
  //     cell.isBox = false;
  //     cell.weight = 0;
  //   }
  // }
  detectCell(cell: Cell, img: ImageWrapper = images.captureScreen(), first: boolean = true) {
    if (!first && this.box && cell.isBox) {
      cell.type = this.boxType!
      this.boxPiece += 1
      log("盒子以定位，当前为盒子部分", cell)
      return
    }
    let x = this.startX + cell.j * this.width
    let y = this.startY + cell.i * this.width
    let tmp = images.clip(img, x, y, this.width, this.width)
    images.save(tmp, "/sdcard/" + cell.i + "-" + cell.j + ".png")
    tmp.recycle()
    if (images.findImageInRegion(img, img_未知.img, x, y, this.width, this.width, img_未知.threshold)) {
      this.waitDetectArr.push(cell)
    } else if (images.findImageInRegion(img, img_隐藏物品.img, x, y, this.width, this.width, img_隐藏物品.threshold)) {
      cell.type = CellType.隐藏物品
      cell.isBox = false
      this.hideCell = cell
    } else if (images.findImageInRegion(img, img_炸弹.img, x, y, this.width, this.width, img_炸弹.threshold)) {
      cell.type = CellType.炸弹
      cell.isBox = false
      this.waitDetectArr.push(cell)
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
    } else {
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
        log(cell)
      }
      cell.weight = this.unknownTypeWeight(cell)
      if (cell.weight > fast.weight) {
        fast = cell
      }
    }
    return fast
  }

  cellWeight(cell: Cell) {
    let weight: number = 0
    if (cell.type == CellType.未知) weight++
    if (cell.type == CellType.隐藏物品) weight += 6
    return weight
  }
}


