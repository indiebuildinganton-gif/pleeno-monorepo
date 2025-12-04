#!/bin/bash

# Add environment variables to Vercel from .env.uat file
# Pass zone name as first argument to override NEXT_PUBLIC_ZONE_NAME
zone_name=$1

while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -n "$key" && ! "$key" =~ ^# ]]; then
    # Remove any leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    if [ -n "$value" ]; then
      # Override zone name if provided
      if [ "$key" = "NEXT_PUBLIC_ZONE_NAME" ] && [ -n "$zone_name" ]; then
        echo "Adding $key=$zone_name..."
        echo "$zone_name" | vercel env add "$key" production --yes 2>/dev/null
      else
        echo "Adding $key..."
        echo "$value" | vercel env add "$key" production --yes 2>/dev/null
      fi
    fi
  fi
done < .env.uat

echo "Environment variables added successfully!"