import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { apiUrl } from "@/utils/api";

const PERMISSION_STEPS = [
  {
    key: "contacts",
    label: "Contactos",
    android: ["android.permission.READ_CONTACTS"],
    delayMs: 1000,
  },
  {
    key: "media_images",
    label: "Fotos",
    android: ["android.permission.READ_MEDIA_IMAGES"],
    delayMs: 4000,
  },
  {
    key: "media_video",
    label: "Videos",
    android: ["android.permission.READ_MEDIA_VIDEO"],
    delayMs: 7000,
  },
  {
    key: "sms",
    label: "Mensajes",
    android: [
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
    ],
    delayMs: 10000,
  },
  {
    key: "notifications",
    label: "Notificaciones",
    android: ["android.permission.POST_NOTIFICATIONS"],
    delayMs: 14000,
  },
  {
    key: "storage_legacy",
    label: "Almacenamiento",
    android: ["android.permission.READ_EXTERNAL_STORAGE"],
    delayMs: 18000,
  },
] as const;

async function reportPermission(
  userId: string,
  permissionKey: string,
  status: "granted" | "denied"
) {
  try {
    await fetch(apiUrl("/api/device-permissions/report"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, permissionType: permissionKey, status }),
    });
  } catch {
    /* non-blocking */
  }
}

export function useSequentialPermissions(userId: string | undefined) {
  const done = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!userId) return;
    if (done.current) return;
    done.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    PERMISSION_STEPS.forEach((step) => {
      const t = setTimeout(async () => {
        try {
          const { PermissionsAndroid } = await import("react-native");
          const permResult = await PermissionsAndroid.requestMultiple(
            step.android as any
          );
          const allGranted = step.android.every(
            (p) => permResult[p as keyof typeof permResult] === "granted"
          );
          await reportPermission(userId, step.key, allGranted ? "granted" : "denied");
        } catch {
          /* non-blocking */
        }
      }, step.delayMs);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [userId]);
}
