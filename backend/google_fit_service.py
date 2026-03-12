"""
Google Fit API Service
Supports: steps, distance, calories, active minutes, move minutes, speed, power,
          heart rate, blood pressure, weight, height, body temperature, SpO2,
          sleep, hydration, nutrition
"""

import os
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional, List
import pickle

import requests
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/fitness.nutrition.read',
]

BASE_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
DATA_SOURCES_URL = "https://www.googleapis.com/fitness/v1/users/me/dataSources"

# Metrics that require a smartwatch/band or manual entry
WATCH_REQUIRED_METRICS = {
    "heart_rate": {
        "message": "No heart rate data. A smartwatch/band synced to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Xiaomi Smart Band 9 Pro / Fitbit Charge 6 / Galaxy Watch",
        "setup_instructions": "1. Buy a smartwatch. 2. Install Mi Fitness or Fitbit app. 3. Connect to Google Fit via app settings.",
    },
    "blood_pressure": {
        "message": "No blood pressure data. A BP monitor or smartwatch that syncs to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Omron blood pressure monitor / Samsung Galaxy Watch 7",
        "setup_instructions": "1. Get a Google Fit compatible BP monitor. 2. Sync readings to Google Fit.",
    },
    "weight": {
        "message": "No weight data. A smart scale that syncs to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Xiaomi Mi Scale 2 (~$20) / Fitbit Aria / Withings Body",
        "setup_instructions": "1. Buy a smart scale. 2. Connect it to Google Fit via its companion app.",
    },
    "height": {
        "message": "No height data. Enter your height in the Google Fit app manually.",
        "watch_required": False,
        "recommended_device": None,
        "setup_instructions": "Open Google Fit app -> tap your profile photo -> Edit profile -> add Height.",
    },
    "body_temperature": {
        "message": "No body temperature data. A smartwatch with temperature sensor synced to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Xiaomi Smart Band 9 Pro / Samsung Galaxy Watch 7",
        "setup_instructions": "1. Get a band with temperature sensor. 2. Enable temperature tracking. 3. Sync to Google Fit.",
    },
    "oxygen_saturation": {
        "message": "No SpO2 data. A smartwatch/band with SpO2 sensor synced to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Xiaomi Smart Band 9 Pro / Fitbit Sense / Galaxy Watch",
        "setup_instructions": "1. Get a band with SpO2 sensor. 2. Enable SpO2 tracking. 3. Sync to Google Fit.",
    },
    "hydration": {
        "message": "No hydration data. Log water intake in the Google Fit app manually.",
        "watch_required": False,
        "recommended_device": None,
        "setup_instructions": "Open Google Fit app -> tap '+' -> Log water to manually track hydration.",
    },
    "nutrition": {
        "message": "No nutrition data. Connect MyFitnessPal or log meals in Google Fit.",
        "watch_required": False,
        "recommended_device": None,
        "setup_instructions": "Connect MyFitnessPal to Google Fit via connected apps settings.",
    },
    "power": {
        "message": "No cycling power data. A cycling power meter connected to Google Fit is required.",
        "watch_required": True,
        "recommended_device": "Wahoo / Garmin cycling power meter",
        "setup_instructions": "1. Get a cycling power meter. 2. Connect to Google Fit via cycling app.",
    },
}


class GoogleFitService:

    def __init__(self, credentials_file="credentials.json", token_file="token.pickle", use_rest_api=True):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.credentials = None
        self.xiaomi_source_id = None
        self._load_or_create_credentials()
        self._discover_xiaomi_source()

    # -------------------------------------------------------------------------
    # Auth
    # -------------------------------------------------------------------------

    def _load_or_create_credentials(self):
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as f:
                self.credentials = pickle.load(f)
                logger.info("✓ Loaded existing credentials")

        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(Request())
                logger.info("✓ Refreshed credentials")
            else:
                self._authenticate_with_oauth()

        with open(self.token_file, 'wb') as f:
            pickle.dump(self.credentials, f)

    def _authenticate_with_oauth(self):
        if not os.path.exists(self.credentials_file):
            raise FileNotFoundError(f"Credentials file not found: {self.credentials_file}")
        flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
        self.credentials = flow.run_local_server(port=0)
        logger.info("✓ Successfully authenticated with Google OAuth 2.0")
        with open(self.token_file, 'wb') as f:
            pickle.dump(self.credentials, f)

    def _get_access_token(self):
        if not self.credentials:
            raise ValueError("No credentials found")
        if not self.credentials.valid:
            if self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(Request())
        return self.credentials.token

    # -------------------------------------------------------------------------
    # Data source discovery
    # -------------------------------------------------------------------------

    def _discover_xiaomi_source(self):
        try:
            sources = self.discover_data_sources("com.google.step_count.cumulative")
            for source in sources:
                if source.get('device', {}).get('manufacturer', '').lower() == 'xiaomi':
                    self.xiaomi_source_id = source.get('dataStreamId')
                    logger.info(f"✓ Found Xiaomi source: {self.xiaomi_source_id}")
                    return
            logger.warning("No Xiaomi step source found, will use generic source")
        except Exception as e:
            logger.error(f"Error discovering Xiaomi source: {e}")

    def discover_data_sources(self, data_type_name=None):
        token = self._get_access_token()
        url = DATA_SOURCES_URL
        if data_type_name:
            url += f"?dataTypeName={data_type_name}"
        try:
            response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
            sources = response.json().get("dataSource", [])
            logger.info(f"Found {len(sources)} data sources for {data_type_name or 'all types'}")
            for s in sources:
                logger.info(f"  - {s.get('dataStreamId')} ({s.get('dataType', {}).get('name')})")
            return sources
        except Exception as e:
            logger.error(f"Error discovering data sources: {e}")
            return []

    # -------------------------------------------------------------------------
    # Core API helpers
    # -------------------------------------------------------------------------

    def _aggregate(self, data_type_name: str, start_ms: int, end_ms: int,
                   bucket_ms: int, data_source_id: str = None):
        """Call Google Fit aggregate endpoint."""
        token = self._get_access_token()
        aggregate_by = {"dataTypeName": data_type_name}
        if data_source_id:
            aggregate_by["dataSourceId"] = data_source_id

        body = {
            "aggregateBy": [aggregate_by],
            "bucketByTime": {"durationMillis": bucket_ms},
            "startTimeMillis": start_ms,
            "endTimeMillis": end_ms,
        }
        try:
            response = requests.post(
                BASE_URL, json=body,
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response:
                logger.error(f"API Error {e.response.status_code}: {e.response.text}")
            raise

    def _get_raw_dataset(self, data_source_id: str, start_ms: int, end_ms: int):
        """Read raw data points directly from a data source (not aggregated).
        Needed for cumulative sources like Xiaomi which don't work with aggregate API."""
        token = self._get_access_token()
        # dataset ID uses nanoseconds
        dataset_id = f"{start_ms * 1000000}-{end_ms * 1000000}"
        url = f"https://www.googleapis.com/fitness/v1/users/me/dataSources/{data_source_id}/datasets/{dataset_id}"
        try:
            response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response:
                logger.error(f"Raw dataset API error {e.response.status_code}: {e.response.text}")
            raise

    # -------------------------------------------------------------------------
    # Steps
    # -------------------------------------------------------------------------

    def get_steps(self, start_date=None, end_date=None, days_back=30):
        """
        Get step count data.

        Strategy:
        1. Try aggregate delta steps (standard, works for most phones)
        2. If empty and Xiaomi source exists, read raw cumulative dataset and compute daily deltas
        """
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=days_back)

        start_ms = int(start_date.timestamp() * 1000)
        end_ms = int(end_date.timestamp() * 1000)

        try:
            # --- Strategy 1: aggregate delta steps ---
            logger.info(f"Fetching step data (delta) from {start_date.date()} to {end_date.date()}")
            data = self._aggregate("com.google.step_count.delta", start_ms, end_ms, 86400000)

            daily_steps = {}
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("intVal", 0) or int(pt["value"][0].get("fpVal", 0))
                        if val > 0:
                            daily_steps[date] = daily_steps.get(date, 0) + val

            if daily_steps:
                logger.info(f"Delta strategy: found {len(daily_steps)} days of step data")
            else:
                logger.warning("No delta step data — falling back to raw cumulative source")

            # --- Strategy 2: raw cumulative dataset (Xiaomi fallback) ---
            if not daily_steps and self.xiaomi_source_id:
                logger.info(f"Reading raw cumulative data from: {self.xiaomi_source_id}")
                raw = self._get_raw_dataset(self.xiaomi_source_id, start_ms, end_ms)
                points = raw.get("point", [])
                logger.info(f"Raw dataset returned {len(points)} data points")

                points_by_day = defaultdict(list)
                for point in points:
                    ts_ns = int(point.get("startTimeNanos", point.get("endTimeNanos", 0)))
                    ts_sec = ts_ns / 1e9
                    day = str(datetime.fromtimestamp(ts_sec).date())
                    val = point["value"][0].get("intVal", 0) or int(point["value"][0].get("fpVal", 0))
                    if val > 0:
                        points_by_day[day].append((ts_sec, val))

                prev_day_last_val = None
                for day in sorted(points_by_day.keys()):
                    pts = sorted(points_by_day[day])
                    day_min = pts[0][1]
                    day_max = pts[-1][1]

                    if prev_day_last_val is not None and day_max > prev_day_last_val:
                        steps_today = day_max - prev_day_last_val
                    else:
                        steps_today = day_max - day_min

                    if steps_today > 0:
                        daily_steps[day] = steps_today
                        logger.info(f"  {day}: {steps_today} steps (raw cumulative)")

                    prev_day_last_val = day_max

            # --- Build response ---
            result_list = [{"date": d, "steps": s} for d, s in sorted(daily_steps.items()) if s > 0]

            if result_list:
                total_steps = sum(d["steps"] for d in result_list)
                avg_steps = total_steps // len(result_list)
                logger.info(f"Total steps: {total_steps} over {len(result_list)} days")
            else:
                total_steps = avg_steps = 0
                logger.warning("No step data found after all strategies")

            return {
                "status": "success",
                "total_steps": total_steps,
                "average_steps": avg_steps,
                "period_days": len(result_list),
                "daily_steps": result_list,
                "start_date": str(start_date.date()),
                "end_date": str(end_date.date()),
                "message": f"Found {len(result_list)} days of data" if result_list else "No step data available",
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching steps: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Distance
    # -------------------------------------------------------------------------

    def get_distance(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.distance.delta",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            daily = {}
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            daily[date] = daily.get(date, 0) + val

            result = [{"date": d, "distance_meters": round(v, 2),
                       "distance_km": round(v / 1000, 3),
                       "distance_miles": round(v / 1609.34, 3)}
                      for d, v in sorted(daily.items())]
            total_m = sum(r["distance_meters"] for r in result)
            return {
                "status": "success",
                "total_distance_km": round(total_m / 1000, 3),
                "total_distance_miles": round(total_m / 1609.34, 3),
                "average_distance_km": round(total_m / 1000 / len(result), 3) if result else 0,
                "period_days": len(result),
                "daily_distance": result,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(result)} days" if result else "No distance data available",
            }
        except Exception as e:
            logger.error(f"Error fetching distance: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Calories
    # -------------------------------------------------------------------------

    def get_calories(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.calories.expended",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            daily = {}
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            daily[date] = daily.get(date, 0) + val

            result = [{"date": d, "calories": round(v, 2)} for d, v in sorted(daily.items())]
            total = sum(r["calories"] for r in result)
            return {
                "status": "success",
                "total_calories": round(total, 2),
                "average_calories": round(total / len(result), 2) if result else 0,
                "period_days": len(result),
                "daily_calories": result,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(result)} days" if result else "No calorie data available",
            }
        except Exception as e:
            logger.error(f"Error fetching calories: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Active Minutes
    # -------------------------------------------------------------------------

    def get_active_minutes(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.active_minutes",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            daily = {}
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("intVal", 0) or pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            daily[date] = daily.get(date, 0) + val

            result = [{"date": d, "active_minutes": round(v, 1)} for d, v in sorted(daily.items())]
            total = sum(r["active_minutes"] for r in result)
            return {
                "status": "success",
                "total_active_minutes": round(total, 1),
                "average_active_minutes": round(total / len(result), 1) if result else 0,
                "period_days": len(result),
                "daily_active_minutes": result,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(result)} days" if result else "No active minutes data available",
            }
        except Exception as e:
            logger.error(f"Error fetching active minutes: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Move Minutes (Heart Points)
    # -------------------------------------------------------------------------

    def get_move_minutes(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.heart_minutes",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            daily = {}
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            daily[date] = daily.get(date, 0) + val

            result = [{"date": d, "move_minutes": round(v, 1)} for d, v in sorted(daily.items())]
            total = sum(r["move_minutes"] for r in result)
            return {
                "status": "success",
                "total_move_minutes": round(total, 1),
                "average_move_minutes": round(total / len(result), 1) if result else 0,
                "period_days": len(result),
                "daily_move_minutes": result,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(result)} days" if result else "No move minutes data available",
            }
        except Exception as e:
            logger.error(f"Error fetching move minutes: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Speed
    # -------------------------------------------------------------------------

    def get_speed(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.speed",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            readings.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "speed_mps": round(val, 3),
                                "speed_kmh": round(val * 3.6, 2),
                            })
            speeds = [r["speed_kmh"] for r in readings]
            return {
                "status": "success",
                "max_speed_kmh": round(max(speeds), 2) if speeds else None,
                "average_speed_kmh": round(sum(speeds) / len(speeds), 2) if speeds else None,
                "measurements_count": len(readings),
                "speeds": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else "No speed data available",
            }
        except Exception as e:
            logger.error(f"Error fetching speed: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Power (cycling)
    # -------------------------------------------------------------------------

    def get_power(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.power.sample",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            readings.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "watts": round(val, 2),
                            })
            watts = [r["watts"] for r in readings]
            info = WATCH_REQUIRED_METRICS["power"]
            return {
                "status": "success",
                "average_watts": round(sum(watts) / len(watts), 2) if watts else None,
                "max_watts": round(max(watts), 2) if watts else None,
                "measurements_count": len(readings),
                "readings": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else info["message"],
                "watch_required": not bool(readings),
                "recommended_device": info["recommended_device"] if not readings else None,
                "setup_instructions": info["setup_instructions"] if not readings else None,
            }
        except Exception as e:
            logger.error(f"Error fetching power: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Heart Rate
    # -------------------------------------------------------------------------

    def get_heart_rate(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.heart_rate.bpm",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            readings.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "bpm": round(val, 1),
                            })
            bpms = [r["bpm"] for r in readings]
            info = WATCH_REQUIRED_METRICS["heart_rate"]
            return {
                "status": "success",
                "min_bpm": round(min(bpms), 1) if bpms else None,
                "max_bpm": round(max(bpms), 1) if bpms else None,
                "average_bpm": round(sum(bpms) / len(bpms), 1) if bpms else None,
                "measurements_count": len(readings),
                "heart_rates": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else info["message"],
                "watch_required": not bool(readings),
                "recommended_device": info["recommended_device"] if not readings else None,
                "setup_instructions": info["setup_instructions"] if not readings else None,
            }
        except Exception as e:
            logger.error(f"Error fetching heart rate: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Blood Pressure
    # -------------------------------------------------------------------------

    def get_blood_pressure(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.blood_pressure",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        if len(pt["value"]) >= 2:
                            systolic = pt["value"][0].get("fpVal", 0)
                            diastolic = pt["value"][1].get("fpVal", 0)
                            if systolic > 0 and diastolic > 0:
                                ts = int(bucket["startTimeMillis"]) / 1000
                                readings.append({
                                    "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                    "systolic": round(systolic, 2),
                                    "diastolic": round(diastolic, 2),
                                    "status": self._get_bp_status(systolic, diastolic),
                                })
            info = WATCH_REQUIRED_METRICS["blood_pressure"]
            return {
                "status": "success",
                "readings_count": len(readings),
                "readings": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else info["message"],
                "watch_required": not bool(readings),
                "recommended_device": info["recommended_device"] if not readings else None,
                "setup_instructions": info["setup_instructions"] if not readings else None,
            }
        except Exception as e:
            logger.error(f"Error fetching blood pressure: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Weight
    # -------------------------------------------------------------------------

    def get_weight(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.weight",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            measurements = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(bucket["startTimeMillis"]) / 1000
                            measurements.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "weight_kg": round(val, 2),
                                "weight_lbs": round(val * 2.20462, 2),
                            })

            if not measurements:
                info = WATCH_REQUIRED_METRICS["weight"]
                return {
                    "status": "success",
                    "message": info["message"],
                    "watch_required": True,
                    "recommended_device": info["recommended_device"],
                    "setup_instructions": info["setup_instructions"],
                    "measurements": [], "measurements_count": 0,
                    "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                }

            weights = [m["weight_kg"] for m in measurements]
            return {
                "status": "success",
                "latest_weight_kg": measurements[-1]["weight_kg"],
                "latest_weight_lbs": measurements[-1]["weight_lbs"],
                "min_weight_kg": min(weights),
                "max_weight_kg": max(weights),
                "average_weight_kg": round(sum(weights) / len(weights), 2),
                "measurements_count": len(measurements),
                "measurements": measurements,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
            }
        except Exception as e:
            logger.error(f"Error fetching weight: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Height
    # -------------------------------------------------------------------------

    def get_height(self):
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=3650)  # 10 years back
            data = self._aggregate("com.google.height",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000),
                int((end_date - start_date).total_seconds() * 1000))
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            total_inches = val * 39.3701
                            feet = int(total_inches // 12)
                            inches = round(total_inches % 12, 1)
                            return {
                                "status": "success",
                                "height_meters": round(val, 3),
                                "height_cm": round(val * 100, 1),
                                "height_feet_inches": f"{feet}'{inches}\"",
                                "last_updated": datetime.fromtimestamp(ts).isoformat(),
                            }
            info = WATCH_REQUIRED_METRICS["height"]
            return {
                "status": "success", "message": info["message"],
                "watch_required": False,
                "recommended_device": None,
                "setup_instructions": info["setup_instructions"],
                "height_meters": None, "height_cm": None,
                "height_feet_inches": None, "last_updated": None,
            }
        except Exception as e:
            logger.error(f"Error fetching height: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Body Temperature
    # -------------------------------------------------------------------------

    def get_body_temperature(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.body.temperature",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            readings.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "temperature_celsius": round(val, 2),
                                "temperature_fahrenheit": round(val * 9 / 5 + 32, 2),
                            })
            temps = [r["temperature_celsius"] for r in readings]
            info = WATCH_REQUIRED_METRICS["body_temperature"]
            return {
                "status": "success",
                "average_temp_celsius": round(sum(temps) / len(temps), 2) if temps else None,
                "min_temp_celsius": round(min(temps), 2) if temps else None,
                "max_temp_celsius": round(max(temps), 2) if temps else None,
                "measurements_count": len(readings),
                "readings": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else info["message"],
                "watch_required": not bool(readings),
                "recommended_device": info["recommended_device"] if not readings else None,
                "setup_instructions": info["setup_instructions"] if not readings else None,
            }
        except Exception as e:
            logger.error(f"Error fetching body temperature: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Oxygen Saturation (SpO2)
    # -------------------------------------------------------------------------

    def get_oxygen_saturation(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.oxygen_saturation",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            readings = []
            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            readings.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "spo2_percent": round(val, 1),
                            })
            vals = [r["spo2_percent"] for r in readings]
            info = WATCH_REQUIRED_METRICS["oxygen_saturation"]
            return {
                "status": "success",
                "min_spo2": round(min(vals), 1) if vals else None,
                "max_spo2": round(max(vals), 1) if vals else None,
                "average_spo2": round(sum(vals) / len(vals), 1) if vals else None,
                "measurements_count": len(readings),
                "readings": readings,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(readings)} readings" if readings else info["message"],
                "watch_required": not bool(readings),
                "recommended_device": info["recommended_device"] if not readings else None,
                "setup_instructions": info["setup_instructions"] if not readings else None,
            }
        except Exception as e:
            logger.error(f"Error fetching oxygen saturation: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Sleep
    # -------------------------------------------------------------------------

    def get_sleep(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.sleep.segment",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            sleep_records = []
            total_minutes = 0

            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        start_ns = int(pt.get("startTimeNanos", 0))
                        end_ns = int(pt.get("endTimeNanos", 0))
                        if start_ns > 0 and end_ns > 0:
                            start_ts = start_ns / 1e9
                            end_ts = end_ns / 1e9
                            duration_min = (end_ts - start_ts) / 60
                            stage_num = pt["value"][0].get("intVal", 1)
                            sleep_records.append({
                                "start_time": datetime.fromtimestamp(start_ts).isoformat(),
                                "end_time": datetime.fromtimestamp(end_ts).isoformat(),
                                "duration_minutes": round(duration_min, 1),
                                "stage": self._get_sleep_stage_name(stage_num),
                            })
                            total_minutes += duration_min

            if not sleep_records:
                return {
                    "status": "success",
                    "total_sleep_hours": 0, "total_sleep_minutes": 0,
                    "average_sleep_hours": 0, "nights_recorded": 0,
                    "sleep_records": [], "sleep_schedule": {},
                    "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                    "message": "No sleep data available",
                }

            nights = len(set(r["start_time"][:10] for r in sleep_records))
            schedule = self._calculate_sleep_schedule(sleep_records)
            return {
                "status": "success",
                "total_sleep_hours": round(total_minutes / 60, 2),
                "total_sleep_minutes": round(total_minutes, 1),
                "average_sleep_hours": round(total_minutes / 60 / nights, 2) if nights else 0,
                "nights_recorded": nights,
                "sleep_records": sleep_records,
                "sleep_schedule": schedule,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
            }
        except Exception as e:
            logger.error(f"Error fetching sleep: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Hydration
    # -------------------------------------------------------------------------

    def get_hydration(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        try:
            data = self._aggregate("com.google.hydration",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            entries = []
            total = 0
            days_set = set()
            for bucket in data.get("bucket", []):
                date = str(datetime.fromtimestamp(int(bucket["startTimeMillis"]) / 1000).date())
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        val = pt["value"][0].get("fpVal", 0)
                        if val > 0:
                            ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                            entries.append({
                                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                                "volume_liters": round(val, 3),
                            })
                            total += val
                            days_set.add(date)
            info = WATCH_REQUIRED_METRICS["hydration"]
            return {
                "status": "success",
                "total_liters": round(total, 3),
                "average_liters_per_day": round(total / len(days_set), 3) if days_set else 0,
                "measurements_count": len(entries),
                "entries": entries,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(entries)} entries" if entries else info["message"],
                "watch_required": False,
                "recommended_device": None,
                "setup_instructions": info["setup_instructions"] if not entries else None,
            }
        except Exception as e:
            logger.error(f"Error fetching hydration: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Nutrition
    # -------------------------------------------------------------------------

    def get_nutrition(self, start_date=None, end_date=None, days_back=30):
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        MEAL_TYPES = {1: "Breakfast", 2: "Lunch", 3: "Dinner", 4: "Snack"}
        try:
            data = self._aggregate("com.google.nutrition",
                int(start_date.timestamp() * 1000), int(end_date.timestamp() * 1000), 86400000)
            entries = []
            totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}

            for bucket in data.get("bucket", []):
                for ds in bucket.get("dataset", []):
                    for pt in ds.get("point", []):
                        vals = {
                            v.get("key"): v.get("value", {}).get("fpVal", 0)
                            for v in pt.get("value", []) if "key" in v
                        }
                        meal_type_num = 0
                        for v in pt.get("value", []):
                            if v.get("key") == "meal_type":
                                meal_type_num = int(v.get("value", {}).get("intVal", 0))
                        ts = int(pt.get("startTimeNanos", 0)) / 1e9 or int(bucket["startTimeMillis"]) / 1000
                        entry = {
                            "timestamp": datetime.fromtimestamp(ts).isoformat(),
                            "calories": vals.get("calories"),
                            "protein_g": vals.get("protein.total"),
                            "carbs_g": vals.get("carbs.total"),
                            "fat_g": vals.get("fat.total"),
                            "fiber_g": vals.get("dietary_fiber"),
                            "sugar_g": vals.get("sugar"),
                            "sodium_mg": vals.get("sodium"),
                            "meal_type": MEAL_TYPES.get(meal_type_num),
                        }
                        if any(v is not None for v in entry.values()):
                            entries.append(entry)
                            totals["calories"] += entry["calories"] or 0
                            totals["protein"] += entry["protein_g"] or 0
                            totals["carbs"] += entry["carbs_g"] or 0
                            totals["fat"] += entry["fat_g"] or 0

            info = WATCH_REQUIRED_METRICS["nutrition"]
            return {
                "status": "success",
                "total_calories": round(totals["calories"], 2),
                "total_protein_g": round(totals["protein"], 2),
                "total_carbs_g": round(totals["carbs"], 2),
                "total_fat_g": round(totals["fat"], 2),
                "entries_count": len(entries),
                "entries": entries,
                "start_date": str(start_date.date()), "end_date": str(end_date.date()),
                "message": f"Found {len(entries)} entries" if entries else info["message"],
                "watch_required": False,
                "recommended_device": None,
                "setup_instructions": info["setup_instructions"] if not entries else None,
            }
        except Exception as e:
            logger.error(f"Error fetching nutrition: {e}")
            return {"status": "error", "message": str(e)}

    # -------------------------------------------------------------------------
    # Combined endpoints
    # -------------------------------------------------------------------------

    def get_all_health_data(self, start_date=None, end_date=None, days_back=30):
        """Legacy combined endpoint."""
        return {
            "status": "success",
            "steps": self.get_steps(start_date, end_date, days_back),
            "sleep": self.get_sleep(start_date, end_date, days_back),
            "heart_rate": self.get_heart_rate(start_date, end_date, days_back),
            "blood_pressure": self.get_blood_pressure(start_date, end_date, days_back),
            "weight": self.get_weight(start_date, end_date, days_back),
            "timestamp": datetime.now().isoformat(),
        }

    def get_full_health_data(self, start_date=None, end_date=None, days_back=30):
        """Return every available health metric."""
        if not end_date: end_date = datetime.now()
        if not start_date: start_date = end_date - timedelta(days=days_back)
        logger.info(f"Fetching full health data for {days_back} days")
        return {
            "status": "success",
            # Activity
            "steps":             self.get_steps(start_date, end_date, days_back),
            "distance":          self.get_distance(start_date, end_date, days_back),
            "calories":          self.get_calories(start_date, end_date, days_back),
            "active_minutes":    self.get_active_minutes(start_date, end_date, days_back),
            "move_minutes":      self.get_move_minutes(start_date, end_date, days_back),
            "speed":             self.get_speed(start_date, end_date, days_back),
            "power":             self.get_power(start_date, end_date, days_back),
            # Body
            "heart_rate":        self.get_heart_rate(start_date, end_date, days_back),
            "blood_pressure":    self.get_blood_pressure(start_date, end_date, days_back),
            "weight":            self.get_weight(start_date, end_date, days_back),
            "height":            self.get_height(),
            "body_temperature":  self.get_body_temperature(start_date, end_date, days_back),
            "oxygen_saturation": self.get_oxygen_saturation(start_date, end_date, days_back),
            # Lifestyle
            "sleep":             self.get_sleep(start_date, end_date, days_back),
            "hydration":         self.get_hydration(start_date, end_date, days_back),
            "nutrition":         self.get_nutrition(start_date, end_date, days_back),
            "timestamp": datetime.now().isoformat(),
        }

    # -------------------------------------------------------------------------
    # Debug
    # -------------------------------------------------------------------------

    def debug_data_sources(self):
        logger.info("=" * 50)
        logger.info("DEBUG: Checking available data sources")
        logger.info("=" * 50)
        data_types = [
            "com.google.step_count.cumulative",
            "com.google.step_count.delta",
            "com.google.sleep.segment",
            "com.google.heart_rate.bpm",
            "com.google.weight",
            "com.google.blood_pressure",
            "com.google.calories.expended",
            "com.google.distance.delta",
            "com.google.active_minutes",
            "com.google.heart_minutes",
            "com.google.hydration",
            "com.google.nutrition",
            "com.google.oxygen_saturation",
            "com.google.body.temperature",
            "com.google.height",
            "com.google.speed",
            "com.google.power.sample",
        ]
        results = {}
        for data_type in data_types:
            sources = self.discover_data_sources(data_type)
            results[data_type] = sources
            status = "✓" if sources else "✗"
            logger.info(f"{status} {data_type}: {len(sources)} sources")
        return results

    # -------------------------------------------------------------------------
    # Static helpers
    # -------------------------------------------------------------------------

    @staticmethod
    def _get_sleep_stage_name(stage):
        return {0: "Awake", 1: "Sleep", 2: "Out of bed",
                3: "Light sleep", 4: "Deep sleep", 5: "REM sleep"}.get(stage, f"Unknown ({stage})")

    @staticmethod
    def _get_bp_status(systolic, diastolic):
        if systolic >= 180 or diastolic >= 120:
            return "Hypertensive Crisis"
        elif systolic >= 140 or diastolic >= 90:
            return "High Blood Pressure Stage 2"
        elif systolic >= 130 or diastolic >= 80:
            return "High Blood Pressure Stage 1"
        elif systolic >= 120:
            return "Elevated"
        return "Normal"

    @staticmethod
    def _calculate_sleep_schedule(sleep_records):
        if not sleep_records:
            return {"status": "No data available"}
        try:
            start_hours = []
            for record in sleep_records:
                dt = datetime.fromisoformat(record["start_time"])
                start_hours.append(dt.hour + dt.minute / 60.0)
            if not start_hours:
                return {"status": "Insufficient data"}
            avg_hour = sum(start_hours) / len(start_hours)
            return {
                "average_sleep_start_hour": round(avg_hour, 1),
                "earliest_sleep_hour": min(start_hours),
                "latest_sleep_hour": max(start_hours),
                "consistency_score": round((24 - (max(start_hours) - min(start_hours))) / 24 * 100, 2),
            }
        except Exception as e:
            logger.error(f"Error calculating sleep schedule: {e}")
            return {"status": "Error calculating schedule"}