# 图标替换指南

## 图标文件位置

所有标题栏图标文件位于：`src/icon/`

当前使用的图标文件：
- `minimize.svg` - 最小化按钮图标
- `full_screen_maximize.svg` - 最大化按钮图标
- `full_screen_minimize.svg` - 还原按钮图标
- `close.svg` - 关闭按钮图标

## 如何替换图标

### 方法 1：直接替换文件（推荐）

1. 准备好新的 SVG 图标文件
2. 确保文件名与上述文件名一致
3. 将新图标文件复制到 `src/icon/` 目录，覆盖原文件
4. 重新启动或刷新应用即可看到新图标

**注意：** 使用此方法时，文件名必须保持不变。

### 方法 2：修改导入路径

如果您想使用不同的文件名，可以修改 `src/components/TitleBar.vue` 文件中的导入语句：

```javascript
// 在文件顶部找到这些导入语句
import minimizeIcon from '../icon/minimize.svg'
import maximizeIcon from '../icon/full_screen_maximize.svg'
import restoreIcon from '../icon/full_screen_minimize.svg'
import closeIcon from '../icon/close.svg'

// 修改为新的文件路径，例如：
import minimizeIcon from '../icon/my-minimize-icon.svg'
```

### 方法 3：使用配置文件（未来扩展）

如果需要更灵活的配置，可以创建一个配置文件来管理所有图标路径：

```javascript
// src/config/icons.js
export default {
  titleBar: {
    minimize: new URL('../icon/minimize.svg', import.meta.url).href,
    maximize: new URL('../icon/full_screen_maximize.svg', import.meta.url).href,
    restore: new URL('../icon/full_screen_minimize.svg', import.meta.url).href,
    close: new URL('../icon/close.svg', import.meta.url).href
  }
}
```

## 图标设计规范

为确保图标显示效果最佳，建议遵循以下规范：

### 文件格式
- 格式：SVG
- 推荐尺寸：1024x1024 或更小的正方形
- 颜色：单色或使用 `currentColor`（会自动适配主题色）

### 设计建议
- 保持图标简洁清晰
- 线条粗细适中（建议 2-4px）
- 确保在小尺寸下依然清晰可辨
- 使用统一的设计风格

### 颜色处理
图标颜色会通过 CSS filter 自动调整：
- **默认状态**：灰色 (`#888888`)
- **悬停状态**：白色 (`#ffffff`)
- **关闭按钮悬停**：红色 (`#e81123`)

如果您的 SVG 使用了 `fill="currentColor"`，颜色会自动适配。
如果使用了固定颜色，filter 会将其转换为上述颜色。

## 示例：替换关闭按钮图标

1. 准备新的关闭图标 `new-close.svg`
2. 将文件重命名为 `close.svg`
3. 复制到 `src/icon/` 目录，覆盖原文件
4. 重启应用或热更新即可看到新图标

## 动画效果

图标具有以下动画效果（无需修改）：
- **悬停时**：图标放大 1.15 倍（关闭按钮 1.2 倍）
- **颜色过渡**：250ms 平滑过渡
- **缩放过渡**：250ms 平滑过渡

这些效果会自动应用到新图标上。

## 故障排除

### 图标不显示
- 检查文件路径是否正确
- 确认 SVG 文件格式正确
- 尝试清除浏览器缓存

### 图标颜色不正确
- 确保 SVG 使用 `fill="currentColor"` 或单色填充
- 检查 CSS filter 是否正确应用

### 图标大小不合适
- 修改 `TitleBar.vue` 中的 `.icon` 样式
- 调整 `width` 和 `height` 属性（当前为 18px）

## 相关文件

- **组件文件**：`src/components/TitleBar.vue`
- **图标目录**：`src/icon/`
- **样式变量**：`src/styles/variables.css`

## 技术说明

图标使用 Vite 的静态资源导入功能：
- 支持热更新
- 自动优化
- 构建时会被正确打包

颜色处理使用 CSS filter 实现，兼容性好且易于维护。
