# Build Check Skill

Run a full build verification for the Travel-web project.

## Pipeline

### Step 1: Type Check
```bash
cd /Users/user/Documents/Travel/Travel-web && npx tsc --noEmit
```
Expected: no errors. If errors exist, fix them before proceeding.

### Step 2: Build
```bash
cd /Users/user/Documents/Travel/Travel-web && npm run build
```
Expected: successful build with all pages compiled.

### Step 3: Analyze Output
Look for:
- `✓ Compiled successfully` — all good
- `⚠` warnings — address if related to changed code
- `✗` errors — must fix before commit

### Step 4: Lint (optional)
```bash
cd /Users/user/Documents/Travel/Travel-web && npx eslint . --ext .ts,.tsx
```

## Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `useSearchParams() should be wrapped in a suspense boundary` | Client component using URL params without Suspense | Wrap in `<Suspense>` |
| `Cannot find module '@/...'` | Import path wrong | Check file path exists |
| `Type 'X' is not assignable to type 'Y'` | Type mismatch | Verify Zod schema / Supabase types |
| `window is not defined` | Client-only code in Server Component | Add `'use client'` or use dynamic import |

## Success Criteria
- Type check: 0 errors
- Build: all pages compiled
- No new ESLint errors in changed files
