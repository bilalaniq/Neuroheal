import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />        {/* splash + login */}
          <Stack.Screen name="(tabs)" />        {/* your HomeScreen */}
          <Stack.Screen name="ai-chat" />
          <Stack.Screen name="patterns" />
          <Stack.Screen name="emergency" />
          <Stack.Screen name="weather-forecast" />
        </Stack>
      </UserProvider>
    </ThemeProvider>
  );
}
