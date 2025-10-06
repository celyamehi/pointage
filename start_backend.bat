@echo off
echo ========================================
echo Demarrage du Backend Collable
echo ========================================
cd backend
call venv\Scripts\activate.bat
echo.
echo Backend demarre sur http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
