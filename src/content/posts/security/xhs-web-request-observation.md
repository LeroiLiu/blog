---
title: 小红书 Web 接口清单
description: 小红书 PC Web 相关接口方法、路径和用途整理，仅用于学习测试，不包含完整参数、Cookie、签名、Token 或可复用调用流程。
---

以下内容仅整理接口方法、路径和大致用途，作为学习测试与接口分类参考。不包含完整参数、请求体、签名、Cookie、Token、设备标识、账号信息或可直接复用的调用方式。

## 埋点与前端监控

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v2/collect` | 页面访问、路由变化、曝光、点击等前端行为采集。 |
| `POST` | `/api/data` | 前端性能、异常、加载状态或监控数据上报。 |
| `POST` | `/api/sns/web/v1/note/metrics_report` | Web 笔记指标上报。 |
| `POST` | `/api/sns/v1/history/report_web` | Web 浏览历史或访问行为上报。 |

## 安全与环境校验

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/p/pj` | Web 页面环境或初始化校验。 |
| `POST` | `/api/sec/v1/scripting` | 脚本、安全或环境检测。 |
| `POST` | `/api/sec/v1/sbtsource` | 安全来源或浏览器环境检测。 |
| `POST` | `/api/sec/v1/shield/webprofile` | Web 安全画像。 |
| `POST` | `/api/redcaptcha/v2/getconfig` | 验证码配置。 |

## 用户与登录态

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/web/v2/user/me` | 当前 Web 用户信息。 |
| `GET` | `/api/sns/web/v1/user/hover_card` | 用户悬浮卡片信息。 |
| `GET` | `/api/sns/web/v1/board/user` | 用户主页或用户面板。 |
| `GET` | `/api/sns/web/unread_count` | Web 未读数量。 |
| `GET` | `/api/sns/web/v2/note/collect/page` | 用户收藏笔记分页。 |

## 首页、内容流与笔记

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/web/v1/homefeed` | Web 首页推荐流。 |
| `POST` | `/api/sns/web/v1/feed` | Web 内容流。 |
| `POST` | `/api/sns/web/v2/widgets` | Web 笔记组件信息。 |
| `GET` | `/api/sns/web/v1/homefeed/category` | 首页内容分类。 |
| `GET` | `/api/sns/web/v1/zones` | 页面分区或频道配置。 |
| `GET` | `/api/sns/web/global/config` | Web 全局配置。 |
| `GET` | `/api/sns/web/v1/system/config` | Web 系统配置。 |

## 评论与互动

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/web/v2/comment/page` | Web 评论分页列表。 |
| `GET` | `/api/sns/web/v2/comment/sub/page` | Web 子评论分页。 |
| `POST` | `/api/sns/web/share/code` | 分享码或分享信息。 |
| `POST` | `/api/sns/web/v2/widgets` | 笔记互动组件信息。 |

## 搜索与推荐

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/web/v1/search/querytrending` | 搜索趋势词。 |
| `GET` | `/api/sns/web/v1/search/trending/query` | 搜索热词或趋势查询。 |
| `GET` | `/api/sns/web/v1/search/recommend` | 搜索推荐。 |
| `GET` | `/api/sns/web/v1/search/filter` | 搜索筛选配置。 |
| `POST` | `/api/sns/web/v1/search/onebox` | 搜索 OneBox 结果。 |
| `POST` | `/api/sns/web/v2/search/notes` | Web 笔记搜索。 |
| `POST` | `/api/sns/web/search/history/sync` | 搜索历史同步。 |
| `GET` | `/api/sns/web/v1/dqa/recommend/query` | 问答或推荐查询。 |
| `POST` | `/api/sns/web/v1/dqa/instant` | 即时问答或联想请求。 |

## 静态资源与页面配置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/data/sem_sdk` | 页面 SDK 配置。 |
| `GET` | `/data/xhs_pc_nps` | PC 页面问卷或体验反馈配置。 |
| `GET` | `/fe-platform/...png` | 前端静态图片资源。 |
| `GET` | `/as/v2/ds/...js` | 前端脚本资源。 |
| `GET` | `/api/im/redmoji/version` | 表情资源版本。 |
