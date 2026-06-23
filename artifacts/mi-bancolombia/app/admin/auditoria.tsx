import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { AuditLog, LoginEvent, PinChangeRequest, PwaInstallEvent } from "@/context/AppContext";

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
  PIN_CHANGE_REQUEST: ORANGE,
  PIN_CHANGE_APPROVED: GREEN,
  PIN_CHANGE_REJECTED: RED,
  PWA_INSTALLED: BLUE,
  SUBMIT_UNBLOCK_STEP: PURPLE,
};

type Tab = "logins" | "audit" | "pin_requests" | "pwa";

export default function AuditoriaScreen() {
  const { getAuditLogs, getLoginEvents, getPinChangeRequests, approvePinChange, rejectPinChange, getPwaInstallEvents } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [tab, setTab] = useState<Tab>("logins");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [pinRequests, setPinRequests] = useState<PinChangeRequest[]>([]);
  const [pwaEvents, setPwaEvents] = useState<PwaInstallEvent[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("Todas");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const auditActions = ["Todas", "ADMIN_LOGIN", "CREATE_USER", "UPDATE_USER", "DELETE_USER", "CHANGE_STATUS", "UPDATE_ACCOUNT", "ADD_TRANSACTION", "PIN_CHANGE_REQUEST", "PWA_INSTALLED"];

  const load = useCallback(async () => {
    setLoading(true);
    const [l, ev, pr, pwa] = await Promise.all([getAuditLogs(), getLoginEvents(), getPinChangeRequests(), getPwaInstallEvents()]);
    setLogs(l);
    setLoginEvents(ev);
    setPinRequests(pr);
    setPwaEvents(pwa);
    setLoading(false);
  }, [getAuditLogs, getLoginEvents, getPinChangeRequests, getPwaInstallEvents]);

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
      l.deviceInfo.toLowerCase().includes(q) ||
      (l.ip ?? "").includes(q)
    );
  });

  const filteredPinRequests = pinRequests.filter((r) => {
    const q = search.toLowerCase();
    return r.documentNumber.includes(q) || r.userName.toLowerCase().includes(q) || r.status.includes(q);
  });

  const filteredPwa = pwaEvents.filter((e) => {
    const q = search.toLowerCase();
    return e.platform.includes(q) || (e.documentNumber ?? "").includes(q) || e.deviceInfo.toLowerCase().includes(q);
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
  const pendingPins = pinRequests.filter((r) => r.status === "pending").length;
  const pwaCount = pwaEvents.length;

  const handleApprove = async (id: string) => {
    Alert.alert("Aprobar cambio de clave", "¿Confirmas la aprobación? La nueva clave entrará en vigor de inmediato.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Aprobar", onPress: async () => { await approvePinChange(id); load(); } },
    ]);
  };

  const handleRejectOpen = (id: string) => {
    setRejectModal(id);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    await rejectPinChange(rejectModal, rejectReason || "Rechazado por el administrador");
    setRejectModal(null);
    setRejectReason("");
    load();
  };

  const TABS: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: "logins",       icon: "log-in",   label: "Sesiones" },
    { key: "pin_requests", icon: "lock",     label: "Claves", badge: pendingPins },
    { key: "pwa",          icon: "download", label: "PWA", badge: pwaCount },
    { key: "audit",        icon: "shield",   label: "Admin" },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Auditoría del Sistema</Text>
          <Text style={styles.sub}>
            {tab === "logins" ? `${loginEvents.length} eventos` :
             tab === "pin_requests" ? `${pinRequests.length} solicitudes` :
             tab === "pwa" ? `${pwaEvents.length} instalaciones` :
             `${logs.length} acciones`}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Feather name="refresh-cw" size={16} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatItem label="Ingresos" count={successLogins} color={GREEN} />
        <StatItem label="Fallidos" count={failedLogins} color={RED} />
        <StatItem label="Claves pend." count={pendingPins} color={ORANGE} />
        <StatItem label="PWA inst." count={pwaCount} color={BLUE} />
        <StatItem label="Acciones" count={logs.length} color={PURPLE} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }} contentContainerStyle={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={13} color={tab === t.key ? YELLOW : TEXTSEC} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {(t.badge ?? 0) > 0 && (
              <View style={{ backgroundColor: t.key === "pin_requests" ? ORANGE : BLUE, borderRadius: 8, minWidth: 16, paddingHorizontal: 4, height: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF" }}>{t.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

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

        /* ─── SESIONES ─── */
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
                      <Text style={styles.cardSub}>IP: {ev.ip || "—"} · {ev.platform.toUpperCase()}</Text>
                      {(ev.latitude || ev.city) ? (
                        <Text style={styles.cardSub}>📍 {ev.city || `${ev.latitude}, ${ev.longitude}`}</Text>
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

        /* ─── SOLICITUDES DE CAMBIO DE CLAVE ─── */
        ) : tab === "pin_requests" ? (
          filteredPinRequests.length === 0 ? (
            <Text style={styles.empty}>Sin solicitudes de cambio de clave</Text>
          ) : (
            filteredPinRequests.map((req) => {
              const statusColor = req.status === "pending" ? ORANGE : req.status === "approved" ? GREEN : RED;
              const statusLabel = req.status === "pending" ? "PENDIENTE" : req.status === "approved" ? "APROBADO" : "RECHAZADO";
              return (
                <TouchableOpacity
                  key={req.id}
                  style={styles.card}
                  onPress={() => setExpanded(expanded === req.id ? null : req.id)}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.dot, { backgroundColor: statusColor }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.badge, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
                          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                        <Text style={styles.cardTime}>{fmt(req.requestedAt)}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{req.userName}</Text>
                      <Text style={styles.cardSub}>Doc: {req.documentNumber} · ID: {req.userId.slice(0, 16)}</Text>
                      {req.rejectionReason && (
                        <Text style={[styles.cardSub, { color: RED }]}>Motivo rechazo: {req.rejectionReason}</Text>
                      )}
                    </View>
                    <Feather name={expanded === req.id ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
                  </View>

                  {req.status === "pending" && (
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: GREEN + "22", borderWidth: 1, borderColor: GREEN + "40" }}
                        onPress={(e) => { e.stopPropagation?.(); handleApprove(req.id); }}
                      >
                        <Feather name="check" size={14} color={GREEN} />
                        <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: GREEN }}>Aprobar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: RED + "22", borderWidth: 1, borderColor: RED + "40" }}
                        onPress={(e) => { e.stopPropagation?.(); handleRejectOpen(req.id); }}
                      >
                        <Feather name="x" size={14} color={RED} />
                        <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: RED }}>Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {expanded === req.id && (
                    <View style={styles.expanded}>
                      <DetailRow label="ID solicitud" value={req.id} />
                      <DetailRow label="Usuario ID" value={req.userId} />
                      <DetailRow label="Nombre" value={req.userName} />
                      <DetailRow label="Documento" value={req.documentNumber} />
                      <DetailRow label="Fecha solicitud" value={fmt(req.requestedAt)} />
                      <DetailRow label="Estado" value={statusLabel} />
                      {req.processedAt && <DetailRow label="Procesado el" value={fmt(req.processedAt)} />}
                      {req.processedBy && <DetailRow label="Procesado por" value={req.processedBy} />}
                      {req.rejectionReason && <DetailRow label="Motivo rechazo" value={req.rejectionReason} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )

        /* ─── INSTALACIONES PWA ─── */
        ) : tab === "pwa" ? (
          filteredPwa.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <Feather name="download" size={32} color={TEXTSEC} />
              <Text style={styles.empty}>Aún no hay instalaciones de la app registradas</Text>
              <Text style={{ fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 }}>
                Cuando un usuario instale la app en su dispositivo desde el navegador, aparecerá aquí con su IP, plataforma y hora.
              </Text>
            </View>
          ) : (
            filteredPwa.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={styles.card}
                onPress={() => setExpanded(expanded === ev.id ? null : ev.id)}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.dot, { backgroundColor: BLUE }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.badge, { backgroundColor: BLUE + "22", borderColor: BLUE + "44" }]}>
                        <Text style={[styles.badgeText, { color: BLUE }]}>PWA INSTALADA</Text>
                      </View>
                      <Text style={styles.cardTime}>{fmt(ev.timestamp)}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{ev.documentNumber ? `Doc: ${ev.documentNumber}` : "Usuario no identificado"}</Text>
                    <Text style={styles.cardSub}>{ev.platform.toUpperCase()} · {ev.deviceInfo.slice(0, 50)}</Text>
                  </View>
                  <Feather name={expanded === ev.id ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
                </View>
                {expanded === ev.id && (
                  <View style={styles.expanded}>
                    <DetailRow label="ID evento" value={ev.id} />
                    <DetailRow label="Timestamp" value={fmt(ev.timestamp)} />
                    <DetailRow label="Usuario ID" value={ev.userId ?? "—"} />
                    <DetailRow label="Documento" value={ev.documentNumber ?? "—"} />
                    <DetailRow label="Plataforma" value={ev.platform} />
                    <DetailRow label="Dispositivo" value={ev.deviceInfo} />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )

        /* ─── ACCIONES ADMIN ─── */
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
                    {log.ip && <Text style={styles.cardSub}>IP: {log.ip}</Text>}
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

      {/* ─── Modal rechazo ─── */}
      <Modal visible={!!rejectModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: CARD, borderRadius: 18, padding: 22, width: "100%", gap: 14, borderWidth: 1, borderColor: RED + "40" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="x-circle" size={20} color={RED} />
              <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: TEXT }}>Rechazar solicitud</Text>
            </View>
            <Text style={{ fontSize: 13, color: TEXTSEC, fontFamily: "Inter_400Regular" }}>Ingresa el motivo del rechazo (opcional):</Text>
            <TextInput
              style={{ backgroundColor: BG, color: TEXT, borderRadius: 10, padding: 12, fontFamily: "Inter_400Regular", fontSize: 16, borderWidth: 1, borderColor: RED + "40", minHeight: 60, textAlignVertical: "top" }}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Ej: Documento no legible, información inconsistente..."
              placeholderTextColor={TEXTSEC}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center" }}
                onPress={() => setRejectModal(null)}
              >
                <Text style={{ fontFamily: "Inter_600SemiBold", color: TEXTSEC }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: RED + "22", borderWidth: 1, borderColor: RED + "60", alignItems: "center" }}
                onPress={handleRejectConfirm}
              >
                <Text style={{ fontFamily: "Inter_700Bold", color: RED }}>Confirmar rechazo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  stats: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  statItem: { flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, padding: 8, alignItems: "center" },
  statNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 8, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2, textAlign: "center" },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  tabBtnActive: { backgroundColor: "rgba(253,218,36,0.1)", borderColor: YELLOW + "60" },
  tabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC },
  tabTextActive: { color: YELLOW, fontFamily: "Inter_600SemiBold" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
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
