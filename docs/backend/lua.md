---
title: Lua 基础
description: Lua 语言基础、表、函数、模块、协程、OpenResty 场景和常见问题。
---

# Lua 基础

Lua 是轻量、可嵌入的脚本语言，常用于游戏脚本、配置扩展、嵌入式设备、<code>Nginx/OpenResty</code>、插件系统和业务规则脚本。

## 基础语法

变量默认是全局变量，建议使用 `local`。

```lua
local name = "Leroi"
local age = 18

print(name, age)
```

条件：

```lua
local score = 90

if score >= 90 then
  print("A")
elseif score >= 60 then
  print("pass")
else
  print("fail")
end
```

循环：

```lua
for i = 1, 5 do
  print(i)
end
```

## table

Lua 里最重要的数据结构是 table，可以当数组、字典、对象使用。

```lua
local user = {
  id = 1,
  name = "Leroi"
}

print(user.id)
print(user["name"])
```

数组习惯从 `1` 开始：

```lua
local list = { "a", "b", "c" }

for i, value in ipairs(list) do
  print(i, value)
end
```

## 函数和模块

```lua
local function add(a, b)
return a + b
end

print(add(1, 2))
```

模块示例：

```lua
local M = {}

function M.hello(name)
return "hello " .. name
end

return M
```

使用：

```lua
local demo = require("demo")
print(demo.hello("Leroi"))
```

## 常见使用场景

| 场景 | 说明 |
| --- | --- |
| OpenResty | 在 Nginx 内通过 Lua 写网关逻辑 |
| 游戏开发 | 热更新脚本、战斗逻辑、配置表达 |
| 嵌入式 | 轻量脚本能力 |
| Redis Lua | 保证一组 Redis 操作原子执行 |
| 插件系统 | 给主程序提供可扩展脚本能力 |

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 变量莫名被覆盖 | 忘记写 `local`，变成全局变量 | 默认使用 `local` |
| 数组下标不对 | Lua 数组习惯从 `1` 开始 | 避免套用 <code>JS/PHP</code> 的 `0` 起始习惯 |
| `attempt to index a nil value` | 访问了空变量或缺失字段 | 先判断 nil |
| 模块找不到 | `package.path` 不包含模块路径 | 检查 require 路径 |
| 字符串拼接报错 | 使用了 `+` 而不是 `..` | Lua 字符串拼接用 `..` |

## OpenResty 小例子

```nginx
location /hello {
  content_by_lua_block {
    ngx.say("hello lua")
  }
}
```

OpenResty 里要注意阻塞 IO、共享字典、worker 生命周期和 Nginx 阶段模型，不要把普通 Lua 脚本习惯直接搬进网关。

## 官方入口

- [Lua Documentation](https://www.lua.org/docs.html)
- [Lua 5.4 Reference Manual](https://www.lua.org/manual/5.4/)
