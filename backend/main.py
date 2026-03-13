"""
FastAPI backend — Google Fit health data + Migraine ML models.

New endpoints added:
  POST /predict/symptom-type     → classify migraine type from symptoms
  POST /predict/migraine-today   → predict if migraine will occur today (triggers)
  POST /predict/sleep            → assess sleep risk pattern
  POST /predict/full             → run all 3 models in one call
"""

import logging
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from google_fit_service import GoogleFitService
from migraine_service import MigraineService
from schemas import (
    # Migraine prediction schemas
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
    # Episode logging
    MigraineEpisodeLog,
    MigraineEpisodeResponse,
    # Google Fit schemas
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
google_fit_service: GoogleFitService = None
migraine_service: MigraineService = None


@app.on_event("startup")
async def startup_event():
    global google_fit_service, migraine_service

    logger.info("=" * 60)
    logger.info("STARTING MIGRAINE CLASSIFIER API v2.0")
    logger.info("=" * 60)

    # ── Load migraine ML models ──────────────────────────────────────────────
    try:
        migraine_service = MigraineService()
        ready = migraine_service.is_ready
        logger.info(f"✓ Migraine models loaded: {ready}")
    except Exception as e:
        logger.warning(f"⚠ Migraine service init failed: {e}")

    # ── Google Fit ───────────────────────────────────────────────────────────
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
    """Check which ML models are loaded and ready."""
    if migraine_service is None:
        return {"status": "not_loaded", "models": {}}
    return {"status": "ok", "models": migraine_service.is_ready}


# ============================================================================
# MODEL 1 — QUICK EPISODE LOGGING
# Fast logging during or immediately after a migraine episode.
# POST /migraine-episodes
# ============================================================================

@app.post("/migraine-episodes", response_model=MigraineEpisodeResponse)
async def log_migraine_episode(episode: MigraineEpisodeLog):
    """
    Quick migraine episode logging.

    Input: MigraineEpisodeLog (user_id, intensity, symptoms, duration, notes)
    Output: Confirmation of saved episode
    """
    try:
        logger.info(f"Logged migraine episode for user {episode.user_id}: intensity={episode.intensity}, symptoms={episode.symptoms}")
        
        return MigraineEpisodeResponse(
            status="success",
            message="Migraine episode logged successfully",
            episode_id=f"ep_{int(datetime.utcnow().timestamp())}_{episode.user_id}",
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Error in /migraine-episodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL 1 — MIGRAINE TYPE CLASSIFICATION
# User fills in their symptoms during/after a migraine episode.
# POST /predict/symptom-type
# ============================================================================

@app.post("/predict/symptom-type", response_model=PredictionResponse)
async def predict_symptom_type(features: MigraineFeatures):
    """
    Classify the type of migraine based on symptoms reported during an episode.

    Input: MigraineFeatures (age, duration, nausea, visual aura, etc.)
    Output: Predicted migraine type + confidence + all class probabilities
    """
    if migraine_service is None or not migraine_service.is_ready["symptom_model"]:
        raise HTTPException(status_code=503, detail="Symptom classification model not loaded. Run migraine_symptom_classification_train.py first.")

    try:
        # Map Pydantic schema → dict with training column names (Title Case)
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
# User fills in their daily trigger checklist each morning.
# POST /predict/migraine-today
# ============================================================================

@app.post("/predict/migraine-today", response_model=MigrainePredictionResponse)
async def predict_migraine_today(triggers: MigraineTriggerRequest):
    """
    Predict if a migraine is likely to occur today based on daily trigger exposure.

    Input: MigraineTriggerRequest (stress level, sleep quality, food triggers, etc.)
    Output: migraine_predicted (bool), risk_level (LOW/MEDIUM/HIGH), probability, top_triggers
    """
    if migraine_service is None or not migraine_service.is_ready["trigger_model"]:
        raise HTTPException(status_code=503, detail="Trigger prediction model not loaded. Run migraine_data_train.py first.")

    try:
        trigger_dict = triggers.dict()
        result = migraine_service.predict_migraine_today(trigger_dict)
        return MigrainePredictionResponse(**result)

    except Exception as e:
        logger.error(f"Error in /predict/migraine-today: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL 3 — SLEEP RISK ASSESSMENT
# User fills in last night's sleep metrics (or auto-pulled from Google Fit).
# POST /predict/sleep
# ============================================================================

@app.post("/predict/sleep", response_model=SleepAssessmentResponse)
async def assess_sleep(sleep_data: SleepAssessmentRequest):
    """
    Assess whether your sleep pattern resembles migraine patients.

    Input: SleepAssessmentRequest (total sleep, REM %, deep sleep %, onset time, etc.)
    Output: classification (Migraine-like / Normal-like), risk score, comparison table, warnings
    """
    if migraine_service is None or not migraine_service.is_ready["sleep_reference"]:
        raise HTTPException(status_code=503, detail="Sleep reference values not loaded. Run sleep_train.py first.")

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
    """
    Run all available models in a single request.
    Any of symptom_data, trigger_data, sleep_data can be null — 
    only the models with data will run.

    Returns combined risk level (LOW / MEDIUM / HIGH) plus individual results.
    """
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
# BONUS — AUTO SLEEP FROM GOOGLE FIT → SLEEP ASSESSMENT
# GET /predict/sleep-from-fit?days=1
# ============================================================================

@app.get("/predict/sleep-from-fit")
async def sleep_assessment_from_fit(days: int = 1):
    """
    Pull last night's sleep from Google Fit automatically,
    then run the sleep assessment model on it.
    No manual input needed if the user has a smartwatch synced.
    """
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit not configured.")
    if migraine_service is None or not migraine_service.is_ready["sleep_reference"]:
        raise HTTPException(status_code=503, detail="Sleep model not loaded.")

    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        fit_sleep = google_fit_service.get_sleep(start_date, end_date, days)

        if not fit_sleep.get("sleep_records"):
            raise HTTPException(status_code=404, detail="No sleep data found in Google Fit for this period.")

        # Convert Google Fit sleep records to assessment input
        records = fit_sleep["sleep_records"]
        total_minutes = fit_sleep.get("total_sleep_minutes", 0)

        # Calculate stage percentages from records
        stage_minutes = {"REM sleep": 0, "Deep sleep": 0, "Light sleep": 0, "Awake": 0}
        for rec in records:
            stage = rec.get("stage", "")
            dur = rec.get("duration_minutes", 0)
            if stage in stage_minutes:
                stage_minutes[stage] += dur

        total_recorded = sum(stage_minutes.values()) or 1

        sleep_input = {
            "total_sleep_minutes": total_minutes,
            "sleep_onset_minutes": None,  # Not available from Google Fit
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
# GOOGLE FIT ENDPOINTS (unchanged)
# ============================================================================

@app.get("/health/steps", response_model=StepsResponse)
async def get_steps(days: int = 30):
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_steps(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_sleep(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_heart_rate(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_blood_pressure(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_weight(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_all_health_data(start_date, end_date, days)
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
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_full_health_data(start_date, end_date, days)
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