"""
Configuration settings for the backend API.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API settings
    API_VERSION: str = "1.0.0"
    API_TITLE: str = "Migraine Classifier API"

    # Google Cloud settings
    USE_GCS: bool = os.getenv("USE_GCS", "false").lower() == "true"
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "")
    GCS_MODEL_PATH: str = os.getenv("GCS_MODEL_PATH", "models/migraine-classifier")

    # Online learning settings
    ONLINE_LEARNING_RATE: float = float(os.getenv("ONLINE_LEARNING_RATE", "0.0001"))
    REPLAY_BUFFER_SIZE: int = int(os.getenv("REPLAY_BUFFER_SIZE", "100"))
    REPLAY_FREQUENCY: int = int(os.getenv("REPLAY_FREQUENCY", "10"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.8"))
    SAVE_FREQUENCY: int = int(os.getenv("SAVE_FREQUENCY", "5"))

    # Model settings
    MODEL_INPUT_DIM: int = 50  # Expanded from 23 to 50 for future features
    MODEL_HIDDEN_DIMS: list = [64, 32]
    MODEL_NUM_CLASSES: int = 8
    MODEL_DROPOUT: float = 0.3

    # Gemini API settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # BigQuery settings
    USE_BIGQUERY: bool = os.getenv("USE_BIGQUERY", "true").lower() == "true"
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "migraine_data")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "predictions")

    # Google Fit API settings
    USE_GOOGLE_FIT: bool = os.getenv("USE_GOOGLE_FIT", "true").lower() == "true"
    GOOGLE_FIT_CREDENTIALS_FILE: str = os.getenv("GOOGLE_FIT_CREDENTIALS_FILE", "credentials.json")
    GOOGLE_FIT_TOKEN_FILE: str = os.getenv("GOOGLE_FIT_TOKEN_FILE", "token.pickle")
    GOOGLE_FIT_DEFAULT_DAYS: int = int(os.getenv("GOOGLE_FIT_DEFAULT_DAYS", "30"))

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()