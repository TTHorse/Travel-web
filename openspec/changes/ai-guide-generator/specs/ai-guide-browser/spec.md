## ADDED Requirements

### Requirement: Guide Card List Page

The system SHALL provide a page at `/admin/guide/generated` that displays all AI-generated guides as cards.

#### Scenario: Card display
- GIVEN guides exist in the `ai_guides` table
- WHEN the list page loads
- THEN each guide is rendered as a card showing destination, date range, budget, keywords, and created time

#### Scenario: Empty state
- GIVEN no guides have been generated yet
- WHEN the list page loads
- THEN an empty state prompt with a link back to the guide creation page is shown

#### Scenario: Card click navigation
- GIVEN the list page shows guide cards
- WHEN a card is clicked
- THEN the user navigates to `/admin/guide/generated/[id]` for that guide

### Requirement: Guide Preview Page

The system SHALL provide a page at `/admin/guide/generated/[id]` that renders the guide content as Markdown in read-only preview mode.

#### Scenario: Markdown rendering
- GIVEN a guide with Markdown content
- WHEN the preview page loads
- THEN the content is rendered as styled HTML via a Markdown renderer

#### Scenario: Guide not found
- GIVEN an invalid or non-existent guide ID
- WHEN the preview page loads
- THEN a 404 state is shown
