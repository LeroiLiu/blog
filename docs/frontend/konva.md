---
title: Konva.js 常见问题
description: Konva.js 舞台、图层、节点、拖拽、Transformer、导出、性能优化和 Vue 项目常见问题整理。
---

# Konva.js 常见问题

Konva.js 是基于 Canvas 的 2D 图形交互框架。它把图形抽象成对象节点，适合做流程图、标注工具、画板、拖拽编辑器、平面设计编辑器和可视化交互。

::: info 官方入口
- [Konva 文档](https://konvajs.org/docs/)
- [Konva API](https://konvajs.org/api/Konva.html)
- [Konva Vue 绑定](https://konvajs.org/docs/vue/)
:::

## 核心概念

| 概念 | 说明 |
| --- | --- |
| `Stage` | 舞台，绑定一个容器，管理画布大小 |
| `Layer` | 图层，一个 Layer 底层通常对应 Canvas |
| `Group` | 分组，便于整体移动、缩放和事件处理 |
| `Shape` | 图形节点，例如矩形、圆、线、文本、图片 |
| `Transformer` | 选择框，用来缩放、旋转节点 |

## 基础示例

```js
import Konva from 'konva'

const stage = new Konva.Stage({
  container: 'container',
  width: 800,
  height: 500
})

const layer = new Konva.Layer()
stage.add(layer)

const rect = new Konva.Rect({
  x: 80,
  y: 80,
  width: 160,
  height: 90,
  fill: '#2f80ed',
  cornerRadius: 8,
  draggable: true
})

layer.add(rect)
layer.draw()
```

## 拖拽和边界限制

```js
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 120,
  height: 80,
  fill: '#27ae60',
  draggable: true,
  dragBoundFunc(pos) {
    return {
      x: Math.max(0, Math.min(pos.x, stage.width() - this.width())),
      y: Math.max(0, Math.min(pos.y, stage.height() - this.height()))
    }
  }
})
```

## 选择与 Transformer

```js
const transformer = new Konva.Transformer({
  rotateEnabled: true,
  keepRatio: false
})

layer.add(transformer)

rect.on('click tap', () => {
  transformer.nodes([rect])
  layer.batchDraw()
})

stage.on('click tap', (event) => {
  if (event.target === stage) {
    transformer.nodes([])
    layer.batchDraw()
  }
})
```

## 图片加载

```js
const image = new Image()
image.crossOrigin = 'anonymous'
image.src = '/images/demo.png'

image.onload = () => {
  const node = new Konva.Image({
    x: 40,
    y: 40,
    image,
    width: 240,
    height: 160,
    draggable: true
  })

  layer.add(node)
  layer.draw()
}
```

如果后续要导出图片，跨域图片同样需要服务器允许跨域，否则 Canvas 会被污染。

## 保存和恢复

Konva 支持序列化：

```js
const json = stage.toJSON()
localStorage.setItem('stage', json)
```

恢复：

```js
const json = localStorage.getItem('stage')
const stage = Konva.Node.create(json, 'container')
```

注意：图片对象、事件函数和外部业务状态不能只靠 JSON 完整恢复。图片需要重新加载，事件需要重新绑定。

## 导出图片

```js
const dataUrl = stage.toDataURL({
  pixelRatio: 2
})

const link = document.createElement('a')
link.download = 'stage.png'
link.href = dataUrl
link.click()
```

如果导出模糊，可以提高 `pixelRatio`。如果导出失败，优先检查跨域图片。

## Vue 中使用注意

在 Vue 里使用 Konva，要注意初始化时机：

```vue
<template>
  <div ref="container" class="stage"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Konva from 'konva'

const container = ref()

onMounted(() => {
  const stage = new Konva.Stage({
    container: container.value,
    width: 800,
    height: 500
  })

  const layer = new Konva.Layer()
  stage.add(layer)
})
</script>
```

不要在模板还没挂载时创建 `Stage`，否则容器可能拿不到。

## 常见问题

### 为什么图形点不到

常见原因：

- 节点没有添加到 Layer。
- Layer 没有添加到 Stage。
- 图形设置了 `listening: false`。
- 节点被其他图形遮挡。
- 使用了自定义 `sceneFunc`，但没有调用 `fillStrokeShape`。

### 为什么修改属性后不刷新

可以调用：

```js
layer.batchDraw()
```

多数情况下 Konva 会自动绘制，但批量修改时用 `batchDraw` 更稳。

### 节点很多很卡怎么办

- 静态背景放独立 Layer。
- 复杂图形使用 `node.cache()`。
- 拖拽中的实时效果尽量简化。
- 不需要事件的节点设置 `listening: false`。
- 大量节点时避免频繁 `find` 和深层遍历。

## Konva 与 Fabric.js 怎么选

| 场景 | 建议 |
| --- | --- |
| 节点拖拽、连线、流程图、标注 | Konva.js |
| 海报编辑、图片编辑、对象选择、SVG 导入导出 | Fabric.js |
| 纯绘制、性能极限、游戏循环 | 原生 Canvas 或游戏引擎 |
