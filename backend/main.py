"""
FastAPI backend - Google Fit health data API.
ML model, BigQuery, and online learning disabled for now.
"""

import logging
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from google_fit_service import GoogleFitService
from schemas import (
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

app = FastAPI(title="Migraine Classifier API", description="Health data API with Google Fit integration", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

google_fit_service: GoogleFitService = None


@app.on_event("startup")
async def startup_event():
    global google_fit_service
    logger.info("=" * 60)
    logger.info("STARTING MIGRAINE CLASSIFIER API")
    logger.info("=" * 60)

    if settings.USE_GOOGLE_FIT:
        try:
            google_fit_service = GoogleFitService(
                credentials_file=settings.GOOGLE_FIT_CREDENTIALS_FILE,
                token_file=settings.GOOGLE_FIT_TOKEN_FILE
            )
            logger.info("✓ Google Fit Service initialized")
        except Exception as e:
            logger.warning(f"⚠ Google Fit Service initialization failed: {e}")
    else:
        logger.warning("⚠ Google Fit disabled in config")

    logger.info("✓ API READY")
    logger.info("=" * 60)


@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(status="healthy", model_loaded=False, version="1.0.0")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", model_loaded=False, version="1.0.0")


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
        logger.error(f"Error in /health/steps: {e}")
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
        logger.error(f"Error in /health/sleep: {e}")
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
        logger.error(f"Error in /health/heart-rate: {e}")
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
        logger.error(f"Error in /health/blood-pressure: {e}")
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
        logger.error(f"Error in /health/weight: {e}")
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
        logger.error(f"Error in /health/all: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# DEBUG ENDPOINTS - Add these to help diagnose issues

@app.get("/health/debug")
async def debug_google_fit():
    """Debug Google Fit connection and available data"""
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    
    try:
        # Check data sources
        sources = google_fit_service.debug_data_sources()
        
        # Try to get today's steps specifically
        today = datetime.now()
        start_of_day = datetime(today.year, today.month, today.day)
        
        steps_result = google_fit_service.get_steps(start_date=start_of_day, end_date=today)
        
        return {
            "status": "success",
            "data_sources": sources,
            "today_steps": steps_result,
            "auth_status": "authenticated"
        }
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


@app.get("/health/test-steps")
async def test_steps(days: int = 1):
    """Test endpoint with detailed step data debugging"""
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        logger.info(f"Testing steps from {start_date} to {end_date}")
        
        # Check available sources first
        sources = google_fit_service.discover_data_sources("com.google.step_count.cumulative")
        
        # Get steps with detailed logging
        result = google_fit_service.get_steps(start_date=start_date, end_date=end_date)
        
        return {
            "status": "success",
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "available_sources": {
                "count": len(sources),
                "sources": sources
            },
            "step_data": result
        }
    except Exception as e:
        logger.error(f"Error in test-steps: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/health/today")
async def get_today_steps():
    """Get today's steps specifically"""
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    
    try:
        today = datetime.now()
        start_of_day = datetime(today.year, today.month, today.day)
        
        result = google_fit_service.get_steps(start_date=start_of_day, end_date=today)
        
        # Add today's steps specifically
        today_steps = 0
        if result.get("daily_steps"):
            for day in result["daily_steps"]:
                if day["date"] == str(today.date()):
                    today_steps = day["steps"]
                    break
        
        return {
            "status": "success",
            "date": str(today.date()),
            "steps_today": today_steps,
            "raw_data": result
        }
    except Exception as e:
        logger.error(f"Error in /health/today: {e}")
        return {"status": "error", "message": str(e)}


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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/calories: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/distance: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/active-minutes: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/move-minutes: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/speed: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/hydration: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/nutrition: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/oxygen-saturation: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/body-temperature: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/height: {e}")
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
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/power: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/full", response_model=FullHealthDataResponse)
async def get_full_health_data(days: int = 30):
    """Get ALL available health metrics in one call."""
    if google_fit_service is None:
        raise HTTPException(status_code=503, detail="Google Fit service not configured")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        result = google_fit_service.get_full_health_data(start_date, end_date, days)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /health/full: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)