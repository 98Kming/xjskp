import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, tryCloseModals } from '../utils/img'

export class 随机事件 extends BasePage {
  name = '随机事件'
  is = createPageDetector('images/随机事件_1_0.9_441_624_637_682.png')

  private 领取列表 = [
    createRouteAction('images/随机事件$$领取-答应交易_1_0.9_263_1138_444_1192.png'),
    createRouteAction('images/随机事件$$领取-立即隔离_1_0.9_254_1139_451_1192.png'),
    createRouteAction('images/随机事件$$领取-立即净化_1_0.9_264_1432_445_1480.png'),
    createRouteAction('images/随机事件$$领取-批准进入_1_0.9_269_1432_444_1482.png'),
    createRouteAction('images/随机事件$$领取-加强巡逻_1_0.9_637_1134_816_1192.png'),
    createRouteAction('images/随机事件$$领取-优先民生_1_0.9_639_1434_817_1479.png'),
    createRouteAction('images/随机事件$$领取-前往搜救_1_0.9_266_1434_441_1481.png'),
    createRouteAction('images/随机事件$$领取-暂时收留_1_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-没收严惩_1_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-允许进入_1_0.9_641_1434_814_1478.png'),
    createRouteAction('images/随机事件$$领取-出兵支援_1_0.9_269_1432_444_1482.png'),
    createRouteAction('images/随机事件$$领取-收留驯养_1_0.9_263_1432_445_1482.png'),
    createRouteAction('images/随机事件$$领取-欣然接受_1_0.9_452_1434_630_1479.png'),
    createRouteAction('images/随机事件$$领取-监听情报_1_0.9_269_1434_441_1477.png'),
    createRouteAction('images/随机事件$$领取-保留药品_1_0.9_638_1432_817_1479.png'),
    createRouteAction('images/随机事件$$领取-冒险搜查_1_0.9_266_1435_444_1479.png'),
    createRouteAction('images/随机事件$$领取-强行采集_1_0.9_266_1435_444_1479.png'),
    createRouteAction('images/随机事件$$领取-同意交易_1_0.9_269_1435_440_1478.png'),
    createRouteAction('images/随机事件$$领取-主动清缴_1_0.9_270_1436_439_1476.png'),
    createRouteAction('images/随机事件$$领取-尽力挽留_1_0.9_640_1438_810_1475.png'),
    createRouteAction('images/随机事件$$领取-允许入内_1_0.9_268_1434_439_1477.png'),
  ]

  private 委婉拒绝Action = createRouteAction('images/随机事件$$领取-委婉拒绝_1_0.9_254_1139_451_1192.png')
  private 确定Action = createRouteAction('images/随机事件$$领取-确定_1_0.9_478_1134_613_1192.png')

  /**
   * 检测当前页面是否已结束（出现结束按钮）
   */
  hasEnded(): boolean {
    return imageDetector('images/随机事件$$领取-结束_1_0.9_435_1425_654_1482.png')
  }

  /**
   * 随机事件页面
   * 领取列表出现过的需要点
   * 出现焕新试剂的需要日志输出
   * 出现委婉拒绝的同时没出现焕新试剂的需要点
   * 出现结束、或出现焕新试剂的退出循环，这种情况随机事件的入口还会存在
   */
  领取(): boolean {
    var claimed = false
    var idleRounds = 0

    while (true) {
      var found = false

      // 焕新试剂检测：出现即退出（入口仍在）
      let flag = imageDetector("images/_焕新试剂_0_0.9_0_0_w_h.png")
      if (flag) {
        log("★ 焕新试剂")
        break
      }

      // 结束检测：出现即退出（入口仍在）
      if (this.hasEnded()) {
        break
      }

      for (var i = 0; i < this.领取列表.length; i++) {
        if (this.领取列表[i]()) {
          sleep(1000)
          claimed = true
          found = true
          idleRounds = 0
          break  // 扫到就点，下一轮从头再扫
        }
      }

      if(this.确定Action()) {
        sleep(1000)
        this.back()
        sleep(800)
      }

      // 委婉拒绝按钮（焕新试剂不存在时 — 上面已 break，此处 flag 必为 false）
      if (this.委婉拒绝Action()) {
        claimed = true
        found = true
        idleRounds = 0
      }

      if (!found) {
        if (claimed) {
          log('[随机事件] 无新按钮，可能有未添加模板的按钮等待收录')
          break
        }
        idleRounds++
        if (idleRounds >= 5) break  // 等约 4 秒仍无按钮 → 放弃
        sleep(800)                  // 还没出现过，等入口
      }
    }
    return claimed
  }

  routes(): Route[] {
    return []
  }
}
