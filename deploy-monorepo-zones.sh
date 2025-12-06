#!/bin/bash

echo "Deploying all zones from monorepo root"
echo "======================================="

# Make sure we're in the root directory
cd /Users/brenttudas/Pleeno

# Array of zones to deploy
declare -a zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

# Deploy each zone separately
for zone in "${zones[@]}"; do
  echo ""
  echo "Deploying $zone..."
  echo "------------------------"

  # Create vercel.json specific for this zone
  cat > vercel.json <<EOF
{
  "buildCommand": "pnpm run build:$zone",
  "outputDirectory": "apps/$zone/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
EOF

  # Link to the correct project
  npx vercel link --project "pleeno-$zone-uat" --yes

  # Deploy with the zone-specific config
  npx vercel --prod --yes

  if [ $? -eq 0 ]; then
    echo "✅ $zone deployed successfully"
  else
    echo "❌ Failed to deploy $zone"
  fi
done

# Clean up
rm vercel.json

echo ""
echo "======================================="
echo "All zones have been processed!"
echo ""
echo "Custom domain URLs:"
echo "- Shell: https://shell.plenno.com.au"
echo "- Dashboard: https://dashboard.plenno.com.au"
echo "- Agency: https://agency.plenno.com.au"
echo "- Entities: https://entities.plenno.com.au"
echo "- Payments: https://payments.plenno.com.au"
echo "- Reports: https://reports.plenno.com.au"