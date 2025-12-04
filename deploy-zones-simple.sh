#!/bin/bash

# Deploy all zones using the shell build (since they're all routed through shell)
zones=("agency" "entities" "payments" "reports")

for zone in "${zones[@]}"; do
    echo "Deploying $zone..."

    # Create project
    vercel project add "pleeno-${zone}-uat" 2>/dev/null || echo "Project exists"

    # Link project
    rm -rf .vercel
    vercel link --project="pleeno-${zone}-uat" --yes

    # Add env vars
    ./add-env-vars.sh "$zone"

    # Deploy using shell build (all zones use the same build)
    vercel --prod --yes --local-config=vercel.json

    echo "✅ $zone deployed"
done

echo "All zones deployed!"