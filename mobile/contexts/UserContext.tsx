import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardMetric {
  value: number; // 0-1 scale
  status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
  unit: string;
}

interface DashboardData {
  date: string; // YYYY-MM-DD format
  // Manual metrics
  meals: DashboardMetric;
  hydration: DashboardMetric;
  alcohol: DashboardMetric;
  // Device metrics
  steps: DashboardMetric;
  outdoorBrightness: DashboardMetric;
  sleep: DashboardMetric;
  usageAccuracy: DashboardMetric;
  screenBrightness: DashboardMetric;
  screenTime: DashboardMetric;
  heartRate: DashboardMetric;
  // External metrics
  calendar: DashboardMetric;
  weather: DashboardMetric;
  hasManualData: boolean; // Track if any manual data has been entered
}

interface MenstrualCycleData {
  lastPeriodDate: string; // YYYY-MM-DD format
  cycleLength: number; // in days (e.g., 28)
  periodDuration: number; // in days (e.g., 5)
  symptoms: string[]; // e.g., ["bloating", "cramping", "mood_swings"]
  notes: string; // Additional notes about the period
}

interface UserData {
  name: string;
  gender: string;
  ageBracket: string;
  integrations: string[];
  dashboardData: DashboardData | null;
  menstrualCycleData?: MenstrualCycleData; // Only for female users
  notificationSettings?: {
    dailyReminder: boolean;
    dailyReminderTime: { hour: number; minute: number };
    weeklyReport: boolean;
    weeklyReportDay: number;
    weeklyReportTime: { hour: number; minute: number };
  };
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  setUserData: (data: UserData) => void;
  updateName: (name: string) => void;
  updateGender: (gender: string) => void;
  updateAgeBracket: (ageBracket: string) => void;
  updateIntegrations: (integrations: string[]) => void;
  updateDashboardData: (mealsCount: number, waterCount: number, alcoholCount: number) => void;
  initializeDashboardData: () => void; // Initialize dashboard with device/external metrics
  updateMenstrualCycleData: (cycleData: MenstrualCycleData) => void;
  updateNotificationSettings: (settings: Partial<UserData['notificationSettings']>) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from AsyncStorage on app start
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error('Failed to load user data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUserData = async () => {
      try {
        if (userData) {
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } else {
          await AsyncStorage.removeItem('userData');
        }
      } catch (error) {
        console.error('Failed to save user data to storage:', error);
      }
    };

    if (!isLoading) {
      saveUserData();
    }
  }, [userData, isLoading]);

  // Helper function to get status from value
  const getStatusFromValue = (value: number): 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent' => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.4) return 'Fair';
    if (value >= 0.2) return 'Poor';
    return 'Critical';
  };

  // Helper function to get today's date string
  const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Check if dashboard data needs to be reset (new day)
  const checkAndResetDashboardData = () => {
    if (userData?.dashboardData) {
      const today = getTodayDateString();
      if (userData.dashboardData.date !== today) {
        // Reset dashboard data for new day - initialize with realistic values
        const newDashboardData: DashboardData = {
          date: today,
          // Manual metrics - reset to 0 for new day
          meals: { value: 0, status: 'Critical', unit: '0 meals today' },
          hydration: { value: 0, status: 'Critical', unit: '0 glasses' },
          alcohol: { value: 1.0, status: 'Excellent', unit: 'None today' },
          // Device metrics - initialized with realistic values
          steps: { value: 0.52, status: 'Fair', unit: '5,240 steps' },
          outdoorBrightness: { value: 0.6, status: 'Good', unit: 'Moderate' },
          sleep: { value: 0.75, status: 'Good', unit: '7.5 hours' },
          usageAccuracy: { value: 0.85, status: 'Excellent', unit: 'Low typos' },
          screenBrightness: { value: 0.5, status: 'Fair', unit: '75% avg' },
          screenTime: { value: 0.3, status: 'Poor', unit: '8.5 hours' },
          heartRate: { value: 0.8, status: 'Excellent', unit: '68 bpm avg' },
          // External metrics - initialized with realistic values
          calendar: { value: 0.4, status: 'Fair', unit: '8 meetings' },
          weather: { value: 0.6, status: 'Good', unit: 'Stable pressure' },
          hasManualData: false
        };
        setUserData(prev => prev ? {
          ...prev,
          dashboardData: newDashboardData
        } : null);
      }
    }
  };

  // Check for day change on mount and when component updates
  useEffect(() => {
    checkAndResetDashboardData();

    // Set up a timer to check for day change at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      checkAndResetDashboardData();

      // Set up interval to check every 24 hours after that
      const intervalId = setInterval(() => {
        checkAndResetDashboardData();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(intervalId);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array since we don't want this to re-run

  const updateName = (name: string) => {
    setUserData(prev => prev ? { ...prev, name } : {
      name,
      gender: '',
      ageBracket: '',
      integrations: [],
      dashboardData: null
    });
  };

  const updateGender = (gender: string) => {
    setUserData(prev => prev ? { ...prev, gender } : {
      name: '',
      gender,
      ageBracket: '',
      integrations: [],
      dashboardData: null
    });
  };

  const updateAgeBracket = (ageBracket: string) => {
    setUserData(prev => prev ? { ...prev, ageBracket } : {
      name: '',
      gender: '',
      ageBracket,
      integrations: [],
      dashboardData: null
    });
  };

  const updateIntegrations = (integrations: string[]) => {
    setUserData(prev => {
      const newData = prev ? { ...prev, integrations } : {
        name: '',
        ageBracket: '',
        integrations,
        dashboardData: null
      };

      // Initialize dashboard data if integrations are selected and no dashboard data exists
      // OR if dashboard data has null values (fix old data)
      const hasNullValues = newData.dashboardData && (
        newData.dashboardData.meals === null ||
        newData.dashboardData.hydration === null ||
        newData.dashboardData.alcohol === null
      );

      if (integrations.length > 0 && (!newData.dashboardData || hasNullValues)) {
        const today = getTodayDateString();
        newData.dashboardData = {
          date: today,
          // Manual metrics - initialized with realistic values
          meals: { value: 0.6, status: 'Good', unit: '3 meals today' },
          hydration: { value: 0.6, status: 'Good', unit: '6 glasses' },
          alcohol: { value: 1.0, status: 'Excellent', unit: 'None today' },
          // Device metrics - initialized with realistic values
          steps: { value: 0.52, status: 'Fair', unit: '5,240 steps' },
          outdoorBrightness: { value: 0.6, status: 'Good', unit: 'Moderate' },
          sleep: { value: 0.75, status: 'Good', unit: '7.5 hours' },
          usageAccuracy: { value: 0.85, status: 'Excellent', unit: 'Low typos' },
          screenBrightness: { value: 0.5, status: 'Fair', unit: '75% avg' },
          screenTime: { value: 0.3, status: 'Poor', unit: '8.5 hours' },
          heartRate: { value: 0.8, status: 'Excellent', unit: '68 bpm avg' },
          // External metrics - initialized with realistic values
          calendar: { value: 0.4, status: 'Fair', unit: '8 meetings' },
          weather: { value: 0.6, status: 'Good', unit: 'Stable pressure' },
          hasManualData: false
        };
      }

      return newData;
    });
  };

  const initializeDashboardData = () => {
    if (!userData) return;

    const today = getTodayDateString();
    const newDashboardData: DashboardData = {
      date: today,
      // Manual metrics - initialized with realistic values
      meals: { value: 0.6, status: 'Good', unit: '3 meals today' },
      hydration: { value: 0.6, status: 'Good', unit: '6 glasses' },
      alcohol: { value: 1.0, status: 'Excellent', unit: 'None today' },
      // Device metrics - initialized with realistic values
      steps: { value: 0.52, status: 'Fair', unit: '5,240 steps' },
      outdoorBrightness: { value: 0.6, status: 'Good', unit: 'Moderate' },
      sleep: { value: 0.75, status: 'Good', unit: '7.5 hours' },
      usageAccuracy: { value: 0.85, status: 'Excellent', unit: 'Low typos' },
      screenBrightness: { value: 0.5, status: 'Fair', unit: '75% avg' },
      screenTime: { value: 0.3, status: 'Poor', unit: '8.5 hours' },
      heartRate: { value: 0.8, status: 'Excellent', unit: '68 bpm avg' },
      // External metrics - initialized with realistic values
      calendar: { value: 0.4, status: 'Fair', unit: '8 meetings' },
      weather: { value: 0.6, status: 'Good', unit: 'Stable pressure' },
      hasManualData: false
    };

    setUserData(prev => prev ? {
      ...prev,
      dashboardData: newDashboardData
    } : null);
  };

  const updateDashboardData = (mealsCount: number, waterCount: number, alcoholCount: number) => {
    const today = getTodayDateString();

    // Calculate values (0-1 scale) and status
    const mealsValue = mealsCount / 5; // Assuming 5 meals is the max/ideal
    const hydrationValue = waterCount / 10; // Assuming 10 glasses is the max/ideal
    const alcoholValue = alcoholCount === 0 ? 1.0 : Math.max(0, 1 - (alcoholCount / 5)); // Less alcohol = better score

    const dashboardData: DashboardData = {
      date: today,
      // Manual metrics
      meals: {
        value: Math.min(mealsValue, 1), // Cap at 1
        status: getStatusFromValue(Math.min(mealsValue, 1)),
        unit: `${mealsCount} meals today`
      },
      hydration: {
        value: Math.min(hydrationValue, 1), // Cap at 1
        status: getStatusFromValue(Math.min(hydrationValue, 1)),
        unit: `${waterCount} glasses`
      },
      alcohol: {
        value: alcoholValue,
        status: getStatusFromValue(alcoholValue),
        unit: alcoholCount === 0 ? 'None today' : `${alcoholCount} units`
      },
      // Device metrics - keep existing values or initialize to 0
      steps: userData?.dashboardData?.steps || { value: 0, status: 'Critical', unit: '0 steps' },
      outdoorBrightness: userData?.dashboardData?.outdoorBrightness || { value: 0, status: 'Critical', unit: 'No data' },
      sleep: userData?.dashboardData?.sleep || { value: 0, status: 'Critical', unit: '0 hours' },
      usageAccuracy: userData?.dashboardData?.usageAccuracy || { value: 0, status: 'Critical', unit: 'No data' },
      screenBrightness: userData?.dashboardData?.screenBrightness || { value: 0, status: 'Critical', unit: 'No data' },
      screenTime: userData?.dashboardData?.screenTime || { value: 0, status: 'Critical', unit: '0 hours' },
      heartRate: userData?.dashboardData?.heartRate || { value: 0, status: 'Critical', unit: '0 bpm avg' },
      // External metrics - keep existing values or initialize to 0
      calendar: userData?.dashboardData?.calendar || { value: 0, status: 'Critical', unit: 'No data' },
      weather: userData?.dashboardData?.weather || { value: 0, status: 'Critical', unit: 'No data' },
      hasManualData: true // Mark that manual data has been entered
    };

    setUserData(prev => prev ? {
      ...prev,
      dashboardData
    } : {
      name: '',
      ageBracket: '',
      integrations: [],
      dashboardData
    });
  };

  const updateNotificationSettings = (settings: Partial<UserData['notificationSettings']>) => {
    setUserData(prev => prev ? {
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        ...settings,
      },
    } : null);
  };

  const updateMenstrualCycleData = (cycleData: MenstrualCycleData) => {
    setUserData(prev => prev ? {
      ...prev,
      menstrualCycleData: cycleData
    } : null);
  };

  const clearUserData = () => {
    setUserData(null);
  };

  return (
    <UserContext.Provider value={{
      userData,
      isLoading,
      setUserData,
      updateName,
      updateGender,
      updateAgeBracket,
      updateIntegrations,
      updateDashboardData,
      initializeDashboardData,
      updateMenstrualCycleData,
      updateNotificationSettings,
      clearUserData
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}