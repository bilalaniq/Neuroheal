"""
LOCAL-ONLY BACKEND - No Cloud Services Required
Stores predictions locally instead of BigQuery
Saves models locally instead of GCS

MODES:
- DEBUG: Demo mode with sample data (development/testing)
- RELEASE: Production mode - starts from scratch (user choice)
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from pathlib import Path
import csv
import json

import torch
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from model import MigraineClassifier, CLASS_NAMES
from online_learning import OnlineLearningManager
from schemas import MigraineFeatures, PredictionResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# MODE CONFIGURATION - CHANGE HERE
# ============================================================================
MODE = os.getenv("APP_MODE", "release").lower()  # "debug" or "release"
DEMO_ENABLE = True if MODE == "debug" else False

if MODE == "debug":
    logger.info("🔧 DEBUG MODE ENABLED - Using sample data")
else:
    logger.info("📦 RELEASE MODE - Starting fresh (user choice)")

# ============================================================================

# Initialize FastAPI
app = FastAPI(
    title="Migraine Classifier API - Local",
    description=f"Real-time migraine classification (LOCAL - {MODE.upper()} MODE)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model_manager = None
scaler = None

# Paths - relative to backend directory (where this file runs from)
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
PREDICTIONS_FILE = Path(__file__).parent.parent / "data" / "predictions.csv"
FEEDBACK_FILE = Path(__file__).parent.parent / "data" / "user_feedback.csv"

# Ensure directories exist
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
PREDICTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
FEEDBACK_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_model():
    """Load model from local files."""
    global model_manager, scaler
    
    logger.info("Loading model from local artifacts...")
    
    try:
        import joblib
        
        # Load model state
        state_dict = torch.load(
            ARTIFACTS_DIR / "model.pt",
            map_location=torch.device('cpu')
        )
        
        # Load scaler
        scaler = joblib.load(ARTIFACTS_DIR / "scaler.pkl")
        
        # Initialize model
        model = MigraineClassifier()
        model.load_state_dict(state_dict)
        
        # Initialize online learning manager
        model_manager = OnlineLearningManager(
            model=model,
            learning_rate=0.0001,
            replay_buffer_size=100,
            replay_frequency=10,
            confidence_threshold=0.8,
            device="cpu"
        )
        
        logger.info("✓ Model loaded successfully from local files")
        logger.info(f"✓ Predictions will be saved to: {PREDICTIONS_FILE}")
        logger.info(f"✓ Feedback will be saved to: {FEEDBACK_FILE}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


def save_prediction_locally(user_id: str, features: dict, prediction: str, confidence: float, all_probs: dict):
    """Save prediction to local CSV file."""
    try:
        file_exists = PREDICTIONS_FILE.exists()
        
        with open(PREDICTIONS_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # Write header on first write
            if not file_exists:
                writer.writerow([
                    'timestamp', 'user_id', 'prediction', 'confidence',
                    'all_probabilities', 'age', 'duration', 'frequency',
                    'intensity', 'nausea', 'vomit', 'photophobia'
                ])
            
            # Write data
            writer.writerow([
                datetime.utcnow().isoformat(),
                user_id or "anonymous",
                prediction,
                f"{confidence:.4f}",
                json.dumps(all_probs),
                features.get('age', ''),
                features.get('duration', ''),
                features.get('frequency', ''),
                features.get('intensity', ''),
                features.get('nausea', ''),
                features.get('vomit', ''),
                features.get('photophobia', '')
            ])
        
        logger.info(f"✓ Prediction saved to {PREDICTIONS_FILE}")
        
    except Exception as e:
        logger.error(f"Failed to save prediction: {e}")


def save_feedback_locally(user_id: str, prediction: str, true_label: str, correct: bool):
    """Save user feedback to CSV."""
    try:
        file_exists = FEEDBACK_FILE.exists()
        
        with open(FEEDBACK_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            
            if not file_exists:
                writer.writerow(['timestamp', 'user_id', 'predicted', 'true_label', 'was_correct'])
            
            writer.writerow([
                datetime.utcnow().isoformat(),
                user_id or "anonymous",
                prediction,
                true_label,
                correct
            ])
        
        logger.info(f"✓ Feedback saved to {FEEDBACK_FILE}")
        
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")


def save_model_locally():
    """Save model to local files."""
    try:
        import joblib
        
        torch.save(model_manager.model.state_dict(), ARTIFACTS_DIR / "model.pt")
        joblib.dump(scaler, ARTIFACTS_DIR / "scaler.pkl")
        
        logger.info(f"✓ Model saved to {ARTIFACTS_DIR}")
        
    except Exception as e:
        logger.error(f"Failed to save model: {e}")


def generate_demo_data():
    """Generate sample predictions for demo mode."""
    try:
        import random
        
        demo_users = ["demo_user_1", "demo_user_2", "demo_user_3"]
        demo_symptoms = [
            {"age": 35, "duration": 2, "frequency": 5, "location": 1, "character": 1, "intensity": 3, 
             "nausea": 1, "vomit": 0, "phonophobia": 1, "photophobia": 1, "visual": 2, "sensory": 0,
             "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0, "hypoacusis": 0, 
             "diplopia": 0, "defect": 0, "ataxia": 0, "conscience": 0, "paresthesia": 0, "dpf": 0,
             "prediction": "Migraine with aura", "confidence": 0.85},
            
            {"age": 42, "duration": 3, "frequency": 4, "location": 1, "character": 1, "intensity": 2,
             "nausea": 1, "vomit": 1, "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
             "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0, "hypoacusis": 0,
             "diplopia": 0, "defect": 0, "ataxia": 0, "conscience": 0, "paresthesia": 0, "dpf": 1,
             "prediction": "Migraine without aura", "confidence": 0.72},
            
            {"age": 28, "duration": 1, "frequency": 2, "location": 0, "character": 0, "intensity": 1,
             "nausea": 0, "vomit": 0, "phonophobia": 0, "photophobia": 0, "visual": 0, "sensory": 0,
             "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0, "hypoacusis": 0,
             "diplopia": 0, "defect": 0, "ataxia": 0, "conscience": 0, "paresthesia": 0, "dpf": 0,
             "prediction": "No migraine", "confidence": 0.91},
        ]
        
        # Generate 5 sample predictions spread over last 7 days
        for i in range(5):
            user = random.choice(demo_users)
            symptoms = random.choice(demo_symptoms)
            days_ago = random.randint(1, 7)
            timestamp = (datetime.utcnow() - timedelta(days=days_ago)).isoformat()
            
            file_exists = PREDICTIONS_FILE.exists()
            with open(PREDICTIONS_FILE, 'a', newline='') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow([
                        'timestamp', 'user_id', 'prediction', 'confidence',
                        'all_probabilities', 'age', 'duration', 'frequency',
                        'intensity', 'nausea', 'vomit', 'photophobia'
                    ])
                
                writer.writerow([
                    timestamp,
                    user,
                    symptoms['prediction'],
                    f"{symptoms['confidence']:.4f}",
                    json.dumps({}),
                    symptoms['age'],
                    symptoms['duration'],
                    symptoms['frequency'],
                    symptoms['intensity'],
                    symptoms['nausea'],
                    symptoms['vomit'],
                    symptoms['photophobia']
                ])
        
        logger.info(f"✓ Generated 5 demo predictions for testing")
        
    except Exception as e:
        logger.warning(f"Could not generate demo data: {e}")



@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("=" * 70)
    logger.info(f"MIGRAINE CLASSIFIER - LOCAL MODE ({MODE.upper()})")
    logger.info("=" * 70)
    load_model()
    
    if DEMO_ENABLE:
        logger.info("🔧 DEMO MODE: Generating sample data...")
        generate_demo_data()
    else:
        logger.info("📦 RELEASE MODE: Fresh start (collect real data)")
    
    logger.info("✓ API READY - Predictions will be stored locally")
    logger.info("=" * 70)


@app.get("/health")
async def health_check():
    """Health check with mode info."""
    return {
        "status": "healthy" if model_manager else "unhealthy",
        "model_loaded": model_manager is not None,
        "mode": MODE.upper(),
        "demo_enabled": DEMO_ENABLE,
        "predictions_file": str(PREDICTIONS_FILE),
        "feedback_file": str(FEEDBACK_FILE)
    }


@app.post("/predict")
async def predict(features: MigraineFeatures, user_id: str = "anonymous"):
    """
    Make a prediction and save locally.
    
    Args:
        features: Patient features
        user_id: Optional user identifier for tracking
    """
    if model_manager is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        import joblib
        
        # Preprocess
        feature_array = np.array([features.to_tensor()], dtype=np.float32)
        feature_scaled = scaler.transform(feature_array)
        feature_tensor = torch.FloatTensor(feature_scaled)

        # Predict
        pred_idx, probs, confidence = model_manager.predict(feature_tensor)
        predicted_class = CLASS_NAMES[pred_idx]
        
        # Probabilities dict
        prob_dict = {
            class_name: float(probs[0][i])
            for i, class_name in enumerate(CLASS_NAMES)
        }

        # Save locally
        save_prediction_locally(
            user_id, 
            features.dict(), 
            predicted_class, 
            confidence,
            prob_dict
        )

        logger.info(f"[{user_id}] Prediction: {predicted_class} ({confidence:.2%})")

        return {
            "user_id": user_id,
            "prediction": predicted_class,
            "confidence": float(confidence),
            "all_probabilities": prob_dict,
            "timestamp": datetime.utcnow().isoformat(),
            "stored_locally": True
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
async def store_user_feedback(
    user_id: str = "anonymous",
    predicted: str = None,
    true_label: str = None,
    background_tasks: BackgroundTasks = None
):
    """
    Store user feedback/correction.
    Use this when user corrects the prediction.
    """
    if true_label not in CLASS_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid label. Must be one of: {CLASS_NAMES}")

    try:
        was_correct = (predicted == true_label)
        save_feedback_locally(user_id, predicted or "unknown", true_label, was_correct)
        
        return {
            "status": "success",
            "feedback_saved": True,
            "was_correct": was_correct,
            "message": f"Feedback stored: {true_label}"
        }

    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export-data")
async def export_data():
    """Get summary of stored data."""
    try:
        import pandas as pd
        
        data = {
            "predictions_file": str(PREDICTIONS_FILE),
            "feedback_file": str(FEEDBACK_FILE),
            "artifacts_dir": str(ARTIFACTS_DIR),
            "mode": MODE.upper(),
            "demo_enabled": DEMO_ENABLE
        }
        
        if PREDICTIONS_FILE.exists():
            df = pd.read_csv(PREDICTIONS_FILE)
            data["predictions_count"] = len(df)
            data["unique_users"] = df['user_id'].nunique()
        
        if FEEDBACK_FILE.exists():
            df = pd.read_csv(FEEDBACK_FILE)
            data["feedback_count"] = len(df)
            correct = (df['predicted'] == df['true_label']).sum()
            data["accuracy_from_feedback"] = f"{correct / len(df) * 100:.2f}%"
        
        return data
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/config")
async def get_config():
    """Get current configuration and mode settings."""
    return {
        "mode": MODE.upper(),
        "demo_enabled": DEMO_ENABLE,
        "description": "DEBUG mode provides sample data for testing. RELEASE mode starts fresh with user choice.",
        "settings": {
            "predict_endpoint": "/predict?user_id=YOUR_USER_ID (optional)",
            "feedback_endpoint": "/feedback?user_id=YOUR_USER_ID&predicted=TYPE&true_label=TYPE",
            "analytics_endpoint": "/export-data (shows data summary)"
        },
        "available_classes": CLASS_NAMES,
        "data_locations": {
            "predictions": str(PREDICTIONS_FILE),
            "feedback": str(FEEDBACK_FILE),
            "model": str(ARTIFACTS_DIR / "model.pt")
        }
    }


@app.delete("/reset-data")
async def reset_data():
    """
    RESET all data - only in DEBUG mode!
    Use this to start fresh in demo.
    """
    if MODE != "debug":
        raise HTTPException(
            status_code=403,
            detail="Reset only available in DEBUG mode. Use RELEASE mode for production data."
        )
    
    try:
        # Delete files
        if PREDICTIONS_FILE.exists():
            PREDICTIONS_FILE.unlink()
            logger.info(f"✓ Deleted {PREDICTIONS_FILE}")
        
        if FEEDBACK_FILE.exists():
            FEEDBACK_FILE.unlink()
            logger.info(f"✓ Deleted {FEEDBACK_FILE}")
        
        # Regenerate demo data
        generate_demo_data()
        
        return {
            "status": "success",
            "message": "All data reset. Demo data regenerated.",
            "mode": "DEBUG"
        }
    except Exception as e:
        logger.error(f"Reset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
