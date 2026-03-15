import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, Dimensions, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

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
    const insets = useSafeAreaInsets();
    const [forecast, setForecast] = useState<ForecastDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('');

    const realtime = useRealtimeMonitoring(0, { trackSteps: false });

    // Get location name from coordinates
    const getLocationName = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
            );
            const data = await response.json();
            
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                const country = data.address.country;
                if (city && country) {
                    setLocationName(`${city}, ${country}`);
                } else if (country) {
                    setLocationName(country);
                } else {
                    setLocationName(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
                }
            }
        } catch (err) {
            setLocationName(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
    };

    const fetchForecast = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to get actual device location first
            let latitude, longitude;
            
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    latitude = location.coords.latitude;
                    longitude = location.coords.longitude;
                } else {
                    // Use IP-based location as fallback
                    const ipResponse = await fetch('http://ip-api.com/json/');
                    const ipData = await ipResponse.json();
                    if (ipData.status === 'success') {
                        latitude = ipData.lat;
                        longitude = ipData.lon;
                    } else {
                        throw new Error('Could not detect location');
                    }
                }
            } catch (locError) {
                // Final fallback - coordinates for Pakistan (Islamabad)
                latitude = 33.6844;
                longitude = 73.0479;
                setLocationName('Islamabad, Pakistan');
            }

            if (latitude && longitude) {
                setCurrentLocation({ lat: latitude, lon: longitude });
                await getLocationName(latitude, longitude);

                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
                );
                
                if (!response.ok) throw new Error('Failed to fetch weather data');
                const data = await response.json();

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
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load forecast');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, []);

    const getWeatherLabel = (code: number): string => {
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

    const getWeatherIconColor = (code: number): string => {
        if (code === 0) return '#fbbf24';
        if (code === 1 || code === 2) return '#f59e0b';
        if (code === 3) return '#94a3b8';
        if (code === 45 || code === 48) return '#cbd5e1';
        if (code >= 51 && code <= 67) return '#60a5fa';
        if (code >= 71 && code <= 86) return '#bae6fd';
        if (code >= 95 && code <= 99) return '#a78bfa';
        return '#c084fc';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('default', {
            weekday: 'short', month: 'short', day: 'numeric',
        });
    };

    return (
        <View style={styles.container}>

            {/* ── Custom Header matching index.tsx ── */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
                >
                    <Ionicons name="chevron-back" size={20} color="#e9d5ff" />
                </Pressable>
                <Text style={styles.headerTitle}>5-Day Forecast</Text>
                <Pressable
                    onPress={fetchForecast}
                    style={({ pressed }) => [styles.refreshBtn, pressed && styles.btnPressed]}
                >
                    <Ionicons name="refresh" size={18} color="#e9d5ff" />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { maxWidth }]}>

                    {/* Location card */}
                    {currentLocation && (
                        <View style={styles.locationCard}>
                            <View style={styles.locationIconWrap}>
                                <Ionicons name="location" size={16} color="#c084fc" />
                            </View>
                            <Text style={styles.locationText} numberOfLines={1}>
                                {locationName || `${currentLocation.lat.toFixed(2)}, ${currentLocation.lon.toFixed(2)}`}
                            </Text>
                        </View>
                    )}

                    {/* Current temp hero */}
                    {realtime.weather.temperatureC !== null && (
                        <View style={styles.heroCard}>
                            <View style={styles.heroLeft}>
                                <Text style={styles.heroTemp}>
                                    {Math.round(realtime.weather.temperatureC)}°C
                                </Text>
                                <Text style={styles.heroLabel}>
                                    {realtime.weather.weatherLabel || 'Current'}
                                </Text>
                                <Text style={styles.heroSub}>Right now</Text>
                            </View>
                            <View style={styles.heroIconWrap}>
                                <Ionicons name="partly-sunny" size={64} color="#fbbf24" />
                            </View>
                        </View>
                    )}

                    {/* States */}
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#a78bfa" />
                            <Text style={styles.loadingText}>Loading forecast...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <View style={styles.errorIconWrap}>
                                <Ionicons name="alert-circle" size={36} color="#f87171" />
                            </View>
                            <Text style={styles.errorText}>{error}</Text>
                            <Pressable
                                onPress={fetchForecast}
                                style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
                            >
                                <Text style={styles.retryBtnText}>Try again</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.forecastList}>
                            {forecast.map((day, index) => (
                                <View key={index} style={styles.forecastCard}>

                                    {/* Left: date + day badge */}
                                    <View style={styles.cardLeft}>
                                        <View style={styles.dayBadge}>
                                            <Text style={styles.dayBadgeText}>Day {index + 1}</Text>
                                        </View>
                                        <Text style={styles.dateText}>{formatDate(day.date)}</Text>
                                        <Text style={styles.conditionText}>{day.weatherLabel}</Text>
                                    </View>

                                    {/* Center: icon */}
                                    <View style={styles.cardCenter}>
                                        <View style={[
                                            styles.weatherIconWrap,
                                            { borderColor: getWeatherIconColor(day.weatherCode) + '44' }
                                        ]}>
                                            <Ionicons
                                                name={getWeatherIcon(day.weatherCode)}
                                                size={32}
                                                color={getWeatherIconColor(day.weatherCode)}
                                            />
                                        </View>
                                    </View>

                                    {/* Right: temps + details */}
                                    <View style={styles.cardRight}>
                                        <View style={styles.tempRow}>
                                            <View style={styles.tempChip}>
                                                <Text style={styles.tempChipLabel}>H</Text>
                                                <Text style={styles.tempHigh}>
                                                    {Math.round(day.maxTemp)}°
                                                </Text>
                                            </View>
                                            <View style={[styles.tempChip, styles.tempChipLow]}>
                                                <Text style={styles.tempChipLabel}>L</Text>
                                                <Text style={styles.tempLow}>
                                                    {Math.round(day.minTemp)}°
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailsRow}>
                                            {day.precipitationMm > 0 && (
                                                <View style={styles.detailPill}>
                                                    <Ionicons name="water-outline" size={11} color="#60a5fa" />
                                                    <Text style={styles.detailPillText}>
                                                        {day.precipitationMm}mm
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.detailPill}>
                                                <Ionicons name="analytics" size={11} color="#a78bfa" />
                                                <Text style={styles.detailPillText}>
                                                    {Math.round(day.windSpeed)} km/h
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                </View>
                            ))}
                        </View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Ionicons name="globe-outline" size={14} color="#6b21a8" />
                        <Text style={styles.footerText}>  Powered by Open-Meteo · Free & private</Text>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // ── Header ──
    header: {
        backgroundColor: '#0d0618',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2b0f4d',
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#231344',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#231344',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    btnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },

    // ── Scroll ──
    scrollView: { flex: 1 },
    scrollContent: {
        padding: 20,
        paddingTop: 16,
        alignItems: 'center',
    },
    content: { width: '100%' },

    // ── Location ──
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#160a2e',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#2b0f4d',
        gap: 10,
    },
    locationIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#2b0f4d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#c4b5fd',
    },

    // ── Hero current temp ──
    heroCard: {
        backgroundColor: '#231344',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    heroLeft: { gap: 4 },
    heroTemp: {
        fontSize: 52,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    heroLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#c4b5fd',
    },
    heroSub: {
        fontSize: 12,
        color: '#6b21a8',
    },
    heroIconWrap: {
        opacity: 0.9,
    },

    // ── Loading / Error ──
    centerContent: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: '#c4b5fd',
        fontWeight: '500',
    },
    errorIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#2b0f4d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 15,
        color: '#fca5a5',
        textAlign: 'center',
        fontWeight: '500',
    },
    retryBtn: {
        backgroundColor: '#6107c9',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 24,
        marginTop: 4,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Forecast cards ──
    forecastList: { gap: 10 },
    forecastCard: {
        backgroundColor: '#231344',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },

    // Left
    cardLeft: { flex: 1.2, gap: 3 },
    dayBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#4c1d95',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginBottom: 2,
    },
    dayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#e9d5ff',
        letterSpacing: 0.3,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    conditionText: {
        fontSize: 11,
        color: '#c4b5fd',
        fontWeight: '500',
    },

    // Center
    cardCenter: { alignItems: 'center' },
    weatherIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Right
    cardRight: { flex: 1.1, alignItems: 'flex-end', gap: 8 },
    tempRow: { flexDirection: 'row', gap: 6 },
    tempChip: {
        backgroundColor: '#6107c9',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
    },
    tempChipLow: {
        backgroundColor: '#1e0d38',
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    tempChipLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    tempHigh: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    tempLow: {
        fontSize: 15,
        fontWeight: '800',
        color: '#c4b5fd',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#160a2e',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        gap: 3,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    detailPillText: {
        fontSize: 10,
        color: '#c4b5fd',
        fontWeight: '500',
    },

    // ── Footer ──
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#160a2e',
        paddingBottom: 8,
    },
    footerText: {
        fontSize: 11,
        color: '#4c1d95',
        fontWeight: '500',
    },
});