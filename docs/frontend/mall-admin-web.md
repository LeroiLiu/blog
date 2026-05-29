---
title: mall-admin-web
description: mall-admin-web 后台管理前端项目维护、接口代理、登录权限、商品订单模块、上传、部署和常见问题。
---

# mall-admin-web

`mall-admin-web` 是 mall 项目体系里的后台管理前端，常用于电商后台、商品管理、订单管理、营销管理、权限管理等场景。维护这类项目时，前端和后端版本必须一起看。

## 维护重点

| 模块 | 要检查什么 |
| --- | --- |
| 登录 | 后端地址、验证码、token 字段、用户信息接口 |
| 权限 | 后端菜单、角色、资源权限、前端路由映射 |
| 商品 | 富文本、图片上传、规格、SKU、分类 |
| 订单 | 状态流转、售后、发货、退款、导出 |
| 上传 | 文件大小、Nginx 限制、后端存储、图片访问域名 |
| 部署 | `BASE_API`、静态资源路径、接口跨域、Nginx fallback |

## 接口地址不对

常见现象：

```text
Request failed with status code 404
```

或：

```text
Network Error
```

排查：

1. 打开 Network，看请求的完整 URL。
2. 看环境变量里的 API 地址。
3. 看开发环境 proxy 是否生效。
4. 看后端 mall 服务是否启动。
5. 看前后端版本是否匹配。

常见配置项可能在：

```text
.env.development
.env.production
config/
src/utils/request.js
```

## 登录失败

常见原因：

- 验证码接口没有返回。
- token 字段和前端读取字段不一致。
- 后端返回结构变化。
- 用户被禁用或没有菜单权限。
- 请求头没有带上 token。

排查重点：

```text
POST /admin/login
GET /admin/info
GET /admin/menus
```

如果登录接口成功，但用户信息接口失败，多半是 token 没带上或后端鉴权失败。

## 菜单为空

常见原因：

- 当前账号没有分配角色。
- 角色没有绑定菜单。
- 后端返回菜单字段和前端转换函数不一致。
- 菜单路由路径和前端页面路径不一致。

排查时先看后端返回的菜单数据，再看前端路由映射。

建议临时打印：

```js
console.log('menus', menus)
console.log('routes', routes)
```

## 上传图片失败

常见报错：

```text
413 Request Entity Too Large
```

常见原因：

- Nginx `client_max_body_size` 太小。
- 后端上传限制太小。
- 图片访问域名没有配置。
- 对象存储权限或 bucket 策略不对。

Nginx 示例：

```nginx
server {
  client_max_body_size 50m;
}
```

后端也要同步调整上传限制，只改 Nginx 不一定够。

## 富文本图片显示不了

常见原因：

- 图片保存的是相对路径。
- 后台访问域名和前台访问域名不一致。
- HTTPS 页面加载 HTTP 图片被浏览器拦截。
- 对象存储没有公开读取权限。

处理方向：

- 统一图片 URL 生成规则。
- 生产环境使用 HTTPS 图片地址。
- 上传后立即检查图片是否能直接访问。

## 前后端版本不匹配

常见现象：

- 登录字段对不上。
- 菜单接口返回结构不一致。
- 商品规格字段缺失。
- 订单状态显示异常。
- 营销模块接口 404。

处理建议：

- 同时记录前端 commit、后端 commit、数据库版本。
- 不要只替换前端代码。
- 数据库迁移脚本要和后端版本一起执行。

## 部署后刷新 404

如果使用 history 路由，Nginx 要回退到入口文件：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

如果部署在子目录，例如 `/admin/`，前端构建路径和 Nginx 回退路径都要对应。

## 官方导航

- [mall-admin-web](https://github.com/macrozheng/mall-admin-web)
- [mall 项目](https://github.com/macrozheng/mall)
