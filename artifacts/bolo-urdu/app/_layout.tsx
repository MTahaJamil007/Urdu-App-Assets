import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

// On web, the FontFaceObserver inside @expo-google-fonts fires an unhandled
// rejection when it cannot verify font loading within its timeout window
// (common in sandboxed iframes like Replit's preview pane).
// This has zero effect on the app — fonts load via CSS anyway — so we
// suppress this specific rejection type silently.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg: string = event.reason?.message ?? '';
    if (msg.includes('ms timeout exceeded')) {
      event.preventDefault();
    }
  });
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="level/[levelId]" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="level/result" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Hide splash as soon as fonts are ready or errored.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // On web, hide the splash immediately — fonts load progressively via CSS
    // and we must not block the app waiting for them.
    if (Platform.OS === 'web') {
      SplashScreen.hideAsync();
    }
  }, []);

  // Native: wait for fonts (loads from bundle in < 200 ms, no visible delay).
  // Web: render immediately with system fonts; Inter replaces them once loaded.
  if (!fontsLoaded && !fontError && Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
