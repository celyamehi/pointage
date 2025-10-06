@echo off
echo ========================================
echo Demarrage de Collable Pointing System
echo ========================================
echo.
echo Demarrage du Backend...
start "Backend Collable" cmd /k "cd /d %~dp0 && start_backend.bat"
timeout /t 3 /nobreak >nul
echo.
echo Demarrage du Frontend...
start "Frontend Collable" cmd /k "cd /d %~dp0 && start_frontend.bat"
echo.
echo ========================================
echo Les serveurs sont demarres !
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Fermez les fenetres pour arreter les serveurs
pause
