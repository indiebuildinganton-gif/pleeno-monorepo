# Prompt: Fix Post-Login Redirect Issue - Option 3

## Context
The shell app at https://shell-pink-delta.vercel.app successfully authenticates users (200 OK), but redirects them to a stale/invalid dashboard URL resulting in a 404 error. See full analysis in `docs/deployment/AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md`.

## Problem
The `NEXT_PUBLIC_DASHBOARD_URL` environment variable in Vercel's shell project is set to:
```
https://dashboard-4aygkovdf-antons-projects-1b1c34d6.vercel.app/
```
This is an old preview deployment that no longer exists.

## Your Task
Find the correct production dashboard URL and update the Vercel environment variable to fix the post-login redirect.

## Step-by-Step Instructions

### 1. Find the Dashboard Project in Vercel
```bash
# List all projects to find the dashboard project
vercel list --scope pleeno-yb5fuvs3z
```

Expected output should show projects like:
- dashboard (or similar name)
- entities
- payments
- shell
- etc.

### 2. Get the Dashboard Production URL
```bash
# Get deployments for the dashboard project
vercel list dashboard --scope pleeno-yb5fuvs3z --prod

# Or if the project has a different name:
vercel list <dashboard-project-name> --scope pleeno-yb5fuvs3z --prod
```

Look for the production deployment URL. It should be something like:
- `https://dashboard-<hash>.vercel.app`
- OR a custom domain like `https://dashboard.plenno.com.au`

**Alternative method if the above doesn't work:**
```bash
# Use Vercel API to get all projects
curl -s "https://api.vercel.com/v9/projects?teamId=team_yb5fuvs3z" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -m json.tool | grep -A 5 "dashboard"

# Get deployments for dashboard project
curl -s "https://api.vercel.com/v13/deployments?projectId=<dashboard-project-id>&target=production&limit=1&teamId=team_yb5fuvs3z" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -m json.tool
```

### 3. Verify the Dashboard URL Works
```bash
# Test that the dashboard URL is accessible
curl -I -s https://<dashboard-url>/ | head -n 1
```

Expected: `HTTP/2 200` or `HTTP/2 301` (redirect)

### 4. Update the Shell Environment Variable
```bash
# Set the correct dashboard URL
DASHBOARD_URL="https://<correct-dashboard-url>.vercel.app"  # Replace with actual URL

# Update via Vercel API
curl -X PATCH "https://api.vercel.com/v9/projects/prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5/env/fTxkx7hTJQmQT3gP" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"value\": \"$DASHBOARD_URL\", \"target\": [\"production\"]}"
```

**Verify the update:**
```bash
# Check that the environment variable was updated
curl -s "https://api.vercel.com/v9/projects/prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5/env/fTxkx7hTJQmQT3gP" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -m json.tool
```

### 5. Trigger Redeployment
The environment variable change requires a new deployment to take effect:

```bash
# Create an empty commit to trigger redeployment
git commit --allow-empty -m "Update dashboard URL for post-login redirect

Fixed NEXT_PUBLIC_DASHBOARD_URL to point to correct production deployment.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger deployment
git push origin main
```

### 6. Wait for Deployment and Test
```bash
# Monitor deployment status
vercel inspect https://shell-pink-delta.vercel.app --scope pleeno-yb5fuvs3z --wait

# Or check via GitHub Actions
gh run list --limit 1
gh run watch
```

**Once deployed, test the login flow:**
```bash
# Test authentication and check redirect
curl -v https://shell-pink-delta.vercel.app/api/auth/login \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}' 2>&1 | \
  grep -E "(HTTP/2|location:)"
```

**Manual test in browser:**
1. Go to https://shell-pink-delta.vercel.app/login
2. Login with: `admin@test.local` / `password`
3. Verify you're redirected to the dashboard at the correct URL
4. Confirm the dashboard loads successfully (no 404)

## Important Notes

### Environment Variable Details
- **Project ID**: `prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5` (shell)
- **Env Var ID**: `fTxkx7hTJQmQT3gP` (NEXT_PUBLIC_DASHBOARD_URL)
- **Team/Scope**: `pleeno-yb5fuvs3z`

### VERCEL_TOKEN
You'll need the Vercel token to make API calls. Check if it's set:
```bash
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN is not set"
  echo "Please set it with: export VERCEL_TOKEN=<your-token>"
else
  echo "✅ VERCEL_TOKEN is set"
fi
```

If not set, you can get it from:
1. Vercel Dashboard → Settings → Tokens
2. Or use `vercel` CLI which may have cached credentials

### Fallback: Use Custom Domains
If you can't find a stable Vercel deployment URL, consider using custom domains instead:
- `https://dashboard.plenno.com.au`
- `https://entities.plenno.com.au`
- etc.

These are already configured as fallbacks in the code at `apps/shell/lib/multi-zone-redirect.ts:28-33`.

## Expected Outcome

After completing these steps:
1. ✅ `NEXT_PUBLIC_DASHBOARD_URL` points to a valid, accessible dashboard URL
2. ✅ Shell app is redeployed with the new environment variable
3. ✅ Users can login at https://shell-pink-delta.vercel.app/login
4. ✅ Users are redirected to the correct dashboard URL after login
5. ✅ Dashboard page loads successfully (no 404)

## Troubleshooting

### If you can't find the dashboard project
```bash
# List all projects with more details
vercel list --scope pleeno-yb5fuvs3z | grep -i dash

# Or search via API
curl -s "https://api.vercel.com/v9/projects?teamId=team_yb5fuvs3z" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -m json.tool | grep -B 2 -A 5 '"name"'
```

### If the dashboard URL returns 404
The dashboard app might not be deployed yet. Check:
```bash
# See recent deployments
gh run list --workflow=deploy-production.yml --limit 5

# Check specific workflow run
gh run view <run-id>
```

### If environment variable update fails
- Verify `VERCEL_TOKEN` has write permissions
- Check project ID is correct: `prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5`
- Ensure you're using the correct team scope: `pleeno-yb5fuvs3z`

## Success Criteria

✅ **Complete when**:
1. Dashboard production URL is identified and verified accessible
2. `NEXT_PUBLIC_DASHBOARD_URL` environment variable is updated in Vercel
3. Shell app is redeployed
4. Login → redirect → dashboard flow works end-to-end without 404 errors

## Related Documentation
- Full issue analysis: `docs/deployment/AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md`
- Login page code: `apps/shell/app/(auth)/login/page.tsx:71-81`
- Multi-zone redirect logic: `apps/shell/lib/multi-zone-redirect.ts:57-80`
- Deployment workflow: `.github/workflows/deploy-production.yml:531-536`
