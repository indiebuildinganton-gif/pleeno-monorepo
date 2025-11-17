#!/bin/bash

# ============================================================
# Create First User via Signup API
# ============================================================
# Creates the first admin user using the signup endpoint
# This is the proper way to bootstrap the system
# ============================================================

set -e

echo "=========================================="
echo "Creating First Admin User"
echo "=========================================="
echo ""

# Check if shell app is running
if ! curl -s http://localhost:3005 > /dev/null 2>&1; then
    echo "❌ Error: Shell app not running on port 3005"
    echo ""
    echo "Please start the app first:"
    echo "  npm run dev:shell"
    echo ""
    exit 1
fi

echo "📝 Creating admin user via signup API..."
echo ""

# Create the first user
RESPONSE=$(curl -s -X POST http://localhost:3005/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "full_name": "Admin User",
    "agency_name": "Demo Agency"
  }')

# Check if successful
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error creating user:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""

    # Check if it's the "already exists" error
    if echo "$RESPONSE" | grep -q "Public signup is disabled"; then
        echo "ℹ️  Users already exist in the database."
        echo ""
        echo "To reset and start fresh:"
        echo "  npm run db:reset"
        echo ""
        echo "Or try logging in with existing credentials:"
        echo "  http://localhost:3005/login"
    fi
    exit 1
fi

echo "✅ Admin user created successfully!"
echo ""
echo "=========================================="
echo "Login Credentials"
echo "=========================================="
echo "Email:    admin@test.com"
echo "Password: Admin123!"
echo "Role:     Agency Admin"
echo ""
echo "Visit: http://localhost:3005/login"
echo "=========================================="
echo ""
