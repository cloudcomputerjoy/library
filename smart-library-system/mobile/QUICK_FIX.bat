@echo off
REM Firebase React Native Quick Fix Script (Windows)
REM Cleans up old Firebase Web SDK and reinstalls dependencies
REM Usage: QUICK_FIX.bat

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo 🔥 Firebase React Native Quick Fix (Windows)
echo ════════════════════════════════════════════════════════════
echo.
echo ⚠️  This script will:
echo    1. Delete node_modules and package-lock.json
echo    2. Clear Expo cache
echo    3. Reinstall dependencies
echo    4. Verify React Native Firebase is installed
echo.

set /p CONTINUE="Continue? (y/n) "
if /i not "%CONTINUE%"=="y" (
    echo Cancelled.
    exit /b 1
)

echo.
echo Step 1: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ Removed node_modules
) else (
    echo ℹ️  node_modules not found
)

echo.
echo Step 2: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo ✅ Removed package-lock.json
) else (
    echo ℹ️  package-lock.json not found
)

echo.
echo Step 3: Clearing Expo cache...
if exist .expo (
    rmdir /s /q .expo
)
call npx expo cache clean >nul 2>&1
echo ✅ Cleared Expo cache

echo.
echo Step 4: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed!
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Step 5: Verifying React Native Firebase...
call npm ls @react-native-firebase/messaging
call npm ls @react-native-firebase/app
echo ✅ React Native Firebase verified

echo.
echo Step 6: Checking for old Firebase Web SDK...
call npm ls firebase >nul 2>&1
if errorlevel 0 (
    echo ❌ WARNING: Old 'firebase' package still found!
    echo    Run: npm uninstall firebase
) else (
    echo ✅ Old Firebase Web SDK not found
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Cleanup Complete!
echo ════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo   1. Verify .env has Firebase configuration
echo   2. Place google-services.json at android\app\
echo   3. Run: npm run android
echo.

pause
