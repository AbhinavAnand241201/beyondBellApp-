import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/providers/AuthProvider';
import { OfflineBanner } from '@/components/OfflineBanner';
import { analytics } from '@/lib/analytics';
import { colors } from '@/theme/tokens';

analytics.init();

// Keep the native splash up until fonts are ready, so text never flashes unstyled.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
