## ADDED Requirements

### Requirement: AI Guide Generation API

The system SHALL provide a `POST /api/ai/generate-guide` endpoint that accepts travel parameters and returns a streaming AI-generated Markdown guide via DeepSeek.

#### Scenario: Successful generation
- GIVEN valid travel parameters (destination, dates, budget, traveler_count, keywords)
- WHEN the endpoint is called by an authenticated admin
- THEN it streams a structured Markdown guide from DeepSeek and persists it to `ai_guides` table

#### Scenario: Missing required parameters
- GIVEN required fields (destination, start_date, end_date) are missing
- WHEN the endpoint is called
- THEN it returns 400 with a validation error

#### Scenario: AI API failure
- GIVEN the DeepSeek API is unreachable or returns an error
- WHEN the endpoint is called
- THEN it returns 502 with a descriptive error message

### Requirement: Guide Generation System Prompt

The system SHALL use a fixed Chinese system prompt that constrains the AI to output a 7-module travel guide structure.

#### Scenario: Fixed module output
- GIVEN any valid set of travel parameters
- WHEN the AI generates a guide
- THEN the output includes 行程概览, 每日行程, 美食推荐, 住宿建议, 交通指南, 预算分配, 实用贴士

#### Scenario: Day count derivation
- GIVEN start_date and end_date
- WHEN the system prompt is constructed
- THEN the day count for 每日行程 is calculated as (end_date - start_date) days

### Requirement: Streaming Response

The AI generation endpoint SHALL stream the response using Vercel AI SDK's `streamText()`, allowing the client to render content progressively.

#### Scenario: Progressive content display
- GIVEN the AI is generating a guide
- WHEN tokens are received from DeepSeek
- THEN the client renders them incrementally in the UI

### Requirement: Guide Storage

The system SHALL persist the complete generated guide to the `ai_guides` Supabase table after streaming completes.

#### Scenario: Successful persistence
- GIVEN the AI stream completes successfully
- WHEN the full content is received
- THEN a row is inserted into `ai_guides` with all parameters and generated content
