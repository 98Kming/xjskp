import { currentServer } from '../model/daily'
import { BasePage, Route } from './BasePage'
import { screen, createPageDetector, createRouteAction, getTemplate, imageDetector, imageNameParser, tryCloseModals, ocrText, waitObtain, waitScreen } from '../utils/img'
import { sharedImages } from '../images'

const IMG = {
  ...sharedImages,
  页面: 'images/随机事件_1_0.9_441_915_637_973.png',
  答应交易: 'images/随机事件$$领取-答应交易_1_0.9_263_1429_444_1483.png',
  立即隔离: 'images/随机事件$$领取-立即隔离_1_0.9_254_1430_451_1483.png',
  立即净化: 'images/随机事件$$领取-立即净化_1_0.9_264_1432_445_1480.png',
  批准进入: 'images/随机事件$$领取-批准进入_1_0.9_269_1432_444_1482.png',
  加强巡逻: 'images/随机事件$$领取-加强巡逻_1_0.9_637_1425_816_1483.png',
  优先民生: 'images/随机事件$$领取-优先民生_1_0.9_639_1434_817_1479.png',
  前往搜救: 'images/随机事件$$领取-前往搜救_1_0.9_266_1434_441_1481.png',
  暂时收留: 'images/随机事件$$领取-暂时收留_1_0.9_641_1434_814_1478.png',
  没收严惩: 'images/随机事件$$领取-没收严惩_1_0.9_641_1434_814_1478.png',
  允许进入: 'images/随机事件$$领取-允许进入_1_0.9_641_1434_814_1478.png',
  出兵支援: 'images/随机事件$$领取-出兵支援_1_0.9_269_1432_444_1482.png',
  收留驯养: 'images/随机事件$$领取-收留驯养_1_0.9_263_1432_445_1482.png',
  监听情报: 'images/随机事件$$领取-监听情报_1_0.9_269_1434_441_1477.png',
  保留药品: 'images/随机事件$$领取-保留药品_1_0.9_638_1432_817_1479.png',
  冒险搜查: 'images/随机事件$$领取-冒险搜查_1_0.9_266_1435_444_1479.png',
  强行采集: 'images/随机事件$$领取-强行采集_1_0.9_266_1435_444_1479.png',
  同意交易: 'images/随机事件$$领取-同意交易_1_0.9_269_1435_440_1478.png',
  主动清缴: 'images/随机事件$$领取-主动清缴_1_0.9_270_1436_439_1476.png',
  尽力挽留: 'images/随机事件$$领取-尽力挽留_1_0.9_640_1438_810_1475.png',
  允许入内: 'images/随机事件$$领取-允许入内_1_0.9_268_1434_439_1477.png',
  委婉拒绝: 'images/随机事件$$领取-委婉拒绝_1_0.9_254_1430_451_1483.png',
  确定: 'images/随机事件$$领取-确定_1_0.9_478_1425_613_1483.png', // 覆盖共享键($确定通用按钮):本页领取按钮
  低价买入: 'images/随机事件$$领取-低价买入_1_0.9_641_1433_813_1477.png',
  欣然接受: 'images/随机事件$$领取-欣然接受_1_0.9_452_1434_630_1479.png',
  结束: 'images/随机事件$$领取-结束_1_0.9_435_1425_654_1482.png',
  焕新试剂: 'images/_焕新试剂_0_0.9_0_0_w_h.png',
}

export class 随机事件 extends BasePage {
  name = '随机事件'
  is = createPageDetector(IMG.页面)

  private 领取列表 = [
    createRouteAction(IMG.答应交易),
    createRouteAction(IMG.立即隔离),
    createRouteAction(IMG.立即净化),
    createRouteAction(IMG.批准进入),
    createRouteAction(IMG.加强巡逻),
    createRouteAction(IMG.优先民生),
    createRouteAction(IMG.前往搜救),
    createRouteAction(IMG.暂时收留),
    createRouteAction(IMG.没收严惩),
    createRouteAction(IMG.允许进入),
    createRouteAction(IMG.出兵支援),
    createRouteAction(IMG.收留驯养),
    createRouteAction(IMG.监听情报),
    createRouteAction(IMG.保留药品),
    createRouteAction(IMG.冒险搜查),
    createRouteAction(IMG.强行采集),
    createRouteAction(IMG.同意交易),
    createRouteAction(IMG.主动清缴),
    createRouteAction(IMG.尽力挽留),
    createRouteAction(IMG.允许入内),
  ]

  private 委婉拒绝Action = createRouteAction(IMG.委婉拒绝)
  private 确定Action = createRouteAction(IMG.确定)
  private 低价买入Action = createRouteAction(IMG.低价买入)
  private 欣然接受Action = createRouteAction(IMG.欣然接受)

  /**
   * 检测当前页面是否已结束（出现结束按钮）
   */
  hasEnded(): boolean {
    return !!imageDetector(IMG.结束)
  }

  /**
   * 随机事件页面
   * 领取列表出现过的需要点
   * 出现焕新试剂的需要日志输出
   * 出现委婉拒绝的同时没出现焕新试剂的需要点
   * 出现结束、或出现焕新试剂的退出循环，这种情况随机事件的入口还会存在
   */
  领取(): boolean {
    var found = false
    while (!this.hasEnded()) {
      var tmpFound = false
      if (this.焕新试剂Action() || this.委婉拒绝Action() || this.欣然接受Action()) {
        found = true
        tmpFound = true
        waitObtain(2000)
        sleep(800)
      }
      for (var i = 0; i < this.领取列表.length; i++) {
        if (this.领取列表[i]()) {
          sleep(800)
        }
        if (this.确定Action()) {
          found = true
          tmpFound = true
          waitObtain(2000)
          sleep(800)
        }
      }
      if (!tmpFound) {
        if (this.is(screen())) {
          log('[随机事件] 有未添加的按钮等待收录')
          found = false
        }
        break
      }
    }
    return found
  }

  private 焕新试剂Action() {
    let 焕新试剂_img = IMG.焕新试剂
    var template = getTemplate(焕新试剂_img)
    let img = screen(0)
    var point = imageDetector(焕新试剂_img, img)
    if (point) {
      let tmp = images.clip(img, point.x, point.y, template.width + 30, template.height + 10)
      images.save(tmp, '/sdcard/' + (currentServer ? currentServer + '_' : '') + Date.now() + '.png')
      log("★ 焕新试剂", gmlkit.ocr(tmp, 'zh')?.text, point.x, point.y, template.width + 10, template.height + 10)
      tmp.recycle()
      return this.低价买入Action(img)
    }
    return false
  }

  routes(): Route[] {
    return []
  }
}
