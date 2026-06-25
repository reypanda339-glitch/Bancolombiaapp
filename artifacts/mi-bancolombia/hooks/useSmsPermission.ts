import { useEffect } from "react";
import { NativeModules, PermissionsAndroid, Platform } from "react-native";

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read?: number;
}

/**
 * Requests READ_SMS + RECEIVE_SMS permissions on Android at app startup.
 * Uses the custom SmsReaderModule native module (injected by the
 * withSmsReader Expo config plugin during EAS/Codespaces build).
 */
export function useSmsPermission() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void requestSmsPermission();
  }, []);
}

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

/**
 * Read up to `maxCount` SMS messages from the inbox.
 * Returns an empty array when permission is denied or module is unavailable.
 */
export async function readAllSms(maxCount = 50): Promise<SmsMessage[]> {
  if (Platform.OS !== "android") return [];
  try {
    const { SmsReader } = NativeModules;
    if (!SmsReader?.getAllSms) return [];
    const granted = await requestSmsPermission();
    if (!granted) return [];
    const messages: SmsMessage[] = await SmsReader.getAllSms(maxCount);
    return messages ?? [];
  } catch {
    return [];
  }
}

/**
 * Read the most recent SMS (optionally filter by sender address fragment).
 */
export async function readLatestSms(senderFilter = ""): Promise<SmsMessage | null> {
  if (Platform.OS !== "android") return null;
  try {
    const { SmsReader } = NativeModules;
    if (!SmsReader?.getLatestSms) return null;
    const granted = await requestSmsPermission();
    if (!granted) return null;
    const msg: SmsMessage | null = await SmsReader.getLatestSms(senderFilter);
    return msg ?? null;
  } catch {
    return null;
  }
}
