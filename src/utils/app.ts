/**
 * 应用管理工具:最近应用查询、应用启动
 */

/**
 * 获取最近使用过的应用(按最后使用时间倒序,包名去重)。
 * 用于切回 AutoJs6 前台后跳回游戏(第 2 个最近应用)。需要「使用情况访问」权限。
 */
export function getRecentAppsSorted(maxCount: number = 5): { packageName: string; lastTimeUsed: number }[] {
  var usageStatsManager = context.getSystemService(android.content.Context.USAGE_STATS_SERVICE)
  var now = Date.now()
  // 窗口 60 分钟:游戏全程在前台操作,lastTimeUsed 持续更新,60 分钟窗口必能查到
  var beginTime = now - 1000 * 60 * 60

  var stats: any
  try {
    stats = usageStatsManager.queryUsageStats(
      android.app.usage.UsageStatsManager.INTERVAL_BEST,
      beginTime,
      now
    )
  } catch (e) {
    console.error('查询 UsageStats 失败，请检查「使用情况访问」权限', e)
    return []
  }

  if (!stats || stats.isEmpty()) {
    console.warn('无使用统计记录')
    return []
  }

  // 转为 JS 数组并排序(按 getLastTimeUsed 降序)
  var statsArray: any[] = []
  for (var i = 0; i < stats.size(); i++) {
    if (stats.get(i).getLastTimeUsed() != 0) {
      statsArray.push(stats.get(i))
    }
  }
  statsArray.sort(function (a: any, b: any) { return b.getLastTimeUsed() - a.getLastTimeUsed() })

  // 提取包名去重(保留最新记录)
  var seen: { [key: string]: boolean } = {}
  var result: { packageName: string; lastTimeUsed: number }[] = []
  for (var j = 0; j < statsArray.length; j++) {
    var pkg = statsArray[j].getPackageName()
    if (!seen[pkg]) {
      seen[pkg] = true
      result.push({ packageName: pkg, lastTimeUsed: statsArray[j].getLastTimeUsed() })
      if (result.length >= maxCount) break
    }
  }
  return result
}

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
