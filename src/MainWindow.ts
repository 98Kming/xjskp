import { FloatWindow } from "../component/FloatWindow";
import { PrefCheckBox } from "../component/PrefCheckBox";
import { PrefEnableNumInput } from "../component/PrefEnableNumInput";
import { PrefNumInput } from "../component/PrefNumInput";
import { PrefNumSeekBar } from "../component/PrefNumSeekBar";
import { PrefSpinner } from "../component/PrefSpinner";
import { PrefSwitch } from "../component/PrefSwitch";
import { driverInstance } from "../component/ReactiveFormDriver";

export type MainWindowView = {
  viewPager: JsViewPager
  tabHost: JsTabLayout
  模式: JsSpinner & ConfigurableView<PrefSpinner>
  开局闪退: ConfigurableView<PrefSwitch>
  执行次数: ConfigurableView<PrefEnableNumInput>
  选择关卡: ConfigurableView<PrefEnableNumInput>
  退出等级: ConfigurableView<PrefEnableNumInput>
  开始游戏: ConfigurableView<PrefSwitch>
  组队: View
  组队_功能: View
  enable_组队: ConfigurableView<PrefSwitch>
  队长: ConfigurableView<PrefSwitch>
  队友信息: View
  自动邀请: ConfigurableView<PrefSwitch>
  自动接受邀请: ConfigurableView<PrefSwitch>
  队友名称: JsTextView
  获取队友信息: View
  超时退出: ConfigurableView<PrefEnableNumInput>
  开启倍速: ConfigurableView<PrefSwitch>
  启动: View
  最小化: View
  退出: View & { setOnClickListener: (listener: (view: View) => void) => void }
  识别技能: ConfigurableView<PrefSwitch>
  子弹_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  元素子弹_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  温压弹_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  干冰弹_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  电磁穿刺_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  装甲车_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  冰暴发生器_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  旋风加农_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  燃油弹_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  无人机_seekbar: ConfigurableView<PrefNumSeekBar> & JsSeekBar
  重置技能优先级: View
  邮件: ConfigurableView<PrefSwitch> & JsCheckBox
  好友_领取体力: ConfigurableView<PrefSwitch> & JsCheckBox
  好友_一键赠送: ConfigurableView<PrefSwitch> & JsCheckBox
  先锋宝藏_特惠战令: ConfigurableView<PrefSwitch> & JsCheckBox
  先锋宝藏_免费抽: ConfigurableView<PrefSwitch> & JsCheckBox
  幸运锦鲤_免费福利: ConfigurableView<PrefSwitch> & JsCheckBox
  碧海凉夏_免费抽: ConfigurableView<PrefSwitch> & JsCheckBox
  作战计划_签到: ConfigurableView<PrefSwitch> & JsCheckBox
  寰球救援_领票: ConfigurableView<PrefSwitch> & JsCheckBox
  商店_超时空军团兵碎片: ConfigurableView<PrefSwitch> & JsCheckBox
  食堂: ConfigurableView<PrefSwitch> & JsCheckBox
  军团_每日一刀: ConfigurableView<PrefSwitch> & JsCheckBox
  军团_异域挑战: ConfigurableView<PrefSwitch> & JsCheckBox
  军团_军团商店: ConfigurableView<PrefSwitch> & JsCheckBox
  闪退19次: ConfigurableView<PrefSwitch> & JsCheckBox
  全部账号: ConfigurableView<PrefSwitch> & JsCheckBox
  开始任务: View
  兑换码: View
  战斗_七日突围: ConfigurableView<PrefSwitch> & JsCheckBox
  巡逻车_领取: ConfigurableView<PrefSwitch> & JsCheckBox
  随机事件_领取: ConfigurableView<PrefSwitch> & JsCheckBox
  寰球远征_免费: ConfigurableView<PrefSwitch> & JsCheckBox
  终末危机_扫荡: ConfigurableView<PrefSwitch> & JsCheckBox
  引航行动_时域珍藏: ConfigurableView<PrefSwitch> & JsCheckBox
  引航行动_每日观察: ConfigurableView<PrefSwitch> & JsCheckBox
}
export class MainWindow extends FloatWindow<MainWindowView> {
  constructor() {
    super('layoutFile:../layout/layout.xml');
    this.windowOutSideDisableFocus(this.window)
    this.findAllInput(this.mView)
  }

  show() {
    ui.run(() => {
      this.mView.setVisibility(0)
      this.window.requestFocus()
    })
  }

  hide() {
    ui.run(() => {
      this.mView.setVisibility(8)
      this.window.disableFocus()
    })
  }
}

ui.registerWidget("pref-checkbox", () => new PrefCheckBox());
ui.registerWidget("pref-switch", () => new PrefSwitch());
ui.registerWidget("pref-num-input", () => new PrefNumInput());
ui.registerWidget("pref-enable-num-input", () => new PrefEnableNumInput());
ui.registerWidget("pref-num-seekbar", () => new PrefNumSeekBar());
ui.registerWidget("pref-spinner", () => new PrefSpinner());

export const mainWindow = new MainWindow()

export enum GameType { 普通关卡 = '普通关卡', 精英关卡 = '精英关卡', 寰球救援 = '寰球救援', 元素试炼 = '元素试炼', 寰球远征_准备 = '寰球远征_准备' }

const RUN_FOREVER = -1

export abstract class GameConfig {
  abstract type: GameType
  runNum: number = RUN_FOREVER // 执行次数，-1为一直执行

  /** 校验 type 是否为合法 GameType */
  validateConfig(): void {
    if (!Object.values(GameType).includes(this.type)) {
      throw new Error(`GameConfig: type "${this.type}" 不是有效的 GameType`)
    }
  }
  selectStage: number = 0 // 选择的关卡，0为默认
  exitLevel: number = 0 // 提前退出等级，99为不提前退出
  timeOut: number = 0 // 超时退出时间
  abstract enableStart: boolean // 开始游戏
  enableTeam: boolean = false
  isLeader: boolean = false
  invite: boolean = false
  acceptInvite = false
  teammate?: Teammate
  identifySkill = false // 识别技能
}

ui.run(() => {
  mainWindow.window.viewPager.setTitles(['功能', '技能', '日常'])
  mainWindow.window.tabHost.setupWithViewPager(mainWindow.window.viewPager);
})

const formRules: VisibilityRule[] = [
  {
    view: mainWindow.window.开局闪退,
    targetKey: mainWindow.window.开局闪退.widget.getKey(),
    shows: [GameType.普通关卡, GameType.精英关卡],
    hides: []
  },
  {
    view: mainWindow.window.选择关卡,
    targetKey: mainWindow.window.选择关卡.widget.getKey(),
    shows: [GameType.普通关卡, GameType.精英关卡],
    hides: []
  },
  {
    view: mainWindow.window.退出等级,
    targetKey: mainWindow.window.退出等级.widget.getKey(),
    shows: [],
    hides: [mainWindow.window.开局闪退.widget.getKey(), GameType.元素试炼]
  },
  {
    view: mainWindow.window.超时退出,
    targetKey: mainWindow.window.超时退出.widget.getKey(),
    shows: [],
    hides: [mainWindow.window.开局闪退.widget.getKey()]
  },
  {
    view: mainWindow.window.开始游戏,
    targetKey: mainWindow.window.开始游戏.widget.getKey(),
    shows: [],
    hides: [mainWindow.window.开局闪退.widget.getKey(), mainWindow.window.自动接受邀请.widget.getKey()]
  },

  {
    view: mainWindow.window.enable_组队,
    targetKey: mainWindow.window.enable_组队.widget.getKey(),
    shows: [GameType.精英关卡, GameType.寰球救援],
    hides: [mainWindow.window.开局闪退.widget.getKey()]
  },

  {
    view: mainWindow.window.队长,
    targetKey: mainWindow.window.队长.widget.getKey(),
    shows: [mainWindow.window.enable_组队.widget.getKey()],
    hides: []
  },

  {
    view: mainWindow.window.自动邀请,
    targetKey: mainWindow.window.自动邀请.widget.getKey(),
    shows: [mainWindow.window.队长.widget.getKey()],
    hides: []
  },

  {
    view: mainWindow.window.自动接受邀请,
    targetKey: mainWindow.window.自动接受邀请.widget.getKey(),
    shows: [mainWindow.window.enable_组队.widget.getKey()],
    hides: [mainWindow.window.队长.widget.getKey()]
  },
  {
    view: mainWindow.window.队友信息,
    targetKey: '队友信息',
    shows: [mainWindow.window.自动邀请.widget.getKey(), mainWindow.window.自动接受邀请.widget.getKey()],
    hides: []
  }

];

driverInstance.setRules(formRules)