import { Router } from './router/Router'
import { 战斗 } from './pages/战斗'
import { 基地 } from './pages/基地'
import { 历练大厅 } from './pages/历练大厅'
import { 选择技能 } from './pages/选择技能'
import { 寰球救援 } from './pages/寰球救援'
import { 军团 } from './pages/军团'
import { 幸运锦鲤 } from './pages/幸运锦鲤'
import { 幸运锦鲤免费福利 } from './pages/幸运锦鲤-免费福利'
import { 玩法商店 } from './pages/玩法商店'
import { 侧栏 } from './pages/侧栏'
import { 巡逻车 } from './pages/巡逻车'
import { 食堂 } from './pages/食堂'
import { 邮件 } from './pages/邮件'
import { 个人信息 } from './pages/个人信息'
import { 服务器选择 } from './pages/服务器选择'
import { 异域挑战 } from './pages/异域挑战'
import { 异域挑战军团奖励 } from './pages/异域挑战-军团奖励'
import { 异域挑战个人奖励 } from './pages/异域挑战-个人奖励'
import { 先锋宝藏 } from './pages/先锋宝藏'
import { 每日一刀 } from './pages/每日一刀'
import { 寰球远征 } from './pages/寰球远征'

var router = Router.getInstance()

new 侧栏()
new 战斗()
new 基地()
new 历练大厅()
new 选择技能()
new 寰球救援()
new 寰球远征()
new 军团()
// 幸运锦鲤免费福利 需要在幸运锦鲤前实例化
new 幸运锦鲤免费福利()
new 幸运锦鲤()
new 玩法商店()
new 巡逻车()
new 食堂()
new 邮件()
new 个人信息()
new 服务器选择()
new 异域挑战()
new 异域挑战军团奖励()
new 异域挑战个人奖励()
new 先锋宝藏()
new 每日一刀()

router.go(基地)