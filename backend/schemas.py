"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ============================================================================
# MIGRAINE SYMPTOM CLASSIFICATION (model 1)
# ============================================================================

class MigraineFeatures(BaseModel):
    age: int = Field(..., ge=0, le=120)
    duration: int = Field(..., ge=0, le=3)
    frequency: int = Field(..., ge=0, le=7)
    location: int = Field(..., ge=0, le=1)
    character: int = Field(..., ge=0, le=1)
    intensity: int = Field(..., ge=0, le=3)
    nausea: int = Field(..., ge=0, le=1)
    vomit: int = Field(..., ge=0, le=1)
    phonophobia: int = Field(..., ge=0, le=1)
    photophobia: int = Field(..., ge=0, le=1)
    visual: int = Field(..., ge=0, le=3)
    sensory: int = Field(..., ge=0, le=1)
    dysphasia: int = Field(..., ge=0, le=1)
    dysarthria: int = Field(..., ge=0, le=1)
    vertigo: int = Field(..., ge=0, le=1)
    tinnitus: int = Field(..., ge=0, le=1)
    hypoacusis: int = Field(..., ge=0, le=1)
    diplopia: int = Field(..., ge=0, le=1)
    defect: int = Field(..., ge=0, le=1)
    ataxia: int = Field(default=0, ge=0, le=1)
    conscience: int = Field(..., ge=0, le=1)
    paresthesia: int = Field(..., ge=0, le=1)
    dpf: int = Field(..., ge=0, le=1)
    ext_1: int = Field(default=0, ge=0, le=100)
    ext_2: int = Field(default=0, ge=0, le=100)
    ext_3: int = Field(default=0, ge=0, le=100)
    ext_4: int = Field(default=0, ge=0, le=100)
    ext_5: int = Field(default=0, ge=0, le=100)
    ext_6: int = Field(default=0, ge=0, le=100)
    ext_7: int = Field(default=0, ge=0, le=100)
    ext_8: int = Field(default=0, ge=0, le=100)
    ext_9: int = Field(default=0, ge=0, le=100)
    ext_10: int = Field(default=0, ge=0, le=100)
    ext_11: int = Field(default=0, ge=0, le=100)
    ext_12: int = Field(default=0, ge=0, le=100)
    ext_13: int = Field(default=0, ge=0, le=100)
    ext_14: int = Field(default=0, ge=0, le=100)
    ext_15: int = Field(default=0, ge=0, le=100)
    ext_16: int = Field(default=0, ge=0, le=100)
    ext_17: int = Field(default=0, ge=0, le=100)
    ext_18: int = Field(default=0, ge=0, le=100)
    ext_19: int = Field(default=0, ge=0, le=100)
    ext_20: int = Field(default=0, ge=0, le=100)
    ext_21: int = Field(default=0, ge=0, le=100)
    ext_22: int = Field(default=0, ge=0, le=100)
    ext_23: int = Field(default=0, ge=0, le=100)
    ext_24: int = Field(default=0, ge=0, le=100)
    ext_25: int = Field(default=0, ge=0, le=100)
    ext_26: int = Field(default=0, ge=0, le=100)
    ext_27: int = Field(default=0, ge=0, le=100)

    def to_tensor(self):
        return [
            self.age, self.duration, self.frequency, self.location,
            self.character, self.intensity, self.nausea, self.vomit,
            self.phonophobia, self.photophobia, self.visual, self.sensory,
            self.dysphasia, self.dysarthria, self.vertigo, self.tinnitus,
            self.hypoacusis, self.diplopia, self.defect, self.ataxia,
            self.conscience, self.paresthesia, self.dpf,
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
                "age": 35, "duration": 2, "frequency": 5, "location": 1,
                "character": 1, "intensity": 3, "nausea": 1, "vomit": 1,
                "phonophobia": 1, "photophobia": 1, "visual": 0, "sensory": 0,
                "dysphasia": 0, "dysarthria": 0, "vertigo": 0, "tinnitus": 0,
                "hypoacusis": 0, "diplopia": 0, "defect": 0, "ataxia": 0,
                "conscience": 0, "paresthesia": 0, "dpf": 1
            }
        }


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float = Field(..., ge=0, le=1)
    all_probabilities: dict
    timestamp: str


# ============================================================================
# MIGRAINE OCCURRENCE PREDICTION (model 2)
# ============================================================================

class MigraineTriggerRequest(BaseModel):
    cold_air_exposure: int = Field(default=0, ge=0, le=4)
    perfume_or_strong_odors: int = Field(default=0, ge=0, le=4)
    bright_or_flashing_lights: int = Field(default=0, ge=0, le=4)
    loud_sounds: int = Field(default=0, ge=0, le=4)
    changing_weather: int = Field(default=0, ge=0, le=4)
    hot_and_humid_weather: int = Field(default=0, ge=0, le=4)
    physical_exertion: int = Field(default=0, ge=0, le=4)
    overslept: int = Field(default=0, ge=0, le=4)
    lack_of_sleep: int = Field(default=0, ge=0, le=4)
    stress: int = Field(default=0, ge=0, le=4)
    post_stress_letdown: int = Field(default=0, ge=0, le=4)
    missed_a_meal: int = Field(default=0, ge=0, le=4)
    dehydration: int = Field(default=0, ge=0, le=4)
    nightshade_vegetables: int = Field(default=0, ge=0, le=4)
    smoked_or_cured_meat: int = Field(default=0, ge=0, le=4)
    bananas: int = Field(default=0, ge=0, le=4)
    caffeine: int = Field(default=0, ge=0, le=4)
    citrus_fruit_or_juice: int = Field(default=0, ge=0, le=4)
    beer: int = Field(default=0, ge=0, le=4)
    aged_or_blue_cheese: int = Field(default=0, ge=0, le=4)
    chocolate: int = Field(default=0, ge=0, le=4)
    red_wine: int = Field(default=0, ge=0, le=4)
    liquor_or_spirits: int = Field(default=0, ge=0, le=4)
    sugar_and_sweets: int = Field(default=0, ge=0, le=4)
    prev_day_migraine: int = Field(default=0, ge=0, le=1)
    is_weekend: Optional[int] = Field(default=None, ge=0, le=1)

    class Config:
        schema_extra = {
            "example": {
                "stress": 4,
                "lack_of_sleep": 3,
                "caffeine": 2,
                "dehydration": 2,
                "prev_day_migraine": 0
            }
        }


class MigrainePredictionResponse(BaseModel):
    migraine_predicted: bool
    risk_level: str
    probability: float = Field(..., ge=0, le=1)
    top_triggers: List[str]
    recommendation: str
    timestamp: str


# ============================================================================
# SLEEP ASSESSMENT (model 3)
# ============================================================================

class SleepAssessmentRequest(BaseModel):
    total_sleep_minutes: float = Field(..., ge=0, le=900)
    sleep_onset_minutes: float = Field(..., ge=0, le=180)
    rem_percent: float = Field(..., ge=0, le=100)
    deep_sleep_percent: float = Field(..., ge=0, le=100)
    n2_percent: Optional[float] = Field(default=None, ge=0, le=100)
    n1_percent: Optional[float] = Field(default=None, ge=0, le=100)
    wake_percent: Optional[float] = Field(default=None, ge=0, le=100)
    sleep_efficiency: Optional[float] = Field(default=None, ge=0, le=100)
    psqi_score: Optional[float] = Field(default=None, ge=0, le=21)

    class Config:
        schema_extra = {
            "example": {
                "total_sleep_minutes": 390,
                "sleep_onset_minutes": 25,
                "rem_percent": 18.0,
                "deep_sleep_percent": 12.0,
                "wake_percent": 8.0,
                "sleep_efficiency": 84.0
            }
        }


class SleepAssessmentResponse(BaseModel):
    classification: str
    risk_score: float = Field(..., ge=0, le=1)
    metrics_comparison: dict
    warnings: List[str]
    recommendation: str
    timestamp: str


# ============================================================================
# COMBINED ENDPOINT
# ============================================================================

class FullMigraineAssessmentRequest(BaseModel):
    symptom_data: Optional[MigraineFeatures] = None
    trigger_data: Optional[MigraineTriggerRequest] = None
    sleep_data: Optional[SleepAssessmentRequest] = None


class FullMigraineAssessmentResponse(BaseModel):
    symptom_classification: Optional[PredictionResponse] = None
    migraine_prediction: Optional[MigrainePredictionResponse] = None
    sleep_assessment: Optional[SleepAssessmentResponse] = None
    overall_risk: str
    timestamp: str


# ============================================================================
# ONLINE LEARNING
# ============================================================================

class UpdateRequest(BaseModel):
    features: MigraineFeatures
    true_label: str
    force_update: bool = Field(default=False)


class UpdateResponse(BaseModel):
    status: str
    updated: bool
    loss: Optional[float] = None
    confidence: float
    update_count: Optional[int] = None
    reason: Optional[str] = None


class MetricsResponse(BaseModel):
    total_updates: int
    skipped_updates: int
    replay_buffer_size: int
    avg_recent_loss: Optional[float] = None
    learning_rate: float


# ============================================================================
# HEALTH CHECK
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str


# ============================================================================
# CHAT
# ============================================================================

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    system_prompt: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    timestamp: str


# ============================================================================
# QUICK MIGRAINE EPISODE LOGGING
# ============================================================================

class MigraineEpisodeLog(BaseModel):
    """Log a new migraine episode."""
    user_id: str = Field(..., description="User identifier")
    intensity: int = Field(..., ge=0, le=10)
    severity: Optional[int] = Field(default=None, ge=0, le=4)
    symptoms: List[str] = Field(default_factory=list)
    triggers: List[str] = Field(default_factory=list)
    medication: List[str] = Field(default_factory=list)
    medication_effectiveness: Optional[int] = Field(default=None, ge=0, le=4)
    relief_methods: List[str] = Field(default_factory=list)
    pain_location: Optional[str] = Field(default=None)
    duration_category: str = Field(default="1-2h")
    warning_signs_before: bool = Field(default=False)
    warning_description: Optional[str] = Field(default=None)
    notes: str = Field(default="")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class MigraineEpisodeUpdate(BaseModel):
    """
    Partial update schema for editing an existing episode.

    All fields are Optional — only fields included in the request
    body will be updated (partial / PATCH-style update via PUT).
    The episode_id is taken from the URL path, not the body.
    """
    intensity: Optional[int] = Field(default=None, ge=0, le=10)
    severity: Optional[int] = Field(default=None, ge=0, le=4)
    symptoms: Optional[List[str]] = None
    triggers: Optional[List[str]] = None
    medication: Optional[List[str]] = None
    medication_effectiveness: Optional[int] = Field(default=None, ge=0, le=4)
    relief_methods: Optional[List[str]] = None
    pain_location: Optional[str] = None
    duration_category: Optional[str] = None
    warning_signs_before: Optional[bool] = None
    warning_description: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        # Allow partial updates — only set fields are included in .dict(exclude_unset=True)
        schema_extra = {
            "example": {
                "intensity": 7,
                "symptoms": ["Throbbing", "Nausea"],
                "notes": "Updated after episode ended"
            }
        }


class MigraineEpisodeResponse(BaseModel):
    """Response for episode logging."""
    status: str
    message: str
    episode_id: Optional[str] = None
    timestamp: str


# ============================================================================
# GOOGLE FIT — Health Data Schemas
# ============================================================================

class StepsData(BaseModel):
    date: str
    steps: int = Field(..., ge=0)


class StepsResponse(BaseModel):
    status: str
    total_steps: int
    average_steps: int
    period_days: int
    daily_steps: List[StepsData]
    start_date: str
    end_date: str


class SleepRecord(BaseModel):
    start_time: str
    end_time: str
    duration_minutes: float = Field(..., ge=0)
    stage: str


class SleepSchedule(BaseModel):
    average_sleep_start_hour: Optional[float] = None
    earliest_sleep_hour: Optional[float] = None
    latest_sleep_hour: Optional[float] = None
    consistency_score: Optional[float] = None
    status: Optional[str] = None


class SleepResponse(BaseModel):
    status: str
    total_sleep_hours: float = Field(..., ge=0)
    total_sleep_minutes: float = Field(..., ge=0)
    average_sleep_hours: float = Field(..., ge=0)
    nights_recorded: int = Field(..., ge=0)
    sleep_records: List[SleepRecord]
    sleep_schedule: Optional[SleepSchedule] = None
    start_date: str
    end_date: str
    message: Optional[str] = None


class HeartRateData(BaseModel):
    timestamp: str
    bpm: float = Field(..., ge=0)


class HeartRateResponse(BaseModel):
    status: str
    min_bpm: Optional[float] = None
    max_bpm: Optional[float] = None
    average_bpm: Optional[float] = None
    measurements_count: int = Field(..., ge=0)
    heart_rates: List[HeartRateData]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class BloodPressureReading(BaseModel):
    timestamp: str
    systolic: float = Field(..., ge=0)
    diastolic: float = Field(..., ge=0)
    status: str


class BloodPressureResponse(BaseModel):
    status: str
    readings_count: int = Field(..., ge=0)
    readings: List[BloodPressureReading]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class WeightMeasurement(BaseModel):
    timestamp: str
    weight_kg: float = Field(..., gt=0)
    weight_lbs: float = Field(..., gt=0)


class WeightResponse(BaseModel):
    status: str
    latest_weight_kg: Optional[float] = None
    latest_weight_lbs: Optional[float] = None
    min_weight_kg: Optional[float] = None
    max_weight_kg: Optional[float] = None
    measurements_count: int = Field(..., ge=0)
    measurements: List[WeightMeasurement]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    message: Optional[str] = None
    watch_required: Optional[bool] = None
    recommended_device: Optional[str] = None
    setup_instructions: Optional[str] = None


class AllHealthDataResponse(BaseModel):
    status: str
    steps: StepsResponse
    sleep: SleepResponse
    heart_rate: HeartRateResponse
    blood_pressure: BloodPressureResponse
    weight: WeightResponse
    timestamp: str


class CaloriesData(BaseModel):
    date: str
    calories: float = Field(..., ge=0)

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
    speed_mps: float = Field(..., ge=0)
    speed_kmh: float = Field(..., ge=0)

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
    status: str
    steps: Optional[dict] = None
    distance: Optional[dict] = None
    calories: Optional[dict] = None
    active_minutes: Optional[dict] = None
    move_minutes: Optional[dict] = None
    speed: Optional[dict] = None
    power: Optional[dict] = None
    heart_rate: Optional[dict] = None
    blood_pressure: Optional[dict] = None
    weight: Optional[dict] = None
    height: Optional[dict] = None
    body_temperature: Optional[dict] = None
    oxygen_saturation: Optional[dict] = None
    sleep: Optional[dict] = None
    hydration: Optional[dict] = None
    nutrition: Optional[dict] = None
    timestamp: str


# ============================================================================
# SAVE PREDICTION TO BIGQUERY
# ============================================================================

class IntegrationData(BaseModel):
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[str] = None
    alcohol_units: Optional[float] = None
    alcohol_hours_ago: Optional[float] = None
    steps: Optional[int] = None
    heart_rate: Optional[int] = None
    screen_time_minutes: Optional[int] = None
    screen_brightness: Optional[float] = None
    outdoor_brightness: Optional[float] = None
    weather: Optional[str] = None
    temperature: Optional[float] = None
    barometric_pressure: Optional[float] = None


class PredictionWithIntegrations(BaseModel):
    user_id: str
    name: Optional[str] = None
    age_bracket: Optional[int] = None
    session_id: Optional[str] = None
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    all_probabilities: Optional[dict] = None
    features: MigraineFeatures
    integrations: Optional[IntegrationData] = None
    integrations_enabled: Optional[List[str]] = None


class SavePredictionResponse(BaseModel):
    status: str
    bigquery_saved: bool
    prediction: str
    confidence: float


class AccumulateRequest(BaseModel):
    features: MigraineFeatures
    true_label: str


class AccumulateResponse(BaseModel):
    status: str
    session_size: int
    message: str


class BatchUpdateResponse(BaseModel):
    status: str
    samples_processed: int
    avg_loss: Optional[float] = None
    total_updates: int
    session_cleared: bool


class ClearSessionResponse(BaseModel):
    status: str
    samples_cleared: int
    message: str