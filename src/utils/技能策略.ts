import { mainWindow } from '../MainWindow'

type Weight = {
  text: string
  match: RegExp
  weight: number
}

enum SKILL_TYPE {
  子弹, 元素子弹, 温压弹, 干冰弹, 装甲车, 冰暴发生器, 旋风加农, 燃油弹, 无人机, 电磁穿刺, 时空裂隙, 生化矩阵, 其他
}

// seekbar 名称 → SKILL_TYPE 映射(UI 控件 id 为 {名称}_seekbar)
const 类型表: any = {
  子弹: SKILL_TYPE.子弹,
  元素子弹: SKILL_TYPE.元素子弹,
  温压弹: SKILL_TYPE.温压弹,
  干冰弹: SKILL_TYPE.干冰弹,
  电磁穿刺: SKILL_TYPE.电磁穿刺,
  装甲车: SKILL_TYPE.装甲车,
  冰暴发生器: SKILL_TYPE.冰暴发生器,
  旋风加农: SKILL_TYPE.旋风加农,
  燃油弹: SKILL_TYPE.燃油弹,
  无人机: SKILL_TYPE.无人机,
  时空裂隙: SKILL_TYPE.时空裂隙,
  生化矩阵: SKILL_TYPE.生化矩阵,
}

interface Skill {
  match: RegExp
  weight: number // 技能权重，权重高的技能优先级高
  priority: number // 技能优先级，优先级高的技能优先级高
  type: SKILL_TYPE
  selectNum?: number // 大于0时 局内每选择1次技能优先级priority下降一级
  weightDecay?: number // 大于0时 每次被选中后实际权重减去该值，resetPriority 时清零
}

const STRATEGY: Skill[] = []

STRATEGY.push({ match: /.*回.*生命.*/, weight: 10000, priority: 1, type: SKILL_TYPE.其他 })// [分裂子弹四射 子弹命中后,生成4个次级子弹并向4个方向发射]
STRATEGY.push({ match: /.*分裂子.*生.*/, weight: 1000, priority: 1, type: SKILL_TYPE.子弹 })// [分裂子弹四射 子弹命中后,生成4个次级子弹并向4个方向发射]
STRATEGY.push({ match: /.*压.*生命.*/, weight: 1000, priority: 1, type: SKILL_TYPE.温压弹 })// [热能焚身 温压弹赋予的燃烧状态额外追加3%目标的最大生命值伤害]
STRATEGY.push({ match: /(.*车.*火.*)/, weight: 1000, priority: 1, type: SKILL_TYPE.装甲车 })// [焦土策略 将装甲车前方涂上焦油点火，可以引燃怪物]
STRATEGY.push({ match: /.*生.*子[弹彈].*/, weight: 1000, priority: 1, type: SKILL_TYPE.元素子弹 }) // [生化子弹 生化子弹变为毒素子弹，造成伤害时使目标附带1层[基因污染]，持续5秒，额外提高200层污染上限]

STRATEGY.push({ match: /.*每.*子.*数.*/, weight: 1000, weightDecay: 2, priority: 2, type: SKILL_TYPE.子弹 })// [连射+ 每次射击子弹数量+2]
STRATEGY.push({ match: /.*每.*发.*数.*/, weight: 999, weightDecay: 2, priority: 2, type: SKILL_TYPE.子弹 })// [连发 每次射击连发数+1，伤害-20%] [连发+ 每次射击连发数+1]
STRATEGY.push({ match: /.*学.*压[弹彈].*/, weight: 1000, priority: 2, type: SKILL_TYPE.温压弹 })// [温压弹 学习温压弹]
STRATEGY.push({ match: /.*学.*冰[弹彈].*/, weight: 1000, priority: 2, type: SKILL_TYPE.干冰弹 })// [干冰弹 学习干冰弹]
STRATEGY.push({ match: /.*学.*车.*/, weight: 1000, priority: 2, type: SKILL_TYPE.装甲车 })// [装甲车 学习裝甲车]
STRATEGY.push({ match: /.*学.*风.*/, weight: 1000, priority: 2, type: SKILL_TYPE.旋风加农 })// [旋风加农 学习旋风加农]
STRATEGY.push({ match: /.*学.*机.*/, weight: 1000, priority: 2, type: SKILL_TYPE.无人机 })// [无人机 学习无人机]
STRATEGY.push({ match: /.*学.*电磁.*/, weight: 1000, priority: 2, type: SKILL_TYPE.电磁穿刺 })// [电磁穿刺 学习电磁穿刺]
STRATEGY.push({ match: /.*学.*油.*/, weight: 1000, priority: 2, type: SKILL_TYPE.燃油弹 })// [燃油弹 学习燃油弹]
STRATEGY.push({ match: /.*学.*时空.*/, weight: 1000, priority: 2, type: SKILL_TYPE.时空裂隙 })// [时空裂隙 学习时空裂隙]

STRATEGY.push({ match: /.*齐射.*子.*/, weight: 1000, priority: 2, type: SKILL_TYPE.子弹 })// [齐射 子弹弹道数量+1 伤害-20%] [齐射+ 子弹弹道数量+1]
STRATEGY.push({ match: /.*分裂子.*放.*/, weight: 999, priority: 2, type: SKILL_TYPE.子弹 })// 分裂子弹 子弹命中怪物后释放2个次级子弹
STRATEGY.push({ match: /.*子[弹彈].*射.*/, weight: 998, priority: 2, type: SKILL_TYPE.子弹 })// [子弹弹射 子弹碰到墙壁弹射次数+1] [穿透弹射 子弹碰到墙壁弹射次数+1，穿透+1]
STRATEGY.push({ match: /.*全子.*/, weight: 997, priority: 2, type: SKILL_TYPE.子弹 })// [全子弹增幅 子弹与次级子弹伤害+100%]
STRATEGY.push({ match: /.*压[弹彈].*连.*/, weight: 1000, priority: 2, type: SKILL_TYPE.温压弹 })// [温压弹连发 额外释放1枚温压弹] [温压弹连发+ 额外释放2枚温压弹，伤害-30%]
STRATEGY.push({ match: /.*大冰[弹彈].*/, weight: 1000, priority: 2, type: SKILL_TYPE.干冰弹 })// [极寒大冰弹 强化升级为极寒大冰弹，命中后分裂出附带所有强化效果的干冰子母弹]
STRATEGY.push({ match: /.*冰[弹彈]齐射.*/, weight: 999, priority: 2, type: SKILL_TYPE.干冰弹 })// [干冰弹齐射 干冰弹数量+1]
STRATEGY.push({ match: /.*冰[弹彈].放.*/, weight: 998, priority: 2, type: SKILL_TYPE.干冰弹 })// [干冰弹连发 干冰弹释放次数+1]
STRATEGY.push({ match: /.*车出.*/, weight: 1000, priority: 2, type: SKILL_TYPE.装甲车 })// [连续出击 装甲车出击次数+1] [连续出击+ 装甲车出击次数+2，伤害-20%]
STRATEGY.push({ match: /.*个.*冰.发生.*/, weight: 1000, priority: 2, type: SKILL_TYPE.冰暴发生器 })// [连环冰暴 额外释放一个冰暴发生器]
STRATEGY.push({ match: /.*风加.*力.*/, weight: 1000, priority: 2, type: SKILL_TYPE.旋风加农 })//[旋风增压 旋风加农牵引力+50%]
STRATEGY.push({ match: /.*个.*风加.*/, weight: 999, priority: 2, type: SKILL_TYPE.旋风加农 })//[双重旋风 同时释放2个旋风加农]
STRATEGY.push({ match: /.*电.*命.*子.*/, weight: 1000, priority: 2, type: SKILL_TYPE.电磁穿刺 })//[电磁裂变 电磁穿刺命中后产生6个方向穿透5的电粒子]
STRATEGY.push({ match: /.*电磁分.*.*/, weight: 999, priority: 2, type: SKILL_TYPE.电磁穿刺 })// [电磁分流 电磁穿刺额外释放1次]
STRATEGY.push({ match: /.*多.油.*/, weight: 1000, priority: 2, type: SKILL_TYPE.燃油弹 })// [多重油弹 释放次数+1灼烧伤害-25%]
STRATEGY.push({match: /.*域个.*/, weight: 1000, priority: 2, type: SKILL_TYPE.时空裂隙}) // [多重坍塌 坍塌领域个数+1]
STRATEGY.push({match: /.*生.*时.*/, weight: 1000, priority: 2, type: SKILL_TYPE.生化矩阵}) // [矩阵脉冲 生化矩阵生成时，对范围内的目标造成150%伤害并附加1层【基因污染】持续5秒，额外提高100层污染上限]
STRATEGY.push({match: /.*生.*合并.*/, weight: 999, priority: 2, type: SKILL_TYPE.生化矩阵}) // [矩阵毒素 生化矩阵合并时使目标附加1层【基因污染】持续5秒，额外提高100层污染上限]
STRATEGY.push({match: /.*合成.*标.*/, weight: 998, priority: 2, type: SKILL_TYPE.生化矩阵}) // [熵增回响 合成最大矩阵时辐射范围内所有目标，5秒后爆发造成400%伤害，并附加1层【基因污染】持续5秒，额外提高100层污染上限]

STRATEGY.push({ match: /.{0,2}子..炸.*命中.*/, weight: 1000, priority: 3, type: SKILL_TYPE.子弹 })// [子弹爆炸 子弹命中怪物后爆炸]
STRATEGY.push({ match: /.*分裂子.*命中.*/, weight: 999, priority: 3, type: SKILL_TYPE.子弹 })// [分裂子弹爆炸 次级子弹命中后爆炸]
STRATEGY.push({ match: /.*分裂子.*伤.*/, weight: 998, priority: 3, type: SKILL_TYPE.子弹 })// [分裂子弹增伤 次级子弹伤害+100%]
STRATEGY.push({ match: /.*压.*秒.*/, weight: 1000, priority: 3, type: SKILL_TYPE.温压弹 })// [热能引燃 温压弹爆炸会引燃怪物6秒]
STRATEGY.push({ match: /.*热能爆炸.*/, weight: 999, priority: 3, selectNum: 1, type: SKILL_TYPE.温压弹 })// [热能爆炸 温压弹的爆炸伤害+80%]
STRATEGY.push({ match: /.*冰[弹彈].*冻.*/, weight: 1000, priority: 3, type: SKILL_TYPE.干冰弹 })// [急冻寒冰 干冰弹伤害+30%，命中后会冻结怪物2秒]
STRATEGY.push({ match: /.*低温.*/, weight: 998, priority: 3, selectNum: 1, type: SKILL_TYPE.干冰弹 })// [低温贯穿 干冰弹伤害+30%，穿透+2]
STRATEGY.push({ match: /[干千]冰[弹彈]增伤.*/, weight: 997, priority: 3, selectNum: 1, type: SKILL_TYPE.干冰弹 })// [干冰弹增伤 干冰弹伤害+60%]
STRATEGY.push({ match: /.*车.*减速.*/, weight: 1000, priority: 3, type: SKILL_TYPE.装甲车 })// [致残碾压 装甲车造成的减速效果持续时间+4秒]
STRATEGY.push({ match: /.*冰.发生.*持续.*/, weight: 1000, priority: 3, type: SKILL_TYPE.冰暴发生器 })// [冰暴延续 冰雹发生器持续时间+2秒，伤害-50%]
STRATEGY.push({ match: /.*冰.发生.*冷却.*/, weight: 999, priority: 3, type: SKILL_TYPE.冰暴发生器 })// [冰系缩减 干冰弹，冰暴发生器冷却时间-25%]
STRATEGY.push({ match: /.*区.*动.*/, weight: 1000, priority: 3, type: SKILL_TYPE.燃油弹 })// [燃油凝滞 灼烧区域怪物移动速度-50%]
STRATEGY.push({match: /.*次元.*/, weight: 1000, priority: 3, type: SKILL_TYPE.时空裂隙}) // [次元裂隙 时空裂隙升级为次元裂隙]
STRATEGY.push({match: /.*相.*大.*/, weight: 1000, priority: 3, type: SKILL_TYPE.生化矩阵}) // [相变迷宫 路径区域伤害与矩阵合并伤害+20%，可进阶合成更大矩阵]
STRATEGY.push({match: /.*发.*合并.*/, weight: 999, priority: 3, type: SKILL_TYPE.生化矩阵}) // [潜能爆发 矩阵合并伤害+100%]


STRATEGY.push({ match: /.*急.*子[弹彈].*/, weight: 1000, priority: 3, type: SKILL_TYPE.元素子弹 })
STRATEGY.push({ match: /.*火.*子[弹彈].*/, weight: 999, priority: 3, type: SKILL_TYPE.元素子弹 })
STRATEGY.push({ match: /.*电.*子[弹彈].*/, weight: 998, priority: 3, type: SKILL_TYPE.元素子弹 })

STRATEGY.push({match: /.*时空.*个.*/, weight: 1000, priority: 4, type: SKILL_TYPE.时空裂隙}) // [多重裂隙+ 时空裂隙裂隙个数+1]
STRATEGY.push({match: /.*时空.*范围.*/, weight: 998, priority: 3, type: SKILL_TYPE.时空裂隙}) // [裂隙扩张+ 时空裂隙范围+60%]
STRATEGY.push({match: /.*时空.*时间.*/, weight: 997, priority: 3, type: SKILL_TYPE.时空裂隙}) // [相对稳定 时空裂隙持续时间+50%]
STRATEGY.push({ match: /.*车伤害.*/, weight: 1000, priority: 4, type: SKILL_TYPE.装甲车 })// [增伤装置 装甲车伤害+60%]
STRATEGY.push({ match: /.*车速度.*/, weight: 999, priority: 4, type: SKILL_TYPE.装甲车 })// [极速冲锋 装甲车速度+15%，冷却时间-25%]
STRATEGY.push({ match: /.*富燃料填充.*/, weight: 1000, priority: 4, type: SKILL_TYPE.温压弹 })// [富燃料填充 温压弹伤害+20%]
STRATEGY.push({ match: /.*冰.*冷却.*/, weight: 1000, priority: 4, type: SKILL_TYPE.干冰弹 })// [冰系缩减]
STRATEGY.push({ match: /.*[干千]冰[弹彈].*小.*/, weight: 1000, priority: 4, type: SKILL_TYPE.干冰弹 })// [散射小冰弹 干冰弹首次命中后分裂为3个小冰弹]
STRATEGY.push({ match: /.*风加农持续.*/, weight: 1000, priority: 4, type: SKILL_TYPE.旋风加农 })// [延长气流 旋风加农持续时间+100%]
STRATEGY.push({ match: /.*风力增强.*/, weight: 999, priority: 4, type: SKILL_TYPE.旋风加农 })// [风力增强 旋风加农伤害+60%]
STRATEGY.push({ match: /.*风加.*范围.*/, weight: 998, priority: 4, type: SKILL_TYPE.旋风加农 })//[气旋扩展 旋风加农范围+60%，伤害-20%]
STRATEGY.push({ match: /.*闪电加农.*/, weight: 997, priority: 4, type: SKILL_TYPE.旋风加农 })// [闪电加农 旋风加农附带额外的【电系】伤害，同时攻击会麻痹敌人1秒]
STRATEGY.push({ match: /.*麻.*伤.*/, weight: 1000, priority: 4, type: SKILL_TYPE.电磁穿刺 })// [麻痹增伤，电磁穿刺伤害+30%，麻痹时间+1.5秒]
STRATEGY.push({ match: /.*燃.改.*/, weight: 1000, priority: 4, type: SKILL_TYPE.燃油弹 })// [燃料改良 灼烧伤害+60%]
STRATEGY.push({ match: /.*火.*散.*/, weight: 999, priority: 4, type: SKILL_TYPE.燃油弹 })// [火势扩散 灼烧范围+100%，伤害-30%]

STRATEGY.push({ match: /.*子[弹彈].*/, weight: 1000, priority: 5, type: SKILL_TYPE.子弹 })// 其他子弹技能
STRATEGY.push({ match: /.*压[弹彈].*/, weight: 1000, priority: 5, type: SKILL_TYPE.温压弹 })// 其他温压弹技能
STRATEGY.push({ match: /.*冰[弹彈].*/, weight: 1000, priority: 5, type: SKILL_TYPE.干冰弹 })// 其他干冰弹技能
STRATEGY.push({ match: /.*车.*/, weight: 1000, priority: 5, type: SKILL_TYPE.装甲车 })// 其他装甲车技能
STRATEGY.push({ match: /.*冰.发生.*/, weight: 1000, priority: 5, type: SKILL_TYPE.冰暴发生器 })// 其他冰暴发生器技能
STRATEGY.push({ match: /.*风加.*/, weight: 1000, priority: 5, type: SKILL_TYPE.旋风加农 })// 其他旋风加农技能
STRATEGY.push({ match: /.*电磁.*/, weight: 1000, priority: 5, type: SKILL_TYPE.电磁穿刺 })// 其他电磁穿刺技能
STRATEGY.push({ match: /.*油[弹彈].*/, weight: 1000, priority: 5, type: SKILL_TYPE.燃油弹 })// 其他燃油弹技能
STRATEGY.push({ match: /.*/, weight: 1000, priority: 8, type: SKILL_TYPE.其他 })// 其他技能

const progressMap = new Map<SKILL_TYPE, number>()
const cachePriorityMap = new Map<RegExp, number>()
const cacheSelectNumMap = new Map<RegExp, number>()
const cacheWeightDecayMap = new Map<RegExp, number>()
STRATEGY.forEach(skill => {
  cachePriorityMap.set(skill.match, skill.priority)
  cacheSelectNumMap.set(skill.match, skill.selectNum || 0)
  cacheWeightDecayMap.set(skill.match, 0)
})

export class skillStrategy {
  /** 恢复所有类型 seekbar 到布局默认进度(originalProgress)，须在 UI 线程调用 */
  static resetUi() {
    for (var key in 类型表) {
      var view = (mainWindow.window as any)[key + '_seekbar']
      if (view && view.widget) {
        view.widget.reset()
      }
    }
  }

  /** 从技能页 seekbar 读取各类型权重（100-进度，进度越高该类型越想要）并重置局内计数 */
  static resetProgress() {
    progressMap.clear()
    for (var key in 类型表) {
      var view = (mainWindow.window as any)[key + '_seekbar']
      if (view && view.widget) {
        progressMap.set(类型表[key], 100 - view.widget.getProgress())
      } else {
        log('[技能策略] ' + key + '_seekbar 控件不可用，跳过该类型配置')
      }
    }
    progressMap.set(SKILL_TYPE.其他, 0)
    this.resetPriority()
  }

  /** 恢复所有规则的局内计数（priority/selectNum/weightDecay 回到初始值） */
  static resetPriority() {
    STRATEGY.forEach(skill => {
      skill.priority = cachePriorityMap.get(skill.match)!
      skill.selectNum = cacheSelectNumMap.get(skill.match)!
      cacheWeightDecayMap.set(skill.match, 0)
    })
  }

  /** 技能名数组 → 按权重降序的 Weight 列表（skillWeightSort 内部按 weight() 计算） */
  static skillWeightSort(skills: string[]) {
    let result: Weight[] = []
    skills.forEach(skill => {
      result.push(this.weight(skill))
    })
    return result.sort((a, b) => b.weight - a.weight)
  }

  /** 计算单个技能名的权重：基础权重 - 优先级*100 - 类型进度*5 - 局内累计衰减（纯函数，不修改状态） */
  static weight(text: string): Weight {
    let weight
    for (let it of STRATEGY) {
      if (it.match.test(text)) {
        weight = { text: text, match: it.match, weight: it.weight - it.priority * 100 - (progressMap.get(it.type) || 0) * 5 - cacheWeightDecayMap.get(it.match)! }
        break
      }
    }
    return weight!
  }

  /** 技能被选中后调用：该规则局内降权——配置了 selectNum 时 priority 降一级，配置了 weightDecay 时累计衰减该值 */
  static onSelected(match: RegExp) {
    for (let it of STRATEGY) {
      if (it.match === match) {
        if (it.selectNum && it.selectNum > 0) {
          it.priority++
          it.selectNum--
        }
        if (it.weightDecay && it.weightDecay > 0) {
          cacheWeightDecayMap.set(match, cacheWeightDecayMap.get(match)! + it.weightDecay)
        }
        break
      }
    }
  }
}
