import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import type { RegisteredUser, SuspensionStep } from "@/context/AppContext";

const BG       = "#0A0E27";
const CARD_BG  = "#12163A";
const YELLOW   = "#FDDA24";
const GREEN    = "#22C55E";
const RED      = "#EF4444";
const BLUE     = "#3B82F6";
const PURPLE   = "#A78BFA";
const ORANGE   = "#F59E0B";
const TEXT     = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.5)";
const BORDER   = "rgba(255,255,255,0.08)";

type AppealUser = RegisteredUser & { _pendingStepsCount?: number };

function submissionTypeLabel(type?: string) {
  if (type === "photo") return "Foto / Cámara";
  if (type === "radicado") return "Radicado / Código";
  if (type === "qr") return "Código escaneado";
  return type ?? "—";
}

function stepTypeLabel(type?: string) {
  if (type === "identity_document")    return "Documento de identidad";
  if (type === "tax_certificate")      return "Comprobante tributario";
  if (type === "document")             return "Presentar documento";
  if (type === "identity_verification") return "Verificación de identidad";
  return "Paso requerido";
}

function StepImageViewer({ step, isDark }: { step: SuspensionStep; isDark?: boolean }) {
  const [show, setShow] = useState(false);
  if (!step.submittedImageBase64) return null;
  const mime = step.submittedImageMime ?? "image/jpeg";
  const src = `data:${mime};base64,${step.submittedImageBase64}`;
  return (
    <>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: BLUE + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start" }}
      >
        <Feather name="image" size={13} color={BLUE} />
        <Text style={{ fontSize: 12, color: BLUE, fontFamily: "Inter_600SemiBold" }}>Ver imagen adjunta</Text>
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: src }}
            style={{ width: "90%", height: 400, borderRadius: 12 }}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
            onPress={() => setShow(false)}
          >
            <Text style={{ color: "#1C1C1E", fontFamily: "Inter_700Bold", fontSize: 14 }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function RejectModal({ visible, onConfirm, onCancel }: {
  visible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const handle = () => {
    if (!reason.trim()) { setError("Ingresa un motivo."); return; }
    onConfirm(reason.trim());
    setReason("");
    setError("");
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: CARD_BG, borderRadius: 18, padding: 24, width: "100%", maxWidth: 420, gap: 14, borderWidth: 1, borderColor: RED + "40" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: RED + "22", alignItems: "center", justifyContent: "center" }}>
              <Feather name="x-circle" size={18} color={RED} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" }}>Verificación fallida</Text>
          </View>
          <Text style={{ fontSize: 13, color: TEXT_SEC, fontFamily: "Inter_400Regular", lineHeight: 19 }}>
            Indica el motivo del rechazo. El usuario verá este mensaje y podrá volver a enviar la documentación (máx. 5 intentos).
          </Text>
          <View>
            <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: "Inter_600SemiBold", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Motivo del rechazo</Text>
            <TextInput
              style={{ backgroundColor: "#1A1E40", borderRadius: 10, padding: 12, color: TEXT, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: error ? RED + "80" : BORDER, minHeight: 80, textAlignVertical: "top" }}
              value={reason}
              onChangeText={(v) => { setReason(v); setError(""); }}
              placeholder="Ej: El documento adjunto no es legible. Por favor envía una foto más clara."
              placeholderTextColor={TEXT_SEC}
              multiline
              numberOfLines={3}
            />
            {error ? <Text style={{ fontSize: 12, color: RED, fontFamily: "Inter_400Regular", marginTop: 4 }}>{error}</Text> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: "center" }} onPress={onCancel}>
              <Text style={{ color: TEXT_SEC, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 13, borderRadius: 10, backgroundColor: RED, alignItems: "center" }} onPress={handle}>
              <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>Confirmar rechazo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AppealCard({
  user,
  onApprove,
  onReject,
}: {
  user: AppealUser;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const steps = user.unblockSteps ?? [];
  const completedSteps = steps.filter((s) => s.completed);
  const isPendingReview = user.verificationStatus === "pending_review";
  const isFailed = user.verificationStatus === "failed";

  const statusColor = isPendingReview ? ORANGE : isFailed ? RED : BLUE;
  const statusLabel = isPendingReview ? "Pendiente de revisión" : isFailed ? "Verificación fallida" : "Enviado";
  const statusIcon: any = isPendingReview ? "clock" : isFailed ? "x-circle" : "send";

  const fullName = `${user.firstName} ${user.secondName ? user.secondName + " " : ""}${user.lastName} ${user.secondLastName ?? ""}`.trim();

  return (
    <View style={[styles.card, { borderColor: isPendingReview ? ORANGE + "50" : isFailed ? RED + "30" : BORDER }]}>
      {/* Header */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: statusColor + "22", alignItems: "center", justifyContent: "center" }}>
            <Feather name={statusIcon} size={20} color={statusColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" }}>{fullName}</Text>
              <View style={{ backgroundColor: statusColor + "22", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, color: statusColor, fontFamily: "Inter_700Bold" }}>{statusLabel}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: TEXT_SEC, fontFamily: "Inter_400Regular", marginTop: 2 }}>
              {user.documentType} {user.documentNumber}
            </Text>
            <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: "Inter_400Regular" }}>
              {user.email} · {user.phone}
            </Text>
            {user.suspensionReason && (
              <Text style={{ fontSize: 11, color: ORANGE, fontFamily: "Inter_500Medium", marginTop: 3 }}>
                Motivo suspensión: {user.suspensionReason}
              </Text>
            )}
            {user.verificationAttempts && user.verificationAttempts > 0 ? (
              <Text style={{ fontSize: 11, color: RED + "AA", fontFamily: "Inter_400Regular", marginTop: 2 }}>
                Intentos de verificación: {user.verificationAttempts}/5
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ backgroundColor: BLUE + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, color: BLUE, fontFamily: "Inter_700Bold" }}>{completedSteps.length}/{steps.length} pasos</Text>
            </View>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={TEXT_SEC} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={{ marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 14 }}>
          {/* Steps detail */}
          {steps.map((step, i) => (
            <View key={step.id} style={{ backgroundColor: "#0A0E27", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: step.completed ? GREEN + "30" : BORDER }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: step.completed ? GREEN + "22" : BORDER, alignItems: "center", justifyContent: "center" }}>
                  {step.completed
                    ? <Feather name="check" size={11} color={GREEN} />
                    : <Text style={{ fontSize: 10, color: TEXT_SEC, fontFamily: "Inter_700Bold" }}>{i + 1}</Text>
                  }
                </View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: step.completed ? GREEN : TEXT, fontFamily: "Inter_700Bold", flex: 1 }}>{step.label}</Text>
                {step.completed && (
                  <View style={{ backgroundColor: GREEN + "22", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, color: GREEN, fontFamily: "Inter_700Bold" }}>✓ Enviado</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: "Inter_400Regular", marginBottom: 4 }}>
                {stepTypeLabel(step.type)} {step.radicadoNumber ? `· Radicado: ${step.radicadoNumber}` : ""}
              </Text>
              {step.description ? (
                <Text style={{ fontSize: 12, color: TEXT_SEC, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 6 }}>{step.description}</Text>
              ) : null}
              {step.completed && (
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <View style={{ backgroundColor: PURPLE + "15", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name="upload" size={11} color={PURPLE} />
                      <Text style={{ fontSize: 11, color: PURPLE, fontFamily: "Inter_500Medium" }}>
                        Tipo: {submissionTypeLabel(step.submissionType)}
                      </Text>
                    </View>
                    {step.submittedValue ? (
                      <View style={{ backgroundColor: BLUE + "15", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, flex: 1 }}>
                        <Text style={{ fontSize: 11, color: BLUE, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
                          Valor: {step.submittedValue}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {step.completedAt && (
                    <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: "Inter_400Regular" }}>
                      Enviado: {new Date(step.completedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                    </Text>
                  )}
                  <StepImageViewer step={step} />
                </View>
              )}
            </View>
          ))}

          {/* Action buttons */}
          {isPendingReview && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: GREEN, borderRadius: 10, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                onPress={() => onApprove(user.id)}
              >
                <Feather name="check-circle" size={15} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>Aceptar y desbloquear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: RED + "22", borderRadius: 10, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: RED + "60" }}
                onPress={() => onReject(user.id)}
              >
                <Feather name="x-circle" size={15} color={RED} />
                <Text style={{ color: RED, fontFamily: "Inter_700Bold", fontSize: 13 }}>Verificación fallida</Text>
              </TouchableOpacity>
            </View>
          )}
          {isFailed && user.verificationFailedReason && (
            <View style={{ backgroundColor: RED + "15", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: RED + "30" }}>
              <Text style={{ fontSize: 12, color: RED, fontFamily: "Inter_700Bold", marginBottom: 4 }}>Motivo del rechazo enviado al usuario:</Text>
              <Text style={{ fontSize: 12, color: TEXT_SEC, fontFamily: "Inter_400Regular", lineHeight: 17 }}>{user.verificationFailedReason}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function ApelacionScreen() {
  const { getAllUsers, approveVerification, rejectVerification, addAuditLog } = useApp();
  const [users, setUsers] = useState<AppealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "failed">("pending");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const all = await getAllUsers();
      const appealUsers = all.filter((u) => {
        if (u.isAdmin) return false;
        const steps = u.unblockSteps ?? [];
        const hasCompletedSteps = steps.some((s) => s.completed);
        const hasPendingReview = u.verificationStatus === "pending_review";
        const hasFailed = u.verificationStatus === "failed";
        return hasCompletedSteps || hasPendingReview || hasFailed;
      });
      appealUsers.sort((a, b) => {
        const priority = (u: AppealUser) => {
          if (u.verificationStatus === "pending_review") return 0;
          if (u.verificationStatus === "failed") return 1;
          return 2;
        };
        return priority(a) - priority(b);
      });
      setUsers(appealUsers as AppealUser[]);
    } catch (e) {
      console.warn("Error loading appeal users", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAllUsers]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const onRefresh = () => { setRefreshing(true); loadUsers(); };

  const handleApprove = async (userId: string) => {
    Alert.alert(
      "Aceptar y desbloquear",
      "¿Confirmas que la verificación es correcta y deseas desbloquear la cuenta del usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            setProcessing(userId);
            try {
              await approveVerification(userId);
              await addAuditLog("VERIFICATION_APPROVED_ADMIN", `Admin aprobó verificación del usuario ${userId}.`, userId);
              await loadUsers();
            } catch {
              Alert.alert("Error", "No se pudo aprobar la verificación.");
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget);
    setRejectTarget(null);
    try {
      await rejectVerification(rejectTarget, reason);
      await addAuditLog("VERIFICATION_REJECTED_ADMIN", `Admin rechazó verificación del usuario ${rejectTarget}. Motivo: ${reason}.`, rejectTarget);
      await loadUsers();
    } catch {
      Alert.alert("Error", "No se pudo rechazar la verificación.");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = users.filter((u) => {
    if (filter === "pending") return u.verificationStatus === "pending_review" || (u.unblockSteps?.some((s) => s.completed) && !u.verificationStatus);
    if (filter === "failed") return u.verificationStatus === "failed";
    return true;
  });

  const pendingCount = users.filter((u) => u.verificationStatus === "pending_review").length;
  const failedCount = users.filter((u) => u.verificationStatus === "failed").length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: YELLOW + "22", alignItems: "center", justifyContent: "center" }}>
            <Feather name="shield" size={20} color={YELLOW} />
          </View>
          <View>
            <Text style={styles.title}>Apelación</Text>
            <Text style={styles.subtitle}>Revisión de documentos y verificación de identidad</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "pending" && { backgroundColor: ORANGE + "22", borderColor: ORANGE + "60" }]}
            onPress={() => setFilter("pending")}
          >
            {pendingCount > 0 && (
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>{pendingCount}</Text>
              </View>
            )}
            <Text style={[styles.filterBtnText, filter === "pending" && { color: ORANGE }]}>Pendientes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "failed" && { backgroundColor: RED + "22", borderColor: RED + "60" }]}
            onPress={() => setFilter("failed")}
          >
            {failedCount > 0 && (
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>{failedCount}</Text>
              </View>
            )}
            <Text style={[styles.filterBtnText, filter === "failed" && { color: RED }]}>Rechazadas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === "all" && { backgroundColor: BLUE + "22", borderColor: BLUE + "60" }]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterBtnText, filter === "all" && { color: BLUE }]}>Todas ({users.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={YELLOW} size="large" />
          <Text style={{ color: TEXT_SEC, fontFamily: "Inter_400Regular", marginTop: 12 }}>Cargando apelaciones...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
              <Feather name="inbox" size={48} color={TEXT_SEC} />
              <Text style={{ color: TEXT_SEC, fontFamily: "Inter_500Medium", marginTop: 14, fontSize: 15 }}>
                {filter === "pending" ? "No hay apelaciones pendientes" : filter === "failed" ? "No hay verificaciones rechazadas" : "No hay apelaciones"}
              </Text>
              <Text style={{ color: TEXT_SEC + "99", fontFamily: "Inter_400Regular", marginTop: 6, fontSize: 12, textAlign: "center", paddingHorizontal: 40 }}>
                Cuando un usuario complete todos sus pasos de verificación, aparecerá aquí para revisión.
              </Text>
            </View>
          ) : (
            filtered.map((user) => (
              <View key={user.id} style={{ opacity: processing === user.id ? 0.5 : 1 }}>
                {processing === user.id && (
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                    <ActivityIndicator color={YELLOW} />
                  </View>
                )}
                <AppealCard
                  user={user}
                  onApprove={handleApprove}
                  onReject={(id) => setRejectTarget(id)}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      <RejectModal
        visible={!!rejectTarget}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: CARD_BG, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, color: TEXT_SEC, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  filterBtnText: { fontSize: 12, color: TEXT_SEC, fontFamily: "Inter_600SemiBold" },
  card: { backgroundColor: CARD_BG, borderRadius: 14, padding: 16, borderWidth: 1 },
});
