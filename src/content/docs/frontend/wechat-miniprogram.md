---
title: 微信小程序常见问题
description: 微信小程序基础库、登录、支付、订阅消息、分包、域名、审核和开发者工具常见问题。
---

微信小程序项目要重点关注基础库版本、开发者工具、域名配置、权限、审核规则和平台 API 变化。

更细的开发排查可以看：[微信小程序开发常见问题与解决方法](/frontend/wechat-miniprogram-issues)。

## 基础库版本是什么

基础库决定小程序运行能力。某些 API 或组件只在较新基础库中可用。使用新能力前要确认最低基础库版本，并为低版本做兼容。

```js
const canIUse = wx.canIUse('button.open-type.getPhoneNumber')
```

## request 请求失败怎么办

常见原因：

- 后台域名没有配置到小程序管理后台。
- 使用了 HTTP 或证书异常。
- 本地开发勾选了“不校验合法域名”，真机或线上没有生效。
- 请求超时或服务端跨环境地址错误。

小程序上线前必须检查正式域名配置。

## 登录流程怎么整理

常见流程：

1. 调用 `wx.login()` 获取 code。
2. 把 code 发给服务端。
3. 服务端换取 openid 或 unionid。
4. 服务端生成自己的登录态。
5. 小程序保存 token。

不要把 appsecret 放到小程序前端代码里。

## 订阅消息收不到

排查：

- 模板是否配置正确。
- 用户是否授权订阅。
- 服务端发送参数是否完整。
- openid 是否对应当前小程序。
- 模板字段是否和后台一致。

## 分包怎么用

大项目建议按业务分包，减少首包体积。

```json
{
  "subpackages": [
    {
      "root": "pages/order",
      "pages": [
        "list",
        "detail"
      ]
    }
  ]
}
```

首屏必须用到的页面不要放得太深。

## 审核容易被拒的原因

- 页面内容与服务类目不一致。
- 登录后无内容或功能不可用。
- 隐私协议、用户授权说明不完整。
- 支付、订阅消息、获取手机号等能力说明不足。
- 测试账号没有提供或无法登录。

## 官方入口

- 微信小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 小程序基础库：https://developers.weixin.qq.com/miniprogram/dev/framework/client-lib/
