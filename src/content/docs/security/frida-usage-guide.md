---
title: Frida 使用指南与常见问题
description: Frida 动态插桩的安装连接、脚本结构、Android Java Hook、Native Hook、RPC 调用、日志调试和常见问题排查。
---

Frida 是一个动态插桩工具。它可以在程序运行时注入 JavaScript 脚本，观察函数参数、返回值、调用栈、对象字段、内存数据和模块符号。

这篇文档只面向合法授权的软件调试、兼容性排查、学习研究和安全分析。实际使用时建议在测试机、模拟器或隔离环境里操作，不要把脚本直接用于生产账号或第三方系统。

## 适合做什么

| 场景 | 说明 |
| --- | --- |
| 参数观察 | 打印 Java / Native 函数的参数、返回值和调用次数 |
| 流程定位 | 从按钮、网络请求、加密函数、日志字符串向上追调用链 |
| 运行时验证 | 验证静态分析里的类名、方法名、字段和分支条件 |
| 临时改值 | 在测试环境里修改返回值、字段值或函数参数，验证业务分支 |
| Native 分析 | Hook `so` 里的导出函数、地址偏移、系统库函数 |
| 快速原型 | 通过 RPC 把目标进程里的方法暴露给本地脚本调用 |

Frida 不适合代替完整调试器。遇到复杂崩溃、线程竞争、寄存器现场和大段汇编逻辑时，还是要配合 lldb、gdb、IDA、Ghidra 或 jadx。

## 基础安装

PC 端安装 Python 包：

```sh
python3 -m pip install frida-tools
frida --version
frida-ps --version
```

Android 真机或模拟器需要放入对应架构的 `frida-server`。常见架构：

| 架构 | 常见设备 |
| --- | --- |
| `arm64` | 大多数新 Android 真机 |
| `arm` | 老 32 位设备 |
| `x86_64` | 部分模拟器 |
| `x86` | 老模拟器 |

查看设备 CPU：

```sh
adb shell getprop ro.product.cpu.abi
adb shell getprop ro.product.cpu.abilist
```

推送并启动 `frida-server`：

```sh
adb push frida-server /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
adb shell su -c /data/local/tmp/frida-server
```

如果没有 root，Android 上通常只能分析可调试应用或使用 Gadget 方案。日常学习建议准备一台已 root 的测试机或模拟器。

确认连接：

```sh
frida-ps -U
frida-ps -Uai
```

常用参数：

| 参数 | 用途 |
| --- | --- |
| `-U` | 连接 USB 设备 |
| `-f 包名` | spawn 启动应用后注入 |
| `-n 进程名` | attach 到已运行进程 |
| `-p PID` | attach 到指定 PID |
| `-l script.js` | 加载脚本 |
| `--no-pause` | spawn 后不暂停主线程 |

## spawn 与 attach

`spawn` 适合 Hook 启动早期逻辑，例如 `Application.attach`、类加载、初始化配置：

```sh
frida -U -f com.example.app -l hook.js --no-pause
```

`attach` 适合应用已经启动，目标函数会在后续操作中触发：

```sh
frida -U -n com.example.app -l hook.js
```

经验上：

- 找启动流程，用 `spawn`。
- 找按钮点击、网络请求、业务方法，用 `attach`。
- 目标类还没加载，用 `spawn` 或延迟 Hook。
- Hook 后立刻崩，先改成只打印，不改返回值。

## 脚本基本结构

Android Java 层 Hook 基本模板：

```js
Java.perform(function () {
  const Log = Java.use('android.util.Log');
  const Throwable = Java.use('java.lang.Throwable');

  function stack() {
    return Log.getStackTraceString(Throwable.$new());
  }

  console.log('[*] script loaded');
});
```

Native Hook 基本模板：

```js
setImmediate(function () {
  const addr = Module.findExportByName(null, 'open');

  Interceptor.attach(addr, {
    onEnter(args) {
      this.path = args[0].readCString();
      console.log('[open]', this.path);
    },
    onLeave(retval) {
      console.log('[open ret]', retval.toInt32());
    },
  });
});
```

建议把脚本写成小函数，而不是所有逻辑塞进一个 `Java.perform`：

```js
function logLine(tag, value) {
  console.log(`[${tag}] ${value}`);
}

function hookTarget() {
  Java.perform(function () {
    const Target = Java.use('com.example.Target');
    Target.foo.implementation = function (arg) {
      logLine('foo arg', arg);
      const ret = this.foo(arg);
      logLine('foo ret', ret);
      return ret;
    };
  });
}

setImmediate(hookTarget);
```

## Java Hook 入门

### Hook 普通方法

假设目标 Java 代码类似：

```java
package com.example;

public class UserService {
    public String sign(String text) {
        return "sign:" + text;
    }
}
```

Frida 脚本：

```js
Java.perform(function () {
  const UserService = Java.use('com.example.UserService');

  UserService.sign.implementation = function (text) {
    console.log('[sign arg]', text);

    const ret = this.sign(text);
    console.log('[sign ret]', ret);

    return ret;
  };
});
```

### Hook 静态方法

目标代码：

```java
public class DeviceUtil {
    public static String getDeviceId(Context context) {
        return "...";
    }
}
```

Frida 脚本：

```js
Java.perform(function () {
  const DeviceUtil = Java.use('com.example.DeviceUtil');

  DeviceUtil.getDeviceId.implementation = function (context) {
    const ret = DeviceUtil.getDeviceId(context);
    console.log('[device id]', ret);
    return ret;
  };
});
```

### Hook 重载方法

Java 方法可以重载，Frida 需要明确参数类型：

```java
public String encode(String text) { ... }
public String encode(byte[] data) { ... }
public String encode(String text, int mode) { ... }
```

脚本：

```js
Java.perform(function () {
  const Codec = Java.use('com.example.Codec');

  Codec.encode.overload('java.lang.String').implementation = function (text) {
    console.log('[encode String]', text);
    return this.encode(text);
  };

  Codec.encode.overload('[B').implementation = function (data) {
    console.log('[encode byte[]]', bytesToHex(data));
    return this.encode(data);
  };

  Codec.encode.overload('java.lang.String', 'int').implementation = function (text, mode) {
    console.log('[encode String,int]', text, mode);
    return this.encode(text, mode);
  };
});

function bytesToHex(bytes) {
  const arr = Java.array('byte', bytes);
  return Array.prototype.map.call(arr, function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}
```

常见类型写法：

| Java 类型 | Frida 写法 |
| --- | --- |
| `int` | `int` |
| `long` | `long` |
| `boolean` | `boolean` |
| `java.lang.String` | `java.lang.String` |
| `byte[]` | `[B` |
| `int[]` | `[I` |
| `String[]` | `[Ljava.lang.String;` |
| 自定义类 | 完整类名，如 `com.example.User` |

### 一次 Hook 所有重载

方法重载太多时，可以统一打印：

```js
Java.perform(function () {
  const Target = Java.use('com.example.Target');

  Target.foo.overloads.forEach(function (overload) {
    overload.implementation = function () {
      const args = [].slice.call(arguments);
      console.log('[foo overload]', overload.argumentTypes.map(function (t) {
        return t.name;
      }).join(', '));
      console.log('[foo args]', args.map(String).join(' | '));

      const ret = overload.apply(this, arguments);
      console.log('[foo ret]', ret);
      return ret;
    };
  });
});
```

这个模板适合第一轮摸索签名。确定目标重载后，最好改成精确 Hook，日志会干净很多。

## 构造函数与对象字段

### Hook 构造函数

Java 构造函数在 Frida 里叫 `$init`：

```js
Java.perform(function () {
  const User = Java.use('com.example.User');

  User.$init.overload('java.lang.String', 'int').implementation = function (name, age) {
    console.log('[User init]', name, age);
    return this.$init(name, age);
  };
});
```

### 读取字段

字段通过 `.value` 读取：

```js
Java.perform(function () {
  const User = Java.use('com.example.User');

  User.getName.implementation = function () {
    console.log('[field id]', this.id.value);
    console.log('[field token]', this.token.value);
    return this.getName();
  };
});
```

### 修改字段

```js
Java.perform(function () {
  const Config = Java.use('com.example.Config');

  Config.isDebug.implementation = function () {
    this.debug.value = true;
    return this.isDebug();
  };
});
```

字段名和方法名重名时，Frida 可能需要用下划线形式访问。遇到字段读不到，先用 jadx 确认字段真实名、访问修饰符和混淆后名称。

## 打印调用栈

定位谁调用了目标函数时，调用栈很有用：

```js
Java.perform(function () {
  const Log = Java.use('android.util.Log');
  const Throwable = Java.use('java.lang.Throwable');
  const Target = Java.use('com.example.Target');

  Target.sign.implementation = function (text) {
    console.log(Log.getStackTraceString(Throwable.$new()));
    return this.sign(text);
  };
});
```

日志太多时，只在命中特定参数时打印：

```js
Target.sign.implementation = function (text) {
  if (String(text).indexOf('keyword') >= 0) {
    console.log('[hit]', text);
    console.log(Log.getStackTraceString(Throwable.$new()));
  }
  return this.sign(text);
};
```

## 常用数据转换

### byte[] 转 hex

```js
function byteArrayToHex(bytes) {
  const arr = Java.array('byte', bytes);
  return Array.prototype.map.call(arr, function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}
```

### byte[] 转字符串

```js
Java.perform(function () {
  const StringCls = Java.use('java.lang.String');

  function byteArrayToString(bytes) {
    return StringCls.$new(bytes, 'UTF-8').toString();
  }
});
```

### Java List 遍历

```js
function dumpList(list) {
  if (list === null) {
    console.log('[list] null');
    return;
  }

  const size = list.size();
  for (let i = 0; i < size; i++) {
    console.log(`[list ${i}]`, list.get(i));
  }
}
```

### Java Map 遍历

```js
function dumpMap(map) {
  if (map === null) {
    console.log('[map] null');
    return;
  }

  const iterator = map.entrySet().iterator();
  while (iterator.hasNext()) {
    const entry = iterator.next();
    console.log(String(entry.getKey()), '=>', String(entry.getValue()));
  }
}
```

## 枚举类和方法

### 枚举已加载类

```js
Java.perform(function () {
  Java.enumerateLoadedClasses({
    onMatch(name) {
      if (name.indexOf('com.example') >= 0) {
        console.log(name);
      }
    },
    onComplete() {
      console.log('[done]');
    },
  });
});
```

### 枚举类里的方法

```js
Java.perform(function () {
  const clazz = Java.use('com.example.Target');
  const methods = clazz.class.getDeclaredMethods();

  for (let i = 0; i < methods.length; i++) {
    console.log(methods[i].toString());
  }
});
```

如果类名不确定，可以先用关键字枚举类，再用 `getDeclaredMethods()` 打印方法签名。

## 延迟 Hook 与类加载

有些类不是应用一启动就加载，直接 `Java.use()` 会报错。可以 Hook `ClassLoader.loadClass` 找加载时机：

```js
Java.perform(function () {
  const ClassLoader = Java.use('java.lang.ClassLoader');

  ClassLoader.loadClass.overload('java.lang.String').implementation = function (name) {
    const ret = this.loadClass(name);

    if (name.indexOf('com.example') >= 0) {
      console.log('[loadClass]', name);
    }

    return ret;
  };
});
```

也可以简单延迟：

```js
setTimeout(function () {
  Java.perform(function () {
    const Target = Java.use('com.example.Target');
    console.log('[Target loaded]', Target);
  });
}, 3000);
```

延迟不是最稳的方案，但调试初期很省事。正式脚本建议从 `Application.attach` 或 `ClassLoader` 入手。

## Hook Application.attach

多 dex、加固壳或插件化应用里，默认 class loader 可能找不到业务类。可以通过 `Application.attach` 拿到真实 `ClassLoader`：

```js
Java.perform(function () {
  const Application = Java.use('android.app.Application');

  Application.attach.overload('android.content.Context').implementation = function (context) {
    const ret = this.attach(context);
    const loader = context.getClassLoader();
    Java.classFactory.loader = loader;

    console.log('[classloader]', loader);
    hookBusiness();

    return ret;
  };
});

function hookBusiness() {
  const Target = Java.use('com.example.Target');

  Target.sign.implementation = function (text) {
    console.log('[sign]', text);
    return this.sign(text);
  };
}
```

这类脚本通常配合 `spawn`：

```sh
frida -U -f com.example.app -l hook.js --no-pause
```

## 修改返回值

只在测试环境中临时改值。建议先打印原返回值，再改：

```js
Java.perform(function () {
  const Target = Java.use('com.example.Target');

  Target.isEnabled.implementation = function () {
    const oldRet = this.isEnabled();
    console.log('[isEnabled old]', oldRet);
    return true;
  };
});
```

修改对象返回值时，要返回正确类型：

```js
Java.perform(function () {
  const Result = Java.use('com.example.Result');
  const Api = Java.use('com.example.Api');

  Api.getResult.implementation = function () {
    const result = Result.$new();
    result.code.value = 0;
    result.message.value = 'ok';
    return result;
  };
});
```

如果返回类型不匹配，常见结果是应用崩溃或 Frida 报类型转换错误。

## Native Hook 入门

Native 层通常指 `.so` 里的 C/C++ 函数。常用思路：

1. 找模块名。
2. 找导出符号或基址。
3. 通过 `Interceptor.attach` 打印参数和返回值。
4. 必要时根据偏移 Hook。

### 枚举模块

```js
Process.enumerateModules().forEach(function (m) {
  if (m.name.indexOf('lib') === 0) {
    console.log(m.name, m.base, m.size);
  }
});
```

### 找导出函数

```js
const exports = Module.enumerateExports('libtarget.so');

exports.forEach(function (item) {
  if (item.name.indexOf('sign') >= 0) {
    console.log(item.name, item.address);
  }
});
```

### Hook 导出函数

```js
const addr = Module.findExportByName('libtarget.so', 'Java_com_example_Native_sign');

Interceptor.attach(addr, {
  onEnter(args) {
    console.log('[native sign enter]');
    console.log('arg0', args[0]);
    console.log('arg1', args[1]);
  },
  onLeave(retval) {
    console.log('[native sign ret]', retval);
  },
});
```

### 按偏移 Hook

如果函数没有导出符号，可以用模块基址加偏移：

```js
const base = Module.findBaseAddress('libtarget.so');
const target = base.add(0x1234);

Interceptor.attach(target, {
  onEnter(args) {
    console.log('[hit]', target);
  },
});
```

偏移要和当前版本、架构、加载模块对应。版本更新后，偏移很容易失效。

## Native 参数读取

### C 字符串

```js
Interceptor.attach(Module.findExportByName(null, 'strcmp'), {
  onEnter(args) {
    const a = args[0].readCString();
    const b = args[1].readCString();
    console.log('[strcmp]', a, b);
  },
});
```

### UTF-16 字符串

```js
Interceptor.attach(Module.findExportByName(null, 'wcslen'), {
  onEnter(args) {
    console.log('[wcslen]', args[0].readUtf16String());
  },
});
```

### 内存 hexdump

```js
Interceptor.attach(Module.findExportByName(null, 'memcpy'), {
  onEnter(args) {
    this.dst = args[0];
    this.src = args[1];
    this.len = args[2].toInt32();

    if (this.len > 0 && this.len <= 64) {
      console.log(hexdump(this.src, {
        offset: 0,
        length: this.len,
        header: true,
        ansi: false,
      }));
    }
  },
});
```

### 修改返回值

```js
Interceptor.attach(Module.findExportByName(null, 'strcmp'), {
  onLeave(retval) {
    if (retval.toInt32() !== 0) {
      console.log('[strcmp ret old]', retval.toInt32());
    }
  },
});
```

如果确实需要在测试环境改返回值：

```js
retval.replace(0);
```

不要一开始就替换返回值。先观察参数和调用频率，否则很容易改到系统函数的正常调用，导致应用崩溃。

## Hook JNI RegisterNatives

很多 Native 方法不是导出符号，而是运行时注册。可以 Hook `RegisterNatives` 观察 Java 方法和 native 函数地址的对应关系：

```js
function hookRegisterNatives() {
  const symbols = Module.enumerateSymbols('libart.so');
  let addr = null;

  for (const s of symbols) {
    if (s.name.indexOf('RegisterNatives') >= 0 && s.name.indexOf('CheckJNI') < 0) {
      addr = s.address;
      console.log('[RegisterNatives]', s.name, addr);
      break;
    }
  }

  if (addr === null) {
    console.log('RegisterNatives not found');
    return;
  }

  Interceptor.attach(addr, {
    onEnter(args) {
      const env = args[0];
      const clazz = args[1];
      const methods = args[2];
      const count = args[3].toInt32();

      console.log('[RegisterNatives count]', count);

      for (let i = 0; i < count; i++) {
        const item = methods.add(i * Process.pointerSize * 3);
        const name = item.readPointer().readCString();
        const sig = item.add(Process.pointerSize).readPointer().readCString();
        const fn = item.add(Process.pointerSize * 2).readPointer();
        console.log(name, sig, fn);
      }
    },
  });
}

setImmediate(hookRegisterNatives);
```

这个模板适合定位 JNI 入口。拿到函数地址后，再用 `Interceptor.attach(fn, ...)` 进一步分析参数。

## RPC 调用

Frida 的 `rpc.exports` 可以把目标进程里的函数暴露给本地 Python 调用。

JavaScript 脚本：

```js
rpc.exports = {
  sign(text) {
    let result = null;

    Java.perform(function () {
      const Signer = Java.use('com.example.Signer');
      result = Signer.sign(text);
    });

    return result;
  },
};
```

Python 调用：

```python
import frida

device = frida.get_usb_device()
pid = device.spawn(["com.example.app"])
session = device.attach(pid)

with open("rpc.js", "r", encoding="utf-8") as f:
    script = session.create_script(f.read())

script.load()
device.resume(pid)

print(script.exports_sync.sign("hello"))
```

RPC 适合把已经定位好的函数做成调试入口。不要在 RPC 里写太多枚举和 Hook 逻辑，容易变得难维护。

## 日志组织

脚本复杂后，日志要有标签和开关。

```js
const debug = true;

function log(tag, msg) {
  if (!debug) {
    return;
  }
  console.log(`[${tag}] ${msg}`);
}

function json(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}
```

打印对象时避免直接 `JSON.stringify(JavaObject)`。很多 Java 对象有循环引用或代理对象，容易报错。优先打印关键字段和 `toString()`：

```js
console.log('[obj]', obj);
console.log('[obj str]', obj.toString());
```

日志太多时可以只打印命中特征：

```js
if (String(url).indexOf('/api/') >= 0) {
  console.log('[url]', url);
}
```

## 常见问题

### `frida-ps -U` 看不到设备

检查顺序：

```sh
adb devices
adb shell getprop ro.product.cpu.abi
adb shell ps | grep frida
```

常见原因：

- USB 调试未开启。
- 设备未授权当前电脑。
- `frida-server` 没启动。
- `frida-server` 架构不匹配。
- PC 端 Frida 版本和 server 版本差太多。

处理方式：

- 重新插拔 USB，确认 `adb devices` 是 `device`。
- 下载与 PC 端版本一致的 `frida-server`。
- 确认 `chmod 755`。
- root 环境用 `su -c` 启动。

### `unable to connect to remote frida-server`

先确认 server 是否运行：

```sh
adb shell ps -A | grep frida
```

如果没有运行：

```sh
adb shell su -c /data/local/tmp/frida-server
```

如果端口冲突或残留进程异常：

```sh
adb shell su -c "pkill frida-server"
adb shell su -c /data/local/tmp/frida-server
```

### `Failed to spawn: unable to find process with name`

`-f` 后面要写包名，不是应用显示名称：

```sh
frida-ps -Uai
frida -U -f com.example.app -l hook.js --no-pause
```

如果应用有多进程，确认目标逻辑在哪个进程：

```sh
adb shell ps -A | grep example
```

### `ClassNotFoundException` 或 `Java.use` 找不到类

常见原因：

- 类还没加载。
- 包名或类名写错。
- 应用使用多 dex、插件化或加固。
- 当前 `ClassLoader` 不对。

处理方式：

- 用 `Java.enumerateLoadedClasses()` 搜关键字。
- Hook `Application.attach` 后设置 `Java.classFactory.loader`。
- Hook `ClassLoader.loadClass` 观察加载时机。
- 用 jadx 确认混淆后的完整类名。

### `Error: foo(): has more than one overload`

说明方法有重载，需要明确签名：

```js
Target.foo.overload('java.lang.String', 'int').implementation = function (text, mode) {
  return this.foo(text, mode);
};
```

不确定签名时先打印：

```js
Target.foo.overloads.forEach(function (o) {
  console.log(o.argumentTypes.map(function (t) {
    return t.name;
  }).join(', '));
});
```

### Hook 后应用卡死

常见原因：

- Hook 高频函数，日志太多。
- 在 UI 线程做了耗时操作。
- Hook 里递归调用了自己。
- 修改返回值导致业务等待条件不成立。

处理方式：

- 先加过滤条件。
- 少打印大对象，少 `hexdump` 大内存。
- 确认调用原函数时用的是当前 overload。
- 先只观察，不修改返回值。

错误示例：

```js
Target.foo.implementation = function (x) {
  return Target.foo(x); // 容易递归或 this 不对
};
```

更稳的写法：

```js
Target.foo.implementation = function (x) {
  return this.foo(x);
};
```

对于重载：

```js
const foo = Target.foo.overload('java.lang.String');
foo.implementation = function (x) {
  return foo.call(this, x);
};
```

### 打印 byte[] 结果全是负数

Java 的 `byte` 是有符号类型。转 hex 时要 `& 0xff`：

```js
function toHex(bytes) {
  const arr = Java.array('byte', bytes);
  return Array.prototype.map.call(arr, function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}
```

### `expected a pointer` 或读取内存崩溃

Native 参数不一定是指针。读之前先判断：

```js
if (!args[0].isNull()) {
  console.log(args[0].readCString());
}
```

读取长度也要控制：

```js
const len = args[2].toInt32();
if (len > 0 && len < 4096) {
  console.log(hexdump(args[1], { length: len }));
}
```

### `Module.findBaseAddress` 返回 null

说明模块还没加载或模块名写错。

可以 Hook `android_dlopen_ext` 观察动态加载：

```js
Interceptor.attach(Module.findExportByName(null, 'android_dlopen_ext'), {
  onEnter(args) {
    this.path = args[0].readCString();
  },
  onLeave() {
    if (this.path.indexOf('libtarget.so') >= 0) {
      console.log('[loaded]', this.path);
    }
  },
});
```

模块加载后再 Hook：

```js
function hookWhenLoaded(name, callback) {
  const base = Module.findBaseAddress(name);
  if (base) {
    callback(base);
    return;
  }

  Interceptor.attach(Module.findExportByName(null, 'android_dlopen_ext'), {
    onEnter(args) {
      this.path = args[0].readCString();
    },
    onLeave() {
      if (this.path.indexOf(name) >= 0) {
        const base = Module.findBaseAddress(name);
        callback(base);
      }
    },
  });
}
```

### `TypeError: cannot read property implementation of undefined`

一般是方法名写错，或目标是字段不是方法。先打印方法：

```js
const methods = Target.class.getDeclaredMethods();
for (let i = 0; i < methods.length; i++) {
  console.log(methods[i].toString());
}
```

再确认是否有重载、是否是静态方法、是否是内部类。

内部类名通常用 `$`：

```js
Java.use('com.example.Outer$Inner');
```

### 日志里对象显示 `[object Object]`

Java 对象优先调用 `toString()`：

```js
console.log(obj.toString());
```

如果对象有 getter：

```js
console.log(obj.getId());
console.log(obj.getName());
```

如果是集合：

```js
dumpList(obj);
dumpMap(obj);
```

## 常用脚本模板

### 网络 URL 观察模板

适合初步定位请求从哪里发出：

```js
Java.perform(function () {
  const URL = Java.use('java.net.URL');

  URL.$init.overload('java.lang.String').implementation = function (url) {
    if (String(url).indexOf('http') === 0) {
      console.log('[URL]', url);
    }
    return this.$init(url);
  };
});
```

### Hash / 加密输入输出观察模板

```js
Java.perform(function () {
  const MessageDigest = Java.use('java.security.MessageDigest');

  MessageDigest.digest.overload('[B').implementation = function (data) {
    const alg = this.getAlgorithm();
    const input = byteArrayToHex(data);
    const ret = this.digest(data);
    const output = byteArrayToHex(ret);

    console.log(`[digest ${alg}] ${input} => ${output}`);
    return ret;
  };
});
```

### SharedPreferences 读取模板

```js
Java.perform(function () {
  const SharedPreferencesImpl = Java.use('android.app.SharedPreferencesImpl');

  SharedPreferencesImpl.getString.implementation = function (key, defValue) {
    const ret = this.getString(key, defValue);
    console.log('[sp getString]', key, '=>', ret);
    return ret;
  };
});
```

### Toast 提示当前脚本已加载

```js
Java.perform(function () {
  const ActivityThread = Java.use('android.app.ActivityThread');
  const Toast = Java.use('android.widget.Toast');
  const context = ActivityThread.currentApplication().getApplicationContext();

  Java.scheduleOnMainThread(function () {
    Toast.makeText(context, Java.use('java.lang.String').$new('Frida loaded'), 0).show();
  });
});
```

## 分析记录模板

```md
## 目标

- 包名：
- 版本：
- 设备：
- Frida 版本：
- 目标函数：

## 入口

- 触发动作：
- 类名：
- 方法签名：
- Native 模块：
- 偏移：

## 观察

- 参数：
- 返回值：
- 调用栈：
- 关键字段：
- 触发频率：

## 结论

-

## 未确认

-
```

## 使用建议

1. 先观察，再修改。
2. 先 Hook 业务函数，再 Hook 系统高频函数。
3. 每次只验证一个假设。
4. 日志加标签，避免后期看不懂。
5. 版本、包名、设备、脚本和结论一起记录。
6. 脚本能短就短，确定后再抽函数复用。
7. 偏移、类名、字段名都可能随版本变化，不要当成长期稳定接口。
