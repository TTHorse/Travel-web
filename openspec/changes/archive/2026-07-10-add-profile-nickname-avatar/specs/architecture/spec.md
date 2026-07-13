# Delta for Architecture

## ADDED Requirements

### Requirement: Profile Update API

The system SHALL provide `PATCH /api/profile` for authenticated users to update their own display_name and avatar_url.

#### Scenario: Valid update
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with `{ display_name: "新昵称", avatar_url: "https://..." }`
- THEN the profile is updated and the updated profile object is returned

#### Scenario: Partial update (display_name only)
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with only `{ display_name: "新昵称" }`
- THEN only display_name is updated, avatar_url is unchanged

#### Scenario: Partial update (avatar_url only)
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with only `{ avatar_url: "https://..." }`
- THEN only avatar_url is updated, display_name is unchanged

#### Scenario: Unauthenticated request
- GIVEN no valid session
- WHEN `PATCH /api/profile` is called
- THEN a 401 Unauthorized response is returned

#### Scenario: Invalid payload
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with `{ display_name: "" }`
- THEN a 400 Bad Request response is returned with a validation error message

#### Scenario: Empty body
- GIVEN an authenticated user
- WHEN they send `PATCH /api/profile` with `{}`
- THEN a 400 Bad Request response is returned (at least one field required)
