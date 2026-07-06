## MODIFIED Requirements

### Requirement: AI SDK

The Vercel AI SDK (`ai` package v7) SHALL be used for AI-assisted features. AI calls SHALL be routed through API endpoints, not called directly from client components. The system SHALL use DeepSeek as the AI provider via `@ai-sdk/openai` compatibility layer.

#### Scenario: AI-assisted content generation
- GIVEN the admin wants AI help with a guide
- WHEN the AI is invoked
- THEN the request goes through an API Route that calls the AI SDK server-side

#### Scenario: DeepSeek provider configuration
- GIVEN the system needs to call DeepSeek
- WHEN the AI SDK provider is initialized
- THEN `createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY })` is used

#### Scenario: AI guide generation
- GIVEN a user submits travel parameters on the guide page
- WHEN the form is submitted
- THEN the client calls `POST /api/ai/generate-guide` with the parameters and receives a streaming response
