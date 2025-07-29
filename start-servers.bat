@echo off
title Float Nirvana Server Manager
color 0A

echo ===============================================
echo    FLOAT NIRVANA - SERVER STARTUP MANAGER
echo ===============================================
echo.

echo [1/4] Checking directories...
if not exist "backend-new" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)
if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)
echo ✓ Directories found

echo.
echo [2/4] Starting Backend Server...
cd backend-new
if not exist "index.js" (
    echo ERROR: index.js not found in backend directory!
    pause
    exit /b 1
)
start "Float Nirvana Backend" cmd /k "echo Starting Backend Server... && node index.js"
echo ✓ Backend server starting...

echo.
echo [3/4] Starting Frontend Server...
cd ..\frontend
if not exist "package.json" (
    echo ERROR: package.json not found in frontend directory!
    pause
    exit /b 1
)
start "Float Nirvana Frontend" cmd /k "echo Starting Frontend Server... && npm run dev"
echo ✓ Frontend server starting...

echo.
echo [4/4] Servers are starting...
echo.
echo ===============================================
echo    SERVERS INFORMATION
echo ===============================================
echo Backend API:  http://localhost:3001
echo Frontend Web: http://localhost:5173
echo Health Check: http://localhost:3001/api/health
echo Admin Login:  http://localhost:5173/login (admin@example.com)
echo ===============================================
echo.
echo ✓ Both servers are starting in separate windows
echo ✓ Check the server windows for any errors
echo ✓ Wait 10-15 seconds for servers to fully start
echo.
echo Press any key to exit this manager...
pause
