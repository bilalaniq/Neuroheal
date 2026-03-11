import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

print("=" * 60)
print("🚀 TRAINING MIGRAINE MODEL (CLEAN - NO TIME FEATURES)")
print("=" * 60)

# 1. Load data
print("\n📂 Loading data...")
base_dir = Path(__file__).resolve().parent.parent

df = pd.read_csv(base_dir / "data_set" / "migraine_data.csv")

# Parse dates
df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")
df = df.dropna(subset=["Date", "Headache severity"])
df["Headache severity"] = df["Headache severity"].astype(int)
df = df.sort_values("Date")
df = df.drop_duplicates(subset=["Date"], keep="last")

print(f"✅ Total days: {len(df)}")
print(f"📊 Severity distribution: {df['Headache severity'].value_counts().sort_index().to_dict()}")

# 2. Convert to binary
df['Migraine'] = (df['Headache severity'] > 0).astype(int)
print(f"✅ Binary: 0={sum(df['Migraine']==0)}, 1={sum(df['Migraine']==1)}")

# 3. Feature engineering - ONLY triggers and previous day
print("\n🛠️  Engineering features...")

# Previous day migraine (useful for recovery patterns)
df["Prev_day_migraine"] = df["Migraine"].shift(1).fillna(0)

# Weekend - keep this one, it's useful
df["Weekend"] = df["Date"].dt.dayofweek.isin([5, 6]).astype(int)

# ALL TRIGGER COLUMNS - this is what matters
trigger_cols = [
    "Cold air exposure",
    "Nightshade vegetables (tomatoes, eggplants, potatoes, peppers)",
    "Perfume or strong odors",
    "Physical exertion",
    "Overslept",
    "Lack of sleep",
    "Post-stress letdown",
    "Stress",
    "Missed a meal",
    "Smoked or cured meat (e.g., hot dogs)",
    "Bananas",
    "Caffeine",
    "Citrus fruit or juice",
    "Beer",
    "Aged or blue cheese",
    "Chocolate",
    "Red wine",
    "Bright or flashing Lights",
    "Liquor or spirits",
    "Loud sounds",
    "Sugar and Sweets",
    "Dehydration",
    "Changing weather",
    "Hot and humid weather"
]

# Filter to existing columns
available_triggers = [col for col in trigger_cols if col in df.columns]
print(f"✅ Using {len(available_triggers)} trigger columns")

# Feature list - ONLY triggers and useful context
feature_cols = available_triggers + [
    "Prev_day_migraine",
    "Weekend"
]

# Create feature matrix
X = df[feature_cols].copy()
y = df["Migraine"].copy()

# Fill missing values with 0
X = X.fillna(0)

print(f"✅ Total features: {X.shape[1]}")

# 4. Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"✅ Training: {len(X_train)}, Testing: {len(X_test)}")

# 5. Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 6. Train model
print("\n🤖 Training model...")

from sklearn.utils.class_weight import compute_class_weight
class_weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
class_weight_dict = {0: class_weights[0], 1: class_weights[1]}

model = LogisticRegression(
    C=1.0,
    class_weight=class_weight_dict,
    max_iter=1000,
    random_state=42
)

model.fit(X_train_scaled, y_train)

# 7. Evaluate
print("\n📊 Performance on TEST data (unseen):")
y_test_pred = model.predict(X_test_scaled)
print(classification_report(y_test, y_test_pred, target_names=['No Migraine', 'Migraine']))

cm = confusion_matrix(y_test, y_test_pred)
print(f"\n📊 Confusion Matrix:")
print(f"               Predicted")
print(f"               No   Yes")
print(f"Actual No    {cm[0,0]:3d}  {cm[0,1]:3d}")
print(f"       Yes   {cm[1,0]:3d}  {cm[1,1]:3d}")

accuracy = (cm[0,0] + cm[1,1]) / len(y_test)
print(f"\n✅ Test Accuracy: {accuracy:.2%}")

# 8. Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'coefficient': model.coef_[0]
}).sort_values('coefficient', ascending=False)

print("\n🔍 TOP TRIGGERS (increase migraine risk):")
print(feature_importance.head(15).to_string(index=False))

print("\n🔍 BOTTOM TRIGGERS (decrease migraine risk):")
print(feature_importance.tail(15).to_string(index=False))

# 9. Test with scenarios
print("\n" + "=" * 60)
print("🔮 TESTING WITH REAL SCENARIOS")
print("=" * 60)

test_scenarios = [
    {
        "name": "🍷 HEAVY DRINKING NIGHT",
        "data": {
            'Liquor or spirits': 4,
            'Red wine': 2,
            'Dehydration': 3,
            'Loud sounds': 3,
            'Lack of sleep': 2
        },
        "should_be": "MIGRAINE"
    },
    {
        "name": "💼 STRESSFUL WORK WEEK",
        "data": {
            'Stress': 4,
            'Lack of sleep': 3,
            'Caffeine': 3,
            'Missed a meal': 2
        },
        "should_be": "MIGRAINE"
    },
    {
        "name": "🌱 HEALTHY DAY",
        "data": {
            'Stress': 1,
            'Physical exertion': 2,
            'Dehydration': 1,
            'Lack of sleep': 1
        },
        "should_be": "NO MIGRAINE"
    },
    {
        "name": "🍫 FOOD TRIGGERS",
        "data": {
            'Chocolate': 3,
            'Red wine': 2,
            'Aged or blue cheese': 2,
            'Sugar and Sweets': 3
        },
        "should_be": "MIGRAINE"
    },
    {
        "name": "🌧️ WEATHER CHANGE",
        "data": {
            'Changing weather': 4,
            'Hot and humid weather': 3,
            'Cold air exposure': 2
        },
        "should_be": "MIGRAINE"
    },
    {
        "name": "😴 POOR SLEEP",
        "data": {
            'Lack of sleep': 4,
            'Overslept': 2,
            'Caffeine': 2
        },
        "should_be": "MIGRAINE"
    },
    {
        "name": "🏃 EXERCISE + DEHYDRATION",
        "data": {
            'Physical exertion': 4,
            'Dehydration': 3,
            'Lack of sleep': 2
        },
        "should_be": "MIGRAINE"
    }
]

for scenario in test_scenarios:
    print(f"\n📌 {scenario['name']}")
    
    # Create sample
    sample = pd.DataFrame(0, index=[0], columns=feature_cols)
    for col, val in scenario['data'].items():
        if col in sample.columns:
            sample[col] = val
    
    # Add defaults
    sample['Prev_day_migraine'] = 0
    sample['Weekend'] = 0  # Assume weekday
    
    # Predict
    sample_scaled = scaler.transform(sample[feature_cols])
    pred = model.predict(sample_scaled)[0]
    proba = model.predict_proba(sample_scaled)[0]
    
    pred_text = "MIGRAINE" if pred == 1 else "NO MIGRAINE"
    expected = scenario['should_be']
    correct = (pred_text == expected)
    
    print(f"   Expected: {expected}")
    print(f"   Prediction: {pred_text}")
    print(f"   Confidence: {max(proba)*100:.1f}%")
    print(f"   Correct: {'✅' if correct else '❌'}")
    
    # Show top contributing factors
    if pred == 1 or not correct:
        print("   Top triggers:")
        contributions = []
        for i, col in enumerate(feature_cols):
            if sample[col].values[0] > 0:
                contrib = model.coef_[0][i] * scaler.scale_[i] * sample[col].values[0]
                contributions.append((col, contrib))
        
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        for col, contrib in contributions[:4]:
            direction = "↑ increases" if contrib > 0 else "↓ decreases"
            print(f"      {direction}: {col} ({contrib:.3f})")

# ============================================================================
# Save to ../migraine_data folder
# ============================================================================
print("\n💾 Saving model to ../migraine_data folder...")

# Create output directory: ../migraine_data
output_dir = base_dir / "migraine_data"
output_dir.mkdir(parents=True, exist_ok=True)
print(f"✅ Output directory: {output_dir}")

# Save the model (scikit-learn format)
model_payload = {
    "model": model,
    "scaler": scaler,
    "feature_columns": feature_cols,
    "test_accuracy": float(accuracy),
    "confusion_matrix": cm.tolist(),
    "training_date": datetime.now().isoformat(),
    "top_5_triggers": feature_importance.head(5).to_dict('records')
}

model_path = output_dir / "migraine_model_clean.pkl"
with open(model_path, "wb") as f:
    pickle.dump(model_payload, f)
print(f"✅ Model saved to: {model_path}")

# ============================================================================
# ADDED: Save PyTorch format (.pt) if available
# ============================================================================
try:
    import torch
    import torch.nn as nn
    
    # Create a simple wrapper for PyTorch
    class SklearnModelWrapper(nn.Module):
        def __init__(self, model, scaler, feature_names):
            super().__init__()
            self.model = model
            self.scaler = scaler
            self.feature_names = feature_names
        
        def forward(self, x):
            # This is just a wrapper - the actual prediction uses sklearn
            return x
    
    wrapper = SklearnModelWrapper(model, scaler, feature_cols)
    torch_path = output_dir / "migraine_model.pt"
    torch.save(wrapper, torch_path)
    print(f"✅ PyTorch model saved to: {torch_path}")
except ImportError:
    print("⚠️ PyTorch not installed, skipping model.pt")
except Exception as e:
    print(f"⚠️ Could not save PyTorch model: {e}")

# Also save the feature importance as CSV for easy viewing
importance_path = output_dir / "feature_importance.csv"
feature_importance.to_csv(importance_path, index=False)
print(f"✅ Feature importance saved to: {importance_path}")

# Save training summary
summary = {
    "training_date": datetime.now().isoformat(),
    "model_type": "LogisticRegression",
    "test_accuracy": float(accuracy),
    "confusion_matrix": cm.tolist(),
    "total_samples": len(df),
    "migraine_days": int(sum(df['Migraine']==1)),
    "no_migraine_days": int(sum(df['Migraine']==0)),
    "feature_count": len(feature_cols),
    "top_5_triggers": feature_importance.head(5).to_dict('records')
}

summary_path = output_dir / "training_summary.json"
with open(summary_path, "w") as f:
    json.dump(summary, f, indent=2)
print(f"✅ Training summary saved to: {summary_path}")

print("\n" + "=" * 60)
print("🎯 CLEAN MODEL READY!")
print("=" * 60)

# Show key insights
print("\n📊 YOUR PERSONAL MIGRAINE TRIGGERS (from your data):")
for i, row in feature_importance.head(8).iterrows():
    print(f"   {i+1}. {row['feature']}: {row['coefficient']:.3f}")

print(f"\n📁 All files saved to: {output_dir}")
print("=" * 60)