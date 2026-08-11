import { BasePage, Route } from './BasePage'
import { createPageDetector, createRouteAction, imageDetector, imageNameParser, getTemplate, screen, toScreenX, toScreenY } from '../utils/img'
import { 暂停战斗 } from './暂停战斗'
import { 选择技能 } from './选择技能'
import { 战斗结束 } from './战斗结束'
import { skillStrategy } from '../utils/技能策略'
import { mainWindow } from '../MainWindow'

// 页面识别：暂停按钮 或 已激活技能弹窗出现均算战斗中（宽识别，仅服务 Router 导航）。
// 弹窗打开时暂停按钮/技能图标可能仍可见（在选择技能/暂停战斗/战斗结束页也能匹配），
// 弹窗状态一律由 自动战斗 状态机按优先级分派，不依赖 Router 页面识别
var 暂停检测 = createPageDetector('images/战斗中$_暂停_1_0.9_66_50_102_200.png', true)
var 已激活技能弹窗检测 = createPageDetector('images/战斗中_已激活技能_0_0.9_404_0_674_740.png')

export class 战斗中 extends BasePage {
  name = '战斗中'
  is = function (img: ImageWrapper): boolean {
    return 暂停检测(img) || 已激活技能弹窗检测(img)
  }

  /** 点击暂停按钮，弹出暂停面板 */
  暂停(): boolean {
    return createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_200.png')()
  }

  /** 开启 15 倍速（找到"15倍速-关闭"按钮时点击） */
  开15倍速(): boolean {
    return createRouteAction('images/战斗中$$15倍速-关闭_1_0.9_49_325_115_353.png')()
  }

  /** 检测 15 倍速是否已开启 */
  已开15倍速(): boolean {
    return !!imageDetector('images/战斗中_15倍速-开启_0_0.9_43_326_119_352.png')
  }

  /** 技能选择弹窗是否出现（弹窗标题"选择技能"识别，与选择技能页共用识别图） */
  技能弹窗出现(): boolean {
    return !!imageDetector('images/选择技能_0_0.8_438_729_645_1143.png')
  }

  /**
   * 关闭"已激活技能"弹窗：点弹窗匹配点上方空白（暗色遮罩）。
   * x 用弹窗中心（约 539，远离左上角暂停按钮 66-102）；匹配点贴近屏顶时改点弹窗下方。
   */
  关闭已激活技能弹窗(): boolean {
    var filePath = 'images/战斗中_已激活技能_0_0.9_404_0_674_740.png'
    var parsed = imageNameParser(filePath)
    var template = getTemplate(filePath)
    var img = screen()
    var point = images.findImageInRegion(img, template, parsed.x1, parsed.y1, parsed.x2 - parsed.x1, parsed.y2 - parsed.y1, parsed.threshold)
    if (!point) return false
    var cx = toScreenX(point.x + template.width / 2)
    var cy = toScreenY(point.y > 150 ? point.y - 100 : point.y + template.height + 150)
    click(cx, cy)
    log('[战斗中] 关闭已激活技能弹窗，点击空白 (' + cx + ', ' + cy + ')')
    return true
  }

  /** 确定（技能弹窗确认按钮） */
  确定(): boolean {
    return createRouteAction('images/选择技能$$确定_0_0.9_531_1611_628_1656.png')()
  }

  /** 重新连接弹窗：网络波动时出现，找到"重新连接"按钮点击 */
  重新连接(): boolean {
    return createRouteAction('images/重新连接_1_0.9_635_1460_847_1513.png')()
  }

  /**
   * 战斗状态机：每 1s 检测一次，按弹窗优先级分派。
   * 弹窗页识别图优先（弹窗打开时"战斗中"宽识别也匹配，不能靠 Router 分派）：
   *   1. 选择技能弹窗 → 自动选技能（连弹组选完弹窗自动关闭）
   *   2. 暂停战斗弹窗 → 到达退出等级则提前结算，否则继续战斗
   *   3. 战斗结束页 → 重置局内状态，退出循环
   *   4. 已激活技能弹窗 → 点弹窗外空白关闭（放战斗结束之后：结算页该模板可能残留匹配）
   *   5. 重新连接弹窗 → 点击重连（放兜底之前：重连时"战斗中"宽识别可能仍匹配）
   *   6. 兜底：仍在战斗，维护 15 倍速
   * 与 选择技能/战斗结束 互相 import（循环依赖），但均在方法调用时才引用，运行时安全。
   */
  自动战斗(): void {
    var 选择技能Page = new 选择技能()
    var 暂停战斗Page = new 暂停战斗()
    var 战斗结束Page = new 战斗结束()
    var 倍速检查 = 0
    while (true) {
      sleep(1000)
      var img = screen()
      // 1. 技能弹窗：自动选技能（弹窗关闭后 continue 重新检测）
      if (选择技能Page.is(img)) {
        log('[战斗中] 技能弹窗，自动选择技能')
        选择技能Page.选最优技能()
        continue
      }
      // 2. 暂停弹窗：到达退出等级提前结算，否则继续战斗
      if (暂停战斗Page.is(img)) {
        if (this.到达退出等级()) {
          log('[战斗中] 达到退出等级，提前结算')
          暂停战斗Page.结束战斗()
          continue // 结算后进入战斗结束页，下轮循环处理
        }
        log('[战斗中] 暂停弹窗，继续战斗')
        暂停战斗Page.继续()
        continue
      }
      // 3. 战斗结束：重置局内状态，退出循环
      if (战斗结束Page.is(img)) {
        log('[战斗中] 战斗结束，重置局内技能状态')
        skillStrategy.resetPriority()
        break
      }
      // 4. 已激活技能弹窗：点弹窗外空白关闭
      if (已激活技能弹窗检测(img)) {
        this.关闭已激活技能弹窗()
        continue
      }
      // 5. 重新连接弹窗：网络波动时出现，点击重连后等待（重连时"战斗中"宽识别可能仍匹配，须在兜底前）
      if (this.重新连接()) {
        log('[战斗中] 重新连接弹窗，点击重连')
        sleep(3000) // 等重连完成，避免下轮截图未更新误判
        continue
      }
      // 6. 兜底：仍在战斗（"开始游戏"未开启时用户可能还没进战斗，等暂停按钮出现）
      if (暂停检测(img)) {
        // 到达退出等级：点暂停开面板，由暂停分支结算退出
        if (this.到达退出等级()) {
          log('[战斗中] 达到退出等级，暂停退出')
          this.暂停()
          continue
        }
        // 每 5 次循环检查一次 15 倍速（减少找图次数）
        倍速检查++
        if (倍速检查 % 5 === 0 && !this.已开15倍速()) {
          this.开15倍速()
        }
      } else {
        log('[战斗中] 未识别到战斗 UI，等待进入战斗')
      }
    }
  }

  /**
   * 是否到达退出等级（提前结算）。
   * 配置"退出等级"未启用（null）或 99（不提前退出）时不退出；
   * 等级 1：角色开局即 1 级，必然到达 → 进去直接退出。
   * TODO: 等级 >1 时需读取战斗中当前等级（OCR/模板）与目标比较，暂不支持
   */
  private 到达退出等级(): boolean {
    var 目标 = mainWindow.window.退出等级.widget.getValue()
    if (目标 === null || 目标 >= 99) return false
    if (目标 <= 1) return true
    log('[战斗中] 退出等级 ' + 目标 + ' 的等级判定未实现（暂仅支持等级 1）')
    return false
  }

  routes(): Route[] {
    return [
      // 点暂停 → 暂停面板
      { target: 暂停战斗, action: createRouteAction('images/战斗中$_暂停_1_0.9_66_50_102_200.png'), imagePath: 'images/战斗中$_暂停_1_0.9_66_50_102_200.png' },
    ]
  }
}
