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
import { useAuth } from './src/lib/auth';

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
  const { user } = useAuth();

  useSyncBootstrap();

  useEffect(() => {
    setupNotificationHandler();
    ensureAndroidChannel().catch(() => {});
    setupIap({ userId: null }).catch(() => {});
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
  }, [user]);

  return null;
}
