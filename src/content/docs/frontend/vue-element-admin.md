---
title: vue-element-admin 与 vue-admin-template
description: vue-element-admin、vue-admin-template 的技术栈、项目结构、登录权限、路由菜单、构建部署和常见报错处理。
---

`vue-element-admin` 和 `vue-admin-template` 都是 Vue 2 后台管理项目里很常见的基础模板。

`vue-element-admin` 功能更完整，适合学习后台系统结构；`vue-admin-template` 更精简，适合拿来做业务项目骨架。

## 适合什么项目

| 项目 | 更适合 |
| --- | --- |
| 想快速做一个 Vue 2 后台 | `vue-admin-template` |
| 想学习权限路由、TagsView、国际化、复杂表格 | `vue-element-admin` |
| 已有老项目需要维护 | 先按原项目版本稳定运行 |
| 新项目从零开始 | 优先评估 Vue 3 + Vite 方案 |

## 常见目录

```text
src/
  api/
  assets/
  components/
  icons/
  layout/
  permission.js
  router/
  store/
  styles/
  utils/
  views/
```

重点文件：

- `src/permission.js`：路由守卫、登录态、权限路由。
- `src/router/index.js`：静态路由和异步路由。
- `src/store/modules/permission.js`：根据角色生成可访问路由。
- `src/utils/request.js`：axios 实例、请求拦截、响应拦截。
- `src/settings.js`：标题、TagsView、侧边栏等配置。

## 安装依赖失败

常见报错：

```text
Node Sass does not yet support your current environment
```

或：

```text
npm ERR! code ERESOLVE
```

处理方式：

1. 使用项目原本推荐的 Node 版本，老项目优先 Node 14 或 Node 16。
2. 不要删除 lock 文件后随意安装最新依赖。
3. npm 7+ 依赖冲突时，可以临时使用：

```bash
npm install --legacy-peer-deps
```

4. 如果是 `node-sass` 编译失败，先确认 Node 版本是否过高。

## Node 17+ OpenSSL 报错

报错：

```text
error:0308010C:digital envelope routines::unsupported
```

直接处理：

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

更推荐的处理是把老项目 Node 固定到 Node 16，避免每次启动都靠环境变量补丁。

## loader 版本不匹配

报错：

```text
Module build failed: TypeError: this.getOptions is not a function
```

常见原因：

- Webpack 4 项目安装了只适配 Webpack 5 的 loader。
- 升级了 `sass-loader`、`less-loader`、`postcss-loader`。
- 删除 lock 文件后依赖被重新解析到新版本。

处理方向：

- 回到项目原始依赖版本。
- 不要单独升级 loader 大版本。
- 检查 `package-lock.json` 或 `yarn.lock` 是否被误删。

## 登录请求 404

报错：

```text
Request failed with status code 404
```

常见原因：

- mock 没关，接口走到了本地 mock。
- proxy 没配好，请求没有转发到后端。
- `.env.development` 里的接口前缀和后端不一致。
- 后端接口路径变化。

排查：

1. 打开浏览器 Network。
2. 看登录请求的完整 URL。
3. 确认请求是走 mock、本地代理，还是直接请求后端。
4. 看 `src/utils/request.js` 是否拼了 `baseURL`。

示例：

```js
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
})
```

## 登录成功后又回到登录页

常见原因：

- token 字段名和前端不一致。
- token 没有写入 cookie 或 localStorage。
- 获取用户信息接口失败。
- 用户角色为空，导致异步路由为空。
- 路由守卫里 `next` 逻辑写错。

排查顺序：

1. 登录接口返回是否包含 token。
2. token 是否成功保存。
3. 获取用户信息接口是否成功。
4. 用户角色是否有值。
5. 生成后的路由是否包含目标页面。

## 菜单不显示

常见原因：

- 路由配置了 `hidden: true`。
- 当前角色没有命中路由 `meta.roles`。
- 后端菜单字段和前端转换规则不一致。
- 动态路由添加后没有重新跳转。

排查时可以打印：

```js
console.log('roles', roles)
console.log('routes', accessedRoutes)
```

如果角色为空，先查用户信息接口；如果路由为空，查权限过滤逻辑。

## TagsView 不缓存页面

常见原因：

- 路由 `name` 和组件 `name` 不一致。
- 页面组件没有声明 `name`。
- keep-alive include 中没有命中组件名。

示例：

```js
export default {
  name: 'OrderList'
}
```

路由：

```js
{
  path: 'order-list',
  component: () => import('@/views/order/list'),
  name: 'OrderList',
  meta: {
    title: '订单列表',
    noCache: false
  }
}
```

## 打包后白屏

常见原因：

- `publicPath` 配错。
- 部署目录不是域名根目录。
- history 路由没有 Nginx fallback。
- 静态资源没有上传完整。

Vue CLI 老项目：

```js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/admin/' : '/'
}
```

Nginx：

```nginx
location /admin/ {
  try_files $uri $uri/ /admin/index.html;
}
```

## 接入真实后端时要改哪里

通常要改：

- `.env.development`
- `.env.production`
- `src/api/`
- `src/utils/request.js`
- `src/store/modules/user.js`
- `src/router/`
- `src/permission.js`

不要只改登录接口。登录、用户信息、权限菜单、退出登录、刷新 token 往往是一组联动逻辑。

## 官方导航

- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin)
- [vue-admin-template](https://github.com/PanJiaChen/vue-admin-template)
- [vue-element-admin 文档站](https://panjiachen.github.io/vue-element-admin-site/)
