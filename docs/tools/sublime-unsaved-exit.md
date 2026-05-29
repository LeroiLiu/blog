---
title: Sublime 批量修改文件不保存退出问题
description: macOS 下 Sublime Text 因批量修改文件导致无法正常退出或反复恢复未保存状态的处理办法。
---

# Sublime 批量修改文件不保存退出问题

## 问题现象

在 macOS 上使用 Sublime Text 批量修改文件后，可能出现不保存就退出不了，或重新打开后仍恢复大量未保存文件的情况。

## 处理命令

```sh
rm -rf "/Users/leroi/Library/Application Support/Sublime Text/Local"
```

这个目录通常保存 Sublime Text 的本地会话状态。删除后，Sublime Text 会丢弃当前恢复会话。

## 使用前注意

执行前要确认：

- 重要文件已经保存。
- 未保存的临时内容不再需要。
- Sublime Text 已经退出。

更稳妥的方式是先把目录改名备份：

```sh
mv "/Users/leroi/Library/Application Support/Sublime Text/Local" "/Users/leroi/Library/Application Support/Sublime Text/Local.backup"
```

确认 Sublime Text 可以正常打开后，再决定是否删除备份。
