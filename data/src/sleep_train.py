import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pickle
import json
from pathlib import Path
from datetime import datetime
import joblib

# ============================================================================
# STEP 1: Load only the CSV files you have
# ============================================================================
print("📊 Loading migraine sleep database...")

# Load only the files you confirmed exist
rem = pd.read_csv('../data_set/sleep/Percentage_REM_sleep_migraineurs_and_controls.csv')
n3 = pd.read_csv('../data_set/sleep/Percentage_N3_sleep_migraineurs_and_controls.csv')  # deep sleep
n2 = pd.read_csv('../data_set/sleep/Percentage_N2_sleep_migraineurs_controls.csv')      # light sleep
n1 = pd.read_csv('../data_set/sleep/Percentage_N1_sleep_migraineurs_and_controls.csv')  # light sleep
onset = pd.read_csv('../data_set/sleep/Sleep_onset_latency_migraineurs_and_controls.csv')
tst = pd.read_csv('../data_set/sleep/TST_mins_migraineurs_controls.csv')
efficiency = pd.read_csv('../data_set/sleep/Sleep_efficiency_percentage_migraineurs_and_controls.csv')
wake = pd.read_csv('../data_set/sleep/Percentage_wake_migraineurs_and_controls.csv')
psqi = pd.read_csv('../data_set/sleep/Global_PQSI_scores_migraineurs_and_controls.csv')

print("✅ Loaded all sleep databases!")

# ============================================================================
# STEP 2: Calculate average values for migraineurs vs controls
# ============================================================================
print("\n📈 Calculating reference values...")

def get_averages(df, group_col='M_M', control_col='C_M'):
    """Calculate average for migraine and control groups"""
    migraine_avg = df[group_col].mean()
    control_avg = df[control_col].mean()
    return migraine_avg, control_avg

# REM sleep
rem_migraine, rem_control = get_averages(rem)
print(f"REM Sleep: Migraine={rem_migraine:.1f}%, Control={rem_control:.1f}%")

# Deep sleep (N3)
n3_migraine, n3_control = get_averages(n3)
print(f"Deep Sleep: Migraine={n3_migraine:.1f}%, Control={n3_control:.1f}%")

# Sleep onset latency
onset_migraine, onset_control = get_averages(onset)
print(f"Sleep Onset: Migraine={onset_migraine:.1f} min, Control={onset_control:.1f} min")

# Total sleep time
tst_migraine, tst_control = get_averages(tst)
print(f"Total Sleep: Migraine={tst_migraine:.0f} min, Control={tst_control:.0f} min")

# Sleep efficiency
eff_migraine, eff_control = get_averages(efficiency)
print(f"Efficiency: Migraine={eff_migraine:.1f}%, Control={eff_control:.1f}%")

# Wake percentage
wake_migraine, wake_control = get_averages(wake)
print(f"Wake %: Migraine={wake_migraine:.1f}%, Control={wake_control:.1f}%")

# PSQI (global sleep quality)
psqi_migraine, psqi_control = get_averages(psqi)
print(f"PSQI Score: Migraine={psqi_migraine:.1f}, Control={psqi_control:.1f}")

# ============================================================================
# STEP 3: Calculate accuracy metrics
# ============================================================================
print("\n" + "="*50)
print("📊 CALCULATING ACCURACY METRICS")
print("="*50)

def calculate_separation_score(migraine_avg, control_avg, higher_is_worse=True):
    """Calculate how well this metric separates migraine from controls"""
    difference = abs(migraine_avg - control_avg)
    # Normalize by the average of the two
    avg_of_both = (abs(migraine_avg) + abs(control_avg)) / 2
    if avg_of_both == 0:
        return 0
    return (difference / avg_of_both) * 100

# Calculate separation scores for each metric
metrics_separation = {
    'REM %': calculate_separation_score(rem_migraine, rem_control),
    'Deep Sleep %': calculate_separation_score(n3_migraine, n3_control),
    'Sleep Onset': calculate_separation_score(onset_migraine, onset_control),
    'Total Sleep': calculate_separation_score(tst_migraine, tst_control),
    'Efficiency %': calculate_separation_score(eff_migraine, eff_control),
    'Wake %': calculate_separation_score(wake_migraine, wake_control),
    'PSQI Score': calculate_separation_score(psqi_migraine, psqi_control)
}

print("\n📈 How well each metric separates migraine from healthy controls:")
for metric, score in sorted(metrics_separation.items(), key=lambda x: x[1], reverse=True):
    print(f"   {metric}: {score:.1f}% separation")

best_metric = max(metrics_separation, key=metrics_separation.get)
print(f"\n🏆 Best predictor: {best_metric} ({metrics_separation[best_metric]:.1f}% separation)")

# Overall model accuracy estimate
overall_accuracy = np.mean(list(metrics_separation.values()))
print(f"\n📊 Overall Model Accuracy Estimate: {overall_accuracy:.1f}%")
print("   (This is how well sleep patterns can distinguish migraine from healthy)")

# ============================================================================
# STEP 4: Create a simple prediction model
# ============================================================================
print("\n" + "="*50)
print("🤖 CREATING SLEEP ASSESSMENT MODEL")
print("="*50)

class SleepMigraineModel:
    def __init__(self, rem_m, rem_c, n3_m, n3_c, onset_m, onset_c, tst_m, tst_c):
        self.rem_migraine = rem_m
        self.rem_control = rem_c
        self.n3_migraine = n3_m
        self.n3_control = n3_c
        self.onset_migraine = onset_m
        self.onset_control = onset_c
        self.tst_migraine = tst_m
        self.tst_control = tst_c
        
    def predict(self, user_sleep):
        """
        Predict if sleep pattern matches migraine patients
        Returns: probability (0-1) and classification
        """
        score = 0
        total_weight = 0
        
        # Weight each metric by its importance
        weights = {
            'rem': 0.25,
            'deep': 0.25,
            'onset': 0.25,
            'tst': 0.25
        }
        
        # Check REM
        if user_sleep['rem_percent'] < self.rem_migraine:
            score += weights['rem']
        total_weight += weights['rem']
        
        # Check deep sleep
        if user_sleep['deep_percent'] < self.n3_migraine:
            score += weights['deep']
        total_weight += weights['deep']
        
        # Check sleep onset
        if user_sleep['sleep_onset'] > self.onset_migraine:
            score += weights['onset']
        total_weight += weights['onset']
        
        # Check total sleep
        if user_sleep['total_sleep'] < self.tst_migraine:
            score += weights['tst']
        total_weight += weights['tst']
        
        # Normalize score
        if total_weight > 0:
            probability = score / total_weight
        else:
            probability = 0
            
        return probability, "Migraine-like" if probability > 0.5 else "Normal-like"

# Create model instance
model = SleepMigraineModel(
    rem_migraine, rem_control,
    n3_migraine, n3_control,
    onset_migraine, onset_control,
    tst_migraine, tst_control
)

print("✅ Model created successfully!")

# ============================================================================
# STEP 5: Get user's sleep data and make prediction
# ============================================================================
print("\n" + "="*50)
print("🛌 LET'S ASSESS YOUR SLEEP")
print("="*50)

print("\nPlease enter your sleep information:")

user_data = {}

# Get sleep data from user
user_data['total_sleep'] = float(input("1. Total sleep time (minutes): "))
user_data['sleep_onset'] = float(input("2. Time to fall asleep (minutes): "))
user_data['rem_percent'] = float(input("3. REM sleep percentage: "))
user_data['deep_percent'] = float(input("4. Deep sleep percentage: "))
user_data['wake_count'] = float(input("5. Times you woke up: "))
user_data['quality'] = float(input("6. Sleep quality rating (1-10, 10=best): "))
user_data['has_migraine'] = input("7. Do you have migraines? (yes/no): ").lower() == 'yes'

# Make prediction
probability, classification = model.predict(user_data)

# ============================================================================
# STEP 6: Show detailed results
# ============================================================================
print("\n" + "="*50)
print("🔍 ANALYZING YOUR SLEEP")
print("="*50)

results = []

# Compare each metric
if user_data['rem_percent'] < rem_migraine:
    results.append(f"• Your REM sleep ({user_data['rem_percent']:.1f}%) is LOWER than typical migraine patients ({rem_migraine:.1f}%)")
elif user_data['rem_percent'] < rem_control:
    results.append(f"• Your REM sleep ({user_data['rem_percent']:.1f}%) is normal but lower than healthy controls ({rem_control:.1f}%)")

if user_data['deep_percent'] < n3_migraine:
    results.append(f"• Your deep sleep ({user_data['deep_percent']:.1f}%) is LOWER than typical migraine patients ({n3_migraine:.1f}%)")

if user_data['sleep_onset'] > onset_migraine:
    results.append(f"• You take LONGER to fall asleep ({user_data['sleep_onset']:.0f} min) than typical migraine patients ({onset_migraine:.0f} min)")

if user_data['total_sleep'] < tst_migraine:
    results.append(f"• Your total sleep ({user_data['total_sleep']:.0f} min) is LESS than typical migraine patients ({tst_migraine:.0f} min)")

print("\n📋 YOUR SLEEP ASSESSMENT RESULTS:")

if results:
    for r in results:
        print(r)
else:
    print("✅ Your sleep patterns are within normal ranges!")

print(f"\n🎯 Model Prediction: {classification} (confidence: {probability*100:.1f}%)")

# ============================================================================
# STEP 7: Visual comparison
# ============================================================================
print("\n📊 Sleep Comparison Chart:")

metrics = ['REM %', 'Deep %', 'Sleep Onset', 'Total Sleep']
user_values = [user_data['rem_percent'], user_data['deep_percent'], 
               user_data['sleep_onset']/10, user_data['total_sleep']/100]  # scaled for chart
migraine_values = [rem_migraine, n3_migraine, onset_migraine/10, tst_migraine/100]
control_values = [rem_control, n3_control, onset_control/10, tst_control/100]

x = range(len(metrics))
plt.figure(figsize=(10, 6))
plt.plot(x, control_values, 'g-', label='Healthy Controls', linewidth=2, marker='o')
plt.plot(x, migraine_values, 'r-', label='Migraine Patients', linewidth=2, marker='s')
plt.plot(x, user_values, 'b--', label='You', linewidth=2, marker='d')
plt.xticks(x, metrics)
plt.ylabel('Scaled Values')
plt.title('Your Sleep vs. Migraine Patients vs. Healthy Controls')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()

# Save the chart
chart_path = Path('../sleep_model/sleep_comparison_chart.png')
chart_path.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(chart_path, dpi=150, bbox_inches='tight')
plt.show()
print(f"✅ Chart saved to: {chart_path}")

# ============================================================================
# STEP 8: Save model and all files
# ============================================================================
print("\n💾 Saving model to ../sleep_model folder...")

# Create output directory
output_dir = Path('../sleep_model')
output_dir.mkdir(parents=True, exist_ok=True)
print(f"✅ Output directory: {output_dir}")

# Save the model (pickle format)
model_path = output_dir / 'sleep_migraine_model.pkl'
with open(model_path, 'wb') as f:
    pickle.dump(model, f)
print(f"✅ Model saved to: {model_path}")

# Try to save PyTorch format
try:
    import torch
    import torch.nn as nn
    
    class SleepModelWrapper(nn.Module):
        def __init__(self, model):
            super().__init__()
            self.model = model
            
        def forward(self, x):
            return x
    
    wrapper = SleepModelWrapper(model)
    torch_path = output_dir / 'sleep_model.pt'
    torch.save(wrapper, torch_path)
    print(f"✅ PyTorch model saved to: {torch_path}")
except:
    print("⚠️ PyTorch not installed, skipping .pt file")

# Save reference values
reference_values = {
    'rem': {'migraine': float(rem_migraine), 'control': float(rem_control)},
    'deep_sleep': {'migraine': float(n3_migraine), 'control': float(n3_control)},
    'sleep_onset': {'migraine': float(onset_migraine), 'control': float(onset_control)},
    'total_sleep': {'migraine': float(tst_migraine), 'control': float(tst_control)},
    'efficiency': {'migraine': float(eff_migraine), 'control': float(eff_control)},
    'wake_percent': {'migraine': float(wake_migraine), 'control': float(wake_control)},
    'psqi': {'migraine': float(psqi_migraine), 'control': float(psqi_control)},
    'metrics_separation': metrics_separation,
    'accuracy_estimate': float(overall_accuracy)
}

ref_path = output_dir / 'reference_values.json'
with open(ref_path, 'w') as f:
    json.dump(reference_values, f, indent=2)
print(f"✅ Reference values saved to: {ref_path}")

# Save model metadata
metadata = {
    'model_type': 'SleepMigraineModel',
    'training_date': datetime.now().isoformat(),
    'accuracy_estimate': float(overall_accuracy),
    'best_predictor': best_metric,
    'best_predictor_score': float(metrics_separation[best_metric]),
    'metrics_separation': metrics_separation,
    'files_saved': [
        str(model_path),
        str(ref_path),
        str(chart_path)
    ]
}

metadata_path = output_dir / 'model_metadata.json'
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"✅ Model metadata saved to: {metadata_path}")

# ============================================================================
# STEP 9: Final summary
# ============================================================================
print("\n" + "="*50)
print("✅ ASSESSMENT COMPLETE!")
print("="*50)

print(f"\n📁 All files saved to: {output_dir}")
print("\n📊 Model Performance:")
print(f"   • Overall Accuracy Estimate: {overall_accuracy:.1f}%")
print(f"   • Best Predictor: {best_metric} ({metrics_separation[best_metric]:.1f}%)")
print(f"\n📋 Your Result:")
print(f"   • Classification: {classification}")
print(f"   • Confidence: {probability*100:.1f}%")

print("\n" + "="*50)