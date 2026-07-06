## MODIFIED Requirements

### Requirement: Component Directory

Components SHALL be placed in `src/components/` organized by domain: `ui/`, `layout/`, `trip/`, `map/`, `gallery/`, `admin/`, `home/`, `providers/`.

#### Scenario: New UI primitive
- GIVEN a new shared UI component like Badge or Tooltip
- WHEN the developer creates it
- THEN it goes in `src/components/ui/`

#### Scenario: New feature component
- GIVEN a new component specific to AI guide generation
- WHEN the developer creates it
- THEN it goes in `src/components/admin/`

#### Scenario: New feature component for travel trips
- GIVEN a new component specific to travel trips
- WHEN the developer creates it
- THEN it goes in `src/components/trip/`

## ADDED Requirements

### Requirement: Guide Generation Form

The GuidePage SHALL include form fields for travel parameters beyond destination search: date range, budget (RMB integer), traveler count (free text), and keyword tags (preset multi-select + custom input).

#### Scenario: Form field layout
- GIVEN a user has selected a destination on the guide page
- WHEN the destination is confirmed
- THEN additional form fields (dates, budget, travelers, keywords) appear below the destination info card

#### Scenario: Keyword tag selection
- GIVEN the keyword tag section is rendered
- WHEN the user interacts with it
- THEN preset tags (文化体验, 美食之旅, 自然风光, 历史古迹, 亲子游, 蜜月旅行, 户外探险, 城市漫步) are selectable as capsule buttons with multi-select, plus a text input for custom tags

#### Scenario: Form submission
- GIVEN all required fields are filled
- WHEN the user clicks the generate button
- THEN the form calls the AI generation API and displays streaming output inline
