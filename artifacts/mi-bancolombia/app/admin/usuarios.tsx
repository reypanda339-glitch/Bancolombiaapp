import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import {
  Alert,
  Image,
  Modal,
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
import type { RegisteredUser, SuspensionStep, StepType } from "@/context/AppContext";
import { ALL_DOC_TYPES, DOC_TYPE_LABELS, COUNTRIES, getCountryByCode, formatBalance } from "@/constants/countries";
import * as Clipboard from "expo-clipboard";
import type { DocType } from "@/constants/countries";
import { DateInput } from "@/components/DateInput";

const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const BLUE = "#60A5FA";

const STATUS_COLOR: Record<string, string> = { active: GREEN, suspended: ORANGE, blocked: RED };
const STATUS_LABEL: Record<string, string> = { active: "Activo", suspended: "Suspendido", blocked: "Bloqueado" };

function getAppUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://bancolombia.replit.app";
}

const SUSPENSION_REASONS = [
  "Actividad sospechosa",
  "Solicitud del titular",
  "Deuda pendiente",
  "Verificación de identidad",
  "Reportado por fraude",
  "Incumplimiento de términos",
  "Investigación interna",
  "Otro motivo",
];

export default function UsuariosScreen() {
  const { getAllUsers, updateUser, deleteUser, createUser, addAuditLog, getAllAccounts } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RegisteredUser | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editData, setEditData] = useState<Partial<RegisteredUser>>({});
  const [loading, setLoading] = useState(true);

  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<RegisteredUser | null>(null);
  const [suspendStatus, setSuspendStatus] = useState<"suspended" | "blocked">("suspended");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendCustomReason, setSuspendCustomReason] = useState("");
  const [suspendDocs, setSuspendDocs] = useState<string[]>([]);
  const [suspendNewDoc, setSuspendNewDoc] = useState("");
  const [suspendSteps, setSuspendSteps] = useState<SuspensionStep[]>([]);
  const [suspendNewStepLabel, setSuspendNewStepLabel] = useState("");
  const [suspendNewStepDesc, setSuspendNewStepDesc] = useState("");
  const [suspendNewStepType, setSuspendNewStepType] = useState<StepType>("document");
  const [suspendNewStepRadicado, setSuspendNewStepRadicado] = useState("");
  const [targetRadicados,        setTargetRadicados]        = useState<any[]>([]);

  const [newUser, setNewUser] = useState<{
    firstName: string; secondName: string; lastName: string; secondLastName: string;
    documentType: DocType; documentNumber: string; birthDate: string; email: string;
    phone: string; pin: string; confirmPin: string; countryResidence: string;
    countryBirth: string; currencyCode: string; currencySymbol: string;
    address: string; motherName: string; motherPhone: string; googleEmail: string;
  }>({
    firstName: "", secondName: "", lastName: "", secondLastName: "",
    documentType: "CC", documentNumber: "", birthDate: "", email: "",
    phone: "", pin: "", confirmPin: "",
    countryResidence: "CO", countryBirth: "CO", currencyCode: "COP", currencySymbol: "$",
    address: "", motherName: "", motherPhone: "", googleEmail: "",
  });
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    const u = await getAllUsers();
    setUsers(u.filter((x) => !x.isAdmin));
    setLoading(false);
  }, [getAllUsers]);

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.documentNumber.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q)
    );
  });

  const openEdit = (u: RegisteredUser) => {
    setEditData({
      firstName: u.firstName,
      secondName: u.secondName,
      lastName: u.lastName,
      secondLastName: u.secondLastName,
      email: u.email,
      phone: u.phone,
      address: u.address ?? "",
      motherName: u.motherName ?? "",
      motherPhone: u.motherPhone ?? "",
      googleEmail: u.googleEmail ?? "",
      pin: u.pin,
      status: u.status ?? "active",
    });
    setSelected(u);
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    await updateUser(selected.id, editData);
    setEditModal(false);
    load();
  };

  const handleDelete = (u: RegisteredUser) => {
    if (Platform.OS === "web") {
      const ok = window.confirm(`¿Eliminar a ${u.firstName} ${u.lastName}? Esta acción no se puede deshacer.`);
      if (ok) doDelete(u);
    } else {
      doDelete(u);
    }
  };

  const doDelete = async (u: RegisteredUser) => {
    await deleteUser(u.id);
    if (selected?.id === u.id) setSelected(null);
    load();
  };

  const toggleStatus = (u: RegisteredUser, status: "active" | "suspended" | "blocked") => {
    if (status === "active") {
      updateUser(u.id, {
        status: "active",
        suspensionReason: null as any,
        suspensionDate: null as any,
        requiredDocuments: null as any,
        unblockSteps: null as any,
      }).then(() => {
        load();
        addAuditLog("ACTIVATE_USER", `Cuenta activada: ${u.firstName} ${u.lastName} (${u.documentNumber})`, u.id);
        if (selected?.id === u.id) setSelected((p) => p ? { ...p, status: "active", suspensionReason: undefined, requiredDocuments: undefined, unblockSteps: undefined } : p);
      });
    } else {
      setSuspendTarget(u);
      setSuspendStatus(status);
      setSuspendReason(SUSPENSION_REASONS[0]);
      setSuspendCustomReason("");
      setSuspendDocs([]);
      setSuspendNewDoc("");
      setSuspendSteps([]);
      setSuspendNewStepLabel("");
      setSuspendNewStepDesc("");
      setSuspendNewStepType("document");
      setSuspendNewStepRadicado("");
      setTargetRadicados([]);
      setSuspendModal(true);
      const now = Date.now();
      fetch(`/api/radicados?userId=${encodeURIComponent(u.id)}`)
        .then((r) => r.json())
        .then((data) => {
          const active = Array.isArray(data)
            ? data.filter((r: any) => r.status === "active" && new Date(r.expiresAt + "T23:59:59").getTime() >= now)
            : [];
          setTargetRadicados(active);
          if (active.length > 0) {
            const radicadoSteps = active.map((rad: any) => ({
              id: `rad_${rad.id}_${Date.now()}`,
              label: rad.motive,
              description: `Vence el ${new Date(rad.expiresAt + "T00:00:00").toLocaleDateString("es-CO")}. Presenta el comprobante emitido por la entidad.`,
              type: "radicado" as const,
              radicadoNumber: rad.radicado,
              expiresAt: rad.expiresAt,
            }));
            setSuspendSteps(radicadoSteps);
          }
        })
        .catch(() => {});
    }
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    const finalReason = suspendReason === "Otro motivo"
      ? (suspendCustomReason.trim() || "Sin motivo especificado")
      : suspendReason;
    await updateUser(suspendTarget.id, {
      status: suspendStatus,
      suspensionReason: finalReason,
      suspensionDate: new Date().toISOString(),
      requiredDocuments: suspendDocs.length > 0 ? suspendDocs : undefined,
      unblockSteps: suspendSteps.length > 0 ? suspendSteps : undefined,
    });
    if (addAuditLog) {
      await addAuditLog(
        suspendStatus === "suspended" ? "SUSPEND_USER" : "BLOCK_USER",
        `${STATUS_LABEL[suspendStatus]}: ${suspendTarget.firstName} ${suspendTarget.lastName} (${suspendTarget.documentNumber}) — Motivo: ${finalReason} · Docs: ${suspendDocs.length} · Pasos: ${suspendSteps.length}`,
        suspendTarget.id
      );
    }
    setSuspendModal(false);
    setSuspendTarget(null);
    load();
    if (selected?.id === suspendTarget.id) {
      setSelected((p) => p ? {
        ...p, status: suspendStatus, suspensionReason: finalReason,
        requiredDocuments: suspendDocs.length > 0 ? suspendDocs : undefined,
        unblockSteps: suspendSteps.length > 0 ? suspendSteps : undefined,
      } : p);
    }
  };

  const addDoc = () => {
    const t = suspendNewDoc.trim();
    if (!t) return;
    setSuspendDocs((p) => [...p, t]);
    setSuspendNewDoc("");
  };

  const removeDoc = (i: number) => setSuspendDocs((p) => p.filter((_, idx) => idx !== i));

  const addStep = () => {
    const label = suspendNewStepLabel.trim();
    if (!label) return;
    setSuspendSteps((p) => [...p, {
      id: Date.now().toString(),
      label,
      description: suspendNewStepDesc.trim(),
      type: suspendNewStepType,
      radicadoNumber: suspendNewStepRadicado.trim() || undefined,
    }]);
    setSuspendNewStepLabel("");
    setSuspendNewStepDesc("");
    setSuspendNewStepRadicado("");
  };

  const removeStep = (id: string) => setSuspendSteps((p) => p.filter((s) => s.id !== id));

  const copyTemplate = async (u: RegisteredUser) => {
    try {
      const allAccounts = await getAllAccounts();
      const userAccounts = allAccounts.filter((a) => a.userId === u.id);
      const savings = userAccounts.find((a) => a.type === "savings") ?? userAccounts[0];
      const balance = savings ? formatBalance(savings.balance, savings.currencyCode, savings.currencySymbol, true) : "$ 0.00 COP";
      const accountNumber = savings ? savings.number : "—";
      const fullName = [u.firstName, u.secondName, u.lastName, u.secondLastName].filter(Boolean).join(" ").toUpperCase();
      const appUrl = getAppUrl();

      const template =
`*ACTIVACIÓN DE CUENTA BANCARIA – BANCOLOMBIA*
Estimado *${fullName}*,
por medio de este mensaje se realiza la entrega de los datos correspondientes a su cuenta bancaria Bancolombia, habilitada para su activación y acceso.

🏦 Banco: Bancolombia
💳 Tipo de cuenta: Ahorros
🔢 Número de cuenta: *${accountNumber}*

💰 *Saldo disponible:* ${balance}
👤 *Titular:* *${fullName}*
🪪 *Documento (${u.documentType}):* ${u.documentNumber}
📧 *Correo electrónico:* ${u.email}
*🔐 Datos de acceso*
*Usuario*: ${u.documentNumber}
*Contraseña*: ${u.pin}
*🔗 Link de acceso Bancolombia:*
${appUrl}
Este enlace le permitirá ingresar a su cuenta y realizar la activación correspondiente.
Quedamos atentos ante cualquier novedad.`;

      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(template);
      } else {
        await Clipboard.setStringAsync(template);
      }

      if (Platform.OS === "web") {
        window.alert("✅ Plantilla copiada al portapapeles");
      } else {
        Alert.alert("✅ Copiado", "La plantilla fue copiada al portapapeles.");
      }
    } catch {
      Alert.alert("Error", "No se pudo copiar la plantilla.");
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!newUser.firstName.trim()) return setCreateError("Ingresa el primer nombre");
    if (!newUser.lastName.trim()) return setCreateError("Ingresa el primer apellido");
    if (!newUser.documentNumber.trim() || newUser.documentNumber.length < 5) return setCreateError("Documento inválido (mín. 5 caracteres)");
    if (!newUser.email.trim() || !newUser.email.includes("@")) return setCreateError("Email inválido");
    if (!newUser.phone.trim() || newUser.phone.length < 10) return setCreateError("Teléfono inválido (mín. 10 dígitos)");
    if (!newUser.pin.trim() || newUser.pin.length !== 4) return setCreateError("PIN debe ser de 4 dígitos");
    if (newUser.pin !== newUser.confirmPin) return setCreateError("Los PINs no coinciden");
    if (!newUser.birthDate.trim()) return setCreateError("Ingresa la fecha de nacimiento");

    const existing = users.find((u) => u.documentNumber === newUser.documentNumber);
    if (existing) return setCreateError("Ya existe un usuario con ese número de documento");

    await createUser({
      documentType: newUser.documentType,
      documentNumber: newUser.documentNumber,
      firstName: newUser.firstName,
      secondName: newUser.secondName,
      lastName: newUser.lastName,
      secondLastName: newUser.secondLastName,
      birthDate: newUser.birthDate,
      email: newUser.email,
      phone: newUser.phone,
      pin: newUser.pin,
      address: newUser.address,
      motherName: newUser.motherName,
      motherPhone: newUser.motherPhone,
      googleEmail: newUser.googleEmail,
      countryResidence: newUser.countryResidence,
      countryBirth: newUser.countryBirth,
      currencyCode: newUser.currencyCode,
      currencySymbol: newUser.currencySymbol,
      isAdmin: false,
      status: "active",
    });

    setCreateModal(false);
    setNewUser({
      firstName: "", secondName: "", lastName: "", secondLastName: "",
      documentType: "CC", documentNumber: "", birthDate: "", email: "",
      phone: "", pin: "", confirmPin: "",
      countryResidence: "CO", countryBirth: "CO", currencyCode: "COP", currencySymbol: "$",
      address: "", motherName: "", motherPhone: "", googleEmail: "",
    });
    load();
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image source={require("../../assets/images/pwa-icon.png")} style={{ width: 26, height: 26, borderRadius: 6 }} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Gestión de Usuarios</Text>
            <Text style={styles.sub}>{users.length} usuarios registrados</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModal(true)}>
          <Feather name="user-plus" size={16} color="#1C1C1E" />
          <Text style={styles.createBtnText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, doc, email, tel..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando usuarios...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados</Text>
        ) : (
          filtered.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[styles.userCard, selected?.id === u.id && styles.userCardActive]}
              onPress={() => setSelected(selected?.id === u.id ? null : u)}
            >
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{u.firstName[0]}{u.lastName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.firstName} {u.secondName} {u.lastName} {u.secondLastName}</Text>
                  <Text style={styles.userDoc}>{u.documentType} · {u.documentNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[u.status ?? "active"] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[u.status ?? "active"] }]}>
                    {STATUS_LABEL[u.status ?? "active"]}
                  </Text>
                </View>
              </View>

              {selected?.id === u.id && (
                <View style={styles.detail}>
                  <Row label="Email" value={u.email} />
                  <Row label="Teléfono" value={u.phone} />
                  <Row label="F. Nacimiento" value={u.birthDate} />
                  <Row label="Dirección" value={u.address ?? "—"} />
                  <Row label="Nombre madre" value={u.motherName ?? "—"} />
                  <Row label="Tel. madre" value={u.motherPhone ?? "—"} />
                  <Row label="Email Google" value={u.googleEmail ?? "—"} />
                  <Row label="País residencia" value={u.countryResidence} />
                  <Row label="País nacimiento" value={u.countryBirth} />
                  <Row label="Moneda" value={`${u.currencyCode} (${u.currencySymbol})`} />
                  <Row label="PIN" value={u.pin} secret />
                  <Row label="Registrado" value={new Date(u.createdAt).toLocaleString("es-CO")} />
                  <Row label="ID" value={u.id} />
                  {u.suspensionReason && (
                    <View style={styles.suspensionBox}>
                      <Feather name="alert-triangle" size={13} color={ORANGE} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suspensionLabel}>Motivo de {STATUS_LABEL[u.status ?? "active"].toLowerCase()}:</Text>
                        <Text style={styles.suspensionText}>{u.suspensionReason}</Text>
                        {u.suspensionDate && (
                          <Text style={styles.suspensionDate}>{new Date(u.suspensionDate).toLocaleString("es-CO")}</Text>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.statusRow}>
                    <Text style={styles.statusRowLabel}>Estado:</Text>
                    {(["active", "suspended", "blocked"] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, { borderColor: STATUS_COLOR[s], backgroundColor: u.status === s ? STATUS_COLOR[s] + "33" : "transparent" }]}
                        onPress={() => toggleStatus(u, s)}
                      >
                        <Text style={[styles.statusBtnText, { color: STATUS_COLOR[s] }]}>{STATUS_LABEL[s]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.copyTemplateBtn} onPress={() => copyTemplate(u)}>
                    <Feather name="copy" size={14} color={BLUE} />
                    <Text style={styles.copyTemplateBtnText}>Copiar Plantilla</Text>
                  </TouchableOpacity>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                      <Feather name="edit-2" size={14} color={YELLOW} />
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                      <Feather name="trash-2" size={14} color={RED} />
                      <Text style={styles.deleteBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* SUSPEND MODAL */}
      <Modal visible={suspendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {suspendStatus === "suspended" ? "Suspender cuenta" : "Bloquear cuenta"}
              </Text>
              <TouchableOpacity onPress={() => setSuspendModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>
            {suspendTarget && (
              <View style={styles.suspendUserInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{suspendTarget.firstName[0]}{suspendTarget.lastName[0]}</Text>
                </View>
                <View>
                  <Text style={styles.suspendUserName}>{suspendTarget.firstName} {suspendTarget.lastName}</Text>
                  <Text style={styles.suspendUserDoc}>{suspendTarget.documentType} {suspendTarget.documentNumber}</Text>
                </View>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Motivo */}
              <Text style={[styles.editLabel, { marginBottom: 10 }]}>Motivo *</Text>
              {SUSPENSION_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonBtn, suspendReason === reason && styles.reasonBtnActive]}
                  onPress={() => setSuspendReason(reason)}
                >
                  <View style={[styles.reasonDot, { backgroundColor: suspendReason === reason ? YELLOW : TEXTSEC }]} />
                  <Text style={[styles.reasonText, { color: suspendReason === reason ? YELLOW : TEXT }]}>{reason}</Text>
                  {suspendReason === reason && <Feather name="check" size={14} color={YELLOW} />}
                </TouchableOpacity>
              ))}
              {suspendReason === "Otro motivo" && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.editLabel}>Describe el motivo *</Text>
                  <TextInput
                    style={[styles.editInput, { minHeight: 72, textAlignVertical: "top" }]}
                    value={suspendCustomReason}
                    onChangeText={setSuspendCustomReason}
                    placeholder="Escribe el motivo..."
                    placeholderTextColor={TEXTSEC}
                    multiline
                  />
                </View>
              )}

              {/* Documentos requeridos */}
              <View style={styles.sectionSep} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Feather name="file-text" size={15} color="#60A5FA" />
                <Text style={styles.editLabel}>Documentos requeridos para desbloqueo</Text>
              </View>
              {suspendDocs.map((doc, i) => (
                <View key={i} style={styles.chipRow}>
                  <Text style={styles.chipText} numberOfLines={2}>{i + 1}. {doc}</Text>
                  <TouchableOpacity onPress={() => removeDoc(i)} style={{ padding: 4 }}>
                    <Feather name="x" size={14} color={RED} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.editInput, { flex: 1, marginBottom: 0 }]}
                  value={suspendNewDoc}
                  onChangeText={setSuspendNewDoc}
                  placeholder="Ej: Cédula de ciudadanía vigente"
                  placeholderTextColor={TEXTSEC}
                  onSubmitEditing={addDoc}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={addDoc}>
                  <Feather name="plus" size={18} color={YELLOW} />
                </TouchableOpacity>
              </View>

              {/* Pasos del proceso */}
              <View style={styles.sectionSep} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Feather name="list" size={15} color="#A78BFA" />
                <Text style={styles.editLabel}>Pasos del proceso de desbloqueo</Text>
              </View>

              {/* ─── Plantillas rápidas ─── */}
              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.editLabel, { fontSize: 10, color: "#A78BFA", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }]}>
                  Plantillas rápidas
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#A78BFA18", borderWidth: 1, borderColor: "#A78BFA40" }}
                  onPress={() => {
                    setSuspendReason("Verificación de identidad");
                    setSuspendDocs([]);
                    setSuspendSteps([
                      {
                        id: "tpl_dni_" + Date.now(),
                        label: "Documento de identidad (DNI)",
                        description: "Sube una fotografía legible de tu cédula o documento de identidad por ambas caras.",
                        type: "identity_document",
                      },
                      {
                        id: "tpl_tax_" + (Date.now() + 1),
                        label: "Comprobante tributario",
                        description: "Escanea el código de barras, sube la imagen o ingresa el número de radicado de tu certificado ante la DIAN.",
                        type: "tax_certificate",
                      },
                    ]);
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#A78BFA22", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="shield" size={17} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#A78BFA", fontFamily: "Inter_700Bold" }}>Verificación de identidad</Text>
                    <Text style={{ fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                      DNI + Comprobante tributario (más común)
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#A78BFA" />
                </TouchableOpacity>
              </View>
              {suspendSteps.map((step, i) => (
                <View key={step.id} style={[styles.chipRow, { flexDirection: "column", alignItems: "flex-start", gap: 4 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}>
                    <View style={styles.stepNum}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#A78BFA" }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.chipText, { marginBottom: 0 }]}>{step.label}</Text>
                      <Text style={{ fontSize: 10, color: "#60A5FA", fontFamily: "Inter_400Regular" }}>
                        {step.type === "identity_document" ? "🪪 DNI / Identidad" : step.type === "tax_certificate" ? "🧾 Comprobante tributario" : step.type === "document" ? "📄 Documento" : step.type === "identity_verification" ? "👤 Verificación" : "✅ Paso"}
                        {step.radicadoNumber ? ` · Rad: ${step.radicadoNumber}` : ""}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeStep(step.id)} style={{ padding: 4 }}>
                      <Feather name="x" size={14} color={RED} />
                    </TouchableOpacity>
                  </View>
                  {step.description ? (
                    <Text style={{ fontSize: 11, color: TEXTSEC, marginLeft: 30, fontFamily: "Inter_400Regular" }}>{step.description}</Text>
                  ) : null}
                  {/* Barcode preview for steps with radicado */}
                  {step.radicadoNumber && (step.type === "document" || step.type === "tax_certificate" || step.type === "radicado") ? (
                    <View style={{ width: "100%", marginLeft: 0, marginTop: 6, backgroundColor: "#18181B", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#A78BFA30" }}>
                      <Text style={{ fontSize: 9, color: "#A78BFA", fontFamily: "Inter_600SemiBold", textAlign: "center", marginBottom: 4, letterSpacing: 0.5 }}>
                        CÓDIGO DE BARRAS GENERADO
                      </Text>
                      <BarcodeDisplay
                        value={step.radicadoNumber}
                        showValue
                        height={52}
                        background="#18181B"
                        lineColor="#FFFFFF"
                      />
                      <Text style={{ fontSize: 9, color: "#6B7280", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 }}>
                        Escaneable por el usuario para validar su radicado
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}

              {/* Active radicados — auto-included as mandatory steps */}
              {targetRadicados.length > 0 && (
                <View style={{ marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: "#10B98118", borderWidth: 1, borderColor: "#10B98140" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Feather name="check-circle" size={14} color={GREEN} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold" }}>
                      {targetRadicados.length} radicado{targetRadicados.length > 1 ? "s" : ""} activo{targetRadicados.length > 1 ? "s" : ""} incluido{targetRadicados.length > 1 ? "s" : ""} automáticamente
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 16 }}>
                    Los radicados activos se han agregado como pasos obligatorios. El usuario verá el título y la fecha de vencimiento, pero no el código.
                  </Text>
                  {targetRadicados.map((rad: any) => (
                    <View key={rad.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "#10B98130", marginBottom: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: YELLOW, fontFamily: "Inter_700Bold" }}>{rad.motive}</Text>
                        <Text style={{ fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                          Cód. admin: {rad.radicado} · Vence: {new Date(rad.expiresAt + "T00:00:00").toLocaleDateString("es-CO")}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: GREEN + "22" }}>
                        <Feather name="check" size={11} color={GREEN} />
                        <Text style={{ fontSize: 10, color: GREEN, fontFamily: "Inter_600SemiBold" }}>Incluido</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Step type selector */}
              <Text style={[styles.editLabel, { marginBottom: 8, marginTop: 4 }]}>Tipo de paso</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {([
                  { value: "identity_document", label: "🪪 DNI",           color: "#3B82F6" },
                  { value: "tax_certificate",   label: "🧾 Tributario",    color: "#A78BFA" },
                  { value: "document",          label: "📄 Documento",     color: "#60A5FA" },
                  { value: "custom",            label: "✅ Otro",           color: "#94A3B8" },
                  { value: "radicado",          label: "🏷️ Radicado",      color: "#F59E0B" },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.reasonBtn, suspendNewStepType === opt.value && { backgroundColor: opt.color + "22", borderColor: opt.color, borderWidth: 1 }, { paddingVertical: 8, paddingHorizontal: 10 }]}
                    onPress={() => setSuspendNewStepType(opt.value)}
                  >
                    <Text style={{ fontSize: 11, color: suspendNewStepType === opt.value ? opt.color : TEXTSEC, textAlign: "center", fontFamily: "Inter_500Medium" }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.editInput, { marginBottom: 8 }]}
                value={suspendNewStepLabel}
                onChangeText={setSuspendNewStepLabel}
                placeholder="Título del paso (ej: Enviar cédula vigente)"
                placeholderTextColor={TEXTSEC}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.editInput, { marginBottom: 8 }]}
                value={suspendNewStepDesc}
                onChangeText={setSuspendNewStepDesc}
                placeholder="Descripción adicional (opcional)"
                placeholderTextColor={TEXTSEC}
                returnKeyType="next"
              />
              {(suspendNewStepType === "document" || suspendNewStepType === "tax_certificate" || suspendNewStepType === "radicado") && (
                <View style={{ gap: 8, marginBottom: 4 }}>
                  <Text style={[styles.editLabel, { fontSize: 10, color: TEXTSEC, marginBottom: 0 }]}>
                    {suspendNewStepType === "tax_certificate" ? "N° radicado tributario (opcional — el usuario debe coincidir)" : suspendNewStepType === "radicado" ? "N° de radicado asignado (obligatorio — el usuario debe escanear)" : "N° radicado (asignar al usuario)"}
                  </Text>
                  <View style={styles.addRow}>
                    <TextInput
                      style={[styles.editInput, { flex: 1, marginBottom: 0 }]}
                      value={suspendNewStepRadicado}
                      onChangeText={setSuspendNewStepRadicado}
                      placeholder="Ej: 2024-1234567"
                      placeholderTextColor={TEXTSEC}
                      returnKeyType="done"
                      onSubmitEditing={addStep}
                    />
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: "#A78BFA22" }]} onPress={addStep}>
                      <Feather name="plus" size={18} color="#A78BFA" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {suspendNewStepType !== "document" && suspendNewStepType !== "tax_certificate" && suspendNewStepType !== "radicado" && (
                <TouchableOpacity style={[styles.addBtn, { width: "100%", borderRadius: 10, height: 44, backgroundColor: "#A78BFA22" }]} onPress={addStep}>
                  <Feather name="plus" size={16} color="#A78BFA" />
                  <Text style={{ fontSize: 13, color: "#A78BFA", fontFamily: "Inter_500Medium", marginLeft: 6 }}>Agregar paso</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: suspendStatus === "suspended" ? ORANGE : RED, marginTop: 20 }]}
                onPress={confirmSuspend}
              >
                <Feather name={suspendStatus === "suspended" ? "alert-triangle" : "lock"} size={16} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {suspendStatus === "suspended" ? "Confirmar suspensión" : "Confirmar bloqueo"}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <EF label="Primer nombre" value={editData.firstName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, firstName: v }))} />
              <EF label="Segundo nombre" value={editData.secondName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, secondName: v }))} />
              <EF label="Primer apellido" value={editData.lastName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, lastName: v }))} />
              <EF label="Segundo apellido" value={editData.secondLastName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, secondLastName: v }))} />
              <EF label="Email" value={editData.email ?? ""} onChange={(v) => setEditData((p) => ({ ...p, email: v }))} keyboard="email-address" />
              <EF label="Teléfono" value={editData.phone ?? ""} onChange={(v) => setEditData((p) => ({ ...p, phone: v }))} keyboard="phone-pad" />
              <EF label="Dirección de residencia" value={editData.address ?? ""} onChange={(v) => setEditData((p) => ({ ...p, address: v }))} />
              <EF label="Nombre completo de la madre" value={editData.motherName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, motherName: v }))} />
              <EF label="Teléfono de la madre" value={editData.motherPhone ?? ""} onChange={(v) => setEditData((p) => ({ ...p, motherPhone: v }))} keyboard="phone-pad" />
              <EF label="Email Google (opcional)" value={editData.googleEmail ?? ""} onChange={(v) => setEditData((p) => ({ ...p, googleEmail: v }))} keyboard="email-address" />
              <EF label="PIN (4 dígitos)" value={editData.pin ?? ""} onChange={(v) => setEditData((p) => ({ ...p, pin: v }))} keyboard="numeric" maxLen={4} />
              <Text style={[styles.editLabel, { marginTop: 12 }]}>Estado</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {(["active", "suspended", "blocked"] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusBtn, { borderColor: STATUS_COLOR[s], flex: 1, justifyContent: "center", paddingVertical: 10, backgroundColor: editData.status === s ? STATUS_COLOR[s] + "33" : "transparent" }]}
                    onPress={() => setEditData((p) => ({ ...p, status: s }))}
                  >
                    <Text style={[styles.statusBtnText, { color: STATUS_COLOR[s] }]}>{STATUS_LABEL[s]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Usuario</Text>
              <TouchableOpacity onPress={() => { setCreateModal(false); setCreateError(""); }}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <EF label="Primer nombre *" value={newUser.firstName} onChange={(v) => setNewUser((p) => ({ ...p, firstName: v }))} />
              <EF label="Segundo nombre" value={newUser.secondName} onChange={(v) => setNewUser((p) => ({ ...p, secondName: v }))} />
              <EF label="Primer apellido *" value={newUser.lastName} onChange={(v) => setNewUser((p) => ({ ...p, lastName: v }))} />
              <EF label="Segundo apellido" value={newUser.secondLastName} onChange={(v) => setNewUser((p) => ({ ...p, secondLastName: v }))} />
              <Text style={styles.editLabel}>País de residencia *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.countryChip, newUser.countryResidence === c.code && styles.countryChipActive]}
                      onPress={() => {
                        setNewUser((p) => ({
                          ...p,
                          countryResidence: c.code,
                          currencyCode: c.currencyCode,
                          currencySymbol: c.currencySymbol,
                          documentType: c.docTypes[0] as DocType,
                        }));
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{c.flag}</Text>
                      <Text style={[styles.countryChipText, { color: newUser.countryResidence === c.code ? YELLOW : TEXTSEC }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.editLabel}>Divisa</Text>
              <View style={[styles.editInput, { marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                <Text style={{ fontSize: 18, color: YELLOW }}>{newUser.currencySymbol}</Text>
                <Text style={{ fontSize: 14, color: TEXT, fontFamily: "Inter_500Medium" }}>
                  {newUser.currencyCode} — {COUNTRIES.find((c) => c.code === newUser.countryResidence)?.currency ?? ""}
                </Text>
              </View>

              <Text style={styles.editLabel}>Tipo de documento *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {ALL_DOC_TYPES.map((dt) => (
                  <TouchableOpacity
                    key={dt}
                    style={[styles.docTypeChip, newUser.documentType === dt && styles.docTypeChipActive]}
                    onPress={() => setNewUser((p) => ({ ...p, documentType: dt }))}
                  >
                    <Text style={[styles.docTypeChipCode, { color: newUser.documentType === dt ? YELLOW : TEXTSEC }]}>{dt}</Text>
                    <Text style={[styles.docTypeChipLabel, { color: newUser.documentType === dt ? YELLOW + "BB" : TEXTSEC + "88" }]} numberOfLines={1}>
                      {DOC_TYPE_LABELS[dt].includes(" — ") ? DOC_TYPE_LABELS[dt].split(" — ").slice(1).join(" — ") : DOC_TYPE_LABELS[dt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <EF label="Número de documento *" value={newUser.documentNumber} onChange={(v) => setNewUser((p) => ({ ...p, documentNumber: v }))} keyboard="default" />
              <DateEF label="Fecha nacimiento *" value={newUser.birthDate} onChange={(v) => setNewUser((p) => ({ ...p, birthDate: v }))} />
              <EF label="Email *" value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} keyboard="email-address" />
              <EF label="Teléfono (10 dígitos) *" value={newUser.phone} onChange={(v) => setNewUser((p) => ({ ...p, phone: v }))} keyboard="phone-pad" maxLen={10} />
              <EF label="Dirección de residencia" value={newUser.address} onChange={(v) => setNewUser((p) => ({ ...p, address: v }))} />
              <EF label="Nombre completo de la madre" value={newUser.motherName} onChange={(v) => setNewUser((p) => ({ ...p, motherName: v }))} />
              <EF label="Teléfono de la madre" value={newUser.motherPhone} onChange={(v) => setNewUser((p) => ({ ...p, motherPhone: v }))} keyboard="phone-pad" maxLen={10} />
              <EF label="Email Google (opcional)" value={newUser.googleEmail} onChange={(v) => setNewUser((p) => ({ ...p, googleEmail: v }))} keyboard="email-address" />
              <EF label="PIN (4 dígitos) *" value={newUser.pin} onChange={(v) => setNewUser((p) => ({ ...p, pin: v }))} keyboard="numeric" maxLen={4} />
              <EF label="Confirmar PIN *" value={newUser.confirmPin} onChange={(v) => setNewUser((p) => ({ ...p, confirmPin: v }))} keyboard="numeric" maxLen={4} />
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>Crear usuario</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TouchableOpacity onPress={() => secret && setShow((s) => !s)}>
        <Text style={styles.rowValue}>{secret && !show ? "••••" : value}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EF({ label, value, onChange, keyboard, maxLen }: { label: string; value: string; onChange: (v: string) => void; keyboard?: any; maxLen?: number }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput style={styles.editInput} value={value} onChangeText={onChange} keyboardType={keyboard ?? "default"} maxLength={maxLen} placeholderTextColor={TEXTSEC} />
    </View>
  );
}

function DateEF({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.editLabel}>{label}</Text>
      <DateInput
        value={value}
        onChange={onChange}
        outputFormat="DMY"
        isDark
        maxDate={new Date().toISOString().slice(0, 10)}
        inputStyle={{ paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#1C1C1E" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
  userCard: { backgroundColor: CARD, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  userCardActive: { borderColor: YELLOW + "60" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: YELLOW + "22", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: YELLOW },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  userDoc: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  detail: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BORDER },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rowLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC },
  rowValue: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXT },
  suspensionBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: ORANGE + "15", borderRadius: 10, borderWidth: 1, borderColor: ORANGE + "30", padding: 10, marginTop: 8 },
  suspensionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: ORANGE, marginBottom: 2 },
  suspensionText: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT },
  suspensionDate: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" },
  statusRowLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  statusBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: YELLOW + "15", borderRadius: 10, borderWidth: 1, borderColor: YELLOW + "40", paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: YELLOW },
  deleteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: RED + "15", borderRadius: 10, borderWidth: 1, borderColor: RED + "40", paddingVertical: 10 },
  deleteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: RED },
  copyTemplateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE + "15", borderRadius: 10, borderWidth: 1, borderColor: BLUE + "40", paddingVertical: 10, marginTop: 10 },
  copyTemplateBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: BLUE },
  countryChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: "#0A0E1A" },
  countryChipActive: { borderColor: YELLOW + "60", backgroundColor: YELLOW + "15" },
  countryChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  docTypeChip: { flexDirection: "column", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: "#0A0E1A", minWidth: 72 },
  docTypeChipActive: { borderColor: YELLOW + "60", backgroundColor: YELLOW + "15" },
  docTypeChipCode: { fontSize: 13, fontFamily: "Inter_700Bold" },
  docTypeChipLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#161B2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "92%", borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT },
  suspendUserInfo: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0A0E1A", borderRadius: 12, padding: 12, marginBottom: 20 },
  suspendUserName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  suspendUserDoc: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC },
  reasonBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0A0E1A", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  reasonBtnActive: { borderColor: YELLOW + "60", backgroundColor: YELLOW + "10" },
  reasonDot: { width: 8, height: 8, borderRadius: 4 },
  reasonText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 6 },
  editInput: { backgroundColor: "#0F1320", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
  saveBtn: { backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 24 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1C1C1E" },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: RED, textAlign: "center", marginBottom: 10, marginTop: -4 },
  sectionSep: { height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginVertical: 16 },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0A0E1A", borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 10, marginBottom: 8 },
  chipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: TEXT, marginBottom: 0 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  addBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: YELLOW + "22", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: YELLOW + "40" },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#A78BFA22", alignItems: "center", justifyContent: "center" },
});
