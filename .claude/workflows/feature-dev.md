# Feature Development Workflow

Complete workflow for developing a new feature in Travel-web.

## Workflow Script

```javascript
export const meta = {
  name: 'feature-development',
  description: 'Complete feature dev cycle: plan → code → review → build',
  phases: [
    { title: 'Plan', detail: 'Analyze requirements and design approach' },
    { title: 'Code', detail: 'Implement the feature' },
    { title: 'Review', detail: 'Code review against project specs' },
    { title: 'Verify', detail: 'Type check and build' },
  ],
}

const feature = args.feature || 'the requested feature';

phase('Plan')
const plan = await agent(
  `Design an implementation plan for: ${feature}.
   Consider: file locations, component types (server/client), data flow, and specs in .claude/specs/.
   Output: list of files to create/edit with brief descriptions.`,
  { label: 'design-plan' }
);
log(`Plan: ${plan}`);

phase('Code')
await agent(
  `Implement the feature: ${feature}.
   Follow the plan above. Adhere to AGENTS.md and .claude/specs/ constraints.
   - Use Server Components by default
   - All components must accept className
   - No any types
   - Use cn() for class merging`,
  { label: 'implement' }
);

phase('Review')
const issues = await agent(
  `Review the implementation against project specs (.claude/specs/).
   Check: type safety, component rules, architecture, tech stack restrictions.
   Report blockers, warnings, and suggestions.`,
  { label: 'review' }
);
log(`Review results:\n${issues}`);

phase('Verify')
await agent(
  'Run type check (npx tsc --noEmit) and build (npm run build). Report any errors.',
  { label: 'verify-build' }
);
```

## Usage

Invoke with: "Develop feature: [description]"

## Pre-requisites
- Write any new Supabase SQL migrations before starting
- Verify environment variables are set in `.env.local`
