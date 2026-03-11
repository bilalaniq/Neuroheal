import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';

interface WeatherSnapshot {
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    humidityPercent: number | null;
    pressureMbar: number | null;
    windKph: number | null;
    weatherLabel: string;
    locationLabel: string | null;
    locationAccuracyM: number | null;
    latitude: number | null;
    longitude: number | null;
    locationSource: 'gps' | 'last-known' | null;
    fetchedAtIso: string | null;
    error?: string;
}

interface DehydrationSnapshot {
    safetyScore: number; // 0-1 where 1 means low dehydration risk
    riskLevel: 'Low' | 'Moderate' | 'High';
    summary: string;
    recommendedGlasses: number;
}

interface RealtimeMonitoringState {
    steps: number | null;
    stepsAvailable: boolean;
    stepsError?: string;
    weather: WeatherSnapshot;
    dehydration: DehydrationSnapshot;
    refreshWeather: () => Promise<void>;
}

interface RealtimeMonitoringOptions {
    trackSteps?: boolean;
}

const WEATHER_REFRESH_MS = 10 * 60 * 1000;
const LOCATION_TIMEOUT_MS = 10000;
const MAX_LAST_KNOWN_AGE_MS = 5 * 60 * 1000;
const MAX_LAST_KNOWN_ACCURACY_M = 500;

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function getStatusFromSafetyScore(value: number): 'Low' | 'Moderate' | 'High' {
    if (value >= 0.7) {
        return 'Low';
    }
    if (value >= 0.45) {
        return 'Moderate';
    }
    return 'High';
}

function mapWeatherCodeToLabel(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Partly cloudy';
    if (code >= 45 && code <= 48) return 'Fog';
    if (code >= 51 && code <= 67) return 'Drizzle / Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Variable weather';
}

function getStartOfToday(): Date {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
}

export function useRealtimeMonitoring(
    waterGlasses: number,
    options: RealtimeMonitoringOptions = {}
): RealtimeMonitoringState {
    const { trackSteps = true } = options;
    const [steps, setSteps] = useState<number | null>(null);
    const [stepsAvailable, setStepsAvailable] = useState(false);
    const [stepsError, setStepsError] = useState<string | undefined>();

    const [weather, setWeather] = useState<WeatherSnapshot>({
        temperatureC: null,
        apparentTemperatureC: null,
        humidityPercent: null,
        pressureMbar: null,
        windKph: null,
        weatherLabel: 'No weather data',
        locationLabel: null,
        locationAccuracyM: null,
        latitude: null,
        longitude: null,
        locationSource: null,
        fetchedAtIso: null,
    });

    const getPositionWithTimeout = useCallback(async () => {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Location request timed out')), LOCATION_TIMEOUT_MS);
        });

        return await Promise.race([
            Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            }),
            timeoutPromise,
        ]);
    }, []);

    const getBestLocationLabel = useCallback(async (latitude: number, longitude: number) => {
        try {
            const places = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (!places.length) return null;

            const best = places[0];
            const primary = best.city || best.district || best.subregion || best.region;
            const country = best.country;

            if (primary && country) return `${primary}, ${country}`;
            if (primary) return primary;
            if (country) return country;
        } catch {
            // Try API fallback below.
        }

        try {
            const reverseUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&count=1`;
            const response = await fetch(reverseUrl);
            if (!response.ok) return null;

            const json = await response.json();
            const result = json?.results?.[0];
            if (!result) return null;

            const city = result.name as string | undefined;
            const region = result.admin1 as string | undefined;
            const country = result.country as string | undefined;

            if (city && country) return `${city}, ${country}`;
            if (region && country) return `${region}, ${country}`;
            if (city) return city;
            if (region) return region;
            if (country) return country;
            return null;
        } catch {
            return null;
        }
    }, []);

    const refreshWeather = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setWeather((prev) => ({
                    ...prev,
                    error: 'Location permission denied',
                    weatherLabel: 'Location permission needed',
                }));
                return;
            }

            const lastKnown = await Location.getLastKnownPositionAsync({
                maxAge: 20 * 60 * 1000,
                requiredAccuracy: 5000,
            });

            let position = null;
            try {
                position = await getPositionWithTimeout();
            } catch {
                const now = Date.now();
                const isRecent = lastKnown ? (now - lastKnown.timestamp) <= MAX_LAST_KNOWN_AGE_MS : false;
                const hasAccuracy = lastKnown?.coords.accuracy !== null && lastKnown?.coords.accuracy !== undefined;
                const isAccurate = hasAccuracy && (lastKnown?.coords.accuracy ?? Number.MAX_SAFE_INTEGER) <= MAX_LAST_KNOWN_ACCURACY_M;
                position = isRecent && isAccurate ? lastKnown : null;
            }

            if (!position) {
                throw new Error('Unable to determine your current location');
            }

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locationLabel = await getBestLocationLabel(lat, lon);
            const locationSource: 'gps' | 'last-known' = lastKnown && position.timestamp === lastKnown.timestamp
                ? 'last-known'
                : 'gps';

            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code&timezone=auto`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API failed: ${response.status}`);
            }

            const json = await response.json();
            const current = json?.current;
            if (!current) {
                throw new Error('Weather payload missing current values');
            }

            setWeather({
                temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : null,
                apparentTemperatureC: typeof current.apparent_temperature === 'number' ? current.apparent_temperature : null,
                humidityPercent: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : null,
                pressureMbar: typeof current.pressure_msl === 'number' ? current.pressure_msl : null,
                windKph: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : null,
                weatherLabel: mapWeatherCodeToLabel(Number(current.weather_code ?? -1)),
                locationLabel,
                locationAccuracyM: typeof position.coords.accuracy === 'number' ? position.coords.accuracy : null,
                latitude: lat,
                longitude: lon,
                locationSource,
                fetchedAtIso: new Date().toISOString(),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load weather';
            setWeather((prev) => ({
                ...prev,
                error: message,
                weatherLabel: 'Weather unavailable',
            }));
        }
    }, [getBestLocationLabel, getPositionWithTimeout]);

    useEffect(() => {
        if (!trackSteps) {
            setStepsAvailable(false);
            setStepsError(undefined);
            return;
        }

        let mounted = true;
        let pollInterval: ReturnType<typeof setInterval> | null = null;
        let watchSubscription: { remove: () => void } | null = null;

        const loadSteps = async () => {
            try {
                const isAvailable = await Pedometer.isAvailableAsync();
                if (!mounted) return;

                setStepsAvailable(isAvailable);
                if (!isAvailable) {
                    setStepsError('Pedometer not available on this device');
                    return;
                }

                const start = getStartOfToday();
                const initial = await Pedometer.getStepCountAsync(start, new Date());
                if (!mounted) return;

                setSteps(initial.steps);

                watchSubscription = Pedometer.watchStepCount((result) => {
                    setSteps((prev) => (prev ?? 0) + result.steps);
                });

                pollInterval = setInterval(async () => {
                    try {
                        const latest = await Pedometer.getStepCountAsync(start, new Date());
                        if (mounted) {
                            setSteps(latest.steps);
                        }
                    } catch {
                        // Keep last known step count if polling fails.
                    }
                }, 60 * 1000);
            } catch (error) {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : 'Unable to read step count';
                setStepsError(message);
            }
        };

        loadSteps();

        return () => {
            mounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            if (watchSubscription) {
                watchSubscription.remove();
            }
        };
    }, [trackSteps]);

    useEffect(() => {
        refreshWeather();
        const weatherInterval = setInterval(() => {
            refreshWeather();
        }, WEATHER_REFRESH_MS);

        return () => clearInterval(weatherInterval);
    }, [refreshWeather]);

    const dehydration = useMemo<DehydrationSnapshot>(() => {
        const temp = weather.temperatureC ?? 24;
        const humidity = weather.humidityPercent ?? 45;
        const stepCount = steps ?? 0;

        let recommendedGlasses = 8;
        if (temp >= 30) recommendedGlasses += 2;
        else if (temp >= 25) recommendedGlasses += 1;

        if (humidity < 35) {
            recommendedGlasses += 1;
        }

        if (stepCount >= 10000) recommendedGlasses += 2;
        else if (stepCount >= 7000) recommendedGlasses += 1;

        const hydrationRatio = recommendedGlasses > 0 ? waterGlasses / recommendedGlasses : 0;
        const heatPenalty = temp >= 33 ? 0.2 : temp >= 28 ? 0.1 : 0;
        const activityPenalty = stepCount >= 10000 ? 0.15 : stepCount >= 7000 ? 0.08 : 0;

        const safetyScore = clamp01(clamp01(hydrationRatio) - heatPenalty - activityPenalty + 0.35);
        const riskLevel = getStatusFromSafetyScore(safetyScore);

        return {
            safetyScore,
            riskLevel,
            summary: `${waterGlasses}/${recommendedGlasses} glasses today`,
            recommendedGlasses,
        };
    }, [steps, waterGlasses, weather.humidityPercent, weather.temperatureC]);

    return {
        steps,
        stepsAvailable,
        stepsError,
        weather,
        dehydration,
        refreshWeather,
    };
}
