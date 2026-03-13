# ============================================================================
# EXAMPLE: Load and use the migraine classification model
# ============================================================================

import pickle
import numpy as np
import pandas as pd
from pathlib import Path

# Load the complete package
model_path = Path("migraine_symptom_classification/complete_package.pkl")
with open(model_path, 'rb') as f:
    package = pickle.load(f)

# Extract components
model = package['model']
scaler = package['scaler']
label_encoder = package['label_encoder']
feature_columns = package['feature_columns']
class_mapping = package['class_mapping']

print(f"Model loaded successfully!")
print(f"Test accuracy: {package['accuracy']:.2%}")
print(f"Classes: {list(class_mapping.values())}")

def predict_migraine(patient_data):
    """
    Predict migraine type for a patient
    
    Args:
        patient_data: dict with feature names and values
        
    Returns:
        dict with prediction results
    """
    # Create feature vector
    x = np.zeros((1, len(feature_columns)))
    for i, col in enumerate(feature_columns):
        if col in patient_data:
            x[0, i] = patient_data[col]
    
    # Scale and predict
    x_scaled = scaler.transform(x)
    pred = model.predict(x_scaled)[0]
    proba = model.predict_proba(x_scaled)[0]
    
    # Get results
    pred_name = label_encoder.inverse_transform([pred])[0]
    
    return {
        'prediction': pred_name,
        'confidence': float(max(proba)),
        'probabilities': {
            label_encoder.inverse_transform([i])[0]: float(proba[i])
            for i in range(len(proba))
        }
    }

# Example usage
if __name__ == "__main__":
    sample = {
        'Age': 32,
        'Duration': 2,
        'Frequency': 3,
        'Location': 1,
        'Character': 1,
        'Intensity': 3,
        'Nausea': 1,
        'Vomit': 0,
        'Phonophobia': 1,
        'Photophobia': 1,
        'Visual': 2,
        'Sensory': 0,
        'Dysphasia': 0,
        'Dysarthria': 0,
        'Vertigo': 0,
        'Tinnitus': 0,
        'Hypoacusis': 0,
        'Diplopia': 0,
        'Defect': 0,
        'Conscience': 0,
        'Paresthesia': 0,
        'DPF': 0
    }
    
    result = predict_migraine(sample)
    print(f"\nPrediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.1%}")
