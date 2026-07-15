import { runDaily } from "./daily"
import { 个人信息 } from "./pages/个人信息"
import { 战斗 } from "./pages/战斗"
import { 服务器选择 } from "./pages/服务器选择"
import { Router } from "./router/Router"
import { recycleImgs } from "./utils/img"

let point = [0, 0]

let i = 0
new 个人信息()
// new 战斗()
var 服务器选择Page = new 服务器选择()
var router = Router.getInstance()
log("开始选择服务器")
runDaily()
while (router.go(服务器选择)) {
  if (!服务器选择Page.next()) {
    break
  }
  runDaily()
  i++
  log("到达服务器选择页面，点击次数：", i)
  sleep(1000)
}
console.log("选择服务器次数：", i)
recycleImgs.forEach(img => {
  try {
    img.recycle()
  } catch (e) {
    log(e)
  }
})
