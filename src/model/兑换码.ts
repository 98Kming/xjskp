import { tryCloseModals, getTemplate, screen, width, height } from "../utils/img"

type Data = {
  last_page: number,
  data: Array<{
    name: string,
    code: string,
  }>
}
export enum 兑换结果 {
  成功, 领取过, 过期, 不存在, 识别失败, 错误
}
type RedeemCode = {
  updateTime: number,
  failCodes: string[],
  successCodes: string[]
}
const xjskp = storages.create("xjskp")
let redeemCode: RedeemCode = {
  updateTime: 0,
  failCodes: [],
  successCodes: []
}
try {
  let str = xjskp.get("redeemCode")
  if (str) {
    redeemCode = JSON.parse(str) as RedeemCode
  }
} catch (error) {
  console.error("兑换码缓存异常，清除缓存")
  xjskp.remove("redeemCode")
}
log("兑换码缓存", redeemCode.failCodes.length + redeemCode.successCodes.length)
log(redeemCode.successCodes)
/**
 * 从api获取兑换码，获取的兑换码可能失效（过期、不存在、错误）
 * 本地分别缓存生效和失效的兑换码
 * 增量更新本地兑换码
 * 使用兑换码时，先判断缓存，缓存不存在则从api获取，并跳过失效兑换码
 */
export class 兑换码 {
  static 兑换_point: OpenCV.Point
  static 恭喜获得_point?: { x: number, y: number }
  static img_兑换 = getTemplate("images/兑换码_兑换_1_0.9_758_1198_849_1245.png");
  static img_兑换码_领取过 = getTemplate("images/兑换码_兑换码领取过_1_0.9_80_925_981_992.jpg")
  static img_兑换码_恭喜获得 = getTemplate("images/兑换码_恭喜获得_1_0.9_438_602_637_656.jpg")
  static img_兑换码_冷却 = getTemplate("images/兑换码_兑换冷却_1_0.9_80_925_981_992.jpg")
  static img_兑换码_过期 = getTemplate("images/兑换码_兑换码过期_1_0.9_80_925_981_992.jpg")
  static img_兑换码_不存在 = getTemplate("images/兑换码_兑换码不存在_1_0.9_80_925_981_992.jpg")
  static img_兑换码_错误 = getTemplate("images/兑换码_错误_1_0.9_80_925_981_992.png")
  static has_兑换(img: ImageWrapper) {
    let point = images.findImageInRegion(img, this.img_兑换,
      width * 0.6, height * 0.5, width * 0.3, height * 0.3)
    if (point) {
      this.兑换_point = point
      return true
    }
    return false
  }
  static click_兑换() {
    click(this.兑换_point!.x, this.兑换_point!.y)
  }
  static has_恭喜获得(img: ImageWrapper) {
    let point = images.findImageInRegion(img, this.img_兑换码_恭喜获得,
      width * 0.3, height * 0.2, width * 0.4, height * 0.3)
    if (point) {
      this.恭喜获得_point || (this.恭喜获得_point = { x: point.x, y: point.y - 200 })
      return true
    }
    return false
  }
  static has_领取过(img: ImageWrapper) {
    return !!images.findImageInRegion(img, this.img_兑换码_领取过,
      width * 0.2, height * 0.4, width * 0.5, height * 0.3)
  }
  static has_冷却中(img: ImageWrapper) {
    return !!images.findImageInRegion(img, this.img_兑换码_冷却,
      width * 0.2, height * 0.4, width * 0.5, height * 0.3)
  }

  static has_过期(img: ImageWrapper) {
    return !!images.findImageInRegion(img, this.img_兑换码_过期,
      width * 0.2, height * 0.4, width * 0.5, height * 0.3)
  }

  static has_不存在(img: ImageWrapper) {
    return !!images.findImageInRegion(img, this.img_兑换码_不存在,
      width * 0.2, height * 0.4, width * 0.5, height * 0.3)
  }
  static has_错误(img: ImageWrapper) {
    return !!images.findImageInRegion(img, this.img_兑换码_错误,
      200, height * 0.4, 800, height * 0.3)
  }

  static start() {
    let successCount = 0
    let page = 0
    let max = 1
    let successCodes = []
    let failCodes = []
    while (++page <= max) {
      let r = http.get(`https://jshi.xiaopidd.com/api.applet/getNcodesListV2?lmid=0&cid=1&page=${page}&limit=10`);
      let data = r!.body.json().data as Data
      let arr = data.data
      max = data.last_page
      console.log("第", page, "页，共", arr.length, "个")
      for (let obj of arr) {
        if (!obj.code) {
          failCodes.push(obj.code)
          continue
        }
        if (redeemCode.successCodes.includes(obj.code) || redeemCode.failCodes.includes(obj.code)) {
          max = 0
          log("该兑换码已缓存")
          break
        }
        log("兑换码:", obj.code)
        switch (this.action_兑换(obj.code)) {
          case 兑换结果.成功:
            successCount++
          case 兑换结果.领取过:
            successCodes.push(obj.code)
            break
          case 兑换结果.不存在:
          case 兑换结果.过期:
          case 兑换结果.错误:
          case 兑换结果.识别失败:
            failCodes.push(obj.code)
            break
        }
      }
    }
    let i = 0;
    while (i < redeemCode.successCodes.length) {
      let code = redeemCode.successCodes[i]
      switch (this.action_兑换(code)) {
        case 兑换结果.成功:
          successCount++
        case 兑换结果.领取过:
          i++
          break
        case 兑换结果.不存在:
          console.error("缓存兑换码不存在:" + code)
          redeemCode.successCodes.splice(i, 1)
          redeemCode.failCodes.push(code)
          break
        case 兑换结果.过期:
          console.error("缓存兑换码过期:" + code)
          redeemCode.successCodes.splice(i, 1)
          redeemCode.failCodes.push(code)
          break
        case 兑换结果.错误:
          console.error("缓存兑换码错误:" + code)
          redeemCode.successCodes.splice(i, 1)
          redeemCode.failCodes.push(code)
          break
        case 兑换结果.识别失败:
          console.error("缓存兑换码识别失败:" + code)
          redeemCode.successCodes.splice(i, 1)
          redeemCode.failCodes.push(code)
          break
      }
    }
    log("本次一共兑换:" + successCount + "个兑换码")
    redeemCode.successCodes = successCodes.concat(redeemCode.successCodes)
    redeemCode.failCodes = failCodes.concat(redeemCode.failCodes)
    xjskp.put("redeemCode", JSON.stringify(redeemCode))
  }

  static action_兑换(code: string) {
    let retries = 0
    const maxRetries = 30
    while (retries < maxRetries) {
      retries++
      let img = screen(0)
      if (this.has_兑换(img)) {
        click(this.兑换_point.x / 2, this.兑换_point.y + 20)
        sleep(300)
        // 输入法输入框
        let edit = className("android.widget.EditText").findOnce()
        if (edit) {
          edit.setText(code)
        } else {
          // 模拟器
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          KeyCode(67)
          text(code)
        }
        sleep(300)
        click(500, 300) // 关闭兑换码输入框弹窗
        sleep(300)
        let res
        let clickRetries = 0
        const maxClickRetries = 5
        do {
          if (clickRetries >= maxClickRetries) break
          clickRetries++
          click(this.兑换_point.x, this.兑换_point.y)
          res = this.兑换结果()
          if (res != 兑换结果.识别失败) {
            return res
          }
        } while (this.has_兑换(screen(0)))
        // 内层循环 5 次仍无法识别结果：代码已提交，无需外层重试
        log("兑换结果识别失败", code)
        return 兑换结果.识别失败
      } else if (tryCloseModals()) {
        
      }
      sleep(3000)
    }
    log("兑换码操作超过最大重试次数", maxRetries)
    return 兑换结果.识别失败
  }
  static 兑换结果() {
    let unIdentifyNum = 0
    while (unIdentifyNum < 5) {
      sleep(300)
      let img = screen(0)
      if (this.has_恭喜获得(img)) {
        do {
          click(this.恭喜获得_point!.x, this.恭喜获得_point!.y)
          sleep(500)
        } while (this.has_恭喜获得(screen(0)))
        return 兑换结果.成功
      } else if (this.has_领取过(img)) {
        return 兑换结果.领取过
      } else if (this.has_过期(img)) {
        return 兑换结果.过期
      } else if (this.has_不存在(img)) {
        log("兑换码不存在", img.hashCode())
        return 兑换结果.不存在
      } else if (this.has_错误(img)) {
        return 兑换结果.错误
      } else if (this.has_冷却中(img)) {
        log("冷却中", img.hashCode())
        sleep(2 * 60 * 1000)
        return 兑换结果.识别失败
      } else {
        log("未识别到兑换结果", unIdentifyNum, img.hashCode())
        unIdentifyNum++
      }
    }
    return 兑换结果.识别失败
  }
}