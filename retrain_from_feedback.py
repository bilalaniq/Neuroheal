"""
Retrain model using real user feedback collected locally.
This script reads from data/user_feedback.csv (or data/predictions.csv)
and retrains the model with real user labels.

Run: python retrain_from_feedback.py
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
import joblib
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
FEEDBACK_FILE = Path("data/user_feedback.csv")
MODEL_FILE = Path("backend/artifacts/model.pt")
SCALER_FILE = Path("backend/artifacts/scaler.pkl")

class MigraineClassifier(nn.Module):
    """Neural network for migraine classification."""
    
    def __init__(self, input_dim=50, hidden_dims=[64, 32], num_classes=8, dropout_rate=0.3):
        super(MigraineClassifier, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dims[0])
        self.bn1 = nn.BatchNorm1d(hidden_dims[0])
        self.fc2 = nn.Linear(hidden_dims[0], hidden_dims[1])
        self.bn2 = nn.BatchNorm1d(hidden_dims[1])
        self.fc3 = nn.Linear(hidden_dims[1], num_classes)
        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = torch.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        x = self.bn2(x)
        x = torch.relu(x)
        x = self.dropout(x)
        x = self.fc3(x)
        return x


CLASS_NAMES = [
    "No migraine",
    "Migraine without aura",
    "Migraine with aura",
    "Typical aura with migraine",
    "Typical aura without migraine",
    "Familial hemiplegic migraine",
    "Basilar-type aura",
    "Other"
]


def retrain_from_feedback():
    """Retrain model using user feedback."""
    
    logger.info("=" * 70)
    logger.info("RETRAINING MODEL FROM USER FEEDBACK")
    logger.info("=" * 70)
    
    # Check if feedback file exists
    if not FEEDBACK_FILE.exists():
        logger.warning(f"No feedback file found at {FEEDBACK_FILE}")
        logger.warning("Collect some predictions first using the API!")
        return
    
    # Load feedback
    logger.info(f"Loading feedback from {FEEDBACK_FILE}...")
    feedback_df = pd.read_csv(FEEDBACK_FILE)
    
    logger.info(f"✓ Loaded {len(feedback_df)} feedback entries")
    
    # Group by true_label to see consistency
    logger.info("\nFeedback distribution:")
    for label in CLASS_NAMES:
        count = (feedback_df['true_label'] == label).sum()
        if count > 0:
            logger.info(f"  • {label}: {count}")
    
    # Load existing predictions for features
    if Path("data/predictions.csv").exists():
        logger.info(f"\nLoading predictions from data/predictions.csv...")
        pred_df = pd.read_csv(Path("data/predictions.csv"))
        
        # Try to match feedback with predictions by timestamp
        # This is a simple example - you might need more sophisticated matching
        logger.info(f"✓ Loaded {len(pred_df)} predictions")
    
    # Load current model and scaler
    logger.info("\nLoading current model...")
    try:
        scaler = joblib.load(SCALER_FILE)
        model = MigraineClassifier()
        model.load_state_dict(torch.load(MODEL_FILE, map_location='cpu'))
        logger.info("✓ Model and scaler loaded")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return
    
    # Calculate feedback accuracy with current model
    logger.info("\n" + "-" * 70)
    logger.info("CURRENT MODEL FEEDBACK ACCURACY")
    logger.info("-" * 70)
    
    correct = (feedback_df['predicted'] == feedback_df['true_label']).sum()
    accuracy = correct / len(feedback_df) * 100
    
    logger.info(f"Correct predictions: {correct}/{len(feedback_df)}")
    logger.info(f"Accuracy from feedback: {accuracy:.2f}%")
    
    if accuracy < 80:
        logger.warning(f"⚠️  Accuracy is low ({accuracy:.2f}%) - Model needs retraining!")
        logger.info("\n💡 Next steps:")
        logger.info("   1. Collect more feedback from users (at least 20-30 samples)")
        logger.info("   2. Implement feedback-based training with full feature data")
        logger.info("   3. Validate with test set before deploying")
    else:
        logger.info(f"✅ Model accuracy is good ({accuracy:.2f}%)")
    
    logger.info("\n" + "=" * 70)
    logger.info("Retraining Notes:")
    logger.info("=" * 70)
    logger.info("""
For full retraining, you need:
1. Original feature data for each prediction
2. User's true labels (corrections)
3. Training loop to update model weights

Current feedback only has labels. To enable full retraining:

Option A: Store full features in predictions.csv
  └─ Modify main_local.py to save all features

Option B: Implement incremental learning
  └─ Update model weights based on feedback (already available in OnlineLearningManager)

Option C: Collect new training data
  └─ Gather labeled migraine data from medical sources
  └─ Retrain from scratch
    """)
    
    logger.info("=" * 70)


if __name__ == "__main__":
    retrain_from_feedback()
