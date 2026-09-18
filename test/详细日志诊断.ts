// test/详细日志诊断.ts — 诊断"详细日志"开关的落盘行为
// 运行:AutoJs6 打开 dist/详细日志诊断.js 执行,把日志贴回给 Claude
// 预期:开启后日志文件生成且含 MARK-A 标记;关闭后文件长度不再变化
import { setupDetailLog } from '../src/utils/logger'

log('===== 详细日志诊断开始 =====')
log('[诊断] files.cwd() = ' + files.cwd())

// 1. 开启:应生成文件,且配置之后的日志写入文件
var 文件 = setupDetailLog(true)
log('[诊断] setupDetailLog(true) 返回: ' + 文件)
if (!文件) {
  log('[诊断] ❌ 失败:返回 null')
} else {
  log('[诊断] 文件存在: ' + files.exists(文件))
  log('MARK-A-' + Date.now())
  sleep(1500)
  var 内容 = files.read(文件)
  log('[诊断] 开启后文件长度: ' + 内容.length)
  log('[诊断] 含 MARK-A 标记(应为 true): ' + (内容.indexOf('MARK-A-') >= 0))

  // 2. 关闭:再写日志不得进入文件
  setupDetailLog(false)
  var 长度前 = files.read(文件).length
  log('MARK-B-' + Date.now())
  sleep(1500)
  var 长度后 = files.read(文件).length
  log('[诊断] 关闭后写入前长度: ' + 长度前)
  log('[诊断] 关闭后写入后长度: ' + 长度后)
  log('[诊断] 已停止写入(应为 true): ' + (长度前 === 长度后))
}
log('===== 详细日志诊断结束 =====')
