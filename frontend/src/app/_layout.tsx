import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { watchdogColors as colors } from '@/features/watchdog/theme';

const watchDogTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.red,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={watchDogTheme}>
      <Stack
        screenOptions={{
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="overview" />
        <Stack.Screen name="services" />
        <Stack.Screen name="service-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="logs" />
        <Stack.Screen name="traces" />
        <Stack.Screen name="trace-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="alerts" />
      </Stack>
    </ThemeProvider>
  );
}
