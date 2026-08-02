import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, screen, width, height, getTemplate, imageNameParser, ocrText } from '../utils/img'
import { launchPackageByShell } from '../utils/app'
import { currentServer } from '../daily'

export class 再别前线废土互市 extends BasePage {
  name = '再别前线-废土互市'
  is = createPageDetector('images/废土互市_1_0.9_331_2274_495_2317.png')

  /**
   * 收购价检测:找到"收购价"文字后,OCR 其右边 145px 区域取价格数字,
   * 价格 > 900 则复制转发(逻辑参考速度角力-车友集会)
   */
  收购价(): boolean {
    var filePath = 'images/废土互市_收购价_1_0.9_364_1751_553_1792.png'
    var parsed = imageNameParser(filePath)
    var template = getTemplate(filePath)
    var rw = parsed.x2 - parsed.x1
    var rh = parsed.y2 - parsed.y1
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, rw, rh, parsed.threshold)
    if (!point) return false
    // 收购价右边 145px 区域 OCR 价格数字
    // y 上移 2px、高 +6:价格数字比"收购价"文字高,顶部被切会导致 980 误识别成 086
    var text = ocrText(img, point.x + template.width, point.y - 5, 145, template.height + 9)
    // 去掉所有非数字字符再取整,兼容千分位(如 "1,600")
    var num = parseInt(text.replace(/[^0-9]/g, '')) || 0
    var serverTag = currentServer ? ' [' + currentServer + ']' : ''
    if (!num || num < 900) {
      log(serverTag + '[废土互市] 收购价', text, '低于 900，跳过')
      return false
    }
    log(serverTag + '[废土互市] 收购价', num, '> 900，执行复制转发')
    // 点转发 → 分享面板弹出
    if (!createRouteAction('images/废土互市$$转发_1_0.9_987_361_1029_394.png')()) return false
    sleep(500)
    // 点复制 → 文本进入剪贴板
    if (!createRouteAction('images/废土互市$$复制_1_0.9_851_1230_894_1278.png')()) return false
    sleep(300)
    // 切 AutoJs6 前台前记录游戏包名(此时游戏在前台,currentPackage 100% 准确)
    var gamePkg = currentPackage()
    click(width - 50, height - 50)
    // 切 AutoJs6 前台读取剪贴板(Android 16 后台读剪贴板受限,前台可读)
    launch(context.getPackageName())
    sleep(2000)
    // 组装抢购码并写回剪贴板
    var str = (getClip() || '') + ' 抢购码 ' + num
    log(serverTag + '[废土互市] 剪贴板', str)
    setClip(str)
    sleep(500)
    click(width - 50, height - 50)
    // 回游戏:优先 root shell 启动(ColorOS 拦截应用层后台启动弹确认框,shell 启动实测不被拦截)
    if (!launchPackageByShell(gamePkg)) {
      // 无 root 或启动失败:退化为普通 launch(可能弹确认框,但至少回得去)
      launch(gamePkg)
    }
    return true
  }

  routes(): Route[] {
    return []
  }
}
