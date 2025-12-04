#!/bin/bash

# Add environment variables to Vercel from .env.uat file
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -n "$key" && ! "$key" =~ ^# ]]; then
    # Remove any leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    if [ -n "$value" ]; then
      echo "Adding $key..."
      echo "$value" | vercel env add "$key" production --yes 2>/dev/null
    fi
  fi
done < .env.uat

echo "Environment variables added successfully!"