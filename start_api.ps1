#!/usr/bin/env pwsh
# Start Migraine API with mode selection

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migraine Classifier - Local API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose mode:" -ForegroundColor Yellow
Write-Host "  1) DEBUG   - Demo mode with sample data" -ForegroundColor Green
Write-Host "  2) RELEASE - Fresh start, no demo data" -ForegroundColor Blue
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

switch ($choice) {
    "1" {
        $env:APP_MODE = "debug"
        Write-Host ""
        Write-Host "🔧 Starting in DEBUG MODE..." -ForegroundColor Green
        Write-Host "   - Sample data will be loaded"
        Write-Host "   - Perfect for testing"
        Write-Host "   - Use /reset-data endpoint to refresh"
        Write-Host ""
    }
    "2" {
        $env:APP_MODE = "release"
        Write-Host ""
        Write-Host "📦 Starting in RELEASE MODE..." -ForegroundColor Blue
        Write-Host "   - Fresh start with no demo data"
        Write-Host "   - Collect real user data"
        Write-Host "   - Production ready"
        Write-Host ""
    }
    default {
        Write-Host "Invalid choice. Using RELEASE mode (default)" -ForegroundColor Yellow
        $env:APP_MODE = "release"
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 API will be available at: http://localhost:8080" -ForegroundColor Green
Write-Host "📍 Health check: curl http://localhost:8080/health" -ForegroundColor Green
Write-Host "📍 Config: curl http://localhost:8080/config" -ForegroundColor Green
Write-Host ""

cd backend
python3 -m uvicorn main_local:app --reload --port 8080
