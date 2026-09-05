---
title: Git 忽略文件权限变化
description: 解决 Git 因文件权限变化导致 status 一直显示 modified 的问题。
---

有时只是文件权限变化，`git status` 却一直显示文件被修改。常见场景包括 macOS、Linux、Windows 之间同步代码，或文件系统权限被工具批量改动。

## 解决命令

只对当前仓库生效：

```sh
git config core.filemode false
```

如果希望全局生效：

```sh
git config --global core.filemode false
```

查看当前配置：

```sh
git config --get core.filemode
git config --global --get core.filemode
```

## 什么时候适合使用

适合：

- 代码内容没有变化，只是可执行权限反复变化。
- 团队不依赖 Git 追踪文件执行权限。
- 当前仓库主要是普通业务代码、文档或前端项目。

不适合：

- 仓库里有脚本文件，并且需要依赖 `chmod +x` 这类权限变化。
- 团队需要用 Git 精确追踪执行权限。

如果只有某一个脚本需要保留可执行权限，可以单独处理脚本权限，不建议简单全局忽略所有仓库的文件权限变化。
