---
title: Auto.js
description: Auto.js Android 自动化脚本基础、无障碍权限、选择器、控件查找、调试、打包和常见问题。
---

Auto.js 是 Android 自动化脚本工具，常用于个人设备上的重复操作辅助、应用测试、UI 自动化验证和效率脚本。不同版本和社区分支差异较大，使用前要确认你当前安装的是哪个版本。

## 使用边界

Auto.js 依赖 Android 无障碍能力，权限很敏感。建议只用于：

- 自己设备上的效率脚本。
- 自己应用或授权应用的测试。
- 重复操作辅助。
- UI 自动化学习。
- 本地数据整理。

不要用于绕过验证码、绕过风控、批量注册、刷量、骚扰、盗取账号或自动化操作他人平台。脚本越接近真实用户操作，越要明确授权和合规边界。

## 基础准备

通常需要：

- 安装 Auto.js 或兼容分支。
- 开启无障碍服务。
- 开启悬浮窗权限。
- 需要截图识别时开启截图权限。
- 允许后台运行，避免被系统省电策略杀掉。
- 准备一台测试机，不要直接在主力手机上跑未知脚本。

不同 Android 版本对无障碍、后台运行、悬浮窗权限限制不同，问题经常出在系统权限上。

## Hello World

```js
toast('hello autojs')
console.log('hello autojs')
```

调试时优先用 `toast` 和 `console.log` 确认脚本是否运行到目标位置。

## 控件查找

常见选择器：

```js
text('确定').findOne(3000)
id('submit').findOne(3000)
desc('返回').findOne(3000)
className('android.widget.Button').find()
```

点击前先判断控件是否存在：

```js
const button = text('确定').findOne(3000)

if (button) {
  button.click()
} else {
  toast('没有找到按钮')
}
```

不要假设所有手机、所有系统、所有 App 版本的控件结构完全一致。

## 等待和超时

自动化脚本最常见的问题是页面还没加载完就开始找控件。建议每一步都带超时和失败处理。

```js
const target = text('完成').findOne(5000)

if (!target) {
  throw new Error('等待完成按钮超时')
}

target.click()
```

少用固定长时间 `sleep`。更稳的是等待目标控件出现。

## 脚本结构建议

```js
function waitText(label, timeout) {
  const node = text(label).findOne(timeout)
  if (!node) {
    throw new Error('未找到文本: ' + label)
  }
  return node
}

function main() {
  auto.waitFor()
  waitText('开始', 5000).click()
  toast('执行完成')
}

main()
```

把重复逻辑封装成小函数，脚本会比一长串点击更容易维护。

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 脚本没有反应 | 无障碍服务未开启或被系统关闭 | 重新开启无障碍，检查后台权限 |
| 找不到控件 | 文本变化、控件不可见、页面未加载完成 | 用布局分析工具查看真实属性 |
| 点击无效 | 点到父节点、控件不可点击、坐标偏移 | 找可点击父节点或改用坐标兜底 |
| 运行一会儿停止 | 省电策略、后台限制、脚本异常 | 加日志，关闭电池优化 |
| 截图失败 | 没有截图权限或系统限制 | 重新授权截图权限 |
| 打包后不运行 | 权限缺失、版本兼容、混淆配置问题 | 检查目标 Android 版本和权限 |
| 中文文本匹配失败 | 文案变化、空格、繁简体、控件层级变化 | 尝试 `textContains` 或更稳定的 id |

## 稳定性建议

- 每一步都写超时和失败提示。
- 关键操作前确认当前页面。
- 用控件属性优先，坐标点击只做兜底。
- 对不同分辨率和字体大小做适配。
- 给脚本加停止开关。
- 不要让脚本无限循环无日志运行。
- 不要在未知脚本里输入账号密码。

## 版本差异

Auto.js 原版、Auto.js Pro、AutoX.js 等分支 API 和运行方式可能不同。复制代码前先确认：

- 当前应用版本。
- Android 系统版本。
- 文档对应版本。
- API 是否存在。
- 权限是否可用。

更完整的版本选择和分支差异见：[Auto.js 版本区别](/tools/autojs-versions)。

如果使用 VS Code 调试 Auto.js Pro，见：[Auto.js-Pro-Ext](/tools/autojs-pro-ext)。

## 官方入口

- [Auto.js Docs](https://hyb1996.github.io/AutoJs-Docs/)
- [Auto.js Pro Docs](https://pro.autojs.org/docs/)
