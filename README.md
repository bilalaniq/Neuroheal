# NEURO:HΞAL — Migraine Tracker & Health Monitor

> A user-friendly gateway to your healthier lifestyle journey.

NeuroHeal is a React Native (Expo) mobile application that helps migraine sufferers track episodes, monitor health vitals, predict daily migraine risk, and receive AI-powered health insights — all in one place.

---
## 📱 Screenshots

| Splash                              | Login                               | Home                                | Migraine Tracking                   |
| ----------------------------------- | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| <img src="./img/1.png" width="300"> | <img src="./img/2.png" width="300"> | <img src="./img/3.png" width="300"> | <img src="./img/4.png" width="300"> |





---

## ✨ Features

### 🔴 Migraine Tracking
- **Quick Log** — Log a migraine episode during or after an attack across 4 guided steps: intensity, symptoms, triggers & medication, and details
- **Migraine Calendar** — Visual calendar showing all logged episodes with severity colour coding
- **Neuro Record** — Combined view of the migraine calendar and report chart with summary stats (total episodes, avg intensity, top trigger)


| Classify                            | Neuro Record                        |
| ----------------------------------- | ----------------------------------- |
| <img src="./img/5.png" width="300"> | <img src="./img/6.png" width="300"> |






### 🤖 AI Features
- **NeuroRecord AI Chat** — Conversational AI health assistant powered by Claude; ask questions about your migraines, get insights, and track your journey
- **AI Health Analysis** — Full structured analysis of your migraine data including pattern assessment, risk factors, sleep connections, medication insights, and actionable recommendations
- **AI Insight Buttons** — Context-aware AI insights available on Sleep Assessment, Morning Risk Check, and Migraine Classification results


| AI chat                             | AI chat example                     |
| ----------------------------------- | ----------------------------------- |
| <img src="./img/7.png" width="300"> | <img src="./img/8.png" width="300"> |


### 📊 Health Dashboard
- **Sleep** — Average sleep hours over the last 7 days
- **Blood Pressure** — Latest reading with status (Normal / Elevated / High)
- **Steps** — Total step count over the last 7 days
- **Weight** — Latest reading from connected scale
- **Sleep Schedule** — Average bedtime and wake time pattern
- **Stress Level** — Manual logging (coming soon)
- **Weather** — Real-time temperature and conditions with link to 5-day forecast

| Dashboard                           | Weather                              |
| ----------------------------------- | ------------------------------------ |
| <img src="./img/9.png" width="300"> | <img src="./img/10.png" width="300"> |




### 🩺 Clinical Tools (Logging Hub)

| Tab            | Description                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Quick Log**  | 4-step episode logger for symptoms, triggers, medication, and notes                                                                       |
| **Classify**   | ML-powered migraine type classification (with aura, basilar, etc.) based on 20+ clinical symptoms                                         |
| **Daily Risk** | Morning risk check using sleep, stress, anxiety, hydration, and 15 environmental toggle triggers                                          |
| **Sleep**      | Sleep quality assessment comparing your REM %, deep sleep %, onset time, and total hours against migraine and healthy population averages |

### 🚨 Emergency
- SOS Emergency screen for rapid access during severe episodes
- Direct link from home screen quick tools row

<img src="./img/11.png" width="300">

<br>


### 📄 Export & Reports
- Full PDF health report including vitals, severity breakdown, top triggers, symptoms, medications, and recent episodes
- Optional AI Health Analysis section embedded in the PDF
- Share via native share sheet on iOS and Android

<img src="./img/12.png" width="300">

<br>


### 🔔 Pattern Warnings
- Automatic detection of high-confidence migraine trigger patterns (e.g. poor sleep, stress)
- Confidence percentage shown per pattern
- "View all patterns" link to the patterns screen

<img src="./img/13.png" width="300">

<br>



---

## 🏗 Tech Stack


| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| **Framework**   | React Native + Expo (SDK 51+)                                      |
| **Navigation**  | Expo Router (file-based)                                           |
| **Language**    | TypeScript                                                         |
| **Styling**     | React Native StyleSheet                                            |
| **Icons**       | @expo/vector-icons (Ionicons)                                      |
| **Gradients**   | expo-linear-gradient                                               |
| **Blur**        | expo-blur                                                          |
| **Location**    | expo-location                                                      |
| **PDF Export**  | expo-print + expo-sharing                                          |
| **AI**          | groq                                                               |
| **Weather API** | Open-Meteo (free, no key needed)                                   |
| **Fitness API** | Google Fitness API (OAuth 2.0, tracks steps, calories, heart rate) |
| **Backend**     | Custom REST API (Python/FastAPI)                                   |
| **State**       | React Context (UserContext, ThemeContext)                          |


---

## 📁 Project Structure


```bash
project
│
├── 📁 backend/                 # Python FastAPI Backend
│   ├── 📁 artifacts/           # Generated artifacts/models
│   ├── 📁 data/                # Data files
│   ├── 📁 venv/                # Python virtual environment
│   ├── 📁 __pycache__/         # Python cache
│   ├── .env                    # Environment variables
│   ├── .env.example            # Example environment variables
│   ├── .dockerignore           
│   ├── bigquery_schema.json    # BigQuery schema definition
│   ├── config.py               # Configuration settings
│   ├── credentials.json        # Google service credentials
│   ├── Dockerfile              # Docker configuration
│   ├── get-pip.py              # Pip installer script
│   ├── google_fit_service.py   # Google Fit API integration
│   ├── main.py                 # Main FastAPI application
│   ├── migraine_logs.json      # Migraine logs data
│   ├── migraine_service.py     # Migraine business logic
│   ├── model.py                # Data models
│   ├── README.md               # Backend documentation
│   ├── requirements.txt        # Python dependencies
│   ├── schemas.py              # Pydantic schemas
│   ├── test_api.py             # API tests
│   ├── token.pickle            # OAuth token storage
│   └── __init__.py             # Python package init
│
├── 📁 data/                     # Data Directory
│   ├── 📁 .venv/                # Virtual environment
│   ├── 📁 data_set/             # Dataset files
│   ├── 📁 migraine_data/        # Migraine specific data
│   ├── 📁 migraine_symptom_classification/ # ML classification data
│   ├── 📁 sleep_model/          # Sleep model data
│   └── 📁 src/                   # Data source scripts
│
├── 📁 img/                       # Images and assets
│
├── 📁 mobile/                    # React Native Expo App
│   ├── 📁 .expo/                 # Expo configuration
│   ├── 📁 .idea/                 # IDE settings
│   ├── 📁 .vscode/               # VS Code settings
│   ├── 📁 android/               # Android native files
│   ├── 📁 app/                    # Main application code (Expo Router)
│   │   ├── 📁 (tabs)/             # Tab navigation screens
│   │   ├── 📁 auth/               # Authentication screens
│   │   ├── _layout.tsx            # Root layout
│   │   └── index.tsx              # Entry screen
│   ├── 📁 assets/                  # Static assets
│   │   ├── 📁 fonts/               # Custom fonts
│   │   ├── 📁 images/              # Images
│   │   └── 📁 icons/               # Icons
│   ├── 📁 components/               # Reusable components
│   │   ├── MigraineCalendar.tsx    # Calendar component
│   │   ├── MigraineReportChart.tsx # Chart component
│   │   ├── ModernHeader.tsx        # Header component
│   │   └── ...                     # Other components
│   ├── 📁 config/                   # Configuration files
│   ├── 📁 constants/                 # App constants
│   ├── 📁 contexts/                  # React Context
│   │   ├── ThemeContext.tsx         # Theme management
│   │   └── UserContext.tsx          # User state management
│   ├── 📁 hooks/                     # Custom hooks
│   │   └── useRealtimeMonitoring.ts # Real-time monitoring hook
│   ├── 📁 node_modules/              # NPM dependencies
│   ├── 📁 scripts/                   # Utility scripts
│   ├── 📁 services/                   # API services
│   │   ├── api.ts                     # API client
│   │   ├── auth.ts                     # Authentication service
│   │   └── weather.ts                  # Weather service
│   ├── 📁 utils/                       # Utility functions
│   ├── .env                            # Environment variables
│   ├── .gitignore                      # Git ignore rules
│   ├── app.json                        # Expo configuration
│   ├── eas.json                        # EAS Build configuration
│   ├── eslint.config.js                # ESLint config
│   ├── eslint.config.mjs               # ESLint module config
│   ├── expo-env.d.ts                   # Expo type definitions
│   ├── FINAL_ASSESSMENT.md              # Final assessment doc
│   ├── FINAL_VERIFICATION.md            # Final verification doc
│   ├── MOBILE_APP_GUIDE.md              # Mobile app guide
│   ├── package.json                     # NPM dependencies
│   ├── package-lock.json                # Locked dependencies
│   ├── PROJECT_COMPLETE.md              # Project completion doc
│   ├── README.md                        # Mobile app documentation
│   └── tsconfig.json                    # TypeScript configuration
│
├── .dockerignore                  # Docker ignore file
├── .env.local                     # Local environment variables
├── .gitignore                     # Git ignore rules
├── cloudbuild.yaml                 # Google Cloud Build config
├── howto.txt                       # Setup instructions
├── package-lock.json               # Root package lock
├── README.md                       # Main project documentation
├── requirements.txt                 # Python dependencies
├── setup.sh                         # Setup script
├── start_api.bat                    # Windows API starter
├── start_api.ps1                     # PowerShell API starter
├── temp.txt                          # Temporary file
└── test_api_calls.py                 # API test script

```


---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator / Android Emulator or physical device with Expo Go

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/neuroheal.git

cd Neuroheal


cd mobile

# Install dependencies
npm install

# Start the development server
npx expo start

# or use 

npx expo run:android

```

### Backend Setup

The app requires a running backend server for health data, migraine episode storage, and ML predictions.


>[!NOTE]
> i will be using wsl for backend

```bash
# In your backend directory
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload        # for wsl 

uvicorn main:app --port 8080 --reload        # for the same machine 

```

Then update `BACKEND_URL` in `app/(tabs)/index.tsx` and `config/api.ts`:

```ts
// for web 
const BACKEND_URL = 'http://localhost:8080'; 
```





to get the ip of wsl machine

```bash
hostname -I
```

place the ip here

```ts
const BACKEND_URL = 'http://192.168.X.X:8080';
```


## ML predictions

For ML predictions do these steps


```bash
cd data

cd src

python migraine_data_train.py
python migraine_symptom_classification_train.py
python sleep_train.py

# run these three files to get the ML prediction setup ready

```


### AI Setup

go to https://console.groq.com/

and create an api key 

Add your groq API key in `.env` files in the mobile folder :



```ts
# ================================
# NeuroHeal Mobile App - Environment
# ================================

EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---


## 👥 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---


*Built with ❤️ to help migraine sufferers understand and manage their condition.*