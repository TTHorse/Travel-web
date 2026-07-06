# Bug Fix Workflow

Targeted workflow for diagnosing and fixing bugs in Travel-web.

## Workflow Script

```javascript
export const meta = {
  name: 'bug-fix',
  description: 'Diagnose and fix a bug',
  phases: [
    { title: 'Diagnose', detail: 'Find root cause' },
    { title: 'Fix', detail: 'Implement the fix' },
    { title: 'Verify', detail: 'Confirm fix + no regressions' },
  ],
}

const bug = args.bug || 'the reported bug';

phase('Diagnose')
const cause = await agent(
  `Diagnose the root cause of: ${bug}.
   Key considerations for this project:
   - Server/Client component boundary issues (Next.js 16)
   - Supabase query/data flow
   - Three.js rendering quirks
   - Tailwind v4 @theme inline behavior
   - High-mountain (高德) API interactions
   Output: root cause analysis with file locations.`,
  { label: 'diagnose' }
);
log(`Diagnosis:\n${cause}`);

phase('Fix')
await agent(
  `Fix: ${bug}. Root cause: ${cause}.
   Apply the minimal fix. Follow project specs from .claude/specs/.
   Do NOT refactor unrelated code.`,
  { label: 'fix' }
);

phase('Verify')
await agent(
  `Verify the fix:
   1. Confirm the original bug is resolved
   2. Check for regressions in related functionality
   3. Run npx tsc --noEmit to verify type safety
   Report results.`,
  { label: 'verify' }
);
```

## Usage

Invoke with: "Fix bug: [description]"
