#!/bin/bash

# Create vercel.json for all apps to use npm
zones=("dashboard" "agency" "entities" "payments" "reports")

for zone in "${zones[@]}"; do
  cat > "/Users/brenttudas/Pleeno/apps/$zone/vercel.json" <<EOF
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
EOF
  echo "Created vercel.json for $zone"
done

echo "All vercel.json files created!"