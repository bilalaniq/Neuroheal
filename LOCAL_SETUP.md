# 🚀 LOCAL-ONLY SETUP GUIDE (NO CLOUD)

## What Changed:
✅ Removed GCS (Google Cloud Storage)  
✅ Removed BigQuery  
✅ Removed Gemini API requirement  
✅ **ALL DATA STORED LOCALLY**  

## Quick Start

### 1. Install Dependencies
```bash
cd d:\breeha
pip install fastapi uvicorn pydantic torch numpy scikit-learn joblib pandas
```

### 2. Start Backend Server
```bash
cd backend
python3 -m uvicorn main_local:app --reload --port 8080
```

You should see:
```
======================================================================
MIGRAINE CLASSIFIER - LOCAL MODE (NO CLOUD)
======================================================================
✓ API READY - Predictions will be stored locally
======================================================================
```

### 3. Test API (in another terminal)
```bash
# Health check
curl http://localhost:8080/health

# Make a prediction
curl -X POST http://localhost:8080/predict?user_id=john_doe \
  -H "Content-Type: application/json" \
  -d '{
    "age": 40,
    "duration": 2,
    "frequency": 5,
    "location": 1,
    "character": 1,
    "intensity": 3,
    "nausea": 1,
    "vomit": 1,
    "phonophobia": 1,
    "photophobia": 1,
    "visual": 2,
    "sensory": 0,
    "dysphasia": 0,
    "dysarthria": 0,
    "vertigo": 0,
    "tinnitus": 0,
    "hypoacusis": 0,
    "diplopia": 0,
    "defect": 0,
    "ataxia": 0,
    "conscience": 0,
    "paresthesia": 0,
    "dpf": 0
  }'

# Store user feedback
curl -X POST "http://localhost:8080/feedback?user_id=john_doe&predicted=Migraine+with+aura&true_label=Migraine+without+aura"

# View stored data
curl http://localhost:8080/export-data
```

## 📁 Data Storage Locations

All data automatically saves **locally**:

```
d:\breeha\
├── data/
│   ├── predictions.csv          ← All predictions stored here
│   └── user_feedback.csv        ← All corrections stored here
└── backend/
    └── artifacts/
        ├── model.pt             ← Model weights
        └── scaler.pkl           ← Feature scaler
```

## 🔄 Workflow

### For Users (Mobile App):
```
1. User logs symptoms in app
   ↓
2. App calls: POST /predict?user_id=john
   ↓
3. Backend returns prediction
   ↓
4. User confirms/corrects
   ↓
5. App calls: POST /feedback?user_id=john&true_label=...
   ↓
6. Data saved to data/predictions.csv & data/user_feedback.csv
```

### For You (Retraining):
```
1. Review data in data/predictions.csv
2. Run training script with real feedback data
3. Model improves from real user data!
```

## 📊 See Your Data

Check what's been collected:
```bash
# Show all predictions (CSV)
type data\predictions.csv

# Show all feedback (CSV)
type data\user_feedback.csv

# Show summary
curl http://localhost:8080/export-data
```

## 🔧 Advanced

### Use with Mobile App:
In mobile app's [services/migraineApi.ts](../mobile/services/migraineApi.ts):

```typescript
const API_URL = "http://YOUR_LOCAL_IP:8080";

export async function getPrediction(symptoms: Symptoms) {
  const response = await fetch(`${API_URL}/predict?user_id=${userId}`, {
    method: "POST",
    body: JSON.stringify(symptoms)
  });
  return response.json();
}
```

### Retrain Model with Real Data:
```bash
# 1. Collect predictions from users
# 2. Users provide feedback (corrections)
# 3. Run training with real data:

python train_with_feedback.py \
  --feedback-file data/user_feedback.csv \
  --output-model backend/artifacts/model.pt
```

## ✅ Everything Works Without Cloud!
- No Google Cloud API keys needed
- No internet connection required
- All data stays on your computer
- Perfect for local development & testing
