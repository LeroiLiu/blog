---
title: 支付宝小程序开发常见问题与解决方法
description: 整理支付宝小程序开发中的 my.request、my.getAuthCode、授权、支付、页面跳转、样式、真机调试、分包和审核常见问题。
---

支付宝小程序和微信小程序写法相似，但 API 命名、授权模型、支付参数、域名白名单、组件和审核要求都有差异。迁移项目时不要简单把 `wx` 改成 `my`，要逐项核对平台能力。

## `my.request` 在真机或线上失败

常见原因：

- 服务端域名没有加入小程序服务端域名白名单。
- 开发工具里忽略了域名校验，但线上没有配置。
- 接口协议、证书或重定向地址不符合线上要求。
- 服务端按表单格式解析，但前端默认按 JSON 发送。
- 后端返回字段结构不稳定，前端没有统一处理错误。

支付宝小程序的请求建议统一封装。

```js
const API_BASE = 'https://api.example.com'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    my.request({
      url: API_BASE + path,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 15000,
      headers: {
        Authorization: my.getStorageSync({ key: 'token' }).data || '',
        'content-type': 'application/json'
      },
      success(res) {
        const status = res.status || res.statusCode

        if (status >= 200 && status < 300) {
          resolve(res.data)
          return
        }

        reject(new Error('request failed: ' + status))
      },
      fail(err) {
        reject(err)
      }
    })
  })
}
```

如果服务端需要 `application/x-www-form-urlencoded`，要明确设置请求头，并确认传参格式和服务端解析方式一致。

## `my.getAuthCode` 拿到 code 后怎么登录

常见流程：

```text
my.getAuthCode -> authCode -> 服务端换取用户标识 -> 服务端生成 token -> 小程序保存 token
```

注意点：

- `authCode` 是临时凭证，要尽快发给服务端。
- `auth_base` 通常用于静默获取用户标识。
- `auth_user` 会涉及用户授权，失败时要给用户明确提示。
- 服务端生成自己的 token，不要把平台密钥放到前端。

```js
function login() {
  my.getAuthCode({
    scopes: ['auth_base'],
    success: async res => {
      const data = await request('/auth/alipay-login', {
        method: 'POST',
        data: {
          auth_code: res.authCode
        }
      })

      my.setStorageSync({
        key: 'token',
        data: data.token
      })
    },
    fail: err => {
      console.log('auth fail', err)
    }
  })
}
```

## 用户授权弹窗失败或用户取消

常见原因：

- `scopes` 写错。
- 用户主动取消授权。
- 小程序能力或主体配置不完整。
- 服务端授权接口异常。
- 只处理了 `success`，没有处理 `fail`。

处理方法：

- 静默登录和主动授权分开。
- 用户拒绝时不要死循环弹窗。
- 在需要权限的页面解释用途，再由用户点击触发授权。
- 服务端记录授权状态，避免重复打扰用户。

```js
my.getAuthCode({
  scopes: ['auth_user'],
  success(res) {
    console.log(res.authCode)
  },
  fail(err) {
    my.alert({
      title: '授权未完成',
      content: '需要授权后才能继续使用该功能'
    })
    console.log(err)
  }
})
```

## 支付宝支付调不起来

支付链路建议固定为：

```text
小程序创建订单 -> 服务端创建支付单 -> 服务端返回支付凭证 -> my.tradePay -> 服务端接收支付通知 -> 主动查单兜底
```

排查点：

- 小程序支付能力是否开通。
- 支付订单是否由服务端创建。
- 支付参数是否对应当前小程序和商户。
- 前端不要拼签名，不要保存商户私钥。
- 支付成功页面不能只依赖前端回调。

```js
async function pay(orderId) {
  const data = await request('/pay/alipay-mini-program', {
    method: 'POST',
    data: {
      order_id: orderId
    }
  })

  my.tradePay({
    tradeNO: data.trade_no,
    success(res) {
      console.log('pay success', res)
    },
    fail(err) {
      console.log('pay fail', err)
    }
  })
}
```

如果服务端返回的是其他支付字段，要以当前开通的支付产品文档为准，但原则不变：前端只负责唤起收银台，订单状态以服务端为准。

## 页面跳转失败

常见原因：

- tabBar 页面使用了 `my.navigateTo`。
- 普通页面错误使用 `my.switchTab`。
- 跳转路径没有以 `/` 开头。
- 分包路径写错。
- URL 参数没有编码，导致特殊字符截断。

```js
my.navigateTo({
  url: '/pages/order/detail/index?id=10001'
})
```

跳 tabBar：

```js
my.switchTab({
  url: '/pages/index/index'
})
```

传复杂参数时建议只传 ID，到目标页面再请求详情。

## 样式在支付宝端和微信端不一致

常见差异：

- 组件默认样式不同。
- 部分 CSS 能力支持不一致。
- 安全区域、导航栏高度、滚动容器表现不同。
- 自定义组件样式隔离规则不同。
- `rpx` 在不同设备上换算后有细微差异。

建议：

- 不依赖平台组件默认边距。
- 封装基础按钮、弹窗、列表项。
- 真机测试 iOS 和 Android。
- 大面积布局用 flex，少写固定高度。

```css
.page {
  min-height: 100vh;
  background: #f7f8fa;
}

.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

## `setData` 之后页面没有及时更新

常见原因：

- 直接修改 `this.data`，没有调用 `setData`。
- 更新对象层级太深，一次传输数据太大。
- 异步回调里 `this` 指向丢失。
- 列表没有稳定字段，导致渲染异常。

推荐写法：

```js
Page({
  data: {
    list: []
  },

  async loadList() {
    const list = await request('/orders')

    this.setData({
      list
    })
  }
})
```

高频场景不要每一帧都 `setData`，否则真机会明显卡顿。

## 上传后体验版和本地不一致

排查顺序：

- 当前体验版是否是最新上传版本。
- IDE 是否使用了本地 mock 数据。
- 域名白名单是否配置正式接口。
- 小程序配置文件是否区分了开发、体验、正式环境。
- 服务端是否允许支付宝小程序来源请求。
- 用户账号是否有体验权限。

## 审核常见问题

- 小程序类目和实际功能不一致。
- 首页空白或必须登录后才有内容，但未提供测试账号。
- 涉及支付、会员、优惠券、营销活动但规则说明不完整。
- 获取用户信息、手机号、位置等权限时没有说明用途。
- 页面里出现未完成、测试文字、无效按钮。
- 外链、web-view、客服、隐私协议没有配置完整。

提交前准备：

- 测试账号。
- 核心功能路径。
- 支付测试说明。
- 隐私政策和用户授权说明。
- 后台服务保持可访问。

## 上线前检查清单

- 服务端域名白名单配置完成。
- 登录链路使用 `my.getAuthCode`，密钥只在服务端。
- 主动授权有失败处理和用户提示。
- 支付参数由服务端生成，订单状态以服务端为准。
- tabBar 和普通页面跳转方式正确。
- 体验版和正式版接口环境明确。
- iOS、Android 真机都测试过。
- 审核账号和操作路径准备完整。

## 官方入口

- 支付宝小程序文档：https://miniprogram.alipay.com/docs/miniprogram/mpdev/overview
- `my.request`：https://miniprogram.alipay.com/docs/miniprogram/mpdev/API_Network_request
- `my.getAuthCode`：https://miniprogram.alipay.com/docs/miniprogram/mpdev/API_OpenAPI_getAuthCode
- 支付能力：https://miniprogram.alipay.com/docs-demo/miniprogram_demo/mpdev/capability-payment
