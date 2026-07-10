// src/router/Router.ts
// 完整 Router 路由引擎 — 单例模式，BFS 寻路，逐跳执行

import { BasePage, Route, setRegisterCallback } from '../pages/BasePage'
import { imageNameParser, pageChange, screen, tryCloseModals } from '../utils/img'
import { NavigationError } from './errors'

export class Router {
  private static instance: Router
  private pages: BasePage[] = []
  private pageMap: { [key: string]: BasePage } = {}
  private constructor() {}

  static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router()
      setRegisterCallback(function(page: BasePage): void {
        Router.instance.register(page)
      })
    }
    return Router.instance
  }

  register(page: BasePage): void {
    this.pages.push(page)
    this.pageMap[(page.constructor as any).name] = page
  }

  /**
   * 导航到目标页面。
   * 统一策略：未知页面 → back → 重识别 → BFS 重规划，直至到达目标或达到回退上限。
   */
  go(targetClass: { new(...args: any[]): BasePage }): boolean {
    var maxBacks = 5
    var totalBacks = 0
    var maxUnknownBacks = 6    // 未知页面逐层回退，允许更多步数
    var unknownBacks = 0
    var replanLeft = 2
    var targetName = (targetClass as any).name
    var pageLog: string[] = []                // 页面轨迹，用于最终打印完整链路

    function trackPage(name: string) {
      if (pageLog.length === 0 || pageLog[pageLog.length - 1] !== name) {
        pageLog.push(name)
      }
    }

    while (totalBacks < maxBacks && unknownBacks < maxUnknownBacks) {
      var img = screen()
      var current = this.detectCurrentPage(img)

      if (!current) {
        trackPage('未知')
        log('[导航] 无法识别当前页面，尝试关闭弹窗')
        tryCloseModals()
        sleep(1500)
        var img2 = screen()
        current = this.detectCurrentPage(img2)
        if (!current) {
          log('[导航] 未知页面逐层回退(' + (unknownBacks + 1) + '/' + maxUnknownBacks + ')')
          this.performBack(null)
          unknownBacks++
          replanLeft = 2
          continue
        }
        log('[导航] 弹窗关闭成功，识别到:', current.name)
      }
      // 回到已知页面，重置未知回退计数
      unknownBacks = 0
      trackPage(current.name)

      if (current.constructor === targetClass) {
        log('[导航] 链路: ' + pageLog.join(' → '))
        return true
      }

      if (totalBacks === 0) {
        log('\n[导航] 前往: ' + targetName)
      }
      var path = this.findPath(current, targetClass)
      var ok

      if (!path || path.length === 0) {
        log('[导航] 从"' + current.name + '"无法到达"' + targetName + '"，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
        ok = this.performBack(current)
        if (!ok) log('[导航] 建议检查 ' + current.name + ' 的页面识别或路由配置')
        totalBacks++
        replanLeft = 2
        continue
      }

      this.logPath(current, path)
      var execResult = this.executePath(path)

      if (execResult === true) {
        trackPage(targetName)
        log('[导航] 链路: ' + pageLog.join(' → '))
        return true
      }

      if (execResult === null) {
        // 按钮未找到 + 页面未变 → 按钮入口真的不存在，回退无意义
        var nullImg = screen()
        var nullPage = this.detectCurrentPage(nullImg)
        if (nullPage && current && nullPage === current) {
          log('[导航] 链路: ' + pageLog.join(' → '))
          throw new NavigationError('按钮不存在，无法到达' + targetName + '，入口可能未开放')
        }
        // 页面变了（过渡动画残留），回退重试
        log('[导航] 按钮不可达，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
        this.performBack(current)
        totalBacks++
        replanLeft = 2
        continue
      }

      // execResult === false：超时/偏离
      var retryImg = screen()
      var retryCurrent = this.detectCurrentPage(retryImg)

      // 从已知页面点击后变为 null（加载过渡），不后退，延等多一轮
      if (!retryCurrent) {
        log('[导航] 页面加载过渡中，等待...')
        sleep(3000)
        var retry2 = this.detectCurrentPage(screen())
        if (retry2 && retry2.constructor === targetClass) {
          trackPage(retry2.name)
          log('[导航] 链路: ' + pageLog.join(' → '))
          return true
        }
        totalBacks++
        replanLeft = 2
        continue
      }

      // 已到达目标
      if (retryCurrent.constructor === targetClass) {
        trackPage(retryCurrent.name)
        log('[导航] 链路: ' + pageLog.join(' → '))
        return true
      }

      // 页面变了，尝试重新规划
      if (replanLeft > 0 && current && retryCurrent !== current) {
        var retryPath = this.findPath(retryCurrent, targetClass)
        if (retryPath && retryPath.length > 0) {
          replanLeft--
          log('[导航] 从 "' + retryCurrent.name + '" 重试路径，剩余 ' + replanLeft + ' 次')
          continue
        }
      }

      // 超时后页面未变 → 路由配置或按钮匹配有问题，回退无意义
      if (current && retryCurrent === current) {
        log('[导航] 链路: ' + pageLog.join(' → '))
        throw new NavigationError('页面未变化，无法到达' + targetName + '，按钮匹配可能有问题')
      }

      log('[导航] 路径执行失败，页面:' + retryCurrent.name + '，回退重试(' + (totalBacks + 1) + '/' + maxBacks + ')')
      ok = this.performBack(current)
      if (!ok) log('[导航] 建议检查目标页面入口是否存在')
      totalBacks++
      replanLeft = 2
    }

    if (unknownBacks >= maxUnknownBacks) {
      log('[导航] 链路: ' + pageLog.join(' → '))
      throw new NavigationError('未知页面回退' + maxUnknownBacks + '次后仍无法识别，无法到达' + targetName)
    }
    log('[导航] 链路: ' + pageLog.join(' → '))
    throw new NavigationError('已达最大回退次数(' + maxBacks + ')，无法到达' + targetName)
  }

  /** 打印路径规划: A → B → C */
  private logPath(from: BasePage, path: Route[]): void {
    var names = [from.name]
    for (var i = 0; i < path.length; i++) {
      names.push((path[i].target as any).name)
    }
    log('[导航] 路径: ' + names.join(' → '))
  }

  /**
   * 逐跳执行路径。
   * 每跳：点击按钮 → 等待页面切换。
   * 返回 false 时已执行弹窗关闭，调用方处理回退重试。
   */
  private executePath(path: Route[]): boolean | null {
    var totalHops = path.length
    var startPage = this.detectCurrentPage(screen())
    var startName = startPage ? startPage.name : ''

    for (var i = 0; i < totalHops; i++) {
      var route = path[i]
      var targetName = (route.target as any).name

      log('[导航] 第' + (i + 1) + '/' + totalHops + '跳: ' + startName + ' → ' + targetName)

      var actionOk = route.action()

      if (!actionOk) {
        // action() 失败可能源自上一次尝试的点击已在后台生效，短轮询确认页面是否已切换
        var recovered = false
        for (var ri = 0; ri < 3; ri++) {
          sleep(800)
          var retryFrame = screen()
          var retryPage = this.detectCurrentPage(retryFrame)
          if (retryPage && retryPage.constructor === route.target) {
            log('[导航] 第' + (i + 1) + '跳: 按钮未找到但页面已跳转')
            recovered = true
            break
          }
        }
        if (recovered) {
          startName = targetName
          continue
        }

        var failInfo = '第' + (i + 1) + '跳失败: 按钮未找到 [' + startName + ' → ' + targetName + ']，入口可能未开放'
        if (route.imagePath) {
          try {
            var parsed = imageNameParser(route.imagePath)
            failInfo += ' | ' + route.imagePath + ' [' + parsed.x1 + ',' + parsed.y1 + '-' + parsed.x2 + ',' + parsed.y2 + ']'
          } catch (e) {
            failInfo += ' | ' + route.imagePath
          }
        }
        log('[导航] ' + failInfo)
        return null
      }

      var maxAttempts = 6
      var interval = 800
      var hopOk = false
      var landedPage: string | null = null
      var deviated = false

      for (var attempt = 0; attempt < maxAttempts; attempt++) {
        sleep(interval)
        var frame = screen()
        var page = this.detectCurrentPage(frame)

        if (!page) {
          landedPage = null
          continue
        }
        landedPage = page.name

        if (page.constructor === route.target) {
          hopOk = true
          break
        }

        if (page.name !== startName) {
          if (!deviated) {
            log('[导航] 第' + (i + 1) + '跳偏离: 期望"' + targetName + '"，进入"' + page.name + '"')
            deviated = true
          }
          tryCloseModals()
          sleep(1500)
          // 继续轮询剩余次数，确认目标页不可达后再判负
          continue
        }

        // 页面持续未变：可能弹窗遮挡了目标按钮，首次点击已关弹窗，重试点击
        if (attempt === 3) {
          log('[导航] 页面未变化，尝试重试点击（attempt=' + attempt + '）')
          route.action()
        }
      }

      if (!hopOk) {
        var timeoutInfo = '第' + (i + 1) + '跳超时: ' + startName + ' → ' + targetName + '，当前页面:' + (landedPage || '未知')
        if (route.imagePath) {
          try {
            var tp = imageNameParser(route.imagePath)
            timeoutInfo += ' | ' + route.imagePath + ' [' + tp.x1 + ',' + tp.y1 + '-' + tp.x2 + ',' + tp.y2 + ']'
          } catch (e) {
            timeoutInfo += ' | ' + route.imagePath
          }
        }
        log('[导航] ' + timeoutInfo)

        // 页面从已知变为未知（加载过渡），延长等待而非立即失败
        if (landedPage === null) {
          for (var extAttempt = 0; extAttempt < 8; extAttempt++) {
            sleep(1000)
            var extFrame = screen()
            var extPage = this.detectCurrentPage(extFrame)
            if (extPage && extPage.constructor === route.target) {
              log('[导航] 过渡加载完成，到达目标页:', extPage.name)
              hopOk = true
              break
            }
            if (extPage && extPage.name !== startName) {
              log('[导航] 过渡后进入:', extPage.name)
              break
            }
          }
          if (!hopOk) return false
        } else {
          tryCloseModals()
          sleep(1500)
          var timeoutImg = screen()
          var timeoutPage = this.detectCurrentPage(timeoutImg)
          if (timeoutPage && timeoutPage.constructor === route.target) {
            log('[导航] 关闭弹窗后到达目标页:', timeoutPage.name)
            hopOk = true
          } else {
            return false
          }
        }
      }

      startName = targetName
    }

    return true
  }

  /**
   * 单次回退，恢复级联：
   *   1. 调 page.back() 或物理点击
   *   2. is() 识别 → 页面变了 → 成功
   *   3. is() 识别失败 → pageChange() 比对截图 → 变了 → 成功（回退生效但新页未知）
   *   4. is() 识别但页面未变 → 关闭弹窗 + 备选点击 → 再试
   *   5. 仍不变 → 返回 false
   */
  private performBack(page: BasePage | null): boolean {
    var beforeImg = screen(0, false)
    var before = page || this.detectCurrentPage(beforeImg)
    var beforeName = before ? before.name : 'unknown'

    log('[导航] 回退: ' + beforeName)

    if (page) {
      if (!page.back()) {
        log('[导航] page.back()未找到按钮')
        sleep(500)
      } else {
        sleep(1500)
      }
    } else {
      click(100, device.height - 100)
      sleep(150)
      click(device.width / 2, device.height - 100)
      sleep(1500)
    }

    var afterImg = screen(0, false)
    var after = this.detectCurrentPage(afterImg)

    if (after && after.name !== beforeName) {
      beforeImg.recycle()
      return true
    }

    if (!after) {
      // pageChange 内部调用 screen() 会覆盖缓存使 afterImg 成为孤引用，提前回收
      afterImg.recycle()
      if (pageChange(beforeImg)) {
        log('[导航] is()未识别但截图已变化，回退生效')
        this.verifyAfterChange()
        beforeImg.recycle()
        return true
      }
      log('[导航] 回退无效（截图未变化），尝试级联恢复')
    }

    if (after && after.name === beforeName) {
      log('[导航] 回退无效: 仍处于 ' + beforeName)
    }

    if (tryCloseModals()) {
      sleep(1500)
      afterImg = screen(0, false)
      after = this.detectCurrentPage(afterImg)
      if (after && after.name !== beforeName) {
        beforeImg.recycle()
        return true
      }
      if (!after) {
        afterImg.recycle()
        if (pageChange(beforeImg)) {
          log('[导航] 关闭弹窗后截图变化，回退生效')
          this.verifyAfterChange()
          beforeImg.recycle()
          return true
        }
      }
    }

    log('[导航] 尝试备选回退')
    click(device.width / 2, device.height - 50)
    sleep(1500)

    afterImg = screen(0, false)
    after = this.detectCurrentPage(afterImg)
    if (after && after.name !== beforeName) {
      beforeImg.recycle()
      return true
    }
    if (!after) {
      afterImg.recycle()
      if (pageChange(beforeImg)) {
        log('[导航] 备选回退后截图变化，回退生效')
        this.verifyAfterChange()
        beforeImg.recycle()
        return true
      }
    }

    log('[导航] 所有回退尝试均无效')
    beforeImg.recycle()
    return false
  }

  /** pageChange 判定后二次确认页面身份 */
  private verifyAfterChange(): void {
    sleep(1500)
    var vImg = screen()
    var vPage = this.detectCurrentPage(vImg)
    if (vPage) {
      log('[导航] 页面识别为: ' + vPage.name)
    }
  }

  public detectCurrentPage(img: ImageWrapper): BasePage | null {
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].is(img)) {
        return this.pages[i]
      }
    }
    return null
  }

  private findPath(from: BasePage, targetClass: typeof BasePage): Route[] | null {
    var visited: { [key: string]: boolean } = {}
    var queue: { page: BasePage; path: Route[] }[] = []

    visited[from.name] = true
    queue.push({ page: from, path: [] })

    while (queue.length > 0) {
      var current = queue.shift()!
      var routes = current.page.routes() || []

      for (var i = 0; i < routes.length; i++) {
        var route = routes[i]
        var targetName = (route.target as any).name

        if (route.target === targetClass) {
          return current.path.concat([route])
        }

        if (!visited[targetName]) {
          visited[targetName] = true
          var targetPage = this.pageMap[targetName]
          if (targetPage) {
            queue.push({ page: targetPage, path: current.path.concat([route]) })
          } else {
            log('[路由] 页面未注册: ' + targetName)
          }
        }
      }
    }

    return null
  }
}
