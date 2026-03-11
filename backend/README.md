# Backend API - Migraine Classifier

FastAPI backend with online learning capabilities for real-time model updates.

## Features

- **RESTful API** for migraine predictions
- **Online Learning**: Real-time model updates with user feedback
- **Experience Replay**: Prevents catastrophic forgetting
- **Confidence-based Updates**: Only updates when model is uncertain
- **GCS Integration**: Automatic model saving to Google Cloud Storage
- **Cloud Run Ready**: Docker containerized for easy deployment

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Download model artifacts:**

   If using GCS:
   ```bash
   export GCS_BUCKET_NAME=your-bucket-name
   python -c "from cloud.gcs_utils import GCSModelManager; \
     m = GCSModelManager('$GCS_BUCKET_NAME'); \
     m.download_model(local_dir='artifacts')"
   ```

   Or copy local artifacts:
   ```bash
   mkdir -p artifacts
   cp ../cloud/model.pt artifacts/
   cp ../cloud/scaler.pkl artifacts/
   cp ../cloud/label_encoder.pkl artifacts/
   ```

4. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8080
   ```

5. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:8080/health

   # Make a prediction
   curl -X POST http://localhost:8080/predict \
     -H "Content-Type: application/json" \
     -d '{
       "age": 35,
       "duration": 2,
       "frequency": 5,
       "location": 1,
       "character": 1,
       "intensity": 3,
       "nausea": 1,
       "vomit": 1,
       "phonophobia": 1,
       "photophobia": 1,
       "visual": 0,
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
       "dpf": 1
     }'
   ```

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t migraine-classifier .
   ```

2. **Run locally:**
   ```bash
   docker run -p 8080:8080 \
     -e USE_GCS=true \
     -e GCS_BUCKET_NAME=your-bucket-name \
     migraine-classifier
   ```

### Cloud Run Deployment

1. **Build and push to Container Registry:**
   ```bash
   export PROJECT_ID=your-project-id
   export REGION=us-central1

   # Build with Cloud Build
   gcloud builds submit --tag gcr.io/$PROJECT_ID/migraine-classifier

   # Or build and push manually
   docker build -t gcr.io/$PROJECT_ID/migraine-classifier .
   docker push gcr.io/$PROJECT_ID/migraine-classifier
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy migraine-classifier \
     --image gcr.io/$PROJECT_ID/migraine-classifier \
     --platform managed \
     --region $REGION \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --set-env-vars USE_GCS=true,GCS_BUCKET_NAME=your-bucket-name
   ```

3. **Get the service URL:**
   ```bash
   gcloud run services describe migraine-classifier \
     --platform managed \
     --region $REGION \
     --format 'value(status.url)'
   ```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### `POST /predict`
Make a migraine classification prediction.

**Request Body:**
```json
{
  "age": 35,
  "duration": 2,
  "frequency": 5,
  "location": 1,
  "character": 1,
  "intensity": 3,
  "nausea": 1,
  "vomit": 1,
  "phonophobia": 1,
  "photophobia": 1,
  "visual": 0,
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
  "dpf": 1
}
```

**Response:**
```json
{
  "prediction": "Migraine without aura",
  "confidence": 0.85,
  "all_probabilities": {
    "No migraine": 0.02,
    "Migraine without aura": 0.85,
    "Typical aura with migraine": 0.10,
    ...
  },
  "timestamp": "2025-11-15T12:34:56"
}
```

### `POST /update`
Update the model with user-confirmed data (online learning).

**Request Body:**
```json
{
  "features": { /* same as predict */ },
  "true_label": "Migraine without aura",
  "force_update": false
}
```

**Response:**
```json
{
  "status": "success",
  "updated": true,
  "loss": 0.234,
  "confidence": 0.75,
  "update_count": 42
}
```

### `GET /metrics`
Get online learning metrics.

**Response:**
```json
{
  "total_updates": 42,
  "skipped_updates": 15,
  "replay_buffer_size": 42,
  "avg_recent_loss": 0.189,
  "learning_rate": 0.0001
}
```

## Configuration

Environment variables (see `.env.example`):

- `USE_GCS`: Enable GCS integration (true/false)
- `GCS_BUCKET_NAME`: GCS bucket name
- `GCS_MODEL_PATH`: Path to model in bucket
- `ONLINE_LEARNING_RATE`: Learning rate for online updates (default: 0.0001)
- `REPLAY_BUFFER_SIZE`: Experience replay buffer size (default: 100)
- `REPLAY_FREQUENCY`: Replay every N updates (default: 10)
- `CONFIDENCE_THRESHOLD`: Only update if confidence < threshold (default: 0.8)
- `SAVE_FREQUENCY`: Save to GCS every N updates (default: 5)

## Online Learning Behavior

1. **User submits data** → API makes prediction
2. **User confirms/corrects** → Triggers `/update` endpoint
3. **Confidence check**: Only updates if confidence < 0.8 (configurable)
4. **Backward pass**: Single-sample gradient update
5. **Experience replay**: Every 10 updates, replays random samples from buffer
6. **Auto-save**: Every 5 updates, saves to GCS in background

## Development

Run with auto-reload:
```bash
uvicorn main:app --reload --port 8080
```

API documentation (auto-generated):
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## Testing

Example test workflow:
```bash
# 1. Make prediction
curl -X POST http://localhost:8080/predict -H "Content-Type: application/json" -d @test_input.json

# 2. Update model
curl -X POST http://localhost:8080/update -H "Content-Type: application/json" -d @test_update.json

# 3. Check metrics
curl http://localhost:8080/metrics
```

## Architecture

```
Frontend → FastAPI → OnlineLearningManager → PyTorch Model
                ↓
            GCS (periodic saves)
```

The backend maintains the model in memory and performs single-sample gradient updates when users provide feedback. Experience replay prevents catastrophic forgetting by periodically replaying past examples.
