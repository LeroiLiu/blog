---
title: 抖音小程序开发常见问题与解决方法
description: 整理抖音小程序开发中的 tt.request、tt.login、tt.pay、分包、真机调试、宿主差异、审核、隐私协议和接口联调常见问题。
---

# 抖音小程序开发常见问题与解决方法

抖音小程序要特别注意宿主环境、基础库版本、开放平台能力、交易能力、内容审核和真机表现。开发工具里能跑通，只能说明语法和部分接口没问题，最终还要以真机、沙盒、体验版和线上表现为准。

## `tt.request` 开发能通，线上失败

常见原因：

- 请求域名没有配置到平台白名单。
- 线上版本使用了 HTTP。
- 接口证书异常或跳转到了未配置域名。
- 请求超时，接口响应超过平台限制。
- `content-type` 和服务端解析方式不一致。
- header 中设置了平台不允许的字段。

统一封装请求：

```js
const API_BASE = 'https://api.example.com'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    tt.request({
      url: API_BASE + path,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 15000,
      header: {
        Authorization: tt.getStorageSync('token') || '',
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

如果使用 `application/x-www-form-urlencoded`，字段值尽量转成字符串，避免后端解析结果和预期不一致。

## `tt.login` 拿不到 code 或登录不稳定

常见流程：

```text
tt.login -> code -> 服务端 code2session -> open_id/union_id -> 服务端 token -> 小程序保存 token
```

排查点：

- 用户是否已经登录抖音宿主。
- code 是否被重复使用。
- 服务端 appid、secret、环境是否对应。
- 前端是否正确处理登录失败。
- token 过期后是否能重新登录。

```js
function login() {
  tt.login({
    success: async res => {
      const data = await request('/auth/douyin-login', {
        method: 'POST',
        data: {
          code: res.code
        }
      })

      tt.setStorageSync('token', data.token)
    },
    fail: err => {
      tt.showToast({
        title: '登录失败',
        icon: 'none'
      })
      console.log(err)
    }
  })
}
```

服务端要生成自己的登录态，不要把平台密钥和敏感凭证放到前端。

## 支付调不起或支付报错

抖音小程序支付建议按这条链路：

```text
小程序创建订单 -> 服务端预下单 -> 服务端返回 orderInfo -> tt.pay -> 服务端接收支付通知 -> 主动查单兜底
```

常见问题：

- 支付能力没有开通或商户入驻未完成。
- 服务端预下单参数不完整。
- `orderInfo` 不是服务端生成的完整结构。
- `service` 参数错误。
- 前端调起成功后直接改订单状态，没有等服务端通知。
- 支付调试参数上线前没有移除。

```js
async function pay(orderId) {
  const data = await request('/pay/douyin-mini-program', {
    method: 'POST',
    data: {
      order_id: orderId
    }
  })

  tt.pay({
    orderInfo: data.order_info,
    service: 5,
    success(res) {
      console.log('pay success', res)
    },
    fail(err) {
      console.log('pay fail', err)
    }
  })
}
```

订单最终状态应以后端支付通知或查单结果为准。

## 分包后打开页面失败

常见原因：

- `app.json` 中分包路径配置错误。
- 页面路径写成了微信项目里的旧路径。
- tabBar 页面被放进分包。
- 分包资源引用了主包里不存在的相对路径。
- 预下载或独立分包配置和实际页面不一致。

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

跳转：

```js
tt.navigateTo({
  url: '/package-order/pages/detail/index?id=10001'
})
```

迁移项目时要注意配置字段差异，例如抖音小程序分包结构使用 `subpackages`。

## 开发者工具正常，真机样式错乱

常见原因：

- 只在模拟器尺寸下调试，没有真机测试。
- 使用固定高度，遇到不同安全区和导航栏高度后溢出。
- 图片没有设置明确宽高。
- 滚动容器和页面滚动嵌套。
- 组件默认样式和微信端不一样。

建议：

- 核心页面用真机测试 iOS 和 Android。
- 列表页避免固定大高度。
- 图片容器先给比例，避免加载后撑开布局。
- 复杂弹层要检查安全区。

```css
.cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## 分享、短视频入口或场景值丢失

抖音小程序经常会从视频、搜索、二维码、直播、分享等入口进入。不要只依赖首页进入逻辑。

处理方法：

- 在 `App.onLaunch`、`App.onShow` 里记录启动参数。
- 页面 `onLoad` 解析自己的参数。
- 重要业务参数传到服务端落库。
- 参数缺失时有兜底页面。

```js
App({
  onLaunch(options) {
    console.log('launch options', options)
  },

  onShow(options) {
    console.log('show options', options)
  }
})
```

## 内容审核或能力审核被拒

常见原因：

- 小程序类目和页面内容不一致。
- 没有提供可登录的测试账号。
- 页面存在测试文字、空白页、无效按钮。
- 交易、生活服务、课程、医疗、金融等能力材料不完整。
- 隐私协议、用户协议、权限用途说明不完整。
- 跳转外部内容或 web-view 页面未说明清楚。

提交前建议准备：

- 测试账号和测试路径。
- 支付测试说明。
- 核心功能截图说明。
- 用户协议和隐私协议入口。
- 涉及资质的材料和后台配置。

## 宿主版本差异导致 API 不可用

抖音小程序可能运行在不同宿主和不同版本里。某些 API 需要特定基础库或宿主版本。

处理方法：

- 使用新 API 前确认最低支持版本。
- 对低版本做降级处理。
- 关键能力在真机上测，不只看 IDE。
- 日志里记录宿主信息，方便定位问题。

```js
const canPay = tt.canIUse && tt.canIUse('pay')

if (!canPay) {
  tt.showToast({
    title: '当前版本暂不支持支付',
    icon: 'none'
  })
}
```

## `setData` 频繁导致页面卡顿

常见场景：

- 瀑布流一次性渲染太多数据。
- 视频列表、商品列表一次加载几百条。
- 滚动事件中不断更新页面数据。
- 拖拽或动画状态通过 `setData` 高频同步。

处理方法：

- 分页加载。
- 只更新局部字段。
- 高频事件做节流。
- 动画尽量交给 CSS 或平台组件。

```js
this.setData({
  ['list[' + index + '].status']: 'active'
})
```

## 上线前检查清单

- 域名白名单配置完成，线上接口使用 HTTPS。
- 登录链路只把 code 发给服务端，密钥不进前端。
- 支付订单由服务端创建，订单状态以后端为准。
- 分包路径、tabBar、页面跳转真机测试过。
- iOS、Android、不同抖音版本都跑过核心流程。
- 内容类目、资质材料、测试账号准备完整。
- 隐私协议、用户协议和权限用途说明完整。
- 关键入口参数有兜底处理。

## 官方入口

- 抖音小程序开发准备：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/develop-process/prepare
- 抖音小程序 JS API：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/overview
- `tt.request`：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/network/http/tt-request
- 小程序登录：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/tutorial/basic-ability/microapp-login
- `tt.pay`：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/open-interface/pay/tt-pay/
