# Migraine Tracking Mobile App - Complete Guide

## 📱 App Overview
A comprehensive React Native + Expo migraine tracking application with dark mode support, real-time tracking, analytics, and intelligent pattern detection.

**Framework:** React Native + Expo Router  
**State Management:** React Context (UserContext, ThemeContext)  
**Storage:** AsyncStorage (persistent data)  
**Icons:** Ionicons  
**Platform:** iOS & Android via Expo

---

## 🎯 App Structure

### Navigation Architecture
- **Base:** Expo Router with Tab-based navigation
- **Tab Bar:** Hidden (users navigate via feature grid on home)
- **Structure:** All feature screens as dynamic routes accessible via home screen

### Current Features (13 Screens)

| Screen                  | Purpose                                          | File                      |
| ----------------------- | ------------------------------------------------ | ------------------------- |
| **Home**                | Dashboard hub, emergency button, feature grid    | `index.tsx`               |
| **Migraine Timer**      | Real-time migraine duration tracking             | `migraine-timer.tsx`      |
| **Pattern Detection**   | Analyze migraine triggers with confidence scores | `pattern-detection.tsx`   |
| **Analytics Dashboard** | View trends, charts, statistics                  | `analytics-dashboard.tsx` |
| **Quick Log**           | Fast symptom logging with accessibility          | `quick-actions.tsx`       |
| **Reminders**           | Medication & tracking reminders, scheduling      | `notifications.tsx`       |
| **Journal**             | Mood + weather + trigger journaling              | `enhanced-diary.tsx`      |
| **Settings**            | Medications, comorbidities, privacy              | `settings.tsx`            |
| **Hormonal Tracking**   | Period cycle correlation analysis                | `hormonal-detector.tsx`   |
| **Cycle Tracker**       | Menstrual cycle management (female users)        | `menstrual-cycle.tsx`     |
| **Emergency**           | Contacts, SOS, hospital finder                   | `emergency-features.tsx`  |
| **Export/Share**        | PDF/CSV export, doctor sharing                   | `data-export.tsx`         |
| **Pattern Warnings**    | Display migraine pattern alerts                  | `pattern-warnings.tsx`    |

---

## 📂 Project Structure

```
mobile/
├── app/
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── index.tsx           # Home screen with feature grid
│   │   ├── migraine-timer.tsx
│   │   ├── pattern-detection.tsx
│   │   ├── analytics-dashboard.tsx
│   │   ├── quick-actions.tsx
│   │   ├── notifications.tsx
│   │   ├── enhanced-diary.tsx
│   │   ├── settings.tsx
│   │   ├── hormonal-detector.tsx
│   │   ├── menstrual-cycle.tsx
│   │   ├── emergency-features.tsx
│   │   ├── data-export.tsx
│   │   ├── pattern-warnings.tsx
│   │   ├── menu.tsx           # Floating menu
│   │   └── _layout.tsx        # Tab navigation config
│   ├── _layout.tsx            # Root layout (providers)
│   └── modal.tsx              # Modal screen template
├── components/
│   ├── MigraineTimer.tsx
│   ├── PatternDetection.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── HormonalMigraineDetector.tsx
│   ├── EmergencyFeatures.tsx
│   ├── NotificationsSystem.tsx
│   ├── EnhancedDiary.tsx
│   ├── UserSettingsScreen.tsx
│   ├── QuickActionsUX.tsx
│   ├── DataExportSharing.tsx
│   ├── DashboardWarnings.tsx
│   ├── PatternWarnings.tsx
│   ├── NavigationBar.tsx
│   ├── MenstrualCycleCard.tsx
│   ├── OnboardingScreen.tsx
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── contexts/
│   ├── UserContext.tsx         # User state & persistence
│   └── ThemeContext.tsx        # Dark/light mode
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-theme-color.ts
│   ├── useDashboardStatus.ts
│   └── useNotifications.ts
├── services/
│   ├── geminiService.ts        # AI integration
│   ├── migraineApi.ts          # Backend API
│   └── notificationService.ts
├── utils/
│   └── dataMapper.ts
└── assets/
    └── images/
```

---

## ✨ Key Features

### 1. **Real-Time Migraine Tracking**
- Start/pause/save timer for migraine duration
- Manual duration entry
- Save to persistent storage

### 2. **Smart Pattern Detection**
- Analyze common triggers across migraines
- Confidence scoring (0-100%)
- Severity classification
- Time-of-day patterns

### 3. **Analytics & Trends**
- Monthly/weekly charts
- Trigger frequency visualization
- Severity trends
- Duration analysis

### 4. **Accessibility**
- Customizable font sizes (80%-150%)
- Screen reader support
- Text-to-speech integration
- High contrast mode ready

### 5. **Hormonal Tracking**
- Menstrual cycle correlation
- Phase-based risk assessment
- Period predictions
- Female users only (configurable)

### 6. **Emergency Features**
- Quick contacts (family/friends)
- Hospital/clinic finder
- Medication quick reference
- SOS button

### 7. **Data Management**
- Export to PDF/CSV/JSON
- Share data with doctors
- Backup/restore functionality
- Privacy controls

### 8. **Dark Mode**
- Complete dark mode support
- System theme detection
- Manual toggle option
- All screens styled

---

## 🔧 User Context & State

### UserData Structure
```typescript
{
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  ageBracket: string;
  integrations: string[];           // Onboarding completion
  dashboardData: DashboardData;       // Daily metrics
  menstrualCycleData: MenstrualCycleData;  // Female users
  notificationSettings: NotificationSettings;
  medications: Medication[];
  comorbidities: Comorbidity[];
  emergencyContacts: EmergencyContact[];
  fontSize: number;                   // 0.8 - 1.5
  screenReaderEnabled: boolean;
  // ... more custom fields
}
```

---

## 🎨 Theming System

### Color Palette
- **Light Mode:**
  - Primary: `#a8d5c4` (teal)
  - Background: `#f5f8f7`
  - Text: `#2d4a42`
  - Cards: `#ffffff`

- **Dark Mode:**
  - Primary: `#a8d5c4` (same)
  - Background: `#0f172a` (dark slate)
  - Text: `#d4e8e0` (light slate)
  - Cards: `#1e293b` (dark gray)

### Usage
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { darkMode } = useTheme();
<View style={[styles.container, darkMode && styles.containerDark]} />
```

---

## 📡 Backend Integration

### API Service (`services/migraineApi.ts`)
- User data synchronization
- Migraine log submission
- Pattern analysis (backend processing)
- Doctor sharing endpoints

### Gemini AI Integration (`services/geminiService.ts`)
- AI-powered migraine insights
- Personalized recommendations
- Pattern interpretation
- Context-aware responses

---

## 🚀 Getting Started

### Prerequisites
```bash
npm install -g expo-cli
```

### Installation
```bash
cd mobile
npm install
```

### Run Development
```bash
expo start
```

Then press:
- `i` for iOS
- `a` for Android
- `w` for web

### Build for Production
```bash
eas build --platform all
eas submit --platform all
```

---

## 📊 User Flow

### First Time User
1. App launches → `OnboardingScreen`
2. User fills profile (name, gender, age)
3. Selects integrations & permissions
4. Redirected to Home dashboard
5. Can start logging migraines or explore features

### Regular User
1. Home screen with:
   - Emergency button (red, top)
   - Menstrual cycle card (if female)
   - Dashboard warnings (customized)
   - Feature grid (13 screens)
2. Navigate to desired feature
3. BackButton or `router.back()` returns home
4. Data persists across sessions

---

## 🔐 Data Persistence

### Local Storage (AsyncStorage)
- User profile data
- Migraine logs
- Diary entries
- Notification settings
- Theme preference

### Cloud Sync (Optional)
- Backend API integration ready
- Doctor sharing endpoints
- Data export functionality

---

## 🎯 Best Practices Implemented

✅ **State Management**
- Centralized UserContext
- Single source of truth
- Auto-persistence to AsyncStorage

✅ **Navigation**
- Tab-based router for clarity
- Deep linking support
- Back button navigation
- Modal support for modals

✅ **Accessibility**
- Font size scaling
- Screen reader support
- High contrast colors
- Icon + text labels

✅ **UI/UX**
- Consistent styling
- Dark mode everywhere
- Responsive layouts
- Smooth animations

✅ **Code Quality**
- TypeScript strict mode
- Proper error boundaries
- Component isolation
- Reusable components

---

## 📝 Common Tasks

### Add New Feature Screen
1. Create file: `app/(tabs)/feature-name.tsx`
2. Create component: `components/FeatureName.tsx`
3. Add to navigation: `_layout.tsx`
4. Add to home grid: `index.tsx`
5. Export component properly

### Access User Data
```tsx
import { useUser } from '@/contexts/UserContext';

const { userData, updateUserData } = useUser();
```

### Update User Data
```tsx
updateUserData({
  ...userData,
  medications: [...userData.medications, newMed]
});
```

### Use Dark Mode
```tsx
const { darkMode } = useTheme();
<Text style={darkMode && styles.textDark}>Text</Text>
```

---

## ⚠️ Known Considerations

1. **Tab Bar Hidden** - Navigation via feature grid buttons
2. **Female-Only Features** - Menstrual cycle tab conditional
3. **Storage Limits** - AsyncStorage has size limits (~6MB)
4. **Offline-First** - Works without internet, syncs when available
5. **Permissions** - Requires camera, location (for hospital finder)

---

## 🔮 Future Enhancements

- [ ] Wearable integration (Apple Watch, Wear OS)
- [ ] Cloud backup & restore
- [ ] Multi-device sync
- [ ] AI-powered insights (expanded Gemini integration)
- [ ] Doctor dashboard (backend)
- [ ] Community features (forums, support groups)
- [ ] Push notifications (native)
- [ ] Offline data sync queue

---

## 📞 Support

For issues or questions:
1. Check component documentation
2. Review UserContext implementation
3. Test with dark mode enabled
4. Check console for errors
5. Verify AsyncStorage permissions

---

**Last Updated:** March 8, 2026  
**Version:** 1.0.0 (Full Feature Release)  
**Status:** Production Ready ✅
