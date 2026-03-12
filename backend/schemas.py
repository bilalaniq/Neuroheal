"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional


class MigraineFeatures(BaseModel):
    """Input features for migraine prediction."""

    age: int = Field(..., ge=0, le=120, description="Patient age")
    duration: int = Field(..., ge=0, le=3, description="Duration of headache (0-3 scale)")
    frequency: int = Field(..., ge=0, le=7, description="Frequency of episodes (0-7 scale)")
    location: int = Field(..., ge=0, le=1, description="Pain location (0 or 1)")
    character: int = Field(..., ge=0, le=1, description="Pain character (0 or 1)")
    intensity: int = Field(..., ge=0, le=3, description="Pain intensity (0-3 scale)")

    # Symptoms (binary)
    nausea: int = Field(..., ge=0, le=1, description="Nausea present")
    vomit: int = Field(..., ge=0, le=1, description="Vomiting present")
    phonophobia: int = Field(..., ge=0, le=1, description="Phonophobia present")
    photophobia: int = Field(..., ge=0, le=1, description="Photophobia present")
    visual: int = Field(..., ge=0, le=3, description="Visual symptoms (0-3)")
    sensory: int = Field(..., ge=0, le=1, description="Sensory symptoms")
    dysphasia: int = Field(..., ge=0, le=1, description="Dysphasia present")
    dysarthria: int = Field(..., ge=0, le=1, description="Dysarthria present")
    vertigo: int = Field(..., ge=0, le=1, description="Vertigo present")
    tinnitus: int = Field(..., ge=0, le=1, description="Tinnitus present")
    hypoacusis: int = Field(..., ge=0, le=1, description="Hypoacusis present")
    diplopia: int = Field(..., ge=0, le=1, description="Diplopia present")
    defect: int = Field(..., ge=0, le=1, description="Visual defect present")
    ataxia: int = Field(..., ge=0, le=1, description="Ataxia present")
    conscience: int = Field(..., ge=0, le=1, description="Consciousness alteration")
    paresthesia: int = Field(..., ge=0, le=1, description="Paresthesia present")
    dpf: int = Field(..., ge=0, le=1, description="Family history (DPF)")

    # Extended features (24-50) - Optional fields for app expansion
    # Default to 0 if not provided
    ext_1: int = Field(default=0, ge=0, le=100, description="Extended feature 1")
    ext_2: int = Field(default=0, ge=0, le=100, description="Extended feature 2")
    ext_3: int = Field(default=0, ge=0, le=100, description="Extended feature 3")
    ext_4: int = Field(default=0, ge=0, le=100, description="Extended feature 4")
    ext_5: int = Field(default=0, ge=0, le=100, description="Extended feature 5")
    ext_6: int = Field(default=0, ge=0, le=100, description="Extended feature 6")
    ext_7: int = Field(default=0, ge=0, le=100, description="Extended feature 7")
    ext_8: int = Field(default=0, ge=0, le=100, description="Extended feature 8")
    ext_9: int = Field(default=0, ge=0, le=100, description="Extended feature 9")
    ext_10: int = Field(default=0, ge=0, le=100, description="Extended feature 10")
    ext_11: int = Field(default=0, ge=0, le=100, description="Extended feature 11")
    ext_12: int = Field(default=0, ge=0, le=100, description="Extended feature 12")
    ext_13: int = Field(default=0, ge=0, le=100, description="Extended feature 13")
    ext_14: int = Field(default=0, ge=0, le=100, description="Extended feature 14")
    ext_15: int = Field(default=0, ge=0, le=100, description="Extended feature 15")
    ext_16: int = Field(default=0, ge=0, le=100, description="Extended feature 16")
    ext_17: int = Field(default=0, ge=0, le=100, description="Extended feature 17")
    ext_18: int = Field(default=0, ge=0, le=100, description="Extended feature 18")
    ext_19: int = Field(default=0, ge=0, le=100, description="Extended feature 19")
    ext_20: int = Field(default=0, ge=0, le=100, description="Extended feature 20")
    ext_21: int = Field(default=0, ge=0, le=100, description="Extended feature 21")
    ext_22: int = Field(default=0, ge=0, le=100, description="Extended feature 22")
    ext_23: int = Field(default=0, ge=0, le=100, description="Extended feature 23")
    ext_24: int = Field(default=0, ge=0, le=100, description="Extended feature 24")
    ext_25: int = Field(default=0, ge=0, le=100, description="Extended feature 25")
    ext_26: int = Field(default=0, ge=0, le=100, description="Extended feature 26")
    ext_27: int = Field(default=0, ge=0, le=100, description="Extended feature 27")

    def to_tensor(self):
        """Convert to list in correct order for model input (50 features)."""
        return [
            # Original 23 features
            self.age, self.duration, self.frequency, self.location,
            self.character, self.intensity, self.nausea, self.vomit,
            self.phonophobia, self.photophobia, self.visual, self.sensory,
            self.dysphasia, self.dysarthria, self.vertigo, self.tinnitus,
            self.hypoacusis, self.diplopia, self.defect, self.ataxia,
            self.conscience, self.paresthesia, self.dpf,
            # Extended 27 features (default to 0)
            self.ext_1, self.ext_2, self.ext_3, self.ext_4, self.ext_5,
            self.ext_6, self.ext_7, self.ext_8, self.ext_9, self.ext_10,
            self.ext_11, self.ext_12, self.ext_13, self.ext_14, self.ext_15,
            self.ext_16, self.ext_17, self.ext_18, self.ext_19, self.ext_20,
            self.ext_21, self.ext_22, self.ext_23, self.ext_24, self.ext_25,
            self.ext_26, self.ext_27
        ]

    class Config:
        schema_extra = {
            "example": {
                "age": 35,
                "duration": 2,
                "frequency": 5,
                "location": 1,
                "character": 1,
                "intensity": 3,
                "nausea": 1,
                "vomit": 1,
                "phonophobia": 1,
                "photophobia": 1,
                "visual": 0,
                "sensory": 0,
                "dysphasia": 0,
                "dysarthria": 0,
                "vertigo": 0,
                "tinnitus": 0,
                "hypoacusis": 0,
                "diplopia": 0,
                "defect": 0,
                "ataxia": 0,
                "conscience": 0,
                "paresthesia": 0,
                "dpf": 1
            }
        }


class PredictionResponse(BaseModel):
    """Response from prediction endpoint."""

    prediction: str = Field(..., description="Predicted migraine type")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence (0-1)")
    all_probabilities: dict = Field(..., description="Probabilities for all classes")
    timestamp: str = Field(..., description="Prediction timestamp")


class UpdateRequest(BaseModel):
    """Request to update model with new data."""

    features: MigraineFeatures
    true_label: str = Field(..., description="True migraine type (user confirmed)")
    force_update: bool = Field(default=False, description="Force update even if high confidence")

    class Config:
        schema_extra = {
            "example": {
                "features": {
                    "age": 35, "duration": 2, "frequency": 5, "location": 1,
                    "character": 1, "intensity": 3, "nausea": 1, "vomit": 1,
                    "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
                    "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0,
                    "hypoacusis": 0, "diplopia": 0, "defect": 0, "ataxia": 0,
                    "conscience": 0, "paresthesia": 0, "dpf": 1
                },
                "true_label": "Migraine without aura",
                "force_update": False
            }
        }


class UpdateResponse(BaseModel):
    """Response from model update endpoint."""

    status: str = Field(..., description="Update status")
    updated: bool = Field(..., description="Whether model was actually updated")
    loss: Optional[float] = Field(None, description="Training loss if updated")
    confidence: float = Field(..., description="Model confidence before update")
    update_count: Optional[int] = Field(None, description="Total number of updates")
    reason: Optional[str] = Field(None, description="Reason if not updated")


class MetricsResponse(BaseModel):
    """Response from metrics endpoint."""

    total_updates: int = Field(..., description="Total number of model updates")
    skipped_updates: int = Field(..., description="Number of skipped updates (high confidence)")
    replay_buffer_size: int = Field(..., description="Current replay buffer size")
    avg_recent_loss: Optional[float] = Field(None, description="Average recent loss")
    learning_rate: float = Field(..., description="Current learning rate")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    version: str = Field(..., description="API version")


class AccumulateRequest(BaseModel):
    """Request to accumulate data for later batch update."""

    features: MigraineFeatures
    true_label: str = Field(..., description="True migraine type (user confirmed)")

    class Config:
        schema_extra = {
            "example": {
                "features": {
                    "age": 35, "duration": 2, "frequency": 5, "location": 1,
                    "character": 1, "intensity": 3, "nausea": 1, "vomit": 1,
                    "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
                    "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0,
                    "hypoacusis": 0, "diplopia": 0, "defect": 0, "ataxia": 0,
                    "conscience": 0, "paresthesia": 0, "dpf": 1
                },
                "true_label": "Migraine without aura"
            }
        }


class AccumulateResponse(BaseModel):
    """Response from accumulate endpoint."""

    status: str = Field(..., description="Accumulation status")
    session_size: int = Field(..., description="Number of samples in current session")
    message: str = Field(..., description="Status message")


class BatchUpdateResponse(BaseModel):
    """Response from batch model update."""

    status: str = Field(..., description="Update status")
    samples_processed: int = Field(..., description="Number of samples processed")
    avg_loss: Optional[float] = Field(None, description="Average training loss")
    total_updates: int = Field(..., description="Total number of updates performed")
    session_cleared: bool = Field(..., description="Whether session data was cleared")


class ClearSessionResponse(BaseModel):
    """Response from clear session endpoint."""

    status: str = Field(..., description="Clear status")
    samples_cleared: int = Field(..., description="Number of samples cleared")
    message: str = Field(..., description="Status message")


class ChatRequest(BaseModel):
    """Request for Gemini chat endpoint."""

    message: str = Field(..., min_length=1, description="User message to send to Gemini")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt for context")

    class Config:
        schema_extra = {
            "example": {
                "message": "What are the common symptoms of migraine?",
                "system_prompt": "You are a helpful medical assistant specializing in migraines."
            }
        }


class ChatResponse(BaseModel):
    """Response from Gemini chat endpoint."""

    response: str = Field(..., description="Gemini's response")
    timestamp: str = Field(..., description="Response timestamp")


class IntegrationData(BaseModel):
    """Health and environmental integration data."""

    sleep_hours: Optional[float] = Field(None, description="Sleep duration in hours")
    sleep_quality: Optional[str] = Field(None, description="Sleep quality rating")
    alcohol_units: Optional[float] = Field(None, description="Alcohol consumption in units")
    alcohol_hours_ago: Optional[float] = Field(None, description="Hours since last alcohol")
    steps: Optional[int] = Field(None, description="Step count")
    heart_rate: Optional[int] = Field(None, description="Heart rate BPM")
    screen_time_minutes: Optional[int] = Field(None, description="Screen time in minutes")
    screen_brightness: Optional[float] = Field(None, description="Screen brightness (0-1)")
    outdoor_brightness: Optional[float] = Field(None, description="Outdoor brightness lux")
    weather: Optional[str] = Field(None, description="Weather conditions")
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    barometric_pressure: Optional[float] = Field(None, description="Barometric pressure hPa")


class PredictionWithIntegrations(BaseModel):
    """Prediction request with integration data for BigQuery."""

    user_id: str = Field(..., description="User identifier")
    name: Optional[str] = Field(None, description="User name")
    age_bracket: Optional[int] = Field(None, description="User age bracket")
    session_id: Optional[str] = Field(None, description="Session identifier")

    # Prediction results (from /predict endpoint)
    prediction: Optional[str] = Field(None, description="Predicted migraine type")
    confidence: Optional[float] = Field(None, description="Prediction confidence")
    all_probabilities: Optional[dict] = Field(None, description="All class probabilities")

    features: MigraineFeatures
    integrations: Optional[IntegrationData] = Field(None, description="Integration data")
    integrations_enabled: Optional[List[str]] = Field(None, description="List of enabled integrations")


class SavePredictionResponse(BaseModel):
    """Response from save prediction endpoint."""

    status: str = Field(..., description="Save status")
    bigquery_saved: bool = Field(..., description="Whether saved to BigQuery")
    prediction: str = Field(..., description="Prediction result")
    confidence: float = Field(..., description="Prediction confidence")


# Google Fit Health Data Schemas

class StepsData(BaseModel):
    """Daily step count data."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    steps: int = Field(..., ge=0, description="Number of steps")


class StepsResponse(BaseModel):
    """Response with step count data."""
    status: str = Field(..., description="Status of the request")
    total_steps: int = Field(..., description="Total steps in period")
    average_steps: int = Field(..., description="Average steps per day")
    period_days: int = Field(..., description="Number of days with data")
    daily_steps: List[StepsData] = Field(..., description="Daily step breakdown")
    start_date: str = Field(..., description="Period start date")
    end_date: str = Field(..., description="Period end date")


class SleepRecord(BaseModel):
    """Individual sleep record."""
    start_time: str = Field(..., description="Sleep start time ISO format")
    end_time: str = Field(..., description="Sleep end time ISO format")
    duration_minutes: float = Field(..., ge=0, description="Duration in minutes")
    stage: str = Field(..., description="Sleep stage (Awake, Light sleep, Deep sleep, etc)")


class SleepSchedule(BaseModel):
    """Sleep schedule statistics."""
    average_sleep_start_hour: Optional[float] = Field(None, description="Average hour when sleep starts")
    earliest_sleep_hour: Optional[float] = Field(None, description="Earliest sleep hour")
    latest_sleep_hour: Optional[float] = Field(None, description="Latest sleep hour")
    consistency_score: Optional[float] = Field(None, description="Sleep consistency percentage")
    status: Optional[str] = Field(None, description="Status message if no data")


class SleepResponse(BaseModel):
    """Response with sleep data."""
    status: str = Field(..., description="Status of the request")
    total_sleep_hours: float = Field(..., ge=0, description="Total sleep hours")
    total_sleep_minutes: float = Field(..., ge=0, description="Total sleep minutes")
    average_sleep_hours: float = Field(..., ge=0, description="Average sleep per night")
    nights_recorded: int = Field(..., ge=0, description="Number of nights with data")
    sleep_records: List[SleepRecord] = Field(..., description="Individual sleep records")
    sleep_schedule: Optional[SleepSchedule] = Field(None, description="Sleep schedule statistics")
    start_date: str = Field(..., description="Period start date")
    end_date: str = Field(..., description="Period end date")
    message: Optional[str] = Field(None, description="Additional message")


class HeartRateData(BaseModel):
    """Heart rate measurement."""
    timestamp: str = Field(..., description="Measurement timestamp ISO format")
    bpm: float = Field(..., ge=0, description="Beats per minute")


class HeartRateResponse(BaseModel):
    """Response with heart rate data."""
    status: str = Field(..., description="Status of the request")
    min_bpm: Optional[float] = Field(None, ge=0, description="Minimum heart rate")
    max_bpm: Optional[float] = Field(None, ge=0, description="Maximum heart rate")
    average_bpm: Optional[float] = Field(None, ge=0, description="Average heart rate")
    measurements_count: int = Field(..., ge=0, description="Number of measurements")
    heart_rates: List[HeartRateData] = Field(..., description="Heart rate measurements")
    start_date: Optional[str] = Field(None, description="Period start date")
    end_date: Optional[str] = Field(None, description="Period end date")
    message: Optional[str] = Field(None, description="Additional message")
    watch_required: Optional[bool] = Field(None, description="True if a smartwatch is needed")
    recommended_device: Optional[str] = Field(None, description="Recommended device to get this data")
    setup_instructions: Optional[str] = Field(None, description="How to set up the device")


class BloodPressureReading(BaseModel):
    """Blood pressure reading."""
    timestamp: str = Field(..., description="Reading timestamp ISO format")
    systolic: float = Field(..., ge=0, description="Systolic pressure mmHg")
    diastolic: float = Field(..., ge=0, description="Diastolic pressure mmHg")
    status: str = Field(..., description="BP status (Normal, Elevated, High Stage 1/2, Crisis)")


class BloodPressureResponse(BaseModel):
    """Response with blood pressure data."""
    status: str = Field(..., description="Status of the request")
    readings_count: int = Field(..., ge=0, description="Number of readings")
    readings: List[BloodPressureReading] = Field(..., description="Blood pressure readings")
    start_date: Optional[str] = Field(None, description="Period start date")
    end_date: Optional[str] = Field(None, description="Period end date")
    message: Optional[str] = Field(None, description="Additional message")
    watch_required: Optional[bool] = Field(None, description="True if a device is needed")
    recommended_device: Optional[str] = Field(None, description="Recommended device")
    setup_instructions: Optional[str] = Field(None, description="How to set up")


class WeightMeasurement(BaseModel):
    """Weight measurement."""
    timestamp: str = Field(..., description="Measurement timestamp ISO format")
    weight_kg: float = Field(..., gt=0, description="Weight in kilograms")
    weight_lbs: float = Field(..., gt=0, description="Weight in pounds")


class WeightResponse(BaseModel):
    """Response with weight data."""
    status: str = Field(..., description="Status of the request")
    latest_weight_kg: Optional[float] = Field(None, gt=0, description="Latest weight in kg")
    latest_weight_lbs: Optional[float] = Field(None, gt=0, description="Latest weight in lbs")
    min_weight_kg: Optional[float] = Field(None, gt=0, description="Minimum weight in kg")
    max_weight_kg: Optional[float] = Field(None, gt=0, description="Maximum weight in kg")
    measurements_count: int = Field(..., ge=0, description="Number of measurements")
    measurements: List[WeightMeasurement] = Field(..., description="Weight measurements")
    start_date: Optional[str] = Field(None, description="Period start date")
    end_date: Optional[str] = Field(None, description="Period end date")
    message: Optional[str] = Field(None, description="Additional message")
    watch_required: Optional[bool] = Field(None, description="True if a smart scale is needed")
    recommended_device: Optional[str] = Field(None, description="Recommended device")
    setup_instructions: Optional[str] = Field(None, description="How to set up")


class AllHealthDataResponse(BaseModel):
    """Response with all health data from Google Fit."""
    status: str = Field(..., description="Status of the request")
    steps: StepsResponse = Field(..., description="Step count data")
    sleep: SleepResponse = Field(..., description="Sleep data")
    heart_rate: HeartRateResponse = Field(..., description="Heart rate data")
    blood_pressure: BloodPressureResponse = Field(..., description="Blood pressure data")
    weight: WeightResponse = Field(..., description="Weight data")
    timestamp: str = Field(..., description="Response timestamp")


# --- New extended health data schemas ---

class CaloriesData(BaseModel):
    date: str
    calories: float = Field(..., ge=0, description="Calories burned (kcal)")

class CaloriesResponse(BaseModel):
    status: str
    total_calories: float
    average_calories: float
    period_days: int
    daily_calories: List[CaloriesData]
    start_date: str
    end_date: str
    message: Optional[str] = None


class DistanceData(BaseModel):
    date: str
    distance_meters: float = Field(..., ge=0)
    distance_km: float = Field(..., ge=0)
    distance_miles: float = Field(..., ge=0)

class DistanceResponse(BaseModel):
    status: str
    total_distance_km: float
    total_distance_miles: float
    average_distance_km: float
    period_days: int
    daily_distance: List[DistanceData]
    start_date: str
    end_date: str
    message: Optional[str] = None


class ActiveMinutesData(BaseModel):
    date: str
    active_minutes: float = Field(..., ge=0)

class ActiveMinutesResponse(BaseModel):
    status: str
    total_active_minutes: float
    average_active_minutes: float
    period_days: int
    daily_active_minutes: List[ActiveMinutesData]
    start_date: str
    end_date: str
    message: Optional[str] = None


class SpeedData(BaseModel):
    timestamp: str
    speed_mps: float = Field(..., ge=0, description="Speed in meters per second")
    speed_kmh: float = Field(..., ge=0, description="Speed in km/h")

class SpeedResponse(BaseModel):
    status: str
    max_speed_kmh: Optional[float] = None
    average_speed_kmh: Optional[float] = None
    measurements_count: int
    speeds: List[SpeedData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class HydrationData(BaseModel):
    timestamp: str
    volume_liters: float = Field(..., ge=0)

class HydrationResponse(BaseModel):
    status: str
    total_liters: float
    average_liters_per_day: float
    measurements_count: int
    entries: List[HydrationData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class NutritionData(BaseModel):
    timestamp: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    meal_type: Optional[str] = None

class NutritionResponse(BaseModel):
    status: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    entries_count: int
    entries: List[NutritionData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class OxygenSaturationData(BaseModel):
    timestamp: str
    spo2_percent: float = Field(..., ge=0, le=100)

class OxygenSaturationResponse(BaseModel):
    status: str
    min_spo2: Optional[float] = None
    max_spo2: Optional[float] = None
    average_spo2: Optional[float] = None
    measurements_count: int
    readings: List[OxygenSaturationData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class BodyTemperatureData(BaseModel):
    timestamp: str
    temperature_celsius: float
    temperature_fahrenheit: float

class BodyTemperatureResponse(BaseModel):
    status: str
    average_temp_celsius: Optional[float] = None
    min_temp_celsius: Optional[float] = None
    max_temp_celsius: Optional[float] = None
    measurements_count: int
    readings: List[BodyTemperatureData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class HeightResponse(BaseModel):
    status: str
    height_meters: Optional[float] = None
    height_cm: Optional[float] = None
    height_feet_inches: Optional[str] = None
    last_updated: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class MoveMinutesData(BaseModel):
    date: str
    move_minutes: float = Field(..., ge=0)

class MoveMinutesResponse(BaseModel):
    status: str
    total_move_minutes: float
    average_move_minutes: float
    period_days: int
    daily_move_minutes: List[MoveMinutesData]
    start_date: str
    end_date: str
    message: Optional[str] = None


class PowerData(BaseModel):
    timestamp: str
    watts: float = Field(..., ge=0)

class PowerResponse(BaseModel):
    status: str
    average_watts: Optional[float] = None
    max_watts: Optional[float] = None
    measurements_count: int
    readings: List[PowerData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class FullHealthDataResponse(BaseModel):
    """Complete response with every available Google Fit data type."""
    status: str
    # Activity
    steps: Optional[dict] = None
    distance: Optional[dict] = None
    calories: Optional[dict] = None
    active_minutes: Optional[dict] = None
    move_minutes: Optional[dict] = None
    speed: Optional[dict] = None
    power: Optional[dict] = None
    # Body
    heart_rate: Optional[dict] = None
    blood_pressure: Optional[dict] = None
    weight: Optional[dict] = None
    height: Optional[dict] = None
    body_temperature: Optional[dict] = None
    oxygen_saturation: Optional[dict] = None
    # Lifestyle
    sleep: Optional[dict] = None
    hydration: Optional[dict] = None
    nutrition: Optional[dict] = None
    timestamp: str