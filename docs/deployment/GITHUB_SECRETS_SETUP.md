# GitHub Repository Secrets Setup

The deployment workflow requires several secrets to be configured in your GitHub repository.

## Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### 1. VERCEL_TOKEN
- **How to get it**: Run `vercel login` locally, then `cat ~/.vercel/auth.json`
- **Alternative**: Go to https://vercel.com/account/tokens and create a new token
- **Value**: Your Vercel authentication token

### 2. VERCEL_ORG_ID
- **How to get it**:
  ```bash
  # Option 1: From your local .vercel folder after running vercel login
  cat ~/.vercel/auth.json

  # Option 2: From Vercel dashboard
  # Go to Settings → General → Team ID
  ```
- **Value**: Your Vercel organization/team ID

### 3. VERCEL_PROJECT_ID_DASHBOARD
- **How to get it**:
  ```bash
  cd apps/dashboard
  vercel link  # Link to your Vercel project
  cat .vercel/project.json  # Find projectId
  ```
- **Value**: The Vercel project ID for the dashboard app

### 4. VERCEL_PROJECT_ID_ENTITIES
- **How to get it**: Same process as dashboard, but in `apps/entities`
- **Value**: The Vercel project ID for the entities app

### 5. VERCEL_PROJECT_ID_PAYMENTS
- **How to get it**: Same process as dashboard, but in `apps/payments`
- **Value**: The Vercel project ID for the payments app

### 6. VERCEL_PROJECT_ID_AGENCY
- **How to get it**: Same process as dashboard, but in `apps/agency`
- **Value**: The Vercel project ID for the agency app

### 7. VERCEL_PROJECT_ID_REPORTS
- **How to get it**: Same process as dashboard, but in `apps/reports`
- **Value**: The Vercel project ID for the reports app

### 8. VERCEL_PROJECT_ID_SHELL
- **How to get it**: Same process as dashboard, but in `apps/shell`
- **Value**: The Vercel project ID for the shell app

## Quick Setup Script

You can get all project IDs at once:

```bash
# Get Vercel token and org ID
cat ~/.vercel/auth.json

# Get all project IDs
for app in dashboard entities payments agency reports shell; do
  echo "=== $app ==="
  if [ -f "apps/$app/.vercel/project.json" ]; then
    cat "apps/$app/.vercel/project.json"
  else
    echo "Not linked yet. Run: cd apps/$app && vercel link"
  fi
  echo ""
done
```

## Verification

After adding all secrets, you can verify they're set by:

1. Go to Settings → Secrets and variables → Actions
2. You should see all 8 secrets listed (values are hidden)
3. Run the workflow manually: Actions → Deploy to Vercel Production → Run workflow

## Troubleshooting

### Error: "No existing credentials found"
- Check that `VERCEL_TOKEN` secret is set and not empty
- Verify the token is valid by testing it locally:
  ```bash
  vercel whoami --token YOUR_TOKEN_HERE
  ```

### Error: "Project not found"
- Check that `VERCEL_PROJECT_ID_*` secrets match your Vercel projects
- Verify each project exists in your Vercel dashboard
- Ensure the org ID matches the organization that owns the projects

### Error: "Permission denied"
- Ensure your Vercel token has write access to the projects
- If using a team, make sure the token has appropriate team permissions
