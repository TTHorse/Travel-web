# Architecture Specification

## Requirement: Data Flow

Data SHALL flow from Supabase through `src/lib/data/` accessors to Server Components. Client Components SHALL NOT query Supabase directly.

#### Scenario: Server Component fetching data
- GIVEN a page needs trip data from the database
- WHEN the page renders
- THEN data is fetched via `src/lib/data/trips.ts` in the Server Component

#### Scenario: Client Component needs fresh data
- GIVEN a Client Component needs updated data
- WHEN data changes on the server
- THEN the Client Component calls an API Route which uses the data access layer

---

## Requirement: Route Structure

All page routes SHALL follow the App Router convention under `src/app/`. All API routes SHALL be placed under `src/app/api/`. All pages under `/admin/*` SHALL require authentication via the proxy.

#### Scenario: New API endpoint
- GIVEN a new API endpoint is needed
- WHEN the developer creates it
- THEN a `route.ts` is placed in `src/app/api/<resource>/`

#### Scenario: Dynamic route
- GIVEN a page needs a URL parameter
- WHEN the route is defined
- THEN `[param]` folder naming is used, with params accessed via `Promise<{ param: string }>`

#### Scenario: Unauthenticated access to /admin
- GIVEN a user is not logged in
- WHEN they navigate to any /admin route
- THEN the proxy redirects them to /admin/login

#### Scenario: Authenticated access to admin guide section
- GIVEN a user is logged in and visits /admin/guide
- WHEN the page renders
- THEN the user's session is available for data scoping

---

## Requirement: Component Hierarchy

Pages SHALL compose Layout → Section → Feature → UI Primitive. No component SHALL exceed 4 levels of nesting without abstraction.

#### Scenario: Building a new page
- GIVEN a page is designed
- WHEN the component tree is laid out
- THEN Layout wraps the page, Sections partition content, Feature components implement behavior, UI Primitives render atoms

---

## Requirement: State Management

Global state SHALL be minimized. Component-local `useState` is preferred. React Context SHALL be used only for cross-cutting concerns (auth, theme, user role).

#### Scenario: Form state
- GIVEN a form component
- WHEN state is needed
- THEN `react-hook-form` manages form state locally

#### Scenario: Auth state across pages
- GIVEN authentication state is needed in multiple components
- WHEN the state must be shared
- THEN Supabase Auth session is accessed server-side via `supabase.auth.getUser()`. Profile role is fetched from `src/lib/data/profiles.ts`.

---

## Requirement: Next.js 16 Conventions

Middleware SHALL be implemented via `src/proxy.ts` (Next.js 16 convention). The proxy SHALL call `updateSession` from `src/lib/supabase/middleware.ts` on every request matching `/admin/*`.

#### Scenario: Session handling
- GIVEN a request needs authentication middleware
- WHEN the proxy runs
- THEN `src/proxy.ts` handles session refresh and route protection

#### Scenario: Session cookie refresh
- GIVEN a user's Supabase session cookie is about to expire
- WHEN any request to /admin/* passes through the proxy
- THEN `updateSession` refreshes the session cookie automatically

#### Scenario: Logged-in user redirected from login page
- GIVEN a user already has a valid session
- WHEN they visit /admin/login
- THEN the proxy redirects them to /admin

---

## Requirement: Role-Based Access Control

The system SHALL enforce role-based access control at three layers: RLS policies in the database, ownership checks in API routes, and view differentiation in the admin UI. Two roles SHALL be supported: `user` and `admin`.

#### Scenario: Admin accesses all trips via API
- GIVEN an admin user calls PUT /api/trips with a trip owned by another user
- WHEN the API checks ownership
- THEN the admin role allows the operation to proceed

#### Scenario: Non-admin user blocked at API
- GIVEN a regular user calls DELETE /api/trips with a trip owned by another user
- WHEN the API checks ownership
- THEN a 403 Forbidden response is returned before the database operation

#### Scenario: RLS is the final defense
- GIVEN an API bug allows a request to bypass the ownership check
- WHEN the database operation is attempted
- THEN RLS policies still block the operation if `user_id != auth.uid()` and the user is not admin

---

## Requirement: Profile Update API

The system SHALL provide `GET /api/profile` and `PATCH /api/profile` for authenticated users to read and update their own profile fields (display_name, avatar_url).

#### Scenario: Read current profile
- GIVEN an authenticated user
- WHEN they send `GET /api/profile`
- THEN their current profile is returned

#### Scenario: Valid update
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with `{ display_name: "新昵称", avatar_url: "https://..." }`
- THEN the profile is updated and the updated profile object is returned

#### Scenario: Partial update (display_name only)
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with only `{ display_name: "新昵称" }`
- THEN only display_name is updated, avatar_url is unchanged

#### Scenario: Unauthenticated request
- GIVEN no valid session
- WHEN `PATCH /api/profile` is called
- THEN a 401 Unauthorized response is returned

#### Scenario: Invalid payload
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with `{ display_name: "" }`
- THEN a 400 Bad Request response is returned with a validation error message
