#!/bin/bash

# Properly redeploy all zones with their own builds

zones=("dashboard" "agency" "entities" "payments" "reports")

for zone in "${zones[@]}"; do
    echo "========================================="
    echo "Redeploying $zone with proper build..."
    echo "========================================="

    # Link to the zone's project
    rm -rf .vercel
    vercel link --project="pleeno-${zone}-uat" --yes

    # Create proper vercel.json at root for this deployment
    cat > vercel.json <<EOF
{
  "buildCommand": "pnpm run build:${zone}",
  "outputDirectory": "apps/${zone}/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"]
}
EOF

    # Deploy
    vercel --prod --yes

    echo "✅ $zone redeployed with proper build!"
    echo ""
done

# Finally redeploy shell with updated zone URLs
echo "========================================="
echo "Redeploying shell app..."
echo "========================================="

rm -rf .vercel
vercel link --project="pleeno-shell-uat" --yes

cat > vercel.json <<EOF
{
  "buildCommand": "pnpm run build:shell",
  "outputDirectory": "apps/shell/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"]
}
EOF

vercel --prod --yes

echo "✅ All zones redeployed properly!"