#!/bin/bash

echo "========================================"
echo "TESTING VERCEL CONFIGURATION"
echo "========================================"
echo ""

# Test if the check-config endpoint works
echo "1. Testing /api/check-config endpoint..."
RESPONSE=$(curl -s https://pleeno-shell-uat.vercel.app/api/check-config 2>/dev/null || echo "FAILED")

if [[ "$RESPONSE" == *"supabase_url"* ]]; then
  echo "✅ Config endpoint is deployed"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Config endpoint not found or not deployed"
fi

echo ""
echo "2. Testing /api/debug-auth endpoint..."
DEBUG_RESPONSE=$(curl -s -X POST https://pleeno-shell-uat.vercel.app/api/debug-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"password"}' 2>/dev/null || echo "FAILED")

if [[ "$DEBUG_RESPONSE" == *"config"* ]]; then
  echo "✅ Debug endpoint is deployed"
  echo "$DEBUG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DEBUG_RESPONSE"
else
  echo "❌ Debug endpoint not found or not deployed"
fi

echo ""
echo "3. Testing login with verbose error..."
echo "Attempting login with admin@test.local..."
LOGIN_RESPONSE=$(curl -s -X POST https://pleeno-shell-uat.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"password"}' \
  -w "\nHTTP_STATUS:%{http_code}" 2>/dev/null)

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Response: $BODY"
echo "HTTP Status: $HTTP_STATUS"

echo ""
echo "========================================"
echo "EXPECTED vs ACTUAL CONFIGURATION"
echo "========================================"
echo ""
echo "Expected Supabase URL: https://ccmciliwfdtdspdlkuos.supabase.co"
echo "Expected Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ"
echo ""
echo "Check if Vercel has these EXACT values set."