---
title: 常见移动 App URL Scheme 整理
description: 抖音、快手、小红书、微信、微博、B站等常见 App URL Scheme、Android intent、iOS 打开方式、验证命令和排查方法整理。
---

URL Scheme 常用于从浏览器、短信、H5、App 内 WebView 或另一个 App 拉起目标 App。不同版本、不同平台、不同地区包名可能会变，这份清单适合作为调试入口，最终以你本机安装版本验证为准。

## 验证方法

### Android 使用 adb 打开

```bash
adb shell am start -a android.intent.action.VIEW -d 'snssdk1128://'
```

打开指定路径：

```bash
adb shell am start -a android.intent.action.VIEW -d 'weixin://'
```

如果要看失败原因：

```bash
adb logcat | grep -i 'ActivityTaskManager'
```

常见失败：

```text
Error: Activity not started, unable to resolve Intent
```

意思是当前设备没有 App 声明能处理这个 scheme，或者 scheme 已经变化。

### iOS 模拟器打开

```bash
xcrun simctl openurl booted 'weixin://'
```

真机可以在 Safari 地址栏里输入 scheme，也可以用自己写的测试 App 调 `UIApplication.open`。

### 从 APK 里查 scheme

```bash
apktool d app.apk -o app_dec
rg -n 'scheme|host|intent-filter' app_dec/AndroidManifest.xml
```

典型结构：

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="snssdk1128" />
</intent-filter>
```

### 从 iOS Info.plist 查 scheme

```bash
plutil -p Payload/App.app/Info.plist | grep -A 20 CFBundleURLTypes
```

也可以把 plist 转成 XML：

```bash
plutil -convert xml1 Payload/App.app/Info.plist -o -
```

## 常见 App Scheme 清单

| App | 常见 Scheme | 备注 |
| --- | --- | --- |
| 抖音 | `snssdk1128://` | 国内抖音常见主 scheme |
| 抖音极速版 | `snssdk2329://` | 具体以安装包为准 |
| TikTok | `snssdk1233://` | 海外 TikTok 常见 |
| 快手 | `kwai://` | 快手常见 |
| 快手极速版 | `ksnebula://` | 具体以版本为准 |
| 小红书 | `xhsdiscover://` | 小红书常见 |
| 微信 | `weixin://` | 微信主 scheme |
| 企业微信 | `wxwork://` | 企业微信 |
| 微博 | `sinaweibo://` | 新浪微博 |
| B站 | `bilibili://` | 哔哩哔哩 |
| QQ | `mqq://` | 手机 QQ |
| QQ 浏览器 | `mttbrowser://` | QQ 浏览器 |
| 支付宝 | `alipays://` | 支付宝 |
| 淘宝 | `taobao://`、`tbopen://` | 淘宝和手淘跳转 |
| 京东 | `openapp.jdmobile://` | 京东 |
| 拼多多 | `pinduoduo://` | 拼多多 |
| 美团 | `imeituan://` | 美团 |
| 大众点评 | `dianping://` | 大众点评 |
| 高德地图 | `iosamap://`、`androidamap://` | iOS/Android 不同 |
| 百度地图 | `baidumap://` | 百度地图 |
| 知乎 | `zhihu://` | 知乎 |
| 豆瓣 | `douban://` | 豆瓣 |
| 网易云音乐 | `orpheus://` | 网易云音乐 |
| 喜马拉雅 | `iting://` | 喜马拉雅 |

## 抖音

常见入口：

```text
snssdk1128://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'snssdk1128://'
```

常见包名：

```text
com.ss.android.ugc.aweme
```

查看抖音声明了哪些 intent：

```bash
adb shell dumpsys package com.ss.android.ugc.aweme | grep -i -A 8 'scheme'
```

如果想从网页里兜底打开：

```html
<a href="snssdk1128://">打开抖音</a>
```

实际业务里通常还会配合 Universal Link、App Link 或下载页兜底。

## 快手

常见入口：

```text
kwai://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'kwai://'
```

常见包名：

```text
com.smile.gifmaker
```

如果 `kwai://` 无法打开，先看安装包 manifest：

```bash
adb shell pm path com.smile.gifmaker
```

导出 APK 后再用 `apktool` 查 `intent-filter`。

## 小红书

常见入口：

```text
xhsdiscover://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'xhsdiscover://'
```

常见包名：

```text
com.xingin.xhs
```

调试时可以先只打开主 scheme，不要一开始就拼复杂路径。主 scheme 能打开，再逐步加 host 和 query。

## 微信

常见入口：

```text
weixin://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'weixin://'
```

常见包名：

```text
com.tencent.mm
```

微信对很多内部路径有限制，能否跳到具体页面通常受版本、来源、白名单、Universal Link 配置影响。调试开放能力时优先看微信开放平台文档和你自己的 App 配置。

## 微博

常见入口：

```text
sinaweibo://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'sinaweibo://'
```

常见包名：

```text
com.sina.weibo
```

网页按钮：

```html
<a href="sinaweibo://">打开微博</a>
```

## B站

常见入口：

```text
bilibili://
```

Android 测试：

```bash
adb shell am start -a android.intent.action.VIEW -d 'bilibili://'
```

常见包名：

```text
tv.danmaku.bili
```

如果主 scheme 成功但具体视频路径失败，说明路径规则不匹配或被版本限制。先用 `dumpsys package` 查声明，再抓取 App 内分享链接做对照。

## H5 拉起 App 的兜底写法

简单版：

```html
<button id="openApp">打开 App</button>

<script>
const scheme = 'bilibili://'
const fallback = 'https://www.bilibili.com/'

document.getElementById('openApp').addEventListener('click', () => {
  const started = Date.now()
  window.location.href = scheme

  setTimeout(() => {
    if (Date.now() - started < 1800) {
      window.location.href = fallback
    }
  }, 1200)
})
</script>
```

更稳一点的版本要监听页面可见性：

```html
<button id="openApp">打开 App</button>

<script>
function openWithFallback(scheme, fallback) {
  let hidden = false

  const onVisibility = () => {
    if (document.hidden) {
      hidden = true
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.location.href = scheme

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    if (!hidden) {
      window.location.href = fallback
    }
  }, 1500)
}

document.getElementById('openApp').addEventListener('click', () => {
  openWithFallback('xhsdiscover://', 'https://www.xiaohongshu.com/')
})
</script>
```

## Android 侧判断能否打开

Kotlin：

```kotlin
fun canOpen(context: Context, uri: String): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
    intent.addCategory(Intent.CATEGORY_BROWSABLE)
    return intent.resolveActivity(context.packageManager) != null
}

fun openScheme(context: Context, uri: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
    intent.addCategory(Intent.CATEGORY_BROWSABLE)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
}
```

Android 11 以后如果要查询其他 App，需要在 `AndroidManifest.xml` 里声明 `queries`：

```xml
<queries>
    <package android:name="com.tencent.mm" />
    <package android:name="com.ss.android.ugc.aweme" />
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="weixin" />
    </intent>
</queries>
```

## iOS 侧判断能否打开

Swift：

```swift
func openScheme(_ value: String) {
    guard let url = URL(string: value) else {
        return
    }

    UIApplication.shared.open(url)
}
```

如果要用 `canOpenURL`，需要在 `Info.plist` 配置白名单：

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>weixin</string>
    <string>sinaweibo</string>
    <string>bilibili</string>
    <string>xhsdiscover</string>
    <string>snssdk1128</string>
    <string>kwai</string>
</array>
```

Swift：

```swift
func canOpen(_ value: String) -> Bool {
    guard let url = URL(string: value) else {
        return false
    }
    return UIApplication.shared.canOpenURL(url)
}
```

## 排查清单

| 现象 | 排查方向 |
| --- | --- |
| Android 报 `unable to resolve Intent` | App 未安装、scheme 错、manifest 未声明 browsable |
| iOS `canOpenURL` 返回 false | 没配 `LSApplicationQueriesSchemes`、App 未安装、scheme 错 |
| H5 点击无反应 | 浏览器限制非用户手势拉起、scheme 被拦截 |
| 能打开 App 但不到具体页面 | host/path/query 规则变了，或目标页需要登录态 |
| 某些浏览器可以，某些不行 | 浏览器对外部协议策略不同 |
| Android 11 查询不到 | 缺少 `queries` 声明 |

## 建议保存自己的验证表

scheme 资料很容易过期。每次用于项目时，建议记录：

| 字段 | 示例 |
| --- | --- |
| App 名称 | 抖音 |
| App 版本 | 32.x |
| 平台 | Android |
| 包名 | `com.ss.android.ugc.aweme` |
| Scheme | `snssdk1128://` |
| 是否可打开 | 是 |
| 验证命令 | `adb shell am start -a android.intent.action.VIEW -d 'snssdk1128://'` |
| 验证日期 | 2026-05-31 |

这样以后出问题时，能快速判断是代码变了、App 版本变了，还是设备环境变了。

