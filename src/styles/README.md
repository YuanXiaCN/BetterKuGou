# 样式系统说明文档

## 目录结构

```
src/styles/
├── index.css          # 样式入口文件（导入所有样式）
├── variables.css      # CSS 变量定义（颜色、尺寸、字体等）
├── reset.css          # CSS 重置样式
├── mixins.css         # CSS 工具类/混合器
└── components.css     # 通用组件样式
```

## 使用方法

### 1. 导入样式

在 `main.js` 中导入全局样式：

```javascript
import './styles/index.css'
```

### 2. 使用 CSS 变量

在组件的 `<style>` 标签中使用预定义的 CSS 变量：

```vue
<style scoped>
.my-component {
  background-color: var(--color-background);
  color: var(--color-text);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
</style>
```

## CSS 变量列表

### 颜色系统

#### 主色调
- `--color-primary`: 主色
- `--color-primary-hover`: 主色悬停
- `--color-primary-active`: 主色激活

#### 背景色
- `--color-background`: 主背景色
- `--color-background-light`: 浅色背景
- `--color-background-lighter`: 更浅的背景

#### 文字颜色
- `--color-text`: 主文字颜色
- `--color-text-secondary`: 次要文字
- `--color-text-tertiary`: 第三级文字

#### 边框颜色
- `--color-border`: 边框颜色
- `--color-border-light`: 浅色边框

#### 标题栏颜色
- `--titlebar-bg`: 标题栏背景
- `--titlebar-height`: 标题栏高度
- `--titlebar-btn-width`: 标题栏按钮宽度
- `--titlebar-btn-hover`: 按钮悬停背景
- `--titlebar-close-hover`: 关闭按钮悬停
- `--titlebar-icon-color`: 图标颜色
- `--titlebar-icon-hover`: 图标悬停颜色

### 间距系统

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px

### 圆角

- `--radius-sm`: 小圆角 (4px)
- `--radius-md`: 中圆角 (8px)
- `--radius-lg`: 大圆角 (12px)
- `--radius-full`: 完全圆角

### 字体

#### 字体族
- `--font-family`: 系统字体栈

#### 字体大小
- `--font-size-xs`: 12px
- `--font-size-sm`: 14px
- `--font-size-base`: 16px
- `--font-size-lg`: 18px
- `--font-size-xl`: 20px
- `--font-size-2xl`: 24px

### 阴影

- `--shadow-sm`: 小阴影
- `--shadow-md`: 中阴影
- `--shadow-lg`: 大阴影

### 过渡动画

- `--transition-fast`: 150ms 快速过渡
- `--transition-base`: 250ms 基础过渡
- `--transition-slow`: 350ms 慢速过渡

### Z-index 层级

- `--z-dropdown`: 1000
- `--z-sticky`: 1020
- `--z-fixed`: 1030
- `--z-modal-backdrop`: 1040
- `--z-modal`: 1050
- `--z-popover`: 1060
- `--z-tooltip`: 1070

## 工具类

### Flexbox 布局

```html
<div class="flex">基础 flex</div>
<div class="flex-center">居中对齐</div>
<div class="flex-between">两端对齐</div>
<div class="flex-start">起始对齐</div>
<div class="flex-end">结束对齐</div>
<div class="flex-column">纵向排列</div>
```

### 文本样式

```html
<div class="text-ellipsis">文本省略</div>
<div class="text-center">居中文本</div>
<div class="text-left">左对齐文本</div>
<div class="text-right">右对齐文本</div>
```

### 用户交互

```html
<div class="no-select">禁止选择</div>
<div class="draggable">可拖动区域（Electron）</div>
<div class="no-drag">不可拖动（Electron）</div>
```

### 可见性

```html
<div class="hidden">完全隐藏</div>
<div class="invisible">不可见但占位</div>
```

### 圆角

```html
<div class="rounded-sm">小圆角</div>
<div class="rounded-md">中圆角</div>
<div class="rounded-lg">大圆角</div>
<div class="rounded-full">完全圆角</div>
```

### 阴影

```html
<div class="shadow-sm">小阴影</div>
<div class="shadow-md">中阴影</div>
<div class="shadow-lg">大阴影</div>
```

### 过渡动画

```html
<div class="transition">基础过渡</div>
<div class="transition-fast">快速过渡</div>
<div class="transition-slow">慢速过渡</div>
```

## 通用组件样式

### 按钮

```html
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
```

### 输入框

```html
<input class="input" type="text" placeholder="输入文本" />
```

### 卡片

```html
<div class="card">
  卡片内容
</div>
```

### 分割线

```html
<div class="divider"></div>
```

### 动画

```html
<div class="loading">加载中...</div>
<div class="fade-in">淡入</div>
<div class="fade-out">淡出</div>
```

## 自定义主题

如果需要修改主题颜色或其他变量，只需编辑 `src/styles/variables.css` 文件：

```css
:root {
  /* 修改主色调 */
  --color-primary: #your-color;
  
  /* 修改背景色 */
  --color-background: #your-color;
  
  /* 等等... */
}
```

## 最佳实践

1. **优先使用 CSS 变量**：始终使用预定义的变量，避免硬编码颜色和尺寸值
2. **使用工具类**：对于常用的样式组合，优先使用工具类
3. **保持一致性**：在整个应用中使用相同的变量和工具类
4. **按需扩展**：如需新的变量或工具类，添加到相应的文件中
5. **避免覆盖**：尽量不要在组件中覆盖全局样式，而是通过变量自定义

## 示例

完整的组件样式示例：

```vue
<template>
  <div class="my-component card">
    <h2 class="title">标题</h2>
    <p class="text-ellipsis">这是一段很长的文本...</p>
    <div class="flex-between">
      <button class="btn btn-secondary">取消</button>
      <button class="btn btn-primary">确认</button>
    </div>
  </div>
</template>

<style scoped>
.my-component {
  max-width: 500px;
  margin: var(--spacing-lg) auto;
}

.title {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
}
</style>
```
