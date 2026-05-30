---
title: 小红书 Android 接口清单
description: 小红书 Android 相关接口方法、路径和用途整理，仅用于学习测试，不包含完整参数、Cookie、签名、Token 或可复用调用流程。
---

# 小红书 Android 接口清单

以下内容仅整理接口方法、路径和大致用途，作为学习测试与接口分类参考。不包含完整参数、请求体、签名、Cookie、Token、设备标识、账号信息或可直接复用的调用方式。

## 启动、系统配置与实验

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v1/system_service/launch` | App 启动服务。 |
| `GET` | `/api/sns/v1/system_service/config` | 系统配置。 |
| `GET` | `/api/sns/v2/system_service/config` | 新版系统配置。 |
| `GET` | `/api/sns/v2/system_service/splash_config` | 开屏配置。 |
| `POST` | `/api/sns/v2/system_service/splash_async_optimization` | 开屏异步优化。 |
| `GET` | `/api/sns/v3/system_service/flag_exp` | 实验或开关配置。 |
| `GET` | `/api/sns/v1/system/service/ui/config` | UI 配置。 |
| `GET` | `/api/sns/v1/system/cold_start_config` | 冷启动配置。 |
| `GET` | `/api/sns/v1/system/migration_config` | 迁移配置。 |
| `GET` | `/api/gslb/v1/domainNew` | 域名调度或网络配置。 |

## 内容流、笔记详情与组件

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/v1/note/detailfeed/preload` | 笔记详情预加载。 |
| `GET` | `/api/sns/v1/note/imagefeed` | 图文笔记流。 |
| `GET` | `/api/sns/v6/sketchfeed` | 内容流。 |
| `POST` | `/api/sns/v2/note/widgets` | 笔记组件信息。 |
| `GET` | `/api/sns/v4/note/user/posted` | 用户发布笔记。 |
| `GET` | `/api/sns/v1/note/collection/list` | 笔记合集或收藏列表。 |
| `GET` | `/api/sns/v1/note/liked` | 点赞相关列表或状态。 |
| `GET` | `/api/sns/v1/note/faved` | 收藏相关列表或状态。 |
| `GET` | `/api/sns/v1/note/atme` | 与我相关的笔记。 |
| `GET` | `/api/sns/v1/note/video_played` | 视频播放记录。 |
| `GET` | `/api/sns/v1/note/video_finished` | 视频播放完成。 |
| `POST` | `/api/sns/v1/note/videofeed/exit` | 退出视频流。 |

## 指标上报与内容反馈

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/v1/note/metrics_report` | 笔记曝光、停留、播放或互动指标上报。 |
| `POST` | `/api/sns/v1/note/like` | 笔记点赞。 |
| `POST` | `/api/sns/v1/note/dislike` | 笔记负反馈。 |
| `POST` | `/api/sns/v1/homefeed/client_downgrade/report` | 首页流降级或客户端异常上报。 |
| `POST` | `/api/sns/thoth/decision/result` | 推荐或策略结果上报。 |
| `POST` | `/api/sns/v1/system/report/user/info` | 用户状态或系统信息上报。 |

## 评论与评论互动

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v5/note/comment/list` | 笔记评论列表。 |
| `GET` | `/api/sns/v3/note/comment/sub_comments` | 子评论列表。 |
| `POST` | `/api/sns/v4/note/comment` | 评论相关动作或数据请求。 |
| `POST` | `/api/sns/v1/interaction/comment/prepost` | 评论发布前检查。 |
| `POST` | `/api/sns/v1/interaction/comment/post` | 发布评论。 |
| `POST` | `/api/sns/v1/interaction/comment/delete` | 删除评论。 |
| `POST` | `/api/sns/v1/interaction/comment/like` | 评论点赞。 |
| `POST` | `/api/sns/v1/interaction/comment/dislike` | 评论负反馈。 |
| `POST` | `/api/sns/v1/interaction/comment/collect` | 评论收藏。 |
| `POST` | `/api/sns/v1/interaction/comment/collect/cancel` | 取消评论收藏。 |
| `POST` | `/api/sns/v1/interaction/comment/public_status/set` | 评论公开状态设置。 |
| `GET` | `/api/sns/v1/interaction/comment/user/interact/page` | 用户评论互动页。 |

## 用户、关注与隐私

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v3/user/me` | 当前用户信息。 |
| `GET` | `/api/sns/v3/user/info` | 用户资料。 |
| `POST` | `/api/sns/v2/user/info/predit` | 用户资料预编辑。 |
| `POST` | `/api/sns/v1/user/interact/info` | 用户互动信息。 |
| `GET` | `/api/sns/v5/recommend/user/explore` | 用户探索推荐。 |
| `GET` | `/api/sns/v5/recommend/user/follow_recommend` | 关注推荐。 |
| `POST` | `/api/sns/v1/user/follow` | 关注用户。 |
| `GET` | `/api/sns/v1/user/unfollow` | 取消关注。 |
| `GET` | `/api/sns/v1/user/followers` | 粉丝列表。 |
| `GET` | `/api/sns/v1/user/followings` | 关注列表。 |
| `GET` | `/api/sns/v1/user/privacy` | 用户隐私配置。 |
| `GET` | `/api/sns/v1/user/privacy/declare` | 隐私声明。 |
| `POST` | `/api/sns/v1/user/privacy/declare/update` | 更新隐私声明状态。 |
| `GET` | `/api/sns/v1/user/target_user_privacy` | 目标用户隐私状态。 |
| `GET` | `/api/sns/v1/user/signoff/flow` | 注销流程。 |
| `GET` | `/api/sns/v2/user/teenager/status` | 青少年模式状态。 |
| `GET` | `/api/sns/v1/account/intervention` | 账号干预或提示。 |

## 消息与 IM

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v6/message/detect` | 消息或通知检测。 |
| `PUT` | `/api/sns/v5/message` | 消息状态更新。 |
| `GET` | `/api/sns/v2/message/message_box` | 消息盒子。 |
| `GET` | `/api/sns/v3/message/you/mentions` | 提及我的消息。 |
| `GET` | `/api/sns/v3/message/you/likes` | 赞和互动消息。 |
| `GET` | `/api/sns/v1/message/you/connections` | 连接或关系消息。 |
| `POST` | `/api/im/v2/messages/unread` | 未读消息。 |
| `GET` | `/api/im/v2/messages/offline` | 离线消息。 |
| `GET` | `/api/im/v3/chats` | 会话列表。 |
| `GET` | `/api/im/chats/group` | 群聊会话。 |
| `GET` | `/api/im/v2/get_banner_list` | 消息页 Banner。 |
| `POST` | `/api/im/users/filterUser/stranger` | 陌生人过滤。 |
| `POST` | `/api/im/activity_grouping/report_exposure` | 活动分组曝光上报。 |
| `GET` | `/api/im/smiles/note/add` | 笔记表情资源。 |

## 本地与位置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v1/localfeed/tab_config` | 本地流 Tab 配置。 |
| `GET` | `/api/sns/v1/localfeed/city_list` | 城市列表。 |
| `GET` | `/api/sns/v1/localfeed/activity` | 本地活动。 |
| `GET` | `/api/sns/v1/mappoi/footprints/privacy` | 足迹或位置隐私。 |

## 媒体、创作与模板

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/media/v1/upload/permit` | 媒体上传许可。 |
| `GET` | `/api/media/v1/upload/capa/permit` | 媒体上传能力许可。 |
| `GET` | `/api/sns/v2/media/text/style/templates` | 文本样式模板。 |
| `GET` | `/api/sns/v2/media/text/text_template/categorys` | 文本模板分类。 |
| `GET` | `/api/sns/v2/media/text/text_template/category/text_templates` | 分类下文本模板。 |
| `GET` | `/api/sns/v1/video_template/get_online_image_template_categories` | 在线图片模板分类。 |
| `POST` | `/api/sns/v1/video_template/recommend/image_template` | 推荐图片模板。 |
| `POST` | `/api/sns/v2/note/bgm_recommend_musics_v2` | BGM 推荐音乐。 |
| `GET` | `/api/sns/inspiration/text2img/load/package` | 文生图资源包加载。 |
| `GET` | `/api/sns/inspiration/ai_edit_image/load_info/comment` | AI 图片编辑加载信息。 |

## 安全、验证码与风控

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/redcaptcha/v2/app/log` | App 验证码或安全日志。 |
| `POST` | `/api/redcaptcha/faceid/precheck` | 人脸校验前置检查。 |
| `POST` | `/api/redcaptcha/faceid/check` | 人脸校验。 |
| `POST` | `/api/security/antispam/v1/restriction/self-resolve` | 反垃圾限制自助处理。 |
| `POST` | `/api/sns/v1/system/ares/check/submit/valid` | 系统校验或提交有效性检查。 |
| `POST` | `/api/sns/v1/system/query/punish/detail` | 处罚或限制详情查询。 |

## 活动、增长与其他

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/v1/surprisebox/submit_action` | 活动行为提交。 |
| `POST` | `/api/growth/schubert/share/downgrade` | 分享降级或增长策略。 |
| `POST` | `/api/growth/schubert/protected/create` | 活动保护创建。 |
| `POST` | `/api/usergrowth/mallbanner` | 增长或商城 Banner。 |
| `GET` | `/api/sns/v1/content/navigator` | 内容导航。 |
| `GET` | `/api/sns/v1/tag/reobpage` | 标签页相关接口。 |
| `GET` | `/api/push/user_authority` | 推送权限。 |
| `POST` | `/api/sns/capa/servicegw/v1/guide_event` | 引导事件上报。 |
