#!/bin/bash
# Firebase React Native Quick Fix Script
# Cleans up old Firebase Web SDK and reinstalls dependencies
# Usage: bash QUICK_FIX.sh

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "🔥 Firebase React Native Quick Fix"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "⚠️  This script will:"
echo "   1. Delete node_modules and package-lock.json"
echo "   2. Clear Expo cache"
echo "   3. Reinstall dependencies"
echo "   4. Verify React Native Firebase is installed"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Step 1: Removing node_modules..."
rm -rf node_modules
echo "✅ Removed node_modules"

echo ""
echo "Step 2: Removing package-lock.json..."
rm -rf package-lock.json
echo "✅ Removed package-lock.json"

echo ""
echo "Step 3: Clearing Expo cache..."
rm -rf .expo
npx expo cache clean > /dev/null 2>&1 || true
echo "✅ Cleared Expo cache"

echo ""
echo "Step 4: Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "Step 5: Verifying React Native Firebase..."
npm ls @react-native-firebase/messaging
npm ls @react-native-firebase/app
echo "✅ React Native Firebase verified"

echo ""
echo "Step 6: Checking for old Firebase Web SDK..."
if npm ls firebase > /dev/null 2>&1; then
    echo "❌ WARNING: Old 'firebase' package still found!"
    echo "   Run: npm uninstall firebase"
else
    echo "✅ Old Firebase Web SDK not found"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Cleanup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Verify .env has Firebase configuration"
echo "  2. Place google-services.json at android/app/"
echo "  3. Run: npm run android"
echo ""
