// test/技能策略诊断.ts — 诊断"重置技能优先级"读取 seekbar 配置的问题
// 运行:AutoJs6 打开 dist/技能策略诊断.js 执行,把日志贴回给 Claude
// 预期:seekbar 的 getProgress() 应等于 UI 上显示的值;resetProgress 后权重应随 seekbar 变化
import { mainWindow } from '../src/MainWindow'
import { skillStrategy } from '../src/utils/技能策略'

// 切到技能 tab,确保 seekbar 控件已创建
ui.run(function () {
  mainWindow.window.viewPager.setCurrentItem(1)
})
sleep(2500)

log('===== 技能策略诊断开始 =====')
var seekbarNames = ['子弹', '元素子弹', '温压弹', '干冰弹', '电磁穿刺', '装甲车', '冰暴发生器', '旋风加农', '燃油弹', '无人机']
for (var i = 0; i < seekbarNames.length; i++) {
  var n = seekbarNames[i]
  var view = (mainWindow.window as any)[n + '_seekbar']
  try {
    var p = view.widget.getProgress()
    log('[' + n + '_seekbar] widget.getProgress() = ' + p + '  ← 应等于 UI 上显示的值')
  } catch (e) {
    log('[' + n + '_seekbar] 读取异常: ' + e)
  }
}

log('--- 重置前 weight(progressMap 未初始化,应为基础权重) ---')
var 测试技能 = ['每次射击连发数+1', '温压弹连发', '电磁裂变', '干冰弹增伤', '连续出击']
var 前权重: any = {}
for (var i = 0; i < 测试技能.length; i++) {
  var w = skillStrategy.weight(测试技能[i])
  前权重[测试技能[i]] = w.weight
  log('[' + 测试技能[i] + '] weight=' + w.weight + ' match=' + w.match.source)
}

log('--- 调用 resetProgress() ---')
skillStrategy.resetProgress()

log('--- 重置后 weight(应与重置前不同,差值 = -progressMap*5) ---')
for (var i = 0; i < 测试技能.length; i++) {
  var w2 = skillStrategy.weight(测试技能[i])
  log('[' + 测试技能[i] + '] weight=' + 前权重[测试技能[i]] + ' → ' + w2.weight + ' (差=' + (w2.weight - 前权重[测试技能[i]]) + ')')
}

log('===== 技能策略诊断结束 =====')
