# Delta for Architecture

## MODIFIED Requirements

### Requirement: State Management

Global state SHALL be minimized. Component-local `useState` is preferred. React Context SHALL be used only for cross-cutting concerns (auth, theme, user role).

(Previously: React Context for auth and theme only. Now includes user role data from profiles.)

#### Scenario: Form state
- GIVEN a form component
- WHEN state is needed
- THEN `react-hook-form` manages form state locally

#### Scenario: Auth state across pages
- GIVEN authentication state is needed in multiple components
- WHEN the state must be shared
- THEN Supabase Auth session is accessed server-side via `supabase.auth.getUser()`. Profile role is fetched from `src/lib/data/profiles.ts`.

### Requirement: URL Structure — Protected Routes

All pages under `/admin/*` SHALL require authentication. The middleware (proxy) SHALL redirect unauthenticated users to `/admin/login`. Pages SHALL additionally verify user identity server-side for data scoping.

(Previously: Route protection was partially implemented — individual pages checked auth inline, but `/admin/guide/*` had no protection.)

#### Scenario: Unauthenticated access to /admin
- GIVEN a user is not logged in
- WHEN they navigate to any /admin route
- THEN the proxy redirects them to /admin/login

#### Scenario: Authenticated access to admin guide section
- GIVEN a user is logged in and visits /admin/guide
- WHEN the page renders
- THEN the user's session is available for data scoping (previously this route had no auth check)

## ADDED Requirements

### Requirement: Role-Based Access Control

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

### Requirement: Middleware Activation

The session refresh middleware SHALL be active via `src/proxy.ts` (Next.js 16 proxy convention). The proxy SHALL call `updateSession` from `src/lib/supabase/middleware.ts` on every request matching `/admin/*`.

#### Scenario: Session cookie refresh
- GIVEN a user's Supabase session cookie is about to expire
- WHEN any request to /admin/* passes through the proxy
- THEN `updateSession` refreshes the session cookie automatically

#### Scenario: Logged-in user redirected from login page
- GIVEN a user already has a valid session
- WHEN they visit /admin/login
- THEN the proxy redirects them to /admin
