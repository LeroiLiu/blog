---
title: Git 常见操作
description: Git 用户配置、初始化仓库、远程仓库、分支、提交、推送、标签和暂存区常用命令。
---

# Git 常见操作

本文整理 Git 日常使用频率最高的命令，包含用户配置、仓库初始化、远程地址、分支提交和常见协作命令。

## 配置用户信息

```sh
git config --global user.name "LeroiLiu"
git config --global user.email "your-email@example.com"
```

查看当前配置：

```sh
git config --global --list
git config --local --list
```

如果某个项目需要单独使用不同身份，可以在项目目录里去掉 `--global`：

```sh
git config user.name "LeroiLiu"
git config user.email "your-email@example.com"
```

## 创建新仓库

```sh
mkdir project-name
cd project-name
git init
touch README.md
git add README.md
git commit -m "first commit"
git remote add origin git@gitee.com:leroiliu/project-name.git
git push -u origin master
```

如果仓库名就是 `qq`，完整示例可以写成：

```sh
mkdir qq
cd qq
git init
touch README.md
git add README.md
git commit -m "first commit"
git remote add origin git@gitee.com:leroiliu/qq.git
git push -u origin master
```

如果默认分支使用 `main`，可以这样设置：

```sh
git branch -M main
git push -u origin main
```

## 关联已有仓库

已有本地项目时，可以直接添加远程地址：

```sh
cd existing_git_repo
git remote add origin git@gitee.com:leroiliu/project-name.git
git push -u origin master
```

示例：

```sh
cd existing_git_repo
git remote add origin git@gitee.com:leroiliu/qq.git
git push -u origin master
```

如果远程地址填错了，可以修改：

```sh
git remote set-url origin git@gitee.com:leroiliu/project-name.git
git remote -v
```

示例：

```sh
git remote set-url origin git@gitee.com:leroiliu/qq.git
```

## 分支操作

创建并切换分支：

```sh
git switch -c feature-name
```

老版本 Git 也可以使用：

```sh
git branch feature-name
git checkout feature-name
```

简单示例：

```sh
git branch branch
git checkout branch
git add .
git commit -m branch
git push origin branch
```

提交并推送分支：

```sh
git add .
git commit -m "feat: add feature name"
git push -u origin feature-name
```

查看分支：

```sh
git branch
git branch -a
```

删除本地分支：

```sh
git branch -d feature-name
```

删除远程分支：

```sh
git push origin --delete feature-name
```

## 查看改动

```sh
git status
git diff
git diff --staged
git log --oneline --graph --decorate --all
```

常用判断：

| 命令 | 用途 |
| --- | --- |
| `git status` | 看当前改了哪些文件 |
| `git diff` | 看工作区还没有暂存的改动 |
| `git diff --staged` | 看已经 `git add` 的改动 |
| `git log --oneline` | 快速查看提交历史 |

## 拉取和推送

```sh
git fetch origin
git pull
git push
```

第一次推送新分支时建议加 `-u`，后续就可以直接 `git push`：

```sh
git push -u origin feature-name
```

## 暂存临时改动

临时切换分支但当前改动还不想提交时，可以使用 `stash`：

```sh
git stash push -m "work in progress"
git stash list
git stash pop
```

如果只是想恢复最新一次暂存但不删除记录，可以使用：

```sh
git stash apply
```

## 标签

创建版本标签：

```sh
git tag v1.0.0
git push origin v1.0.0
```

查看标签：

```sh
git tag
```

删除本地和远程标签：

```sh
git tag -d v1.0.0
git push origin --delete v1.0.0
```
