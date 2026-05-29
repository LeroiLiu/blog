---
title: Element UI 2.x 常见问题
description: Element UI 2.x 在 Vue 2 项目中的表单、表格、弹窗、上传、样式覆盖和维护常见问题。
---

# Element UI 2.x 常见问题

Element UI 2.x 主要用于 Vue 2 项目。新 Vue 3 项目通常使用 Element Plus。

## 表单校验不生效

检查：

- `el-form` 是否绑定 `:model`。
- `el-form-item` 的 `prop` 是否和字段名一致。
- rules 字段是否和 model 字段对应。
- 动态表单项是否正确设置 `prop`。

示例：

```vue
<el-form :model="form" :rules="rules" ref="formRef">
  <el-form-item label="姓名" prop="name">
    <el-input v-model="form.name" />
  </el-form-item>
</el-form>
```

## 表格列宽错乱

常见原因：

- 容器一开始是隐藏状态。
- 数据异步加载后没有重新计算布局。
- 列内容过长。

可以在弹窗打开或数据加载后调用：

```js
this.$nextTick(() => {
  this.$refs.table.doLayout()
})
```

## dialog 里表单重置失败

`resetFields()` 依赖初始 model。打开弹窗前后修改 model 时，要注意重置时机。

```js
this.$nextTick(() => {
  this.$refs.formRef.resetFields()
})
```

## 样式覆盖不生效

如果使用 scoped 样式，需要深度选择器：

```php
::v-deep .el-input__inner {
  height: 36px;
}
```

不要全局乱覆盖组件内部类名，容易影响其他页面。

## 上传组件常见问题

检查：

- `action` 地址是否正确。
- 请求头 token 是否带上。
- 文件大小和类型是否校验。
- 后端返回格式是否和前端处理一致。

## 是否要迁移到 Element Plus

如果项目仍是 Vue 2，继续维护 Element UI 2.x 更稳。如果准备迁移 Vue 3，就需要同时评估 Element Plus 的组件 API 差异。

## 官方入口

- Element UI 文档：https://element.eleme.io/
