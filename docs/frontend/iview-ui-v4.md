---
title: iView UI v4 与 View UI
description: iView UI v4、View UI 在 Vue 2 项目中的安装、样式、表单、表格、上传、日期选择、国际化和常见问题。
---

# iView UI v4 与 View UI

iView UI v4 对应 Vue 2 生态，后来常见包名是 `view-design`。维护老项目时要先确认项目到底使用的是 `iview` 旧包，还是 `view-design` 新包。

## 版本判断

看 `package.json`：

```json
{
  "dependencies": {
    "view-design": "^4.0.0",
    "vue": "^2.6.0"
  }
}
```

如果看到的是：

```json
{
  "dependencies": {
    "iview": "^3.0.0"
  }
}
```

说明项目更老，升级时要特别小心组件 API 和样式差异。

## 样式没有生效

常见现象：

- 按钮没有样式。
- 表单控件显示像原生控件。
- 表格布局错乱。

常见原因是没有引入 CSS。

`view-design`：

```js
import ViewUI from 'view-design'
import 'view-design/dist/styles/iview.css'

Vue.use(ViewUI)
```

旧 `iview`：

```js
import iView from 'iview'
import 'iview/dist/styles/iview.css'

Vue.use(iView)
```

## 组件报未注册

报错：

```text
Unknown custom element: <i-button>
```

处理：

- 确认 `Vue.use(ViewUI)` 是否执行。
- 按需引入时确认组件是否注册。
- 检查包名是否写错。
- 不要同时引入 `iview` 和 `view-design`。

## 表单校验不触发

常见原因：

- `Form` 缺少 `:model`。
- `FormItem` 缺少 `prop`。
- rules 的字段名和 model 字段名不一致。
- 自定义校验没有调用 `callback`。

示例：

```vue
<template>
  <Form ref="formRef" :model="form" :rules="rules">
    <FormItem label="账号" prop="username">
      <Input v-model="form.username" />
    </FormItem>
  </Form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' }
        ]
      }
    }
  }
}
</script>
```

## Table 固定列错位

常见原因：

- 表格初始化时父容器被隐藏。
- 列宽没有固定。
- 数据加载后容器宽度变化。
- 浏览器缩放或滚动条影响。

处理：

- 给关键列设置 `width`。
- 避免在隐藏容器里初始化复杂表格。
- 弹窗打开后再渲染表格。
- 数据加载后调用组件刷新布局。

## DatePicker 日期格式不对

常见现象：

```text
Invalid Date
```

或提交给后端的日期不是想要的字符串。

处理：

- 明确 `format` 是展示格式。
- 明确 `value-format` 或提交前自行格式化。
- 不要把 Date 对象直接传给只接收字符串的接口。

## Select 远程搜索不触发

常见原因：

- 没有开启 `filterable`。
- 没有开启 `remote`。
- 远程方法名写错。
- 搜索接口没有做防抖。

思路：

```vue
<Select
  v-model="userId"
  filterable
  remote
  :remote-method="searchUser"
  :loading="loading"
>
  <Option
    v-for="item in users"
    :key="item.id"
    :value="item.id"
  >
    {{ item.name }}
  </Option>
</Select>
```

## Upload 上传失败

常见原因：

- 上传地址不对。
- 没有带 token。
- 后端字段名不是 `file`。
- 文件大小超过限制。
- 跨域预检失败。

排查：

- 看 Network 的上传请求。
- 看请求头里 token 是否存在。
- 看 FormData 字段名。
- 看后端返回的错误信息。

## Modal 层级被遮挡

常见原因：

- 页面里有更高的 `z-index`。
- 父容器有 `transform`、`filter` 或定位上下文。
- 自定义弹层和组件弹层混用。

处理方向：

- 统一弹窗层级规范。
- 少在全局乱写特别大的 `z-index`。
- 检查父级是否制造了新的层叠上下文。

## 官方导航

- [iView UI v4](https://v4.iviewui.com/)
- [View UI](https://github.com/view-design/ViewUI)
