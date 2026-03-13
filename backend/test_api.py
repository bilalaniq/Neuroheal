"""
Test all 3 migraine model endpoints.
Run with: python test_api.py

Make sure your FastAPI server is running first:
    uvicorn main:app --reload --port 8000
"""

import requests
import json

BASE_URL = "http://localhost:8080"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def print_result(title, response):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    print(f"  Status Code : {response.status_code}")
    try:
        data = response.json()
        print(f"  Response    :\n{json.dumps(data, indent=4)}")
    except Exception:
        print(f"  Raw         : {response.text}")
    print()


def test(title, method, url, body=None):
    try:
        if method == "GET":
            r = requests.get(url, timeout=10)
        else:
            r = requests.post(url, json=body, timeout=10)
        print_result(title, r)
        return r
    except requests.exceptions.ConnectionError:
        print(f"\n❌  CANNOT CONNECT to {url}")
        print("    Make sure the server is running:  uvicorn main:app --reload\n")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 1. Health check — is the server up?
# ─────────────────────────────────────────────────────────────────────────────

print("\n🔍 CHECKING SERVER...")
test("Health Check", "GET", f"{BASE_URL}/health")
test("Models Status", "GET", f"{BASE_URL}/models/status")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Model 1 — Symptom Classification
#    Scenario: Patient with typical migraine with aura
# ─────────────────────────────────────────────────────────────────────────────

print("\n🧠 TESTING MODEL 1 — SYMPTOM CLASSIFICATION")

test(
    "Typical Migraine with Aura",
    "POST",
    f"{BASE_URL}/predict/symptom-type",
    {
        "age": 30,
        "duration": 1,
        "frequency": 5,
        "location": 1,
        "character": 1,
        "intensity": 3,
        "nausea": 1,
        "vomit": 0,
        "phonophobia": 1,
        "photophobia": 1,
        "visual": 2,
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
)

test(
    "Basilar-type Migraine",
    "POST",
    f"{BASE_URL}/predict/symptom-type",
    {
        "age": 25,
        "duration": 2,
        "frequency": 3,
        "location": 1,
        "character": 1,
        "intensity": 3,
        "nausea": 1,
        "vomit": 0,
        "phonophobia": 1,
        "photophobia": 1,
        "visual": 2,
        "sensory": 1,
        "dysphasia": 0,
        "dysarthria": 0,
        "vertigo": 1,          # vertigo present
        "tinnitus": 1,         # tinnitus present
        "hypoacusis": 0,
        "diplopia": 0,
        "defect": 0,
        "ataxia": 0,
        "conscience": 0,
        "paresthesia": 0,
        "dpf": 1
    }
)

test(
    "Mild Migraine without Aura",
    "POST",
    f"{BASE_URL}/predict/symptom-type",
    {
        "age": 40,
        "duration": 1,
        "frequency": 2,
        "location": 1,
        "character": 1,
        "intensity": 2,
        "nausea": 1,
        "vomit": 1,
        "phonophobia": 1,
        "photophobia": 1,
        "visual": 0,           # no aura
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
        "dpf": 0
    }
)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Model 2 — Daily Trigger Prediction
#    3 scenarios: high risk, medium risk, low risk
# ─────────────────────────────────────────────────────────────────────────────

print("\n📅 TESTING MODEL 2 — DAILY TRIGGER PREDICTION")

test(
    "HIGH RISK — Stressful night + alcohol + poor sleep",
    "POST",
    f"{BASE_URL}/predict/migraine-today",
    {
        "stress": 4,
        "lack_of_sleep": 4,
        "red_wine": 3,
        "liquor_or_spirits": 2,
        "dehydration": 3,
        "caffeine": 3,
        "missed_a_meal": 2,
        "loud_sounds": 2,
        "prev_day_migraine": 0
    }
)

test(
    "MEDIUM RISK — Some food triggers + weather change",
    "POST",
    f"{BASE_URL}/predict/migraine-today",
    {
        "chocolate": 2,
        "aged_or_blue_cheese": 2,
        "red_wine": 1,
        "changing_weather": 3,
        "stress": 2,
        "caffeine": 2,
        "prev_day_migraine": 0
    }
)

test(
    "LOW RISK — Healthy day",
    "POST",
    f"{BASE_URL}/predict/migraine-today",
    {
        "stress": 1,
        "lack_of_sleep": 0,
        "dehydration": 0,
        "caffeine": 1,
        "prev_day_migraine": 0
    }
)

test(
    "HIGH RISK — Had migraine yesterday + poor sleep",
    "POST",
    f"{BASE_URL}/predict/migraine-today",
    {
        "prev_day_migraine": 1,
        "lack_of_sleep": 3,
        "overslept": 0,
        "stress": 2,
        "bright_or_flashing_lights": 2,
        "dehydration": 2
    }
)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Model 3 — Sleep Assessment
# ─────────────────────────────────────────────────────────────────────────────

print("\n😴 TESTING MODEL 3 — SLEEP ASSESSMENT")

test(
    "Poor Sleep — Migraine-like pattern",
    "POST",
    f"{BASE_URL}/predict/sleep",
    {
        "total_sleep_minutes": 300,        # only 5 hours
        "sleep_onset_minutes": 45,         # took 45 min to fall asleep
        "rem_percent": 10.0,               # very low REM
        "deep_sleep_percent": 8.0,         # very low deep sleep
        "wake_percent": 15.0,              # woke up a lot
        "sleep_efficiency": 72.0           # low efficiency
    }
)

test(
    "Good Sleep — Normal pattern",
    "POST",
    f"{BASE_URL}/predict/sleep",
    {
        "total_sleep_minutes": 450,        # 7.5 hours
        "sleep_onset_minutes": 12,         # fell asleep quickly
        "rem_percent": 22.0,               # healthy REM
        "deep_sleep_percent": 18.0,        # healthy deep sleep
        "wake_percent": 5.0,               # minimal waking
        "sleep_efficiency": 92.0           # high efficiency
    }
)

test(
    "Sleep with PSQI Score",
    "POST",
    f"{BASE_URL}/predict/sleep",
    {
        "total_sleep_minutes": 360,
        "sleep_onset_minutes": 30,
        "rem_percent": 15.0,
        "deep_sleep_percent": 12.0,
        "sleep_efficiency": 80.0,
        "psqi_score": 9.0                  # poor sleep quality (>5 = poor)
    }
)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Full Assessment — all 3 models in one call
# ─────────────────────────────────────────────────────────────────────────────

print("\n🔮 TESTING FULL ASSESSMENT — ALL 3 MODELS AT ONCE")

test(
    "Full Assessment — High Risk Patient",
    "POST",
    f"{BASE_URL}/predict/full",
    {
        "symptom_data": {
            "age": 32,
            "duration": 2,
            "frequency": 4,
            "location": 1,
            "character": 1,
            "intensity": 3,
            "nausea": 1,
            "vomit": 0,
            "phonophobia": 1,
            "photophobia": 1,
            "visual": 2,
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
        },
        "trigger_data": {
            "stress": 4,
            "lack_of_sleep": 3,
            "caffeine": 3,
            "dehydration": 2,
            "red_wine": 2,
            "prev_day_migraine": 0
        },
        "sleep_data": {
            "total_sleep_minutes": 320,
            "sleep_onset_minutes": 40,
            "rem_percent": 12.0,
            "deep_sleep_percent": 9.0,
            "sleep_efficiency": 74.0
        }
    }
)

test(
    "Full Assessment — Only Triggers (no sleep or symptoms)",
    "POST",
    f"{BASE_URL}/predict/full",
    {
        "trigger_data": {
            "stress": 2,
            "caffeine": 1,
            "prev_day_migraine": 0
        }
    }
)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Edge cases — invalid input
# ─────────────────────────────────────────────────────────────────────────────

print("\n⚠️  TESTING EDGE CASES")

test(
    "Missing required field (should return 422)",
    "POST",
    f"{BASE_URL}/predict/symptom-type",
    {
        "age": 30
        # missing all other required fields
    }
)

test(
    "Empty trigger request (all zeros — should return LOW risk)",
    "POST",
    f"{BASE_URL}/predict/migraine-today",
    {}
)

print("\n✅ ALL TESTS COMPLETE")
print("   Check responses above for predictions and confidence scores.\n")