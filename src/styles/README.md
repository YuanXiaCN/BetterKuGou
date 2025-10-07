# 样式系统文档

## 目录结构
- variables.css: 定义所有CSS变量
- components.css: 通用组件样式
- utilities.css: 工具类样式
- index.css: 样式入口文件

## 使用方法
在需要使用CSS变量的组件中，可以直接引用定义的变量:
\```css
.my-component {
  background-color: var(--primary-color);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-medium);
}
\```

## CSS变量列表

### 颜色系统

#### 主色调
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --primary-color | #1890ff | 全局主色调 | 按钮、链接、进度条等 |
| --primary-color-hover | #40a9ff | 主色调悬停状态 | 按钮悬停、链接悬停等 |
| --primary-color-active | #096dd9 | 主色调激活状态 | 按钮按下、激活状态元素 |

#### 功能性颜色
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --success-color | #52c41a | 成功状态颜色 | 成功提示、成功按钮等 |
| --warning-color | #faad14 | 警告状态颜色 | 警告提示、警告按钮等 |
| --error-color | #ff4d4f | 错误状态颜色 | 错误提示、错误按钮等 |
| --info-color | #1890ff | 信息状态颜色 | 信息提示、信息按钮等 |

#### 中性色
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --text-color-primary | rgba(0, 0, 0, 0.85) | 主要文本颜色 | 大部分文本内容 |
| --text-color-secondary | rgba(0, 0, 0, 0.65) | 次要文本颜色 | 次要信息、描述文字 |
| --text-color-tertiary | rgba(0, 0, 0, 0.45) | 第三级文本颜色 | 占位符、辅助说明 |
| --border-color-base | #d9d9d9 | 边框基础颜色 | 输入框、表格、分割线等 |
| --border-color-split | #f0f0f0 | 分割线颜色 | 分割线、边框等 |
| --background-color-base | #f5f5f5 | 背景基础颜色 | 页面背景、容器背景 |
| --background-color-light | #fafafa | 浅背景颜色 | 卡片、面板背景 |

### 间距系统
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --spacing-xs | 4px | 超小间距 | 小元素间距离 |
| --spacing-small | 8px | 小间距 | 按钮内边距、小元素间距 |
| --spacing-medium | 16px | 中等间距 | 模块内边距、常规间距 |
| --spacing-large | 24px | 大间距 | 模块间距离 |
| --spacing-xl | 32px | 超大间距 | 大模块间距 |

### 字体系统
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --font-size-xs | 10px | 超小字体 | 特殊小字标注 |
| --font-size-small | 12px | 小字体 | 辅助说明文字 |
| --font-size-base | 14px | 基础字体 | 默认正文大小 |
| --font-size-medium | 16px | 中等字体 | 标题、重要信息 |
| --font-size-large | 20px | 大字体 | 主标题 |
| --font-weight-normal | 400 | 正常字重 | 常规文本 |
| --font-weight-bold | 600 | 粗体字重 | 标题、强调文本 |

### 圆角系统
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --border-radius-small | 2px | 小圆角 | 按钮、输入框等 |
| --border-radius-medium | 4px | 中等圆角 | 卡片、面板等 |
| --border-radius-large | 8px | 大圆角 | 模块容器等 |

### 阴影系统
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --box-shadow-base | 0 2px 8px rgba(0, 0, 0, 0.15) | 基础阴影 | 弹窗、下拉菜单等 |
| --box-shadow-card | 0 4px 12px rgba(0, 0, 0, 0.1) | 卡片阴影 | 卡片组件 |

### 过渡动画
| 变量名 | 值 | 描述 | 应用组件 |
|--------|-----|------|---------|
| --transition-duration | 0.3s | 过渡动画时长 | 所有交互动画 |
| --transition-ease | cubic-bezier(0.4, 0, 0.2, 1) | 过渡动画曲线 | 所有交互动画 |

## 工具类

### 文本对齐
- .text-left: 左对齐
- .text-center: 居中对齐
- .text-right: 右对齐

### 间距工具类
- .m-*: 外边距 (margin)
- .p-*: 内边距 (padding)
- .mt-*, .mr-*, .mb-*, .ml-*: 单方向外边距
- .pt-*, .pr-*, .pb-*, .pl-*: 单方向内边距

示例:
\```html
<div class="p-medium m-large text-center">居中内容</div>
\```

## 通用组件样式

### 按钮 (Button)
默认样式包含:
- 基础背景色: var(--primary-color)
- 悬停背景色: var(--primary-color-hover)
- 激活背景色: var(--primary-color-active)
- 圆角: var(--border-radius-small)
- 内边距: var(--spacing-small) var(--spacing-medium)

### 输入框 (Input)
默认样式包含:
- 边框颜色: var(--border-color-base)
- 悬停边框颜色: var(--primary-color)
- 焦点边框颜色: var(--primary-color)
- 圆角: var(--border-radius-small)
- 内边距: var(--spacing-small)

### 卡片 (Card)
默认样式包含:
- 背景色: var(--background-color-light)
- 边框: 1px solid var(--border-color-split)
- 圆角: var(--border-radius-medium)
- 阴影: var(--box-shadow-card)
- 内边距: var(--spacing-medium)

## 自定义主题
可以通过覆盖CSS变量来自定义主题:
\```css
:root {
  --primary-color: #your-custom-color;
  --border-radius-medium: 6px;
}
\```