import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Requests media (photos + videos) permissions on Android on every app launch.
 * - Android < 13: READ_EXTERNAL_STORAGE
 * - Android 13+:  READ_MEDIA_IMAGES + READ_MEDIA_VIDEO
 * Runs before login — called at root layout level.
 */
export function useMediaPermission() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void requestMediaPermission();
  }, []);
}

async function requestMediaPermission() {
  try {
    const MediaLibrary = await import("expo-media-library");
    const { granted, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
    if (!granted && accessPrivileges !== "limited") {
      await MediaLibrary.requestPermissionsAsync();
    }
  } catch {
    /* Non-blocking */
  }
}
