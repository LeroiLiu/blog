---
title: iOS 应用分析与砸壳概念入门
description: iOS 应用静态分析、Mach-O、IPA 结构、符号、Objective-C 类信息、授权样本解密概念、Frida 调试和常见问题。
---

# iOS 应用分析与砸壳概念入门

iOS 应用分析常见对象是 IPA、Mach-O 可执行文件、Framework、动态库、资源文件和运行时 Objective-C / Swift 元数据。

这里把“砸壳”作为概念解释：App Store 分发的应用可执行文件通常带有 FairPlay 加密保护，静态分析前需要有合法授权的未加密样本，例如自有 App 的 Debug / Ad Hoc 包、企业内测包、开发者导出的符号文件，或经过明确授权的测试样本。

本文不提供绕过 App Store DRM、破解商业软件或分发解密应用的操作步骤。实务中优先使用自有 App、授权样本和调试构建进行分析。

## iOS 分析对象

| 对象 | 说明 |
| --- | --- |
| IPA | 本质是 zip 包，包含 `Payload/*.app` |
| Mach-O | iOS 可执行文件、dylib、framework 的二进制格式 |
| Framework | 动态库和资源封装 |
| dSYM | 调试符号文件，能帮助符号化崩溃和函数名 |
| Info.plist | 应用配置、权限、URL Scheme |
| Entitlements | 签名权限，如 Keychain、Associated Domains |
| Assets.car | 图片资源包 |

解包 IPA：

```sh
unzip app.ipa -d app_unzip
find app_unzip/Payload -maxdepth 2 -type f | head
```

找主程序：

```sh
plutil -p app_unzip/Payload/*.app/Info.plist | grep CFBundleExecutable
```

## 基础命令

查看文件格式：

```sh
file Payload/App.app/App
```

查看架构：

```sh
lipo -info Payload/App.app/App
```

查看 Mach-O 头：

```sh
otool -hv Payload/App.app/App
```

查看依赖库：

```sh
otool -L Payload/App.app/App
```

查看加载命令：

```sh
otool -l Payload/App.app/App | less
```

查看符号：

```sh
nm -m Payload/App.app/App | head
```

提取字符串：

```sh
strings Payload/App.app/App | grep -i token
```

## 判断是否加密

Mach-O 的 `LC_ENCRYPTION_INFO` / `LC_ENCRYPTION_INFO_64` 里有 `cryptid` 字段。

```sh
otool -l Payload/App.app/App | grep -A5 LC_ENCRYPTION_INFO
```

常见含义：

| 字段 | 说明 |
| --- | --- |
| `cryptoff` | 加密区域偏移 |
| `cryptsize` | 加密区域大小 |
| `cryptid 1` | 通常表示加密 |
| `cryptid 0` | 通常表示未加密 |

如果是自有 App，建议直接导出未加密的 Debug / Ad Hoc 分析包，而不是从 App Store 包开始。

## IPA 结构检查脚本

```python
from pathlib import Path
import plistlib
import zipfile

ipa = Path("app.ipa")
out = Path("ipa_unpack")

with zipfile.ZipFile(ipa) as z:
    z.extractall(out)

apps = list((out / "Payload").glob("*.app"))
if not apps:
    raise SystemExit("Payload/*.app not found")

app = apps[0]
info_path = app / "Info.plist"

with info_path.open("rb") as f:
    info = plistlib.load(f)

exe = info.get("CFBundleExecutable")

print("bundle:", info.get("CFBundleIdentifier"))
print("name:", info.get("CFBundleName"))
print("version:", info.get("CFBundleShortVersionString"))
print("executable:", exe)
print("binary:", app / exe)
```

## Info.plist 关注点

```sh
plutil -p Payload/App.app/Info.plist
```

常看字段：

| 字段 | 用途 |
| --- | --- |
| `CFBundleIdentifier` | 包名 |
| `CFBundleExecutable` | 主可执行文件 |
| `CFBundleURLTypes` | URL Scheme |
| `LSApplicationQueriesSchemes` | 可查询的 Scheme |
| `NSAppTransportSecurity` | ATS 网络策略 |
| `UIBackgroundModes` | 后台能力 |
| `NSCameraUsageDescription` | 相机权限说明 |
| `NSLocationWhenInUseUsageDescription` | 定位权限说明 |

提取 URL Scheme：

```python
import plistlib

with open("Payload/App.app/Info.plist", "rb") as f:
    info = plistlib.load(f)

for item in info.get("CFBundleURLTypes", []):
    for scheme in item.get("CFBundleURLSchemes", []):
        print(scheme)
```

## Entitlements

查看签名权限：

```sh
codesign -d --entitlements :- Payload/App.app/App
```

关注：

- `application-identifier`
- `keychain-access-groups`
- `com.apple.developer.associated-domains`
- `aps-environment`
- App Groups

这些字段能帮助理解 Keychain、Universal Links、推送和共享容器。

## Objective-C 类信息

如果二进制保留 Objective-C 元数据，可以用 strings 或工具查看类名、方法名。

简单搜索：

```sh
strings Payload/App.app/App | grep -E "ViewController|Manager|Service" | head
```

Mach-O 中常见段：

| 段/节 | 说明 |
| --- | --- |
| `__objc_classlist` | Objective-C 类列表 |
| `__objc_methname` | 方法名 |
| `__objc_classname` | 类名 |
| `__objc_const` | 类元数据 |

使用 otool：

```sh
otool -ov Payload/App.app/App | less
```

如果有 class-dump 类工具，可以导出头文件用于阅读。对 Swift 应用，符号和类型信息会更复杂，常需要结合 demangle。

Swift 符号 demangle：

```sh
swift-demangle '$s4Demo11UserServiceC5loginyyF'
```

批量：

```sh
nm Payload/App.app/App | awk '{print $3}' | swift-demangle | head
```

## Ghidra 分析 iOS Mach-O

导入主程序后：

1. 确认架构是 ARM64。
2. 自动分析。
3. 从字符串、Objective-C 方法名、导入函数开始。
4. 搜索 URL、接口路径、错误提示。
5. 根据方法名和调用链重命名函数。

常见导入：

| 符号 | 说明 |
| --- | --- |
| `objc_msgSend` | Objective-C 方法派发 |
| `objc_retain` / `objc_release` | ARC 引用计数 |
| `CC_MD5` / `CC_SHA256` | CommonCrypto |
| `SecItemCopyMatching` | Keychain 读取 |
| `NSURLSession` 相关 | 网络请求 |

Objective-C 伪代码里 `objc_msgSend` 很多，要结合 selector 看含义。

## Frida 观察 Objective-C

列出类：

```js
if (ObjC.available) {
  for (const name in ObjC.classes) {
    if (name.indexOf('User') >= 0) {
      console.log(name);
    }
  }
}
```

Hook Objective-C 方法：

```js
if (ObjC.available) {
  const cls = ObjC.classes.UserService;
  const method = cls['- loginWithName:password:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const self = new ObjC.Object(args[0]);
      const selector = ObjC.selectorAsString(args[1]);
      const name = new ObjC.Object(args[2]).toString();
      const password = new ObjC.Object(args[3]).toString();

      console.log('[objc]', self.$className, selector, name, password);
    },
  });
}
```

Hook 类方法：

```js
const method = ObjC.classes.TokenManager['+ currentToken'];

Interceptor.attach(method.implementation, {
  onLeave(retval) {
    const ret = new ObjC.Object(retval).toString();
    console.log('[token]', ret);
  },
});
```

注意：

- `args[0]` 是 `self`。
- `args[1]` 是 selector。
- 从 `args[2]` 开始才是方法参数。

## Frida 观察 NSURLSession

```js
if (ObjC.available) {
  const cls = ObjC.classes.NSURLSession;
  const method = cls['- dataTaskWithRequest:completionHandler:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const request = new ObjC.Object(args[2]);
      console.log('[request]', request.URL().absoluteString().toString());
      console.log('[method]', request.HTTPMethod().toString());
    },
  });
}
```

如果 App 用第三方网络库，仍然可以从 `NSURLRequest`、`NSURLSession` 或底层 CFNetwork 观察。

## Keychain 观察方向

Keychain 常见 API：

| API | 说明 |
| --- | --- |
| `SecItemAdd` | 添加 |
| `SecItemCopyMatching` | 查询 |
| `SecItemUpdate` | 更新 |
| `SecItemDelete` | 删除 |

Frida 观察调用：

```js
const secItemCopyMatching = Module.findExportByName('Security', 'SecItemCopyMatching');

Interceptor.attach(secItemCopyMatching, {
  onEnter(args) {
    console.log('[SecItemCopyMatching]', args[0]);
  },
  onLeave(retval) {
    console.log('[SecItemCopyMatching ret]', retval.toInt32());
  },
});
```

CoreFoundation 对象打印比较复杂，实际分析时可以配合 Objective-C 层封装函数或 lldb。

## 自有 App 的推荐分析路线

如果你能拿到源码或构建权限，优先使用这种方式：

1. Xcode 构建 Debug 包。
2. 保留 dSYM。
3. 导出 IPA 或直接拿 `.app`。
4. 用 Ghidra / Hopper / IDA 做静态分析。
5. 用 Frida / lldb 做运行时观察。
6. 用 Wireshark / Charles 分析网络。

这样比分析 App Store 加密包更稳定，也更合规。

## 完整案例：分析自有 App 的登录接口与 Keychain 读取

场景：你有一个自有 iOS 测试 App，Bundle ID 是 `com.demo.iosapp`。目标是找出登录接口 URL、token 存储位置，以及运行时哪个方法读取 token。

### 1. 解包并确认主程序

```sh
unzip Demo.ipa -d Demo_unzip
plutil -p Demo_unzip/Payload/*.app/Info.plist | grep CFBundleExecutable
```

假设主程序是：

```text
Demo_unzip/Payload/Demo.app/Demo
```

记录：

```md
- Bundle ID：com.demo.iosapp
- Executable：Demo
- 样本来源：自有测试包
```

### 2. 检查是否适合静态分析

```sh
otool -l Demo_unzip/Payload/Demo.app/Demo | grep -A5 LC_ENCRYPTION_INFO
```

如果看到：

```text
cryptid 0
```

说明这个样本可以继续静态分析。如果自有 App 出现 `cryptid 1`，优先重新导出 Debug / Ad Hoc 包。

### 3. 提取 URL 和关键字符串

```sh
strings Demo_unzip/Payload/Demo.app/Demo | grep -E "https?://|/api/|token|login" | head -n 80
```

可能输出：

```text
https://api.test.local
/api/v1/login
access_token
refresh_token
KeychainTokenStore
```

记录：

```md
- Base URL：`https://api.test.local`
- 登录路径：`/api/v1/login`
- token 字段：`access_token`、`refresh_token`
- 可疑类：`KeychainTokenStore`
```

### 4. Frida 枚举类

```js
if (ObjC.available) {
  for (const name in ObjC.classes) {
    if (name.indexOf('Token') >= 0 || name.indexOf('Login') >= 0) {
      console.log(name);
    }
  }
}
```

预期：

```text
LoginService
KeychainTokenStore
```

### 5. Hook 登录方法

假设枚举方法得到：

```text
- loginWithUsername:password:completion:
```

Hook：

```js
if (ObjC.available) {
  const LoginService = ObjC.classes.LoginService;
  const method = LoginService['- loginWithUsername:password:completion:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const username = new ObjC.Object(args[2]).toString();
      const password = new ObjC.Object(args[3]).toString();
      console.log('[login username]', username);
      console.log('[login password length]', password.length);
    },
  });
}
```

这里不打印明文密码，只打印长度，避免日志泄露敏感信息。

### 6. Hook Keychain 封装类

```js
if (ObjC.available) {
  const Store = ObjC.classes.KeychainTokenStore;
  const method = Store['- accessToken'];

  Interceptor.attach(method.implementation, {
    onLeave(retval) {
      if (!retval.isNull()) {
        console.log('[accessToken]', new ObjC.Object(retval).toString());
      }
    },
  });
}
```

观察底层 Keychain API：

```js
const fn = Module.findExportByName('Security', 'SecItemCopyMatching');

Interceptor.attach(fn, {
  onEnter(args) {
    console.log('[SecItemCopyMatching query]', args[0]);
  },
  onLeave(retval) {
    console.log('[SecItemCopyMatching ret]', retval.toInt32());
  },
});
```

### 7. Hook NSURLSession 请求

```js
if (ObjC.available) {
  const cls = ObjC.classes.NSURLSession;
  const method = cls['- dataTaskWithRequest:completionHandler:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const req = new ObjC.Object(args[2]);
      const url = req.URL().absoluteString().toString();
      const methodName = req.HTTPMethod().toString();

      if (url.indexOf('/api/') >= 0) {
        console.log('[request]', methodName, url);
      }
    },
  });
}
```

预期输出：

```text
[request] POST https://api.test.local/api/v1/login
[request] GET https://api.test.local/api/v1/profile
```

### 8. 复盘记录

```md
## 登录与 token 链路

1. `LoginService -loginWithUsername:password:completion:` 触发登录。
2. 登录请求：`POST https://api.test.local/api/v1/login`。
3. 响应字段包含 `access_token`、`refresh_token`。
4. `KeychainTokenStore -accessToken` 读取 token。
5. 底层调用 `SecItemCopyMatching`。

## 风险检查建议

- token 是否只存在 Keychain，不落明文文件。
- Keychain access group 是否符合预期。
- URL Scheme 是否会把 token 带到外部。
- 日志中是否打印 token。
```

## 完整案例：确认 URL Scheme 暴露面

目标：检查自有 App 的 URL Scheme 是否可能被外部 App 调起敏感页面。

### 1. 从 Info.plist 提取 Scheme

```python
import plistlib
from pathlib import Path

info_path = Path("Demo_unzip/Payload/Demo.app/Info.plist")

with info_path.open("rb") as f:
    info = plistlib.load(f)

for item in info.get("CFBundleURLTypes", []):
    for scheme in item.get("CFBundleURLSchemes", []):
        print(scheme)
```

输出：

```text
demoapp
```

### 2. 搜索路由处理方法

```sh
strings Demo_unzip/Payload/Demo.app/Demo | grep -i "openURL\\|handleURL\\|route"
```

可能出现：

```text
application:openURL:options:
RouterManager
handleURL:
```

### 3. Frida Hook 路由入口

```js
if (ObjC.available) {
  const Router = ObjC.classes.RouterManager;
  const method = Router['- handleURL:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const url = new ObjC.Object(args[2]).absoluteString().toString();
      console.log('[handleURL]', url);
    },
  });
}
```

### 4. 测试调起

在授权测试模拟器上：

```sh
xcrun simctl openurl booted "demoapp://profile?id=10001"
```

记录：

```md
- Scheme：demoapp
- 路由入口：RouterManager -handleURL:
- 测试 URL：demoapp://profile?id=10001
- 是否需要登录：是
- 是否校验来源：未确认
```

## 常见问题

### IPA 解压后找不到可执行文件

先看 `Info.plist`：

```sh
plutil -p Payload/*.app/Info.plist | grep CFBundleExecutable
```

可执行文件通常在：

```text
Payload/AppName.app/AppName
```

### `otool` 看到 `cryptid 1`

说明二进制通常处于加密状态，不适合直接静态分析。对于自有 App，请导出未加密调试包或使用授权样本。

### Swift 符号很长

用 `swift-demangle`：

```sh
swift-demangle '符号名'
```

### Frida 找不到 Objective-C 类

可能原因：

- 类名是 Swift mangled 名。
- 类还没加载。
- App 使用动态 Framework。
- 目标是纯 C/C++ 函数。

可以先枚举：

```js
for (const name in ObjC.classes) {
  if (name.toLowerCase().indexOf('login') >= 0) {
    console.log(name);
  }
}
```

### Hook 方法后崩溃

常见原因：

- 参数不是 Objective-C 对象，却用 `new ObjC.Object()` 包装。
- 方法签名看错。
- 返回值为空。
- Hook 过早，类未初始化。

先只打印 selector 和指针：

```js
console.log(args[0], ObjC.selectorAsString(args[1]), args[2]);
```

确认类型后再包装对象。

## 分析记录模板

```md
## 样本

- IPA：
- Bundle ID：
- 版本：
- 架构：
- cryptid：
- dSYM：

## 静态分析

- URL Scheme：
- 关键权限：
- 关键类：
- 关键方法：
- 关键字符串：

## 动态分析

- Hook 点：
- 参数：
- 返回值：
- 调用栈：

## 结论

-
```

## 案例三：定位 iOS App 登录请求参数来源

### 场景

自有测试 App 登录接口请求：

```text
POST /v1/login
Headers:
  X-Device-Id: ...
  X-Sign: ...
Body:
  mobile=...
  code=...
```

目标：找出 `X-Sign` 在哪个 Objective-C 方法里生成，输入是什么。

### 1. 静态查字符串

解包自有调试 IPA 后：

```bash
strings Payload/Demo.app/Demo | rg 'X-Sign|Device|login|/v1/login'
```

可能得到：

```text
X-Sign
X-Device-Id
/v1/login
buildLoginSignWithPath:body:
```

### 2. 查 Objective-C 方法名

```bash
otool -ov Payload/Demo.app/Demo | rg -A 4 'buildLoginSign|Login|Network'
```

看到：

```text
name 0x... -[DMNetworkSigner buildLoginSignWithPath:body:]
```

### 3. Frida Hook 目标方法

```js
if (ObjC.available) {
  const cls = ObjC.classes.DMNetworkSigner;
  const method = cls['- buildLoginSignWithPath:body:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      this.path = new ObjC.Object(args[2]).toString();
      this.body = new ObjC.Object(args[3]).toString();
      console.log('[buildLoginSign path]', this.path);
      console.log('[buildLoginSign body]', this.body);
    },
    onLeave(retval) {
      const ret = new ObjC.Object(retval).toString();
      console.log('[buildLoginSign ret]', ret);
    }
  });
}
```

运行：

```bash
frida -U -f com.demo.ios -l ios-sign.js --no-pause
```

触发登录，输出：

```text
[buildLoginSign path] /v1/login
[buildLoginSign body] mobile=13800000000&code=123456
[buildLoginSign ret] 4f92e0...
```

### 4. Hook 请求发送确认 Header

```js
if (ObjC.available) {
  const cls = ObjC.classes.NSMutableURLRequest;
  const method = cls['- setValue:forHTTPHeaderField:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      const value = new ObjC.Object(args[2]).toString();
      const field = new ObjC.Object(args[3]).toString();
      if (field.indexOf('Sign') >= 0 || field.indexOf('Device') >= 0) {
        console.log('[header]', field + ': ' + value);
      }
    }
  });
}
```

### 5. 复盘

```md
- URL：`/v1/login`
- 签名类：`DMNetworkSigner`
- 方法：`- buildLoginSignWithPath:body:`
- 输入：path + body
- 输出：`X-Sign`
- 已验证：`NSMutableURLRequest` 最终设置了相同值
```

## 案例四：检查 Keychain 是否保存明文 token

### 场景

App 卸载重装后仍能识别设备，怀疑 Keychain 保存了设备 ID 或 token。目标是找 Keychain 读写点。

### 1. Hook `SecItemAdd`

```js
const SecItemAdd = Module.findExportByName('Security', 'SecItemAdd');

Interceptor.attach(SecItemAdd, {
  onEnter(args) {
    const query = new ObjC.Object(args[0]);
    console.log('[SecItemAdd]', query.toString());
  },
  onLeave(retval) {
    console.log('[SecItemAdd ret]', retval.toInt32());
  }
});
```

### 2. Hook `SecItemCopyMatching`

```js
const SecItemCopyMatching = Module.findExportByName('Security', 'SecItemCopyMatching');

Interceptor.attach(SecItemCopyMatching, {
  onEnter(args) {
    const query = new ObjC.Object(args[0]);
    console.log('[SecItemCopyMatching]', query.toString());
  },
  onLeave(retval) {
    console.log('[SecItemCopyMatching ret]', retval.toInt32());
  }
});
```

### 3. 触发动作

1. 首次启动。
2. 登录。
3. 杀进程重启。
4. 退出登录。
5. 卸载重装后再启动。

可能看到：

```text
[SecItemAdd] {
  acct = device_id;
  svce = "com.demo.app";
  v_Data = <61626331 3233>;
}
[SecItemCopyMatching] {
  acct = device_id;
  svce = "com.demo.app";
}
```

### 4. 结论

```md
- Keychain service：`com.demo.app`
- account：`device_id`
- 写入动作：首次启动
- 读取动作：每次启动
- 是否明文：需要把 `v_Data` 转 UTF-8 后确认
- 风险：退出登录未删除设备标识，隐私策略需确认
```

## 案例五：检查 URL Scheme 是否暴露敏感动作

### 场景

自有 App 支持：

```text
demoapp://open?path=...
```

要确认外部 App 或 Safari 能否通过 scheme 打开敏感页面。

### 1. 静态查 scheme

```bash
plutil -p Payload/Demo.app/Info.plist | rg -A 20 CFBundleURLTypes
```

输出：

```text
"CFBundleURLSchemes" => [
  0 => "demoapp"
]
```

### 2. 模拟器打开

```bash
xcrun simctl openurl booted 'demoapp://open?path=profile'
```

再试敏感路径：

```bash
xcrun simctl openurl booted 'demoapp://open?path=pay'
```

### 3. Hook URL 处理入口

旧式 AppDelegate：

```js
if (ObjC.available) {
  const cls = ObjC.classes.AppDelegate;
  const method = cls['- application:openURL:options:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      console.log('[openURL]', new ObjC.Object(args[3]).toString());
    },
    onLeave(retval) {
      console.log('[openURL ret]', retval);
    }
  });
}
```

SceneDelegate：

```js
if (ObjC.available && ObjC.classes.SceneDelegate) {
  const cls = ObjC.classes.SceneDelegate;
  const method = cls['- scene:openURLContexts:'];

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      console.log('[scene openURLContexts]', new ObjC.Object(args[3]).toString());
    }
  });
}
```

### 4. 观察路由函数

如果日志里只有 URL，还要继续找业务路由类：

```js
for (const name in ObjC.classes) {
  if (name.toLowerCase().indexOf('router') >= 0 || name.toLowerCase().indexOf('deeplink') >= 0) {
    console.log(name);
  }
}
```

Hook 例如：

```js
const Router = ObjC.classes.DMDeepLinkRouter;
Interceptor.attach(Router['- handleURL:'].implementation, {
  onEnter(args) {
    console.log('[router]', new ObjC.Object(args[2]).toString());
  }
});
```

### 5. 复盘

```md
- Scheme：`demoapp://`
- 入口：`application:openURL:options:`
- 路由类：`DMDeepLinkRouter`
- 敏感路径：`pay`
- 验证结果：未登录时仍进入支付页，需要加登录态校验
- 修复建议：路由层统一校验登录态和来源参数
```
