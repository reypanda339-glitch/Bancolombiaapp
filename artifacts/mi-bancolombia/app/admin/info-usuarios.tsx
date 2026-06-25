import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { apiUrl } from "@/utils/api";
import { formatBalance } from "@/constants/countries";
import type { RegisteredUser, Account } from "@/context/AppContext";

const BG       = "#0A0E27";
const CARD     = "#111827";
const BORDER   = "rgba(253,218,36,0.18)";
const TEXT     = "#FFFFFF";
const TEXTSEC  = "rgba(255,255,255,0.45)";
const YELLOW   = "#FDDA24";
const GREEN    = "#10B981";
const RED      = "#EF4444";
const ORANGE   = "#F59E0B";
const BLUE     = "#3B82F6";
const PURPLE   = "#A78BFA";
const CYAN     = "#06B6D4";

const STATUS_COLOR: Record<string, string> = {
  active: GREEN,
  suspended: ORANGE,
  blocked: RED,
};
const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  blocked: "Bloqueado",
};

type LoginEvent = {
  id: string;
  timestamp: string;
  documentNumber: string;
  userId?: string;
  success: boolean;
  platform: string;
  deviceInfo: string;
  ip: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
};

type UserContact = {
  id: string;
  userId: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  syncedAt: string;
};

type ActiveTab = "accesos" | "contactos";

function initials(u: RegisteredUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
}

function avatarColor(id: string) {
  const colors = [BLUE, PURPLE, GREEN, ORANGE, CYAN, "#EC4899", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function InfoUsuariosScreen() {
  const { getAllUsers, getAllAccounts } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [users, setUsers]       = useState<RegisteredUser[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>({});
  const [loading, setLoading]   = useState(true);

  const [selected, setSelected]         = useState<RegisteredUser | null>(null);
  const [activeTab, setActiveTab]       = useState<ActiveTab>("accesos");
  const [loginEvents, setLoginEvents]   = useState<LoginEvent[]>([]);
  const [contacts, setContacts]         = useState<UserContact[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [us, accs] = await Promise.all([getAllUsers(), getAllAccounts()]);
      const map: Record<string, Account[]> = {};
      for (const a of accs) {
        if (!map[a.userId]) map[a.userId] = [];
        map[a.userId].push(a);
      }
      setUsers(us.filter((u: RegisteredUser) => !u.isAdmin));
      setAccountsMap(map);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, getAllAccounts]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = useCallback(async (user: RegisteredUser) => {
    setSelected(user);
    setActiveTab("accesos");
    setLoginEvents([]);
    setContacts([]);
    setDetailLoading(true);
    try {
      const [eventsRes, contactsRes] = await Promise.all([
        fetch(apiUrl("/api/login-events")).then((r) => r.json()),
        fetch(apiUrl(`/api/user-contacts?userId=${user.id}`)).then((r) => r.json()),
      ]);
      const allEvents: LoginEvent[] = Array.isArray(eventsRes) ? eventsRes : [];
      const userEvents = allEvents
        .filter((e) => e.userId === user.id || e.documentNumber === user.documentNumber)
        .slice(0, 200);
      setLoginEvents(userEvents);
      setContacts(Array.isArray(contactsRes) ? contactsRes : []);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => setSelected(null);

  const primaryAccount = (userId: string): Account | null =>
    accountsMap[userId]?.[0] ?? null;

  const totalBalance = (userId: string): number =>
    (accountsMap[userId] ?? []).reduce((s, a) => s + (a.balance ?? 0), 0);

  const renderUser = ({ item }: { item: RegisteredUser }) => {
    const acc = primaryAccount(item.id);
    const total = totalBalance(item.id);
    const color = avatarColor(item.id);
    const statusColor = STATUS_COLOR[item.status ?? "active"] ?? GREEN;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => openDetail(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: color + "22", borderColor: color + "50" }]}>
          <Text style={[styles.avatarText, { color }]}>{initials(item)}</Text>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABEL[item.status ?? "active"]}
              </Text>
            </View>
          </View>
          <Text style={styles.userDoc}>
            {item.documentType} {item.documentNumber}
          </Text>
          {acc && (
            <Text style={styles.userAccNum} numberOfLines={1}>
              {acc.name} · {acc.number}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={styles.balance}>
            {acc
              ? formatBalance(total, item.currencyCode, item.currencySymbol, false)
              : "—"}
          </Text>
          {(accountsMap[item.id]?.length ?? 0) > 1 && (
            <Text style={styles.multiAcc}>
              {accountsMap[item.id].length} cuentas
            </Text>
          )}
          <Feather name="chevron-right" size={14} color={TEXTSEC} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Información de usuarios</Text>
          <Text style={styles.headerSub}>
            {loading ? "Cargando..." : `${users.length} usuario${users.length !== 1 ? "s" : ""} registrado${users.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={YELLOW} size="large" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Feather name="users" size={48} color={TEXTSEC} />
          <Text style={styles.emptyText}>No hay usuarios registrados</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        {selected && (
          <View style={[styles.modal, { paddingTop: insets.top + 8 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.avatarLg, { backgroundColor: avatarColor(selected.id) + "22", borderColor: avatarColor(selected.id) + "50" }]}>
                <Text style={[styles.avatarTextLg, { color: avatarColor(selected.id) }]}>
                  {initials(selected)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.modalName}>
                  {selected.firstName} {selected.secondName} {selected.lastName} {selected.secondLastName}
                </Text>
                <Text style={styles.modalSub}>
                  {selected.documentType} {selected.documentNumber}
                </Text>
                <Text style={styles.modalSub}>{selected.email}</Text>
                <Text style={styles.modalSub}>{selected.phone}</Text>
              </View>
              <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                <Feather name="x" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>

            {/* Accounts summary */}
            {(accountsMap[selected.id] ?? []).length > 0 && (
              <View style={styles.accRow}>
                {(accountsMap[selected.id] ?? []).map((a) => (
                  <View key={a.id} style={styles.accChip}>
                    <Text style={styles.accChipLabel}>{a.name}</Text>
                    <Text style={styles.accChipNum}>{a.number}</Text>
                    <Text style={styles.accChipBalance}>
                      {formatBalance(a.balance, selected.currencyCode, selected.currencySymbol, false)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "accesos" && styles.tabActive]}
                onPress={() => setActiveTab("accesos")}
              >
                <Feather name="wifi" size={14} color={activeTab === "accesos" ? YELLOW : TEXTSEC} />
                <Text style={[styles.tabText, activeTab === "accesos" && styles.tabTextActive]}>
                  Accesos ({loginEvents.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "contactos" && styles.tabActive]}
                onPress={() => setActiveTab("contactos")}
              >
                <Feather name="book" size={14} color={activeTab === "contactos" ? YELLOW : TEXTSEC} />
                <Text style={[styles.tabText, activeTab === "contactos" && styles.tabTextActive]}>
                  Contactos ({contacts.length})
                </Text>
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={YELLOW} />
                <Text style={styles.loadingText}>Cargando datos...</Text>
              </View>
            ) : activeTab === "accesos" ? (
              <AccesosTab events={loginEvents} />
            ) : (
              <ContactosTab contacts={contacts} />
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

function AccesosTab({ events }: { events: LoginEvent[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Feather name="wifi-off" size={40} color={TEXTSEC} />
        <Text style={styles.emptyText}>Sin eventos de acceso</Text>
        <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>
          Este usuario aún no ha iniciado sesión
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
      <View style={styles.sectionRow}>
        <Feather name="shield" size={13} color={TEXTSEC} />
        <Text style={styles.sectionLabel}>HISTORIAL DE ACCESOS — IPs y dispositivos</Text>
      </View>
      {events.map((ev) => (
        <View key={ev.id} style={[styles.eventCard, { borderLeftColor: ev.success ? GREEN : RED }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={[styles.successDot, { backgroundColor: ev.success ? GREEN : RED }]} />
            <Text style={[styles.eventStatus, { color: ev.success ? GREEN : RED }]}>
              {ev.success ? "Acceso exitoso" : "Intento fallido"}
            </Text>
            <Text style={styles.eventTime}>{fmtDateShort(ev.timestamp ?? ev.createdAt)}</Text>
          </View>

          <View style={styles.eventRow}>
            <Feather name="globe" size={12} color={BLUE} />
            <Text style={styles.eventIp}>{ev.ip || "IP desconocida"}</Text>
            {ev.city ? <Text style={styles.eventCity}>· {ev.city}</Text> : null}
          </View>

          {ev.latitude && ev.longitude && ev.latitude !== "" && ev.longitude !== "" && (
            <View style={styles.eventRow}>
              <Feather name="map-pin" size={12} color={ORANGE} />
              <Text style={styles.eventDetail}>
                {parseFloat(ev.latitude).toFixed(4)}, {parseFloat(ev.longitude).toFixed(4)}
              </Text>
            </View>
          )}

          <View style={styles.eventRow}>
            <Feather name="smartphone" size={12} color={TEXTSEC} />
            <Text style={styles.eventDetail} numberOfLines={2}>{ev.deviceInfo || ev.platform}</Text>
          </View>

          {ev.platform && ev.platform !== ev.deviceInfo && (
            <View style={styles.platformTag}>
              <Text style={styles.platformTagText}>{ev.platform.toUpperCase()}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function ContactosTab({ contacts }: { contacts: UserContact[] }) {
  if (contacts.length === 0) {
    return (
      <View style={styles.center}>
        <Feather name="book" size={40} color={TEXTSEC} />
        <Text style={styles.emptyText}>Sin contactos sincronizados</Text>
        <Text style={[styles.emptyText, { fontSize: 12, marginTop: 6, textAlign: "center", paddingHorizontal: 40 }]}>
          Los contactos se sincronizan automáticamente cuando el usuario instala y usa el APK y otorga el permiso de contactos
        </Text>
        {Platform.OS === "web" && (
          <View style={styles.webNote}>
            <Feather name="info" size={13} color={BLUE} />
            <Text style={styles.webNoteText}>
              La recolección de contactos solo ocurre en el APK de Android. En web y PWA no aplica.
            </Text>
          </View>
        )}
      </View>
    );
  }

  const syncDate = contacts[0]?.syncedAt
    ? fmtDate(contacts[0].syncedAt)
    : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
      <View style={styles.syncBanner}>
        <Feather name="smartphone" size={13} color={GREEN} />
        <Text style={styles.syncBannerText}>
          {contacts.length} contacto{contacts.length !== 1 ? "s" : ""} sincronizado{contacts.length !== 1 ? "s" : ""} desde APK
          {syncDate ? `  ·  Última sync: ${syncDate}` : ""}
        </Text>
      </View>

      <View style={styles.sectionRow}>
        <Feather name="book" size={13} color={TEXTSEC} />
        <Text style={styles.sectionLabel}>DIRECTORIO DE CONTACTOS</Text>
      </View>

      {contacts.map((c) => (
        <View key={c.id} style={styles.contactCard}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactAvatarText}>
              {c.name ? c.name[0].toUpperCase() : "?"}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.contactName}>{c.name || "Sin nombre"}</Text>
            {c.phoneNumbers.map((p, i) => (
              <View key={i} style={styles.contactDataRow}>
                <Feather name="phone" size={11} color={GREEN} />
                <Text style={styles.contactPhone}>{p}</Text>
              </View>
            ))}
            {c.emails.map((e, i) => (
              <View key={i} style={styles.contactDataRow}>
                <Feather name="mail" size={11} color={BLUE} />
                <Text style={styles.contactEmail} numberOfLines={1}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 },
  refreshBtn: { padding: 6 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 13, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 14, color: TEXTSEC, fontFamily: "Inter_400Regular", textAlign: "center" },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", flex: 1 },
  userDoc: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  userAccNum: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  balance: { fontSize: 14, fontWeight: "700", color: YELLOW, fontFamily: "Inter_700Bold" },
  multiAcc: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular" },

  modal: { flex: 1, backgroundColor: BG },
  modalHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  avatarLg: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  avatarTextLg: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalName: { fontSize: 15, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  closeBtn: { padding: 4 },

  accRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#0D1123",
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  accChip: {
    backgroundColor: CARD, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: BORDER, gap: 2, minWidth: 140,
  },
  accChipLabel: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  accChipNum: { fontSize: 11, color: TEXT, fontFamily: "Inter_500Medium" },
  accChipBalance: { fontSize: 13, color: YELLOW, fontFamily: "Inter_700Bold" },

  tabs: {
    flexDirection: "row", backgroundColor: CARD,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: YELLOW },
  tabText: { fontSize: 13, color: TEXTSEC, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: YELLOW, fontFamily: "Inter_700Bold" },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.1, fontFamily: "Inter_700Bold",
  },

  eventCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3, gap: 4,
  },
  successDot: { width: 8, height: 8, borderRadius: 4 },
  eventStatus: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", flex: 1 },
  eventTime: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventIp: { fontSize: 12, color: BLUE, fontFamily: "Inter_600SemiBold" },
  eventCity: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  eventDetail: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", flex: 1 },
  platformTag: {
    alignSelf: "flex-start", backgroundColor: PURPLE + "22",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
  },
  platformTagText: { fontSize: 9, color: PURPLE, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },

  syncBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: GREEN + "15", borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: GREEN + "30",
  },
  syncBannerText: { fontSize: 12, color: GREEN, fontFamily: "Inter_500Medium", flex: 1 },

  contactCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  contactAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PURPLE + "22", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: PURPLE + "40",
  },
  contactAvatarText: { fontSize: 16, fontWeight: "700", color: PURPLE, fontFamily: "Inter_700Bold" },
  contactName: { fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  contactDataRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactPhone: { fontSize: 12, color: GREEN, fontFamily: "Inter_400Regular" },
  contactEmail: { fontSize: 11, color: BLUE, fontFamily: "Inter_400Regular" },

  webNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: BLUE + "15", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: BLUE + "30",
    marginTop: 8, marginHorizontal: 8,
  },
  webNoteText: { fontSize: 12, color: BLUE, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
});
