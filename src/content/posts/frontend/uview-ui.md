---
title: uView UI 使用文档与常见问题
description: uView UI 在 uni-app 项目中的安装、配置、表单、主题、组件使用、多端兼容和常见报错整理。
---

uView UI 是 uni-app 生态里常见的 UI 框架，适合快速搭建小程序、H5、App 等多端页面。老项目里经常会遇到 uView 1.x、uView 2.x、Vue2、Vue3、nvue、分包等差异，所以维护时要先确认项目版本。

## 适合什么项目

| 场景 | 建议 |
| --- | --- |
| uni-app Vue2 老项目 | 可以继续维护 uView UI |
| 新 uni-app Vue3 项目 | 优先评估 uview-plus |
| 多端页面快速开发 | 可以使用组件、工具函数和样式变量 |
| 高度定制设计系统 | 需要提前评估覆盖样式和主题成本 |

如果项目已经稳定，不建议为了“升级组件库”单独大改。先列出使用到的组件，再逐个验证目标端表现。

## 安装方式

常见 npm 安装：

```sh
npm install uview-ui
```

`main.js` 中注册：

```js
import Vue from 'vue'
import uView from 'uview-ui'

Vue.use(uView)
```

`App.vue` 中引入基础样式：

```vue
<style lang="scss">
@import 'uview-ui/index.scss';
</style>
```

如果是 HBuilderX 插件市场导入项目，路径可能不同，要按项目实际目录调整。

## 常用配置

一般会在 `uni.scss` 或全局样式里维护主题变量。

```scss
$u-primary: #2979ff;
$u-success: #19be6b;
$u-warning: #ff9900;
$u-error: #fa3534;
```

建议：

- 颜色变量集中维护。
- 不在每个页面里重复覆盖组件样式。
- 业务页面优先使用统一封装的按钮、表单项、弹窗。

## 表单验证怎么写

表单建议使用 `u-form` 配合 `rules`，不要在提交时到处写散乱的判断。

```vue
<template>
  <u-form ref="form" :model="form" :rules="rules">
    <u-form-item label="姓名" prop="name">
      <u-input v-model="form.name" placeholder="请输入姓名" />
    </u-form-item>

    <u-button type="primary" @click="submit">提交</u-button>
  </u-form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: ''
      },
      rules: {
        name: [
          {
            required: true,
            message: '请输入姓名',
            trigger: ['blur', 'change']
          }
        ]
      }
    }
  },

  methods: {
    submit() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }

        uni.showToast({
          title: '提交成功',
          icon: 'none'
        })
      })
    }
  }
}
</script>
```

## nvue 页面组件名称不一致

部分组件在 `nvue` 下可能需要使用特殊名称。例如 uView 文档里提到某些组件在 `nvue` 中使用 `u--input`、`u--form` 这类写法。

排查方式：

- 先确认页面是 `vue` 还是 `nvue`。
- 对照组件文档查看当前端支持情况。
- 不要把 H5 的表现直接当成 App nvue 的表现。

## 样式不生效

常见原因：

- 没有引入 uView 全局样式。
- `lang="scss"` 没配置好。
- 组件样式被页面局部样式覆盖。
- 小程序端 scoped 样式穿透写法不对。
- HBuilderX 导入路径和 npm 路径不一致。

处理方法：

- 先确认 `App.vue` 或入口样式已引入。
- 检查控制台是否有 Sass 编译错误。
- 组件局部覆盖尽量收敛到页面根类名下。

```scss
.order-page {
  ::v-deep .u-button {
    border-radius: 8rpx;
  }
}
```

## 图标不显示

常见原因：

- 字体文件路径不正确。
- 静态资源没有被打包。
- 小程序端资源路径不能被访问。
- App 端缓存了旧资源。

解决：

- 检查 `static` 目录。
- 清理开发工具缓存。
- 重新上传体验版测试。
- 避免把字体资源放到不能被构建工具处理的位置。

## 弹窗、Picker、Calendar 层级异常

常见原因：

- 页面里使用了原生组件，层级高于普通视图。
- 自定义导航栏、视频、地图等组件影响层级。
- 弹窗放在了滚动容器内部。

处理建议：

- 弹窗类组件尽量放在页面根节点。
- 避免在复杂嵌套的 `scroll-view` 里放弹层。
- 地图、视频等原生组件上层展示要单独测试目标端。

## 多端兼容检查

上线前至少检查：

- H5。
- 微信小程序。
- 支付宝小程序。
- App Vue。
- App nvue。

并不是每个组件在每个端表现完全一致，复杂组件如上传、表单、弹窗、选择器、富文本、日历要重点测。

## 常见报错

### 找不到 `uview-ui/index.scss`

检查安装方式和目录路径。npm 安装通常走 `node_modules`，插件市场导入可能在项目目录中。

### `$u` 不存在

说明 uView 没有正确注册，检查 `main.js` 是否 `Vue.use(uView)`。

### 表单校验不触发

检查：

- `u-form-item` 是否写了 `prop`。
- `rules` 里的字段是否和 `model` 一致。
- `ref` 是否正确。
- 校验是在表单渲染完成后执行。

### H5 正常，小程序异常

优先检查：

- 是否用了浏览器专属 API。
- 图片、字体、接口域名是否符合小程序规则。
- 条件编译是否漏写。

## 官方入口

- uView 2.0 文档：https://www.uviewui.com/
- uView 1.x 文档：https://v1.uviewui.com/components/intro.html
