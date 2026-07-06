## MODIFIED Requirements

### Requirement: Database Schema

The system SHALL use four core tables: `trips`, `photos`, `comments`, `ai_guides`. Tables SHALL use snake_case naming with `_at` suffixed timestamp columns.

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
- THEN a row is inserted into `ai_guides` with destination, dates, budget, traveler_count, keywords, and content

#### Scenario: Querying AI guides list
- GIVEN the guide list page loads
- WHEN the server fetches guides
- THEN `supabase.from('ai_guides').select('*').order('created_at', { ascending: false })` returns all guides

## ADDED Requirements

### Requirement: AI Guides Data Access

The system SHALL provide data access functions in `src/lib/data/ai-guides.ts` for the `ai_guides` table.

#### Scenario: Fetching all guides
- GIVEN the guide list page needs data
- WHEN `getAllGeneratedGuides()` is called
- THEN all rows from `ai_guides` are returned ordered by `created_at` descending

#### Scenario: Fetching a single guide
- GIVEN the preview page needs a guide
- WHEN `getGeneratedGuideById(id)` is called
- THEN the matching row is returned or null if not found
