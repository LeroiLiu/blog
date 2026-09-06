---
title: Go 常见问题
description: Go 开发中 Go Module、环境变量、交叉编译、错误处理、并发、部署和性能相关常见问题。
---

## go mod 下载依赖失败怎么办

先查看环境：

```sh
go env GOPROXY
go env GOSUMDB
```

常用设置：

```sh
go env -w GOPROXY=https://goproxy.cn,direct
```

重新整理依赖：

```sh
go mod tidy
```

## go.sum 冲突怎么办

`go.sum` 记录依赖校验信息，冲突时不要随便删整段。建议：

1. 先合并 `go.mod`。
2. 运行 `go mod tidy`。
3. 检查 `go.mod` 和 `go.sum` 的最终变化。
4. 确认项目能正常测试和启动。

## 如何交叉编译

编译 Linux AMD64：

```sh
GOOS=linux GOARCH=amd64 go build -o app
```

编译 macOS ARM64：

```sh
GOOS=darwin GOARCH=arm64 go build -o app
```

编译 Windows：

```sh
GOOS=windows GOARCH=amd64 go build -o app.exe
```

如果项目依赖 CGO，交叉编译会复杂很多，需要额外配置 C 编译工具链。

## panic 和 error 怎么区分

普通业务错误应该返回 `error`，例如参数错误、数据库错误、外部接口失败。

`panic` 适合不可恢复的程序错误，不应该用来做正常业务分支。

```go
if err != nil {
    return fmt.Errorf("create user: %w", err)
}
```

## goroutine 泄漏怎么排查

常见原因：

- channel 没有关闭。
- goroutine 一直阻塞等待。
- context 没有取消。
- 定时器或 ticker 没有停止。
- 请求结束后后台任务还在跑。

建议所有可能长期运行的任务都传入 `context.Context`：

```go
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            // do work
        }
    }
}
```

## map 并发读写报错怎么办

普通 `map` 不是并发安全的。并发读写时可以使用：

- `sync.RWMutex` 保护 map。
- `sync.Map`。
- 通过 channel 串行化写入。

示例：

```go
var mu sync.RWMutex
data := map[string]string{}

mu.Lock()
data["key"] = "value"
mu.Unlock()
```

## 部署 Go 服务要注意什么

建议检查：

- 配置不要写死在代码里。
- 日志输出到文件或标准输出。
- 服务进程由 systemd、Docker 或进程管理工具托管。
- 健康检查接口可用。
- 监听地址和端口明确。
- 退出时能优雅关闭 HTTP 服务。

## 内存或 CPU 高怎么排查

可以启用 pprof：

```go
import _ "net/http/pprof"
```

生产环境要加访问限制，不要直接暴露到公网。
