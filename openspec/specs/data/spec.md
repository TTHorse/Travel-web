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

The system SHALL use three core tables: `trips`, `photos`, `comments`. Tables SHALL use snake_case naming with `_at` suffixed timestamp columns.

#### Scenario: Querying a trip with photos
- GIVEN a trip page loads
- WHEN the trip data is fetched
- THEN `supabase.from('trips').select('*, photos(*)')` joins related photos

#### Scenario: Nested comment reply
- GIVEN a user replies to a comment
- WHEN the reply is stored
- THEN `parent_id` references the parent comment's `id`

---

## Requirement: Type Safety

Database query return types SHALL be inferred from Supabase client types. Manual interface definitions SHALL NOT duplicate database column types.

#### Scenario: Type inference
- GIVEN a Supabase query returns data
- WHEN the type is needed
- THEN it is derived from the generated database types, not hand-written

---

## Requirement: RLS Policies

Published content (`is_published = true`, `is_approved = true`) SHALL be readable by anyone. Write operations SHALL require authentication.

#### Scenario: Public read
- GIVEN an unauthenticated visitor
- WHEN they visit a trip page
- THEN only published trips and approved comments are visible

#### Scenario: Admin write
- GIVEN an authenticated admin
- WHEN they access the admin panel
- THEN they can create, update, and delete all content
