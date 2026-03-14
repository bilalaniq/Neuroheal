"""
FastAPI backend — Google Fit health data + Migraine ML models.
"""

import logging
import json
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from google_fit_service import GoogleFitService
from migraine_service import MigraineService
from schemas import (
    MigraineFeatures,
    PredictionResponse,
    MigraineTriggerRequest,
    MigrainePredictionResponse,
    SleepAssessmentRequest,
    SleepAssessmentResponse,
    FullMigraineAssessmentRequest,
    FullMigraineAssessmentResponse,
    UpdateRequest,
    UpdateResponse,
    MigraineEpisodeLog,
    MigraineEpisodeResponse,
    MigraineEpisodeUpdate,        # ← NEW
    HealthResponse,
    StepsResponse,
    SleepResponse,
    HeartRateResponse,
    BloodPressureResponse,
    WeightResponse,
    AllHealthDataResponse,
    CaloriesResponse,
    DistanceResponse,
    ActiveMinutesResponse,
    MoveMinutesResponse,
    SpeedResponse,
    HydrationResponse,
    NutritionResponse,
    OxygenSaturationResponse,
    BodyTemperatureResponse,
    HeightResponse,
    PowerResponse,
    FullHealthDataResponse,
)
from config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Migraine Classifier API",
    description="Health data API with Google Fit integration + 3 migraine ML models",
    version="2.0.0"
)

# ── Migraine logs file ───────────────────────────────────────────────────────
MIGRAINE_LOGS_FILE = Path("migraine_logs.json")

def load_migraine_logs():
    if MIGRAINE_LOGS_FILE.exists():
        with MIGRAINE_LOGS_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_migraine_logs(logs):
    with MIGRAINE_LOGS_FILE.open("w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global service instances ─────────────────────────────────────────────────
google_fit_service: GoogleFitService = None
migraine_service: MigraineService = None


@app.on_event("startup")
async def startup_event():
    global google_fit_service, migraine_service

    logger.info("=" * 60)
    logger.info("STARTING MIGRAINE CLASSIFIER API v2.0")
    logger.info("=" * 60)

    try:
        migraine_service = MigraineService()
        logger.info(f"✓ Migraine models loaded: {migraine_service.is_ready}")
    except Exception as e:
        logger.warning(f"⚠ Migraine service init failed: {e}")

    if settings.USE_GOOGLE_FIT:
        try:
            google_fit_service = GoogleFitService(
                credentials_file=settings.GOOGLE_FIT_CREDENTIALS_FILE,
                token_file=settings.GOOGLE_FIT_TOKEN_FILE,
            )
            logger.info("✓ Google Fit Service initialized")
        except Exception as e:
            logger.warning(f"⚠ Google Fit init failed: {e}")
    else:
        logger.warning("⚠ Google Fit disabled in config")

    logger.info("✓ API READY")
    logger.info("=" * 60)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    model_loaded = migraine_service is not None and any(migraine_service.is_ready.values())
    return HealthResponse(status="healthy", model_loaded=model_loaded, version="2.0.0")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    model_loaded = migraine_service is not None and any(migraine_service.is_ready.values())
    return HealthResponse(status="healthy", model_loaded=model_loaded, version="2.0.0")


@app.get("/models/status")
async def model_status():
    if migraine_service is None:
        return {"status": "not_loaded", "models": {}}
    return {"status": "ok", "models": migraine_service.is_ready}


# ============================================================================
# EPISODE LOGGING
#
#  POST   /migraine-episodes              — log a new episode
#                                           → 409 if already logged today (with existing log in body)
#  GET    /migraine-episodes/history      — get all episodes for a user (feeds calendar)
#  PUT    /migraine-episodes/{episode_id} — update / edit an existing episode
# ============================================================================

@app.post("/migraine-episodes")
async def log_migraine_episode(episode: MigraineEpisodeLog):
    """
    Log a new migraine episode.

    Returns 409 if the user already has a log for today, so the frontend
    can offer them the option to edit the existing entry instead.
    The 409 body contains the existing log under the key `existing_log`.
    """
    try:
        logs = load_migraine_logs()
        today = datetime.utcnow().date().isoformat()

        # Find any existing log for this user today
        existing_today = [
            log for log in logs
            if log["user_id"] == episode.user_id
            and log.get("timestamp", "").startswith(today)
        ]

        if existing_today:
            # Return 409 with the existing log so the frontend can pre-fill the edit form
            existing = existing_today[-1]   # most recent one today
            return JSONResponse(
                status_code=409,
                content={
                    "status": "duplicate",
                    "message": f"You already logged a migraine episode today ({today}). Would you like to edit it instead?",
                    "existing_log": existing,   # full log dict including episode_id
                }
            )

        # Build and persist new log entry
        log_entry = episode.dict()
        log_entry["episode_id"] = f"ep_{int(datetime.utcnow().timestamp())}_{episode.user_id}"
        logs.append(log_entry)
        save_migraine_logs(logs)

        logger.info(
            f"Logged migraine episode for user {episode.user_id}: "
            f"intensity={episode.intensity}, symptoms={episode.symptoms}"
        )

        return {
            "status": "success",
            "message": "Migraine episode logged successfully",
            "episode_id": log_entry["episode_id"],
            "timestamp": log_entry["timestamp"],
        }

    except Exception as e:
        logger.error(f"Error in POST /migraine-episodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/migraine-episodes/{episode_id}")
async def update_migraine_episode(episode_id: str, update: MigraineEpisodeUpdate):
    """
    Edit an existing migraine episode.

    Finds the record by episode_id, merges the updated fields, and saves.
    Only fields included in the request body are updated (partial update).
    """
    try:
        logs = load_migraine_logs()

        # Find the log to update
        idx = next(
            (i for i, log in enumerate(logs) if log.get("episode_id") == episode_id),
            None
        )

        if idx is None:
            raise HTTPException(
                status_code=404,
                detail=f"Episode '{episode_id}' not found."
            )

        existing = logs[idx]

        # Merge — only overwrite fields that were explicitly sent (exclude_unset)
        updated_fields = update.dict(exclude_unset=True)
        existing.update(updated_fields)

        # Record that this was edited and when
        existing["last_edited"] = datetime.utcnow().isoformat()

        logs[idx] = existing
        save_migraine_logs(logs)

        logger.info(
            f"Updated migraine episode {episode_id} for user {existing.get('user_id')}: "
            f"fields changed={list(updated_fields.keys())}"
        )

        return {
            "status": "success",
            "message": "Migraine episode updated successfully",
            "episode_id": episode_id,
            "timestamp": existing["last_edited"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in PUT /migraine-episodes/{episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/migraine-episodes/history")
async def get_migraine_history(user_id: str = Query(...)):
    """
    Retrieve all logged migraine episodes for a user.
    Used by the calendar on the home screen to show migraine days.
    """
    try:
        logs = load_migraine_logs()
        user_logs = [log for log in logs if log["user_id"] == user_id]
        return {"logs": user_logs}
    except Exception as e:
        logger.error(f"Error in /migraine-episodes/history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL 1 — MIGRAINE TYPE CLASSIFICATION
# POST /predict/symptom-type
# ============================================================================

@app.post("/predict/symptom-type", response_model=PredictionResponse)
async def predict_symptom_type(features: MigraineFeatures):
    """Classify the type of migraine based on symptoms."""
    if migraine_service is None or not migraine_service.is_ready["symptom_model"]:
        raise HTTPException(status_code=503, detail="Symptom classification model not loaded.")

    try:
        feature_dict = {
            "Age": features.age,
            "Duration": features.duration,
            "Frequency": features.frequency,
            "Location": features.location,
            "Character": features.character,
            "Intensity": features.intensity,
            "Nausea": features.nausea,
            "Vomit": features.vomit,
            "Phonophobia": features.phonophobia,
            "Photophobia": features.photophobia,
            "Visual": features.visual,
            "Sensory": features.sensory,
            "Dysphasia": features.dysphasia,
            "Dysarthria": features.dysarthria,
            "Vertigo": features.vertigo,
            "Tinnitus": features.tinnitus,
            "Hypoacusis": features.hypoacusis,
            "Diplopia": features.diplopia,
            "Defect": features.defect,
            "Ataxia": features.ataxia,
            "Conscience": features.conscience,
            "Paresthesia": features.paresthesia,
            "DPF": features.dpf,
        }
        result = migraine_service.predict_migraine_type(feature_dict)
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Error in /predict/symptom-type: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL 2 — DAILY MIGRAINE OCCURRENCE PREDICTION
# POST /predict/migraine-today
# ============================================================================

@app.post("/predict/migraine-today", response_model=MigrainePredictionResponse)
async def predict_migraine_today(triggers: MigraineTriggerRequest):
    """Predict if a migraine is likely today based on trigger exposure."""
    if migraine_service is None or not migraine_service.is_ready["trigger_model"]:
        raise HTTPException(status_code=503, detail="Trigger prediction model not loaded.")

    try:
        trigger_dict = triggers.dict()
        result = migraine_service.predict_migraine_today(trigger_dict)
        return MigrainePredictionResponse(**result)
    except Exception as e:
        logger.error(f"Error in /predict/migraine-today: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL 3 — SLEEP RISK ASSESSMENT
# POST /predict/sleep
# ============================================================================

@app.post("/predict/sleep", response_model=SleepAssessmentResponse)
async def assess_sleep(sleep_data: SleepAssessmentRequest):
    """Assess whether sleep pattern resembles migraine patients."""
    if migraine_service is None or not migraine_service.is_ready["sleep_reference"]:
        raise HTTPException(status_code=503, detail="Sleep reference values not loaded.")

    try:
        sleep_dict = sleep_data.dict()
        result = migraine_service.assess_sleep(sleep_dict)
        return SleepAssessmentResponse(**result)
    except Exception as e:
        logger.error(f"Error in /predict/sleep: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# COMBINED — ALL 3 MODELS IN ONE CALL
# POST /predict/full
# ============================================================================

@app.post("/predict/full", response_model=FullMigraineAssessmentResponse)
async def full_assessment(request: FullMigraineAssessmentRequest):
    """Run all available models in a single request."""
    if migraine_service is None:
        raise HTTPException(status_code=503, detail="Migraine service not initialized.")

    try:
        symptom_dict = None
        if request.symptom_data:
            f = request.symptom_data
            symptom_dict = {
                "Age": f.age, "Duration": f.duration, "Frequency": f.frequency,
                "Location": f.location, "Character": f.character, "Intensity": f.intensity,
                "Nausea": f.nausea, "Vomit": f.vomit, "Phonophobia": f.phonophobia,
                "Photophobia": f.photophobia, "Visual": f.visual, "Sensory": f.sensory,
                "Dysphasia": f.dysphasia, "Dysarthria": f.dysarthria, "Vertigo": f.vertigo,
                "Tinnitus": f.tinnitus, "Hypoacusis": f.hypoacusis, "Diplopia": f.diplopia,
                "Defect": f.defect, "Ataxia": f.ataxia, "Conscience": f.conscience,
                "Paresthesia": f.paresthesia, "DPF": f.dpf,
            }

        trigger_dict = request.trigger_data.dict() if request.trigger_data else None
        sleep_dict = request.sleep_data.dict() if request.sleep_data else None

        result = migraine_service.full_assessment(symptom_dict, trigger_dict, sleep_dict)

        return FullMigraineAssessmentResponse(
            symptom_classification=result.get("symptom_classification"),
            migraine_prediction=result.get("migraine_prediction"),
            sleep_assessment=result.get("sleep_assessment"),
            overall_risk=result["overall_risk"],
            timestamp=result["timestamp"],
        )
    except Exception as e:
        logger.error(f"Error in /predict/full: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AUTO SLEEP FROM GOOGLE FIT → SLEEP ASSESSMENT
# GET /predict/sleep-from-fit
# ============================================================================

@app.get("/predict/sleep-from-fit")
async def sleep_assessment_from_fit(days: int = 1):
    """Pull last night's sleep from Google Fit and run the sleep assessment."""
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit not configured.")
    if migraine_service is None or not migraine_service.is_ready["sleep_reference"]:
        raise HTTPException(status_code=503, detail="Sleep model not loaded.")

    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        fit_sleep = google_fit_service.get_sleep(start_date, end_date, days)

        if not fit_sleep.get("sleep_records"):
            raise HTTPException(status_code=404, detail="No sleep data found in Google Fit.")

        records = fit_sleep["sleep_records"]
        total_minutes = fit_sleep.get("total_sleep_minutes", 0)

        stage_minutes = {"REM sleep": 0, "Deep sleep": 0, "Light sleep": 0, "Awake": 0}
        for rec in records:
            stage = rec.get("stage", "")
            dur = rec.get("duration_minutes", 0)
            if stage in stage_minutes:
                stage_minutes[stage] += dur

        total_recorded = sum(stage_minutes.values()) or 1

        sleep_input = {
            "total_sleep_minutes": total_minutes,
            "sleep_onset_minutes": None,
            "rem_percent": round(stage_minutes["REM sleep"] / total_recorded * 100, 1),
            "deep_sleep_percent": round(stage_minutes["Deep sleep"] / total_recorded * 100, 1),
            "wake_percent": round(stage_minutes["Awake"] / total_recorded * 100, 1),
        }

        assessment = migraine_service.assess_sleep(sleep_input)

        return {
            "status": "success",
            "google_fit_summary": {
                "total_sleep_hours": fit_sleep.get("total_sleep_hours"),
                "nights_recorded": fit_sleep.get("nights_recorded"),
            },
            "sleep_assessment": assessment,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /predict/sleep-from-fit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GOOGLE FIT ENDPOINTS
# ============================================================================

@app.get("/health/steps", response_model=StepsResponse)
async def get_steps(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_steps(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/sleep", response_model=SleepResponse)
async def get_sleep(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_sleep(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/heart-rate", response_model=HeartRateResponse)
async def get_heart_rate(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_heart_rate(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/blood-pressure", response_model=BloodPressureResponse)
async def get_blood_pressure(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_blood_pressure(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/weight", response_model=WeightResponse)
async def get_weight(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_weight(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/all", response_model=AllHealthDataResponse)
async def get_all_health_data(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_all_health_data(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/calories", response_model=CaloriesResponse)
async def get_calories(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_calories(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/distance", response_model=DistanceResponse)
async def get_distance(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_distance(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/active-minutes", response_model=ActiveMinutesResponse)
async def get_active_minutes(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_active_minutes(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/move-minutes", response_model=MoveMinutesResponse)
async def get_move_minutes(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_move_minutes(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/speed", response_model=SpeedResponse)
async def get_speed(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_speed(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/hydration", response_model=HydrationResponse)
async def get_hydration(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_hydration(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/nutrition", response_model=NutritionResponse)
async def get_nutrition(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_nutrition(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/oxygen-saturation", response_model=OxygenSaturationResponse)
async def get_oxygen_saturation(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_oxygen_saturation(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/body-temperature", response_model=BodyTemperatureResponse)
async def get_body_temperature(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_body_temperature(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/height", response_model=HeightResponse)
async def get_height():
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        result = google_fit_service.get_height()
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/power", response_model=PowerResponse)
async def get_power(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_power(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/full", response_model=FullHealthDataResponse)
async def get_full_health_data(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        result = google_fit_service.get_full_health_data(end_date - timedelta(days=days), end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/debug")
async def debug_google_fit():
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        sources = google_fit_service.debug_data_sources()
        today = datetime.now()
        start_of_day = datetime(today.year, today.month, today.day)
        steps_result = google_fit_service.get_steps(start_date=start_of_day, end_date=today)
        return {"status": "success", "data_sources": sources, "today_steps": steps_result, "auth_status": "authenticated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/health/today")
async def get_today_steps():
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        today = datetime.now()
        start_of_day = datetime(today.year, today.month, today.day)
        result = google_fit_service.get_steps(start_date=start_of_day, end_date=today)
        today_steps = 0
        if result.get("daily_steps"):
            for day in result["daily_steps"]:
                if day["date"] == str(today.date()):
                    today_steps = day["steps"]
                    break
        return {"status": "success", "date": str(today.date()), "steps_today": today_steps, "raw_data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)