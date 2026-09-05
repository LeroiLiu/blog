---
title: Vue 2 常见问题
description: Vue 2 项目中响应式限制、生命周期、组件通信、Vuex、Element UI 和 webpack 常见问题。
---

Vue 2 常见于老后台、老 H5、webpack 工程和 Element UI 2.x 项目。维护重点是稳定、谨慎升级和控制依赖风险。

## 对象新增属性页面不更新

Vue 2 对对象新增属性有响应式限制。可以使用：

```js
this.$set(this.form, 'name', 'Leroi')
```

数组按索引修改也建议使用：

```js
this.$set(this.list, index, item)
```

## this 指向不对

不要在 `methods` 里使用箭头函数：

```js
export default {
  methods: {
    save() {
      this.loading = true
    }
  }
}
```

箭头函数会让 `this` 不再指向 Vue 实例。

## 父子组件怎么通信

父传子：

```vue
<UserForm :user="user" />
```

子传父：

```js
this.$emit('save', form)
```

复杂跨组件状态建议使用 Vuex 或提升到共同父组件管理。

## watch 深度监听不触发

对象深层字段变化需要 `deep`：

```js
watch: {
  form: {
    handler(value) {
      console.log(value)
    },
    deep: true
  }
}
```

深度监听成本较高，大表单要谨慎使用。

## Element UI 表单校验不生效

常见原因：

- `el-form` 没有绑定 `model`。
- `el-form-item` 的 `prop` 和表单字段不一致。
- rules 字段名写错。
- 动态表单项没有正确设置 `prop`。

## webpack 项目构建很慢

先排查：

- 依赖是否过多。
- 是否开启 source map。
- 是否有超大静态资源。
- Babel 是否编译了不必要的依赖。
- node_modules 是否被错误处理。

老项目可以先做依赖整理，再评估迁移 Vite。

## 是否需要升级到 Vue 3

如果项目稳定、改动少，可以继续维护，但要控制新增依赖。如果项目还会长期迭代，建议评估 Vue 3、Vite、Pinia、Element Plus 的迁移成本。
