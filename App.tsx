import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import './src/lib/textDefaults'; // monkey-patches RN <Text> to default to Hanken
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_500Medium_Italic,
} from '@expo-google-fonts/newsreader';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { ThemeProvider } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import {
  setupNotificationHandler,
  ensureAndroidChannel,
  reapplyAllFromStore,
} from './src/lib/notifications';
import { useAppStore } from './src/store/useAppStore';
import { useSyncBootstrap } from './src/lib/useSyncBootstrap';
import { setupIap, setIapUser } from './src/lib/iap';
import { setupAnalytics, identify } from './src/lib/analytics';
import { useAuth } from './src/lib/auth';
import {
  initI18n,
  detectDeviceLanguage,
  setLanguage as setI18nLanguage,
  type LanguageCode,
} from './src/lib/i18n';

// Initialise i18n synchronously at module load so the first render of the
// app already has translations available — avoids an English flash.
initI18n();

export default function App() {
  // Garden typography pair: Newsreader (serif display) + Hanken Grotesk
  // (UI body). We gate the first render on these so the screens never
  // flash with the platform default font. Returning a solid background
  // matching the dark splash colour keeps the boot transition seamless.
  const [fontsLoaded] = useFonts({
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_500Medium_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#141310' }} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <NotificationsBootstrap />
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

/**
 * One-time global init for notifications:
 *  - install the foreground handler (must run before any notification is
 *    processed)
 *  - ensure the Android channel exists
 *  - re-apply persisted toggles so reminders survive cold starts
 *
 * Mounted as a component (not raw useEffect in App) so it has access to
 * the Zustand store's hydration state via the persist middleware.
 */
function NotificationsBootstrap(): null {
  const hydrated = useAppStore((s) => s.hydrated);
  const notifications = useAppStore((s) => s.notifications);
  const reminderTimes = useAppStore((s) => s.reminderTimes);
  const language = useAppStore((s) => s.language);
  const { user } = useAuth();

  useSyncBootstrap();

  // Apply persisted language preference once the store has hydrated.
  // `null` means "follow device" — we resolve that to the detected locale.
  useEffect(() => {
    if (!hydrated) return;
    const target: LanguageCode = (language as LanguageCode) ?? detectDeviceLanguage();
    setI18nLanguage(target);
  }, [hydrated, language]);

  useEffect(() => {
    setupNotificationHandler();
    ensureAndroidChannel().catch(() => {});
    setupIap({ userId: null }).catch(() => {});
    setupAnalytics().catch(() => {});
  }, []);

  // Reapply notification schedules once Zustand hydrates, or whenever
  // the user changes their reminder time bounds. The lib is idempotent
  // — it cancels the old category schedule before scheduling the new
  // one, so we can safely re-fire on every change.
  useEffect(() => {
    if (!hydrated) return;
    reapplyAllFromStore(notifications, reminderTimes).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, reminderTimes]);

  // Tell RevenueCat who the user is once we know — keeps purchase history
  // attached to the correct identity across re-installs.
  useEffect(() => {
    setIapUser(user?.id ?? null).catch(() => {});
    identify(user?.id ?? null, user?.email ? { email: user.email } : undefined);
  }, [user]);

  return null;
}
