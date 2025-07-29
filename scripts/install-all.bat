@echo off
echo ========================================
echo Installing Float Nirvana Dependencies
echo ========================================

echo.
echo [1/3] Installing root dependencies...
npm install

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
npm install

echo.
echo [3/3] Installing backend dependencies...
cd ../backend
npm install

echo.
echo ========================================
echo ✅ ALL DEPENDENCIES INSTALLED!
echo ========================================
echo.
echo You can now start the application using:
echo - scripts/start-all.bat (both servers)
echo - scripts/start-frontend.bat (frontend only)
echo - scripts/start-backend.bat (backend only)
echo.
pause
