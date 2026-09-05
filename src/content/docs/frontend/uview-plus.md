---
title: uview-plus 使用文档与常见问题
description: uview-plus 在 uni-app Vue3 项目中的安装、配置、组件使用、主题、类型提示、多端兼容和常见问题整理。
---

`uview-plus` 是基于 uView 2.x 思路演进的 uni-app Vue3 组件库。新项目如果使用 uni-app Vue3，可以优先评估它；老的 Vue2 项目不要盲目迁移，要先确认组件差异和多端表现。

## 适合什么项目

| 场景 | 建议 |
| --- | --- |
| uni-app Vue3 新项目 | 可以优先评估 |
| 需要从 uView 2 迁移 | 逐页验证，不要直接全局替换 |
| App、H5、小程序多端 | 重点测试上传、弹窗、选择器、表单 |
| 需要 TypeScript | 建议封装业务组件，减少页面直接依赖 |

## 安装

```sh
npm install uview-plus
```

`main.js` 或 `main.ts` 中注册：

```js
import { createSSRApp } from 'vue'
import uviewPlus from 'uview-plus'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  app.use(uviewPlus)

  return {
    app
  }
}
```

`App.vue` 中引入样式：

```vue
<style lang="scss">
@import 'uview-plus/index.scss';
</style>
```

如果使用 `uni_modules` 方式导入，路径和注册方式以项目实际结构为准。

## Vue3 写法示例

```vue
<template>
  <up-form ref="formRef" :model="form" :rules="rules">
    <up-form-item label="昵称" prop="nickname">
      <up-input v-model="form.nickname" placeholder="请输入昵称" />
    </up-form-item>

    <up-button type="primary" @click="submit">保存</up-button>
  </up-form>
</template>

<script setup>
import { reactive, ref } from 'vue'

const formRef = ref(null)

const form = reactive({
  nickname: ''
})

const rules = {
  nickname: [
    {
      required: true,
      message: '请输入昵称',
      trigger: ['blur', 'change']
    }
  ]
}

function submit() {
  formRef.value.validate().then(() => {
    uni.showToast({
      title: '保存成功',
      icon: 'none'
    })
  })
}
</script>
```

组件名前缀可能会随版本和配置不同出现 `u-`、`up-` 等差异，项目里要统一，不要混用。

## 主题配置

建议把主题变量集中到 `uni.scss` 或项目样式入口。

```scss
$u-primary: #2979ff;
$u-success: #19be6b;
$u-warning: #ff9900;
$u-error: #fa3534;
```

如果项目有自己的设计规范，优先封装业务组件，不要在页面里到处写深层样式覆盖。

## 组件自动导入问题

uni-app 项目常通过 easycom 自动识别组件。常见问题是组件文件存在，但页面报“组件未注册”。

排查：

- 是否安装或导入到了正确目录。
- `pages.json` 或 easycom 配置是否正确。
- 组件前缀是否和实际库版本一致。
- 是否重启了 HBuilderX 或 CLI 服务。

## 图标或样式丢失

常见原因：

- 没有引入 `index.scss`。
- Sass 没有配置。
- 静态资源没有被打包。
- 小程序工具缓存旧版本。

处理：

- 检查样式入口。
- 清理开发者工具缓存。
- 删除临时编译目录后重新运行。
- 真机检查字体、图标和图片资源。

## Vue2 项目能不能直接用

不建议直接把 Vue2 + uView 项目迁移成 uview-plus。迁移成本包括：

- Vue2 到 Vue3 语法差异。
- 组件 API 差异。
- 表单验证差异。
- 样式变量差异。
- 多端兼容差异。

更稳的迁移方式是新旧页面并行，先迁移低风险页面，再迁移核心流程。

## 常见问题

### `validate is not a function`

检查 `ref` 是否拿到组件实例，以及表单组件是否已经渲染。

```js
if (!formRef.value) {
  return
}
```

### 组件样式和文档不一致

确认：

- 当前安装版本。
- 文档版本。
- 是否使用了全局主题覆盖。
- 是否存在旧 uView 样式残留。

### 小程序端表现和 H5 不一致

这是正常现象。上传、富文本、滚动、弹层、地图、视频都需要单独真机测试。

### 迁移后包体积变大

处理方法：

- 删除未使用组件。
- 检查是否同时保留了 uView 和 uview-plus。
- 图片和字体资源放 CDN 或按需加载。
- 使用分包拆核心页面和低频页面。

## 官方入口

- npm 包：https://www.npmjs.com/package/uview-plus
- 官方文档：https://uview-plus.jiangruyi.com
- 备用文档：https://uiadmin.net/uview-plus
