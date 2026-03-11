# Quick Start Guide for Tomorrow

## Pre-requisites Checklist

- [ ] Google Cloud account with free tier credits
- [ ] `gcloud` CLI installed ([Install here](https://cloud.google.com/sdk/docs/install))
- [ ] Python 3.10+ installed
- [ ] Git repository cloned locally

## Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
1. ✅ Prompt for your GCP project ID
2. ✅ Authenticate with Google Cloud
3. ✅ Enable required APIs
4. ✅ Create GCS bucket
5. ✅ Update all config files
6. ✅ Install dependencies
7. ✅ Upload dataset

**Then follow the printed next steps to train and deploy!**

---

## Option 2: Manual Setup

### 1. Configure GCP (5 min)

```bash
# Set variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export BUCKET_NAME="${PROJECT_ID}-migraine-ml"

# Authenticate
gcloud auth login
gcloud auth application-default login
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com

# Create bucket
gsutil mb -l $REGION gs://$BUCKET_NAME
```

### 2. Update Config Files

**Edit `cloud/config.yaml`:**
```yaml
project_id: "your-project-id"  # <-- Update this
bucket_name: "your-bucket-name"  # <-- Update this
```

**Create `backend/.env`:**
```bash
cat > backend/.env << EOF
USE_GCS=true
GCS_BUCKET_NAME=your-bucket-name  # <-- Update this
GCS_MODEL_PATH=models/migraine-classifier
EOF
```

### 3. Install Dependencies

```bash
pip install -r data/requirements.txt
pip install -r cloud/requirements.txt
pip install -r backend/requirements.txt
```

### 4. Upload Dataset

```bash
gsutil cp data/augmented_dataset.csv gs://$BUCKET_NAME/data/
```

---

## Training the Model (10-15 min)

### Quick Local Training (Recommended for Hackathon)

```bash
cd cloud

python train.py \
  --data-path ../data/augmented_dataset.csv \
  --bucket-name $BUCKET_NAME \
  --epochs 50 \
  --batch-size 32
```

**Output:** Model saved to `gs://$BUCKET_NAME/models/migraine-classifier/`

### Alternative: Vertex AI Training (If You Have Time)

```bash
python deploy_training_job.py \
  --project-id $PROJECT_ID \
  --bucket-name $BUCKET_NAME \
  --dataset-path data/augmented_dataset.csv
```

---

## Deploying Backend API (10 min)

### Method 1: gcloud Run Deploy (Easiest)

```bash
cd backend

gcloud run deploy migraine-classifier \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars USE_GCS=true,GCS_BUCKET_NAME=$BUCKET_NAME
```

### Method 2: Docker Build & Deploy

```bash
# Build from parent directory (important!)
cd ..
docker build -f backend/Dockerfile -t migraine-classifier .

# Tag for GCR
docker tag migraine-classifier gcr.io/$PROJECT_ID/migraine-classifier

# Push
docker push gcr.io/$PROJECT_ID/migraine-classifier

# Deploy
gcloud run deploy migraine-classifier \
  --image gcr.io/$PROJECT_ID/migraine-classifier \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --set-env-vars USE_GCS=true,GCS_BUCKET_NAME=$BUCKET_NAME
```

---

## Testing (2 min)

```bash
# Get API URL
export API_URL=$(gcloud run services describe migraine-classifier \
  --region $REGION \
  --format 'value(status.url)')

echo "API URL: $API_URL"

# Health check
curl $API_URL/health

# Make prediction
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

# Test online learning
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
    "true_label": "Migraine without aura"
  }'

# Check metrics
curl $API_URL/metrics
```

---

## Troubleshooting

### "Permission Denied" Errors
```bash
# Re-authenticate
gcloud auth application-default login
```

### "Model Not Found" in Backend
```bash
# Verify model exists in GCS
gsutil ls gs://$BUCKET_NAME/models/migraine-classifier/

# Should show: model.pt, scaler.pkl, label_encoder.pkl
```

### Docker Build Fails
```bash
# Make sure you're in the parent directory!
cd /path/to/AavaPfizer  # NOT in backend/
docker build -f backend/Dockerfile -t migraine-classifier .
```

### Cloud Run Deploy Fails
```bash
# Check logs
gcloud run logs read migraine-classifier --region $REGION --limit 100
```

---

## Expected Timeline

- **Setup**: 5-10 minutes
- **Training**: 10-15 minutes (local) or 15-30 minutes (Vertex AI)
- **Deployment**: 10 minutes
- **Testing**: 2 minutes

**Total: ~30-45 minutes from zero to deployed API!**

---

## Cost Breakdown (Free Tier)

Google Cloud Free Tier includes:
- ✅ $300 credit for 90 days
- ✅ Cloud Run: 2M requests/month free
- ✅ GCS: 5GB storage free
- ✅ Vertex AI: Covered by $300 credit

**This hackathon project will use < $1 of your credits!**

---

## Share with Frontend Team

Once deployed, share this with your frontend developers:

```
API Base URL: https://migraine-classifier-xxxxx.run.app

Endpoints:
- POST /predict - Make predictions
- POST /update - Trigger online learning
- GET /metrics - View learning metrics
- GET /health - Health check

API Docs: https://migraine-classifier-xxxxx.run.app/docs
```

---

## Demo Script for Judges

1. **Show prediction**: User enters symptoms → Get prediction with confidence
2. **Show correction**: User corrects → Trigger `/update` endpoint
3. **Show learning**: Submit similar case → Higher confidence!
4. **Show metrics**: Display `/metrics` showing updates, buffer size, loss

**Wow factor**: "The model just learned from ONE example in real-time!"

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed guide
- API docs at `/docs` endpoint
- Backend logs: `gcloud run logs read migraine-classifier --region $REGION`
- Cloud Console: https://console.cloud.google.com
