---
title: 安全与逆向
description: 安全基础、逆向工程入门、工具认知、合法分析流程和常见问题整理。
---

# 安全与逆向

这里整理安全和逆向相关的基础知识。内容只面向合法授权的软件分析、兼容性排查、漏洞修复、恶意样本识别和学习研究，不记录绕过授权、破解商业软件或攻击他人系统的操作。

## 内容

| 页面 | 内容 |
| --- | --- |
| [逆向基础知识](/security/reverse-engineering-basics) | 静态分析、动态分析、文件格式、调试、反汇编、常见工具和问题 |
| [Frida 使用指南与常见问题](/security/frida-usage-guide) | Frida 安装连接、Java Hook、Native Hook、RPC、日志调试和常见问题 |
| [Frida 实战脚本模板](/security/frida-practical-recipes) | Android 网络、加密、存储、WebView、动态加载和 Native Hook 常用脚本 |
| [Ghidra 使用指南](/security/ghidra-usage-guide) | Ghidra 项目导入、自动分析、反编译、结构恢复、脚本和常见问题 |
| [radare2 使用指南](/security/radare2-usage-guide) | radare2 命令行逆向、字符串、交叉引用、调试、patch 和 r2pipe |
| [Wireshark 使用指南](/security/wireshark-usage-guide) | 抓包过滤、DNS、TCP、TLS、HTTP、tshark、Python 解析和排错 |
| [iOS 应用分析与砸壳概念入门](/security/ios-app-analysis-guide) | iOS IPA、Mach-O、符号、Objective-C、Frida 调试和授权样本分析 |
| [常见移动 App URL Scheme 整理](/security/mobile-app-url-schemes) | 抖音、快手、小红书、微信、微博、B站等常见 scheme、验证命令和排查方法 |
| [小红书 iOS 接口清单](/security/xhs-ios-request-observation) | iOS 相关接口方法、路径和用途整理 |
| [小红书 Web 接口清单](/security/xhs-web-request-observation) | PC Web 相关接口方法、路径和用途整理 |
| [小红书 Android 接口清单](/security/xhs-android-request-observation) | Android 相关接口方法、路径和用途整理 |
| [抖音 Web 接口清单](/security/douyin-web-request-observation) | 抖音 PC Web 相关接口方法、路径和用途整理 |
| [抖音 Web X-Bogus 逆向分析](/security/douyin-x-bogus-reverse-notes) | X-Bogus 参数断点定位、补环境、算法分析和乱码生成 |
| [Android 微信朋友圈发布流程逆向学习笔记](/security/wechat-android-moments-reverse-notes) | Android 客户端页面、点击事件、文本输入和发布链路分析 |
| [PC 微信消息撤回机制逆向学习笔记](/security/wechat-pc-message-recall-reverse-notes) | PC 客户端消息显示、内存变化、调用链定位和版本差异分析 |

## 学习边界

逆向学习前先明确边界：

- 只分析自己拥有、被授权或用于学习的样本。
- 不传播破解、绕授权和攻击性成果。
- 不在生产环境随意运行未知样本。
- 不把可疑样本上传到公开环境前先确认合规要求。
- 分析过程保留记录，方便复盘和交接。
