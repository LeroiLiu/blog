---
title: Vue
description: Vue 2、Vue 3 不同版本、项目选型、迁移建议和常见问题入口。
---

Vue 是前端项目常用框架。当前新项目通常优先使用 Vue 3；Vue 2 多用于存量项目维护。

## 版本关系

| 版本 | 状态 | 适合场景 |
| --- | --- | --- |
| Vue 2 | 存量维护 | 老项目、Element UI 2.x、旧 webpack 工程 |
| Vue 3 | 新项目优先 | 新后台、新 H5、Vite、TypeScript、Element Plus |

## 页面入口

| 页面 | 内容 |
| --- | --- |
| [Vue 2 常见问题](/frontend/vue-2) | 响应式限制、`this`、生命周期、组件通信、Vuex |
| [Vue 3 常见问题](/frontend/vue-3) | Composition API、`setup`、Pinia、Vite、TypeScript |

## Vue 2 到 Vue 3 迁移重点

| 项目 | 注意事项 |
| --- | --- |
| UI 组件库 | Element UI 通常迁移到 Element Plus |
| 状态管理 | Vuex 可逐步迁移到 Pinia |
| 构建工具 | webpack 项目可评估迁移到 Vite |
| 写法 | Options API 可继续用，也可逐步引入 Composition API |
| 第三方依赖 | 先确认插件是否支持 Vue 3 |

## 官方入口

- Vue 文档：https://vuejs.org/
- Vue 2 文档：https://v2.vuejs.org/
- Vue 2 EOL 说明：https://v2.vuejs.org/eol/
