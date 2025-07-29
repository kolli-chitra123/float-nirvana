@echo off
title Float Nirvana - Force Start
color 0A

echo ===============================================
echo    FLOAT NIRVANA - FORCE STARTUP
echo ===============================================
echo.

echo [STEP 1] Killing any existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [STEP 2] Starting Backend Server...
cd backend
echo Starting backend on port 3001...
start "BACKEND-3001" cmd /k "echo Backend Starting... && node basic-server.js && pause"
cd ..
timeout /t 3 /nobreak >nul

echo [STEP 3] Starting Frontend Server...
cd frontend
echo Starting frontend on port 5173...
start "FRONTEND-5173" cmd /k "echo Frontend Starting... && npm run dev && pause"
cd ..
timeout /t 5 /nobreak >nul

echo [STEP 4] Testing connections...
echo Testing backend...
curl -s http://localhost:3001/api/health || echo Backend not responding yet
echo.
echo Testing frontend...
curl -s http://localhost:5173 || echo Frontend not responding yet

echo.
echo ===============================================
echo    STARTUP COMPLETE
echo ===============================================
echo Backend:  http://localhost:3001/api/health
echo Frontend: http://localhost:5173
echo.
echo Check the opened windows for any errors.
echo Wait 30 seconds for servers to fully start.
echo.
pause
