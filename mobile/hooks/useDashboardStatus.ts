import { useUser } from '../contexts/UserContext';

export interface DashboardStatus {
  meals: {
    status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    value: number;
    unit: string;
  } | null;
  hydration: {
    status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    value: number;
    unit: string;
  } | null;
  alcohol: {
    status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    value: number;
    unit: string;
  } | null;
  deviceMetrics: {
    id: string;
    status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    value: number;
    unit: string;
    label: string;
    iconName: string;
  }[];
  externalMetrics: {
    id: string;
    status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    value: number;
    unit: string;
    label: string;
    iconName: string;
  }[];
  overallStatus: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent' | 'No Data';
  lastUpdated: string | null;
  hasAnyData: boolean;
}

export function useDashboardStatus(): DashboardStatus {
  const { userData } = useUser();
  
  const dashboardData = userData?.dashboardData;
  const selectedIntegrations = userData?.integrations || [];

  // Helper function to get status from value
  const getStatusFromValue = (value: number): 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent' => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.4) return 'Fair';
    if (value >= 0.2) return 'Poor';
    return 'Critical';
  };

  // Define all available device metrics
  const allDeviceMetrics = [
    { id: 'steps', iconName: 'walk', label: 'Steps', value: 0.4, unit: '5,240 steps' },
    { id: 'outdoor-brightness', iconName: 'sunny', label: 'Outdoor Brightness', value: 0.6, unit: 'Moderate' },
    { id: 'sleep', iconName: 'moon', label: 'Sleep Quality', value: 0.8, unit: '7.5 hours' },
    { id: 'usage-accuracy', iconName: 'phone-portrait', label: 'Usage Accuracy', value: 0.8, unit: 'Low typos' },
    { id: 'screen-brightness', iconName: 'eye', label: 'Screen Brightness', value: 0.4, unit: '75% avg' },
    { id: 'screen-time', iconName: 'time', label: 'Screen Time', value: 0.2, unit: '8.5 hours' },
    { id: 'heart-rate', iconName: 'heart', label: 'Heart Rate', value: 0.8, unit: '68 bpm avg' },
  ];

  const allExternalMetrics = [
    { id: 'calendar', iconName: 'calendar', label: 'Calendar Stress', value: 0.4, unit: '8 meetings' },
    { id: 'weather', iconName: 'cloud', label: 'Weather', value: 0.6, unit: 'Stable pressure' },
  ];

  // Get selected device and external metrics
  const deviceMetrics = allDeviceMetrics
    .filter(metric => selectedIntegrations.includes(metric.id))
    .map(metric => ({
      ...metric,
      status: getStatusFromValue(metric.value)
    }));

  const externalMetrics = allExternalMetrics
    .filter(metric => selectedIntegrations.includes(metric.id))
    .map(metric => ({
      ...metric,
      status: getStatusFromValue(metric.value)
    }));

  // Check if we have any data at all (manual, device, or external)
  const hasManualData = dashboardData?.hasManualData || false;
  const hasDeviceData = deviceMetrics.length > 0;
  const hasExternalData = externalMetrics.length > 0;
  const hasAnyData = hasManualData || hasDeviceData || hasExternalData;

  if (!hasAnyData) {
    return {
      meals: null,
      hydration: null,
      alcohol: null,
      deviceMetrics: [],
      externalMetrics: [],
      overallStatus: 'No Data',
      lastUpdated: null,
      hasAnyData: false
    };
  }

  // Collect all statuses for overall calculation
  const allStatuses = [];
  
  // Add manual metric statuses if they exist
  if (dashboardData?.meals) allStatuses.push(dashboardData.meals.status);
  if (dashboardData?.hydration) allStatuses.push(dashboardData.hydration.status);
  if (dashboardData?.alcohol) allStatuses.push(dashboardData.alcohol.status);
  
  // Add device metric statuses
  deviceMetrics.forEach(metric => allStatuses.push(metric.status));
  
  // Add external metric statuses
  externalMetrics.forEach(metric => allStatuses.push(metric.status));

  // Calculate overall status as the lowest status among all metrics
  const statusValues = {
    'Excellent': 5,
    'Good': 4,
    'Fair': 3,
    'Poor': 2,
    'Critical': 1
  };

  let overallStatus: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent' | 'No Data' = 'No Data';
  
  if (allStatuses.length > 0) {
    const minStatusValue = Math.min(...allStatuses.map(status => statusValues[status]));
    overallStatus = Object.entries(statusValues).find(([, value]) => value === minStatusValue)?.[0] as 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
  }

  return {
    meals: dashboardData?.meals || null,
    hydration: dashboardData?.hydration || null,
    alcohol: dashboardData?.alcohol || null,
    deviceMetrics,
    externalMetrics,
    overallStatus,
    lastUpdated: dashboardData?.date || null,
    hasAnyData
  };
}
