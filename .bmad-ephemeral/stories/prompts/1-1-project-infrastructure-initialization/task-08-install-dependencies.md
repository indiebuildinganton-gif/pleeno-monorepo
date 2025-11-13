# Task 8: Install Shared Dependencies

**Story:** 1.1 - Project Infrastructure Initialization
**Task ID:** 8 of 9
**Acceptance Criteria:** AC 1

## Objective

Install all required shared dependencies across packages using npm workspaces.

## Tasks

**Supabase packages:**
```bash
npm install -w packages/database @supabase/supabase-js @supabase/ssr
```

**State management:**
```bash
npm install -w packages/stores zustand
npm install -w packages/ui @tanstack/react-query
```

**Forms and validation:**
```bash
npm install -w packages/ui react-hook-form @hookform/resolvers
npm install -w packages/validations zod
```

**Utilities:**
```bash
npm install -w packages/utils date-fns date-fns-tz
```

**Data visualization:**
```bash
npm install -w packages/ui recharts @tanstack/react-table
```

**Document generation:**
```bash
npm install -w packages/ui @react-pdf/renderer resend
```

**Dev dependencies:**
```bash
npm install -D turbo typescript @types/react @types/node
```

## Verification

```bash
npm install
npm run dev
```
