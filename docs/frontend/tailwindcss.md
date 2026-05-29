---
title: Tailwind CSS 使用文档与常见问题
description: Tailwind CSS 在 Vite、Vue、React 和普通前端项目中的安装、配置、实用类、主题、响应式、生产构建和常见问题整理。
---

# Tailwind CSS 使用文档与常见问题

Tailwind CSS 是 utility-first 的 CSS 框架。它不是传统组件库，而是一套原子化样式工具。适合快速构建自定义界面，也适合和 Vue、React、Svelte、Laravel、Nuxt 等项目搭配。

## 适合什么项目

| 场景 | 建议 |
| --- | --- |
| 定制化强的 Web 页面 | 适合 |
| 后台系统 | 适合，但要封装业务组件 |
| 文档站、官网、活动页 | 适合 |
| uni-app 小程序 | 不建议直接照搬 Web 写法 |
| 团队没有统一设计规范 | 容易写成一页一种风格 |

Tailwind 的核心价值是“少写 CSS 文件”，但不等于“不做设计规范”。

## Vite 项目安装

Tailwind CSS v4 推荐使用 Vite 插件。

```sh
npm install tailwindcss @tailwindcss/vite
```

`vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss()
  ]
})
```

入口 CSS：

```css
@import "tailwindcss";
```

页面中使用：

```html
<h1 class="text-3xl font-bold text-slate-900">
  Hello Tailwind
</h1>
```

老项目如果使用 Tailwind v3，可能还有 `tailwind.config.js`、`content`、`@tailwind base` 这套写法。维护时先确认版本。

## Vue 中使用

```vue
<template>
  <button class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
    保存
  </button>
</template>
```

当 class 很长时，建议封装组件，而不是每个页面复制一长串。

```vue
<template>
  <button class="app-button" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  disabled: Boolean
})
</script>

<style scoped>
.app-button {
  @apply rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50;
}
</style>
```

## 响应式写法

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div class="rounded-lg bg-white p-4 shadow-sm">A</div>
  <div class="rounded-lg bg-white p-4 shadow-sm">B</div>
</div>
```

常见断点前缀：

| 前缀 | 含义 |
| --- | --- |
| `sm:` | 小屏以上 |
| `md:` | 中等屏以上 |
| `lg:` | 大屏以上 |
| `xl:` | 更大屏 |
| `2xl:` | 超大屏 |

## 暗黑模式

常见写法：

```html
<div class="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
  内容
</div>
```

如果暗黑模式文字看不见，通常是只改了背景，没有给文字、边框、阴影同步写 `dark:` 状态。

## 常见问题

### 样式没有生效

排查：

- 是否引入了入口 CSS。
- Vite 插件是否配置。
- 当前 Tailwind 版本是否和文档写法一致。
- class 是否是动态拼接导致无法扫描。
- 组件库样式是否覆盖了 Tailwind。

不推荐：

```js
const color = 'blue'
const cls = 'bg-' + color + '-500'
```

推荐把可能的 class 写完整：

```js
const buttonClass = active ? 'bg-blue-500' : 'bg-gray-300'
```

### class 太长怎么办

处理方式：

- 抽组件。
- 使用 `@apply` 收敛高频组合。
- 用设计变量限制颜色和间距。
- 不要在业务页面里复制大段 class。

### 和组件库冲突怎么办

Tailwind 和组件库混用时，重点处理：

- reset/preflight 影响。
- class 优先级。
- 组件库主题变量。
- 暗黑模式策略。

如果只是后台系统，通常建议：组件库负责基础组件，Tailwind 负责页面布局和局部微调。

### 生产环境样式丢失

通常是动态 class 没被扫描到。把动态值改成白名单式映射。

```js
const colorMap = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500'
}
```

## 使用建议

- 先定颜色、字号、间距、圆角规则。
- 按钮、输入框、卡片、弹窗要封装。
- 页面布局可以直接用 utility class。
- 复杂状态不要只靠 class 拼接，必要时拆组件。
- 不要把 Tailwind 当成设计规范本身。

## 官方入口

- Tailwind CSS 文档：https://tailwindcss.com/docs
- Vite 安装：https://tailwindcss.com/docs/installation/using-vite
