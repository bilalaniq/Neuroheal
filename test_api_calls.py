"""
Test script showing all API endpoints with user-controllable parameters.
No hardcoded values - everything is YOUR CHOICE!

Usage:
    python test_api_calls.py
"""

import requests
import json
import sys
from datetime import datetime

API_URL = "http://localhost:8080"

# ============================================================================
# USER CONFIGURABLE PARAMETERS - CHANGE THESE!
# ============================================================================

# User identifier (your choice)
USER_ID = "test_user_1"

# Symptom severity (0-3 scale, your choice)
SYMPTOMS = {
    "age": 35,
    "duration": 2,          # 0-3 scale
    "frequency": 5,         # 0-7 scale (higher = more frequent)
    "location": 1,          # 0 or 1
    "character": 1,         # 0 or 1
    "intensity": 3,         # 0-3 scale
    "nausea": 1,           # 0 or 1
    "vomit": 1,            # 0 or 1
    "phonophobia": 1,      # 0 or 1 (sensitivity to sound)
    "photophobia": 1,      # 0 or 1 (sensitivity to light)
    "visual": 2,           # 0-3 scale
    "sensory": 0,          # 0 or 1
    "dysphasia": 0,        # 0 or 1
    "dysarthria": 0,       # 0 or 1
    "vertigo": 0,          # 0 or 1
    "tinnitus": 0,         # 0 or 1
    "hypoacusis": 0,       # 0 or 1
    "diplopia": 0,         # 0 or 1
    "defect": 0,           # 0 or 1
    "ataxia": 0,           # 0 or 1
    "conscience": 0,       # 0 or 1
    "paresthesia": 0,      # 0 or 1
    "dpf": 0               # 0 or 1 (family history)
}

# ============================================================================

def print_header(title):
    """Print formatted header."""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_health():
    """Test health endpoint."""
    print_header("TEST 1: Health Check (No Parameters)")
    
    try:
        response = requests.get(f"{API_URL}/health")
        data = response.json()
        
        print("📊 Response:")
        print(json.dumps(data, indent=2))
        print(f"✅ Status: {data.get('status')}")
        print(f"📦 Mode: {data.get('mode', 'UNKNOWN')}")
        print(f"🔧 Demo enabled: {data.get('demo_enabled', False)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True


def test_config():
    """Test config endpoint."""
    print_header("TEST 2: View Configuration")
    
    try:
        response = requests.get(f"{API_URL}/config")
        data = response.json()
        
        print(f"📦 Current Mode: {data.get('mode')}")
        print(f"🔧 Demo Enabled: {data.get('demo_enabled')}")
        print(f"\n📋 Available Classes:")
        for cls in data.get('available_classes', []):
            print(f"   • {cls}")
        
        print(f"\n📁 Data Locations:")
        for loc, path in data.get('data_locations', {}).items():
            print(f"   • {loc}: {path}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True


def test_predict(custom_symptoms=None, custom_user_id=None):
    """Test prediction endpoint."""
    user_id = custom_user_id or USER_ID
    symptoms = custom_symptoms or SYMPTOMS
    
    print_header(f"TEST 3: Make Prediction (User: {user_id})")
    
    print("📝 Input Symptoms:")
    print(json.dumps({k: symptoms[k] for k in list(symptoms.keys())[:10]}, indent=2))
    print(f"   ... and {len(symptoms) - 10} more fields")
    
    try:
        response = requests.post(
            f"{API_URL}/predict?user_id={user_id}",
            json=symptoms,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ Prediction Result:")
            print(f"   Predicted: {data.get('prediction')}")
            print(f"   Confidence: {data.get('confidence', 0)*100:.2f}%")
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            
            print(f"\n📊 All Probabilities:")
            probs = data.get('all_probabilities', {})
            for class_name, prob in sorted(probs.items(), key=lambda x: x[1], reverse=True)[:3]:
                print(f"   • {class_name}: {prob*100:.2f}%")
            
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_feedback(predicted_label, true_label, custom_user_id=None):
    """Test feedback endpoint."""
    user_id = custom_user_id or USER_ID
    
    print_header(f"TEST 4: Store User Feedback (Correction)")
    
    print(f"User ID: {user_id}")
    print(f"Model predicted: {predicted_label}")
    print(f"User corrects to: {true_label}")
    
    try:
        response = requests.post(
            f"{API_URL}/feedback",
            params={
                "user_id": user_id,
                "predicted": predicted_label,
                "true_label": true_label
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Feedback stored!")
            print(f"   Correct prediction: {data.get('was_correct')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_export_data():
    """Test data export endpoint."""
    print_header("TEST 5: View Data Summary")
    
    try:
        response = requests.post(f"{API_URL}/export-data")
        data = response.json()
        
        print("📊 Data Summary:")
        print(f"   Predictions collected: {data.get('predictions_count', 0)}")
        print(f"   Unique users: {data.get('unique_users', 0)}")
        print(f"   Feedback collected: {data.get('feedback_count', 0)}")
        if 'accuracy_from_feedback' in data:
            print(f"   Model accuracy (from feedback): {data.get('accuracy_from_feedback')}")
        
        print(f"\n📁 Storage Locations:")
        print(f"   Predictions: {data.get('predictions_file')}")
        print(f"   Feedback: {data.get('feedback_file')}")
        print(f"   Mode: {data.get('mode')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_reset_data():
    """Test reset endpoint (DEBUG mode only)."""
    print_header("TEST 6: Reset Data (DEBUG Mode Only)")
    
    try:
        response = requests.delete(f"{API_URL}/reset-data")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Data reset successful!")
            print(f"   Status: {data.get('status')}")
            print(f"   Message: {data.get('message')}")
            print(f"   Mode: {data.get('mode')}")
            return True
        elif response.status_code == 403:
            print(f"⚠️  Reset only available in DEBUG mode")
            print(f"   Use: set APP_MODE=debug")
            return False
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "MIGRAINE API - COMPREHENSIVE TEST SUITE" + " "*14 + "║")
    print("║" + " "*12 + "No hardcoded parameters - YOUR CHOICE!" + " "*16 + "║")
    print("╚" + "="*68 + "╝")
    
    print(f"\n🌐 API URL: {API_URL}")
    print(f"👤 Test User: {USER_ID}")
    print(f"📝 Using {len(SYMPTOMS)} symptom parameters (customize in script)")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("Configuration", test_config()))
    
    if results[-1][1]:  # Only continue if config works
        results.append(("Prediction", test_predict()))
        
        if results[-1][1]:  # Only if prediction worked
            time_test = test_predict()
            if time_test:
                # Use the predicted result for feedback
                results.append(("Feedback Storage", test_feedback("Migraine with aura", "Migraine without aura")))
    
    results.append(("Data Export", test_export_data()))
    results.append(("Reset Data (DEBUG)", test_reset_data()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {test_name}")
    
    print(f"\n{'='*70}")
    print(f"Result: {passed}/{total} tests passed")
    print(f"{'='*70}\n")
    
    if passed == total:
        print("🎉 All tests passed! API is ready to use!")
    else:
        print("⚠️  Some tests failed. Check API is running on port 8080")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹  Tests interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
