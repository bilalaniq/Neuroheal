"""
MigraineService — loads and runs all 3 migraine models:
  1. Symptom Classification  (RandomForest, sklearn)  → migraine type
  2. Trigger Prediction      (LogisticRegression, sklearn) → migraine yes/no today
  3. Sleep Assessment        (rule-based stats)        → sleep risk pattern
"""

import logging
import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, date

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Feature column names — must match training scripts exactly
# ─────────────────────────────────────────────────────────────────────────────

TRIGGER_FEATURE_COLS = [
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
    "Hot and humid weather",
    "Prev_day_migraine",
    "Weekend",
]

SYMPTOM_FEATURE_COLS = [
    'Age', 'Duration', 'Frequency', 'Location', 'Character', 'Intensity',
    'Nausea', 'Vomit', 'Phonophobia', 'Photophobia', 'Visual', 'Sensory',
    'Dysphasia', 'Dysarthria', 'Vertigo', 'Tinnitus', 'Hypoacusis',
    'Diplopia', 'Defect', 'Conscience', 'Paresthesia', 'DPF',
]


# ─────────────────────────────────────────────────────────────────────────────
# Service class
# ─────────────────────────────────────────────────────────────────────────────

class MigraineService:
    """
    Loads all 3 models once at startup and exposes predict_* methods.
    All models live in directories relative to the project root:
      ../migraine_symptom_classification/complete_package.pkl
      ../migraine_data/migraine_model_clean.pkl
      ../sleep_model/reference_values.json
    """

    def __init__(self, base_dir: Path = None):
        if base_dir is None:
            # artifacts/ lives in the same folder as main.py (backend/)
            base_dir = Path(__file__).resolve().parent / "artifacts"
        self.base_dir = base_dir

        self.symptom_model = None
        self.symptom_scaler = None
        self.symptom_label_encoder = None
        self.symptom_feature_cols = None

        self.trigger_model = None
        self.trigger_scaler = None
        self.trigger_feature_cols = None

        self.sleep_reference = None

        self._load_models()

    # ── Loaders ──────────────────────────────────────────────────────────────

    def _load_models(self):
        self._load_symptom_model()
        self._load_trigger_model()
        self._load_sleep_reference()

    def _load_symptom_model(self):
        """Load migraine type classification model (RandomForest)."""
        path = self.base_dir / "symptom_class_model.pkl"
        if not path.exists():
            logger.warning(f"⚠ Symptom model not found at {path}. Expected: artifacts/symptom_class_model.pkl")
            return
        try:
            with open(path, "rb") as f:
                pkg = pickle.load(f)
            self.symptom_model = pkg["model"]
            self.symptom_scaler = pkg["scaler"]
            self.symptom_label_encoder = pkg["label_encoder"]
            self.symptom_feature_cols = pkg["feature_columns"]
            logger.info(f"✓ Symptom classification model loaded (accuracy: {pkg.get('accuracy', '?'):.2%})")
        except Exception as e:
            logger.error(f"✗ Failed to load symptom model: {e}")

    def _load_trigger_model(self):
        """Load migraine occurrence prediction model (LogisticRegression)."""
        path = self.base_dir / "migraine_model.pkl"
        if not path.exists():
            logger.warning(f"⚠ Trigger model not found at {path}. Expected: artifacts/migraine_model.pkl")
            return
        try:
            with open(path, "rb") as f:
                pkg = pickle.load(f)
            self.trigger_model = pkg["model"]
            self.trigger_scaler = pkg["scaler"]
            self.trigger_feature_cols = pkg["feature_columns"]
            logger.info(f"✓ Trigger prediction model loaded (accuracy: {pkg.get('test_accuracy', '?'):.2%})")
        except Exception as e:
            logger.error(f"✗ Failed to load trigger model: {e}")

    def _load_sleep_reference(self):
        """Load reference values for sleep assessment (research averages)."""
        path = self.base_dir / "sleep_reference_values.json"
        if not path.exists():
            logger.warning(f"⚠ Sleep reference not found at {path}. Expected: artifacts/sleep_reference_values.json")
            return
        try:
            with open(path, "r") as f:
                self.sleep_reference = json.load(f)
            logger.info("✓ Sleep reference values loaded")
        except Exception as e:
            logger.error(f"✗ Failed to load sleep reference: {e}")

    @property
    def is_ready(self) -> dict:
        return {
            "symptom_model": self.symptom_model is not None,
            "trigger_model": self.trigger_model is not None,
            "sleep_reference": self.sleep_reference is not None,
        }

    # ── Model 1: Symptom Classification ──────────────────────────────────────

    def predict_migraine_type(self, features: dict) -> dict:
        """
        Classify migraine type from symptom features.
        features: dict with keys matching SYMPTOM_FEATURE_COLS (case-sensitive)
        Returns: { prediction, confidence, all_probabilities, timestamp }
        """
        if self.symptom_model is None:
            raise RuntimeError("Symptom classification model not loaded.")

        # Build feature vector in correct column order
        cols = self.symptom_feature_cols
        x = np.zeros((1, len(cols)))
        for i, col in enumerate(cols):
            if col in features:
                x[0, i] = features[col]

        x_scaled = self.symptom_scaler.transform(x)
        pred_idx = self.symptom_model.predict(x_scaled)[0]
        proba = self.symptom_model.predict_proba(x_scaled)[0]

        class_names = self.symptom_label_encoder.classes_
        all_probs = {name: round(float(proba[i]), 4) for i, name in enumerate(class_names)}

        return {
            "prediction": str(self.symptom_label_encoder.inverse_transform([pred_idx])[0]),
            "confidence": round(float(max(proba)), 4),
            "all_probabilities": all_probs,
            "timestamp": datetime.now().isoformat(),
        }

    # ── Model 2: Daily Trigger Prediction ────────────────────────────────────

    def predict_migraine_today(self, trigger_data: dict, today: date = None) -> dict:
        """
        Predict if a migraine will occur today based on trigger exposure.
        trigger_data: dict with UI field names (snake_case, from MigraineTriggerRequest)
        Returns: { migraine_predicted, risk_level, probability, top_triggers, recommendation, timestamp }
        """
        if self.trigger_model is None:
            raise RuntimeError("Trigger prediction model not loaded.")

        if today is None:
            today = date.today()

        # Map UI snake_case names → training CSV column names
        name_map = {
            "cold_air_exposure": "Cold air exposure",
            "nightshade_vegetables": "Nightshade vegetables (tomatoes, eggplants, potatoes, peppers)",
            "perfume_or_strong_odors": "Perfume or strong odors",
            "physical_exertion": "Physical exertion",
            "overslept": "Overslept",
            "lack_of_sleep": "Lack of sleep",
            "post_stress_letdown": "Post-stress letdown",
            "stress": "Stress",
            "missed_a_meal": "Missed a meal",
            "smoked_or_cured_meat": "Smoked or cured meat (e.g., hot dogs)",
            "bananas": "Bananas",
            "caffeine": "Caffeine",
            "citrus_fruit_or_juice": "Citrus fruit or juice",
            "beer": "Beer",
            "aged_or_blue_cheese": "Aged or blue cheese",
            "chocolate": "Chocolate",
            "red_wine": "Red wine",
            "bright_or_flashing_lights": "Bright or flashing Lights",
            "liquor_or_spirits": "Liquor or spirits",
            "loud_sounds": "Loud sounds",
            "sugar_and_sweets": "Sugar and Sweets",
            "dehydration": "Dehydration",
            "changing_weather": "Changing weather",
            "hot_and_humid_weather": "Hot and humid weather",
            "prev_day_migraine": "Prev_day_migraine",
        }

        # Auto-calculate weekend if not provided
        is_weekend = trigger_data.get("is_weekend")
        if is_weekend is None:
            is_weekend = 1 if today.weekday() in [5, 6] else 0

        # Build sample row
        cols = self.trigger_feature_cols
        sample = pd.DataFrame(0, index=[0], columns=cols)

        for ui_key, csv_col in name_map.items():
            if csv_col in sample.columns and ui_key in trigger_data:
                sample[csv_col] = trigger_data[ui_key]

        if "Weekend" in sample.columns:
            sample["Weekend"] = is_weekend

        # Scale and predict
        x_scaled = self.trigger_scaler.transform(sample[cols])
        pred = int(self.trigger_model.predict(x_scaled)[0])
        proba = self.trigger_model.predict_proba(x_scaled)[0]
        migraine_prob = float(proba[1])

        # Find top contributing triggers
        top_triggers = self._get_top_triggers(sample, cols)

        # Risk level
        if migraine_prob >= 0.7:
            risk_level = "HIGH"
            recommendation = "High migraine risk today. Stay hydrated, avoid bright lights, take your preventive medication if prescribed."
        elif migraine_prob >= 0.4:
            risk_level = "MEDIUM"
            recommendation = "Moderate risk. Reduce identified triggers if possible and monitor for early symptoms."
        else:
            risk_level = "LOW"
            recommendation = "Low risk today. Keep up good habits — stay hydrated and maintain regular sleep."

        return {
            "migraine_predicted": pred == 1,
            "risk_level": risk_level,
            "probability": round(migraine_prob, 4),
            "top_triggers": top_triggers,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat(),
        }

    def _get_top_triggers(self, sample: pd.DataFrame, cols: list, top_n: int = 5) -> list:
        """Return the top N trigger names that contributed most to the prediction."""
        contributions = []
        coef = self.trigger_model.coef_[0]
        scale = self.trigger_scaler.scale_

        for i, col in enumerate(cols):
            val = float(sample[col].values[0])
            if val > 0:
                contrib = coef[i] * scale[i] * val
                if contrib > 0:
                    contributions.append((col, contrib))

        contributions.sort(key=lambda x: x[1], reverse=True)
        return [c[0] for c in contributions[:top_n]]

    # ── Model 3: Sleep Assessment ─────────────────────────────────────────────

    def assess_sleep(self, sleep_data: dict) -> dict:
        """
        Assess whether sleep pattern resembles migraine patients.
        sleep_data: dict from SleepAssessmentRequest
        Returns: { classification, risk_score, metrics_comparison, warnings, recommendation, timestamp }
        """
        if self.sleep_reference is None:
            raise RuntimeError("Sleep reference values not loaded.")

        ref = self.sleep_reference
        warnings = []
        score = 0
        total = 0

        # ── REM sleep ──
        rem_user = sleep_data.get("rem_percent")
        if rem_user is not None:
            rem_m = ref["rem"]["migraine"]
            rem_c = ref["rem"]["control"]
            if rem_user < rem_m:
                score += 1
                warnings.append(f"Low REM sleep ({rem_user:.1f}%) — below migraine patient average ({rem_m:.1f}%)")
            total += 1

        # ── Deep sleep ──
        deep_user = sleep_data.get("deep_sleep_percent")
        if deep_user is not None:
            deep_m = ref["deep_sleep"]["migraine"]
            deep_c = ref["deep_sleep"]["control"]
            if deep_user < deep_m:
                score += 1
                warnings.append(f"Low deep sleep ({deep_user:.1f}%) — below migraine average ({deep_m:.1f}%)")
            total += 1

        # ── Sleep onset latency ──
        onset_user = sleep_data.get("sleep_onset_minutes")
        if onset_user is not None:
            onset_m = ref["sleep_onset"]["migraine"]
            onset_c = ref["sleep_onset"]["control"]
            if onset_user > onset_m:
                score += 1
                warnings.append(f"Long sleep onset ({onset_user:.0f} min) — longer than migraine average ({onset_m:.0f} min)")
            total += 1

        # ── Total sleep time ──
        tst_user = sleep_data.get("total_sleep_minutes")
        if tst_user is not None:
            tst_m = ref["total_sleep"]["migraine"]
            tst_c = ref["total_sleep"]["control"]
            if tst_user < tst_m:
                score += 1
                warnings.append(f"Short total sleep ({tst_user:.0f} min) — less than migraine average ({tst_m:.0f} min)")
            total += 1

        # ── Sleep efficiency (optional) ──
        eff_user = sleep_data.get("sleep_efficiency")
        if eff_user is not None:
            eff_m = ref["efficiency"]["migraine"]
            eff_c = ref["efficiency"]["control"]
            if eff_user < eff_m:
                score += 1
                warnings.append(f"Low sleep efficiency ({eff_user:.1f}%) — below migraine average ({eff_m:.1f}%)")
            total += 1

        # ── PSQI score (optional) ──
        psqi_user = sleep_data.get("psqi_score")
        if psqi_user is not None:
            psqi_m = ref["psqi"]["migraine"]
            psqi_c = ref["psqi"]["control"]
            if psqi_user > psqi_m:
                score += 1
                warnings.append(f"Poor PSQI score ({psqi_user:.1f}) — worse than migraine average ({psqi_m:.1f})")
            total += 1

        risk_score = round(score / total, 4) if total > 0 else 0.0
        classification = "Migraine-like" if risk_score > 0.5 else "Normal-like"

        # Build comparison table
        metrics_comparison = {}
        if rem_user is not None:
            metrics_comparison["rem_percent"] = {
                "yours": rem_user,
                "migraine_avg": ref["rem"]["migraine"],
                "healthy_avg": ref["rem"]["control"],
            }
        if deep_user is not None:
            metrics_comparison["deep_sleep_percent"] = {
                "yours": deep_user,
                "migraine_avg": ref["deep_sleep"]["migraine"],
                "healthy_avg": ref["deep_sleep"]["control"],
            }
        if onset_user is not None:
            metrics_comparison["sleep_onset_minutes"] = {
                "yours": onset_user,
                "migraine_avg": ref["sleep_onset"]["migraine"],
                "healthy_avg": ref["sleep_onset"]["control"],
            }
        if tst_user is not None:
            metrics_comparison["total_sleep_minutes"] = {
                "yours": tst_user,
                "migraine_avg": ref["total_sleep"]["migraine"],
                "healthy_avg": ref["total_sleep"]["control"],
            }

        if classification == "Migraine-like":
            recommendation = "Your sleep closely resembles migraine patients. Improving sleep hygiene may reduce migraine frequency."
        else:
            recommendation = "Your sleep looks healthy. Keep your sleep schedule consistent for best results."

        return {
            "classification": classification,
            "risk_score": risk_score,
            "metrics_comparison": metrics_comparison,
            "warnings": warnings,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat(),
        }

    # ── Combined assessment ───────────────────────────────────────────────────

    def full_assessment(
        self,
        symptom_data: dict = None,
        trigger_data: dict = None,
        sleep_data: dict = None,
    ) -> dict:
        """Run all available models and return combined risk."""
        results = {}

        if symptom_data:
            results["symptom_classification"] = self.predict_migraine_type(symptom_data)

        if trigger_data:
            results["migraine_prediction"] = self.predict_migraine_today(trigger_data)

        if sleep_data:
            results["sleep_assessment"] = self.assess_sleep(sleep_data)

        # Combine risk signals
        risk_scores = []
        if "migraine_prediction" in results:
            risk_scores.append(results["migraine_prediction"]["probability"])
        if "sleep_assessment" in results:
            risk_scores.append(results["sleep_assessment"]["risk_score"])

        if risk_scores:
            avg = sum(risk_scores) / len(risk_scores)
            overall = "HIGH" if avg >= 0.65 else "MEDIUM" if avg >= 0.35 else "LOW"
        else:
            overall = "UNKNOWN"

        results["overall_risk"] = overall
        results["timestamp"] = datetime.now().isoformat()
        return results