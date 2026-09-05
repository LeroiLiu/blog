---
title: Git 速查表
description: Git 常用命令速查表，整理初始化、暂存、提交、分支、diff、撤销、历史、合并、远程、配置和重要文件。
---

这是一份适合日常开发快速查命令的 Git 速查表，按高频开发场景重新整理。

![Git 分支合并速查图](/images/articles/git-cheat-sheet-branch-combine.svg)

## 开始使用

| 场景 | 命令 |
| --- | --- |
| 初始化新仓库 | `git init` |
| 克隆远程仓库 | `git clone <url>` |

```sh
git init
git clone git@github.com:owner/repo.git
```

## 暂存区

| 场景 | 命令 |
| --- | --- |
| 添加指定文件 | `git add <file>` |
| 添加当前目录下全部改动 | `git add .` |
| 交互式选择部分改动 | `git add -p` |
| 移动或重命名文件 | `git mv <old> <new>` |
| 删除文件并纳入版本记录 | `git rm <file>` |
| 从 Git 跟踪中移除，但保留本地文件 | `git rm --cached <file>` |
| 取消暂存指定文件 | `git reset <file>` |
| 取消全部暂存 | `git reset` |
| 查看当前状态 | `git status` |

常见组合：

```sh
git status
git add .
git reset README.md
git rm --cached .env
```

## 提交

| 场景 | 命令 |
| --- | --- |
| 打开编辑器写提交说明 | `git commit` |
| 直接写提交说明 | `git commit -m "message"` |
| 提交已跟踪文件的所有修改 | `git commit -am "message"` |
| 修改最近一次提交 | `git commit --amend` |

```sh
git add .
git commit -m "feat: add git cheat sheet"
```

`git commit -am` 不会自动添加新文件，只适合已经被 Git 跟踪过的文件。

## 分支切换

| 场景 | 推荐命令 | 兼容老写法 |
| --- | --- | --- |
| 切换分支 | `git switch <name>` | `git checkout <name>` |
| 创建并切换分支 | `git switch -c <name>` | `git checkout -b <name>` |
| 查看本地分支 | `git branch` |  |
| 按最近提交时间排序 | `git branch --sort=-committerdate` |  |
| 删除已合并分支 | `git branch -d <name>` |  |
| 强制删除分支 | `git branch -D <name>` |  |

```sh
git switch -c feature/login
git branch
git branch -d feature/login
```

## 查看差异

| 场景 | 命令 |
| --- | --- |
| 查看工作区和暂存区相对当前提交的所有差异 | `git diff HEAD` |
| 只看已经暂存的差异 | `git diff --staged` |
| 只看未暂存的差异 | `git diff` |
| 查看某个提交内容 | `git show <commit>` |
| 比较两个提交 | `git diff <commit> <commit>` |
| 查看某文件从某提交以来的变化 | `git diff <commit> <file>` |
| 查看差异摘要 | `git diff <commit> --stat` |

```sh
git diff
git diff --staged
git show HEAD
git diff HEAD~3 HEAD --stat
```

## 提交引用写法

很多命令里的 `<commit>` 可以替换成不同形式。

| 写法 | 含义 |
| --- | --- |
| `main` | 分支名 |
| `v1.0.0` | 标签名 |
| `3e887ab` | 提交 ID 的前几位 |
| `origin/main` | 远程分支 |
| `HEAD` | 当前提交 |
| `HEAD^` | 上一个提交 |
| `HEAD^^^` | 往前 3 个提交 |
| `HEAD~3` | 往前 3 个提交 |

## 撤销改动

| 场景 | 命令 |
| --- | --- |
| 丢弃某个文件未暂存改动 | `git restore <file>` |
| 同时丢弃某个文件暂存和未暂存改动 | `git restore --staged --worktree <file>` |
| 强制回到当前提交状态 | `git reset --hard` |
| 删除未跟踪文件 | `git clean` |
| 临时保存当前改动 | `git stash` |

```sh
git restore README.md
git restore --staged --worktree README.md
git stash
git stash pop
```

:::caution[注意]
`git reset --hard` 和 `git clean` 都可能删除本地改动。执行前先确认没有重要文件。
:::

## 修改历史

| 场景 | 命令 |
| --- | --- |
| 撤销最近一次提交，但保留工作区内容 | `git reset HEAD^` |
| 交互式整理最近几次提交 | `git rebase -i HEAD~6` |
| 查看分支引用记录 | `git reflog <branch>` |
| 回到某个历史位置 | `git reset --hard <commit>` |
| 修改最近一次提交说明或补文件 | `git commit --amend` |

```sh
git rebase -i HEAD~6
git reflog main
git reset --hard 3e887ab
```

交互式 rebase 中可以把需要合并到上一条提交的 `pick` 改成 `fixup`。

## 查历史

| 场景 | 命令 |
| --- | --- |
| 查看分支历史 | `git log main` |
| 图形化查看历史 | `git log --graph main` |
| 单行查看历史 | `git log --oneline` |
| 查看某文件相关提交 | `git log <file>` |
| 文件改名后继续追踪历史 | `git log --follow <file>` |
| 找到新增或删除某段文本的提交 | `git log -G <text>` |
| 查看每一行最后是谁改的 | `git blame <file>` |

```sh
git log --oneline --graph --decorate --all
git log --follow src/app.js
git blame src/app.js
```

## 合并分叉分支

### Rebase

```sh
git switch feature
git rebase main
```

适合让功能分支历史变直。注意它会改写功能分支提交，已经推给别人协作的分支要谨慎。

### Merge

```sh
git switch main
git merge feature
```

适合保留真实分叉和合并历史。

### Squash merge

```sh
git switch main
git merge --squash feature
git commit
```

适合把功能分支的一堆临时提交压成一个业务提交。

### Fast-forward

```sh
git switch main
git merge feature
```

如果 `main` 没有新提交，Git 可以直接把 `main` 指针移动到 `feature` 顶端，不生成新的合并提交。

### Cherry-pick

```sh
git cherry-pick <commit>
```

适合只把某一个提交复制到当前分支。

## 恢复旧文件

| 场景 | 命令 |
| --- | --- |
| 从某个提交恢复某文件 | `git restore <file> --source <commit>` |
| 老写法 | `git checkout <commit> <file>` |

```sh
git restore package.json --source HEAD~3
```

## 远程仓库

| 场景 | 命令 |
| --- | --- |
| 添加远程仓库 | `git remote add <name> <url>` |
| 查看远程仓库 | `git remote -v` |
| 修改远程地址 | `git remote set-url <name> <url>` |

```sh
git remote add origin git@github.com:owner/repo.git
git remote -v
```

## 推送

| 场景 | 命令 |
| --- | --- |
| 推送 `main` 到 `origin` | `git push origin main` |
| 推送当前分支到已关联远程分支 | `git push` |
| 首次推送新分支并建立关联 | `git push -u origin <name>` |
| 更安全的强制推送 | `git push --force-with-lease` |
| 推送标签 | `git push --tags` |

```sh
git push -u origin feature/login
git push --force-with-lease
```

`--force-with-lease` 会比 `--force` 更安全，能减少覆盖别人提交的风险。

## 拉取

| 场景 | 命令 |
| --- | --- |
| 只获取远程变化，不改本地分支 | `git fetch origin main` |
| 拉取后 rebase 当前分支 | `git pull --rebase` |
| 拉取后 merge 到当前分支 | `git pull origin main` |
| 按当前分支关联关系拉取 | `git pull` |

```sh
git fetch origin main
git pull --rebase
git pull
```

## 配置

| 场景 | 命令 |
| --- | --- |
| 设置用户名 | `git config user.name "Your Name"` |
| 设置全局配置 | `git config --global ...` |
| 添加别名 | `git config alias.st status` |
| 查看全部配置项手册 | `man git-config` |

常用配置：

```sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global alias.st status
git config --global --list
```

## 重要文件

| 文件 | 说明 |
| --- | --- |
| `.git/config` | 当前仓库的本地 Git 配置 |
| `~/.gitconfig` | 当前用户的全局 Git 配置 |
| `.gitignore` | 忽略文件列表 |
