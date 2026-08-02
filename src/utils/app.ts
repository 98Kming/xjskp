/**
 * 应用管理工具:应用启动
 */

/**
 * 通过 root shell 启动应用(am start)。
 * ColorOS 会拦截应用层后台启动弹确认框,shell 身份启动实测不被拦截。
 */
export function launchPackageByShell(pkg: string): boolean {
  // 解析默认启动 activity(package/activity)
  var r = shell('cmd package resolve-activity --brief ' + pkg, true)
  var lines = r.result ? r.result.trim().split('\n') : []
  var comp = lines[lines.length - 1]
  if (comp && comp.indexOf('/') > 0) {
    var r2 = shell('am start -n ' + comp, true)
    return r2.code === 0
  }
  return false
}
