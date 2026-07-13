# Delta for UI

## ADDED Requirements

### Requirement: UserAvatar Component

The system SHALL provide a `UserAvatar` component in `src/components/ui/` that renders the user's avatar image when `avatar_url` is present, or a fallback showing the first character of the display name.

#### Scenario: Avatar URL present
- GIVEN `avatar_url` is a valid Cloudinary URL
- WHEN `UserAvatar` renders
- THEN an `<img>` with the URL and `rounded-full` style is displayed

#### Scenario: No avatar, display_name present
- GIVEN `avatar_url` is NULL and `displayName` is "张三"
- WHEN `UserAvatar` renders
- THEN a circular placeholder with "张" is displayed

#### Scenario: No avatar, no display_name
- GIVEN both `avatar_url` and `displayName` are NULL
- WHEN `UserAvatar` renders
- THEN a circular placeholder with a `<User>` icon is displayed

### Requirement: Profile Edit UI

The `/admin/settings` page SHALL include a「个人资料」section above the existing「修改密码」section, allowing the user to edit their display_name and upload an avatar via Cloudinary Upload Widget.

#### Scenario: Loading state
- GIVEN the settings page loads
- WHEN the profile data is being fetched
- THEN a loading skeleton is shown

#### Scenario: Edit display name
- GIVEN the profile section is rendered
- WHEN the user types a new display name and clicks「保存」
- THEN `PATCH /api/profile` is called with the new display_name and a success indicator is shown

#### Scenario: Upload avatar
- GIVEN the profile section is rendered
- WHEN the user uploads an image via the Cloudinary Upload Widget
- THEN the avatar preview updates immediately, and `PATCH /api/profile` is called with the new avatar_url

#### Scenario: Remove avatar
- GIVEN the user has an existing avatar
- WHEN they click the remove button on the avatar preview
- THEN avatar_url is cleared and the fallback avatar is shown

## MODIFIED Requirements

### Requirement: Admin Role-Based UI

The admin sidebar footer SHALL display the user's avatar and display_name instead of only their email.

#### Scenario: Sidebar shows user avatar
- GIVEN an authenticated user visits any /admin page
- WHEN the admin layout renders with the sidebar
- THEN the sidebar footer shows `UserAvatar` + `display_name` + role badge, with email as secondary text
