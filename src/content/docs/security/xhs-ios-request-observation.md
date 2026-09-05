---
title: 小红书 iOS 接口清单
description: 小红书 iOS 相关接口方法、路径和用途整理，仅用于学习测试，不包含完整参数、签名、Cookie、Token 或可复用调用流程。
---

以下内容仅整理接口方法、路径和大致用途，作为学习测试与接口分类参考。不包含完整参数、请求体、签名、Cookie、Token、设备标识、账号信息或可直接复用的调用方式。

## 启动与系统配置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v1/system_service/launch` | App 启动服务。 |
| `GET` | `/api/sns/v1/system_service/config` | 系统配置。 |
| `GET` | `/api/sns/v2/system_service/config` | 新版系统配置。 |
| `GET` | `/api/sns/v2/system_service/splash_config` | 开屏配置。 |
| `POST` | `/api/sns/v2/system_service/splash_async_optimization` | 开屏异步优化。 |
| `GET` | `/api/sns/v2/guide/home_guide` | 首页引导配置。 |
| `GET` | `/api/sns/v2/guide/user_guide` | 用户引导配置。 |
| `GET` | `/api/sns/v2/guide/user_banner` | 用户页横幅或引导配置。 |
| `GET` | `/api/sns/celestial/v2/connect/config` | 连接配置。 |
| `POST` | `/api/sns/capa/servicegw/v1/guide_event` | 引导事件上报。 |

## 内容流与笔记

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/v1/note/detailfeed/preload` | 笔记详情预加载。 |
| `GET` | `/api/sns/v1/note/imagefeed` | 图文笔记流。 |
| `GET` | `/api/sns/v6/sketchfeed` | 内容流。 |
| `POST` | `/api/sns/v2/note/widgets` | 笔记组件信息。 |
| `GET` | `/api/sns/v4/note/user/posted` | 用户发布笔记。 |
| `GET` | `/api/sns/v1/note/video_played` | 视频播放记录。 |
| `POST` | `/api/sns/v1/note/videofeed/exit` | 退出视频流。 |

## 笔记互动

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/sns/v1/note/like` | 笔记点赞。 |
| `POST` | `/api/sns/v1/note/dislike` | 笔记负反馈。 |
| `GET` | `/api/sns/v1/note/liked` | 点赞相关列表或状态。 |
| `GET` | `/api/sns/v1/note/faved` | 收藏相关列表或状态。 |
| `GET` | `/api/sns/v1/note/collection/list` | 笔记收藏合集。 |
| `POST` | `/api/sns/v1/note/metrics_report` | 笔记指标上报。 |

## 评论

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v5/note/comment/list` | 笔记评论列表。 |
| `POST` | `/api/sns/v1/interaction/comment/prepost` | 评论发布前检查。 |
| `POST` | `/api/sns/v1/interaction/comment/post` | 发布评论。 |
| `POST` | `/api/sns/v1/interaction/comment/delete` | 删除评论。 |
| `POST` | `/api/sns/v1/interaction/comment/like` | 评论点赞。 |
| `POST` | `/api/sns/v1/interaction/comment/dislike` | 评论负反馈。 |
| `GET` | `/api/sns/v1/interaction/comment/user/interact/page` | 用户评论互动页。 |

## 用户与关系

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v3/user/me` | 当前用户信息。 |
| `GET` | `/api/sns/v3/user/info` | 用户资料。 |
| `POST` | `/api/sns/v2/user/info/predit` | 用户资料预编辑。 |
| `POST` | `/api/sns/v1/user/follow` | 关注用户。 |
| `GET` | `/api/sns/v1/user/unfollow` | 取消关注。 |
| `GET` | `/api/sns/v1/user/followers` | 粉丝列表。 |
| `GET` | `/api/sns/v2/user/followings/self` | 当前用户关注列表。 |
| `GET` | `/api/sns/v2/user/followings/extra` | 关注列表扩展信息。 |
| `GET` | `/api/sns/v5/recommend/user/explore` | 用户探索推荐。 |
| `GET` | `/api/sns/v5/recommend/user/follow_recommend` | 关注推荐。 |
| `POST` | `/api/sns/v1/user/interact/info` | 用户互动信息。 |
| `GET` | `/api/sns/user_cache/follow/rotate` | 关注缓存轮转。 |
| `POST` | `/api/sns/user_cache/offline/ack` | 离线缓存确认。 |
| `GET` | `/api/sns/v1/user/login/acct_group/list` | 登录账号组列表。 |

## 本地生活与地图

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/sns/v1/localfeed/tab_config` | 本地内容 Tab 配置。 |
| `GET` | `/api/sns/v1/local/poi/info` | POI 详情。 |
| `GET` | `/api/sns/v1/local/poi/route` | POI 路线。 |
| `GET` | `/api/sns/v1/local/poi/gettaginfo` | POI 标签信息。 |
| `GET` | `/api/sns/v1/local/poi/notefeed` | POI 笔记流。 |
| `GET` | `/api/sns/v1/local/poi/comment/page/l1` | POI 评论列表。 |
| `POST` | `/api/sns/v1/local/poi/tabs` | POI Tab 配置。 |
| `POST` | `/api/sns/v1/local/poi/comment/config` | POI 评论配置。 |
| `GET` | `/api/sns/v1/mappoi/map/filter` | 地图 POI 过滤条件。 |
| `POST` | `/api/sns/v1/mappoi/unimap/markers` | 地图点位标记。 |
| `POST` | `/api/sns/v1/mappoi/diamond/capsule` | 地图胶囊组件。 |
| `POST` | `/api/sns/v1/mappoi/upload/map/track/import/sync` | 地图轨迹同步。 |

## 消息与通知

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/im/v2/messages/unread` | 未读消息。 |
| `GET` | `/api/im/v2/messages/offline` | 离线消息。 |
| `GET` | `/api/im/v1/message/extra/offline` | 离线消息扩展信息。 |
| `GET` | `/api/sns/v1/im/get_recent_chats` | 最近聊天。 |
| `POST` | `/api/im/group/query_online_status` | 群聊在线状态。 |
| `POST` | `/api/im/private/query_online_status` | 私聊在线状态。 |
| `GET` | `/api/im/smiles/note/add` | 笔记表情资源。 |
| `GET` | `/api/im/v2/get_banner_list` | 消息 Banner。 |
| `GET` | `/api/im/share_panel/extra` | 分享面板扩展信息。 |
| `POST` | `/api/push/badge/clear` | 清理推送角标。 |
| `POST` | `/api/sns/badge/update_badge` | 更新站内角标。 |

## 上传与其他

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/media/v1/upload/permit` | 媒体上传许可。 |
| `GET` | `/api/sns/v6/message/detect` | 消息检测。 |
| `GET` | `/api/sns/v11/search/images/entrance/show` | 图片搜索入口。 |
| `POST` | `/api/sns/v1/surprisebox/submit_action` | 活动行为提交。 |
| `POST` | `/api/growth/schubert/protected/create` | 活动保护创建。 |
| `POST` | `/api/happy/v1/get_cap` | 活动能力查询。 |
| `GET` | `/api/friends/v1/info/self` | 好友自身信息。 |
| `GET` | `/api/friends/v1/info/extra` | 好友扩展信息。 |
| `GET` | `/speedtest` | 网络测速。 |
