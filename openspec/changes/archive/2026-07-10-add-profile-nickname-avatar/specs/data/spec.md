# Delta for Data

## MODIFIED Requirements

### Requirement: Database Schema

The system SHALL use a `profiles` table that includes `avatar_url TEXT` for storing the user's avatar image URL. The `display_name` field SHALL be editable by the owning user after registration.

#### Scenario: Profile with avatar
- GIVEN a user has uploaded an avatar
- WHEN their profile is queried
- THEN `avatar_url` contains the Cloudinary secure URL of the uploaded image

#### Scenario: Profile without avatar
- GIVEN a user has not uploaded an avatar
- WHEN their profile is queried
- THEN `avatar_url` is NULL and the UI renders a fallback

### Requirement: Profiles Data Access

The system SHALL provide `updateProfile()` in `src/lib/data/profiles.ts` for updating the current user's `display_name` and `avatar_url`.

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
