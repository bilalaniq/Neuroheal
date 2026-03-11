https://youtu.be/NVT3C7X6870
 
 # MyGraine - Personalized migraine prevention, detection and treatment

**An intelligent mobile application that combines health tracking, AI-powered insights, and machine learning to help users prevent and manage migraines effectively.**

---

## 🎯 Project Overview

MyGraine is a comprehensive migraine prevention and management system that integrates multiple data sources to provide personalized insights and predictions. The platform consists of:

Unlike traditional ML systems, MyGraine's model **learns and improves in real-time** from user feedback, making it increasingly personalized and accurate with continued use.

---

## ✨ Core Features

### 📱 Mobile Application

#### **1. Comprehensive Health Tracking**
- **Manual Tracking**: Daily meals, hydration, alcohol consumption
- **Device Metrics**: Steps, sleep quality, heart rate, screen time, screen brightness, outdoor brightness, usage accuracy
- **External Sources**: Calendar integration (stress from meetings), weather conditions, barometric pressure

#### **2. Smart Dashboard**
- Real-time health status overview with color-coded indicators (Critical → Excellent)
- Pattern detection with automatic warnings for concerning trends
- Integration with multiple data sources for holistic health view
- Dark mode support throughout the app

#### **3. Migraine Tracking & Logging**
- Quick migraine entry with intensity slider (1-5 scale)
- Symptom selection (aura, nausea, vomiting, light/sound sensitivity, etc.)
- Duration tracking and personal notes
- AI-powered pattern analysis and insights

#### **4. AI-Powered Insights (Gemini Integration)**
- Personalized health analysis based on all tracked metrics
- Trigger pattern identification
- Preventive recommendations
- Real-time generation of actionable insights
- Stylish loading screens with dismiss functionality

#### **5. Comprehensive Analytics**
- 30-day trend visualization with line charts
- Migraine frequency and severity tracking
- Sleep quality, stress levels, and hydration correlations
- Export reports for healthcare professionals

#### **6. Emergency Support**
- Quick access to migraine relief tips
- Immediate help button on home screen
- Emergency contact information

#### **7. Seamless Onboarding**
- Three-step guided setup process
- Personal information (name, age bracket)
- Integration selection (health, device, external sources)
- Immediate dashboard population with realistic mock data

### 🧠 Backend & Machine Learning

#### **Real-Time Model Training**
- **Online Learning**: Model performs backward passes on user feedback instantly
- **Experience Replay**: 100-sample buffer prevents catastrophic forgetting
- **Confidence-Based Updates**: Only updates when prediction confidence < 80%
- **Auto-Save**: Periodic model checkpoints to Google Cloud Storage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Dashboard  │  │   Tracking   │  │   Analytics     │  │
│  │   Warnings   │  │   AI Insights│  │   Reports       │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│           │                │                    │           │
│           └────────────────┴────────────────────┘           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Prediction  │  │  Online      │  │   Gemini AI     │  │
│  │  Service     │  │  Learning    │  │   Integration   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│           │                │                    │           │
│           └────────────────┴────────────────────┘           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Cloud Platform                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Vertex AI   │  │  Cloud Run   │  │   Cloud Storage │  │
│  │  (Training)  │  │  (Serving)   │  │   (Models/Data) │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Mobile
- **Framework**: React Native (Expo SDK 51)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **State Management**: React Context API
- **UI Components**: Custom + Expo Icons
- **Charts**: Custom line chart implementation
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **ML Framework**: PyTorch
- **Data Processing**: Pandas, NumPy, scikit-learn
- **API Validation**: Pydantic
- **Async Runtime**: uvicorn
- **AI Integration**: Google Gemini API

### Cloud & DevOps
- **Cloud Platform**: Google Cloud Platform
- **Training**: Vertex AI
- **Serving**: Cloud Run (containerized)
- **Storage**: Google Cloud Storage
- **CI/CD**: GitHub Actions (optional)
- **Monitoring**: Cloud Logging & Monitoring

---

## 🎓 Use Cases

### For Patients
- Track health metrics easily
- Identify migraine triggers
- Get personalized AI recommendations
- Share reports with doctors
- Prevent migraines proactively

### For Healthcare Providers
- Review comprehensive 30-day reports
- Analyze patient patterns
- Data-driven treatment decisions
- Track medication effectiveness
- Remote patient monitoring

### For Researchers
- Collect anonymized migraine data
- Study trigger patterns at scale
- Validate ML models
- Improve classification accuracy
- Contribute to migraine research



**Built with ❤️ for the Aava & Pfizer Hackathon Challenge**
