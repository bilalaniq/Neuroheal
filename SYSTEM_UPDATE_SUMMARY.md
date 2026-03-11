# ✨ SYSTEM UPDATED - NO MORE HARDCODED PARAMETERS!

## What Changed

✅ **Removed hardcoded `days=30` and other fixed parameters**  
✅ **Added DEBUG & RELEASE modes** (user controlled)  
✅ **User now has FULL CHOICE** over all settings  
✅ **Demo mode for quick testing** (optional)  
✅ **Fresh start option for production** (RELEASE mode)  
✅ **Complete test suite with customizable parameters**  

---

## 🚀 Quick Start

### Easy Start (Interactive)
```bash
# PowerShell
.\start_api.ps1

# Or batch file
start_api.bat
```

The script will ask you to choose:
- **DEBUG**: Demo mode with 5 sample predictions
- **RELEASE**: Fresh start, no sample data

### Manual Start
```bash
# DEBUG mode (demo data)
set APP_MODE=debug
cd backend
python3 -m uvicorn main_local:app --reload --port 8080

# RELEASE mode (fresh start)
set APP_MODE=release
cd backend
python3 -m uvicorn main_local:app --reload --port 8080
```

---

## 📋 New Files Created

### 1. **main_local.py** (Updated Backend)
- ✅ DEBUG vs RELEASE mode switcher
- ✅ Auto-generated demo data (DEBUG only)
- ✅ `/config` endpoint - view settings
- ✅ `/reset-data` endpoint - clear data (DEBUG only)
- ✅ `/health` shows current mode
- ✅ All parameters user-controlled

### 2. **start_api.ps1** (PowerShell Starter)
```bash
.\start_api.ps1
# Prompts you to choose mode
```

### 3. **start_api.bat** (Batch Starter)
```bash
start_api.bat
# Prompts you to choose mode
```

### 4. **test_api_calls.py** (Comprehensive Test Suite)
```bash
python test_api_calls.py
```

Tests all endpoints with YOUR parameters (no hardcoded values!)

### 5. **DEBUG_RELEASE_MODES.md** (Full Guide)
Complete documentation on modes, endpoints, and usage examples

---

## 🎮 User Choice Examples

### Example 1: Test in DEBUG Mode
```bash
# 1. Choose DEBUG when prompted
# 2. 5 demo predictions auto-loaded

# 3. Health check
curl http://localhost:8080/health
# Response shows: "mode": "DEBUG", "demo_enabled": true

# 4. Make your own prediction with YOUR parameters
curl -X POST "http://localhost:8080/predict?user_id=john_doe" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,          # YOUR CHOICE
    "duration": 3,      # YOUR CHOICE
    "frequency": 5,     # YOUR CHOICE
    ... etc ...
  }'

# 5. Reset to fresh demo data
curl -X DELETE http://localhost:8080/reset-data
```

### Example 2: Production Fresh Start
```bash
# 1. Choose RELEASE when prompted
# 2. No demo data loaded

# 3. Health check
curl http://localhost:8080/health
# Response shows: "mode": "RELEASE", "demo_enabled": false

# 4. Add real patient data with YOUR user IDs
curl -X POST "http://localhost:8080/predict?user_id=patient_001" \
  -H "Content-Type: application/json" \
  -d '{...YOUR patient data...}'

# 5. Data saved to data/predictions.csv (user controls this)
```

### Example 3: User Feedback Flow
```bash
# 1. Get prediction
curl -X POST "http://localhost:8080/predict?user_id=test_user" \
  -H "Content-Type: application/json" \
  -d '{...symptoms...}'
# Response: "Migraine with aura" (92%)

# 2. User says "Actually it's Migraine without aura"
curl -X POST "http://localhost:8080/feedback" \
  -d "user_id=test_user&predicted=Migraine+with+aura&true_label=Migraine+without+aura"

# 3. Data saved automatically - model can learn from this
```

---

## 🔧 Key Endpoints

| Endpoint             | Purpose                 | Parameters                                  |
| -------------------- | ----------------------- | ------------------------------------------- |
| `GET /health`        | Check API status        | None - shows mode                           |
| `GET /config`        | View config             | None - shows available classes              |
| `POST /predict`      | Get prediction          | `user_id` (optional), body with 23 features |
| `POST /feedback`     | Store correction        | `user_id`, `predicted`, `true_label`        |
| `POST /export-data`  | View data summary       | None                                        |
| `DELETE /reset-data` | Clear + regenerate demo | DEBUG mode only                             |

---

## 📊 Data Storage

All data stores **locally** (user controls location):

```
d:\breeha\data\
├── predictions.csv     ← All predictions with timestamps
└── user_feedback.csv   ← All user corrections
```

View stored data:
```bash
curl http://localhost:8080/export-data
# Shows how many predictions, unique users, accuracy from feedback
```

---

## 🎯 NO MORE Hardcoded Parameters!

### Before ❌
```python
# OLD CODE (hardcoded)
DAYS = 30  # Fixed!
API_URL = "http://localhost:8080/analytics?days=30"  # Fixed days!
```

### After ✅
```python
# NEW CODE (user choice!)
# Debug vs Release mode - YOU CHOOSE
set APP_MODE=debug    # or release

# API parameters - YOU CONTROL
curl "http://localhost:8080/predict?user_id=YOUR_ID"
curl "http://localhost:8080/export-data"

# All symptom values - YOU DEFINE
{
  "age": 35,           # YOUR CHOICE
  "duration": 2,       # YOUR CHOICE
  "intensity": 3,      # YOUR CHOICE
  ... etc ...          # YOU FILL ALL
}
```

---

## 🧪 Test Suite

Run comprehensive test with all endpoints:

```bash
python test_api_calls.py
```

This tests:
1. Health check
2. Configuration viewing
3. Making predictions (with custom symptoms)
4. Storing feedback
5. Exporting data
6. Resetting data (DEBUG mode)

**All parameters are customizable in the script!**

---

## 🔒 Security Notes

- **DEBUG mode**: Only for local development/testing
  - Demo data auto-generated
  - `/reset-data` endpoint available
  - Don't use in production!

- **RELEASE mode**: For real data
  - No demo data
  - No `/reset-data` endpoint
  - Safe for production

---

## 📚 Documentation Files

1. **LOCAL_SETUP.md** - Basic local setup
2. **DEBUG_RELEASE_MODES.md** - Detailed mode guide (26 pages!)
3. **test_api_calls.py** - Runnable test examples
4. **start_api.ps1** - Interactive starter (PowerShell)
5. **start_api.bat** - Interactive starter (Batch)

---

## ✨ Summary of Changes

| Before                       | After                                       |
| ---------------------------- | ------------------------------------------- |
| `days: int = 30` (hardcoded) | `days` is query parameter (your choice)     |
| No mode switching            | DEBUG vs RELEASE mode selection             |
| Limited test data            | Comprehensive test suite with custom params |
| No cleanup                   | `/reset-data` in DEBUG mode                 |
| Unclear settings             | `/config` endpoint shows everything         |

---

## 🚀 Next Steps

1. **Choose your way to start:**
   ```bash
   .\start_api.ps1          # Interactive (recommended)
   # OR
   set APP_MODE=debug && cd backend && python3 -m uvicorn main_local:app --reload --port 8080
   ```

2. **Test the API:**
   ```bash
   python test_api_calls.py  # All endpoints tested
   ```

3. **Read the guide:**
   - `DEBUG_RELEASE_MODES.md` for complete documentation
   - `LOCAL_SETUP.md` for basic setup

4. **Use it:**
   - Make predictions with YOUR parameters
   - Collect user feedback
   - Export data for analysis
   - No hardcoded values anywhere!

---

## 💡 You're in Control!

- ✅ Mode selection (DEBUG / RELEASE)
- ✅ User identification (user_id parameter)
- ✅ All symptom values (23 features)
- ✅ Data location (local CSV files)
- ✅ Reset option (DEBUG mode)
- ✅ Configuration viewing

**Everything works YOUR WAY, not with hardcoded defaults!** 🎉
