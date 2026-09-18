/**
 * 详细日志:把 console 输出持久化到设备文件,供事后排查。
 * AutoX.js 文档: console.setGlobalLogConfig(config)
 * 关闭:输出导向 /dev/null 丢弃。不用 resetGlobalLogConfig——设备运行时为 AutoX.js v6,无此方法;
 *      也不用 log4j 的 LogManager.resetConfiguration——会清空 logcat 等其它 appender(设备实测)
 * 类型断言:tsconfig lib 含 dom,全局 console 被解析为 DOM Console,不带 AutoX.js 扩展方法
 */
export function setupDetailLog(enabled: boolean): string | null {
  var ac = console as unknown as Internal.Console
  if (!enabled) {
    ac.setGlobalLogConfig({ file: '/dev/null', immediateFlush: true })
    return null
  }
  // 相对基准=脚本 cwd(真实运行为项目根 /storage/emulated/0/脚本/向僵尸开炮,与 img.ts 图片路径同基准)
  var 日志目录 = files.path('./logs')
  files.ensureDir(日志目录)
  var d = new Date()
  var pad = function (n: number) { return n < 10 ? '0' + n : '' + n }
  var 日志文件 = 日志目录 + '/运行日志-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.log'
  ac.setGlobalLogConfig({
    file: 日志文件,
    maxFileSize: 512 << 10,
    maxBackupSize: 5,
    immediateFlush: true,
  })
  log('[日志] 详细日志已开启: ' + 日志文件)
  return 日志文件
}
