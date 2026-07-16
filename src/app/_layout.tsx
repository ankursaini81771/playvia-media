import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { COLORS } from '../theme/colors';
import { MiniPlayerProvider } from '../context/MiniPlayerContext';
import { MiniPlayer } from '../components/MiniPlayer';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and in auth screens
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="video/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="advertiser/dashboard" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="admin/dashboard" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="terms" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
      </Stack>
      <MiniPlayer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MiniPlayerProvider>
        <RootLayoutNav />
      </MiniPlayerProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
