#!/bin/bash

# Redeploy all zones with updated environment variables

zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

echo "Redeploying all zones with updated environment variables..."

for zone in "${zones[@]}"; do
    echo "========================================="
    echo "Redeploying $zone..."
    echo "========================================="

    # Link to project
    rm -rf .vercel
    vercel link --project="pleeno-${zone}-uat" --yes

    # Create proper vercel.json for this deployment
    cat > vercel.json <<EOF
{
  "buildCommand": "pnpm run build:${zone}",
  "outputDirectory": "apps/${zone}/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"]
}
EOF

    # Redeploy
    vercel --prod --yes

    echo "✅ $zone redeployed!"
    echo ""
done

echo "All zones redeployed with environment variables!"