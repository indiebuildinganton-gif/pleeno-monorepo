#!/bin/bash

# Projects to update
PROJECTS=("dashboard" "shell" "reports" "agency" "payments" "entities")

# Environments to target
ENVIRONMENTS=("production" "preview" "development")

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environment=$3

    echo "  Adding $var_name to $environment..."
    echo "$var_value" | vercel env add "$var_name" "$environment" --force 2>&1 | tail -1
}

# Loop through each project
for PROJECT in "${PROJECTS[@]}"; do
    echo "========================================="
    echo "Processing project: $PROJECT"
    echo "========================================="

    cd "apps/$PROJECT" || continue

    # Add each environment variable
    for ENV in "${ENVIRONMENTS[@]}"; do
        echo "Environment: $ENV"
        add_env_var "OCR_ENABLED" "true" "$ENV"
        add_env_var "MISTRAL_API_KEY" "lql4NEMBd4TVmaVj0D4bTWXraTaLyaht" "$ENV"
        add_env_var "MISTRAL_MODEL" "mistral-ocr-latest" "$ENV"
        add_env_var "MISTRAL_VISION_MODEL" "pixtral-12b-latest" "$ENV"
        add_env_var "MISTRAL_API_BASE_URL" "https://api.mistral.ai/v1" "$ENV"
        add_env_var "MISTRAL_TIMEOUT_SECONDS" "30" "$ENV"
        add_env_var "OCR_CONCURRENCY" "5" "$ENV"
        add_env_var "OCR_TIMEOUT_MS" "60000" "$ENV"
        echo ""
    done

    cd ../..
    echo "✓ Completed: $PROJECT"
    echo ""
done

echo "========================================="
echo "All environment variables added!"
echo "========================================="
