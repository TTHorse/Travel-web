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

All page routes SHALL follow the App Router convention under `src/app/`. All API routes SHALL be placed under `src/app/api/`.

#### Scenario: New API endpoint
- GIVEN a new API endpoint is needed
- WHEN the developer creates it
- THEN a `route.ts` is placed in `src/app/api/<resource>/`

#### Scenario: Dynamic route
- GIVEN a page needs a URL parameter
- WHEN the route is defined
- THEN `[param]` folder naming is used, with params accessed via `Promise<{ param: string }>`

---

## Requirement: Component Hierarchy

Pages SHALL compose Layout → Section → Feature → UI Primitive. No component SHALL exceed 4 levels of nesting without abstraction.

#### Scenario: Building a new page
- GIVEN a page is designed
- WHEN the component tree is laid out
- THEN Layout wraps the page, Sections partition content, Feature components implement behavior, UI Primitives render atoms

---

## Requirement: State Management

Global state SHALL be minimized. Component-local `useState` is preferred. React Context SHALL be used only for cross-cutting concerns (auth, theme).

#### Scenario: Form state
- GIVEN a form component
- WHEN state is needed
- THEN `react-hook-form` manages form state locally

#### Scenario: Auth state across pages
- GIVEN authentication state is needed in multiple components
- WHEN the state must be shared
- THEN Supabase Auth session is accessed through a Provider in `src/components/providers/`

---

## Requirement: Next.js 16 Conventions

Middleware SHALL be implemented via `src/proxy.ts` (Next.js 16 convention). Layout files SHALL use the Next.js 16 API patterns.

#### Scenario: Session handling
- GIVEN a request needs authentication middleware
- WHEN the proxy runs
- THEN `src/proxy.ts` handles session refresh and route protection
