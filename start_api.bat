@echo off
REM Start Migraine API with mode selection

setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo  Migraine Classifier - Local API
echo ========================================
echo.
echo Choose mode:
echo  1) DEBUG   - Demo mode with sample data
echo  2) RELEASE - Fresh start, no demo data
echo.

set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    set APP_MODE=debug
    echo.
    echo 🔧 Starting in DEBUG MODE...
    echo    - Sample data will be loaded
    echo    - Perfect for testing
    echo    - Use /reset-data endpoint to refresh
    echo.
) else if "%choice%"=="2" (
    set APP_MODE=release
    echo.
    echo 📦 Starting in RELEASE MODE...
    echo    - Fresh start with no demo data
    echo    - Collect real user data
    echo    - Production ready
    echo.
) else (
    echo Invalid choice. Using RELEASE mode (default)
    set APP_MODE=release
)

echo ========================================
echo Starting backend server...
echo ========================================
echo.

cd backend
python3 -m uvicorn main_local:app --reload --port 8080
