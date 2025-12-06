#!/bin/bash

echo "Deploying all zones with custom domain configuration"
echo "====================================================="

# Array of zones to deploy (including shell)
zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

# Deploy each zone
for zone in "${zones[@]}"; do
  echo ""
  echo "Deploying $zone..."
  echo "------------------------"

  cd "/Users/brenttudas/Pleeno/apps/$zone" || {
    echo "Error: Could not navigate to $zone directory"
    continue
  }

  # Deploy to production
  npx vercel --prod --yes

  if [ $? -eq 0 ]; then
    echo "✅ $zone deployed successfully"
  else
    echo "❌ Failed to deploy $zone"
  fi
done

echo ""
echo "====================================================="
echo "All zones have been processed!"
echo ""
echo "Custom domain URLs:"
echo "- Shell: https://shell.plenno.com.au"
echo "- Dashboard: https://dashboard.plenno.com.au"
echo "- Agency: https://agency.plenno.com.au"
echo "- Entities: https://entities.plenno.com.au"
echo "- Payments: https://payments.plenno.com.au"
echo "- Reports: https://reports.plenno.com.au"
echo ""
echo "Note: DNS propagation may take a few minutes to complete."