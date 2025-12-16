# Prompt for Configuring GitHub Repository Secrets

Copy and paste this entire prompt into a new Claude Code session to configure all required GitHub repository secrets for Vercel deployment.

---

## TASK: Configure GitHub Repository Secrets for Vercel Deployment

I need you to configure all required GitHub repository secrets for our Vercel deployment workflow using the GitHub CLI (`gh`).

### Context
We have a Next.js monorepo with 6 apps that deploy to Vercel via GitHub Actions:
- dashboard
- entities
- payments
- agency
- reports
- shell

The deployment workflow at `.github/workflows/deploy-production.yml` requires 8 GitHub repository secrets to be configured.

### What You Need to Do

**Step 1: Get Vercel Authentication Information**

Run these commands to get the required Vercel credentials:

```bash
# Get Vercel token and org ID
cat ~/.vercel/auth.json
```

This will output JSON with:
- `token`: Your Vercel authentication token (VERCEL_TOKEN)
- `orgId` or `teamId`: Your Vercel organization/team ID (VERCEL_ORG_ID)

**Step 2: Get All Vercel Project IDs**

For each app, check if it's already linked to a Vercel project:

```bash
# Check all apps for existing Vercel project links
for app in dashboard entities payments agency reports shell; do
  echo "=== $app ==="
  if [ -f "apps/$app/.vercel/project.json" ]; then
    cat "apps/$app/.vercel/project.json"
  else
    echo "Not linked yet"
  fi
  echo ""
done
```

**If any apps are NOT linked yet**, link them now:

```bash
cd apps/dashboard
vercel link
# Follow prompts to link to existing Vercel project or create new one
# Repeat for each unlinked app
```

After linking, re-run the project ID check above to get all 6 project IDs.

**Step 3: Configure GitHub Repository Secrets**

Using the values you gathered, configure each secret using the `gh` CLI:

```bash
# Replace YOUR_REPO_OWNER and YOUR_REPO_NAME with the actual repository
# Example: mystbrent/pleeno

# Set VERCEL_TOKEN (from ~/.vercel/auth.json -> token field)
gh secret set VERCEL_TOKEN --body "YOUR_VERCEL_TOKEN_HERE" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME

# Set VERCEL_ORG_ID (from ~/.vercel/auth.json -> teamId or orgId field)
gh secret set VERCEL_ORG_ID --body "YOUR_ORG_ID_HERE" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME

# Set project IDs (from each app's .vercel/project.json -> projectId field)
gh secret set VERCEL_PROJECT_ID_DASHBOARD --body "YOUR_DASHBOARD_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
gh secret set VERCEL_PROJECT_ID_ENTITIES --body "YOUR_ENTITIES_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
gh secret set VERCEL_PROJECT_ID_PAYMENTS --body "YOUR_PAYMENTS_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
gh secret set VERCEL_PROJECT_ID_AGENCY --body "YOUR_AGENCY_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
gh secret set VERCEL_PROJECT_ID_REPORTS --body "YOUR_REPORTS_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
gh secret set VERCEL_PROJECT_ID_SHELL --body "YOUR_SHELL_PROJECT_ID" --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
```

**Step 4: Verify Secrets are Configured**

```bash
gh secret list --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
```

You should see all 8 secrets listed:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID_DASHBOARD
- VERCEL_PROJECT_ID_ENTITIES
- VERCEL_PROJECT_ID_PAYMENTS
- VERCEL_PROJECT_ID_AGENCY
- VERCEL_PROJECT_ID_REPORTS
- VERCEL_PROJECT_ID_SHELL

**Step 5: Test the Deployment Workflow**

Once all secrets are configured, trigger a manual deployment to test:

```bash
gh workflow run deploy-production.yml --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
```

Then monitor the workflow:

```bash
gh run list --workflow=deploy-production.yml --limit 1 --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
```

### Important Notes

1. **Repository Detection**: First, determine the correct repository owner and name:
   ```bash
   git remote -v
   # Look for the 'mystbrent' remote or similar
   ```

2. **Authentication**: Ensure you're authenticated with `gh`:
   ```bash
   gh auth status
   ```
   If not authenticated, run:
   ```bash
   gh auth login
   ```

3. **Vercel Authentication**: Ensure you're logged into Vercel:
   ```bash
   vercel whoami
   ```
   If not logged in, run:
   ```bash
   vercel login
   ```

4. **Project Linking**: When running `vercel link`, you'll be asked:
   - "Set up and deploy?" → Choose your existing projects
   - "Link to existing project?" → Yes
   - "What's your project's name?" → Select from list
   - "In which directory is your code located?" → ./ (current directory)

5. **Security**: These secrets contain sensitive authentication tokens. Never commit them to the repository or share them publicly.

### Troubleshooting

**Error: "gh: command not found"**
- Install GitHub CLI: https://cli.github.com/

**Error: "vercel: command not found"**
- Install Vercel CLI: `npm install -g vercel`

**Error: "No Vercel credentials found"**
- Run `vercel login` first

**Error: "HTTP 404: Repository not found"**
- Check the repository owner and name are correct
- Ensure you have admin access to the repository

**Error: "Project not found when linking"**
- Create the projects in Vercel dashboard first: https://vercel.com/new
- Then run `vercel link` to link local app to Vercel project

### Expected Output

After completing all steps, you should see:
1. All 8 secrets listed in `gh secret list` output
2. Deployment workflow triggers successfully
3. No "No existing credentials found" errors in workflow logs

### Final Verification

Check that the workflow is using the secrets correctly:

```bash
# Get the latest workflow run
gh run view --repo YOUR_REPO_OWNER/YOUR_REPO_NAME

# If it fails, view the logs
gh run view --log-failed --repo YOUR_REPO_OWNER/YOUR_REPO_NAME
```

The "Pull Vercel Environment Information" step should now succeed and you should see actual project information being pulled.

---

## Please Execute This Task

Follow the steps above, run all commands, configure all 8 secrets, and verify the deployment workflow succeeds. Report back with:

1. The output of `gh secret list` showing all 8 secrets
2. The status of the test deployment workflow run
3. Any errors encountered and how you resolved them

Take your time and be thorough. This is critical for the deployment pipeline to work.
