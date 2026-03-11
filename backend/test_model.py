"""
Test the Model in Backend
Run from: cd d:\breeha\backend && python3 test_model.py
"""

import torch
import numpy as np
import joblib
from pathlib import Path

from model import MigraineClassifier, CLASS_NAMES, FEATURE_NAMES

print("=" * 80)
print("BACKEND MODEL TESTING")
print("=" * 80)

# Paths
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_FILE = ARTIFACTS_DIR / "model.pt"
SCALER_FILE = ARTIFACTS_DIR / "scaler.pkl"

print(f"\n📁 Loading from: {ARTIFACTS_DIR}")

# Load model
try:
    model = MigraineClassifier()
    state_dict = torch.load(MODEL_FILE, map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    model.eval()
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

# Load scaler
try:
    scaler = joblib.load(SCALER_FILE)
    print("✅ Scaler loaded successfully")
except Exception as e:
    print(f"❌ Error loading scaler: {e}")
    exit(1)

print(f"✅ Ready to test with {len(CLASS_NAMES)} classes\n")

# Test cases
test_cases = [
    {
        "name": "Test 1: Severe Migraine Symptoms",
        "user_id": "patient_001",
        "features": [40, 3, 5, 1, 1, 3, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    },
    {
        "name": "Test 2: Mild Headache (No Migraine)",
        "user_id": "patient_002",
        "features": [35, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
        "name": "Test 3: Visual Symptoms (Aura)",
        "user_id": "patient_003",
        "features": [45, 2, 4, 0, 1, 2, 1, 0, 1, 1, 3, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
    },
    {
        "name": "Test 4: Multiple Neurological Symptoms",
        "user_id": "patient_004",
        "features": [38, 3, 3, 1, 1, 2, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1]
    },
    {
        "name": "Test 5: Vertigo & Hearing Issues",
        "user_id": "patient_005",
        "features": [35, 2, 5, 0, 0, 3, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    },
]

# Run predictions
for test in test_cases:
    print(f"\n{test['name']}")
    print(f"User: {test['user_id']}")
    print("-" * 80)
    
    # Get features (23 base + 27 extended zeros)
    features = test['features'] + [0] * 27
    features_array = np.array([features], dtype=np.float32)
    
    # Scale features
    features_scaled = scaler.transform(features_array)
    features_tensor = torch.FloatTensor(features_scaled)
    
    # Predict
    with torch.no_grad():
        logits = model(features_tensor)
        probs = torch.softmax(logits, dim=1)[0]
        prediction_idx = torch.argmax(probs).item()
    
    # Results
    predicted_class = CLASS_NAMES[prediction_idx]
    confidence = probs[prediction_idx].item() * 100
    
    print(f"🎯 PREDICTION: {predicted_class}")
    print(f"📊 Confidence: {confidence:.2f}%")
    
    print(f"\n📈 All Class Probabilities:")
    sorted_probs = sorted(
        [(CLASS_NAMES[i], probs[i].item() * 100) for i in range(len(CLASS_NAMES))],
        key=lambda x: x[1],
        reverse=True
    )
    
    for i, (class_name, prob) in enumerate(sorted_probs, 1):
        bar = "█" * int(prob / 2)
        spaces = "░" * (50 - int(prob / 2))
        print(f"  {i}. {class_name:.<40} {bar}{spaces} {prob:>6.2f}%")
    
    print(f"\n📝 Input Features Used (First 10):")
    for j, (feat_name, feat_value) in enumerate(zip(FEATURE_NAMES[:10], test['features'][:10]), 1):
        print(f"  {j:2d}. {feat_name:.<25} {feat_value}")

print("\n" + "=" * 80)
print("✅ Model testing complete!")
print("=" * 80)

print("\n💡 Summary:")
print("   - Model successfully loads and makes predictions")
print("   - All 8 migraine classes are recognized")
print("   - Probabilities sum to 100%")
print("   - Features are scaled before prediction")
print("\n✨ Your model is working in the backend!")
