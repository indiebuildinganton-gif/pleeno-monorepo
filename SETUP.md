# Pleeno Setup Guide

Quick setup guide to get Pleeno running locally with a test account.

## Prerequisites

- Node.js 20+ (see [NODE_VERSION_SETUP.md](NODE_VERSION_SETUP.md))
- Docker Desktop running
- pnpm installed

## Setup Steps

### 1. Start Supabase

```bash
npx supabase start
```

This will start the local Supabase instance. Wait for it to complete.

### 2. Apply Database Migrations

```bash
npm run db:seed
```

This applies all database migrations to create the schema.

### 3. Start the Application

In a new terminal:

```bash
npm run dev:shell
```

This starts the shell app on http://localhost:3005

### 4. Create Your First User

Visit http://localhost:3005/signup and create an account:

- **Email**: Use a standard email format with well-known domains
  - ✅ Good: `demo@gmail.com`, `admin@outlook.com`, `user@company.com`
  - ❌ Avoid: `.test`, `.dev`, `.local` domains (may be rejected)
- **Password**: Must be at least 8 characters with:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - Example: `Password123`
- **Full Name**: Your name
- **Agency Name**: Your agency name (e.g., `Demo Agency`)

The first user you create will automatically become the **Agency Admin**.

### 5. Login and Explore

After signup, you'll be logged in automatically. Or visit:

http://localhost:3005/login

## Resetting the Database

If you need to start fresh:

```bash
npm run db:reset
```

This will:
1. Drop and recreate the database
2. Run all migrations
3. Clear all data

After reset, you can create a new first user via the signup page.

## Troubleshooting

### Supabase won't start

```bash
# Stop Supabase
npx supabase stop

# Start again
npx supabase start
```

### Migrations won't apply

```bash
# Check Supabase status
npx supabase status

# Force reset
npx supabase db reset --no-seed
npm run db:seed
```

### "Public signup is disabled" error

This means you already have users in the database. Options:

1. Login with an existing account
2. Reset the database: `npm run db:reset`

### Email validation errors

Supabase has strict email validation. Make sure to use a standard email format like:
- `admin@test.com`
- `user@company.com`
- `test@email.com`

Avoid using:
- `.dev` domains (blocked by some email validators)
- Invalid TLDs
- Missing @ or domain

## Development Workflow

Typical daily workflow:

```bash
# 1. Start Supabase (if not running)
npx supabase start

# 2. Start all apps
npm run dev

# Or start individual apps:
npm run dev:shell      # Port 3005 (login/signup)
npm run dev:dashboard  # Port 3002
npm run dev:agency     # Port 3004
npm run dev:entities   # Port 3001
npm run dev:payments   # Port 3003
npm run dev:reports    # Port 3000
```

## Available Scripts

- `npm run dev` - Start all apps in parallel
- `npm run dev:shell` - Start shell app (login/signup) on port 3005
- `npm run db:seed` - Apply database migrations
- `npm run db:reset` - Reset database and apply migrations
- `npx supabase status` - Check Supabase status
- `npx supabase stop` - Stop Supabase

## Next Steps

After setup:

1. Explore the dashboard at http://localhost:3002
2. Check agency settings at http://localhost:3004
3. View entities at http://localhost:3001
4. Manage payments at http://localhost:3003
5. Generate reports at http://localhost:3000

## Support

- Check [README.md](README.md) for project overview
- See [supabase/README.md](supabase/README.md) for database docs
- Review [docs/architecture.md](docs/architecture.md) for architecture details
