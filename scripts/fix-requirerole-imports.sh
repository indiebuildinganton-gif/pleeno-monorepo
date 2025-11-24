#!/bin/bash

# Script to fix incorrect requireRole imports across the Pleeno monorepo
# Changes: import { requireRole } from '@pleeno/auth'
# To:      import { requireRole } from '@pleeno/auth/server'

set -e

echo "🔧 Fixing requireRole imports across the monorepo..."
echo ""

# Counter for tracking fixes
FIXED_COUNT=0

# Array of files to fix (excluding already fixed files)
FILES=(
  # Agency App
  "apps/agency/app/api/agencies/[id]/route.ts"
  "apps/agency/app/api/agencies/[id]/settings/route.ts"
  "apps/agency/app/api/email-templates/[id]/route.ts"
  "apps/agency/app/api/email-templates/route.ts"
  "apps/agency/app/api/invitations/route.ts"
  "apps/agency/app/api/notification-rules/[id]/route.ts"
  "apps/agency/app/api/notification-rules/batch/route.ts"
  "apps/agency/app/api/notification-rules/route.ts"
  "apps/agency/app/api/users/[id]/tasks/route.ts"
  "apps/shell/app/api/agency/users/route.ts"
  
  # Entities App
  "apps/entities/app/api/branches/[id]/route.ts"
  "apps/entities/app/api/colleges/[id]/branches/route.ts"
  "apps/entities/app/api/colleges/[id]/contacts/route.ts"
  "apps/entities/app/api/colleges/[id]/route.ts"
  "apps/entities/app/api/contacts/[id]/route.ts"
  "apps/entities/app/api/notes/[id]/route.ts"
  "apps/entities/app/api/students/export/route.ts"
  "apps/entities/app/api/students/import/route.ts"
  "apps/entities/app/api/students/[id]/payment-history/route.ts"
  
  # Payments App
  "apps/payments/app/api/enrollments/route.ts"
  "apps/payments/app/api/payment-plans/[id]/route.ts"
  "apps/payments/app/api/payment-plans/route.ts"
  
  # Reports App
  "apps/reports/app/api/reports/commissions/export/route.ts"
  "apps/reports/app/api/reports/commissions/route.ts"
  "apps/reports/app/api/reports/lookup/branches/route.ts"
  "apps/reports/app/api/reports/lookup/colleges/route.ts"
  "apps/reports/app/api/reports/lookup/students/route.ts"
  "apps/reports/app/api/reports/payment-plans/export/route.ts"
  "apps/reports/app/api/reports/payment-plans/pdf/route.ts"
  "apps/reports/app/api/reports/payment-plans/route.ts"
  
  # Test Files
  "apps/agency/app/api/agencies/[id]/__tests__/route.test.ts"
  "apps/agency/app/api/agencies/[id]/settings/__tests__/route.test.ts"
  "apps/dashboard/app/api/activity-log/__tests__/route.test.ts"
  "apps/dashboard/app/api/cash-flow-projection/__tests__/route.test.ts"
  "apps/dashboard/app/api/commission-by-college/__tests__/route.test.ts"
  "apps/dashboard/app/api/commission-by-country/__tests__/route.test.ts"
  "apps/dashboard/app/api/commission-by-school/__tests__/route.test.ts"
  "apps/dashboard/app/api/due-soon-count/__tests__/route.test.ts"
  "apps/dashboard/app/api/kpis/__tests__/route.test.ts"
  "apps/dashboard/app/api/overdue-payments/__tests__/route.test.ts"
  "apps/dashboard/app/api/payment-status-summary/__tests__/route.test.ts"
  "apps/dashboard/app/api/seasonal-commission/__tests__/route.test.ts"
  "apps/payments/app/api/enrollments/__tests__/route.test.ts"
  "apps/payments/app/api/payment-plans/__tests__/route.test.ts"
  "apps/reports/app/api/reports/lookup/branches/__tests__/route.test.ts"
  "apps/reports/app/api/reports/lookup/colleges/__tests__/route.test.ts"
  "apps/reports/app/api/reports/lookup/students/__tests__/route.test.ts"
  "apps/reports/app/api/reports/payment-plans/__tests__/route.test.ts"
  "apps/reports/app/api/reports/payment-plans/export/__tests__/activity-logging.test.ts"
  "apps/reports/app/api/reports/payment-plans/export/__tests__/route.test.ts"
  "apps/reports/app/api/reports/payment-plans/pdf/__tests__/route.test.ts"
)

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📁 Working directory: $(pwd)"
echo "📝 Files to fix: ${#FILES[@]}"
echo ""

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file contains the incorrect import
    if grep -q "import { requireRole } from '@pleeno/auth'" "$file"; then
      echo "  ✓ Fixing: $file"
      
      # Use sed to replace the incorrect import
      # macOS requires '' after -i, Linux doesn't
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/import { requireRole } from '@pleeno\/auth'/import { requireRole } from '@pleeno\/auth\/server'/g" "$file"
      else
        sed -i "s/import { requireRole } from '@pleeno\/auth'/import { requireRole } from '@pleeno\/auth\/server'/g" "$file"
      fi
      
      ((FIXED_COUNT++))
    else
      echo "  ⊘ Skipped (already fixed or no match): $file"
    fi
  else
    echo "  ⚠ Warning: File not found: $file"
  fi
done

echo ""
echo "✅ Complete! Fixed $FIXED_COUNT files."
echo ""
echo "📋 Next steps:"
echo "  1. Review the changes with: git diff"
echo "  2. Restart dev servers to apply changes"
echo "  3. Run tests to verify: npm test"
echo ""
