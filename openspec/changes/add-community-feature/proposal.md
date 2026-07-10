# Proposal: 社区功能

## Intent

当前站点是单用户游记展示站——作者在后台创建行程、发布后出现在 `/trips` 列表。用户注册功能已上线，但发布后的游记散落在 `/trips` 列表里，没有多用户聚合与互动能力。用户之间无法发现彼此、无法互动、缺少归属感。

本次变更引入社区模块：所有用户发布的行程汇集到 `/community` 广场、支持点赞与收藏两种互动、每个用户拥有独立主页展示其游记作品集。`/trips` 模块保持不动，社区是独立平行的新模块。

## Scope

**包含：**
- `/community` — 全站游记聚合页，支持"最新"/"最热"排序切换
- `/community/trips/[slug]` — 社区专属游记详情页（独立于 `/trips/[slug]`）
- `/users/[id]` — 用户主页（头像、简介、ta 的游记列表、ta 的收藏展示）
- 👍 点赞功能：`likes` 表，一人一游记只能点赞一次（再次点击取消）
- ☆ 收藏功能：`favorites` 表，一人一游记只能收藏一次（再次点击取消）
- 💬 评论升级：`comments` 表添加 `user_id NOT NULL`，仅注册用户可评论（清空历史匿名评论数据）
- 导航栏新增 "社区" 入口
- 互动计数展示：游记卡片上显示点赞数、评论数、收藏数

**不包含：**
- 评论通知系统（留待后续）
- 关注/粉丝关系
- 浏览量统计
- 社区搜索（留待后续）
- 内容审核/举报流程
- `/trips` 模块的改动

## Capabilities

### New Capabilities
- `community`: 多用户游记聚合广场，包含列表页、详情页、点赞、收藏、评论

### Modified Capabilities
- `data`: `comments` 表升级（关联注册用户），新增 `likes` 和 `favorites` 表
- `ui`: 导航栏新增 "社区" 入口
- `architecture`: 新增 `/community`、`/community/trips/[slug]`、`/users/[id]` 路由及对应 API 端点

## Impact

- 数据库：新增 2 张表（`likes`、`favorites`），修改 1 张表（`comments` 添加 `user_id` 列）
- API：新增 4 个端点（社区游记列表、详情、点赞/取消、收藏/取消）
- 页面：新增 3 个路由（社区列表、社区详情、用户主页）
- 组件：新增 `CommunityCard`、`UserCard`、`LikeButton`、`FavoriteButton`、`CommentSection` 等
- `/trips` 模块零改动
