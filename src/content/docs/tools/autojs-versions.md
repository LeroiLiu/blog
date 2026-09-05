---
title: Auto.js 版本区别
description: Auto.js、Auto.js Pro、Auto.js Pro 8、Auto.js Pro 9、AutoX.js、Auto.js Pro 增强版等版本和分支区别。
---

Auto.js 生态里经常会看到 Auto.js、Auto.js Pro、Auto.js Pro 8、Auto.js Pro 9、AutoX.js、AutoJs6、Auto.js Pro 增强版等名称。它们不是一个东西，API、引擎、打包、调试方式和兼容性都可能不同。

## 快速结论

| 版本或分支 | 主要特点 | 适合场景 |
| --- | --- | --- |
| Auto.js 4.x | 经典开源版本，Rhino 引擎，第一代 API | 学习老资料、维护旧脚本 |
| Auto.js Pro 8.x | Pro 版本，默认 Rhino 引擎，第一代 API | 旧项目、老脚本、资料较多 |
| Auto.js Pro 9.x | 增加 Node.js 16.x / V8 引擎，第二代 API，同时保留第一代 API | 新项目、需要 npm、性能、现代 JS |
| Auto.js Pro 9.3+ | 配套新版 VS Code 插件体验更完整 | VS Code 远程调试、文件同步、设备文件管理 |
| AutoX.js / AutoJs6 | 社区维护分支，通常基于 Auto.js 4.x 或继续演进 | 需要社区版本、开源分支、持续维护 |
| 第三方增强版 | 基于某个版本二次维护，功能和来源差异较大 | 谨慎评估来源、兼容性和安全性 |

如果是新项目，并且目标是长期维护，优先考虑 Auto.js Pro 9 的 Node.js 引擎和第二代 API；如果是跟着旧教程或维护老脚本，先使用 Rhino / 第一代 API 会更容易对上资料。

## Auto.js 4.x

特点：

- 经典 Auto.js 文档和老教程多。
- 主要是 Rhino 引擎和第一代 API。
- 大量脚本使用全局函数和全局模块，例如 `app`、`files`、`images`、`threads`。
- 很多旧资料、旧示例以这个体系为基础。

适合：

- 读懂老脚本。
- 学习控件选择器、图色、无障碍自动化基础。
- 做兼容旧脚本的迁移前分析。

注意：

- Android 系统版本越新，权限、后台和无障碍限制越多。
- 老 API 资料多，但不代表所有设备都稳定可用。

## Auto.js Pro 8.x

Auto.js Pro 8.x 仍以 Rhino / 第一代 API 为核心，使用习惯和 Auto.js 4.x 更接近。

优点：

- 老资料、老脚本更容易迁移。
- 第一代 API 上手更直接。
- 同步、打包、编辑器等 Pro 能力更完整。

不足：

- JavaScript 语言能力偏旧。
- 性能和现代 JS 生态不如 Node.js 引擎。
- 多线程、模块系统和一些语言行为可能更容易踩坑。

## Auto.js Pro 9.x

Auto.js Pro 9 是大版本变化，核心变化是加入基于 Node.js 16.x / V8 的新引擎和第二代 API。

官方文档说明，Pro 9 的第二代 API 基于 Node.js，同时第一代 API 仍然保留可用。使用 Node.js 引擎时，可以使用更现代的 JavaScript、npm 生态，并继续和 Android / Java API 交互。

启用 Node.js 引擎的常见方式：

```js
"nodejs";

console.log(process.version);
```

也可以使用 `.node.js` 或 `.mjs` 文件后缀。

## 第一代 API 和第二代 API

| 项目 | 第一代 API | 第二代 API |
| --- | --- | --- |
| 引擎 | Rhino | Node.js / V8 |
| 语言能力 | ES5 和部分 ES6 | 更现代的 JavaScript |
| 使用方式 | 大量全局变量和函数 | 模块导入，异步更多 |
| 资料数量 | 老资料多 | 新资料相对少 |
| 上手难度 | 较低 | 需要理解 Promise、异步、模块 |
| npm 生态 | 不适合 | 可以使用 npm 包 |

第二代 API 中，很多能力需要先导入模块：

```js
"nodejs";

const app = require("app");
```

迁移旧脚本时，不要只做字符串替换。要重点检查同步/异步差异、模块导入方式、线程模型、UI 线程和文件路径。

## AutoX.js / AutoJs6

AutoX.js、AutoJs6 等属于社区分支或 Fork 生态，通常目标是继续维护 Auto.js 类能力，适配新 Android 版本，补充打包、插件、类型、工程化等功能。

使用前建议确认：

- 具体分支名称。
- 当前版本号。
- 文档地址。
- API 是否和 Auto.js 4.x、Pro 8、Pro 9 兼容。
- VS Code 插件是否匹配。
- 打包、权限、无障碍和截图能力是否满足项目。

不要把 AutoX.js 文档和 Auto.js Pro 9 文档混着看。它们可能长得像，但运行时和 API 细节并不一定一致。

## 怎么选择

| 需求 | 建议 |
| --- | --- |
| 跟旧教程学习 | Auto.js 4.x / Pro 8 / 第一代 API |
| 维护已有旧脚本 | 先确认脚本原始版本，不急着迁移 |
| 新项目且需要长期维护 | Auto.js Pro 9 / 第二代 API |
| 需要 npm 包 | Auto.js Pro 9 Node.js 引擎 |
| 需要 VS Code 调试 | Auto.js Pro 9.3+ 配套 Auto.js-Pro-Ext |
| 需要社区开源分支 | 单独评估 AutoX.js / AutoJs6 |

## 常见误区

### 看到 Auto.js 教程就直接复制

很多教程对应的是 Auto.js 4.x 或 Pro 8。复制到 Pro 9 的 Node.js 引擎里，可能因为全局函数、模块、异步行为不同而报错。

### 只看 App 名称，不看引擎

同一个 Auto.js Pro 9 里也可能运行第一代 API 或第二代 API。判断脚本运行方式，要看文件头、后缀、项目配置和创建项目时选择的 API 类型。

### 把 VS Code 插件当成运行环境

VS Code 插件只是连接、同步、运行、调试工具。真正执行脚本的是手机上的 Auto.js / Auto.js Pro。

## 官方入口

- [Auto.js 4.1.0 文档](https://qdgithub.com/docs/autojs/)
- [Auto.js Pro 8 第一代 API 文档](https://www.autojs.cc/docs/v8/)
- [Auto.js Pro 9 第二代 API 文档](https://www.autojs.cc/docs/zh/v9/)
- [Auto.js Pro 第一代 API 迁移到第二代 API](https://www.autojs.cc/docs/zh/v9/migrate-from-api-v1.html)
- [AutoX Community](https://github.com/autox-community)
