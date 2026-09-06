---
title: SSH 密钥生成与配置常见问题
description: SSH 密钥生成、id_rsa、id_rsa.pub、authorized_keys、GitHub/Gitee 配置、免密登录、权限问题和常见报错整理。
---

SSH 密钥常用于服务器免密登录、Git 仓库拉取、自动部署、CI/CD 和内网机器管理。本文按常见 Git SSH 使用流程整理，默认使用大家更熟悉的 `id_rsa` 和 `id_rsa.pub`。

## 先检查是否已有密钥

SSH 密钥默认保存在当前用户的 `~/.ssh` 目录下。先进入目录看看是否已经存在密钥：

```sh
cd ~/.ssh
ls
```

重点看有没有成对出现的文件：

- `id_rsa`
- `id_rsa.pub`
- `id_dsa`
- `id_dsa.pub`

带 `.pub` 的是公钥，可以发给 Git 服务器、GitHub、Gitee、GitLab 或服务器管理员；不带 `.pub` 的是私钥，不能发给别人。

如果没有 `~/.ssh` 目录，或者没有 `id_rsa`、`id_rsa.pub` 这一对文件，再生成新的密钥。

## 生成 SSH 公钥

常见生成方式如下：

```sh
ssh-keygen -o
```

执行后会出现类似提示：

```txt
Generating public/private rsa key pair.
Enter file in which to save the key (/home/you/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
```

这里可以一路回车：

- 保存位置默认是 `~/.ssh/id_rsa`。
- 公钥会保存到 `~/.ssh/id_rsa.pub`。
- 如果不想每次使用密钥都输入口令，`passphrase` 可以留空。

如果你希望给 GitHub、公司服务器、部署脚本分别使用不同密钥，也可以指定文件名：

```sh
ssh-keygen -o -f ~/.ssh/id_rsa_deploy
```

这样会生成：

```txt
~/.ssh/id_rsa_deploy
~/.ssh/id_rsa_deploy.pub
```

## 查看公钥

```sh
cat ~/.ssh/id_rsa.pub
```

把 `.pub` 文件内容添加到服务器的 `~/.ssh/authorized_keys`，或添加到 GitHub、Gitee、GitLab 的 SSH Keys。

## 复制公钥到服务器

```sh
ssh-copy-id -i ~/.ssh/id_rsa.pub root@server.example.com
```

如果没有 `ssh-copy-id`：

```sh
cat ~/.ssh/id_rsa.pub | ssh root@server.example.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

## 服务器权限

SSH 对权限很敏感。服务器上建议：

```sh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

客户端私钥：

```sh
chmod 600 ~/.ssh/id_rsa
```

## 多密钥配置

编辑 `~/.ssh/config`：

```ssh-config
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github
  IdentitiesOnly yes

Host company-server
  HostName 192.168.1.10
  User root
  Port 22
  IdentityFile ~/.ssh/id_rsa_deploy
  IdentitiesOnly yes
```

连接：

```sh
ssh company-server
```

## 测试 Git SSH

```sh
ssh -T git@github.com
```

如果是 Gitee：

```sh
ssh -T git@gitee.com
```

## 常见问题

### Permission denied publickey

排查：

```sh
ssh -vvv root@server.example.com
```

重点看：

- 客户端是否尝试了正确的私钥。
- 服务端 `authorized_keys` 是否有对应公钥。
- 用户名是否正确。
- 服务器是否禁用了公钥登录。
- 文件权限是否过宽。

服务端配置通常在：

```txt
/etc/ssh/sshd_config
```

常见配置：

```ssh-config
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
```

修改后重启：

```sh
systemctl restart sshd
```

### WARNING REMOTE HOST IDENTIFICATION HAS CHANGED

说明本地记录的服务器指纹和当前服务器不一致。可能是服务器重装，也可能有安全风险。

确认服务器可信后删除旧记录：

```sh
ssh-keygen -R server.example.com
```

重新连接并确认指纹。

### Bad permissions

常见原因是私钥权限过宽：

```sh
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh
```

### Git 使用了错误密钥

使用 `~/.ssh/config` 指定：

```ssh-config
Host github-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_work
  IdentitiesOnly yes
```

仓库地址改成：

```sh
git remote set-url origin git@github-work:owner/repo.git
```

## 安全建议

- 私钥不要发送给任何人。
- 不要把私钥提交到 Git。
- 重要服务器关闭密码登录。
- 离职、换设备、泄露风险出现时及时删除旧公钥。
- CI/CD 用 deploy key，不要直接用个人主密钥。
