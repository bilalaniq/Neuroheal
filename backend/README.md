# 🧠 Migraine Classifier API

> A FastAPI backend that pulls real-time health data from Google Fit and your connected devices — built to power a migraine classification model.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Health Data Status](#health-data-status)
- [Device Requirements](#device-requirements)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)

---

## Overview

This backend connects to the **Google Fit API** using OAuth 2.0 to retrieve real health data from your Xiaomi phone (and future wearables). It exposes clean REST endpoints for every health metric — steps, calories, sleep, heart rate, SpO2, and more — ready to feed into a migraine prediction model.

When a metric requires a smartwatch and none is connected, the API responds with clear setup instructions rather than a generic error.

---

## ✨ Features

- 🔐 **OAuth 2.0** authentication with automatic token refresh
- 📱 **Xiaomi phone support** — fixes the cumulative step count sync issue with a two-strategy fallback
- ⌚ **Watch-ready** — all watch-dependent endpoints exist now; data flows in automatically once a device is connected
- 🩺 **16 health metrics** across activity, body, and lifestyle categories
- 💬 **Smart empty responses** — tells you exactly what device you need when data is missing
- 🔄 **Online learning ready** — model architecture supports real-time updates from user feedback
- ☁️ **Cloud Run ready** — Docker containerized for easy GCP deployment

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| Health Data | Google Fit REST API |
| Auth | Google OAuth 2.0 |
| ML Model | PyTorch (MigraineClassifier) |
| Validation | Pydantic v2 |
| Cloud | Google Cloud Run + GCS + BigQuery |
| Language | Python 3.13 |

---

## ⚙️ Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Add Google credentials

Place your `credentials.json` (from Google Cloud Console) in the backend folder.

```
backend/
├── credentials.json   ← put it here
├── main.py
├── google_fit_service.py
└── ...
```

> **Get credentials:** Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Desktop app) → Download JSON

### 3. Configure environment

```bash
cp .env.example .env
```

Key settings in `.env`:

```env
USE_GOOGLE_FIT=true
GOOGLE_FIT_CREDENTIALS_FILE=credentials.json
GOOGLE_FIT_TOKEN_FILE=token.pickle
GEMINI_API_KEY=your_key_here
USE_BIGQUERY=false
USE_GCS=false
```

### 4. Run the server

```bash
uvicorn main:app --reload --port 8080
```

On first run, a browser will open for Google OAuth login. Accept all permissions. A `token.pickle` file will be saved for future runs.

### 5. Test it

```bash
curl http://localhost:8080/health
curl "http://localhost:8080/health/full?days=7"
```

---

## 📡 API Endpoints

### Core

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API health check |
| `GET` | `/health` | API health check |
| `GET` | `/health/full?days=N` | **All metrics in one call** |
| `GET` | `/health/all?days=N` | Legacy combined endpoint |

### Activity

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/steps?days=N` | Daily step counts |
| `GET` | `/health/distance?days=N` | Distance in km/miles |
| `GET` | `/health/calories?days=N` | Calories burned |
| `GET` | `/health/active-minutes?days=N` | Active minutes per day |
| `GET` | `/health/move-minutes?days=N` | Heart/move minutes |
| `GET` | `/health/speed?days=N` | Speed readings (km/h) |
| `GET` | `/health/power?days=N` | Cycling power (watts) |

### Body Metrics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/heart-rate?days=N` | Heart rate BPM |
| `GET` | `/health/blood-pressure?days=N` | Systolic / Diastolic |
| `GET` | `/health/weight?days=N` | Weight (kg + lbs) |
| `GET` | `/health/height` | Height (m, cm, ft/in) |
| `GET` | `/health/body-temperature?days=N` | Temp (°C + °F) |
| `GET` | `/health/oxygen-saturation?days=N` | SpO2 % |

### Lifestyle

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/sleep?days=N` | Sleep stages + schedule |
| `GET` | `/health/hydration?days=N` | Water intake (liters) |
| `GET` | `/health/nutrition?days=N` | Calories, macros per meal |

### Debug

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/debug` | All data sources + today's steps |
| `GET` | `/health/test-steps?days=N` | Detailed step debugging |
| `GET` | `/health/today` | Today's steps specifically |

---

## 📊 Health Data Status

Current status with a Xiaomi phone (no watch connected):

| Metric | Status | Source |
|---|---|---|
| Steps | ✅ Live | Xiaomi phone pedometer |
| Distance | ✅ Live | Derived from steps |
| Calories | ✅ Live | Derived from steps |
| Active Minutes | ✅ Live | Google Fit derived |
| Speed | ✅ Live | Xiaomi phone GPS |
| Weight | ✅ Live | Mi Scale (synced) |
| Sleep | ⏳ Waiting | Needs Mi Fitness sync |
| Heart Rate | ⌚ Watch needed | Requires smartwatch |
| SpO2 | ⌚ Watch needed | Requires smartwatch |
| Body Temperature | ⌚ Watch needed | Requires smartwatch |
| Blood Pressure | ⌚ Device needed | Requires BP monitor |
| Height | 📝 Manual entry | Enter in Google Fit app |
| Hydration | 📝 Manual entry | Log in Google Fit app |
| Nutrition | 📝 Manual entry | Connect MyFitnessPal |
| Power | 🚴 Cycling sensor | Requires power meter |

---

## ⌚ Device Requirements

When a metric has no data, the API tells you exactly what to get:

```json
{
  "status": "success",
  "measurements_count": 0,
  "message": "No heart rate data. A smartwatch/band synced to Google Fit is required.",
  "watch_required": true,
  "recommended_device": "Xiaomi Smart Band 9 Pro / Fitbit Charge 6 / Galaxy Watch",
  "setup_instructions": "1. Buy a smartwatch. 2. Install Mi Fitness or Fitbit app. 3. Connect to Google Fit via app settings."
}
```

### Recommended devices by metric

| Metric | Recommended Device | Approx. Cost |
|---|---|---|
| Heart rate, SpO2, Temperature | Xiaomi Smart Band 9 Pro | ~$50 |
| Weight | Xiaomi Mi Scale 2 | ~$20 |
| Blood pressure | Omron blood pressure monitor | ~$40 |
| Cycling power | Wahoo / Garmin power meter | ~$200+ |

> **Zero code changes needed.** Once a device syncs to Google Fit, all endpoints automatically return real data.

---

## 🗂 Project Structure

```
backend/
├── main.py                  # FastAPI app, all route definitions
├── google_fit_service.py    # Google Fit API integration (all 16 metrics)
├── schemas.py               # Pydantic request/response models
├── model.py                 # PyTorch MigraineClassifier neural network
├── config.py                # Environment settings
├── credentials.json         # Google OAuth credentials (not committed)
├── token.pickle             # Saved OAuth token (not committed)
├── requirements.txt         # Python dependencies
└── Dockerfile               # Cloud Run container
```

### Model Architecture

```
Input (50 features)
    ↓
Linear(50 → 64) + BatchNorm + ReLU + Dropout
    ↓
Linear(64 → 32) + BatchNorm + ReLU + Dropout
    ↓
Linear(32 → 8)
    ↓
Output: 8 migraine classes
```

**Classes:**
- No migraine
- Migraine without aura
- Migraine with aura
- Typical aura with migraine
- Typical aura without migraine
- Familial hemiplegic migraine
- Basilar-type aura
- Other

---

## 🗺 Roadmap

- [x] Google Fit OAuth integration
- [x] Steps with Xiaomi cumulative fix
- [x] 16 health metric endpoints
- [x] Watch-required smart responses
- [x] Weight from Mi Scale
- [ ] Re-authenticate token for body temperature / SpO2 / blood pressure scopes
- [ ] Connect smartwatch for heart rate + SpO2
- [ ] Sleep data sync from Mi Fitness
- [ ] Frontend dashboard
- [ ] Migraine classifier model integration
- [ ] Online learning from user feedback
- [ ] BigQuery logging
- [ ] Cloud Run deployment

---

## 🔒 Notes

- `credentials.json` and `token.pickle` are **never committed** to version control
- If you get 403 errors, delete `token.pickle` and restart — a fresh OAuth flow will request all required scopes
- The Xiaomi step sync uses a two-strategy fallback: delta aggregate first, raw cumulative dataset second

---

*Built for migraine pattern research and personal health tracking.*