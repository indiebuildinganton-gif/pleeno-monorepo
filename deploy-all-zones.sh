#!/bin/bash

# Deploy all Pleeno zones to Vercel UAT environment

echo "🚀 Deploying all Pleeno zones to Vercel UAT..."

# Array of zones to deploy
zones=("dashboard" "agency" "entities" "payments" "reports")

# Function to create and deploy a zone
deploy_zone() {
    local zone=$1
    echo ""
    echo "📦 Deploying $zone..."

    # Create Vercel project for the zone
    vercel project add "pleeno-${zone}-uat" 2>/dev/null || echo "Project already exists"

    # Create vercel.json for the zone
    cat > "vercel-${zone}.json" <<EOF
{
  "buildCommand": "pnpm run build:${zone}",
  "outputDirectory": "apps/${zone}/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"]
}
EOF

    # Link and deploy
    rm -rf .vercel
    vercel link --project="pleeno-${zone}-uat" --yes

    # Add environment variables
    echo "Adding environment variables for $zone..."
    cat .env.uat | grep -E "^[^#]" | while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            # Add zone-specific variable
            if [ "$key" = "NEXT_PUBLIC_ZONE_NAME" ]; then
                echo "$zone" | vercel env add "$key" production --yes 2>/dev/null
            else
                echo "$value" | vercel env add "$key" production --yes 2>/dev/null
            fi
        fi
    done

    # Deploy with the zone-specific vercel.json
    vercel --prod --yes --local-config="vercel-${zone}.json"

    # Clean up
    rm "vercel-${zone}.json"

    echo "✅ $zone deployed successfully!"
}

# Deploy each zone
for zone in "${zones[@]}"; do
    deploy_zone "$zone"
done

echo ""
echo "🎉 All zones deployed successfully!"
echo ""
echo "Zone URLs:"
echo "- Dashboard: Check Vercel dashboard for URL"
echo "- Agency: Check Vercel dashboard for URL"
echo "- Entities: Check Vercel dashboard for URL"
echo "- Payments: Check Vercel dashboard for URL"
echo "- Reports: Check Vercel dashboard for URL"
echo ""
echo "Next steps:"
echo "1. Get the deployed URLs from Vercel dashboard"
echo "2. Update .env.uat with the actual zone URLs"
echo "3. Update shell app environment variables on Vercel"
echo "4. Redeploy shell app"