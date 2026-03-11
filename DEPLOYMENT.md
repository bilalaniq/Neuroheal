# Deployment Guide - Migraine Classifier with Online Learning

Complete deployment guide for the hackathon demo.

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend  │────>│  Backend API     │────>│     GCS     │
│ (Streamlit/ │     │  (Cloud Run)     │     │  (Models)   │
│  Mobile)    │     │  FastAPI+PyTorch │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Vertex AI      │
                    │  (Initial Train) │
                    └──────────────────┘
```

## Quick Start (30 minutes)

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Python 3.10+** installed locally
4. **Docker** installed (for Cloud Run)

### Step 1: Set Up Google Cloud (5 min)

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export BUCKET_NAME="${PROJECT_ID}-migraine-ml"

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com

# Create GCS bucket
gsutil mb -l $REGION gs://$BUCKET_NAME
```

### Step 2: Upload Dataset (2 min)

```bash
cd data

# Upload augmented dataset to GCS
gsutil cp augmented_dataset.csv gs://$BUCKET_NAME/data/

# Verify
gsutil ls gs://$BUCKET_NAME/data/
```

### Step 3: Train Initial Model on Vertex AI (10-15 min)

```bash
cd ../cloud

# Update config.yaml with your project details
# Then run local training first (faster for hackathon):

python train.py \
  --data-path ../data/augmented_dataset.csv \
  --bucket-name $BUCKET_NAME \
  --epochs 50 \
  --batch-size 32

# This will:
# - Train the model
# - Save to GCS: gs://$BUCKET_NAME/models/migraine-classifier/
```

**Alternative: Submit to Vertex AI** (if you have time)
```bash
python deploy_training_job.py \
  --project-id $PROJECT_ID \
  --bucket-name $BUCKET_NAME \
  --dataset-path data/augmented_dataset.csv
```

### Step 4: Deploy Backend to Cloud Run (10 min)

```bash
cd ../backend

# Create .env file
cat > .env << EOF
USE_GCS=true
GCS_BUCKET_NAME=$BUCKET_NAME
GCS_MODEL_PATH=models/migraine-classifier
ONLINE_LEARNING_RATE=0.0001
CONFIDENCE_THRESHOLD=0.8
EOF

# Build and deploy to Cloud Run
gcloud run deploy migraine-classifier \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars USE_GCS=true,GCS_BUCKET_NAME=$BUCKET_NAME

# Get the URL
export API_URL=$(gcloud run services describe migraine-classifier \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo "API deployed at: $API_URL"
```

### Step 5: Test the API (2 min)

```bash
# Health check
curl $API_URL/health

# Make a prediction
curl -X POST $API_URL/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 35, "duration": 2, "frequency": 5, "location": 1,
    "character": 1, "intensity": 3, "nausea": 1, "vomit": 1,
    "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
    "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0,
    "hypoacusis": 0, "diplopia": 0, "defect": 0, "ataxia": 0,
    "conscience": 0, "paresthesia": 0, "dpf": 1
  }'

# Update the model
curl -X POST $API_URL/update \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "age": 35, "duration": 2, "frequency": 5, "location": 1,
      "character": 1, "intensity": 3, "nausea": 1, "vomit": 1,
      "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
      "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0,
      "hypoacusis": 0, "diplopia": 0, "defect": 0, "ataxia": 0,
      "conscience": 0, "paresthesia": 0, "dpf": 1
    },
    "true_label": "Migraine without aura",
    "force_update": false
  }'

# Check metrics
curl $API_URL/metrics
```

### Step 6: Connect Frontend

Share the `$API_URL` with your frontend team. They can integrate with:

**Example frontend integration:**
```javascript
// Make prediction
const response = await fetch(`${API_URL}/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(features)
});

const prediction = await response.json();
console.log(prediction.prediction, prediction.confidence);

// User confirms/corrects → Update model
await fetch(`${API_URL}/update`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    features: features,
    true_label: userCorrectedLabel
  })
});
```

## Demo Flow for Judges

### Scenario 1: Model Learning from Corrections

1. **Submit case with symptoms**
   - Show prediction: "Migraine without aura" (75% confidence)

2. **User corrects**: "Actually, it's Typical aura with migraine"
   - Click "Correct Prediction" button
   - Backend performs backward pass
   - Show "Model Updated!" message

3. **Submit similar case**
   - Show improved prediction: "Typical aura with migraine" (90% confidence)
   - Highlight: **Confidence increased after learning!**

### Scenario 2: Model Uncertainty

1. **Submit edge case** (ambiguous symptoms)
   - Show prediction with low confidence (65%)
   - Model updates automatically (confidence < 80%)

2. **Submit clear case** (obvious symptoms)
   - Show prediction with high confidence (95%)
   - Model skips update (confidence > 80%)
   - Show message: "High confidence - no update needed"

### Scenario 3: Real-time Metrics

1. Open `/metrics` endpoint or dashboard
2. Show live stats:
   - Total updates: 42
   - Skipped updates: 15
   - Replay buffer size: 42
   - Average loss: 0.189

## Monitoring & Debugging

### View Logs

```bash
# Cloud Run logs
gcloud run logs read migraine-classifier \
  --region $REGION \
  --limit 50

# Real-time logs
gcloud run logs tail migraine-classifier --region $REGION
```

### Check GCS Model Versions

```bash
gsutil ls -r gs://$BUCKET_NAME/models/migraine-classifier/
```

### Test Locally

```bash
cd backend

# Download model from GCS
python -c "
from cloud.gcs_utils import GCSModelManager
m = GCSModelManager('$BUCKET_NAME')
m.download_model(local_dir='artifacts')
"

# Run locally
uvicorn main:app --reload --port 8080

# Test at http://localhost:8080/docs
```

## Cost Estimates (Hackathon)

- **Vertex AI Training** (1 job, 15 min): ~$0.05
- **Cloud Run** (24h, minimal traffic): ~$0.10
- **GCS Storage** (1GB): ~$0.02/month
- **Total for hackathon weekend**: **< $1**

## Troubleshooting

### Model Not Loading

```bash
# Check if artifacts exist in GCS
gsutil ls gs://$BUCKET_NAME/models/migraine-classifier/

# Re-upload manually
cd cloud
gsutil cp artifacts/model.pt gs://$BUCKET_NAME/models/migraine-classifier/
gsutil cp artifacts/scaler.pkl gs://$BUCKET_NAME/models/migraine-classifier/
gsutil cp artifacts/label_encoder.pkl gs://$BUCKET_NAME/models/migraine-classifier/
```

### API Errors

```bash
# Check Cloud Run logs
gcloud run logs read migraine-classifier --region $REGION --limit 100

# Restart service
gcloud run services update migraine-classifier --region $REGION
```

### Slow Updates

- Reduce `REPLAY_FREQUENCY` to skip experience replay
- Increase `CONFIDENCE_THRESHOLD` to skip more updates
- Use Cloud Run with more CPU/memory

## Production Considerations

For production deployment (post-hackathon):

1. **Authentication**: Add API keys or OAuth
2. **Rate Limiting**: Prevent abuse
3. **Data Validation**: More strict input validation
4. **Model Versioning**: A/B testing framework
5. **Monitoring**: Set up Prometheus/Grafana
6. **CORS**: Restrict allowed origins
7. **HTTPS**: Ensure SSL certificates
8. **Backup**: Regular model snapshots

## Clean Up

```bash
# Delete Cloud Run service
gcloud run services delete migraine-classifier --region $REGION

# Delete GCS bucket
gsutil -m rm -r gs://$BUCKET_NAME

# Delete Vertex AI models (if any)
gcloud ai models list --region $REGION
gcloud ai models delete MODEL_ID --region $REGION
```

## Support

- Backend API docs: `https://YOUR-API-URL/docs`
- Cloud Console: https://console.cloud.google.com
- Vertex AI: https://console.cloud.google.com/vertex-ai
- Cloud Run: https://console.cloud.google.com/run
