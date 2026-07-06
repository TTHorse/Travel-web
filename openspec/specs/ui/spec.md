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

Pages SHALL be Server Components by default. Interactivity SHALL be isolated in `'use client'` leaf components.

#### Scenario: Page component
- GIVEN a new page route is created
- WHEN the component does not require browser APIs or event handlers
- THEN it stays as a Server Component with async data fetching

#### Scenario: Interactive sub-component
- GIVEN a page needs interactive behavior (click, state, effect)
- WHEN the interactive portion is identified
- THEN it is extracted into a separate `'use client'` file

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
