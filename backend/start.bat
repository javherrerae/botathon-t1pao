@echo off
echo ========================================
echo   Cada Hora Cuenta - Backend API
echo   http://localhost:8000/docs
echo ========================================
cd /d "%~dp0"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
