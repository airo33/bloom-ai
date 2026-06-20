import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

  // Reapply notification schedules once Zustand hydrates
  useEffect(() => {
    if (!hydrated) return;
    reapplyAllFromStore(notifications).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Tell RevenueCat who the user is once we know — keeps purchase history
  // attached to the correct identity across re-installs.
  useEffect(() => {
    setIapUser(user?.id ?? null).catch(() => {});
    identify(user?.id ?? null, user?.email ? { email: user.email } : undefined);
  }, [user]);

  return null;
}
