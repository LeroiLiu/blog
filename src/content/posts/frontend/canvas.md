---
title: Canvas 常见问题与方法
description: JavaScript Canvas 基础绘制、高清屏适配、动画、事件坐标、图片导出、性能优化和常见问题整理。
---

Canvas 适合做图形编辑、海报生成、小游戏、可视化、签名板、截图合成和图片处理。它和普通 DOM 最大的区别是：Canvas 是一块位图画布，画上去的内容不会自动变成可选择、可点击的 DOM 节点。

> **文档入口**
>
> - [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
> - [MDN Canvas 教程](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
> - [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

## 基础模板

```html
<canvas id="board" style="width: 400px; height: 240px;"></canvas>
```

```js
const canvas = document.querySelector('#board')
const ctx = canvas.getContext('2d')

canvas.width = 400
canvas.height = 240

ctx.fillStyle = '#2f80ed'
ctx.fillRect(40, 40, 160, 80)
```

## 高清屏模糊

如果只设置 CSS 宽高，不设置 `canvas.width` 和 `canvas.height`，Canvas 内部位图尺寸可能还是默认的 `300 x 150`，画面会拉伸或发糊。

推荐根据 `devicePixelRatio` 设置真实像素尺寸：

```js
function setupCanvas(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1
  const ctx = canvas.getContext('2d')

  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  canvas.width = Math.round(cssWidth * dpr)
  canvas.height = Math.round(cssHeight * dpr)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

const ctx = setupCanvas(document.querySelector('#board'), 400, 240)
ctx.fillText('清晰文字', 20, 40)
```

## 动画循环

不要用 `setInterval` 硬刷动画。浏览器动画建议使用 `requestAnimationFrame`，它会在下一次重绘前回调，后台标签页也更容易被浏览器降频。

```js
let x = 0
let lastTime = 0

function draw(time) {
  const delta = time - lastTime
  lastTime = time

  x += delta * 0.08
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillRect(x, 40, 80, 80)

  requestAnimationFrame(draw)
}

requestAnimationFrame(draw)
```

## 鼠标坐标不准

事件里的 `clientX`、`clientY` 是页面坐标，需要换算成 Canvas 内部坐标。

```js
function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

canvas.addEventListener('pointerdown', (event) => {
  const point = getCanvasPoint(event, canvas)
  console.log(point.x, point.y)
})
```

如果画布做了缩放，还要乘以真实像素和 CSS 尺寸的比例：

```js
function getScaledPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect()

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  }
}
```

## 图片跨域污染

如果 Canvas 绘制了跨域图片，再调用 `toDataURL` 或 `getImageData`，可能报错：

```txt
Tainted canvases may not be exported
```

处理方式：

```js
const image = new Image()
image.crossOrigin = 'anonymous'
image.src = 'https://example.com/image.png'

image.onload = () => {
  ctx.drawImage(image, 0, 0)
}
```

同时图片服务器必须返回允许跨域的响应头，例如：

```txt
Access-Control-Allow-Origin: *
```

## 导出图片

小图可以用 `toDataURL`：

```js
const url = canvas.toDataURL('image/png')
```

大图更推荐 `toBlob`，避免一次性生成超长 Base64 字符串：

```js
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'canvas.png'
  link.click()

  URL.revokeObjectURL(url)
}, 'image/png')
```

## 常见绘图方法

| 方法 | 说明 |
| --- | --- |
| `fillRect` | 绘制填充矩形 |
| `strokeRect` | 绘制矩形描边 |
| `clearRect` | 清空指定区域 |
| `beginPath` | 开始一条路径 |
| `moveTo` | 移动画笔 |
| `lineTo` | 画线 |
| `arc` | 画圆或圆弧 |
| `fillText` | 绘制文字 |
| `drawImage` | 绘制图片、视频或另一个 Canvas |
| `getImageData` | 读取像素 |
| `putImageData` | 写回像素 |

## 性能建议

- 静态背景和动态元素分成多个 Canvas。
- 动画中只重绘变化区域，或至少减少复杂阴影、滤镜和文字重绘。
- 图片提前加载完成后再绘制。
- 高频事件里不要直接复杂计算，可以用 `requestAnimationFrame` 合并绘制。
- 大图导出时注意内存，移动端尤其容易白屏或崩溃。

## 什么时候不用原生 Canvas

如果需要拖拽、选择、缩放、旋转、图层、撤销重做、对象序列化，直接用原生 Canvas 会写很多基础设施。可以优先考虑：

- [Konva.js](/frontend/konva)：适合图形交互、舞台、图层、节点、Transformer。
- [Fabric.js](/frontend/fabric)：适合图片编辑、海报编辑、对象模型、SVG、序列化。
