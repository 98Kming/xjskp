import { 服务器选择 } from "./pages/服务器选择"
import { runTestSuite, testGo, 服务器选择Page } from "./test-navigation"

let point = [0, 0]

let i = 0

while(true) {
  if(testGo(服务器选择, '⑯ 服务器选择')){
    let currentPoint = 服务器选择Page.next()
  
    if(currentPoint != null){
       if (point[0] != currentPoint[0] || point[1] != currentPoint[1]) {
    console.log("循环结束，点击次数：", i)
  }
  i++
  click(currentPoint[0] + 60, currentPoint[1] + 10)
  runTestSuite()
  sleep(500)
    }else{
      break
    }
  }
}
console.log("选择服务器次数：", i)
