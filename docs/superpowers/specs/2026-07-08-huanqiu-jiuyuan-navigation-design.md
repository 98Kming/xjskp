# 寰球救援导航设计

## 问题

历练大厅中有"寰球救援"和"寰球远征"两个入口，使用相同样式的"挑战"按钮图，
仅靠按钮图无法区分。寰球救援的入口是"救援"标识下方的第一个挑战按钮。

## 方案

### 1. imageNameParser 兼容无坐标格式

`$挑战_0_0.9.png` 去掉了坐标后缀，无固定搜索区域。
解析器优先匹配 6 段坐标后缀，失败则尝试 2 段 `_cache_threshold`，
无坐标时默认全屏 `(0, 0, w, h)`。

### 2. createAnchoredAction 工具函数

新增 `img.ts` 工具函数。模式：找标识图(锚点) → 限制搜索区域 → 找目标按钮 → 点击。

```
createAnchoredAction(anchorPath, targetPath)
  → 截图
  → 用 anchor 图找标识位置
  → 在标识图下方区域搜索 target 图
  → 点击第一个匹配
```

### 3. 历练大厅新增路由

```
历练大厅 → 寰球救援: createAnchoredAction(历练大厅_救援, $挑战)
```

## 改动文件

- `src/utils/img.ts` — imageNameParser 兼容 + createAnchoredAction
- `src/pages/历练大厅.ts` — 新增路由
- `src/test-navigation.ts` — 新增测试
- `src/main.ts` — 无需改动（寰球救援已注册）
