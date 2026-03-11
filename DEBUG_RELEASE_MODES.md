# 🎯 DEBUG vs RELEASE MODE GUIDE

## Quick Start

### DEBUG MODE (Testing/Demo)
```bash
# Set environment variable
set APP_MODE=debug

# Start backend
cd backend
python3 -m uvicorn main_local:app --reload --port 8080
```

**What you get:**
- ✅ 5 sample predictions pre-loaded
- ✅ Sample users with data
- ✅ Ready to test immediately
- ✅ Can reset data with `/reset-data` endpoint

### RELEASE MODE (Production/Fresh Start)
```bash
# Set environment variable  
set APP_MODE=release

# Start backend
cd backend
python3 -m uvicorn main_local:app --reload --port 8080
```

**What you get:**
- ✅ Fresh database (no sample data)
- ✅ User controls everything
- ✅ Real data only
- ✅ No test data pollution

---

## 🔄 API Endpoints

### Health Check
```bash
curl http://localhost:8080/health
```

Response shows:
- Current MODE (DEBUG or RELEASE)
- Demo enabled status
- Data file locations

### View Configuration
```bash
curl http://localhost:8080/config
```

Shows:
- Available migraine classes
- Data locations
- Endpoint usage examples

### Make Prediction (User Choice Parameter)
```bash
# With user ID
curl -X POST "http://localhost:8080/predict?user_id=john_doe" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 40,
    "duration": 2,
    ...all 23 features...
  }'

# Anonymous
curl -X POST "http://localhost:8080/predict" \
  ...same data...
```

### Store Feedback
```bash
curl -X POST "http://localhost:8080/feedback" \
  -d "user_id=john_doe&predicted=Migraine+with+aura&true_label=No+migraine"
```

### View Data Summary
```bash
curl http://localhost:8080/export-data
```

Returns:
- Total predictions collected
- Unique users
- Feedback accuracy
- Data file locations

### Reset Data (DEBUG Mode Only)
```bash
curl -X DELETE http://localhost:8080/reset-data
```

Clears all data and regenerates demo samples.

---

## 📊 Data Storage

### DEBUG Mode
```
data/
├── predictions.csv     ← Contains 5 demo samples + your new data
└── user_feedback.csv   ← User feedback/corrections
```

### RELEASE Mode
```
data/
├── predictions.csv     ← Your real data only
└── user_feedback.csv   ← User corrections
```

---

## 🎮 Usage Examples

### Example 1: Test with Demo Data
```bash
# 1. Start in DEBUG mode
set APP_MODE=debug
cd backend && python3 -m uvicorn main_local:app --reload --port 8080

# 2. Check health (shows 5 demo predictions loaded)
curl http://localhost:8080/health

# 3. Make your own prediction
curl -X POST http://localhost:8080/predict?user_id=test_user \
  -H "Content-Type: application/json" \
  -d '{...symptoms...}'

# 4. View all data collected
curl http://localhost:8080/export-data

# 5. Reset to fresh demo data
curl -X DELETE http://localhost:8080/reset-data
```

### Example 2: Production Fresh Start
```bash
# 1. Start in RELEASE mode
set APP_MODE=release
cd backend && python3 -m uvicorn main_local:app --reload --port 8080

# 2. Check health (shows no demo data)
curl http://localhost:8080/health

# 3. Add real user data
curl -X POST http://localhost:8080/predict?user_id=real_patient_1 \
  -H "Content-Type: application/json" \
  -d '{...patient_1_symptoms...}'

# 4. Collect feedback
curl -X POST http://localhost:8080/feedback \
  -d "user_id=real_patient_1&predicted=Migraine+with+aura&true_label=Migraine+without+aura"

# 5. Data is saved to data/predictions.csv and data/user_feedback.csv
```

---

## Environment Variables

```bash
# Mode selection (default: release)
set APP_MODE=debug    # Enable demo data
set APP_MODE=release  # Fresh start, no sample data

# Or set in .env file
```

---

## 🚀 For Mobile App Integration

In mobile app, specify user ID for tracking:

```typescript
// services/migraineApi.ts
export async function getPrediction(symptoms: any, userId: string) {
  const response = await fetch(
    `http://localhost:8080/predict?user_id=${userId}`,
    {
      method: "POST",
      body: JSON.stringify(symptoms)
    }
  );
  return response.json();
}
```

This way:
- Each user's data is tracked separately
- Data automatically saves with user ID
- Can analyze per-user patterns
- Easy to migrate to cloud later

---

## 🔧 Switching Modes

### Change from DEBUG to RELEASE
```bash
# 1. Stop backend (Ctrl+C)
# 2. Change mode
set APP_MODE=release

# 3. Restart
python3 -m uvicorn main_local:app --reload --port 8080

# 4. All demo data gone - fresh start
```

### Change from RELEASE to DEBUG
```bash
# 1. Stop backend
# 2. Change mode
set APP_MODE=debug

# 3. Restart
python3 -m uvicorn main_local:app --reload --port 8080

# 4. Demo data auto-generated for testing
```

---

## 📝 No More Hardcoded Parameters!

✅ **Before:** Default `days=30` hardcoded  
✅ **Now:** User controls everything via:
- Query parameters: `?days=7&user_id=john`
- Request body: JSON with all settings
- Environment variable: `APP_MODE=debug|release`

You're in control! 🎉
