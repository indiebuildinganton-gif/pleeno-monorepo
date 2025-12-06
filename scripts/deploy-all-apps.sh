#!/bin/bash
# Script to deploy all Vercel projects

echo "========================================"
echo "Deploying All Pleeno Apps to Vercel"
echo "========================================"
echo ""

# First, commit any pending changes
echo "Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Committing pending changes..."
    git add -A
    git commit -m "Update Vercel configuration for all apps"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "Starting deployments..."
echo ""

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local app_dir=$2
    local project_name=$3

    echo "========================================"
    echo "Deploying $app_name"
    echo "========================================"

    cd "$app_dir"

    echo "Deploying to Vercel project: $project_name..."
    npx vercel --prod --yes --name="$project_name"

    if [ $? -eq 0 ]; then
        echo "✅ $app_name deployed successfully!"
    else
        echo "❌ Failed to deploy $app_name"
    fi

    cd ../..
    echo ""
}

# Deploy each app
deploy_app "Shell App" "apps/shell" "pleeno-shell-prod"
deploy_app "Dashboard App" "apps/dashboard" "pleeno-dashboard-prod"
deploy_app "Agency App" "apps/agency" "pleeno-agency-prod"
deploy_app "Entities App" "apps/entities" "pleeno-entities-prod"
deploy_app "Payments App" "apps/payments" "pleeno-payments-prod"
deploy_app "Reports App" "apps/reports" "pleeno-reports-prod"

echo "========================================"
echo "All Deployments Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Configure custom domains in Vercel Dashboard:"
echo "   - shell.plenno.com.au → pleeno-shell-prod"
echo "   - dashboard.plenno.com.au → pleeno-dashboard-prod"
echo "   - agency.plenno.com.au → pleeno-agency-prod"
echo "   - entities.plenno.com.au → pleeno-entities-prod"
echo "   - payments.plenno.com.au → pleeno-payments-prod"
echo "   - reports.plenno.com.au → pleeno-reports-prod"
echo ""
echo "2. Update DNS records for plenno.com.au:"
echo "   Add CNAME records for each subdomain pointing to cname.vercel-dns.com"
echo ""
echo "3. Run verification script:"
echo "   ./scripts/verify-deployment.sh"
echo ""