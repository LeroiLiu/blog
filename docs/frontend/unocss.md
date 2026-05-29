---
title: UnoCSS 使用文档与常见问题
description: UnoCSS 在 Vite、Vue、React 项目中的安装、preset、shortcuts、icons、attributify、性能和常见问题整理。
---

# UnoCSS 使用文档与常见问题

UnoCSS 是按需即时生成的原子化 CSS 引擎。它不是 Tailwind 的简单替代品，而是更偏“可配置 CSS 引擎”的方案。适合熟悉原子化 CSS、希望轻量、可扩展、按需生成样式的项目。

## UnoCSS 和 Tailwind CSS 怎么选

| 需求 | 建议 |
| --- | --- |
| 团队想要官方生态和成熟规范 | Tailwind CSS |
| 想要极轻、可扩展、按需生成 | UnoCSS |
| 需要图标预设、属性化模式、快捷规则 | UnoCSS |
| 团队原子化经验不足 | 先用 Tailwind 或组件库更稳 |

UnoCSS 的自由度更高，也意味着团队更需要约束。

## Vite 安装

```sh
npm install -D unocss
```

`vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS()
  ]
})
```

入口文件引入：

```ts
import 'virtual:uno.css'
```

`uno.config.ts`：

```ts
import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3()
  ]
})
```

## shortcuts

高频组合建议写成 shortcuts，避免页面 class 太长。

```ts
import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3()
  ],
  shortcuts: {
    'app-card': 'rounded-lg bg-white p-4 shadow-sm',
    'app-button': 'rounded-md bg-blue-600 px-4 py-2 text-sm text-white'
  }
})
```

使用：

```html
<div class="app-card">
  <button class="app-button">保存</button>
</div>
```

## rules 自定义规则

如果项目里有固定设计令牌，可以用 rules 扩展。

```ts
export default defineConfig({
  rules: [
    [
      /^text-brand-(\d+)$/,
      ([, size]) => ({
        color: '#2563eb',
        'font-size': `${size}px`
      })
    ]
  ]
})
```

使用：

```html
<div class="text-brand-16">品牌文字</div>
```

自定义规则不要太多，否则后续维护成本会上升。

## Attributify 模式

Attributify 可以把 class 拆到属性上。是否使用看团队习惯。

```html
<button bg="blue-600 hover:blue-700" text="white sm" px="4" py="2" rounded="md">
  保存
</button>
```

优点是结构清晰，缺点是团队成员不熟悉时阅读成本会变高。

## 图标怎么用

UnoCSS 常配合图标预设使用。图标类名通常类似：

```html
<span class="i-lucide-search text-20px"></span>
```

如果图标不显示，检查：

- 是否安装图标预设。
- 是否安装对应图标集合。
- 类名是否被扫描到。
- 是否引入 `virtual:uno.css`。

## 常见问题

### 样式不生效

检查：

- Vite 插件是否配置。
- 是否引入 `virtual:uno.css`。
- `uno.config.ts` 是否被识别。
- preset 是否配置。
- class 是否动态拼接导致无法扫描。

### `presetWind3` 和 `presetUno` 怎么选

新项目按当前文档优先使用 `presetWind3`。旧项目如果已经使用 `presetUno`，不要为了名字更新强行迁移，先确认类名兼容和构建结果。

### 动态 class 丢失

不推荐：

```js
const cls = `text-${color}-500`
```

推荐：

```js
const colorClass = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500'
}
```

### 和 Tailwind 冲突

不要在同一个项目里同时启用 Tailwind 和 UnoCSS，除非非常清楚两者的扫描、reset、类名和构建顺序。一般二选一。

### 生产样式比开发少

通常是扫描范围或动态 class 问题。把关键 class 写成静态字符串，或配置 safelist。

```ts
export default defineConfig({
  safelist: [
    'text-green-500',
    'text-amber-500',
    'text-red-500'
  ]
})
```

## 使用建议

- 先选 preset，再写 shortcuts。
- 设计规范通过 shortcuts 和 theme 收敛。
- 不要滥用自定义 rules。
- 图标、排版、属性模式按需启用。
- 组件库项目里只用 UnoCSS 做布局和局部样式，避免全局冲突。

## 官方入口

- UnoCSS 文档：https://unocss.dev/
- Vite 集成：https://unocss.dev/integrations/vite
- 配置文件：https://unocss.dev/guide/config-file
