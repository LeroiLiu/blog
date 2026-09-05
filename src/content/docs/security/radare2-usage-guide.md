---
title: radare2 使用指南：命令行逆向入门
description: radare2 逆向分析入门，覆盖文件打开、自动分析、函数列表、字符串、交叉引用、调试、patch、r2pipe 和常见问题。
---

radare2 是一个命令行逆向分析框架。它轻、快、适合 SSH 环境，也适合批处理。缺点是命令很多，刚开始容易记不住。

学习 radare2 的关键不是背全命令，而是先掌握一条稳定路线：

```text
打开文件
  -> 自动分析
  -> 看入口
  -> 看函数
  -> 看字符串
  -> 看交叉引用
  -> 反汇编 / 伪代码
  -> 调试或 patch
```

## 启动方式

打开文件：

```sh
r2 sample.bin
```

打开并自动分析：

```sh
r2 -A sample.bin
```

以写模式打开：

```sh
r2 -w sample.bin
```

常用启动参数：

| 参数 | 说明 |
| --- | --- |
| `-A` | 打开后自动分析 |
| `-w` | 写模式，允许 patch |
| `-d` | 调试模式 |
| `-q` | 安静输出，适合脚本 |
| `-c` | 启动后执行命令 |

示例：

```sh
r2 -A -q -c "afl" sample.bin
```

## 基础命令

| 命令 | 用途 |
| --- | --- |
| `?` | 帮助 |
| `q` | 退出 |
| `i` | 文件信息 |
| `ii` | 导入函数 |
| `iE` | 入口点 |
| `izz` | 字符串 |
| `aaa` | 深度自动分析 |
| `afl` | 函数列表 |
| `s addr` | seek 到地址 |
| `pdf` | 打印当前函数反汇编 |
| `pdc` | 打印伪 C 风格代码 |
| `VV` | 进入可视化图模式 |
| `axt addr` | 查看谁引用了地址 |
| `axf addr` | 查看当前地址引用了谁 |

命令后加 `?` 看帮助：

```text
af?
pd?
ax?
```

## 自动分析

打开文件后先运行：

```text
aaa
```

常见分析命令：

| 命令 | 说明 |
| --- | --- |
| `aa` | 基础分析 |
| `aaa` | 更完整分析 |
| `aaaa` | 更激进分析 |
| `af` | 在当前地址创建函数 |
| `afl` | 列出函数 |
| `afi` | 当前函数信息 |
| `afv` | 当前函数变量 |

建议：

- 小样本用 `aaa`。
- 大固件先用 `aa`，避免等太久。
- 函数识别错时，手动 `s 地址` 后 `af`。

## 文件信息

进入 r2 后：

```text
i
```

常用信息命令：

```text
ij      # JSON 格式文件信息
ie      # entrypoint
iE      # entrypoints
ii      # imports
iij     # imports JSON
iS      # sections
is      # symbols
```

命令行直接导出 JSON：

```sh
r2 -A -q -c "iij" -c "q" sample.bin
```

## 字符串与引用

列出字符串：

```text
izz
```

搜索字符串：

```text
izz~token
izz~http
izz~error
```

跳到字符串地址：

```text
s 0x00405000
```

查引用：

```text
axt 0x00405000
```

典型流程：

```text
izz~password
s 0x00405000
axt
s 0x00401234
pdf
```

含义：

1. 找到 `password` 字符串。
2. 查看谁引用这个字符串。
3. 跳到引用函数。
4. 打印函数反汇编。

## 函数列表和反汇编

列函数：

```text
afl
```

过滤函数：

```text
afl~main
afl~sym.
afl~imp.
```

跳转并打印函数：

```text
s main
pdf
```

打印指定行数反汇编：

```text
pd 20
```

打印伪代码：

```text
pdc
```

如果安装了反编译插件，可能有：

```text
pdg
```

不同环境插件不同，不能依赖所有机器都有 `pdg`。

## 重命名和注释

重命名函数：

```text
afn check_token 0x00401234
```

当前位置重命名：

```text
afn check_token
```

添加注释：

```text
CC 验证 token 为空时返回 -1
```

查看注释：

```text
CC.
```

删除注释：

```text
CC-
```

命名建议和 Ghidra 一样：先用 `maybe_`，有证据再改精确。

## 可视化模式

进入图模式：

```text
VV
```

常用按键：

| 按键 | 用途 |
| --- | --- |
| `p` | 切换视图 |
| `g` | 跳转 |
| `x` | 查看引用 |
| `;` | 注释 |
| `q` | 退出当前视图 |
| `Tab` | 切换基本块 |

可视化模式适合看条件分支和控制流。

## 搜索

搜索字符串：

```text
/ token
```

搜索十六进制：

```text
/x 89504e47
```

搜索指令：

```text
/a mov eax
```

搜索结果列表：

```text
f~hit
```

## 调试模式

启动调试：

```sh
r2 -d ./sample
```

常用调试命令：

| 命令 | 用途 |
| --- | --- |
| `ood` | 重新打开并运行 |
| `db addr` | 下断点 |
| `db- addr` | 删除断点 |
| `dc` | 继续运行 |
| `ds` | 单步进入 |
| `dso` | 单步越过 |
| `dr` | 寄存器 |
| `px 64 @ rsp` | 查看栈内存 |
| `dm` | 内存映射 |

例子：

```text
aaa
afl~main
s main
db main
dc
dr
pdf
```

查看函数参数要结合架构调用约定：

| 架构 | 常见参数寄存器 |
| --- | --- |
| x86_64 Linux | `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9` |
| x86_64 Windows | `rcx`, `rdx`, `r8`, `r9` |
| ARM64 | `x0` - `x7` |
| x86 32 位 | 多数走栈 |

## Patch

写模式打开：

```sh
r2 -w sample.bin
```

把当前位置 patch 成 NOP：

```text
wa nop
```

写汇编：

```text
wa jmp 0x401000
```

写 hex：

```text
wx 90909090
```

保存前先备份原文件。Patch 学习时可用，实际发布涉及签名、校验、完整性保护等问题。

## r2pipe 自动化

安装：

```sh
python3 -m pip install r2pipe
```

列出函数：

```python
import r2pipe

r2 = r2pipe.open("sample.bin")
r2.cmd("aaa")

funcs = r2.cmdj("aflj")
for f in funcs:
    print(hex(f["offset"]), f["name"], f.get("size"))

r2.quit()
```

导出字符串和引用：

```python
import r2pipe

r2 = r2pipe.open("sample.bin")
r2.cmd("aaa")

for s in r2.cmdj("izzj"):
    text = s.get("string", "")
    if "token" not in text.lower():
        continue

    addr = s["vaddr"]
    print("string", hex(addr), text)

    refs = r2.cmdj(f"axtj @ {addr}") or []
    for ref in refs:
        print("  xref", hex(ref.get("from", 0)))

r2.quit()
```

批量处理目录：

```python
from pathlib import Path
import r2pipe

for path in Path("samples").glob("*"):
    r2 = r2pipe.open(str(path), flags=["-2"])
    r2.cmd("aaa")
    info = r2.cmdj("ij")
    print(path.name, info["bin"].get("arch"), info["bin"].get("bits"))
    r2.quit()
```

## 小案例：从错误字符串找校验逻辑

目标：找到 `invalid license` 的判断位置。

命令：

```text
r2 -A sample
izz~invalid
s 0x00405080
axt
s 0x004012a0
pdf
```

分析：

```text
字符串 invalid license
  -> 被函数 fcn.004012a0 引用
  -> 上方调用 check_license
  -> 返回 0 时打印错误
```

重命名：

```text
afn show_invalid_license 0x004012a0
afn check_license 0x00401180
```

记录：

```md
- `check_license` 返回值影响 `invalid license` 分支。
- 字符串引用位置：`0x004012a0`。
- 需要动态验证输入参数。
```

## 完整案例：分析一个口令校验小程序

假设有一个授权练习样本 `checkpass`：

```sh
./checkpass 123456
```

输出：

```text
wrong password
```

目标：找出口令校验函数在哪里，以及它大概怎么判断。

### 1. 基础识别

```sh
file checkpass
shasum -a 256 checkpass
strings checkpass | grep -i password
```

可能输出：

```text
wrong password
right password
```

### 2. 打开并自动分析

```sh
r2 -A checkpass
```

进入后：

```text
iE
afl
afl~main
s main
pdf
```

如果没有 `main` 符号：

```text
s entry0
pdf
```

再顺着 `__libc_start_main` 的参数找真正的 main。

### 3. 从字符串定位分支

```text
izz~password
```

假设得到：

```text
0x00002020 ascii wrong password
0x00002031 ascii right password
```

查看引用：

```text
axt 0x00002020
axt 0x00002031
```

如果两者都指向 `main`，说明判断分支就在 main 附近。

### 4. 看反汇编

```text
s main
pdf
```

可能看到：

```asm
call sym.imp.strcmp
test eax, eax
jne 0x00001214
lea rdi, str.right_password
call sym.imp.puts
jmp 0x00001220
lea rdi, str.wrong_password
call sym.imp.puts
```

能得到：

- 程序用 `strcmp` 比较。
- `eax == 0` 进入成功分支。
- 失败分支打印 `wrong password`。

### 5. 验证比较参数

x86_64 Linux 下 `strcmp(a, b)` 前两个参数通常在 `rdi`、`rsi`。

调试：

```sh
r2 -d ./checkpass test
```

下断：

```text
aaa
db sym.imp.strcmp
dc
```

断住后：

```text
dr rdi
dr rsi
ps @ rdi
ps @ rsi
```

预期类似：

```text
test
demo_2024
```

### 6. 重命名和注释

如果校验逻辑在 `fcn.00001180`：

```text
afn check_password 0x00001180
s 0x00001180
CC 比较用户输入和内置口令，返回 strcmp 结果
pdf
```

### 7. r2pipe 批量扫线索

```python
from pathlib import Path
import r2pipe

for sample in Path("samples").glob("*"):
    r2 = r2pipe.open(str(sample), flags=["-2"])
    r2.cmd("aaa")

    hits = []
    for item in r2.cmdj("izzj") or []:
        text = item.get("string", "")
        if "password" in text.lower() or "token" in text.lower():
            hits.append((item.get("vaddr"), text))

    if hits:
        print(sample.name)
        for addr, text in hits:
            print(" ", hex(addr), text)

    r2.quit()
```

### 8. 复盘记录

```md
## checkpass

- `wrong password` 和 `right password` 都被 main 引用。
- main 调用 `strcmp`。
- 调试时 `rdi = 用户输入`，`rsi = 内置比较值`。
- `strcmp == 0` 进入成功分支。
```

这个案例的核心是：`izz` 找提示字符串，`axt` 找引用，`pdf` 看分支，调试模式用寄存器验证真实参数。

## 常见问题

### 命令太多记不住

记住这些就够入门：

```text
aaa
afl
izz
axt
s
pdf
pdc
VV
q
```

再记住 `?`：

```text
pd?
af?
```

### `afl` 没有 main

可能符号被去掉了。可以看入口：

```text
iE
s entry0
pdf
```

然后顺着启动逻辑找真正业务入口。

### 反汇编不对

可能架构识别错、ARM/Thumb 模式不对、数据被当代码。先看：

```text
ij
iS
```

必要时手动切换或指定架构打开。

### `pdc` 很难看

`pdc` 不是完整反编译器，只是伪 C 风格输出。复杂函数建议用 Ghidra 看伪代码，radare2 用来快速定位和批处理。

### 调试时断不住

检查：

- 是否 PIE，地址是否要加基址。
- 断点地址是否在可执行映射里。
- 程序是否 fork 出子进程。
- 是否还没运行到目标分支。

查看映射：

```text
dm
```

## 分析记录模板

```md
## 样本

- 文件：
- SHA256：
- 架构：

## radare2 命令

```text
r2 -A sample
izz~keyword
axt 0x...
pdf @ 0x...
```

## 关键函数

| 名称 | 地址 | 证据 |
| --- | --- | --- |

## 结论

-
```

## 案例二：分析一个菜单程序的隐藏命令

### 样本代码

```c
#include <stdio.h>
#include <string.h>

void show_help() {
    puts("1. status");
    puts("2. reboot");
}

void debug_shell() {
    puts("debug mode enabled");
}

int main() {
    char cmd[32];
    show_help();
    fgets(cmd, sizeof(cmd), stdin);

    if (strncmp(cmd, "status", 6) == 0) {
        puts("ok");
    } else if (strncmp(cmd, "reboot", 6) == 0) {
        puts("rebooting");
    } else if (strncmp(cmd, "debug-8848", 10) == 0) {
        debug_shell();
    } else {
        puts("unknown");
    }
}
```

编译：

```bash
gcc -O0 menu.c -o menu
strip menu
```

### 1. 字符串找入口

```text
r2 -A ./menu
izz~debug
```

输出类似：

```text
0x0000202a 10 9 .rodata ascii debug-8848
0x00002035 19 18 .rodata ascii debug mode enabled
```

### 2. 查字符串引用

```text
axt @ 0x0000202a
```

得到：

```text
main 0x000011f4 [DATA:r--] lea rax, str.debug_8848
```

跳过去：

```text
s 0x000011f4
pd 30
```

你会看到类似：

```text
lea rax, [str.debug_8848]
mov edx, 0xa
mov rsi, rax
lea rax, [var_30h]
mov rdi, rax
call sym.imp.strncmp
test eax, eax
jne 0x1220
call fcn.00001189
```

### 3. 给函数命名

```text
afn check_menu_command @ main
afn debug_shell @ 0x00001189
```

再看函数：

```text
pdf @ main
pdf @ debug_shell
```

### 4. 复现实验

退出 r2：

```text
q
```

运行：

```bash
printf 'debug-8848\n' | ./menu
```

输出：

```text
1. status
2. reboot
debug mode enabled
```

### 5. 记录结论

```md
- 隐藏命令：`debug-8848`
- 判断方式：`strncmp(cmd, "debug-8848", 10)`
- 触发函数：`debug_shell`
- 证据：字符串交叉引用指向 `main` 内比较分支
```

这个案例适合练 radare2 的三件事：`izz` 找字符串、`axt` 找引用、`pdf` 看分支。

## 案例三：用 radare2 调试确认 `strcmp` 参数

### 目标

样本运行时会比较输入密码，但静态看不清传给 `strcmp` 的两个参数。用调试模式在 `strcmp` 断住，直接看寄存器。

### 1. 启动调试

```text
r2 -d ./checkpass
aaa
```

### 2. 找 `strcmp` PLT

```text
is~strcmp
```

可能输出：

```text
5 0x00000000 0x00001040 GLOBAL FUNC strcmp
```

对导入函数下断点：

```text
db sym.imp.strcmp
dc
```

程序等待输入时，输入：

```text
hello
```

### 3. x86_64 查看参数

Linux x86_64 下，前两个参数通常在 `rdi`、`rsi`：

```text
dr rdi
dr rsi
psz @ rdi
psz @ rsi
```

可能得到：

```text
hello
letmein-2026
```

### 4. ARM64 查看参数

Android ARM64 下，前两个参数通常在 `x0`、`x1`：

```text
dr x0
dr x1
psz @ x0
psz @ x1
```

### 5. 继续跑并观察返回值

```text
dso
dr rax
```

`strcmp` 返回 0 表示相等。记录：

```md
- 断点：`sym.imp.strcmp`
- 参数 1：用户输入
- 参数 2：`letmein-2026`
- 返回值：非 0，进入失败分支
```

## 案例四：r2pipe 批量导出字符串引用

### 目标

批量查所有包含 `token`、`auth`、`secret` 的字符串，并输出引用函数，适合对大量小样本快速扫入口。

### Python 脚本

```python
import json
import sys
import r2pipe

if len(sys.argv) != 2:
    raise SystemExit("usage: python3 scan_refs.py sample")

r2 = r2pipe.open(sys.argv[1])
r2.cmd("aaa")

strings = json.loads(r2.cmd("izzj"))
for item in strings:
    text = item.get("string", "")
    if not any(key in text.lower() for key in ["token", "auth", "secret"]):
        continue

    vaddr = item.get("vaddr")
    refs = json.loads(r2.cmd(f"axtj @ {vaddr}"))
    print(f"STRING {hex(vaddr)} {text}")

    for ref in refs:
        at = ref.get("from")
        fn = r2.cmdj(f"afij @ {at}")
        name = fn[0]["name"] if fn else "<unknown>"
        print(f"  ref {hex(at)} {name}")
```

运行：

```bash
python3 scan_refs.py ./demo
```

输出：

```text
STRING 0x402018 invalid token
  ref 0x4011aa main
STRING 0x402050 auth failed
  ref 0x401250 verify_request
```

这个脚本可以和 Ghidra 分工：radare2 先批量扫，Ghidra 再打开高价值函数精读。
