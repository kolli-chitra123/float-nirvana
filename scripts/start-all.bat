@echo off
echo ========================================
echo Starting Float Nirvana Application
echo ========================================

echo.
echo [1/2] Starting Backend Server...
start "Float Nirvana Backend" cmd /k "cd /d %~dp0../backend && echo Starting Backend... && npm run dev"

echo.
echo Waiting for backend to initialize...
timeout /t 8 /nobreak > nul

echo.
echo [2/2] Starting Frontend Server...
start "Float Nirvana Frontend" cmd /k "cd /d %~dp0../frontend && echo Starting Frontend... && npm run dev"

echo.
echo ========================================
echo ✅ SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo 🔗 Backend API: http://localhost:3001
echo 🌐 Frontend App: http://localhost:5173
echo 🔧 Admin Dashboard: http://localhost:5173/admin
echo ========================================
echo.
echo Both servers are running in separate windows.
echo Close this window when done.
echo.
pause
