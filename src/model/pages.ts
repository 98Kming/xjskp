// src/model/pages.ts — 页面实例注册表
// 所有页面的实例化统一在此处;new 语句顺序 = Router 注册顺序 = 识别优先级(先注册先匹配)
// 使用方(daily/Game/main)一律 import 本模块实例,禁止重复 new(重复注册会触发 Router 报错)
// 注意:精英掉落(战斗模式运行时注册)、鹊渡仙途(点击时懒注册)不在本表,保持各自持有以省找图次数

import { 基地 } from '../pages/基地'
import { 随机事件 } from '../pages/随机事件'
import { 侧栏 } from '../pages/侧栏'
import { 战斗 } from '../pages/战斗'
import { 先锋宝藏 } from '../pages/先锋宝藏'
import { 碧海凉夏 } from '../pages/碧海凉夏'
import { 军团 } from '../pages/军团'
import { 每日一刀 } from '../pages/每日一刀'
import { 异域挑战 } from '../pages/异域挑战'
import { 异域挑战军团奖励 } from '../pages/异域挑战-军团奖励'
import { 异域挑战个人奖励 } from '../pages/异域挑战-个人奖励'
import { 军团商店 } from '../pages/军团商店'
import { 道具购买 } from '../pages/道具购买'
import { 玩法商店 } from '../pages/玩法商店'
import { 幸运锦鲤免费福利 } from '../pages/幸运锦鲤-免费福利'
import { 幸运锦鲤 } from '../pages/幸运锦鲤'
import { 邮件 } from '../pages/邮件'
import { 巡逻车 } from '../pages/巡逻车'
import { 历练大厅 } from '../pages/历练大厅'
import { 寰球救援 } from '../pages/寰球救援'
import { 寰球远征 } from '../pages/寰球远征'
import { 终末危机 } from '../pages/终末危机'
import { 食堂 } from '../pages/食堂'
import { 光落彼端 } from '../pages/光落彼端'
import { 超能之星 } from '../pages/超能之星'
import { 观影签到 } from '../pages/观影签到'
import { 观影便利店 } from '../pages/观影便利店'
import { 影映观礼 } from '../pages/影映观礼'
import { 武装降临 } from '../pages/武装降临'
import { 鎏金罗盘 } from '../pages/鎏金罗盘'
import { 好友 } from '../pages/好友'
import { 领取体力 } from '../pages/领取体力'
import { 选择技能 } from '../pages/选择技能'
import { 暂停战斗 } from '../pages/暂停战斗'
import { 战斗结束 } from '../pages/战斗结束'
import { 战斗中 } from '../pages/战斗中'
import { 任务 } from '../pages/任务'
import { 个人信息 } from '../pages/个人信息'
import { 服务器选择 } from '../pages/服务器选择'
import { 登录 } from '../pages/登录'
import { 接受邀请列表 } from '../pages/接受邀请列表'
import { 组队邀请推荐 } from '../pages/组队邀请-推荐'
import { 组队邀请好友 } from '../pages/组队邀请-好友'
import { 丛林遗迹 } from '../pages/丛林遗迹'

// ======== 日常入口页(顺序沿用原 daily.ts 实例化顺序,勿随意调整) ========
export var 基地Page = new 基地()
export var 随机事件Page = new 随机事件()
// 侧栏必须在战斗且初始化，否则无法导航到侧栏
export var 侧栏Page = new 侧栏()
export var 战斗Page = new 战斗()
export var 先锋宝藏Page = new 先锋宝藏()
export var 碧海凉夏Page = new 碧海凉夏()
export var 军团Page = new 军团()
export var 每日一刀Page = new 每日一刀()
export var 异域挑战Page = new 异域挑战()
export var 异域挑战军团奖励Page = new 异域挑战军团奖励()
export var 异域挑战个人奖励Page = new 异域挑战个人奖励()
export var 军团商店Page = new 军团商店()
export var 道具购买Page = new 道具购买()
export var 玩法商店Page = new 玩法商店()
export var 幸运锦鲤免费福利Page = new 幸运锦鲤免费福利()
export var 幸运锦鲤Page = new 幸运锦鲤()
export var 邮件Page = new 邮件()
export var 巡逻车Page = new 巡逻车()
export var 历练大厅Page = new 历练大厅()
export var 寰球救援Page = new 寰球救援()
export var 寰球远征Page = new 寰球远征()
export var 终末危机Page = new 终末危机()
export var 食堂Page = new 食堂()
export var 光落彼端Page = new 光落彼端()
export var 超能之星Page = new 超能之星()
export var 观影签到Page = new 观影签到()
export var 观影便利店Page = new 观影便利店()
export var 影映观礼Page = new 影映观礼()
export var 武装降临Page = new 武装降临()
export var 丛林遗迹Page = new 丛林遗迹()
export var 鎏金罗盘Page = new 鎏金罗盘()
export var 好友Page = new 好友()
export var 领取体力Page = new 领取体力()

// ======== 战斗弹窗页(顺序敏感:技能弹窗打开时暂停按钮仍可见,先注册才能优先识别) ========
// 选择技能先注册：技能弹窗打开时暂停按钮仍可见（战斗中也匹配），优先识别为技能弹窗
export var 选择技能Page = new 选择技能()
// 暂停战斗先注册：暂停面板打开时左上角暂停按钮可能仍可见（战斗中也匹配），优先识别为暂停战斗
export var 暂停战斗Page = new 暂停战斗()
// 战斗结束先注册：结算页"战斗中"模板（暂停按钮/已激活技能弹窗图）仍可见（战斗中也匹配），优先识别为战斗结束
export var 战斗结束Page = new 战斗结束()
export var 战斗中Page = new 战斗中()
export var 任务Page = new 任务()

// ======== 服务器页 ========
export var 个人信息Page = new 个人信息()
export var 服务器选择Page = new 服务器选择()

// ======== 登录页(仅启动时出现,放最后避免抢占日常页面识别) ========
export var 登录Page = new 登录()

// ======== 组队页(注册顺序靠后,识别优先级最低,不与现有页面抢识别) ========
export var 接受邀请列表Page = new 接受邀请列表()
export var 组队邀请推荐Page = new 组队邀请推荐()
export var 组队邀请好友Page = new 组队邀请好友()
