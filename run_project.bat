@echo off
echo ===================================================
echo   Launching Google Antigravity Project...
echo ===================================================

:: 1. Launch the Backend in a separate window
echo Starting Python Backend...
start cmd /k "cd backend && venv\Scripts\activate && python run.py"

:: 2. Launch the Frontend in the current window
echo Starting Frontend Development Server...
cd frontend
npm run dev

pause
