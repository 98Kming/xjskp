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