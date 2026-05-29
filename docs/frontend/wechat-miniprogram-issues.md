---
title: 微信小程序开发常见问题与解决方法
description: 整理微信小程序开发中的 request 域名、登录、手机号、支付、订阅消息、分包、setData、组件样式、审核和真机调试问题。
---

# 微信小程序开发常见问题与解决方法

微信小程序开发最容易踩坑的地方不在语法本身，而在平台配置、基础库版本、真机环境、授权链路、支付链路和审核规则。开发时不要只看开发者工具是否正常，要把真机、体验版、线上版都当成不同环境来检查。

## request 在开发者工具正常，真机或线上失败

常见原因：

- 后台域名没有配置到小程序管理后台。
- 使用了 `http://`，正式环境要求 HTTPS。
- 证书链不完整，手机端校验证书失败。
- 开发者工具勾选了“不校验合法域名”，真机没有同样环境。
- 接口实际跳转到了未配置的二级域名。
- 接口返回时间太长，触发小程序请求超时。

处理方法：

- 管理后台配置 request 合法域名、uploadFile 合法域名、downloadFile 合法域名。
- 生产接口统一使用 HTTPS。
- 用真机扫码体验版测试，不只依赖开发者工具。
- 服务端不要 302 到其他未配置域名。
- 小程序端封装请求，统一处理超时、登录失效和错误提示。

```js
const API_BASE = 'https://api.example.com'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + path,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 15000,
      header: {
        Authorization: wx.getStorageSync('token') || '',
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        reject(new Error('request failed: ' + res.statusCode))
      },
      fail(err) {
        reject(err)
      }
    })
  })
}
```

## 登录后偶尔拿不到用户身份

微信登录常见流程是：

```text
wx.login -> code -> 服务端 code2session -> openid/session_key -> 服务端 token -> 小程序保存 token
```

常见问题：

- `code` 只能使用一次，不能重复拿同一个 code 去换登录态。
- `session_key` 不应该直接返回给小程序前端。
- `appsecret` 不能写在小程序代码里。
- 前端 token 过期后没有自动重新登录。
- 多端账号体系没有处理 `unionid`。

推荐做法：

```js
async function login() {
  const loginRes = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject
    })
  })

  const res = await request('/auth/wechat-login', {
    method: 'POST',
    data: {
      code: loginRes.code
    }
  })

  wx.setStorageSync('token', res.token)
}
```

服务端要做自己的登录态，不要让前端直接持有微信的敏感凭证。

## 获取手机号失败

常见原因：

- 按钮没有使用正确的 `open-type`。
- 没有在用户点击事件中触发。
- 服务端没有正确解密或没有调用新的手机号接口。
- 用户拒绝授权。
- 测试号、体验版、正式版能力配置不一致。

前端只拿临时凭证或回调参数，真正解密和换取手机号应放在服务端。

```html
<button open-type="getPhoneNumber" bindgetphonenumber="onGetPhoneNumber">
  获取手机号
</button>
```

```js
Page({
  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '用户取消授权',
        icon: 'none'
      })
      return
    }

    request('/auth/wechat-phone', {
      method: 'POST',
      data: e.detail
    })
  }
})
```

## 支付调不起来或支付签名错误

微信支付链路建议固定成：

```text
小程序创建订单 -> 服务端统一下单 -> 服务端返回支付参数 -> wx.requestPayment -> 服务端接收支付回调 -> 查询订单兜底
```

排查点：

- `appid`、商户号、支付产品是否对应。
- 前端不要自己生成支付签名。
- 订单号要唯一，不能重复下单。
- 支付回调要验签，不能只相信前端成功回调。
- 支付成功后要以服务端回调或主动查单为准。

```js
async function pay(orderId) {
  const params = await request('/pay/wechat-mini-program', {
    method: 'POST',
    data: {
      order_id: orderId
    }
  })

  wx.requestPayment({
    ...params,
    success() {
      wx.navigateTo({
        url: '/pages/order/detail?id=' + orderId
      })
    },
    fail(err) {
      console.log('pay fail', err)
    }
  })
}
```

## 订阅消息收不到

订阅消息不是服务端想发就能发，必须先让用户在小程序里主动触发授权。

常见问题：

- 模板 ID 配错。
- 用户没有授权或已经拒绝。
- openid 不属于当前小程序。
- 服务端发送字段和模板关键词不一致。
- 发送时机和业务场景不符合平台要求。

```js
function requestOrderNotice() {
  wx.requestSubscribeMessage({
    tmplIds: ['template_id_here'],
    success(res) {
      console.log('subscribe result', res)
    },
    fail(err) {
      console.log('subscribe fail', err)
    }
  })
}
```

授权结果要落库，服务端发送前再判断用户是否订阅过。

## 分包后页面找不到

常见原因：

- `app.json` 的 `subpackages` 路径写错。
- 分包页面路径里多写或少写了 `/pages/`。
- 主包页面跳转到分包页面时 URL 不正确。
- tabBar 页面放进了分包。

```json
{
  "pages": [
    "pages/index/index"
  ],
  "subpackages": [
    {
      "root": "package-order",
      "pages": [
        "pages/list/index",
        "pages/detail/index"
      ]
    }
  ]
}
```

跳转路径：

```js
wx.navigateTo({
  url: '/package-order/pages/detail/index?id=10001'
})
```

## `setData` 后页面卡顿

常见原因：

- 一次性传了很大的数组或对象。
- 高频滚动、拖拽、输入事件里频繁 `setData`。
- 每次都更新整棵对象，而不是更新具体字段。

推荐做法：

- 分页加载列表。
- 只更新发生变化的字段。
- 高频事件加节流。
- 图片列表使用懒加载。

```js
this.setData({
  ['list[' + index + '].checked']: true
})
```

## 自定义组件样式不生效

微信小程序组件有样式隔离，页面样式不一定能影响组件内部。

处理方法：

- 组件内部样式写在组件自己的 WXSS。
- 使用 `externalClasses` 暴露可定制样式。
- 明确设置组件的 `styleIsolation`。

```js
Component({
  externalClasses: ['custom-class'],
  options: {
    styleIsolation: 'isolated'
  }
})
```

```html
<view class="card custom-class">
  <slot />
</view>
```

## 开发者工具正常，体验版不正常

优先检查：

- 体验版是否上传了最新代码。
- 测试账号是否有权限。
- 体验版使用的环境变量是否还是测试地址。
- 后台域名是否配置了正式域名。
- 云函数或服务端是否部署到对应环境。
- 基础库版本是否和开发者工具模拟器一致。

## 审核被拒常见原因

- 服务类目和页面内容不一致。
- 打开后空白、无法登录、无法体验核心流程。
- 未提供可用测试账号。
- 涉及支付、会员、课程、医疗、金融等敏感内容但资质不完整。
- 隐私协议、用户信息收集说明不完整。
- 获取手机号、位置、相册等权限时没有说明用途。

提交审核前准备一个“审核路径说明”，把测试账号、测试步骤、支付测试方式写清楚。

## 上线前检查清单

- request/upload/download 合法域名都配置完成。
- 生产接口全部使用 HTTPS。
- `appsecret` 只在服务端保存。
- 登录 token 过期可以自动刷新或重新登录。
- 支付结果以服务端回调和查单为准。
- 订阅消息授权结果有记录。
- 分包路径、tabBar 页面、页面跳转都真机测试过。
- 隐私协议、权限说明、测试账号准备完整。

## 官方入口

- 微信小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 微信小程序登录：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html
- 微信小程序网络请求：https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html
- 微信小程序支付：https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html
