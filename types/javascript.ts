interface ImageParseResult {

  /** 是否缓存坐标 (0=不缓存, 1=缓存) */
  cache: 0 | 1;
  /** 匹配阈值 (0-1之间的浮点数) */
  threshold: number;
  /** 搜索区域 x1 */
  x1: number;
  /** 搜索区域 y1 */
  y1: number;
  /** 搜索区域 x2 (数字 或 'w' 表示屏幕宽度) */
  x2: number;
  /** 搜索区域 y2 (数字 或 'h' 表示屏幕高度) */
  y2: number;
  /** 原始文件名 */
  rawFileName: string;
}
interface ConfigurableWidget {
  getKey(): string;
  setVisibility(visibility: number): void
  getVisibility(): number
}
type ConfigurableView<T extends ConfigurableWidget> = {
  setVisibility(visibility: number): void;
  getVisibility(): number;
  attr(name: string): string | undefined;
  getParent(): ConfigurableView<T> | null;
  widget: T
  //[x: string]: PrefView | any;
} & View
// 定义可见性常量
const enum ViewVisibility {
  Visible = 0,
  Gone = 8
}
type VisibilityRule = {
  view?: ConfigurableView<ConfigurableWidget> | View// 需要设置显示或隐藏的视图
  targetKey: string // 该视图自身的状态 Key
  shows: string[] // 【OR 逻辑】：列表中只要有一个 Key 为 true并且显示，则满足显示条件
  hides: string[] // 【AND 排斥逻辑】：列表中只要有一个 Key 为 true并且显示，则直接隐藏 (优先级最高)
}