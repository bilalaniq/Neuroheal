# 🎓 HOW TO TRAIN THE MODEL

## 🚀 Quick Start - Train Now!

### **Option 1: Complete Training** (Recommended)
```bash
cd d:\breeha
python3 train_complete.py
```

**What it does:**
- ✅ Loads `data/augmented_dataset.csv`
- ✅ Splits into train (70%) / validation (10%) / test (20%)
- ✅ Trains for up to 50 epochs with early stopping
- ✅ Saves best model to `backend/artifacts/model.pt`
- ✅ Shows accuracy, precision, recall, F1-score
- ✅ Ready to use immediately

**Time:** ~2-5 minutes

---

### **Option 2: Train from Existing Cloud Script** (Original)
```bash
cd d:\breeha\cloud
python3 train.py
```

Note: Requires Google Cloud dependencies (might have errors locally)

---

### **Option 3: Train with Your Feedback**
After collecting user feedback from API:

```bash
cd d:\breeha
python3 retrain_from_feedback.py
```

Shows how your API feedback improves the model.

---

## 📊 What Gets Trained

**Input:** 23 features
```
Age, Duration, Frequency, Location, Character, Intensity,
Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory,
Dysphasia, Dysarthria, Vertigo, Tinnitus, Hypoacusis,
Diplopia, Defect, Ataxia, Conscience, Paresthesia, DPF
```

**Output:** 8 migraine classes
```
1. No migraine
2. Migraine without aura
3. Migraine with aura
4. Typical aura with migraine
5. Typical aura without migraine
6. Familial hemiplegic migraine
7. Basilar-type aura
8. Other
```

---

## ⚙️ Customize Training

Edit **train_complete.py**:

```python
# Lines 18-36 - CONFIGURATION SECTION

# Dataset location
DATASET_PATH = Path("data/augmented_dataset.csv")

# Training parameters
EPOCHS = 50                    # Max training iterations
BATCH_SIZE = 32               # Samples per batch
LEARNING_RATE = 0.001         # How fast model learns
TEST_SIZE = 0.2               # 20% for testing
VALIDATION_SPLIT = 0.1        # 10% for validation

# Model architecture
HIDDEN_DIMS = [64, 32]        # Neural network layers
DROPOUT_RATE = 0.3            # Prevent overfitting
```

Then run:
```bash
python3 train_complete.py
```

---

## 📈 Training Output Example

```
Loading data...
✓ Loaded 150 samples
✓ Classes: 8
  0: No migraine
  1: Migraine without aura
  ... etc

Preparing datasets...
Training set: 105 samples (70.0%)
Validation set: 15 samples (10.0%)
Test set: 30 samples (20.0%)

Training model...
Epoch   1 | Train Loss: 2.1234 | Val Loss: 2.0123 | Val Acc: 0.2000
Epoch   5 | Train Loss: 1.2345 | Val Loss: 1.1234 | Val Acc: 0.4667
Epoch  10 | Train Loss: 0.8123 | Val Loss: 0.9345 | Val Acc: 0.5333
✓ Early stopping at epoch 24

Test Results:
  Accuracy: 0.5667 (56.67%)

Per-Class Performance:
Class                           Precision    Recall       F1-Score    
No migraine                     0.7500       0.6000       0.6667
Migraine without aura           0.4286       0.6000       0.5000
... etc

Saving artifacts...
✓ Model saved to: backend/artifacts/model.pt
✓ Scaler saved to: backend/artifacts/scaler.pkl
✓ Encoder saved to: backend/artifacts/label_encoder.pkl

✅ TRAINING COMPLETE!
```

---

## 🔄 Workflow After Training

```
1. Train model
   python3 train_complete.py
   ↓
2. New model saved to backend/artifacts/model.pt
   ↓
3. Restart API to use new model
   Ctrl+C in backend terminal
   cd backend && python3 -m uvicorn main_local:app --reload --port 8080
   ↓
4. Test new model
   python3 test_api_calls.py
   ↓
5. Deploy (save model, share artifacts)
```

---

## 📊 Improving Model Performance

### Current Dataset Issues:
- ❌ Only 150 samples (need 1000+)
- ❌ Biased toward certain migraine types
- ❌ Missing "No migraine" cases
- ❌ Imbalanced classes

### How to Fix:
1. **Collect More Data**
   - Get 1000+ labeled samples
   - Balance classes equally
   - Add diverse patient demographics

2. **Use API Feedback**
   ```bash
   # Collect 30+ user corrections
   # Then retrain:
   python3 retrain_from_feedback.py
   ```

3. **Improve Data Quality**
   - Remove duplicates
   - Handle missing values
   - Feature engineering

4. **Try Different Models**
   - XGBoost (better for small data)
   - Random Forest (robust)
   - Ensemble methods

---

## 🎯 Training Modes

| Mode              | Command                            | Use When            | Time     |
| ----------------- | ---------------------------------- | ------------------- | -------- |
| **Quick**         | `python3 train_complete.py`        | Testing locally     | 2-5 min  |
| **Production**    | Customize + `train_complete.py`    | Have good data      | 5-30 min |
| **Fine-tune**     | Edit `LEARNING_RATE`, `EPOCHS`     | Improving existing  | 2-5 min  |
| **From Feedback** | `python3 retrain_from_feedback.py` | Few API corrections | 1 min    |

---

## 📝 Training Tips

✅ **Best Practices:**
- Train on balanced dataset
- Use validation set to prevent overfitting
- Monitor train/val loss - should both decrease
- Early stopping prevents overtraining
- Save best model, not last model

❌ **Avoid:**
- Training on test data (cheating)
- Too few epochs (underfitting)
- Too many epochs (overfitting)
- Forgetting to scale features
- Using imbalanced classes

---

## 🧪 Verify Training Worked

After training:

```bash
# 1. Test model directly
cd backend
python3 test_model.py

# 2. Test via API
python3 test_api_calls.py

# 3. Check saved files exist
ls backend/artifacts/
# Should show: model.pt, scaler.pkl, label_encoder.pkl
```

---

## ❓ FAQ

**Q: How long does training take?**
A: 2-5 minutes for current dataset (150 samples)

**Q: Can I interrupt training?**
A: Yes (Ctrl+C), best model is auto-saved

**Q: What if training fails?**
A: Check dataset path, ensure pandas/torch installed

**Q: How do I use the trained model?**
A: Restart API, it auto-loads `backend/artifacts/model.pt`

**Q: Can I train on my own data?**
A: Yes! Replace `data/augmented_dataset.csv` with your CSV

---

## 🚀 Ready? Start Training!

```bash
cd d:\breeha
python3 train_complete.py
```

Then restart the API to use the new model! 🎉
