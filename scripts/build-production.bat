@echo off
echo ========================================
echo Building Float Nirvana for Production
echo ========================================

echo.
echo [1/2] Building frontend...
cd /d %~dp0../frontend
npm run build

echo.
echo [2/2] Frontend build completed!
echo Build files are in: frontend/dist/

echo.
echo ========================================
echo ✅ PRODUCTION BUILD COMPLETE!
echo ========================================
echo.
echo To deploy:
echo 1. Upload frontend/dist/ to your web server
echo 2. Deploy backend/ to your Node.js server
echo 3. Update environment variables for production
echo.
pause
