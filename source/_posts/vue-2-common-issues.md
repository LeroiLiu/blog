---
title: Vue 2 常见问题与项目维护建议
description: 整理 Vue 2 项目中的响应式限制、this 指向、组件通信、深度监听、Element UI 表单校验、webpack 构建和 Vue 3 升级问题。
excerpt: 整理 Vue 2 项目中的响应式限制、this 指向、组件通信、深度监听、Element UI 表单校验、webpack 构建和 Vue 3 升级问题。
date: '2026-05-29T10:41:59'
categories:
  - 前端开发
tags:
  - Vue 2
  - JavaScript
  - Element UI
  - webpack
  - 项目维护
---
<!-- more -->

Vue 2 常见于存量后台、H5、webpack 工程和 Element UI 2.x 项目。维护这类项目时，应优先保证业务稳定，再谨慎处理依赖升级和技术栈迁移。

## 对象新增属性后页面不更新

Vue 2 对对象新增属性存在响应式限制，可以使用：

```javascript
this.$set(this.form, 'name', 'Leroi')
```

数组按索引修改时也建议使用：

```javascript
this.$set(this.list, index, item)
```

## `this` 指向不正确

不要在 `methods` 中使用箭头函数：

```javascript
export default {
  methods: {
    save() {
      this.loading = true
    }
  }
}
```

箭头函数不会创建自己的 `this`，容易导致这里的 `this` 不再指向 Vue 实例。

## 父子组件如何通信

父组件向子组件传递数据：

```vue
<UserForm :user="user" />
```

子组件向父组件发送事件：

```javascript
this.$emit('save', form)
```

复杂的跨组件状态可以使用 Vuex，或者提升到共同父组件中统一管理。

## `watch` 深度监听不触发

监听对象深层字段变化时需要启用 `deep`：

```javascript
watch: {
  form: {
    handler(value) {
      console.log(value)
    },
    deep: true
  }
}
```

深度监听会递归遍历对象，表单或数据规模较大时应谨慎使用。只关心少数字段时，可以分别监听具体字段。

## Element UI 表单校验不生效

常见原因包括：

- `el-form` 没有绑定 `model`。
- `el-form-item` 的 `prop` 与表单字段不一致。
- `rules` 中的字段名写错。
- 动态表单项没有正确设置 `prop`。

排查时可以先确认 `model`、`prop` 和 `rules` 使用的是同一套字段路径，再检查触发方式和自定义校验函数。

## webpack 项目构建缓慢

可以优先检查：

- 项目是否引入了过多依赖。
- 生产构建是否开启了不必要的 source map。
- 是否存在体积过大的静态资源。
- Babel 是否编译了不必要的依赖。
- `node_modules` 是否被错误加入编译范围。

老项目可以先整理依赖、拆分大模块并分析构建产物，再评估是否迁移到 Vite。

## 是否需要升级到 Vue 3

如果 Vue 2 项目已经稳定运行且后续改动较少，可以继续维护，但应控制新增依赖并关注安全问题。

如果项目仍会长期迭代，可以评估迁移到 Vue 3、Vite、Pinia 和 Element Plus。迁移前应先检查 UI 组件库、路由、状态管理和第三方插件的兼容情况，不必为了版本号一次性重写整个项目。

## 参考资料

- [Vue 2 官方文档](https://v2.vuejs.org/)
- [Vue 2 生命周期结束说明](https://v2.vuejs.org/eol/)
