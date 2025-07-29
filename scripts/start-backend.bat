@echo off
echo ========================================
echo Starting Float Nirvana Backend Server
echo ========================================

cd /d %~dp0../backend

echo.
echo Installing dependencies if needed...
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

echo.
echo Starting backend server in development mode...
npm run dev

pause
