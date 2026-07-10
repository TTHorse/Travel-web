# Delta for UI

## ADDED Requirements

### Requirement: 社区聚合页
The system SHALL provide a community page at `/community` where all published trips from all users are displayed in a card grid. The page SHALL support switching between "最新" (newest first) and "最热" (most likes first) sorting. Each card SHALL display: cover image, title, destination, author display name + avatar, likes count, comments count.

#### Scenario: 默认展示最新游记
- GIVEN there are published trips from multiple users
- WHEN a visitor navigates to `/community`
- THEN trips are displayed in a responsive card grid, sorted by `created_at` descending

#### Scenario: 切换到最热排序
- GIVEN a visitor is on `/community`
- WHEN they click the "最热" tab
- THEN trips are re-sorted by `likes_count` descending

#### Scenario: 空社区状态
- GIVEN no trips are published
- WHEN a visitor navigates to `/community`
- THEN a friendly empty state is displayed: "还没有游记，成为第一个分享的人吧！" with a link to `/admin/trips/new` (if logged in) or `/admin/login` (if not)

#### Scenario: 游记卡片显示作者信息
- GIVEN a trip card in the community feed
- WHEN the card renders
- THEN the author's display name and avatar are visible, both linking to `/users/[user_id]`

---

### Requirement: 社区游记详情页
The system SHALL provide a community trip detail page at `/community/trips/[slug]` independent from `/trips/[slug]`. The page SHALL display: trip content (title, destination, dates, content body, photos), author card (avatar + display name + link to user profile), like button with count, favorite button with count, and comment section.

#### Scenario: 查看社区游记详情
- GIVEN a visitor navigates to `/community/trips/[slug]`
- WHEN the page loads
- THEN the full trip content is displayed with author card, interaction buttons, and comment section

#### Scenario: 点赞游记
- GIVEN a logged-in user viewing a community trip detail
- WHEN they click the 👍 button
- THEN the like is toggled (on/off), the count updates in real time, and the button shows active/filled state

#### Scenario: 收藏游记
- GIVEN a logged-in user viewing a community trip detail
- WHEN they click the ☆ button
- THEN the favorite is toggled (on/off), the count updates, and the button shows filled/outline state

#### Scenario: 未登录用户点击互动按钮
- GIVEN an unauthenticated visitor viewing a community trip detail
- WHEN they click the like or favorite button
- THEN they are prompted to log in (redirect to `/admin/login` or show a toast)

#### Scenario: 社区详情页与 /trips/[slug] 独立
- GIVEN both `/trips/[slug]` and `/community/trips/[slug]` exist
- WHEN a trip is accessed via each route
- THEN the `/trips/[slug]` page renders with the existing non-community layout (no author card, no like/favorite buttons), and `/community/trips/[slug]` renders with the full community layout

---

### Requirement: 用户主页
The system SHALL provide a user profile page at `/users/[id]` displaying the user's display name, avatar, join date, total trip count, total country count, and a grid of their published trips. The page SHALL include a tab to switch between "游记" (published trips) and "收藏" (favorited trips, publicly visible).

#### Scenario: 查看用户主页
- GIVEN a user has published trips
- WHEN a visitor navigates to `/users/[id]`
- THEN the user's display name, avatar, join date, trip count, and country count are displayed, followed by a grid of their published trips

#### Scenario: 查看用户收藏
- GIVEN a user has favorited trips
- WHEN a visitor clicks the "收藏" tab on `/users/[id]`
- THEN a grid of the user's favorited trips is displayed

#### Scenario: 用户不存在
- GIVEN an invalid user ID
- WHEN a visitor navigates to `/users/[id]`
- THEN a 404 page or friendly message "用户不存在" is displayed

#### Scenario: 从游记卡片导航到作者主页
- GIVEN a community trip card showing author info
- WHEN a visitor clicks the author's name or avatar
- THEN they navigate to `/users/[user_id]`

---

### Requirement: 评论组件（社区版）
The system SHALL provide a comment section component for community trip detail pages. Only authenticated users SHALL see the comment input form. All visitors SHALL see approved comments. Each comment SHALL display the author's display name (linked to `/users/[id]`), timestamp, and content. Nested replies SHALL be supported via `parent_id`.

#### Scenario: 已登录用户发表评论
- GIVEN a logged-in user viewing a community trip detail
- WHEN they type a comment and submit
- THEN the comment appears in the list with their display name and avatar

#### Scenario: 未登录用户看到登录提示
- GIVEN an unauthenticated visitor viewing a community trip detail
- WHEN the comment section renders
- THEN a prompt "登录后参与讨论" is shown with a link to `/admin/login`, and no input form is displayed

#### Scenario: 回复评论
- GIVEN a logged-in user viewing existing comments
- WHEN they click "回复" on a comment
- THEN a reply input appears nested under that comment, and the submitted reply is displayed indented with `parent_id` set

---

## MODIFIED Requirements

### Requirement: 导航栏
The system SHALL display a "社区" navigation link in the main navbar between "旅行" and "画廊". The link SHALL be visible to all visitors (authenticated or not).

(Previously: The navbar had links: 首页, 旅行, 画廊. Now "社区" is added.)

#### Scenario: 导航栏显示社区入口
- GIVEN any visitor on the site
- WHEN the navbar renders
- THEN a "社区" link pointing to `/community` is visible

#### Scenario: 社区链接高亮
- GIVEN a visitor is on any `/community` route or `/users/[id]` route
- WHEN the navbar renders
- THEN the "社区" link shows active state (white text with background highlight)
