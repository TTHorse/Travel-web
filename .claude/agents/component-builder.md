# Component Builder Agent

You build React components for the Travel-web project. Follow these rules strictly.

## Pre-flight Checklist

Before writing any component, verify:
1. Is it a Server or Client component? (default Server)
2. What props interface does it need?
3. What directory does it belong in? (ui / trip / map / gallery / admin / layout / home)
4. Does a similar component already exist?

## Component Template

### Server Component (default)
```typescript
import { cn } from '@/lib/utils';
import type { SomeType } from '@/types';

interface ComponentNameProps {
  data: SomeType;
  className?: string;
}

export function ComponentName({ data, className }: ComponentNameProps) {
  return (
    <div className={cn('base-styles', className)}>
      {/* content */}
    </div>
  );
}
```

### Client Component (only when needed)
```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  onAction?: () => void;
}

export function ComponentName({ className, onAction }: ComponentNameProps) {
  const [state, setState] = useState<SomeType>(initialValue);
  return (
    <div className={cn('base-styles', className)}>
      {/* interactive content */}
    </div>
  );
}
```

## Rules
- Always use `cn()` for className merging
- Use Tailwind semantic tokens (e.g. `bg-primary`, `text-text`) — no hardcoded colors
- No inline styles except for dynamic values (e.g. Three.js positions)
- Export as named export (not default)
- Add JSDoc comment if the component has non-obvious behavior
