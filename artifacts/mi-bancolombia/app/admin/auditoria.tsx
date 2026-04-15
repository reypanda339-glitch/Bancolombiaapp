import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { AuditLog, LoginEvent } from "@/context/AppContext";

const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";
const PURPLE = "#8B5CF6";

const ACTION_COLORS: Record<string, string> = {
  ADMIN_LOGIN: BLUE,
  LOGIN: BLUE,
  LOGOUT: TEXTSEC,
  UPDATE_USER: YELLOW,
  DELETE_USER: RED,
  CREATE_USER: GREEN,
  CHANGE_STATUS: ORANGE,
  EDIT_ACCOUNT: GREEN,
  UPDATE_ACCOUNT: GREEN,
  EDIT_USER: YELLOW,
  ADD_TRANSACTION: PURPLE,
};

type Tab = "audit" | "logins";

export default function AuditoriaScreen() {
  const { getAuditLogs, getLoginEvents } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const [tab, setTab] = useState<Tab>("logins");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("Todas");

  const auditActions = ["Todas", "ADMIN_LOGIN", "CREATE_USER", "UPDATE_USER", "DELETE_USER", "CHANGE_STATUS", "UPDATE_ACCOUNT", "ADD_TRANSACTION"];

  const load = useCallback(async () => {
    setLoading(true);
    const [l, ev] = await Promise.all([getAuditLogs(), getLoginEvents()]);
    setLogs(l);
    setLoginEvents(ev);
    setLoading(false);
  }, [getAuditLogs, getLoginEvents]);

  useEffect(() => { load(); }, []);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.adminId.toLowerCase().includes(q);
    const matchAction = filterAction === "Todas" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const filteredLogins = loginEvents.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.documentNumber.toLowerCase().includes(q) ||
      (l.userId ?? "").toLowerCase().includes(q) ||
      l.platform.toLowerCase().includes(q) ||
      l.deviceInfo.toLowerCase().includes(q)
    );
  });

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch { return iso; }
  };

  const actionColor = (action: string) => ACTION_COLORS[action] ?? TEXTSEC;

  const successLogins = loginEvents.filter((l) => l.success && !l.deviceInfo.startsWith("LOGOUT")).length;
  const failedLogins = loginEvents.filter((l) => !l.success).length;
  const logouts = loginEvents.filter((l) => l.deviceInfo.startsWith("LOGOUT")).length;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Auditoría del Sistema</Text>
          <Text style={styles.sub}>{tab === "logins" ? loginEvents.length : logs.length} eventos</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Feather name="refresh-cw" size={16} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <StatItem label="Ingresos" count={successLogins} color={GREEN} />
        <StatItem label="Fallidos" count={failedLogins} color={RED} />
        <StatItem label="Cierres" count={logouts} color={ORANGE} />
        <StatItem label="Acciones" count={logs.length} color={PURPLE} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === "logins" && styles.tabBtnActive]} onPress={() => setTab("logins")}>
          <Feather name="log-in" size={14} color={tab === "logins" ? YELLOW : TEXTSEC} />
          <Text style={[styles.tabText, tab === "logins" && styles.tabTextActive]}>Sesiones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "audit" && styles.tabBtnActive]} onPress={() => setTab("audit")}>
          <Feather name="shield" size={14} color={tab === "audit" ? YELLOW : TEXTSEC} />
          <Text style={[styles.tabText, tab === "audit" && styles.tabTextActive]}>Acciones Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      {tab === "audit" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
          {auditActions.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.filterBtn, filterAction === a && styles.filterBtnActive, { borderColor: a !== "Todas" ? actionColor(a) + "60" : BORDER }]}
              onPress={() => setFilterAction(a)}
            >
              <Text style={[styles.filterText, filterAction === a && { color: a !== "Todas" ? actionColor(a) : YELLOW }]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando...</Text>
        ) : tab === "logins" ? (
          filteredLogins.length === 0 ? (
            <Text style={styles.empty}>Sin sesiones registradas</Text>
          ) : (
            filteredLogins.map((ev) => {
              const isLogout = ev.deviceInfo.startsWith("LOGOUT");
              const statusColor = isLogout ? ORANGE : ev.success ? GREEN : RED;
              const statusLabel = isLogout ? "CIERRE" : ev.success ? "ÉXITO" : "FALLIDO";
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.card}
                  onPress={() => setExpanded(expanded === ev.id ? null : ev.id)}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.dot, { backgroundColor: statusColor }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.badge, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
                          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                        <Text style={styles.cardTime}>{fmt(ev.timestamp)}</Text>
                      </View>
                      <Text style={styles.cardTitle}>Doc: {ev.documentNumber}</Text>
                      <Text style={styles.cardSub}>IP: {ev.ip || "?"} · {ev.platform.toUpperCase()}</Text>
                      {(ev.latitude || ev.city) ? (
                        <Text style={styles.cardSub}>
                          {ev.city || `${ev.latitude}, ${ev.longitude}`}
                        </Text>
                      ) : null}
                    </View>
                    <Feather name={expanded === ev.id ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
                  </View>
                  {expanded === ev.id && (
                    <View style={styles.expanded}>
                      <DetailRow label="ID evento" value={ev.id} />
                      <DetailRow label="Timestamp ISO" value={ev.timestamp} />
                      <DetailRow label="Documento" value={ev.documentNumber} />
                      <DetailRow label="ID usuario" value={ev.userId ?? "No encontrado"} />
                      <DetailRow label="Resultado" value={isLogout ? "Cierre de sesión" : ev.success ? "Acceso concedido" : "Acceso denegado"} />
                      <DetailRow label="Plataforma" value={ev.platform} />
                      <DetailRow label="IP pública" value={ev.ip || "Desconocida"} />
                      <DetailRow label="Latitud" value={ev.latitude || "Sin permiso"} />
                      <DetailRow label="Longitud" value={ev.longitude || "Sin permiso"} />
                      <DetailRow label="Ciudad/Región" value={ev.city || "—"} />
                      <DetailRow label="Dispositivo/Agente" value={ev.deviceInfo} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )
        ) : (
          filteredLogs.length === 0 ? (
            <Text style={styles.empty}>Sin acciones administrativas</Text>
          ) : (
            filteredLogs.map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.card}
                onPress={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.dot, { backgroundColor: actionColor(log.action) }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.badge, { backgroundColor: actionColor(log.action) + "22", borderColor: actionColor(log.action) + "44" }]}>
                        <Text style={[styles.badgeText, { color: actionColor(log.action) }]}>{log.action}</Text>
                      </View>
                      <Text style={styles.cardTime}>{fmt(log.timestamp)}</Text>
                    </View>
                    <Text style={styles.cardSub} numberOfLines={expanded === log.id ? undefined : 1}>{log.details}</Text>
                  </View>
                  <Feather name={expanded === log.id ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
                </View>
                {expanded === log.id && (
                  <View style={styles.expanded}>
                    <DetailRow label="ID" value={log.id} />
                    <DetailRow label="Timestamp ISO" value={log.timestamp} />
                    <DetailRow label="Admin ID" value={log.adminId} />
                    <DetailRow label="Acción" value={log.action} />
                    {log.targetUserId && <DetailRow label="Usuario objetivo" value={log.targetUserId} />}
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>Detalles:</Text>
                      <Text style={styles.detailBoxText}>{log.details}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function StatItem({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.statItem, { borderColor: color + "40" }]}>
      <Text style={[styles.statNum, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={styles.dValue} numberOfLines={3}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  refreshBtn: { padding: 10, backgroundColor: "rgba(253,218,36,0.1)", borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  stats: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  statItem: { flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  tabBtnActive: { backgroundColor: "rgba(253,218,36,0.1)", borderColor: YELLOW + "60" },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: TEXTSEC },
  tabTextActive: { color: YELLOW, fontFamily: "Inter_600SemiBold" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  filterScroll: { marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterBtnActive: { backgroundColor: "rgba(253,218,36,0.08)" },
  filterText: { fontSize: 10, fontFamily: "Inter_500Medium", color: TEXTSEC },
  card: { backgroundColor: CARD, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  cardTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC },
  cardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT, marginBottom: 2 },
  cardSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  expanded: { marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)", gap: 8 },
  dLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC, flexShrink: 0 },
  dValue: { fontSize: 10, fontFamily: "Inter_500Medium", color: TEXT, flex: 1, textAlign: "right" },
  detailBox: { backgroundColor: "#0A0E1A", borderRadius: 8, padding: 10, marginTop: 8 },
  detailBoxLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 4 },
  detailBoxText: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT, lineHeight: 16 },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
});
