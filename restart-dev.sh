#!/bin/bash

echo "🛑 Stopping all Next.js dev servers..."
pkill -f "next dev"
sleep 2

echo "✅ All dev servers stopped"
echo ""
echo "📝 IMPORTANT: Please clear your browser cookies for localhost:"
echo "   1. Open DevTools (F12 or Cmd+Option+I)"
echo "   2. Go to Application tab → Cookies → localhost"
echo "   3. Delete ALL cookies for localhost"
echo ""
echo "   Or use this shortcut:"
echo "   - Chrome/Edge: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)"
echo "   - Select 'Cookies and other site data'"
echo "   - Choose 'Last hour' and click 'Clear data'"
echo ""
read -p "Press ENTER after you've cleared cookies..."

echo ""
echo "🚀 Starting all dev servers with new cookie configuration..."
pnpm dev
