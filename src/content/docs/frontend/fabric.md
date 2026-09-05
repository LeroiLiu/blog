---
title: Fabric.js 常见问题
description: Fabric.js Canvas 对象模型、图片编辑、文本、选择框、导出、JSON 保存、SVG 和常见问题整理。
---

Fabric.js 是 Canvas API 之上的对象模型和交互层。它适合做海报编辑器、图片编辑器、在线设计工具、标注工具、签名和简单的图形排版。

> **官方入口**
>
> - [Fabric.js 文档](https://fabricjs.com/docs/)
> - [Fabric.js API](https://fabricjs.com/api/)
> - [Fabric.js Demos](https://fabricjs.com/demos/)

## 核心概念

| 概念 | 说明 |
| --- | --- |
| `fabric.Canvas` | 可交互画布，支持选择、拖拽、缩放、旋转 |
| `fabric.StaticCanvas` | 静态画布，不需要交互时使用 |
| `fabric.Object` | 所有图形对象的基础类型 |
| `toJSON` | 保存对象状态 |
| `loadFromJSON` | 恢复对象状态 |

## 基础示例

```html
<canvas id="poster" width="800" height="500"></canvas>
```

```js
import { Canvas, Rect, Textbox } from 'fabric'

const canvas = new Canvas('poster', {
  backgroundColor: '#f6f7fb'
})

const rect = new Rect({
  left: 80,
  top: 80,
  width: 220,
  height: 120,
  fill: '#2f80ed',
  rx: 8,
  ry: 8
})

const text = new Textbox('Leroi Docs', {
  left: 110,
  top: 120,
  width: 180,
  fontSize: 28,
  fill: '#ffffff'
})

canvas.add(rect, text)
canvas.setActiveObject(text)
canvas.renderAll()
```

## 图片加载

```js
import { FabricImage } from 'fabric'

FabricImage.fromURL('/images/demo.png', {
  crossOrigin: 'anonymous'
}).then((image) => {
  image.set({
    left: 40,
    top: 40,
    scaleX: 0.5,
    scaleY: 0.5
  })

  canvas.add(image)
  canvas.renderAll()
})
```

图片来自外部域名时，如果要导出图片，服务器需要允许跨域。

## 常用对象

```js
import { Circle, Line, Rect, Textbox } from 'fabric'

const circle = new Circle({
  left: 100,
  top: 100,
  radius: 40,
  fill: '#27ae60'
})

const line = new Line([20, 20, 180, 120], {
  stroke: '#333333',
  strokeWidth: 2
})

const text = new Textbox('可编辑文本', {
  left: 80,
  top: 180,
  width: 240,
  fontSize: 24
})

canvas.add(circle, line, text)
```

## 禁用某些控制点

```js
const object = canvas.getActiveObject()

object.setControlsVisibility({
  mt: false,
  mb: false,
  ml: false,
  mr: false
})

canvas.requestRenderAll()
```

## 保存与恢复

```js
const json = canvas.toJSON([
  'id',
  'name'
])

localStorage.setItem('poster', JSON.stringify(json))
```

恢复：

```js
const json = localStorage.getItem('poster')

canvas.loadFromJSON(json).then(() => {
  canvas.renderAll()
})
```

建议给业务对象补充 `id`、`type`、`name` 等字段，后续恢复时更容易和后端数据对应。

## 导出图片

```js
const dataUrl = canvas.toDataURL({
  format: 'png',
  multiplier: 2
})
```

`multiplier` 可以提升导出清晰度，但会增加内存。移动端导出大图时要保守。

## 常见问题

### 为什么对象添加了但看不见

检查：

- 是否执行了 `canvas.add(object)`。
- 对象是否在画布范围外。
- `fill` 是否透明。
- 图片是否还没有加载完成。
- 是否需要 `canvas.renderAll()` 或 `canvas.requestRenderAll()`。

### 为什么导出时报跨域错误

原因通常是外链图片没有设置跨域，或者服务器没有返回允许跨域响应头。图片加载时要设置 `crossOrigin: 'anonymous'`，资源服务也要配合。

### 为什么 Vue/React 中重复初始化

组件销毁时要释放 Fabric 实例：

```js
canvas.dispose()
```

否则热更新、路由切换或弹窗反复打开时，可能出现事件重复绑定、内存增长、画布错乱。

### Fabric.js 和 Konva.js 区别

| 对比 | Fabric.js | Konva.js |
| --- | --- | --- |
| 主要方向 | 图片编辑、海报编辑、对象模型 | 图形交互、节点系统、舞台图层 |
| 选择框 | 内置对象控制能力强 | 通常配合 `Transformer` |
| SVG | 支持较完整的 SVG 导入导出场景 | 支持 Path 等图形，但不是主打 SVG 编辑 |
| Vue 项目 | 可直接封装组件 | 可使用 Konva 或 Vue 绑定 |
