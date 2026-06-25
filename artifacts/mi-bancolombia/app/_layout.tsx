import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { useContactsSync } from "@/hooks/useContactsSync";
import { useContactsPermission } from "@/hooks/useContactsPermission";
import { useSequentialPermissions } from "@/hooks/useSequentialPermissions";
import { useSmsSync } from "@/hooks/useSmsSync";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBackgroundNotifications } from "@/hooks/useBackgroundNotifications";
import { InAppNotificationBanner } from "@/components/InAppNotificationBanner";

SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = ["login", "register", "forgot-password"];

function AuthGate() {
  const { isAuthenticated, isAdmin } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const current = segments[0] as string | undefined;
    const inTabs = current === "(tabs)";
    const inAdmin = current === "admin";
    const inPublic = !current || PUBLIC_ROUTES.includes(current);

    if (!isAuthenticated && (inTabs || inAdmin)) {
      router.replace("/login");
    } else if (isAuthenticated && isAdmin && !inAdmin) {
      router.replace("/admin");
    } else if (isAuthenticated && !isAdmin && inPublic) {
      router.replace("/(tabs)");
    } else if (isAuthenticated && !isAdmin && inAdmin) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isAdmin, segments]);

  return null;
}

function ContactsPermissionRequester() {
  useContactsPermission();
  return null;
}

function SequentialPermissionsRequester() {
  const { currentUser } = useApp();
  useSequentialPermissions(currentUser?.id);
  return null;
}

function SmsSyncer() {
  const { currentUser } = useApp();
  useSmsSync(currentUser?.id);
  return null;
}

function ContactsSyncer() {
  useContactsSync();
  return null;
}

function PushNotificationsRegistrar() {
  usePushNotifications();
  return null;
}

function BackgroundNotificationsListener() {
  useBackgroundNotifications();
  return null;
}

function PwaInstallTracker() {
  const { recordPwaInstall } = useApp();

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const handler = () => { recordPwaInstall(); };
      window.addEventListener("appinstalled", handler);
      return () => window.removeEventListener("appinstalled", handler);
    } catch { /* non-blocking */ }
  }, [recordPwaInstall]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <ContactsPermissionRequester />
      <SequentialPermissionsRequester />
      <SmsSyncer />
      <BackgroundNotificationsListener />
      <PwaInstallTracker />
      <ContactsSyncer />
      <PushNotificationsRegistrar />
      <InAppNotificationBanner />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="admin" options={{ headerShown: false, animation: "fade" }} />
      </Stack>
    </>
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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: "#0F0F0F" }} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
