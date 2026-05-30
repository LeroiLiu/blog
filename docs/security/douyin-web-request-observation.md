---
title: 抖音 Web 接口清单
description: 抖音 PC Web 相关接口方法、路径和用途整理，仅用于学习测试，不包含完整参数、Cookie、签名、Token 或可复用调用流程。
---

# 抖音 Web 接口清单

以下内容仅整理接口方法、路径和大致用途，作为学习测试与接口分类参考。不包含完整参数、请求体、签名、Cookie、Token、设备标识、账号信息或可直接复用的调用方式。

## 监控、埋点与配置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/monitor_web/settings/browser-settings` | 浏览器监控配置。 |
| `POST` | `/monitor_browser/collect/batch/` | 浏览器监控批量上报。 |
| `POST` | `/api/metrics/emit` | 安全或风控指标上报。 |
| `GET` | `/list` | 前端事件或埋点上报。 |
| `POST` | `/list` | 前端事件或埋点上报。 |
| `POST` | `/vc/setting` | 视频或客户端配置。 |
| `POST` | `/service/2/abtest_config/` | AB 实验配置。 |
| `GET` | `/get_domains/v5/` | 域名调度配置。 |
| `GET` | `/aweme/v1/web/mobile/ab/params/` | Web AB 参数。 |

## 首页、推荐与内容流

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/aweme/v1/web/tab/feed/` | Tab 内容流。 |
| `POST` | `/aweme/v2/web/module/feed/` | 模块内容流。 |
| `GET` | `/aweme/v1/web/aweme/post/` | 用户作品列表。 |
| `GET` | `/aweme/v1/web/mix/list/` | 合集列表。 |
| `GET` | `/aweme/v1/web/mix/listcollection/` | 合集收藏列表。 |
| `GET` | `/aweme/v1/web/mix/watch/record/` | 合集观看记录。 |
| `GET` | `/aweme/v1/web/series/list/` | 短剧或系列列表。 |
| `GET` | `/aweme/v1/web/series/watch/record/` | 系列观看记录。 |
| `POST` | `/aweme/v1/web/multi/aweme/detail/` | 多作品详情。 |
| `GET` | `/aweme/v1/web/douyin/select/tab/course/catagory/tag/` | 精选课程分类标签。 |
| `GET` | `/aweme/v1/web/douyin/select/tab/course/catagory/video/` | 精选课程分类视频。 |

## 视频播放与进度

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/aweme/v1/web/play/progress/` | 视频播放进度上报。 |
| `POST` | `/aweme/v1/web/history/write/` | 观看历史写入。 |
| `POST` | `/aweme/v2/web/aweme/stats/` | 作品播放或互动统计。 |
| `GET` | `/aweme/v1/web/social/count` | 社交互动数量。 |
| `GET` | `/aweme/v1/web/danmaku/conf/get/` | 弹幕配置。 |
| `GET` | `/aweme/v1/web/multicast/query/` | 多播或播放状态查询。 |
| `GET` | `/video/tos/.../media-video-hvc1/` | 视频媒体分片。 |
| `GET` | `/video/tos/.../media-audio-und-mp4a/` | 音频媒体分片。 |

## 用户、账号与设置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/aweme/v1/web/user/profile/self/` | 当前用户资料。 |
| `GET` | `/aweme/v1/web/user/profile/other/` | 其他用户资料。 |
| `GET` | `/aweme/v1/web/user/profile/scene/` | 用户资料场景信息。 |
| `GET` | `/aweme/v1/web/query/user/` | 用户查询。 |
| `GET` | `/aweme/v1/web/query/account/type/` | 账号类型查询。 |
| `GET` | `/aweme/v1/web/user/settings/` | 用户设置。 |
| `GET` | `/aweme/v1/web/get/user/settings` | 用户设置查询。 |
| `GET` | `/aweme/v1/web/custom/settings/get/` | 自定义设置查询。 |
| `GET` | `/aweme/v1/web/app/installed/` | App 安装状态。 |
| `POST` | `/aweme/v1/web/commit/follow/user/` | 关注用户。 |

## 互动、收藏与评论

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/aweme/v1/web/commit/item/digg/` | 作品点赞。 |
| `POST` | `/aweme/v1/web/aweme/collect/` | 收藏作品。 |
| `GET` | `/aweme/v1/web/aweme/favorite/` | 收藏状态或收藏信息。 |
| `GET` | `/aweme/v1/web/collects/list/` | 收藏列表。 |
| `GET` | `/aweme/v1/web/comment/list/` | 评论列表。 |
| `POST` | `/aweme/v1/web/comment/publish` | 发布评论。 |
| `POST` | `/aweme/v1/web/comment/delete` | 删除评论。 |
| `GET` | `/aweme/v1/web/notice/count/` | 通知数量。 |
| `GET` | `/aweme/v1/web/external/notification/` | 外部通知。 |

## 搜索与建议

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/aweme/v1/web/hot/search/list/` | 热搜列表。 |
| `GET` | `/aweme/v1/web/api/suggest_words/` | 搜索建议词。 |
| `GET` | `/aweme/v1/web/web_shorten/` | 短链或链接转换。 |

## IM 与会话

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/v2/conversation/get_info_list` | 会话信息列表。 |
| `POST` | `/v2/conversation/create` | 创建会话。 |
| `POST` | `/v3/conversation/get_min_index` | 会话最小索引。 |
| `POST` | `/v3/conversation/get_read_index` | 会话已读索引。 |
| `POST` | `/v3/conversation/mark_read` | 会话标记已读。 |
| `POST` | `/v1/conversation/batch_get_conversation_participants_readindex` | 批量获取会话参与者已读索引。 |
| `POST` | `/v1/stranger/get_conversation_list` | 陌生人会话列表。 |
| `POST` | `/v1/message/get_by_conversation` | 按会话获取消息。 |
| `POST` | `/v1/message/get_user_message` | 获取用户消息。 |
| `POST` | `/v1/message/get_message_by_init` | 初始化获取消息。 |
| `POST` | `/v1/message/send` | 发送消息。 |
| `POST` | `/v1/message/recall` | 撤回消息。 |
| `POST` | `/aweme/v1/web/im/user/info/` | IM 用户信息。 |
| `POST` | `/aweme/v1/web/im/user/active/status/` | 用户在线状态。 |
| `GET` | `/aweme/v1/web/im/user/active/config/get` | 在线状态配置。 |
| `GET` | `/aweme/v1/web/im/user/active/update/` | 在线状态更新。 |
| `GET` | `/aweme/v1/web/im/spotlight/relation/` | IM 关系信息。 |
| `POST` | `/aweme/v1/web/im_communication/msg_read_switch/` | 消息已读开关。 |
| `POST` | `/aweme/v1/web/im_communication/share_report/` | IM 分享上报。 |
| `POST` | `/aweme/v1/web/im/get/online_feedback/entrance/` | 在线反馈入口。 |
| `POST` | `/aweme/v1/im/consistency/action/report` | IM 一致性行为上报。 |

## 表情、资源与组件

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/aweme/v1/web/emoji/list` | 表情列表。 |
| `GET` | `/aweme/v1/web/im/resource/emoticon/search/` | 表情搜索。 |
| `GET` | `/aweme/v1/web/im/resources/emoticon/trending` | 热门表情。 |
| `GET` | `/aweme/v1/web/im/resource/list/aggregation` | IM 资源聚合列表。 |
| `GET` | `/aweme/v1/web/im/resource/list/aggregation/` | IM 资源聚合列表。 |
| `GET` | `/aweme/v1/web/solution/resource/list/` | 方案资源列表。 |
| `GET` | `/pcim_saas_vmok_entry/vmok-manifest.json` | PC IM 资源清单。 |
| `GET` | `/recharge_web_vmok/vmok-manifest.json` | 充值页面资源清单。 |
| `GET` | `/vmok-manifest.json` | 前端模块资源清单。 |

## 直播相关

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/webcast/setting/` | 直播配置。 |
| `GET` | `/webcast/distribution/check_user_live_status/` | 用户直播状态检查。 |
| `GET` | `/webcast/dress/list/` | 直播装扮列表。 |
| `GET` | `/webcast/im/fetch/preview/` | 直播 IM 预览。 |
| `GET` | `/webcast/room/info_by_scene/` | 直播间场景信息。 |
| `GET` | `/webcast/linkmic_audience/list/v2/` | 连麦观众列表。 |
| `GET` | `/webcast/linkmic_audience/get_play_mode_info/` | 连麦播放模式信息。 |
| `GET` | `/webcast/linkmic_profit/order_sing_list_user_microphone/` | 连麦或点唱麦位信息。 |
| `GET` | `/webcast/web/feed/follow/` | 关注直播流。 |
| `GET` | `/webcast/web/live/watermark/` | 直播水印。 |
| `GET` | `/webcast/diamond/` | 直播钻石或充值相关信息。 |
| `GET` | `/media/stream-...flv` | 直播流媒体。 |
| `GET` | `/stage/stream-...flv` | 直播舞台流媒体。 |

## 登录、安全与通行证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/passport/general/login_guiding_strategy/` | 登录引导策略。 |
| `GET` | `/passport/safe/get_identity_security_token/` | 身份安全令牌。 |
| `GET` | `/passport/token/beat/web/` | Web 登录态心跳。 |
| `POST` | `/passport/ticket_guard/get_client_cert/` | 客户端证书。 |
| `POST` | `/passport/user_info/get_sec_ts/` | 用户安全时间戳。 |
| `POST` | `/passport/web/challenge/` | Web 安全挑战。 |
| `POST` | `/ttwid/check/` | 设备或浏览器标识检查。 |
| `POST` | `/web/common` | 安全 SDK 通用接口。 |
| `POST` | `/web/r/token` | 安全 SDK Token。 |
| `POST` | `/sdk/get_peer` | 安全或通信节点获取。 |

## 调查、反馈与活动

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/athena/survey/platform/task/show/` | 问卷任务展示。 |
| `POST` | `/athena/survey/platform/action/report/` | 问卷行为上报。 |
| `GET` | `/aweme/v1/web/activity/pull/carnival/` | 活动拉取。 |
| `POST` | `/aweme/v1/web/fancy/qrcode/info/` | 二维码信息。 |
| `GET` | `/aweme/v1/creator/external/highlight/` | 创作者高亮信息。 |
| `GET` | `/douplus/api/icon_control` | DOU+ 图标控制。 |
| `POST` | `/cloudpush/update_sender/` | 云推送发送方更新。 |
| `POST` | `/aweme/v1/web/page/turn/offline` | 页面离线或关闭上报。 |

## 静态资源与模型文件

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/obj/.../index-ad-22.js` | 前端广告脚本资源。 |
| `GET` | `/obj/.../comment_preload_model822.bytenn` | 评论预加载模型。 |
| `GET` | `/obj/.../home_preload.bytenn` | 首页预加载模型。 |
| `GET` | `/obj/tcc-config-web/tcc-v2-data-douyin.pc.web-default` | Web 配置资源。 |
| `GET` | `/byted/webplayer-extensions/.../live-decrytion.js` | 播放器扩展脚本。 |
| `GET` | `/obj/media-fe/codec/high/decoder_1656041798666.js` | 播放解码脚本。 |
| `GET` | `/obj/ies.fe.effect/...mp4` | 特效资源。 |
