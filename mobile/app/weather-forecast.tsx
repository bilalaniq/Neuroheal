import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

interface ForecastDay {
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    weatherLabel: string;
    precipitationMm: number;
    windSpeed: number;
}

export default function WeatherForecastScreen() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const [forecast, setForecast] = useState<ForecastDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);

    const realtime = useRealtimeMonitoring(0, { trackSteps: false });

    useEffect(() => {
        fetchForecast();
    }, [realtime.weather.latitude, realtime.weather.longitude]);

    const fetchForecast = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get location from realtime monitoring
            const latitude = realtime.weather.latitude ?? 40.7128; // Default to NYC
            const longitude = realtime.weather.longitude ?? -74.006;

            setCurrentLocation({ lat: latitude, lon: longitude });

            // Fetch 5-day forecast from Open-Meteo API (completely free, no API key needed)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();

            // Process the next 5 days (skip today, which is index 0)
            const forecastDays: ForecastDay[] = [];
            for (let i = 1; i <= 5 && i < data.daily.time.length; i++) {
                forecastDays.push({
                    date: data.daily.time[i],
                    maxTemp: data.daily.temperature_2m_max[i],
                    minTemp: data.daily.temperature_2m_min[i],
                    weatherCode: data.daily.weather_code[i],
                    weatherLabel: getWeatherLabel(data.daily.weather_code[i]),
                    precipitationMm: data.daily.precipitation_sum[i] ?? 0,
                    windSpeed: data.daily.wind_speed_10m_max[i] ?? 0,
                });
            }

            setForecast(forecastDays);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load forecast');
            console.error('Weather forecast error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getWeatherLabel = (code: number): string => {
        // WMO Weather interpretation codes
        if (code === 0) return 'Clear sky';
        if (code === 1 || code === 2) return 'Mostly clear';
        if (code === 3) return 'Overcast';
        if (code === 45 || code === 48) return 'Foggy';
        if (code === 51 || code === 53 || code === 55) return 'Drizzle';
        if (code === 61 || code === 63 || code === 65) return 'Rain';
        if (code === 71 || code === 73 || code === 75) return 'Snow';
        if (code === 77) return 'Snow grains';
        if (code === 80 || code === 81 || code === 82) return 'Rain showers';
        if (code === 85 || code === 86) return 'Snow showers';
        if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
        return 'Unknown';
    };

    const getWeatherIcon = (code: number): keyof typeof Ionicons.glyphMap => {
        if (code === 0) return 'sunny';
        if (code === 1 || code === 2) return 'partly-sunny';
        if (code === 3) return 'cloud';
        if (code === 45 || code === 48) return 'water';
        if (code >= 51 && code <= 67) return 'rainy';
        if (code >= 71 && code <= 86) return 'snow';
        if (code >= 95 && code <= 99) return 'thunderstorm';
        return 'help-circle';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('default', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <View style={[styles.container, darkMode && styles.containerDark]}>
            <ModernHeader title="5-Day Forecast" onBack={() => router.back()} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.content, { maxWidth }]}>
                    {/* Location info */}
                    {currentLocation && (
                        <View style={[styles.locationCard, darkMode && styles.locationCardDark]}>
                            <Ionicons
                                name="location"
                                size={20}
                                color={darkMode ? '#a8d5c4' : '#2d4a42'}
                            />
                            <Text style={[styles.locationText, darkMode && styles.locationTextDark]}>
                                {realtime.weather.locationLabel || `${currentLocation.lat.toFixed(2)}, ${currentLocation.lon.toFixed(2)}`}
                            </Text>
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#a8d5c4" />
                            <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>
                                Loading forecast...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="alert-circle" size={48} color="#ef4444" />
                            <Text style={[styles.errorText, darkMode && styles.errorTextDark]}>
                                {error}
                            </Text>
                            <Text style={[styles.retryText, darkMode && styles.retryTextDark]}>
                                Please check your internet connection
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.forecastList}>
                            {forecast.map((day, index) => (
                                <View
                                    key={index}
                                    style={[styles.forecastCard, darkMode && styles.forecastCardDark]}
                                >
                                    <View style={styles.dateSection}>
                                        <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>
                                            {formatDate(day.date)}
                                        </Text>
                                        <Text style={[styles.dayNumber, darkMode && styles.dayNumberDark]}>
                                            Day {index + 1}
                                        </Text>
                                    </View>

                                    <View style={styles.weatherSection}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons
                                                name={getWeatherIcon(day.weatherCode)}
                                                size={40}
                                                color={darkMode ? '#d4e8e0' : '#2d4a42'}
                                            />
                                        </View>
                                        <View style={styles.conditionContainer}>
                                            <Text style={[styles.conditionText, darkMode && styles.conditionTextDark]}>
                                                {day.weatherLabel}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.tempSection}>
                                        <View style={styles.tempBox}>
                                            <Text style={[styles.tempLabel, darkMode && styles.tempLabelDark]}>
                                                High
                                            </Text>
                                            <Text style={[styles.tempValue, darkMode && styles.tempValueDark]}>
                                                {Math.round(day.maxTemp)}°C
                                            </Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.tempBox}>
                                            <Text style={[styles.tempLabel, darkMode && styles.tempLabelDark]}>
                                                Low
                                            </Text>
                                            <Text style={[styles.tempValue, darkMode && styles.tempValueDark]}>
                                                {Math.round(day.minTemp)}°C
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailsSection}>
                                        {day.precipitationMm > 0 && (
                                            <View style={styles.detailItem}>
                                                <Ionicons
                                                    name="water-outline"
                                                    size={16}
                                                    color={darkMode ? '#94a3b8' : '#64748b'}
                                                />
                                                <Text style={[styles.detailText, darkMode && styles.detailTextDark]}>
                                                    {day.precipitationMm}mm
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.detailItem}>
                                            <Ionicons
                                                name="analytics"
                                                size={16}
                                                color={darkMode ? '#94a3b8' : '#64748b'}
                                            />
                                            <Text style={[styles.detailText, darkMode && styles.detailTextDark]}>
                                                {Math.round(day.windSpeed)} km/h
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, darkMode && styles.footerTextDark]}>
                            Data powered by Open-Meteo
                        </Text>
                        <Text style={[styles.footerSubtext, darkMode && styles.footerSubtextDark]}>
                            Free weather API · No tracking
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8f7',
    },
    containerDark: {
        backgroundColor: '#1a2622',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 12,
    },
    content: {
        width: '100%',
        alignSelf: 'center',
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f5f3',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d4e8e0',
    },
    locationCardDark: {
        backgroundColor: '#253029',
        borderColor: '#3f5451',
    },
    locationText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2d4a42',
        marginLeft: 12,
        flex: 1,
    },
    locationTextDark: {
        color: '#d4e8e0',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2d4a42',
        marginTop: 16,
    },
    loadingTextDark: {
        color: '#d4e8e0',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#991b1b',
        marginTop: 12,
        textAlign: 'center',
    },
    errorTextDark: {
        color: '#fca5a5',
    },
    retryText: {
        fontSize: 14,
        color: '#7a9f94',
        marginTop: 8,
        textAlign: 'center',
    },
    retryTextDark: {
        color: '#7a9f94',
    },
    forecastList: {
        gap: 16,
    },
    forecastCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    forecastCardDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
    },
    dateSection: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    dateTextDark: {
        color: '#f3f4f6',
    },
    dayNumber: {
        fontSize: 12,
        color: '#6b7280',
    },
    dayNumberDark: {
        color: '#9ca3af',
    },
    weatherSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 16,
    },
    conditionContainer: {
        flex: 1,
    },
    conditionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2d4a42',
    },
    conditionTextDark: {
        color: '#d4e8e0',
    },
    tempSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
    },
    tempBox: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 12,
    },
    tempLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    tempLabelDark: {
        color: '#9ca3af',
    },
    tempValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    tempValueDark: {
        color: '#f3f4f6',
    },
    detailsSection: {
        flexDirection: 'row',
        gap: 12,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f5f3',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    detailText: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 6,
        fontWeight: '500',
    },
    detailTextDark: {
        color: '#cbd5e1',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    footerSubtext: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
    },
    footerTextDark: {
        color: '#9ca3af',
    },
    footerSubtextDark: {
        color: '#6b7280',
    },
});
