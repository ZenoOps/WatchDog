import { DarkTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';
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

function AuthenticatedNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const { initializing, user } = useAuth();

  useEffect(() => {
    if (initializing) {
      return;
    }

    const onAuthScreen = pathname === '/';
    if (!user && !onAuthScreen) {
      router.replace('/');
    } else if (user && onAuthScreen) {
      router.replace('/overview');
    }
  }, [initializing, pathname, router, user]);

  return (
    <View style={styles.root}>
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
      {initializing ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
