# Delta for UI

## MODIFIED Requirements

### Requirement: Server/Client Boundary

Pages SHALL be Server Components by default. Interactivity SHALL be isolated in `'use client'` leaf components. Admin page data fetching SHALL include user role for scoping queries, passing scoped data to client components as props.

(Previously: Admin pages fetched all data without user scoping. Now admin pages pass current user's profile role to data access functions.)

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

## ADDED Requirements

### Requirement: Admin Role-Based UI

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
