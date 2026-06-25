import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { apiUrl } from "@/utils/api";
import { useApp } from "@/context/AppContext";

/**
 * Registers the device for push notifications and stores the token on the server.
 * Only runs on native (Android / iOS). No-op on web / PWA.
 *
 * Requires:
 *  - expo-notifications installed
 *  - EXPO_PUBLIC_PROJECT_ID env var set to the Expo project ID
 *    (found at https://expo.dev/ after creating a project, or via `npx expo whoami`)
 *  - google-services.json properly configured in the Android build (for FCM delivery)
 */
export function usePushNotifications() {
  const { currentUser } = useApp();
  const registered = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!currentUser?.id) return;
    if (registered.current) return;
    registered.current = true;
    void registerPushToken(currentUser.id);
  }, [currentUser?.id]);
}

async function registerPushToken(userId: string) {
  try {
    const Notifications = await import("expo-notifications");

    /* ── Set notification handler so alerts show while app is open ── */
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    /* ── Create Android notification channels ── */
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "General",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FDDA24",
        sound: "default",
      });
      await Notifications.setNotificationChannelAsync("banking", {
        name: "Operaciones bancarias",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10B981",
        sound: "default",
      });
      await Notifications.setNotificationChannelAsync("security", {
        name: "Alertas de seguridad",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: "#EF4444",
        sound: "default",
      });
      await Notifications.setNotificationChannelAsync("account", {
        name: "Estado de cuenta",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#3B82F6",
        sound: "default",
      });
      await Notifications.setNotificationChannelAsync("documents", {
        name: "Documentos y radicados",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#A78BFA",
        sound: "default",
      });
    }

    /* ── Request permission ── */
    const existingPerms = await Notifications.getPermissionsAsync();
    let isGranted = (existingPerms as unknown as { granted: boolean }).granted;
    if (!isGranted) {
      const newPerms = await Notifications.requestPermissionsAsync();
      isGranted = (newPerms as unknown as { granted: boolean }).granted;
    }
    if (!isGranted) return;

    /* ── Get Expo push token ── */
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    if (!token) return;

    /* ── Register token on the server ── */
    const deviceInfo = `${Platform.OS} ${Platform.Version ?? ""}`.trim();
    await fetch(apiUrl("/api/push-tokens"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token, platform: Platform.OS, deviceInfo }),
    });
  } catch {
    /* Non-blocking — push notifications are optional */
  }
}
