# Database Seeding Guide

This guide explains how to seed your local Pleeno database with development data.

## Quick Start

```bash
# Seed the database with development data
npm run db:seed

# Or reset and seed in one command
npm run db:reset
```

## What Gets Seeded

The seed script creates:

### 1. Demo Agency
- **Name**: Demo Agency
- **ID**: `00000000-0000-0000-0000-000000000001`

### 2. Admin User
- **Email**: `admin@pleeno.dev`
- **Password**: `Admin123!`
- **Role**: Agency Admin
- **Status**: Active

### 3. Regular User
- **Email**: `user@pleeno.dev`
- **Password**: `User123!`
- **Role**: Agency User
- **Status**: Active

## Usage

### Login After Seeding

1. Start your development server:
   ```bash
   npm run dev:shell
   ```

2. Visit: http://localhost:3005/login

3. Login with either account:
   - **Admin**: `admin@pleeno.dev` / `Admin123!`
   - **User**: `user@pleeno.dev` / `User123!`

### Available Commands

```bash
# Seed database only (preserves migrations)
npm run db:seed

# Reset database and re-run all migrations, then seed
npm run db:reset
```

## Requirements

### Before Running Seed

1. **Supabase must be running**:
   ```bash
   npx supabase start
   ```

2. **PostgreSQL client (psql) must be installed**:
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql-client`
   - Windows: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/)

### Database Connection

The seed script connects to your local Supabase instance with these settings:
- **Host**: localhost
- **Port**: 54322
- **Database**: postgres
- **User**: postgres
- **Password**: postgres

These match the default settings in [supabase/config.toml](supabase/config.toml).

## Troubleshooting

### Error: Cannot connect to database

**Solution**: Make sure Supabase is running:
```bash
npx supabase start
```

### Error: psql not found

**Solution**: Install PostgreSQL client:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Error: Public signup is disabled

This means you already have users in the database. Either:
1. Run `npm run db:reset` to clear everything and re-seed
2. Use the existing admin account to login

### Passwords don't work

The seed file uses placeholder password hashes. If login fails:

1. Reset Supabase:
   ```bash
   npx supabase db reset
   ```

2. Re-run migrations:
   ```bash
   npx supabase db push
   ```

3. Manually create the first user via signup:
   - Visit http://localhost:3005/signup
   - This will create the first admin user
   - Subsequent users must be invited

## Customizing Seed Data

To customize the seed data:

1. Edit [supabase/seed.sql](supabase/seed.sql)
2. Modify the INSERT statements for:
   - Agency name
   - User emails and names
   - Passwords (update the `encrypted_password` field)
3. Run `npm run db:seed`

### Generating Password Hashes

To generate a proper bcrypt hash for a new password:

```bash
# Using Node.js
npx bcrypt-cli hash "YourPassword123!" 10
```

## Files

- **Seed Data**: [supabase/seed.sql](supabase/seed.sql)
- **Seed Script**: [scripts/seed-db.sh](scripts/seed-db.sh)
- **Package Scripts**: [package.json](package.json) (lines 26-27)

## Development Workflow

Typical workflow for development:

```bash
# 1. Start Supabase
npx supabase start

# 2. Seed database
npm run db:seed

# 3. Start dev servers
npm run dev

# 4. Login and develop
# Visit http://localhost:3005/login
```

## Resetting Everything

To start fresh:

```bash
# Stop Supabase
npx supabase stop

# Start Supabase (fresh instance)
npx supabase start

# Seed the database
npm run db:seed
```

## Production Notes

⚠️ **IMPORTANT**: This seed file is for **development only**.

- Never run seed.sql in production
- The credentials (`admin@pleeno.dev`, etc.) are for local development only
- Production should use the signup flow to create the first admin user
- Or use proper user provisioning tools
