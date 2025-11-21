#!/bin/bash

echo "=== Authentication Test Script ==="
echo ""
echo "1. Testing shell zone (port 3005):"
curl -s "http://localhost:3005" | grep -q "DOCTYPE" && echo "  ✓ Shell zone is running" || echo "  ✗ Shell zone not accessible"
echo ""

echo "2. Testing dashboard zone (port 3002):"
curl -s "http://localhost:3002/dashboard" | grep -q "DOCTYPE" && echo "  ✓ Dashboard zone is running" || echo "  ✗ Dashboard zone not accessible"
echo ""

echo "3. Testing dashboard API endpoint (without auth):"
response=$(curl -s "http://localhost:3002/dashboard/api/kpis")
echo "  Response: $response"
if echo "$response" | grep -q "Unauthorized"; then
  echo "  ✗ Getting 401 Unauthorized (expected if not logged in)"
else
  echo "  ✓ API returned data (user is authenticated)"
fi
echo ""

echo "4. Checking Supabase configuration in dashboard zone:"
if [ -f "apps/dashboard/.env.local" ]; then
  supabase_url=$(grep "NEXT_PUBLIC_SUPABASE_URL" apps/dashboard/.env.local | cut -d'=' -f2)
  echo "  Supabase URL: $supabase_url"
  if echo "$supabase_url" | grep -q "127.0.0.1"; then
    echo "  ✓ Using local Supabase"
  else
    echo "  ✗ Using production Supabase (this is the problem!)"
  fi
else
  echo "  ✗ No .env.local file found"
fi
echo ""

echo "5. Checking local Supabase status:"
if curl -s "http://127.0.0.1:54321/rest/v1/" > /dev/null 2>&1; then
  echo "  ✓ Local Supabase is running"
else
  echo "  ✗ Local Supabase is NOT running (run: npx supabase start)"
fi
echo ""

echo "=== Next Steps ==="
echo "If you see '401 Unauthorized' above, you need to:"
echo "1. Make sure local Supabase is running: npx supabase start"
echo "2. Login at: http://localhost:3005/login"
echo "   Email: admin@test.local"
echo "   Password: Password123"
echo "3. Then access: http://localhost:3002/dashboard"
echo ""
echo "Note: You MUST login first before the API endpoints will work!"
