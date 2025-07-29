@echo off
echo ========================================
echo Starting Float Nirvana Frontend Server
echo ========================================

cd /d %~dp0../frontend

echo.
echo Installing dependencies if needed...
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo Starting frontend server in development mode...
npm run dev

pause
