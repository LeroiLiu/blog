---
title: Element Plus 常见问题
description: Element Plus 在 Vue 3 项目中的表单、表格、图标、按需引入、主题定制和迁移常见问题。
---

# Element Plus 常见问题

Element Plus 主要用于 Vue 3 项目。它不是 Element UI 2.x 的简单改名，组件 API、图标、类型和主题配置都有差异。

## 图标不显示

Element Plus 图标需要单独安装和引入。

```sh
npm install @element-plus/icons-vue
```

使用：

```vue
<script setup>
  import { Search } from '@element-plus/icons-vue'
</script>
<template>
  <el-icon>
    <Search />
  </el-icon>
</template>
```

## 表单校验类型报错

Vue 3 + TypeScript 项目建议给表单和 rules 明确类型。

```html
interface Form {
name: string
}
const form = reactive
<Form>
  ({
  name: ''
  })
```

## 按需引入怎么做

Vite 项目通常使用自动导入插件减少手动引入成本。要注意自动导入配置和样式导入是否完整。

如果组件能用但样式丢失，多半是样式没有正确引入。

## 表格高度或列宽异常

常见原因：

- 父容器高度不稳定。
- 弹窗或 tabs 内初始化时不可见。
- 数据异步更新后布局未刷新。

可以在展示后重新计算布局，或给容器明确高度。

## 从 Element UI 迁移要注意什么

重点检查：

- 图标体系变化。
- 表单和表格 API 差异。
- `v-model` 写法变化。
- 插槽语法变化。
- 主题变量和样式覆盖方式变化。
- TypeScript 类型约束。

不要直接批量替换组件名，最好按页面逐步迁移。

## 官方入口

- Element Plus 文档：https://element-plus.org/
