# Delta for Architecture

## ADDED Requirements

### Requirement: 社区路由结构
The system SHALL serve three new publicly accessible routes: `/community` (trip aggregation feed), `/community/trips/[slug]` (community trip detail), and `/users/[id]` (user profile). These routes SHALL NOT be protected by the `/admin/*` authentication proxy. Community data is read-accessible to all visitors; like, favorite, and comment mutations SHALL require authentication.

#### Scenario: 访客浏览社区
- GIVEN an unauthenticated visitor
- WHEN they navigate to `/community`
- THEN the community feed is displayed showing published trips from all users

#### Scenario: 点击游记进入社区详情
- GIVEN a visitor on `/community`
- WHEN they click a trip card
- THEN they navigate to `/community/trips/[slug]` showing trip content, likes count, favorites count, and comments

#### Scenario: 查看用户主页
- GIVEN a visitor on any community page
- WHEN they click an author's name or avatar
- THEN they navigate to `/users/[id]` showing that user's published trips and stats

#### Scenario: 社区路由不受 admin proxy 保护
- GIVEN the proxy matcher is `["/admin/:path*"]`
- WHEN a request hits `/community` or `/users/[id]`
- THEN the request passes through without session validation

---

### Requirement: 社区 API 端点
The system SHALL provide the following API endpoints under `src/app/api/`:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/community/trips` | GET | No | List published trips with interaction counts |
| `/api/community/trips/[id]` | GET | No | Single trip detail with interaction counts |
| `/api/community/trips/[id]/like` | POST/DELETE | Yes | Toggle like on a trip |
| `/api/community/trips/[id]/favorite` | POST/DELETE | Yes | Toggle favorite on a trip |
| `/api/community/trips/[id]/comments` | GET/POST | GET: No, POST: Yes | List or create comments |
| `/api/users/[id]` | GET | No | User profile + published trips |
| `/api/users/[id]/favorites` | GET | No | User's favorited trips |

#### Scenario: 获取社区游记列表
- GIVEN there are published trips in the database
- WHEN `GET /api/community/trips?sort=newest&page=1` is called
- THEN a paginated list of trips is returned with `likes_count`, `favorites_count`, `comments_count`, and author `display_name`

#### Scenario: 点赞需要认证
- GIVEN an unauthenticated request to `POST /api/community/trips/[id]/like`
- WHEN the request is processed
- THEN HTTP 401 is returned

#### Scenario: 取消点赞
- GIVEN an authenticated user who has already liked a trip
- WHEN they call `DELETE /api/community/trips/[id]/like`
- THEN the like record is deleted and the user can like again

---

## MODIFIED Requirements

### Requirement: Route Structure
All public page routes SHALL be under `src/app/`. The following routes are added:

| Route | Auth Required | Purpose |
|-------|:---:|---------|
| `/community` | No | Community trip aggregation feed |
| `/community/trips/[slug]` | No | Community trip detail page |
| `/users/[id]` | No | User profile page |

(Previously: No community routes existed. Now three new public routes are added alongside existing `/trips`, `/gallery`, `/map`.)

#### Scenario: 社区路由与现有路由共存
- GIVEN the route structure
- WHEN a visitor navigates
- THEN `/trips` serves the existing single-user listing, `/community` serves the multi-user community feed, and both are independently accessible
