# Frontend-Backend Integration Guide

## ✓ Integration Complete!

Your React Native frontend is now connected to the Cloud Run backend.

## Architecture

```
Frontend (React Native/Expo)
    ↓
UserContext (collects user data)
    ↓
MigraineTrackingScreen (logs migraine)
    ↓
dataMapper.ts (converts to API format)
    ↓
migraineApi.ts (calls backend)
    ↓
Backend API (Cloud Run)
    ↓
BigQuery (stores data) + ML Model (predictions)
```

## Files Created

### 1. `mobile/config/api.ts`
- Backend URL configuration
- API endpoint definitions

### 2. `mobile/services/migraineApi.ts`
- API service functions
- Type definitions
- Functions: `predict()`, `saveData()`, `getAnalytics()`, `chat()`, `healthCheck()`

### 3. `mobile/utils/dataMapper.ts`
- Maps frontend data to backend format
- Converts UserContext → MigraineFeatures
- Converts dashboard data → IntegrationData
- Key functions:
  - `getFeaturesForPrediction()` - Get features for ML prediction
  - `createSaveDataRequest()` - Create complete save request
  - `mapDashboardToIntegrations()` - Extract health metrics

## How It Works

### When User Logs a Migraine:

1. **User fills form** in MigraineTrackingScreen:
   - Pain intensity (1-5)
   - Symptoms (Aura, Nausea, etc.)
   - Duration
   - Enables AI Analysis toggle

2. **Frontend collects UserContext data**:
   ```javascript
   {
     name: "Hhg",
     ageBracket: "25-34",
     dashboardData: {
       sleep: { value: 0.75, unit: "7.5 hours" },
       alcohol: { value: 1, unit: "None today" },
       steps: { value: 0.52, unit: "5,240 steps" },
       // ... more metrics
     }
   }
   ```

3. **Data mapper converts to backend format**:
   ```javascript
   // Maps symptoms → medical features
   {
     age: 30,
     intensity: 3,
     nausea: 1,
     photophobia: 1,
     visual: 1,
     // ... 23 total features
   }
   ```

4. **API service makes prediction**:
   ```javascript
   const predictionResult = await predict(features);
   // Returns: {
   //   prediction: "Migraine with aura",
   //   confidence: 0.86,
   //   all_probabilities: {...}
   // }
   ```

5. **Data saved to BigQuery**:
   ```javascript
   const saveRequest = createSaveDataRequest(
     userData,
     migraineData,
     predictionResult
   );
   await saveData(saveRequest);
   ```

## Testing the Integration

### 1. Start the Frontend:
```bash
cd mobile
npm install
npm start
```

### 2. Test the Flow:

1. **Create a user profile** (if not done):
   - Name: "Test User"
   - Age bracket: "25-34"
   - Enable integrations (sleep, alcohol, etc.)

2. **Log a migraine**:
   - Go to "Log Migraine" screen
   - Set pain intensity: 4
   - Select symptoms: "Nausea", "Light sensitivity", "Aura"
   - Select duration: "2-4 hours"
   - **Enable "AI Analysis" toggle**
   - Click "Submit"

3. **Check console logs**:
   - You should see:
     - UserContext data
     - Features sent to backend
     - Prediction result
     - Save confirmation

### 3. Verify Backend Received Data:

```bash
# Check Cloud Run logs
gcloud run logs read migraine-classifier \
  --region europe-north1 \
  --project aava-pfizer-ml \
  --limit 20
```

You should see:
- Prediction requests
- Save data requests
- BigQuery insertions

## API Endpoints Used

### Prediction
```
POST https://migraine-classifier-372874075712.europe-north1.run.app/predict
```

### Save Data
```
POST https://migraine-classifier-372874075712.europe-north1.run.app/save_data
```

### Analytics (for dashboard)
```
GET https://migraine-classifier-372874075712.europe-north1.run.app/analytics/{user_id}?days=30
```

## Data Flow Example

### Frontend sends:
```json
{
  "user_id": "test_user",
  "name": "Test User",
  "age_bracket": "25-34",
  "session_id": "1731707225000-abc123",
  "features": {
    "age": 30,
    "intensity": 3,
    "nausea": 1,
    "photophobia": 1,
    // ... all 23 features
  },
  "integrations": {
    "sleep_hours": 7.5,
    "alcohol_units": 0,
    "stress_level": 6
  },
  "integrations_enabled": ["sleep", "alcohol", "steps"]
}
```

### Backend responds with:
```json
{
  "prediction": "Migraine with aura",
  "confidence": 0.86,
  "all_probabilities": {
    "No migraine": 0.006,
    "Migraine with aura": 0.86,
    "Migraine without aura": 0.004,
    // ... all classes
  },
  "timestamp": "2025-11-15T23:30:55.009826"
}
```

## Next Steps

### Optional Enhancements:

1. **Display prediction to user**:
   - Show prediction result in success screen
   - Add confidence indicator

2. **Add analytics dashboard**:
   - Fetch data from `/analytics` endpoint
   - Display charts in DashboardScreen

3. **Add chat feature**:
   - Use `/chat` endpoint for Gemini AI
   - Let users ask questions about their migraines

4. **Error handling**:
   - Add loading states
   - Show error messages to user
   - Retry logic for failed requests

## Troubleshooting

### "No user data available" error
- Make sure user has completed onboarding
- Check that UserContext is properly initialized

### API timeout errors
- Check internet connection
- Verify backend URL is correct
- Check Cloud Run service is running

### Prediction errors
- Ensure all required features are mapped
- Check console logs for detailed error messages
- Verify backend is receiving correct data format

### BigQuery errors
- Check BigQuery dataset and table exist
- Verify service account permissions
- Check logs for specific BigQuery errors

## Support

- Backend API URL: `https://migraine-classifier-372874075712.europe-north1.run.app`
- API Docs: `https://migraine-classifier-372874075712.europe-north1.run.app/docs`
- Logs: Cloud Console → Cloud Run → migraine-classifier → Logs
