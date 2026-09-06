---
title: OpenCV 快速入门与常见问题
description: OpenCV Python 快速入门，整理安装、图片读写、视频摄像头、BGR/RGB、图像处理、部署和常见报错。
---

OpenCV 是常用的计算机视觉库，适合做图片处理、视频分析、摄像头采集、目标检测、二维码识别、工业视觉、机器人视觉和服务端图像处理。

> **官方入口**
>
> - [OpenCV 文档](https://docs.opencv.org/4.x/)
> - [OpenCV-Python Tutorials](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
> - [opencv-python PyPI](https://pypi.org/project/opencv-python/)

## 安装选择

Python 项目里常见安装包有四类，不要在同一个环境里混装多个 `opencv-*` 包，因为它们都提供 `cv2` 这个模块。

| 包名 | 适合场景 |
| --- | --- |
| `opencv-python` | 桌面环境，需要 `cv2.imshow` 等窗口能力 |
| `opencv-contrib-python` | 需要 contrib 扩展模块 |
| `opencv-python-headless` | 服务端、Docker、接口服务，不需要 GUI |
| `opencv-contrib-python-headless` | 服务端且需要 contrib 扩展模块 |

普通本地开发：

```sh
python -m pip install --upgrade pip
python -m pip install opencv-python
```

服务端或 Docker 环境：

```sh
python -m pip install --upgrade pip
python -m pip install opencv-python-headless
```

验证：

```sh
python -c "import cv2; print(cv2.__version__)"
```

## 图片读取与保存

```python
import cv2

img = cv2.imread("input.jpg")

if img is None:
    raise RuntimeError("image read failed")

cv2.imwrite("output.jpg", img)
```

`cv2.imread` 失败时通常返回 `None`，不是直接抛异常。因此做接口或批处理时，一定要判断。

## BGR 与 RGB

OpenCV 默认颜色顺序是 BGR，而很多 Python 图像库和前端页面常用 RGB。

```python
import cv2

img = cv2.imread("input.jpg")
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
```

如果你用 Matplotlib 显示 OpenCV 图片颜色不对，通常就是忘了 BGR 转 RGB。

## 中文路径读写

部分环境下，`cv2.imread("中文路径.jpg")` 可能失败。可以用 NumPy 读写字节绕开路径编码问题。

```python
import cv2
import numpy as np

def imread_unicode(path):
    data = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)

def imwrite_unicode(path, img):
    ext = "." + path.rsplit(".", 1)[-1]
    ok, data = cv2.imencode(ext, img)
    if not ok:
        return False
    data.tofile(path)
    return True
```

## 常用图像操作

### 缩放

```python
resized = cv2.resize(img, (640, 360))
```

保持比例：

```python
h, w = img.shape[:2]
target_w = 640
target_h = int(h * target_w / w)
resized = cv2.resize(img, (target_w, target_h))
```

### 裁剪

OpenCV 图片本质上是 NumPy 数组，裁剪顺序是 `y1:y2, x1:x2`。

```python
crop = img[100:300, 200:500]
```

### 二值化

```python
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
```

### 边缘检测

```python
edges = cv2.Canny(gray, 80, 160)
```

### 轮廓查找

```python
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for contour in contours:
    x, y, w, h = cv2.boundingRect(contour)
    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
```

## 摄像头读取

```python
import cv2

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    raise RuntimeError("camera open failed")

while True:
    ok, frame = cap.read()
    if not ok:
        break

    cv2.imshow("camera", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
```

在 Mac 或 Windows 上，摄像头权限、被其他软件占用、设备编号不对，都会导致 `cap.isOpened()` 为 `False`。

## 视频文件读取

```python
import cv2

cap = cv2.VideoCapture("input.mp4")

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

while True:
    ok, frame = cap.read()
    if not ok:
        break

    # process frame

cap.release()
```

如果视频打不开，多数是编码器、路径、文件损坏或 OpenCV 构建里缺少相关视频后端。

## 服务端接口处理图片

服务端接口通常不需要 `cv2.imshow`，建议使用 `opencv-python-headless`。

```python
import cv2
import numpy as np

def decode_upload(file_bytes):
    data = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("invalid image")
    return img

def encode_jpeg(img, quality=90):
    ok, data = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("encode failed")
    return data.tobytes()
```

## 常见报错

### `ModuleNotFoundError: No module named 'cv2'`

当前 Python 环境没有安装 OpenCV，或者装到了另一个虚拟环境。

```sh
which python
python -m pip show opencv-python
python -m pip install opencv-python
```

### `ImportError: DLL load failed`

Windows 常见，可能缺少运行库、系统组件或存在旧版 OpenCV 残留。处理方向：

- 升级 `pip`。
- 删除重复安装的 `opencv-*` 包。
- 安装 Visual C++ Redistributable。
- 确认 Python 位数和包位数一致。

### `cv2.imshow` 报错

常见原因：

- 安装的是 `opencv-python-headless`。
- 服务器或 Docker 没有图形环境。
- SSH 远程环境没有 X11。

服务端项目不要依赖 `cv2.imshow`，用 `cv2.imwrite` 或接口返回图片结果。

### `imread` 返回 `None`

排查：

- 文件路径是否存在。
- 是否有中文路径或特殊字符。
- 文件是否损坏。
- 是否有权限读取。
- 当前工作目录是否和你想的一样。

```python
import os

print(os.getcwd())
print(os.path.exists("input.jpg"))
```

### 图片颜色不对

OpenCV 是 BGR，Matplotlib、Pillow、前端 Canvas 常用 RGB。

```python
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
```

### Docker 镜像很大

服务端不需要 GUI 时，使用：

```sh
python -m pip install opencv-python-headless
```

同时尽量固定版本，避免构建环境某天突然变动。

## 项目注意事项

- 不要在接口里直接处理超大图片，先限制文件大小和分辨率。
- 批处理任务要捕获坏图、空图和编码失败。
- 摄像头程序要释放 `VideoCapture`。
- 模型推理和 OpenCV 处理尽量拆清楚，方便排查性能。
- 线上服务优先使用 headless 包。
- 如果需要 CUDA、特殊编码器或 contrib 特性，再考虑从源码构建。
