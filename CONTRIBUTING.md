# Contributing to Pleeno

Thank you for your interest in contributing to Pleeno! This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Questions](#questions)

## Development Setup

See [README.md](README.md#quick-start) for complete setup instructions.

### Quick Setup

```bash
# Clone and install
git clone https://github.com/rajkrajpj/pleeno.git
cd pleeno
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# Start Supabase
cd supabase && npx supabase start && cd ..

# Start development servers
pnpm dev
```

## Code Standards

### TypeScript

- **Use strict mode:** All TypeScript files use strict mode
- **Prefer type inference:** Let TypeScript infer types when possible
- **Use interfaces for object shapes:** `interface User { name: string }`
- **Use types for unions:** `type Status = 'active' | 'inactive'`
- **Avoid `any`:** Use `unknown` or proper types instead
- **Export types alongside functions:** Help consumers understand your API

Example:
```typescript
// Good
interface UserProfile {
  id: string
  name: string
  email: string
}

export function getUserProfile(userId: string): Promise<UserProfile> {
  // Implementation
}

// Bad
export function getUserProfile(userId: any): Promise<any> {
  // Implementation
}
```

### React

- **Use functional components:** No class components
- **Prefer Server Components:** Use Server Components by default (Next.js 15)
- **Use Client Components sparingly:** Only when needed for interactivity
- **Follow React 19 best practices:** Use new features and patterns
- **Use hooks properly:** Follow Rules of Hooks

Example:
```typescript
// Server Component (default)
export default async function UsersPage() {
  const users = await fetchUsers()
  return <UserList users={users} />
}

// Client Component (only when needed)
'use client'

export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Naming Conventions

- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`)
- **Files:** kebab-case for non-components (e.g., `user-utils.ts`)
- **Types/Interfaces:** PascalCase (e.g., `UserProfile`, `ApiResponse`)

### File Structure

#### Zone Structure
```
apps/zone-name/
├── app/                    # App Router pages
│   ├── (route-group)/      # Route groups for layout organization
│   ├── page.tsx            # Pages
│   ├── layout.tsx          # Layouts
│   ├── loading.tsx         # Loading states
│   ├── error.tsx           # Error boundaries
│   └── api/                # API routes
├── components/             # Zone-specific components
│   ├── ui/                 # UI components
│   └── features/           # Feature-specific components
├── lib/                    # Zone-specific utilities
└── types/                  # Zone-specific types
```

#### Package Structure
```
packages/package-name/
├── src/
│   ├── index.ts            # Main export file
│   ├── types.ts            # Type definitions
│   └── utils/              # Utility functions
├── package.json
└── tsconfig.json
```

### Styling

- **Use Tailwind CSS:** Utility-first approach
- **Follow Shadcn UI patterns:** Reuse existing components
- **Use CSS modules for complex styles:** When Tailwind isn't sufficient
- **Avoid inline styles:** Use Tailwind classes instead
- **Mobile-first responsive design:** Start with mobile, add desktop styles

Example:
```typescript
// Good
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <Card className="flex-1">Content</Card>
</div>

// Bad
<div style={{ display: 'flex', gap: '16px' }}>
  <div style={{ flex: 1 }}>Content</div>
</div>
```

### Code Organization

- **Keep functions small:** Single responsibility principle
- **Extract reusable logic:** Create utilities and hooks
- **Colocate related code:** Keep components and utilities together
- **Use barrel exports:** Export from index files
- **Avoid deep nesting:** Flatten component hierarchies

### Error Handling

- **Use try-catch for async operations**
- **Provide meaningful error messages**
- **Log errors appropriately**
- **Handle edge cases**

Example:
```typescript
async function fetchUser(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw new Error('Unable to load user profile. Please try again.')
  }
}
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow the code standards above
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check formatting
pnpm format:check
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add user profile feature"
```

See [Commit Messages](#commit-messages) for guidelines.

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config, etc.)
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat: add user authentication flow

# Bug fix
fix: resolve payment calculation error for multi-year plans

# Documentation
docs: update setup instructions for Supabase

# Refactor
refactor: extract payment logic into separate utility

# Multiple lines
feat: add user profile editing

- Add profile form component
- Implement profile update API endpoint
- Add validation for profile fields
```

### Rules

- Use imperative mood: "add" not "added" or "adds"
- Keep first line under 72 characters
- Add a body for complex changes
- Reference issues: "Closes #123"

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass:** `pnpm test`
2. **Run type checking:** `pnpm type-check`
3. **Run linting:** `pnpm lint`
4. **Update documentation:** If you changed APIs or behavior
5. **Add tests:** For new features or bug fixes

### Creating a PR

1. **Use a descriptive title:** Follow commit message format
2. **Provide a clear description:**
   - What changes were made?
   - Why were these changes necessary?
   - How were the changes tested?
3. **Link related issues:** Use "Closes #123" or "Fixes #456"
4. **Request reviewers:** Tag appropriate team members
5. **Mark as draft if not ready:** Use draft PRs for work in progress

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass locally
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Wait for CI checks:** All automated checks must pass
2. **Request review:** From at least one team member
3. **Address feedback:** Make requested changes promptly
4. **Re-request review:** After making changes
5. **Merge after approval:** Squash and merge or rebase

### After Merging

- **Delete your branch:** Keep the repository clean
- **Update related issues:** Close or update linked issues
- **Monitor CI/CD:** Ensure deployment succeeds

## Testing

### Test Requirements

- **New features:** Must include tests
- **Bug fixes:** Should include regression tests
- **Coverage:** Maintain >80% code coverage
- **All types:** Unit, integration, and E2E tests as appropriate

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

### Writing Tests

#### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format-currency'

describe('formatCurrency', () => {
  it('formats USD currency correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
  })

  it('handles zero values', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
})
```

#### Component Tests (React Testing Library)

```typescript
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
  it('renders user name', () => {
    render(<UserProfile name="John Doe" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

#### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('text=Sign In')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Dashboard')).toBeVisible()
})
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Database Changes

### Creating Migrations

```bash
cd supabase
npx supabase migration new your_migration_name
```

### Migration Guidelines

- **Use descriptive names:** `create_agencies_table`, `add_user_roles`
- **Test locally first:** Run and verify before pushing
- **Include rollback:** Consider how to reverse changes
- **Document complex changes:** Add comments in SQL

Example migration:
```sql
-- Create agencies table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency"
  ON agencies FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM agency_users WHERE agency_id = agencies.id
  ));
```

### Generating Types

After changing the database schema:

```bash
cd supabase
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts
```

## Questions?

- **General questions:** Create a discussion on GitHub
- **Bug reports:** Create an issue with reproduction steps
- **Feature requests:** Create an issue with use case description
- **Security concerns:** Email security contact (see README)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

Thank you for contributing to Pleeno!
