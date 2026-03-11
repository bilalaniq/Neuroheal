#!/bin/bash
# Quick Setup Script for Migraine Classifier Hackathon
# Run this tomorrow when you have your GCP credentials ready

set -e  # Exit on error

echo "=================================="
echo "MIGRAINE CLASSIFIER - SETUP SCRIPT"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Set your GCP project details
echo -e "\n${YELLOW}Step 1: Configure GCP Project${NC}"
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter your preferred region [us-central1]: " REGION
REGION=${REGION:-us-central1}
BUCKET_NAME="${PROJECT_ID}-migraine-ml"

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Bucket: $BUCKET_NAME"

export PROJECT_ID
export REGION
export BUCKET_NAME

# Step 2: Authenticate with Google Cloud
echo -e "\n${YELLOW}Step 2: Authenticating with Google Cloud...${NC}"
gcloud auth login
gcloud auth application-default login
gcloud config set project $PROJECT_ID

echo -e "${GREEN}✓ Authenticated${NC}"

# Step 3: Enable required APIs
echo -e "\n${YELLOW}Step 3: Enabling required APIs...${NC}"
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"

# Step 4: Create GCS bucket
echo -e "\n${YELLOW}Step 4: Creating GCS bucket...${NC}"
if gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
    echo "Bucket gs://$BUCKET_NAME already exists"
else
    gsutil mb -l $REGION gs://$BUCKET_NAME
    echo -e "${GREEN}✓ Bucket created: gs://$BUCKET_NAME${NC}"
fi

# Step 5: Update config files
echo -e "\n${YELLOW}Step 5: Updating configuration files...${NC}"

# Update cloud/config.yaml
cat > cloud/config.yaml << EOF
# Vertex AI Training Configuration

# Google Cloud settings
project_id: "$PROJECT_ID"
location: "$REGION"
bucket_name: "$BUCKET_NAME"

# Data paths
dataset_local_path: "../data/augmented_dataset.csv"
dataset_gcs_path: "data/augmented_dataset.csv"
model_output_path: "models/migraine-classifier"

# Model architecture
model:
  input_dim: 23
  hidden_dims: [64, 32]
  num_classes: 8
  dropout_rate: 0.3

# Training hyperparameters
training:
  epochs: 100
  batch_size: 32
  learning_rate: 0.001
  test_split: 0.2
  random_seed: 42

# Compute resources
compute:
  machine_type: "n1-standard-4"
  accelerator_type: null  # "NVIDIA_TESLA_T4" for GPU
  accelerator_count: 0    # 1 for GPU
  replica_count: 1

# Online learning settings (for backend)
online_learning:
  learning_rate: 0.0001
  replay_buffer_size: 100
  replay_frequency: 10
  save_frequency: 5
  confidence_threshold: 0.8
EOF

# Create backend .env file
cat > backend/.env << EOF
# Backend Configuration
USE_GCS=true
GCS_BUCKET_NAME=$BUCKET_NAME
GCS_MODEL_PATH=models/migraine-classifier

# Online Learning Settings
ONLINE_LEARNING_RATE=0.0001
REPLAY_BUFFER_SIZE=100
REPLAY_FREQUENCY=10
CONFIDENCE_THRESHOLD=0.8
SAVE_FREQUENCY=5
EOF

echo -e "${GREEN}✓ Configuration files updated${NC}"

# Step 6: Install Python dependencies
echo -e "\n${YELLOW}Step 6: Installing Python dependencies...${NC}"
pip install -r data/requirements.txt
pip install -r cloud/requirements.txt
pip install -r backend/requirements.txt

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 7: Upload dataset to GCS
echo -e "\n${YELLOW}Step 7: Uploading dataset to GCS...${NC}"
gsutil cp data/augmented_dataset.csv gs://$BUCKET_NAME/data/
echo -e "${GREEN}✓ Dataset uploaded to gs://$BUCKET_NAME/data/augmented_dataset.csv${NC}"

# Summary
echo -e "\n${GREEN}=================================="
echo "✓ SETUP COMPLETE!"
echo "==================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Train the model:"
echo "   cd cloud"
echo "   python train.py --data-path ../data/augmented_dataset.csv --bucket-name $BUCKET_NAME --epochs 50"
echo ""
echo "2. Deploy to Cloud Run:"
echo "   cd ../backend"
echo "   gcloud run deploy migraine-classifier \\"
echo "     --source . \\"
echo "     --region $REGION \\"
echo "     --allow-unauthenticated \\"
echo "     --memory 2Gi \\"
echo "     --set-env-vars USE_GCS=true,GCS_BUCKET_NAME=$BUCKET_NAME"
echo ""
echo "3. Test the API:"
echo "   export API_URL=\$(gcloud run services describe migraine-classifier --region $REGION --format 'value(status.url)')"
echo "   curl \$API_URL/health"
echo ""

# Save environment variables for later
cat > .env.project << EOF
export PROJECT_ID="$PROJECT_ID"
export REGION="$REGION"
export BUCKET_NAME="$BUCKET_NAME"
EOF

echo -e "${YELLOW}Environment variables saved to .env.project${NC}"
echo "Run 'source .env.project' to reload them in a new terminal"
