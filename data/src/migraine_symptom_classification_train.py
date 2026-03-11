# ============================================================================
# MIGRAINE SYMPTOM CLASSIFICATION - SIMPLIFIED PIPELINE
# ============================================================================

import numpy as np
import pandas as pd
import pickle
import json
import joblib
from pathlib import Path
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("🧠 MIGRAINE SYMPTOM CLASSIFICATION - TRAINING")
print("=" * 70)

# ============================================================================
# 1. SETUP PATHS
# ============================================================================
print("\n📂 Setting up paths...")

# Get current directory (src folder)
current_dir = Path(__file__).parent if '__file__' in locals() else Path.cwd()

# Input path: ../data_set/migraine_symptom_classification.csv
input_path = current_dir.parent / "data_set" / "migraine_symptom_classification.csv"

# Output path: ../migraine_symptom_classification
output_base = current_dir.parent / "migraine_symptom_classification"

print(f"📂 Input: {input_path}")
print(f"📂 Output: {output_base}")

# Check if input exists
if not input_path.exists():
    print(f"\n❌ ERROR: File not found at: {input_path}")
    exit(1)

# Create output directory
output_base.mkdir(parents=True, exist_ok=True)
print(f"✅ Output directory created")

# ============================================================================
# 2. LOAD DATA
# ============================================================================
print("\n📊 Loading data...")

df = pd.read_csv(input_path)
print(f"✅ Loaded {len(df)} samples with {len(df.columns)} features")

# ============================================================================
# 3. PREPARE DATA
# ============================================================================
print("\n🔧 Preparing data...")

# Drop Ataxia if it exists (all zeros)
if 'Ataxia' in df.columns:
    df = df.drop(columns=['Ataxia'])

# Encode target
label_encoder = LabelEncoder()
df['Type_encoded'] = label_encoder.fit_transform(df['Type'])

# Feature columns (all except Type and Type_encoded)
feature_columns = [col for col in df.columns if col not in ['Type', 'Type_encoded']]
X = df[feature_columns].values
y = df['Type_encoded'].values

# Class distribution
print(f"✅ Features: {len(feature_columns)}")
print("\n📊 Class distribution:")
for i, name in enumerate(label_encoder.classes_):
    count = sum(y == i)
    print(f"   {i}: {name} - {count} samples")

# ============================================================================
# 4. SPLIT DATA
# ============================================================================
print("\n✂️ Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"✅ Training: {len(X_train)} samples")
print(f"✅ Testing: {len(X_test)} samples")

# ============================================================================
# 5. SCALE FEATURES
# ============================================================================
print("\n⚖️ Scaling features...")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("✅ Scaling complete")

# ============================================================================
# 6. TRAIN MODEL
# ============================================================================
print("\n🤖 Training Random Forest model...")

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42
)

model.fit(X_train_scaled, y_train)
print("✅ Training complete")

# ============================================================================
# 7. EVALUATE MODEL
# ============================================================================
print("\n📊 Evaluating model...")

# Predictions
y_pred = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Test Accuracy: {accuracy:.2%}")

# Per-class metrics
print("\n📈 Classification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
print("\n📊 Confusion Matrix:")
print("   " + " ".join([f"{c[:8]:>8}" for c in label_encoder.classes_]))
for i, row in enumerate(cm):
    print(f"{label_encoder.classes_[i][:8]:>8} " + " ".join([f"{val:8d}" for val in row]))

# ============================================================================
# 8. FEATURE IMPORTANCE
# ============================================================================
print("\n🔍 Top 10 Most Important Features:")

feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for i, row in feature_importance.head(10).iterrows():
    print(f"   {i+1}. {row['feature']}: {row['importance']:.4f}")

# ============================================================================
# 9. SAVE ALL FILES
# ============================================================================
print("\n💾 Saving files...")

# 9.1 Save model in different formats
model_path = output_base / 'model.pkl'
with open(model_path, 'wb') as f:
    pickle.dump(model, f)
print(f"   ✅ Saved: {model_path}")

# PyTorch format (model.pt)
try:
    import torch
    import torch.nn as nn
    
    # Convert to PyTorch format
    class SklearnModelWrapper(nn.Module):
        def __init__(self, model, scaler, feature_names, class_names):
            super().__init__()
            self.model = model
            self.scaler = scaler
            self.feature_names = feature_names
            self.class_names = class_names
        
        def forward(self, x):
            if isinstance(x, np.ndarray):
                x = torch.FloatTensor(x)
            return x
    
    wrapper = SklearnModelWrapper(model, scaler, feature_columns, label_encoder.classes_.tolist())
    torch_path = output_base / 'model.pt'
    torch.save(wrapper, torch_path)
    print(f"   ✅ Saved: {torch_path}")
except:
    print("   ⚠️ PyTorch not available, skipping model.pt")

# 9.2 Save scaler
scaler_path = output_base / 'scaler.pkl'
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f"   ✅ Saved: {scaler_path}")

# 9.3 Save label encoder
encoder_path = output_base / 'label_encoder.pkl'
with open(encoder_path, 'wb') as f:
    pickle.dump(label_encoder, f)
print(f"   ✅ Saved: {encoder_path}")

# 9.4 Save feature columns
features_path = output_base / 'feature_columns.json'
with open(features_path, 'w') as f:
    json.dump(feature_columns, f, indent=2)
print(f"   ✅ Saved: {features_path}")

# 9.5 Save class mapping
mapping_path = output_base / 'class_mapping.json'
class_mapping = {i: name for i, name in enumerate(label_encoder.classes_)}
with open(mapping_path, 'w') as f:
    json.dump(class_mapping, f, indent=2)
print(f"   ✅ Saved: {mapping_path}")

# 9.6 Save feature importance
importance_path = output_base / 'feature_importance.csv'
feature_importance.to_csv(importance_path, index=False)
print(f"   ✅ Saved: {importance_path}")

# 9.7 Save complete package
package = {
    'model': model,
    'scaler': scaler,
    'label_encoder': label_encoder,
    'feature_columns': feature_columns,
    'class_mapping': class_mapping,
    'accuracy': float(accuracy),
    'training_date': datetime.now().isoformat(),
    'feature_importance': feature_importance.to_dict('records')
}

package_path = output_base / 'complete_package.pkl'
with open(package_path, 'wb') as f:
    pickle.dump(package, f)
print(f"   ✅ Saved: {package_path}")

# 9.8 Save training summary
summary = {
    'training_date': datetime.now().isoformat(),
    'model_type': 'RandomForest',
    'samples': len(df),
    'features': len(feature_columns),
    'classes': len(label_encoder.classes_),
    'class_distribution': df['Type'].value_counts().to_dict(),
    'test_accuracy': float(accuracy),
    'top_features': feature_importance.head(10).to_dict('records'),
    'files': [str(p) for p in output_base.glob('*')]
}

summary_path = output_base / 'training_summary.json'
with open(summary_path, 'w') as f:
    json.dump(summary, f, indent=2)
print(f"   ✅ Saved: {summary_path}")

# ============================================================================
# 10. TEST THE MODEL
# ============================================================================
print("\n🧪 Testing model with sample predictions...")

# Test samples
test_samples = [
    {
        'name': 'Typical migraine with aura',
        'data': {
            'Age': 30, 'Duration': 1, 'Frequency': 5, 'Location': 1, 'Character': 1,
            'Intensity': 3, 'Nausea': 1, 'Vomit': 0, 'Phonophobia': 1, 'Photophobia': 1,
            'Visual': 2, 'Sensory': 0, 'Dysphasia': 0, 'Dysarthria': 0, 'Vertigo': 0,
            'Tinnitus': 0, 'Hypoacusis': 0, 'Diplopia': 0, 'Defect': 0, 'Conscience': 0,
            'Paresthesia': 0, 'DPF': 0
        }
    },
    {
        'name': 'Migraine without aura',
        'data': {
            'Age': 35, 'Duration': 2, 'Frequency': 4, 'Location': 1, 'Character': 1,
            'Intensity': 3, 'Nausea': 1, 'Vomit': 1, 'Phonophobia': 1, 'Photophobia': 1,
            'Visual': 0, 'Sensory': 0, 'Dysphasia': 0, 'Dysarthria': 0, 'Vertigo': 0,
            'Tinnitus': 0, 'Hypoacusis': 0, 'Diplopia': 0, 'Defect': 0, 'Conscience': 0,
            'Paresthesia': 0, 'DPF': 0
        }
    },
    {
        'name': 'Basilar-type aura',
        'data': {
            'Age': 25, 'Duration': 2, 'Frequency': 3, 'Location': 1, 'Character': 1,
            'Intensity': 3, 'Nausea': 1, 'Vomit': 0, 'Phonophobia': 1, 'Photophobia': 1,
            'Visual': 2, 'Sensory': 1, 'Dysphasia': 0, 'Dysarthria': 0, 'Vertigo': 1,
            'Tinnitus': 1, 'Hypoacusis': 0, 'Diplopia': 0, 'Defect': 0, 'Conscience': 0,
            'Paresthesia': 0, 'DPF': 1
        }
    }
]

print("\n📋 Sample Predictions:")
print("-" * 70)

for sample in test_samples:
    # Create feature vector
    x = np.zeros((1, len(feature_columns)))
    for i, col in enumerate(feature_columns):
        if col in sample['data']:
            x[0, i] = sample['data'][col]
    
    # Scale and predict
    x_scaled = scaler.transform(x)
    pred = model.predict(x_scaled)[0]
    proba = model.predict_proba(x_scaled)[0]
    
    pred_name = label_encoder.inverse_transform([pred])[0]
    confidence = max(proba) * 100
    
    print(f"\n📌 {sample['name']}")
    print(f"   Predicted: {pred_name}")
    print(f"   Confidence: {confidence:.1f}%")
    
    # Show top 3 probabilities
    top3_idx = np.argsort(proba)[-3:][::-1]
    print("   Top predictions:")
    for idx in top3_idx:
        if proba[idx] > 0.05:  # Only show if >5%
            name = label_encoder.inverse_transform([idx])[0]
            print(f"      - {name}: {proba[idx]*100:.1f}%")

# ============================================================================
# 11. CREATE USAGE SCRIPT
# ============================================================================
print("\n📝 Creating usage example script...")

usage_script = '''# ============================================================================
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
    print(f"\\nPrediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.1%}")
'''

usage_path = output_base / 'usage_example.py'
with open(usage_path, 'w', encoding='utf-8') as f:
    f.write(usage_script)
print(f"   ✅ Saved: {usage_path}")

# ============================================================================
# 12. FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 70)
print("✅ TRAINING COMPLETE!")
print("=" * 70)

print(f"\n📁 All files saved to: {output_base}")
print("\n📦 Generated files:")
for f in sorted(output_base.glob('*')):
    size = f.stat().st_size / 1024  # Size in KB
    print(f"   • {f.name} ({size:.1f} KB)")

print(f"\n📊 Model Performance:")
print(f"   • Accuracy: {accuracy:.2%}")
print(f"   • Test samples: {len(X_test)}")

print("\n" + "=" * 70)