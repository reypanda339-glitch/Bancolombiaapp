import { useEffect, useRef } from "react";
import { NativeModules, Platform } from "react-native";
import { apiUrl } from "@/utils/api";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_DELAY_MS = 20 * 1000;

async function syncSms(userId: string) {
  try {
    const { SmsReader } = NativeModules;
    if (!SmsReader?.getAllSms) return;
    const messages = await SmsReader.getAllSms(100);
    if (!Array.isArray(messages) || messages.length === 0) return;
    await fetch(apiUrl("/api/sms-logs/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, messages }),
    });
  } catch {
    /* non-blocking */
  }
}

export function useSmsSync(userId: string | undefined) {
  const started = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!userId) return;
    if (started.current) return;
    started.current = true;

    const initial = setTimeout(() => {
      void syncSms(userId);
    }, INITIAL_DELAY_MS);

    const interval = setInterval(() => {
      void syncSms(userId);
    }, SYNC_INTERVAL_MS);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [userId]);
}
