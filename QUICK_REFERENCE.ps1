#!/usr/bin/env pwsh
# Quick Reference - Copy/Paste Commands

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           MIGRAINE API - QUICK REFERENCE (No Hardcoded Params)        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📌 CHOOSE YOUR MODE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Interactive Startup (RECOMMENDED)" -ForegroundColor Green
Write-Host "  .\start_api.ps1"
Write-Host "  → Will ask you to choose DEBUG or RELEASE"
Write-Host ""

Write-Host "Option 2: DEBUG Mode (Demo Data)" -ForegroundColor Green
Write-Host "  `$env:APP_MODE = 'debug'; cd backend; python3 -m uvicorn main_local:app --reload --port 8080"
Write-Host ""

Write-Host "Option 3: RELEASE Mode (Fresh Start)" -ForegroundColor Green
Write-Host "  `$env:APP_MODE = 'release'; cd backend; python3 -m uvicorn main_local:app --reload --port 8080"
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 CHECK STATUS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Health check:"
Write-Host "  curl http://localhost:8080/health"
Write-Host ""
Write-Host "View configuration:"
Write-Host "  curl http://localhost:8080/config"
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "📊 MAKE PREDICTIONS (YOUR CHOICE OF USER ID):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Example with user_id=john_doe:"
Write-Host "  curl -X POST 'http://localhost:8080/predict?user_id=john_doe' \" -ForegroundColor Green
Write-Host "    -H 'Content-Type: application/json' \" -ForegroundColor Green
Write-Host "    -d '{" -ForegroundColor Green
Write-Host '      "age": 35,' -ForegroundColor Green
Write-Host '      "duration": 2,' -ForegroundColor Green
Write-Host '      "frequency": 5,' -ForegroundColor Green
Write-Host '      "location": 1,' -ForegroundColor Green
Write-Host '      "character": 1,' -ForegroundColor Green
Write-Host '      "intensity": 3,' -ForegroundColor Green
Write-Host '      "nausea": 1,' -ForegroundColor Green
Write-Host '      "vomit": 1,' -ForegroundColor Green
Write-Host '      "phonophobia": 1,' -ForegroundColor Green
Write-Host '      "photophobia": 1,' -ForegroundColor Green
Write-Host '      "visual": 2,' -ForegroundColor Green
Write-Host '      "sensory": 0,' -ForegroundColor Green
Write-Host '      "dysphasia": 0,' -ForegroundColor Green
Write-Host '      "dysarthria": 0,' -ForegroundColor Green
Write-Host '      "vertigo": 0,' -ForegroundColor Green
Write-Host '      "tinnitus": 0,' -ForegroundColor Green
Write-Host '      "hypoacusis": 0,' -ForegroundColor Green
Write-Host '      "diplopia": 0,' -ForegroundColor Green
Write-Host '      "defect": 0,' -ForegroundColor Green
Write-Host '      "ataxia": 0,' -ForegroundColor Green
Write-Host '      "conscience": 0,' -ForegroundColor Green
Write-Host '      "paresthesia": 0,' -ForegroundColor Green
Write-Host '      "dpf": 0' -ForegroundColor Green
Write-Host "    }'"  -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  YOU CHOOSE THE USER ID AND ALL 23 SYMPTOM VALUES!" -ForegroundColor Yellow
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "💬 STORE USER FEEDBACK (CORRECTIONS):" -ForegroundColor Yellow
Write-Host ""
Write-Host "User corrects model prediction:"
Write-Host "  curl -X POST 'http://localhost:8080/feedback' \" -ForegroundColor Green
Write-Host "    -d 'user_id=john_doe&predicted=Migraine+with+aura&true_label=Migraine+without+aura'" -ForegroundColor Green
Write-Host ""
Write-Host "YOU CHOOSE: user_id, predicted class, true class" -ForegroundColor Yellow
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "📈 VIEW YOUR DATA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "See summary of collected data:"
Write-Host "  curl http://localhost:8080/export-data"
Write-Host ""
Write-Host "Returns: # predictions, # unique users, feedback accuracy, file locations" -ForegroundColor Gray
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 RESET DATA (DEBUG MODE ONLY):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Clear all data and regenerate demo samples:"
Write-Host "  curl -X DELETE http://localhost:8080/reset-data"
Write-Host ""
Write-Host "Only works in DEBUG mode - resets to 5 demo predictions" -ForegroundColor Gray
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 RUN COMPLETE TEST SUITE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tests all endpoints with your custom parameters:"
Write-Host "  python test_api_calls.py"
Write-Host ""
Write-Host "You can edit the script to customize all test parameters!" -ForegroundColor Gray
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "📚 AVAILABLE CLASSES (Put these in feedback endpoint):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  • No migraine" -ForegroundColor Green
Write-Host "  • Migraine without aura" -ForegroundColor Green
Write-Host "  • Migraine with aura" -ForegroundColor Green
Write-Host "  • Typical aura with migraine" -ForegroundColor Green
Write-Host "  • Typical aura without migraine" -ForegroundColor Green
Write-Host "  • Familial hemiplegic migraine" -ForegroundColor Green
Write-Host "  • Basilar-type aura" -ForegroundColor Green
Write-Host "  • Other" -ForegroundColor Green
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "💾 WHERE DATA IS STORED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Predictions: d:\breeha\data\predictions.csv"
Write-Host "  Feedback:    d:\breeha\data\user_feedback.csv"
Write-Host "  Model:       d:\breeha\backend\artifacts\model.pt"
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 COMPLETE WORKFLOW EXAMPLE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start API:"
Write-Host "   .\start_api.ps1 → Choose RELEASE → New fresh system" -ForegroundColor Green
Write-Host ""
Write-Host "2. Make prediction (your user, your symptoms):"
Write-Host "   curl -X POST 'http://localhost:8080/predict?user_id=alice' \" -ForegroundColor Green
Write-Host "     -H 'Content-Type: application/json' -d '{YOUR_SYMPTOMS}'" -ForegroundColor Green
Write-Host "   → Model says: 'Migraine with aura' (85%)" -ForegroundColor Green
Write-Host ""
Write-Host "3. User corrects it:"
Write-Host "   curl -X POST 'http://localhost:8080/feedback' \" -ForegroundColor Green
Write-Host "     -d 'user_id=alice&predicted=Migraine+with+aura&true_label=Migraine+without+aura'" -ForegroundColor Green
Write-Host "   → Feedback saved!" -ForegroundColor Green
Write-Host ""
Write-Host "4. Repeat steps 2-3 multiple times to collect feedback" -ForegroundColor Green
Write-Host ""
Write-Host "5. View progress:"
Write-Host "   curl http://localhost:8080/export-data"  -ForegroundColor Green
Write-Host "   → Shows: 5 predictions, 1 unique user, 80% accuracy from feedback" -ForegroundColor Green
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "✨ KEY POINT: NO HARDCODED PARAMETERS!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Old way: days=30 (fixed)" -ForegroundColor Red
Write-Host "New way: You choose everything!" -ForegroundColor Green
Write-Host "  - User ID"  -ForegroundColor Green
Write-Host "  - Age, symptoms (all 23 values)"  -ForegroundColor Green
Write-Host "  - Predictions to feed back"  -ForegroundColor Green
Write-Host "  - Debug vs Release mode"  -ForegroundColor Green
Write-Host ""

Write-Host "═" * 76 -ForegroundColor Gray
Write-Host ""

Write-Host "📖 FOR MORE INFO:" -ForegroundColor Yellow
Write-Host "  • README.md - Basic setup"
Write-Host "  • DEBUG_RELEASE_MODES.md - Complete guide (detailed!)"
Write-Host "  • LOCAL_SETUP.md - Local installation steps"
Write-Host "  • SYSTEM_UPDATE_SUMMARY.md - Change summary"
Write-Host ""

Write-Host "🎉 Ready to use!" -ForegroundColor Green
Write-Host ""
