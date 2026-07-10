# Delta for Data

## ADDED Requirements

### Requirement: 点赞表 (likes)
The system SHALL maintain a `likes` table with columns `user_id UUID REFERENCES auth.users(id)`, `trip_id UUID REFERENCES trips(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`. The composite primary key SHALL be `(user_id, trip_id)`, enforcing one like per user per trip.

#### Scenario: 用户点赞游记
- GIVEN an authenticated user has not liked a trip
- WHEN they toggle like via `POST /api/community/trips/[id]/like`
- THEN a row is inserted into `likes` with the user's UUID and the trip's ID

#### Scenario: 用户取消点赞
- GIVEN an authenticated user has previously liked a trip
- WHEN they toggle like via `DELETE /api/community/trips/[id]/like`
- THEN the corresponding row is deleted from `likes`

#### Scenario: 重复点赞被阻止
- GIVEN an authenticated user has already liked a trip
- WHEN a duplicate insert is attempted
- THEN the composite primary key constraint rejects the duplicate (or UPSERT handles it idempotently)

#### Scenario: 游记删除时点赞级联清除
- GIVEN a trip has likes
- WHEN the trip is deleted
- THEN all associated likes are removed via `ON DELETE CASCADE`

---

### Requirement: 收藏表 (favorites)
The system SHALL maintain a `favorites` table with columns `user_id UUID REFERENCES auth.users(id)`, `trip_id UUID REFERENCES trips(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`. The composite primary key SHALL be `(user_id, trip_id)`, enforcing one favorite per user per trip.

#### Scenario: 用户收藏游记
- GIVEN an authenticated user has not favorited a trip
- WHEN they toggle favorite
- THEN a row is inserted into `favorites`

#### Scenario: 用户取消收藏
- GIVEN an authenticated user has previously favorited a trip
- WHEN they toggle favorite again
- THEN the corresponding row is deleted from `favorites`

#### Scenario: 游记删除时收藏级联清除
- GIVEN a trip has favorites
- WHEN the trip is deleted
- THEN all associated favorites are removed via `ON DELETE CASCADE`

---

### Requirement: 互动计数查询
The system SHALL support returning `likes_count`, `favorites_count`, and `comments_count` alongside trip data in community API responses. Counts SHALL be computed via Supabase subqueries or separate aggregated queries.

#### Scenario: 社区列表包含互动计数
- GIVEN published trips with various like, favorite, and comment counts
- WHEN `GET /api/community/trips` is called
- THEN each trip in the response includes `likes_count`, `favorites_count`, and `comments_count`

#### Scenario: 社区详情包含用户互动状态
- GIVEN an authenticated user viewing a community trip detail
- WHEN `GET /api/community/trips/[id]` is called
- THEN the response includes `has_liked` and `has_favorited` boolean flags for the current user

---

## MODIFIED Requirements

### Requirement: 评论表升级
The `comments` table SHALL be modified to include `user_id UUID NOT NULL REFERENCES auth.users(id)`. The existing `author_name` column SHALL be retained for display (synced from profiles at insert time). Only registered users SHALL be able to create comments. All existing anonymous comment data SHALL be removed as part of this migration.

(Previously: `comments` had `author_name TEXT` with no user association. Anonymous visitors could submit comments pending approval.)

#### Scenario: 注册用户发表评论
- GIVEN an authenticated user viewing a community trip detail
- WHEN they submit a comment
- THEN the comment is inserted with `user_id = auth.uid()` and `author_name` synced from their profile's `display_name`

#### Scenario: 未登录用户无法评论
- GIVEN an unauthenticated visitor viewing a community trip detail
- WHEN the comment submission is attempted
- THEN HTTP 401 is returned

#### Scenario: 历史匿名评论被清除
- GIVEN the `comments` table contains rows without `user_id`
- WHEN the migration to add `user_id NOT NULL` is executed
- THEN all existing rows are deleted before the NOT NULL constraint is applied

#### Scenario: 评论与用户关联
- GIVEN a comment is displayed
- WHEN the comment author's information is needed
- THEN `display_name` from profiles or the stored `author_name` column is shown with a link to `/users/[user_id]`
