---
title: Ghidra 使用指南：从导入样本到脚本分析
description: Ghidra 逆向分析入门，覆盖项目创建、样本导入、自动分析、反编译、函数重命名、交叉引用、结构体、脚本和常见问题。
---

# Ghidra 使用指南：从导入样本到脚本分析

Ghidra 是 NSA 开源的逆向分析平台，适合做静态分析、反汇编、反编译、交叉引用、结构恢复、符号整理和脚本自动化。

如果把动态调试看成“运行时抓现场”，Ghidra 更像“把程序摊开，慢慢做地图”。它不要求目标程序正在运行，适合先把函数、字符串、导入表和调用链梳理清楚。

## 适合场景

| 场景 | 说明 |
| --- | --- |
| 反编译 C/C++ 程序 | 查看接近 C 语言的伪代码 |
| 分析 Windows / Linux / Android Native | PE、ELF、Mach-O、so、dll 都常用 |
| 固件分析 | 配合 binwalk、strings、交叉引用理解固件逻辑 |
| 查找关键字符串 | 从日志、错误提示、URL、命令字反推函数 |
| 恢复结构体 | 根据字段访问恢复数据结构 |
| 批量分析 | 使用 Headless Analyzer 和脚本跑自动化任务 |

Ghidra 不太适合直接替代运行时 Hook。遇到参数真实值、加密输入输出、运行时对象状态，通常要配合 Frida、lldb、gdb 或日志。

## 基础工作流

```text
创建项目
  -> 导入样本
  -> 选择语言和架构
  -> 自动分析
  -> 从字符串 / 导入函数 / main 入口开始
  -> 重命名函数和变量
  -> 查看交叉引用
  -> 恢复结构体和枚举
  -> 写笔记和导出结论
```

开始前建议记录样本信息：

```sh
file sample.bin
shasum -a 256 sample.bin
strings sample.bin | head
```

记录模板：

```md
## 样本

- 文件：
- SHA256：
- 格式：
- 架构：
- 来源：
- 目标：

## 入口

- 入口函数：
- 关键字符串：
- 关键导入：
- 关键导出：
```

## 导入样本

打开 Ghidra 后：

1. `File -> New Project` 创建项目。
2. 选择 `Non-Shared Project`。
3. `File -> Import File` 导入样本。
4. 确认格式、架构和编译器。
5. 双击样本打开 CodeBrowser。
6. 弹出分析提示时选择 `Yes`。

自动分析选项一般可以保持默认。遇到大型二进制或固件时，可以先减少分析项，避免等待太久。

常见自动分析项：

| 分析项 | 作用 |
| --- | --- |
| Disassemble Entry Points | 从入口点开始反汇编 |
| Function ID | 匹配常见库函数 |
| Decompiler Parameter ID | 帮助恢复参数 |
| ASCII Strings | 扫描字符串 |
| Reference | 建立交叉引用 |

## 界面常用窗口

| 窗口 | 用途 |
| --- | --- |
| Listing | 反汇编主视图 |
| Decompiler | 伪代码视图 |
| Symbol Tree | 函数、标签、导入导出 |
| Data Type Manager | 结构体、枚举、类型 |
| Defined Strings | 字符串列表 |
| Function Call Graph | 函数调用图 |
| Console | 脚本输出和错误 |

常用快捷键：

| 快捷键 | 用途 |
| --- | --- |
| `G` | 跳转地址或符号 |
| `L` | 修改标签名 |
| `F` | 创建函数 |
| `D` | 转为数据 |
| `C` | 转为代码 |
| `X` | 查看交叉引用 |
| `Ctrl + L` | 重命名函数或变量 |
| `;` | 添加注释 |

## 从字符串开始分析

很多程序会留下错误提示、URL、日志标签、命令字：

1. 打开 `Window -> Defined Strings`。
2. 搜索关键字，例如 `login`、`token`、`error`、`sign`。
3. 双击字符串。
4. 按 `X` 查看引用。
5. 进入引用函数。
6. 在 Decompiler 里阅读伪代码。

例子：

```text
"invalid token"
  -> Xrefs
  -> FUN_00123456
  -> 判断 token 是否为空
  -> 调用 verify_token
  -> 返回错误码
```

给函数改名：

```text
FUN_00123456 -> check_token_and_build_error
```

命名不需要一步到位。可以先用粗糙名字：

- `maybe_check_token`
- `build_login_request`
- `parse_config_json`
- `decrypt_buffer`

随着证据增加再修正。

## 从导入函数开始分析

导入表能告诉你程序可能做什么：

| 导入函数 | 可能行为 |
| --- | --- |
| `connect` / `send` / `recv` | 网络通信 |
| `open` / `read` / `write` | 文件读写 |
| `dlopen` / `dlsym` | 动态加载 |
| `EVP_EncryptUpdate` | OpenSSL 加密 |
| `CreateFileW` | Windows 文件访问 |
| `RegOpenKeyExW` | Windows 注册表 |

在 Symbol Tree 里找 Imports，选择函数后按 `X` 看哪里调用。

如果看到：

```c
send(socket_fd, buffer, length, 0);
```

继续追 `buffer` 的来源，通常能找到协议组包、加密或序列化逻辑。

## 反编译视图阅读方法

Ghidra 反编译结果不是源码，只是推测。阅读时关注：

- 函数参数。
- 返回值。
- 条件分支。
- 字符串引用。
- 外部 API。
- 内存读写偏移。
- 循环和数组。

看到这种伪代码：

```c
if (*(int *)(param_1 + 0x10) == 0) {
  return -1;
}
```

可以推测 `param_1` 是结构体指针，`0x10` 是某个字段。

后续可以建立结构体：

```c
struct session {
  char pad0[0x10];
  int state;
};
```

然后把 `param_1` 类型改成 `session *`，伪代码会更可读。

## 恢复结构体

当你看到大量固定偏移访问：

```c
*(int *)(ctx + 0x8)
*(char **)(ctx + 0x10)
*(long *)(ctx + 0x18)
```

可以创建结构体：

1. 打开 `Data Type Manager`。
2. 右键项目，`New -> Structure`。
3. 命名 `app_context`。
4. 添加字段。

示例结构：

```c
struct app_context {
  void *vtable;
  int fd;
  char *token;
  long timestamp;
};
```

在 Decompiler 里右键变量，选择 `Retype Variable`，改成：

```c
app_context *
```

改完后伪代码可能变成：

```c
if (ctx->fd < 0) {
  return -1;
}
send(ctx->fd, ctx->token, len, 0);
```

这种恢复比单纯看 `param_1 + 0x10` 清楚很多。

## 函数签名修正

Ghidra 猜参数不一定准。看到函数实际被这样调用：

```c
ret = FUN_00102030(buffer, length, key);
```

可以重命名并改签名：

```c
int decrypt_buffer(uint8_t *buffer, size_t length, uint8_t *key);
```

操作：

1. 在函数名上右键。
2. `Edit Function Signature`。
3. 修改返回值、函数名、参数类型。

签名改对后，调用方也会更清楚。

## Patch 与导出

Ghidra 可以 patch 指令，但要谨慎。常见用途是学习验证，而不是直接改发布文件。

修改指令：

1. 在 Listing 里选中指令。
2. 右键 `Patch Instruction`。
3. 输入新汇编。

例如把条件跳转改成无条件跳转：

```asm
JZ 0x401000
```

改成：

```asm
JMP 0x401000
```

导出：

```text
File -> Export Program
```

注意：复杂二进制 patch 后可能涉及校验、签名、重定位、代码段权限等问题。学习分析时更建议记录 patch 思路，而不是把 patch 当最终方案。

## Headless Analyzer

批量分析时可以用命令行：

```sh
analyzeHeadless /tmp/ghidra-project demo \
  -import sample.bin \
  -postScript DumpStrings.py \
  -deleteProject
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| `/tmp/ghidra-project` | 项目目录 |
| `demo` | 项目名 |
| `-import` | 导入文件 |
| `-postScript` | 分析后执行脚本 |
| `-deleteProject` | 执行完删除项目 |

适合批量提取字符串、导入函数、导出函数、函数列表。

## Ghidra 脚本：列出函数

Ghidra 脚本可以用 Java 或 Python。这里用 Python 风格示例。

```python
#@category Examples

fm = currentProgram.getFunctionManager()
funcs = fm.getFunctions(True)

for f in funcs:
    print("{} {}".format(f.getEntryPoint(), f.getName()))
```

运行：

```text
Window -> Script Manager -> New Script -> Python
```

保存后点击运行，输出在 Console。

## 脚本：搜索字符串引用

```python
#@category Examples

from ghidra.program.model.symbol import RefType

listing = currentProgram.getListing()
memory = currentProgram.getMemory()

target = "token"

for block in memory.getBlocks():
    if not block.isInitialized():
        continue

    data = listing.getDefinedData(block.getStart(), True)
    while data.hasNext():
        item = data.next()
        value = item.getValue()
        if value is not None and target in str(value):
            print("string: {} at {}".format(value, item.getAddress()))
            refs = getReferencesTo(item.getAddress())
            for ref in refs:
                print("  xref from {}".format(ref.getFromAddress()))
```

这个脚本适合快速找关键字符串及其引用地址。

## 脚本：导出函数和调用关系

```python
#@category Examples

fm = currentProgram.getFunctionManager()

for f in fm.getFunctions(True):
    callers = []
    refs = getReferencesTo(f.getEntryPoint())

    for ref in refs:
        caller = fm.getFunctionContaining(ref.getFromAddress())
        if caller is not None:
            callers.append(caller.getName())

    print("{} <- {}".format(f.getName(), ", ".join(sorted(set(callers)))))
```

可以把输出保存成文本，作为后续画调用图的素材。

## 小案例：定位配置解析函数

假设目标程序会读取配置文件 `config.json`。

分析路线：

1. 在 `Defined Strings` 搜索 `config.json`。
2. 按 `X` 查看引用。
3. 进入引用函数，重命名为 `load_config_file`。
4. 找到 `fopen`、`read` 或 `json_parse` 调用。
5. 顺着返回值找使用配置字段的函数。

可能看到的伪代码：

```c
fp = fopen("config.json", "rb");
if (fp == NULL) {
  log_error("open config failed");
  return -1;
}
read_config(fp, &local_config);
```

命名建议：

```text
FUN_00101020 -> load_config_file
FUN_00101190 -> parse_config_json
FUN_00101300 -> apply_config
```

记录时写清证据：

```md
- `load_config_file` 引用字符串 `config.json`。
- 函数内部调用 `fopen` 和 `parse_config_json`。
- 失败分支引用 `open config failed`。
```

## 常见问题

### 反编译结果很乱

可能原因：

- 函数边界识别错。
- 编译器优化强。
- 混淆或控制流平坦化。
- 目标是 C++，模板和虚函数较多。
- 架构或语言选择不对。

处理方式：

- 手动创建函数。
- 修正函数签名。
- 从字符串和导入 API 分析，不硬读全函数。
- 先命名小函数，再慢慢扩展。

### 字符串找不到

可能原因：

- 字符串被加密。
- 字符串是 UTF-16。
- 字符串运行时拼接。
- Ghidra 没扫描到数据区域。

处理方式：

- 调整字符串扫描选项。
- 搜索宽字符。
- 用动态工具观察解密后的内存。
- 找解密函数，而不是只找明文。

### 函数名全是 `FUN_`

这是正常的。没有符号表时，Ghidra 只能按地址命名。逆向的重要工作之一就是根据证据重命名。

命名建议：

```text
FUN_00102030 -> maybe_decrypt
maybe_decrypt -> decrypt_config
decrypt_config -> aes_decrypt_config
```

### 变量类型不对

右键变量，选择 `Retype Variable`。如果结构体字段还不明确，先用 `undefined8`、`void *`、`char *` 过渡。

### 跳转地址无法反汇编

可能是：

- 目标区域不是代码。
- 间接跳转表。
- 混淆制造的异常控制流。
- 架构模式不对，例如 ARM / Thumb。

可以手动按 `C` 转代码，或检查语言模式。

## 完整案例：从 `invalid token` 定位登录校验链路

这个案例假设你拿到一个授权测试样本 `demo-login`，运行时登录失败会打印 `invalid token`。目标不是改掉校验，而是搞清楚 token 在哪里读取、怎么校验、失败分支怎么返回。

![Ghidra 字符串交叉引用流程](/images/security/tool-guides/ghidra-xref-flow.svg)

### 1. 记录样本信息

```sh
file demo-login
shasum -a 256 demo-login
strings demo-login | grep -i "invalid token"
```

记录：

```md
- 文件：demo-login
- 架构：ELF 64-bit x86-64
- SHA256：...
- 目标字符串：invalid token
```

### 2. 从字符串找引用

导入 Ghidra 并自动分析后，打开 `Defined Strings`，搜索：

```text
invalid token
```

假设结果是：

```text
00406210  invalid token
```

双击字符串，按 `X` 查看引用：

```text
XREF[1]: FUN_00101430:001014a8(*)
```

进入 `FUN_00101430`。

### 3. 阅读伪代码并命名

可能看到：

```c
int FUN_00101430(char *param_1)
{
  int iVar1;
  char local_88[128];

  FUN_001011e0(local_88, 0x80);
  iVar1 = FUN_00101320(param_1, local_88);

  if (iVar1 == 0) {
    puts("login ok");
    return 0;
  }

  puts("invalid token");
  return -1;
}
```

第一轮命名不要太绝对：

```text
FUN_00101430 -> login_check_and_print_result
FUN_001011e0 -> maybe_read_token_from_config
FUN_00101320 -> maybe_verify_token
```

继续进入 `maybe_read_token_from_config`。如果看到：

```c
fp = fopen("config.json", "rb");
if (fp == NULL) {
  return -1;
}
fread(param_1, 1, param_2, fp);
fclose(fp);
```

就可以把它改成：

```text
maybe_read_token_from_config -> read_config_file
```

### 4. 修正函数签名

原始签名可能是：

```c
undefined8 FUN_001011e0(undefined8 param_1, int param_2)
```

根据调用和内部行为，改成：

```c
int read_config_file(char *out, int out_size)
```

改完后调用方更清楚：

```c
read_config_file(local_88, 0x80);
```

### 5. 分析校验函数

进入 `maybe_verify_token`，假设看到：

```c
int FUN_00101320(char *input, char *token)
{
  int iVar1;
  char local_48[64];

  FUN_00101080(input, local_48);
  iVar1 = strcmp(local_48, token);
  return iVar1;
}
```

结合 `strcmp` 和前置函数，命名为：

```text
FUN_00101080 -> build_expected_token
FUN_00101320 -> verify_token
```

如果 `build_expected_token` 里出现 `SHA256`、`HMAC`、`base64` 或相关导入，再继续命名成更具体的算法函数。

### 6. 动态验证

静态分析得到函数偏移后，可以用调试器验证真实参数。Linux x86_64 下前两个参数通常在 `rdi`、`rsi`：

```gdb
b *0x00101320
run test_input
x/s $rdi
x/s $rsi
```

如果是 Android Native，可以把偏移拿给 Frida：

```js
const base = Module.findBaseAddress('libdemo.so');
const verifyToken = base.add(0x1320);

Interceptor.attach(verifyToken, {
  onEnter(args) {
    console.log('[input]', args[0].readCString());
    console.log('[token]', args[1].readCString());
  },
  onLeave(retval) {
    console.log('[ret]', retval.toInt32());
  },
});
```

### 7. 复盘记录

```md
## 登录校验链路

1. `login_check_and_print_result` 引用字符串 `invalid token`。
2. 该函数调用 `read_config_file(local_88, 0x80)` 读取配置。
3. 该函数调用 `verify_token(input, local_88)` 做比较。
4. `verify_token` 内部调用 `build_expected_token` 和 `strcmp`。
5. `strcmp == 0` 输出 `login ok`，否则输出 `invalid token`。

## 未确认

- `build_expected_token` 的算法细节还未确认。
- 需要用动态调试验证 `input` 和 `token` 的真实值。
```

这个案例的核心是建立证据链：字符串只是入口，交叉引用带你找到分支，函数命名和签名修正让链路逐步清楚，最后用动态调试确认参数。

## 分析习惯

- 每找到一个函数，先写一句“它为什么是这个功能”。
- 只给有证据的函数命名。
- 不确定就用 `maybe_` 前缀。
- 结构体字段先按偏移命名，如 `field_10`。
- 每次改类型前先看调用方是否也受影响。
- 静态结论最好用动态运行验证一次。

## 复盘模板

```md
## 目标

- 样本：
- 平台：
- 架构：
- 分析目标：

## 关键入口

- 字符串：
- 导入函数：
- 导出函数：
- 入口函数：

## 关键函数

| 函数 | 地址 | 判断依据 |
| --- | --- | --- |
| `load_config_file` | `0x...` | 引用 `config.json` 并调用 `fopen` |

## 结构体

| 名称 | 字段 | 说明 |
| --- | --- | --- |

## 未确认

-
```

## 案例二：从 `license expired` 找到授权校验逻辑

### 样本代码

用一个自有测试程序模拟授权校验：

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

int parse_expire_day(const char *license) {
    if (license == NULL || strlen(license) < 8) {
        return 0;
    }

    if (strncmp(license, "LAB-", 4) != 0) {
        return 0;
    }

    return atoi(license + 4);
}

int check_license(const char *license) {
    int expire_day = parse_expire_day(license);
    if (expire_day == 0) {
        puts("invalid license");
        return 0;
    }

    if (expire_day < 20260531) {
        puts("license expired");
        return 0;
    }

    puts("license ok");
    return 1;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        puts("usage: ./license LAB-20261231");
        return 1;
    }
    return check_license(argv[1]) ? 0 : 2;
}
```

编译：

```bash
gcc -O0 -g license.c -o license
strip license
```

### 1. 导入后先找字符串

Ghidra 里打开 `Window -> Defined Strings`，搜索：

```text
license expired
```

双击字符串后按 `X` 看引用，通常会跳到某个函数里的 `puts` 调用附近。

### 2. 给函数命名

看到伪代码类似：

```c
iVar1 = FUN_00101169(param_1);
if (iVar1 == 0) {
  puts("invalid license");
  uVar2 = 0;
}
else if (iVar1 < 20260531) {
  puts("license expired");
  uVar2 = 0;
}
else {
  puts("license ok");
  uVar2 = 1;
}
```

这时可以做两件事：

1. 把当前函数命名为 `check_license`。
2. 把 `FUN_00101169` 命名为 `parse_expire_day`。

### 3. 修正函数签名

右键函数名，选择 `Edit Function Signature`：

```c
int check_license(char *license)
```

进入 `parse_expire_day`，签名改成：

```c
int parse_expire_day(char *license)
```

签名修正后，调用处伪代码会明显好读。

### 4. 标记关键常量

`20260531` 是授权过期判断的阈值。可以在反编译窗口里给它加注释：

```text
hardcoded_min_valid_day
```

如果同一个常量在多个函数出现，用 `Search -> For Scalars` 搜：

```text
20260531
```

### 5. 写结论

```md
## 授权校验结论

- 字符串入口：`license expired`
- 主校验函数：`check_license(char *license)`
- 解析函数：`parse_expire_day(char *license)`
- 格式要求：`LAB-YYYYMMDD`
- 失败分支：
  - 前缀不是 `LAB-` -> `invalid license`
  - 日期小于 `20260531` -> `license expired`
- 需要动态验证：传入 `LAB-20250101`、`LAB-20261231` 对照输出
```

这个案例里，Ghidra 的价值是把“字符串附近的一段汇编”整理成“输入、解析、比较、输出”的业务链路。

## 案例三：恢复一个 C 结构体

### 样本代码

```c
#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t id;
    uint16_t status;
    uint16_t flags;
    char name[16];
} Device;

int is_device_ready(Device *dev) {
    if (dev->status != 1) {
        return 0;
    }

    if ((dev->flags & 0x04) == 0) {
        return 0;
    }

    printf("ready: %u %s\n", dev->id, dev->name);
    return 1;
}
```

编译：

```bash
gcc -O0 -g -c device.c -o device.o
strip --strip-debug device.o
```

### 1. 看伪代码里的偏移

未恢复结构体时，伪代码可能是：

```c
if (*(short *)(param_1 + 4) != 1) {
  return 0;
}
if ((*(ushort *)(param_1 + 6) & 4) == 0) {
  return 0;
}
printf("ready: %u %s\n", *(undefined4 *)param_1, param_1 + 8);
```

这已经能推字段：

| 偏移 | 访问方式 | 推断 |
| --- | --- | --- |
| `+0` | `undefined4` | `uint32_t id` |
| `+4` | `short` | `uint16_t status` |
| `+6` | `ushort & 4` | `uint16_t flags` |
| `+8` | `%s` | `char name[]` |

### 2. 新建结构体

打开 `Data Type Manager`，新建结构体：

```c
struct Device {
    uint id;
    ushort status;
    ushort flags;
    char name[16];
};
```

### 3. 应用到函数参数

把函数签名从：

```c
undefined4 FUN_00101000(long param_1)
```

改成：

```c
int is_device_ready(Device *dev)
```

伪代码会变成：

```c
if (dev->status != 1) {
  return 0;
}
if ((dev->flags & 4) == 0) {
  return 0;
}
printf("ready: %u %s\n", dev->id, dev->name);
return 1;
```

### 4. 复盘写法

```md
## Device 结构体恢复

| 字段 | 偏移 | 证据 |
| --- | --- | --- |
| `id` | `0x00` | 作为 `%u` 参数传给 `printf` |
| `status` | `0x04` | 和常量 `1` 比较 |
| `flags` | `0x06` | 做 bit mask `& 0x04` |
| `name` | `0x08` | 作为 `%s` 参数 |
```

结构体恢复的重点不是猜名字，而是用访问宽度、格式化字符串、比较常量和调用参数做证据。

## 案例四：用 Ghidra Script 批量找可疑危险函数

### 目标

在一个固件或命令行程序里批量找 `strcpy`、`sprintf`、`system` 的调用点，并输出调用函数地址。

### 脚本

在 `Script Manager` 新建 Python 脚本：

```python
# Finds calls to selected imported functions.

targets = set(["strcpy", "sprintf", "system", "popen"])
fm = currentProgram.getFunctionManager()
symtab = currentProgram.getSymbolTable()

for name in targets:
    symbols = symtab.getSymbols(name)
    for sym in symbols:
        addr = sym.getAddress()
        refs = getReferencesTo(addr)
        for ref in refs:
            from_addr = ref.getFromAddress()
            fn = fm.getFunctionContaining(from_addr)
            fn_name = fn.getName() if fn else "<no function>"
            print("%s called at %s in %s" % (name, from_addr, fn_name))
```

### 输出示例

```text
strcpy called at 0010142a in parse_config
sprintf called at 00101680 in build_shell_command
system called at 001016c1 in run_update_script
```

### 下一步分析

对每一条结果继续看：

1. 参数是否来自用户输入、网络、配置文件。
2. 目标缓冲区大小是否固定。
3. 是否有长度限制。
4. 是否存在命令拼接。

记录模板：

```md
| 函数 | 调用点 | 参数来源 | 初步风险 |
| --- | --- | --- | --- |
| `system` | `0x001016c1` | 配置文件 `update_url` | 命令拼接，需要继续确认过滤 |
```
