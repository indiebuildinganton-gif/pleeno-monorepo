# Prompt: Configure Vercel Environment Variables

Copy and paste this prompt into a new Claude Code session to configure environment variables for all Vercel projects:

---

I need you to configure environment variables for all 6 Vercel projects in our monorepo using the Vercel CLI.

## Context

We have a pnpm monorepo with 6 Next.js apps that have been successfully deployed to Vercel, but they're missing required environment variables. The apps are currently returning 500 errors because the middleware can't access Supabase configuration.

## Project Information

**GitHub Secrets Available:**
- `VERCEL_TOKEN` - Authentication token for Vercel CLI
- `VERCEL_ORG_ID` - Organization ID
- `VERCEL_PROJECT_ID_DASHBOARD` - Dashboard project ID
- `VERCEL_PROJECT_ID_ENTITIES` - Entities project ID
- `VERCEL_PROJECT_ID_PAYMENTS` - Payments project ID
- `VERCEL_PROJECT_ID_AGENCY` - Agency project ID
- `VERCEL_PROJECT_ID_REPORTS` - Reports project ID
- `VERCEL_PROJECT_ID_SHELL` - Shell project ID

**Apps to Configure:**
1. Dashboard
2. Entities
3. Payments
4. Agency
5. Reports
6. Shell

## Required Environment Variables

All 6 projects need these environment variables configured for the **Production** environment:

```bash
# Supabase Configuration (CRITICAL - apps won't work without these)
NEXT_PUBLIC_SUPABASE_URL=https://iadhxztsuzbkbnhkimqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from .env.local file>

# App URLs for cross-app navigation
NEXT_PUBLIC_SHELL_URL=https://shell-3ik3zrnby-antons-projects-1b1c34d6.vercel.app
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard-h8pzfv2ks-antons-projects-1b1c34d6.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://agency-g47ipgn06-antons-projects-1b1c34d6.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://entities-n2illv8kx-antons-projects-1b1c34d6.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://payments-fhgvgtdcp-antons-projects-1b1c34d6.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://reports-kzfwvwz6f-antons-projects-1b1c34d6.vercel.app

# App URL (same as shell URL)
NEXT_PUBLIC_APP_URL=https://shell-3ik3zrnby-antons-projects-1b1c34d6.vercel.app

# Cookie domain for cross-app authentication
NEXT_PUBLIC_COOKIE_DOMAIN=.vercel.app

# Node environment
NODE_ENV=production
```

## Tasks

Please complete these tasks:

1. **Read the Supabase anon key** from `.env.local` file in the repository root

2. **For EACH of the 6 projects**, use the Vercel CLI to add ALL environment variables listed above:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production --token=$VERCEL_TOKEN
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token=$VERCEL_TOKEN
   # ... and so on for all variables
   ```

3. **Important Notes:**
   - Use the `--token` flag with GitHub secret for authentication
   - Set each variable for the **production** environment only
   - You may need to switch to the correct project context using the project ID
   - The Vercel CLI syntax is: `echo "value" | vercel env add VAR_NAME production`

4. **After configuration**, create a summary showing:
   - Which projects were configured
   - How many environment variables were added per project
   - Any errors encountered

5. **Create a bash script** at `scripts/configure-vercel-env.sh` that can be run to configure all variables automatically using the GitHub secrets as environment variables

## Expected Outcome

- All 6 Vercel projects should have 11 environment variables configured
- Apps should be able to initialize Supabase clients without errors
- Middleware should execute successfully
- A reusable script should be created for future environment variable updates

## Files to Reference

- `.env.local` - Contains actual Supabase anon key
- `.env.example` - Shows structure of environment variables
- `docs/deployment/VERCEL_ENV_SETUP.md` - Documentation on required variables
- `.github/workflows/deploy-production.yml` - Shows project IDs and secrets

## Verification

After configuring, you can verify by:
1. Checking one project: `vercel env ls --token=$VERCEL_TOKEN`
2. Triggering a redeployment via the GitHub Actions workflow
3. Visiting one of the deployed URLs to see if the 500 error is resolved

Please proceed with configuring the environment variables for all 6 projects.
