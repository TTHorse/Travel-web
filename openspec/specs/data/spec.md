# Data Specification

## Requirement: Data Access Layer

All database queries SHALL be encapsulated in `src/lib/data/`. Direct Supabase queries SHALL NOT appear in components or pages.

#### Scenario: Fetching published trips
- GIVEN the homepage needs trip data
- WHEN the page loads
- THEN `getPublishedTrips()` from `src/lib/data/trips.ts` is called

#### Scenario: Creating a comment
- GIVEN a visitor submits a comment
- WHEN the API route processes it
- THEN `createComment()` from `src/lib/data/comments.ts` handles the insert

---

## Requirement: Supabase Client Initialization

Server-side code SHALL use `createClient()` from `src/lib/supabase/server.ts`. Browser code SHALL use `createClient()` from `src/lib/supabase/client.ts`.

#### Scenario: Server Component or Route Handler
- GIVEN code runs on the server
- WHEN Supabase access is needed
- THEN `const supabase = await createClient()` (with await) is used

#### Scenario: Client Component
- GIVEN code runs in the browser
- WHEN Supabase access is needed
- THEN `const supabase = createClient()` (without await) is used

---

## Requirement: Database Schema

The system SHALL use five core tables: `trips`, `photos`, `comments`, `ai_guides`, `profiles`. Tables SHALL use snake_case naming with `_at` suffixed timestamp columns. Content-bearing tables (`trips`, `ai_guides`) SHALL include `user_id UUID REFERENCES auth.users(id)` to establish ownership. The `profiles` table SHALL include `avatar_url TEXT` and `display_name TEXT`, with `display_name` editable by the owning user.

#### Scenario: Querying a trip with photos
- GIVEN a trip page loads
- WHEN the trip data is fetched
- THEN `supabase.from('trips').select('*, photos(*)')` joins related photos

#### Scenario: Nested comment reply
- GIVEN a user replies to a comment
- WHEN the reply is stored
- THEN `parent_id` references the parent comment's `id`

#### Scenario: Storing an AI-generated guide
- GIVEN an AI guide generation completes
- WHEN the result is stored
- THEN a row is inserted into `ai_guides` with destination, dates, budget, traveler_count, keywords, content, and `user_id` set to the current authenticated user

#### Scenario: Creating a trip with ownership
- GIVEN an authenticated user creates a trip
- WHEN the trip is stored
- THEN `user_id` is set to `auth.uid()` at insert time

#### Scenario: Profiles table tracks user roles
- GIVEN a user exists in `auth.users`
- WHEN the user first interacts with the system
- THEN a corresponding row in `profiles` exists with `user_id` matching their auth UID

#### Scenario: Profile with avatar
- GIVEN a user has uploaded an avatar
- WHEN their profile is queried
- THEN `avatar_url` contains the Cloudinary secure URL of the uploaded image

#### Scenario: Profile without avatar
- GIVEN a user has not uploaded an avatar
- WHEN their profile is queried
- THEN `avatar_url` is NULL and the UI renders a fallback

---

## Requirement: Type Safety

Database query return types SHALL be inferred from Supabase client types. Manual interface definitions SHALL NOT duplicate database column types.

#### Scenario: Type inference
- GIVEN a Supabase query returns data
- WHEN the type is needed
- THEN it is derived from the generated database types, not hand-written

---

## Requirement: RLS Policies

Published content (`is_published = true`, `is_approved = true`) SHALL be readable by anyone. Write operations SHALL be restricted to the owning user OR an admin (profiles.role = 'admin'). Admin access SHALL be verified via `EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')`.

#### Scenario: Public read of published trips
- GIVEN an unauthenticated visitor
- WHEN they visit a trip page
- THEN only published trips and approved comments are visible

#### Scenario: Owner writes their own trip
- GIVEN an authenticated user owns a trip
- WHEN they update or delete it
- THEN the operation succeeds because `user_id = auth.uid()`

#### Scenario: Non-owner denied write
- GIVEN an authenticated user does NOT own a trip and is NOT an admin
- WHEN they attempt to update or delete it
- THEN RLS blocks the operation

#### Scenario: Admin bypasses ownership
- GIVEN a user with `profiles.role = 'admin'`
- WHEN they access any trip
- THEN RLS allows read, update, and delete regardless of `user_id`

#### Scenario: Photo ownership through parent trip
- GIVEN a user tries to insert a photo
- WHEN the photo's `trip_id` references a trip they own (or they are admin)
- THEN the insert succeeds; otherwise RLS blocks it

---

## Requirement: User-Based Ownership

Every content record in `trips` and `ai_guides` SHALL be owned by exactly one user, identified by `user_id`. Ownership SHALL be immutable after creation (set at INSERT time, never updated).

#### Scenario: Ownership set on creation
- GIVEN a user creates a trip via POST /api/trips
- WHEN the trip is inserted into the database
- THEN `user_id` is populated with the authenticated user's UUID

#### Scenario: Ownership cannot be modified
- GIVEN a trip update via PUT /api/trips
- WHEN the update payload is processed
- THEN `user_id` is NOT included in the updatable fields (immutable)

#### Scenario: Related tables inherit ownership
- GIVEN a `photo` or `map_point` is linked to a trip
- WHEN access control is evaluated
- THEN ownership is checked through the `trip_id` foreign key to `trips.user_id`

---

## Requirement: Admin Role via Profiles

The system SHALL use a `profiles` table to store user roles. The `role` column SHALL accept values `'user'` (default) and `'admin'`. Admin status SHALL be checked in RLS policies and API routes for privileged operations.

#### Scenario: Default user role
- GIVEN a new user row is created in `profiles`
- WHEN no role is specified
- THEN `role` defaults to `'user'`

#### Scenario: Admin can view all content
- GIVEN a user with `profiles.role = 'admin'`
- WHEN they query the database for trips, photos, ai_guides, or map_points
- THEN all rows are returned regardless of `user_id`

#### Scenario: Regular user restricted to own content
- GIVEN a user with `profiles.role = 'user'`
- WHEN they query trips from the admin panel
- THEN only rows where `user_id = auth.uid()` are returned

---

## Requirement: Profiles Data Access

The system SHALL provide data access functions in `src/lib/data/profiles.ts` for querying and managing the `profiles` table.

#### Scenario: Fetching current user's profile
- GIVEN an authenticated user
- WHEN `getCurrentProfile()` is called
- THEN the user's profile row (including role) is returned, or created with default `role='user'` if it doesn't exist

#### Scenario: Checking admin status
- GIVEN an authenticated user
- WHEN `isAdmin()` is called
- THEN `true` is returned if `profiles.role = 'admin'`, `false` otherwise

#### Scenario: Updating display name
- GIVEN an authenticated user
- WHEN `updateProfile({ display_name: "新昵称" })` is called
- THEN the `profiles` row for the current user is updated with the new display_name and `updated_at` is refreshed

#### Scenario: Updating avatar
- GIVEN an authenticated user
- WHEN `updateProfile({ avatar_url: "https://..." })` is called
- THEN the `profiles` row for the current user is updated with the new avatar_url

#### Scenario: Updating both fields
- GIVEN an authenticated user
- WHEN `updateProfile({ display_name: "...", avatar_url: "..." })` is called
- THEN both fields are updated atomically in a single UPDATE statement
