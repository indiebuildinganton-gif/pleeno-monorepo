#!/bin/bash
# Advanced Monorepo Deployment Script for Vercel

echo "========================================"
echo "Pleeno Monorepo Deployment to Vercel"
echo "========================================"
echo ""

# Function to deploy an app
deploy_app() {
    local APP_NAME=$1
    local PROJECT_NAME=$2
    local DOMAIN=$3

    echo ""
    echo "========================================"
    echo "Deploying $APP_NAME"
    echo "========================================"

    # Deploy from root with specific settings for the app
    npx vercel deploy \
        --prod \
        --yes \
        --name="$PROJECT_NAME" \
        --build-env NODE_ENV=production \
        --build-env NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au \
        --build-env NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au \
        --build-env NEXT_PUBLIC_APP_URL=https://shell.plenno.com.au \
        --build-env NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au \
        --build-env NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au \
        --build-env NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au \
        --build-env NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au \
        --build-env NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au \
        --env NODE_ENV=production \
        --env NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au \
        --env NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au \
        --env NEXT_PUBLIC_APP_URL=https://shell.plenno.com.au \
        --env NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au \
        --env NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au \
        --env NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au \
        --env NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au \
        --env NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au \
        apps/$APP_NAME

    if [ $? -eq 0 ]; then
        echo "✅ $APP_NAME deployed successfully!"
        echo "Configure domain: $DOMAIN"
    else
        echo "❌ Failed to deploy $APP_NAME"
    fi
}

# Deploy all apps
deploy_app "shell" "pleeno-shell-prod" "shell.plenno.com.au"
deploy_app "dashboard" "pleeno-dashboard-prod" "dashboard.plenno.com.au"
deploy_app "agency" "pleeno-agency-prod" "agency.plenno.com.au"
deploy_app "entities" "pleeno-entities-prod" "entities.plenno.com.au"
deploy_app "payments" "pleeno-payments-prod" "payments.plenno.com.au"
deploy_app "reports" "pleeno-reports-prod" "reports.plenno.com.au"

echo ""
echo "========================================"
echo "Deployment Process Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard for each project"
echo "2. Configure custom domains"
echo "3. Update DNS records for plenno.com.au"
echo ""