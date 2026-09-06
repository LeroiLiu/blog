---
title: ColorUI 使用文档与常见问题
description: ColorUI、ColorUI3.x、MP-CU 在 uni-app 和微信小程序项目中的使用、样式体系、组件迁移、主题维护和常见问题整理。
---

ColorUI 更偏视觉样式和基础组件风格，常见于小程序、uni-app、后台活动页、营销页等项目。它和 uView 这类完整组件库不同，很多时候 ColorUI 更像一套样式体系和页面风格基础。

## 适合什么项目

| 场景 | 建议 |
| --- | --- |
| 营销活动页 | 适合快速做视觉统一 |
| 小程序展示页 | 适合使用现成样式类 |
| 表单和复杂业务组件很多 | 需要配合其他组件库或自己封装 |
| 新项目长期维护 | 要先确认使用哪个 ColorUI 分支 |

常见分支：

- ColorUI 旧项目。
- ColorUI3.x。
- MP-CU，偏微信原生小程序适配。

## 引入方式

不同项目引入方式不完全一样，常见是把样式文件放到项目目录，再在全局样式里引入。

```scss
@import '@/colorui/main.scss';
@import '@/colorui/icon.scss';
```

微信原生小程序可能是：

```css
@import './colorui/main.wxss';
@import './colorui/icon.wxss';
```

以项目实际文件为准，不要只复制其他项目路径。

## 常见页面结构

```html
<view class="cu-bar bg-white solid-bottom">
  <view class="action">
    <text class="cuIcon-title text-blue"></text>
    订单信息
  </view>
</view>

<view class="padding">
  <view class="cu-list menu">
    <view class="cu-item">
      <view class="content">订单编号</view>
      <view class="action text-gray">10001</view>
    </view>
  </view>
</view>
```

ColorUI 类名比较偏样式工具类，使用时要注意团队统一，不要一页一种写法。

## 主题色怎么维护

建议不要在页面里散乱使用颜色类。先定好项目主色：

```scss
$primary: #2979ff;
$success: #19be6b;
$warning: #ff9900;
$danger: #fa3534;
```

然后封装常用业务块：

```html
<view class="app-section">
  <view class="app-section__title">基础信息</view>
  <slot />
</view>
```

```scss
.app-section {
  padding: 24rpx;
  background: #ffffff;
}

.app-section__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}
```

这样后续就算换掉 ColorUI，也不会牵动所有页面。

## 和 uView 能不能混用

可以混用，但要注意：

- 全局样式可能互相覆盖。
- 图标字体可能冲突。
- 按钮、表单、弹窗风格容易不一致。
- 页面包体积会变大。

建议：

- ColorUI 负责页面布局和视觉。
- uView/uview-plus 负责复杂表单、弹窗、选择器。
- 项目里封装业务组件，页面不要直接堆太多第三方类名。

## 图标不显示

常见原因：

- `icon.wxss` 或 `icon.scss` 没有引入。
- 字体文件路径错误。
- 小程序编译后静态资源路径变化。
- 文件被放到了不会被打包的位置。

检查：

- 图标样式是否存在。
- 字体文件是否能访问。
- 开发工具是否缓存旧文件。

## 样式污染怎么办

ColorUI 常使用全局类名，样式污染比较常见。

处理方法：

- 页面根节点加业务类名。
- 自己新增样式尽量用 BEM 或短业务前缀。
- 不直接修改第三方源码。
- 修改通过独立覆盖文件集中管理。

```scss
.order-page {
  .cu-list.menu > .cu-item {
    min-height: 96rpx;
  }
}
```

## H5 和小程序显示不一致

原因：

- 小程序组件和浏览器元素默认样式不同。
- `rpx` 在不同端换算不同。
- 安全区、导航栏和滚动容器表现不同。
- 部分 CSS 选择器在小程序端支持有限。

建议核心页面分别测试 H5、微信小程序和 App。

## 常见问题

### 页面看起来很乱

多半是没有统一布局规则。先规定：

- 页面背景色。
- 卡片间距。
- 标题字号。
- 主按钮样式。
- 列表项高度。

### 旧项目升级后样式变了

不要直接覆盖新版文件。先比较旧版和新版类名，再逐页回归。

### 组件缺少交互能力

ColorUI 更偏样式，不是所有业务组件都完整。复杂日期选择、上传、表单校验、弹窗联动可以配合其他组件库或自己封装。

## 官方入口

- MP-CU 文档：https://mp.color-ui.com/guide/
- ColorUI 社区入口：https://www.color-ui.com/
