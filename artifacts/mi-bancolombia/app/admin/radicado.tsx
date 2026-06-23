import { Feather } from "@expo/vector-icons";
import JsBarcode from "jsbarcode";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { RegisteredUser } from "@/context/AppContext";

const BG      = "#0A0E27";
const CARD    = "#111827";
const BORDER  = "rgba(253,218,36,0.18)";
const YELLOW  = "#FDDA24";
const GREEN   = "#22C55E";
const RED     = "#EF4444";
const BLUE    = "#3B82F6";
const ORANGE  = "#F59E0B";
const PURPLE  = "#A78BFA";
const TEXT    = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.45)";

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function generateRadicadoNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000000 + Math.random() * 8999999);
  return `${year}-${num}`;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

type Radicado = {
  id: string;
  radicado: string;
  userId: string;
  userName: string;
  documentNumber: string;
  motive: string;
  description?: string | null;
  expiresAt: string;
  createdBy?: string | null;
  status: string;
  createdAt?: string;
};

/* ── Inline barcode renderer with download ── */
function BarcodeCard({
  value,
  isDark,
  radicadoRecord,
}: {
  value: string;
  isDark?: boolean;
  radicadoRecord?: Partial<Radicado>;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const bg = isDark ? "#1C1C1E" : "#FFFFFF";
  const lineColor = isDark ? "#FFFFFF" : "#1C1C1E";

  useEffect(() => {
    if (!svgRef.current || !value || Platform.OS !== "web") return;
    try {
      JsBarcode(svgRef.current, value.toUpperCase(), {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 13,
        margin: 10,
        background: "#FFFFFF",
        lineColor: "#1C1C1E",
        font: "monospace",
      });
    } catch {}
  }, [value]);

  const handleDownload = () => {
    if (Platform.OS !== "web") {
      Alert.alert("Descarga", "La descarga del código de barras está disponible en la versión web de la app.");
      return;
    }
    const svg = svgRef.current as any;
    if (!svg) return;
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `radicado-${value}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      Alert.alert("Error", "No se pudo descargar el código de barras.");
    }
  };

  if (Platform.OS !== "web") {
    return (
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, alignItems: "center", gap: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 2, height: 60 }}>
          {Array.from(value).map((ch, i) => {
            const w = (ch.charCodeAt(0) % 3) + 1;
            return (
              <View key={i} style={{ width: w * 2, height: 60, backgroundColor: i % 2 === 0 ? "#1C1C1E" : "transparent" }} />
            );
          })}
        </View>
        <Text style={{ fontFamily: "monospace", fontSize: 14, color: "#1C1C1E", letterSpacing: 2 }}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, alignItems: "center" }}>
        {/* @ts-ignore web-only */}
        <svg ref={svgRef} style={{ width: "100%", maxWidth: 360 }} />
        {radicadoRecord && (
          <View style={{ marginTop: 8, gap: 3, width: "100%", paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace", textAlign: "center" }}>
              {radicadoRecord.userName} · {radicadoRecord.documentNumber}
            </Text>
            <Text style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace", textAlign: "center" }}>
              {radicadoRecord.motive} · Vence: {radicadoRecord.expiresAt ? new Date(radicadoRecord.expiresAt + "T00:00:00").toLocaleDateString("es-CO") : ""}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13 }}
        onPress={handleDownload}
        activeOpacity={0.85}
      >
        <Feather name="download" size={16} color="#FFFFFF" />
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Descargar código de barras (.svg)</Text>
      </TouchableOpacity>
    </View>
  );
}

function RadicadoRow({ r, onDelete }: { r: Radicado; onDelete: (id: string) => void }) {
  const [exp, setExp] = useState(false);
  const expired = new Date(r.expiresAt + "T23:59:59") < new Date();
  const statusColor = r.status === "active" && !expired ? GREEN : expired ? RED : ORANGE;
  const statusLabel = expired ? "Vencido" : r.status === "active" ? "Activo" : r.status;

  return (
    <TouchableOpacity onPress={() => setExp(!exp)} style={[styles.row, { borderColor: statusColor + "30" }]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: statusColor + "18", alignItems: "center", justifyContent: "center" }}>
          <Feather name="tag" size={17} color={statusColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", letterSpacing: 0.5 }}>{r.radicado}</Text>
            <View style={{ backgroundColor: statusColor + "22", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: statusColor, fontFamily: "Inter_700Bold" }}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 }}>
            {r.userName} · {r.documentNumber}
          </Text>
          <Text style={{ fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" }}>
            Motivo: {r.motive}
          </Text>
          <Text style={{ fontSize: 11, color: expired ? RED + "AA" : TEXTSEC, fontFamily: "Inter_400Regular" }}>
            Vence: {new Date(r.expiresAt + "T00:00:00").toLocaleDateString("es-CO")}
          </Text>
        </View>
        <Feather name={exp ? "chevron-up" : "chevron-down"} size={16} color={TEXTSEC} />
      </View>
      {exp && (
        <View style={{ marginTop: 14, gap: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 14 }}>
          {r.description ? (
            <Text style={{ fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 17 }}>{r.description}</Text>
          ) : null}
          <BarcodeCard value={r.radicado} radicadoRecord={r} />
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: RED + "50", backgroundColor: RED + "12" }}
            onPress={() => onDelete(r.id)}
          >
            <Feather name="trash-2" size={14} color={RED} />
            <Text style={{ fontSize: 13, color: RED, fontFamily: "Inter_600SemiBold" }}>Eliminar radicado</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RadicadoScreen() {
  const { currentUser, getAllUsers, addAuditLog } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /* Form state */
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [radicadoNum, setRadicadoNum] = useState(generateRadicadoNumber());
  const [motive, setMotive] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [saving, setSaving] = useState(false);
  const [previewValue, setPreviewValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Data */
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [radicados, setRadicados] = useState<Radicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allUsers, res] = await Promise.all([
        getAllUsers(),
        fetch("/api/radicados").then((r) => r.json()),
      ]);
      setUsers(allUsers.filter((u) => !u.isAdmin));
      setRadicados(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn("Error loading radicados", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAllUsers]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.documentNumber.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedUser) e.user = "Selecciona un usuario";
    if (!radicadoNum.trim()) e.radicado = "El número de radicado es obligatorio";
    if (!motive.trim()) e.motive = "El motivo es obligatorio";
    if (!expiresAt) e.expires = "La fecha de vencimiento es obligatoria";
    else {
      const d = new Date(expiresAt + "T00:00:00");
      if (d <= new Date()) e.expires = "La fecha debe ser futura";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || !selectedUser) return;
    setSaving(true);
    try {
      const body = {
        id: `rad_${uid()}`,
        radicado: radicadoNum.trim().toUpperCase(),
        userId: selectedUser.id,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
        documentNumber: selectedUser.documentNumber,
        motive: motive.trim(),
        description: description.trim() || null,
        expiresAt,
        createdBy: currentUser?.id ?? "admin",
        status: "active",
      };
      const res = await fetch("/api/radicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al crear radicado");
      const created: Radicado = await res.json();
      setPreviewValue(created.radicado);
      setRadicados((prev) => [created, ...prev]);
      await addAuditLog("CREATE_RADICADO", `Radicado ${created.radicado} creado para ${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.documentNumber}). Motivo: ${motive}. Vence: ${expiresAt}.`, selectedUser.id);
      // Reset form
      setRadicadoNum(generateRadicadoNumber());
      setMotive("");
      setDescription("");
      setExpiresAt(defaultExpiry());
      setSelectedUser(null);
      setErrors({});
    } catch {
      Alert.alert("Error", "No se pudo crear el radicado. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar radicado", "¿Seguro que deseas eliminar este radicado? El usuario no podrá verificarlo.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`/api/radicados/${id}`, { method: "DELETE" });
            setRadicados((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar el radicado.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={YELLOW} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Asignar radicado de documento</Text>
            <Text style={styles.headerSub}>Genera y asigna códigos de barras para documentos</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={YELLOW} />}
      >
        {/* Form */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ORANGE + "22", alignItems: "center", justifyContent: "center" }}>
              <Feather name="tag" size={18} color={ORANGE} />
            </View>
            <Text style={styles.cardTitle}>Nuevo radicado</Text>
          </View>

          {/* User selector */}
          <Text style={styles.fieldLabel}>Usuario asignado *</Text>
          <TouchableOpacity
            style={[styles.selectorBtn, errors.user ? { borderColor: RED + "80" } : {}]}
            onPress={() => setShowUserPicker(true)}
          >
            {selectedUser ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: TEXT, fontFamily: "Inter_600SemiBold" }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text style={{ fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" }}>
                  {selectedUser.documentType} {selectedUser.documentNumber}
                </Text>
              </View>
            ) : (
              <Text style={{ flex: 1, fontSize: 14, color: TEXTSEC, fontFamily: "Inter_400Regular" }}>Seleccionar usuario...</Text>
            )}
            <Feather name="chevron-down" size={18} color={TEXTSEC} />
          </TouchableOpacity>
          {errors.user ? <Text style={styles.fieldError}>{errors.user}</Text> : null}

          {/* Radicado number */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Número de radicado *</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.radicado ? { borderColor: RED + "80" } : {}]}
              value={radicadoNum}
              onChangeText={(v) => { setRadicadoNum(v.toUpperCase()); setErrors((e) => ({ ...e, radicado: "" })); }}
              placeholder="2024-1234567"
              placeholderTextColor={TEXTSEC}
              autoCapitalize="characters"
              fontSize={16}
            />
            <TouchableOpacity
              style={{ backgroundColor: BLUE + "22", borderRadius: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BLUE + "40" }}
              onPress={() => setRadicadoNum(generateRadicadoNumber())}
            >
              <Feather name="refresh-cw" size={16} color={BLUE} />
            </TouchableOpacity>
          </View>
          {errors.radicado ? <Text style={styles.fieldError}>{errors.radicado}</Text> : null}

          {/* Motive */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Motivo / Tipo de trámite *</Text>
          <TextInput
            style={[styles.input, errors.motive ? { borderColor: RED + "80" } : {}]}
            value={motive}
            onChangeText={(v) => { setMotive(v); setErrors((e) => ({ ...e, motive: "" })); }}
            placeholder="Ej: Verificación de identidad"
            placeholderTextColor={TEXTSEC}
            fontSize={16}
          />
          {errors.motive ? <Text style={styles.fieldError}>{errors.motive}</Text> : null}

          {/* Description */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Descripción adicional (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: "top", paddingTop: 10 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Información adicional del documento..."
            placeholderTextColor={TEXTSEC}
            multiline
            numberOfLines={3}
            fontSize={16}
          />

          {/* Expiry date */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Fecha de vencimiento *</Text>
          <TextInput
            style={[styles.input, errors.expires ? { borderColor: RED + "80" } : {}]}
            value={expiresAt}
            onChangeText={(v) => { setExpiresAt(v); setErrors((e) => ({ ...e, expires: "" })); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={TEXTSEC}
            keyboardType="numbers-and-punctuation"
            fontSize={16}
          />
          <Text style={{ fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 4 }}>
            Formato: AAAA-MM-DD · Fecha actual: {new Date().toISOString().slice(0, 10)}
          </Text>
          {errors.expires ? <Text style={styles.fieldError}>{errors.expires}</Text> : null}

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createBtn, { opacity: saving ? 0.6 : 1 }]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#1C1C1E" size="small" />
            ) : (
              <Feather name="plus-circle" size={17} color="#1C1C1E" />
            )}
            <Text style={styles.createBtnText}>{saving ? "Creando..." : "Crear y generar código de barras"}</Text>
          </TouchableOpacity>
        </View>

        {/* Preview of last created */}
        {previewValue !== "" && (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Feather name="check-circle" size={18} color={GREEN} />
              <Text style={[styles.cardTitle, { color: GREEN }]}>Radicado creado — Código de barras</Text>
            </View>
            <BarcodeCard
              value={previewValue}
              radicadoRecord={radicados.find((r) => r.radicado === previewValue)}
            />
            <View style={{ marginTop: 12, padding: 12, backgroundColor: BLUE + "12", borderRadius: 10, borderWidth: 1, borderColor: BLUE + "30" }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <Feather name="info" size={14} color={BLUE} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 12, color: BLUE, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
                  Descarga el código de barras y pégalo en el documento físico. El usuario deberá escanearlo desde la app para verificar que coincide con el radicado asignado.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Radicados list */}
        <View>
          <Text style={[styles.sectionLabel]}>RADICADOS CREADOS ({radicados.length})</Text>
          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator color={YELLOW} />
            </View>
          ) : radicados.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Feather name="tag" size={40} color={TEXTSEC} />
              <Text style={{ color: TEXTSEC, fontFamily: "Inter_500Medium", marginTop: 12 }}>No hay radicados creados aún</Text>
            </View>
          ) : (
            radicados.map((r) => (
              <RadicadoRow key={r.id} r={r} onDelete={handleDelete} />
            ))
          )}
        </View>
      </ScrollView>

      {/* User picker modal */}
      <Modal visible={showUserPicker} transparent animationType="slide" onRequestClose={() => setShowUserPicker(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingBottom: 20 }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 14 }} />
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", marginBottom: 12 }}>Seleccionar usuario</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, height: 44 }}>
                <Feather name="search" size={15} color={TEXTSEC} />
                <TextInput
                  style={{ flex: 1, color: TEXT, fontFamily: "Inter_400Regular", marginLeft: 8, fontSize: 16 }}
                  value={userSearch}
                  onChangeText={setUserSearch}
                  placeholder="Buscar por nombre, documento..."
                  placeholderTextColor={TEXTSEC}
                />
              </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {filteredUsers.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userRow,
                    selectedUser?.id === u.id && { backgroundColor: YELLOW + "15", borderColor: YELLOW + "60" },
                  ]}
                  onPress={() => {
                    setSelectedUser(u);
                    setErrors((e) => ({ ...e, user: "" }));
                    setShowUserPicker(false);
                    setUserSearch("");
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE + "22", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: BLUE, fontFamily: "Inter_700Bold" }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: TEXT, fontFamily: "Inter_600SemiBold" }}>
                      {u.firstName} {u.lastName}
                    </Text>
                    <Text style={{ fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" }}>
                      {u.documentType} {u.documentNumber} · {u.email}
                    </Text>
                  </View>
                  {selectedUser?.id === u.id && <Feather name="check" size={16} color={YELLOW} />}
                </TouchableOpacity>
              ))}
              {filteredUsers.length === 0 && (
                <Text style={{ textAlign: "center", color: TEXTSEC, fontFamily: "Inter_400Regular", paddingVertical: 24 }}>
                  No se encontraron usuarios
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={{ marginHorizontal: 16, marginTop: 14, paddingVertical: 13, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)" }}
              onPress={() => { setShowUserPicker(false); setUserSearch(""); }}
            >
              <Text style={{ color: TEXTSEC, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER },
  cardTitle: { fontSize: 15, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.2, fontFamily: "Inter_700Bold", marginBottom: 10, paddingHorizontal: 2,
  },
  fieldLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8, fontFamily: "Inter_700Bold", marginBottom: 6, textTransform: "uppercase",
  },
  fieldError: { fontSize: 11, color: RED, fontFamily: "Inter_400Regular", marginTop: 4 },
  selectorBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 12, minHeight: 50,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, paddingHorizontal: 12, height: 50, color: TEXT, fontFamily: "Inter_400Regular",
  },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, marginTop: 20,
  },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  row: { backgroundColor: "#111827", borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  userRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
});
