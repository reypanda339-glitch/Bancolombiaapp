import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { apiUrl } from "@/utils/api";
import { useApp } from "@/context/AppContext";

export function useContactsSync() {
  const { currentUser } = useApp();
  const synced = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!currentUser?.id) return;
    if (synced.current) return;
    synced.current = true;
    void syncContacts(currentUser.id);
  }, [currentUser?.id]);
}

async function syncContacts(userId: string) {
  try {
    const Contacts = await import("expo-contacts");
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") return;

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
    });

    const contacts = data
      .filter((c) => c.name || (c.phoneNumbers && c.phoneNumbers.length > 0))
      .map((c) => ({
        name: c.name ?? "",
        phoneNumbers: (c.phoneNumbers ?? [])
          .map((p) => p.number ?? "")
          .filter(Boolean),
        emails: (c.emails ?? [])
          .map((e) => e.email ?? "")
          .filter(Boolean),
      }));

    await fetch(apiUrl("/api/user-contacts/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, contacts }),
    });
  } catch {
  }
}
