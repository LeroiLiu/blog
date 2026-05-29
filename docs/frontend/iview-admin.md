---
title: iview-admin
description: iview-admin 后台模板的 Vue 2、iView/View UI、路由菜单、权限、构建部署和常见问题。
---

# iview-admin

`iview-admin` 是 Vue 2 时代常见的后台管理模板，核心通常围绕 iView/View UI、vue-router、Vuex、Webpack 展开。维护这类项目时，最重要的是稳定依赖和梳理权限菜单。

## 适合什么情况

- 公司已有 iView 后台项目。
- 项目仍然基于 Vue 2。
- 后台功能稳定，只需要继续维护。
- 不准备短期迁移到 Vue 3。

如果是新项目，不建议再从 iView 旧模板开始。

## 常见模块

```text
src/
  api/
  assets/
  components/
  libs/
  router/
  store/
  view/
```

关注点：

- `src/router/`：路由与菜单。
- `src/store/`：用户信息、权限、标签页。
- `src/libs/axios.js`：请求封装。
- `src/view/`：页面模块。
- `src/config/`：接口地址、标题、全局配置。

## 安装依赖失败

常见报错：

```text
Node Sass does not yet support your current environment
```

或：

```text
gyp ERR!
```

处理：

- 使用项目原本支持的 Node 版本。
- 优先保留 lock 文件。
- 不要直接升级 Webpack、loader、node-sass。
- 如果是新电脑安装，先确认 Python、构建工具和 Node 版本。

## iView 样式丢失

常见原因：

- 没有引入 CSS。
- 包名从 `iview` 改成 `view-design` 后，样式路径没改。
- 按需引入插件没有正确配置。

处理：

```js
import ViewUI from 'view-design'
import 'view-design/dist/styles/iview.css'

Vue.use(ViewUI)
```

如果项目仍然是旧包：

```js
import iView from 'iview'
import 'iview/dist/styles/iview.css'

Vue.use(iView)
```

## 登录后没有菜单

常见原因：

- 当前用户没有角色。
- 后端没有返回菜单。
- 前端路由和后端菜单字段不匹配。
- 路由 `name` 重复。
- 菜单过滤函数把路由过滤掉了。

排查：

1. 登录接口是否成功。
2. 用户信息是否返回角色。
3. 菜单接口是否有数据。
4. 前端最终生成的菜单是否为空。
5. 路由配置里是否设置了隐藏。

## 页面缓存异常

现象：

- 切换标签页后页面状态丢失。
- 修改页面后旧数据还在。
- 关闭标签页后再次打开状态不对。

常见原因：

- keep-alive 依赖组件 `name`。
- 路由 `name` 和组件 `name` 不一致。
- 标签页缓存列表没有同步更新。

建议：

- 页面组件显式声明 `name`。
- 路由 `name` 使用稳定英文名。
- 不要多个页面复用同一个组件 `name`。

## 接口跨域

本地开发常见做法是 devServer proxy：

```js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true
      }
    }
  }
}
```

生产环境不要依赖 devServer proxy，要用 Nginx 或后端网关处理。

## 打包后白屏

常见原因：

- `publicPath` 和部署目录不一致。
- history 路由没有 fallback。
- 静态资源没有上传完整。
- 服务器缓存了旧资源。

如果部署在 `/admin/`：

```js
module.exports = {
  publicPath: '/admin/'
}
```

Nginx：

```nginx
location /admin/ {
  try_files $uri $uri/ /admin/index.html;
}
```

## 升级建议

- 短期维护：固定 Node、lock 文件、接口代理、部署路径。
- 中期维护：把请求封装、路由权限、菜单生成逻辑整理清楚。
- 长期升级：新模块可逐步迁到 Vue 3 + Vite，不建议一次性重写全部业务。

## 官方导航

- [iview-admin](https://github.com/iview/iview-admin)
- [iView UI v4](/frontend/iview-ui-v4)
