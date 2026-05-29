---
title: 前端
description: TypeScript、Vite、Canvas、Konva.js、Fabric.js、Vue、后台管理模板、vue-admin-template、vue-element-admin、mall-admin-web、Geeker Admin、iView UI v4、iview-admin、uni-app、uView UI、vk-uview-ui、uview-plus、ColorUI、Tailwind CSS、UnoCSS、微信小程序、支付宝小程序、抖音小程序、Electron、Element UI、Element Plus 前端技术栈总览。
---

# 前端

这里整理前端技术栈相关内容，适合放版本差异、图形编辑、常见问题、迁移建议和项目维护经验。

## 技术栈

| 技术 | 页面 | 内容 |
| --- | --- | --- |
| Canvas | [Canvas 常见问题](/frontend/canvas) | 原生 Canvas 绘制、高清屏、动画、坐标、导出、性能 |
| Konva.js | [Konva.js 常见问题](/frontend/konva) | Stage、Layer、节点、拖拽、Transformer、导出和性能 |
| Fabric.js | [Fabric.js 常见问题](/frontend/fabric) | 海报编辑、图片编辑、对象模型、JSON、SVG、导出 |
| Vue | [Vue 总览](/frontend/vue) | Vue 2、Vue 3、迁移和项目选型 |
| Vue | [Vue 2 常见问题](/frontend/vue-2) | 选项式 API、响应式限制、生命周期、组件通信 |
| Vue | [Vue 3 常见问题](/frontend/vue-3) | Composition API、`setup`、Pinia、Vite、TypeScript |
| TypeScript | [TypeScript 使用文档](/frontend/typescript) | tsconfig、路径别名、类型声明、Vue 类型、第三方库类型和常见报错 |
| Vite | [Vite 使用文档](/frontend/vite) | 环境变量、alias、proxy、base、HMR、依赖预构建、打包和常见报错 |
| 后台管理模板 | [后台模板选型](/frontend/admin-templates) | vue-admin-template、vue-element-admin、mall-admin-web、Geeker Admin、iView UI v4、iview-admin 选型和排错 |
| vue-element-admin | [vue-element-admin 与 vue-admin-template](/frontend/vue-element-admin) | Vue 2、Element UI、权限路由、TagsView、登录、部署和常见报错 |
| mall-admin-web | [mall-admin-web](/frontend/mall-admin-web) | mall 后台前端、登录权限、商品订单、上传、前后端版本和部署问题 |
| Geeker Admin | [Geeker Admin](/frontend/geeker-admin) | Vue 3、TypeScript、Vite、Pinia、Element Plus 后台模板问题 |
| iView UI v4 | [iView UI v4 与 View UI](/frontend/iview-ui-v4) | Vue 2 项目里 View UI 的表单、表格、上传、日期和样式问题 |
| iview-admin | [iview-admin](/frontend/iview-admin) | Vue 2、iView/View UI 后台模板、权限菜单、缓存和构建部署 |
| uni-app | [uni-app 常见问题](/frontend/uni-app) | <code>Vue2/Vue3</code>、H5、App、小程序端差异 |
| uView UI | [uView UI 使用文档](/frontend/uview-ui) | uni-app 项目安装、表单、主题、nvue、多端兼容和常见问题 |
| vk-uview-ui | [vk-uview-ui 使用文档](/frontend/vk-uview-ui) | 历史项目维护、Vue2/Vue3 兼容、迁移和常见问题 |
| uview-plus | [uview-plus 使用文档](/frontend/uview-plus) | uni-app Vue3 项目安装、配置、组件、主题和迁移 |
| ColorUI | [ColorUI 使用文档](/frontend/colorui) | ColorUI、ColorUI3.x、MP-CU、样式体系和小程序页面维护 |
| Tailwind CSS | [Tailwind CSS 使用文档](/frontend/tailwindcss) | Vite、Vue、响应式、暗黑模式、动态 class 和生产问题 |
| UnoCSS | [UnoCSS 使用文档](/frontend/unocss) | Vite、preset、shortcuts、icons、attributify 和常见问题 |
| 微信小程序 | [微信小程序常见问题](/frontend/wechat-miniprogram) | 基础库、登录、支付、订阅消息、分包、审核 |
| 微信小程序 | [微信小程序开发问题](/frontend/wechat-miniprogram-issues) | request 域名、登录、手机号、支付、订阅消息、setData、组件样式 |
| 支付宝小程序 | [支付宝小程序开发问题](/frontend/alipay-miniprogram-issues) | my.request、my.getAuthCode、授权、支付、页面跳转、样式和审核 |
| 抖音小程序 | [抖音小程序开发问题](/frontend/douyin-miniprogram-issues) | tt.request、tt.login、tt.pay、分包、宿主差异、审核和真机调试 |
| Electron | [Electron 常见问题](/frontend/electron) | 主进程、渲染进程、preload、打包、自动更新 |
| Element UI | [Element UI 2.x](/frontend/element-ui-2) | Vue 2 项目里的 Element UI 维护问题 |
| Element Plus | [Element Plus](/frontend/element-plus) | Vue 3 项目里的 Element Plus 常见问题 |

## 选型建议

新 Web 项目优先 Vue 3、TypeScript、Vite、Pinia、Element Plus。已有 Vue 2 项目如果运行稳定，可以继续维护，但需要评估 Vue 2 和 Element UI 的长期维护风险。

TypeScript 和 Vite 是现代前端项目里最常见的基础组合。TypeScript 负责类型边界和重构安全，Vite 负责开发服务、环境变量、资源处理和生产构建。遇到白屏、路径别名、环境变量、构建路径和类型报错时，优先看 [TypeScript 使用文档](/frontend/typescript) 与 [Vite 使用文档](/frontend/vite)。

后台管理系统要先分清是 Vue 2 老模板还是 Vue 3 新模板。已有 Vue 2 项目可以继续维护 vue-element-admin、vue-admin-template、mall-admin-web 或 iview-admin；新项目优先看 Vue 3、TypeScript、Vite、Pinia、Element Plus 这一类组合，例如 [Geeker Admin](/frontend/geeker-admin)。

跨端项目要先判断核心运行端：如果主要是微信小程序，就要优先按小程序限制设计；如果主要是 H5 和 App，uni-app 的跨端复用收益会更明显。

uni-app UI 选型要先看项目版本：Vue2 老项目可以继续维护 uView UI 或历史分支，新 Vue3 项目优先评估 uview-plus；如果只是做样式和活动页，可以看 ColorUI。Web 项目里 Tailwind CSS 和 UnoCSS 更适合布局与样式体系，不建议直接套到小程序端。

图形编辑类项目要先判断交互复杂度：只是生成图片可以用原生 Canvas；需要拖拽、选择、缩放、图层和对象保存时，优先评估 Konva.js 或 Fabric.js。
