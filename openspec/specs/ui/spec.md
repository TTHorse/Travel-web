# UI Specification

## Requirement: Component Interface

All components SHALL accept `className?: string` for style composition.

#### Scenario: Base component usage
- GIVEN a component is used in a page
- WHEN the parent passes a className
- THEN the className is merged with the component's base styles via `cn()`

#### Scenario: Component without className
- GIVEN a component is rendered without a className prop
- WHEN the component mounts
- THEN only the component's default styles are applied

---

## Requirement: Server/Client Boundary

Pages SHALL be Server Components by default. Interactivity SHALL be isolated in `'use client'` leaf components. Admin page data fetching SHALL include user role for scoping queries, passing scoped data to client components as props.

#### Scenario: Page component
- GIVEN a new page route is created
- WHEN the component does not require browser APIs or event handlers
- THEN it stays as a Server Component with async data fetching

#### Scenario: Interactive sub-component
- GIVEN a page needs interactive behavior (click, state, effect)
- WHEN the interactive portion is identified
- THEN it is extracted into a separate `'use client'` file

#### Scenario: Admin page with role-based data
- GIVEN an admin page loads in a Server Component
- WHEN data is fetched
- THEN `supabase.auth.getUser()` is called first, then the user's profile role determines whether to fetch all data (admin) or user-scoped data (user)

---

## Requirement: Design Tokens

All styling SHALL use Tailwind v4 semantic tokens defined in `@theme inline`. Hardcoded color values SHALL NOT be used except for one-off dynamic values.

#### Scenario: Applying a brand color
- GIVEN a component needs the primary color
- WHEN the developer writes the className
- THEN `bg-primary` or `text-primary` is used, not `bg-[#fb923c]`

#### Scenario: Dynamic color from data
- GIVEN a component renders a color from API data
- WHEN the color is not in the design token set
- THEN inline style with the hex value is acceptable

---

## Requirement: Class Merging

All components SHALL use the `cn()` utility (clsx + tailwind-merge) for className composition.

#### Scenario: Merging conditional classes
- GIVEN a component has base classes and conditional variants
- WHEN variant classes conflict with base classes
- THEN tailwind-merge resolves conflicts with the last class winning

---

## Requirement: Component Directory

Components SHALL be placed in `src/components/` organized by domain: `ui/`, `layout/`, `trip/`, `map/`, `gallery/`, `admin/`, `home/`, `providers/`.

#### Scenario: New UI primitive
- GIVEN a new shared UI component like Badge or Tooltip
- WHEN the developer creates it
- THEN it goes in `src/components/ui/`

#### Scenario: New feature component
- GIVEN a new component specific to travel trips
- WHEN the developer creates it
- THEN it goes in `src/components/trip/`

---

## Requirement: Named Exports

All components SHALL use named exports. Page components (in `src/app/`) SHALL use default exports.

#### Scenario: Shared component
- GIVEN a component in `src/components/`
- WHEN it is exported
- THEN `export function ComponentName` is used, not `export default`

#### Scenario: Page component
- GIVEN a `page.tsx` in the App Router
- WHEN it is exported
- THEN `export default function PageName` is used

---

## Requirement: Admin Role-Based UI

The admin trip list SHALL display a tab switcher (「所有行程」/「我的行程」) when the current user is an admin. Non-admin users SHALL see only their own trips without a tab switcher. The table SHALL include an「所有者」column when the admin「所有行程」tab is active.

#### Scenario: Admin views all trips tab
- GIVEN an admin user visits /admin/trips
- WHEN the「所有行程」tab is selected
- THEN all trips from all users are displayed with an「所有者」column showing each trip owner's email

#### Scenario: Admin switches to my trips tab
- GIVEN an admin user visits /admin/trips
- WHEN the「我的行程」tab is clicked
- THEN only the admin's own trips are displayed, without the「所有者」column

#### Scenario: Regular user visits trip list
- GIVEN a non-admin user visits /admin/trips
- WHEN the page loads
- THEN only their own trips are displayed, no tab switcher is shown, no「所有者」column

#### Scenario: Regular user blocked from editing others' trips
- GIVEN a non-admin user navigates to /admin/trips/:id/edit
- WHEN the trip's `user_id` does not match the current user
- THEN a 403 error page or redirect is shown

---

## Requirement: UserAvatar Component

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

---

## Requirement: Profile Edit UI

The `/admin/settings` page SHALL include a「个人资料」section above the existing「修改密码」section, allowing the user to edit their display_name and upload an avatar via Cloudinary Upload Widget.

#### Scenario: Loading state
- GIVEN the settings page loads
- WHEN the profile data is being fetched
- THEN a loading spinner is shown

#### Scenario: Edit display name
- GIVEN the profile section is rendered
- WHEN the user types a new display name and clicks「保存」
- THEN `PATCH /api/profile` is called with the new display_name and a success indicator is shown

#### Scenario: Upload avatar
- GIVEN the profile section is rendered
- WHEN the user uploads an image via the Cloudinary Upload Widget
- THEN the circular avatar preview updates immediately

#### Scenario: Remove avatar
- GIVEN the user has an existing avatar
- WHEN they hover over the avatar preview and click the remove button
- THEN avatar_url is cleared and the fallback avatar is shown

---

## MODIFIED: Admin Role-Based UI

The admin sidebar footer SHALL display the user's avatar and display_name instead of only their email.

#### Scenario: Sidebar shows user avatar
- GIVEN an authenticated user visits any /admin page
- WHEN the admin layout renders with the sidebar
- THEN the sidebar footer shows `UserAvatar` + `display_name` + role badge, with email as secondary text
