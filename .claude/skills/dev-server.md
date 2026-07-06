# Dev Server Skill

Manage the Next.js dev server for the Travel-web project.

## Commands

### Start dev server
```bash
cd /Users/user/Documents/Travel/Travel-web && npm run dev
```
The server runs on `http://localhost:3007` with Turbopack.

### Check if running
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3007
```

### View logs
The dev server outputs to stdout. Watch for:
- `Ready in` — server started successfully
- `Compiled` — hot reload completed
- `Error:` — compilation errors

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Port 3007 already in use | Previous instance not killed | `kill $(lsof -t -i:3007)` |
| Module not found | Missing install | `npm install` |
| Type error on build | TypeScript issue | `npx tsc --noEmit` |
| Tailwind class not working | v4 syntax issue | Check `@theme inline` block |

## After Server Start
1. Open `http://localhost:3007` in browser
2. Check the page loads correctly
3. Verify API routes respond (e.g., `/api/comments`)
