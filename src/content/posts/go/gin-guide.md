---
title: Gin 使用指南
description: Gin 路由、中间件、参数绑定、统一响应、错误处理和项目结构建议。
---

这份文档整理 Gin 项目中最常见的写法，适合新建 API 服务或统一团队代码风格。

## 基础服务

```go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "pong",
        })
    })

    r.Run(":8080")
}
```

## 路由分组

```go
api := r.Group("/api")

api.GET("/users", listUsers)
api.POST("/users", createUser)
api.GET("/users/:id", getUser)
```

## 参数绑定

```go
type CreateUserRequest struct {
  Name string `json:"name" binding:"required"`
}

func createUser(c *gin.Context) {
  var req CreateUserRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"message": err.Error()})
    return
  }

  c.JSON(200, gin.H{"name": req.Name})
}
```

路径参数：

```go
id := c.Param("id")
```

查询参数：

```go
page := c.DefaultQuery("page", "1")
```

## 中间件

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(401, gin.H{"message": "unauthorized"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

## 统一响应

```go
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}
```

## 项目结构建议

```txt
cmd/
api/
main.go
internal/
handler/
middleware/
service/
repository/
model/
pkg/
response/
logger/
```

简单项目可以少分层，但要保持路由、业务逻辑、数据库访问职责清楚。
