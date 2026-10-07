@echo off
echo ========================================================
echo   Khoi dong he thong Gym Duong Double (Backend + Frontend)
echo ========================================================
echo.
echo 1. Dang khoi dong Backend (Spring Boot tren cong 8080)...
start "Gym Backend :8080" cmd /c "%~dp0run-backend.bat"

echo 2. Dang khoi dong Frontend (Vite tren cong 5173)...
start "Gym Frontend :5173" cmd /c "%~dp0run-frontend.bat"

echo.
echo He thong dang duoc khoi dong trong 2 cua so rieng biet!
echo - Backend API: http://localhost:8080/api
echo - Frontend Web: http://localhost:5173
echo.
timeout /t 3 >nul
