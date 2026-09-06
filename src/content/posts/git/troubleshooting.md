---
title: Git 常见问题
description: Git 冲突、认证失败、远程地址错误、误提交、换行符、分支同步和推送失败排查。
---

这页更适合排查问题。命令使用前先确认当前分支、远程地址和工作区状态。

## 一直提示没有权限

常见原因：

- 没有配置 SSH key。
- 当前 SSH key 没有添加到 GitHub、Gitee 或 GitLab。
- 远程地址写成了没有权限的仓库。
- 使用了 HTTPS 地址，但账号或 Token 失效。

排查命令：

```sh
git remote -v
ssh -T git@github.com
ssh -T git@gitee.com
```

如果项目应该使用 SSH，可以把远程地址改为 SSH 格式：

```sh
git remote set-url origin git@github.com:owner/repo.git
```

## 推送时提示 upstream 不存在

新分支第一次推送需要建立本地分支和远程分支的关联：

```sh
git push -u origin feature-name
```

后续同一个分支可以直接：

```sh
git push
```

## 合并冲突怎么办

先查看冲突文件：

```sh
git status
```

打开冲突文件后，Git 会用标记隔开双方改动：

```txt
<<<<<<< HEAD
当前分支内容
=======
合入分支内容
>>>>>>> feature-name
```

处理方式：

1. 理解两边改动分别解决什么问题。
2. 编辑成最终需要保留的内容。
3. 删除冲突标记。
4. 重新暂存并提交。

```sh
git add path/to/file
git commit
```

## 提交错文件怎么办

如果还没有提交，可以取消暂存：

```sh
git restore --staged path/to/file
```

如果文件内容也不想保留，可以恢复工作区文件：

```sh
git restore path/to/file
```

如果已经提交，但还没有推送，可以重新整理最近一次提交：

```sh
git reset --soft HEAD~1
```

如果已经推送到共享分支，建议新增一个修复提交，不要随意改公共历史。

## 本地分支落后远程怎么办

先拉取远程信息：

```sh
git fetch origin
```

查看差异：

```sh
git log --oneline HEAD..origin/main
git log --oneline origin/main..HEAD
```

确认后再合并或变基：

```sh
git pull
```

团队协作中，如果不确定该用 merge 还是 rebase，优先使用团队约定。

## 文件换行符总是变化

跨 Windows、macOS、Linux 协作时，换行符可能造成大量无意义差异。

可以在仓库中增加 `.gitattributes`：

```text
* text=auto
```

也可以按项目类型细分：

```text
*.sh text eol=lf
*.bat text eol=crlf
```

## 文件权限总是变化

如果 `git status` 反复出现文件权限变化，可以查看：[忽略文件权限变化](/git/filemode)。
