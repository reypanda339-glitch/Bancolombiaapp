import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import type { Account, Card, RegisteredUser } from "@/context/AppContext";
import { formatBalance } from "@/constants/countries";

const YELLOW = "#FDDA24";
const BANCOLOMBIA_BLUE = "#003087";

/* ─────────────────────────── helpers ─────────────────────────── */
function fmtCurrency(amount: number, symbol: string, code: string) {
  return formatBalance(amount, code, symbol, true);
}
function maskNumber(n: string, keep = 4) {
  return "•••• " + n.slice(-keep);
}
function accountTypeLabel(t: Account["type"]) {
  return t === "savings" ? "Cuenta de Ahorros" : t === "checking" ? "Cuenta Corriente" : "Crédito";
}
function accountTypeIcon(t: Account["type"]): keyof typeof Feather.glyphMap {
  return t === "savings" ? "archive" : t === "checking" ? "layers" : "credit-card";
}
function cardBrandColor(b: Card["brand"]) {
  return b === "visa" ? "#1A1F71" : "#EB001B";
}

/* ─────────────────────────── Avatar ─────────────────────────── */
function Avatar({ name, size = 52, isDark }: { name: string; size?: number; isDark: boolean }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: isDark ? "#2A2A35" : "#E8E8EF" }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38, color: isDark ? YELLOW : BANCOLOMBIA_BLUE }]}>{initials}</Text>
    </View>
  );
}

/* ─────────────────────────── Row ─────────────────────────── */
function InfoRow({ label, value, C }: { label: string; value: string; C: ReturnType<typeof useTheme>["C"] }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: C.text }]}>{value || "—"}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Perfil detallado  (Mis datos + header tap)
══════════════════════════════════════════════════════════════ */
function ProfileDetailModal({
  visible, onClose, user, accounts, cards, isDark, C, onEdit,
}: {
  visible: boolean; onClose: () => void;
  user: RegisteredUser; accounts: Account[]; cards: Card[];
  isDark: boolean; C: ReturnType<typeof useTheme>["C"];
  onEdit: () => void;
}) {
  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(" ");
  const docLabels: Record<string, string> = {
    CC: "Cédula de Ciudadanía", CE: "Cédula de Extranjería",
    PA: "Pasaporte", TI: "Tarjeta de Identidad",
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Mi perfil</Text>
          <TouchableOpacity onPress={() => { onClose(); setTimeout(onEdit, 300); }} style={styles.sheetEditBtn}>
            <Feather name="edit-2" size={17} color={YELLOW} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Avatar + nombre */}
          <View style={[styles.profileHero, { backgroundColor: C.surface }]}>
            <Avatar name={fullName} size={76} isDark={isDark} />
            <Text style={[styles.profileHeroName, { color: C.text }]}>{fullName}</Text>
            <Text style={[styles.profileHeroDoc, { color: C.textSecondary }]}>
              {docLabels[user.documentType] ?? user.documentType} · {user.documentNumber}
            </Text>
            {user.status && (
              <View style={[styles.statusBadge, { backgroundColor: user.status === "active" ? "#D1FAE5" : "#FEE2E2" }]}>
                <Text style={[styles.statusText, { color: user.status === "active" ? "#065F46" : "#991B1B" }]}>
                  {user.status === "active" ? "Activo" : user.status === "suspended" ? "Suspendido" : "Bloqueado"}
                </Text>
              </View>
            )}
          </View>

          {/* Datos personales */}
          <SectionCard title="Datos personales" C={C}>
            <InfoRow label="Nombre completo" value={fullName} C={C} />
            <InfoRow label="Tipo de documento" value={docLabels[user.documentType] ?? user.documentType} C={C} />
            <InfoRow label="Número de documento" value={user.documentNumber} C={C} />
            <InfoRow label="Fecha de nacimiento" value={user.birthDate ?? "—"} C={C} />
            <InfoRow label="País de nacimiento" value={user.countryBirth ?? "—"} C={C} />
            <InfoRow label="País de residencia" value={user.countryResidence ?? "—"} C={C} />
          </SectionCard>

          {/* Datos de contacto */}
          <SectionCard title="Datos de contacto" C={C}>
            <InfoRow label="Correo electrónico" value={user.email} C={C} />
            <InfoRow label="Teléfono" value={user.phone} C={C} />
            <InfoRow label="Dirección" value={user.address ?? "No registrada"} C={C} />
          </SectionCard>

          {/* Cuentas */}
          {accounts.length > 0 && (
            <SectionCard title="Productos bancarios" C={C}>
              {accounts.map((acc, i) => (
                <View key={acc.id}>
                  <View style={styles.productRow}>
                    <View style={[styles.productIconWrap, { backgroundColor: "#3B82F620" }]}>
                      <Feather name={accountTypeIcon(acc.type)} size={16} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: C.text }]}>{accountTypeLabel(acc.type)}</Text>
                      <Text style={[styles.productNum, { color: C.textSecondary }]}>{maskNumber(acc.number)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.productBalance, { color: C.text }]}>
                        {fmtCurrency(acc.balance, acc.currencySymbol, acc.currencyCode)}
                      </Text>
                      <View style={[styles.accStatusDot, { backgroundColor: acc.status === "active" ? "#10B981" : "#EF4444" }]} />
                    </View>
                  </View>
                  {i < accounts.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
                </View>
              ))}
            </SectionCard>
          )}

          {/* Tarjetas */}
          {cards.length > 0 && (
            <SectionCard title="Tarjetas" C={C}>
              {cards.map((card, i) => (
                <View key={card.id}>
                  <View style={styles.productRow}>
                    <View style={[styles.productIconWrap, { backgroundColor: cardBrandColor(card.brand) + "20" }]}>
                      <Feather name="credit-card" size={16} color={cardBrandColor(card.brand)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: C.text }]}>
                        {card.type === "debit" ? "Tarjeta Débito" : "Tarjeta Crédito"} · {card.brand.toUpperCase()}
                      </Text>
                      <Text style={[styles.productNum, { color: C.textSecondary }]}>{maskNumber(card.number)}</Text>
                    </View>
                    <Text style={[styles.productBalance, { color: C.textSecondary, fontSize: 12 }]}>
                      Vence {card.expiry}
                    </Text>
                  </View>
                  {i < cards.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
                </View>
              ))}
            </SectionCard>
          )}

          <Text style={[styles.memberSince, { color: C.textLight }]}>
            Cliente desde {user.createdAt ? new Date(user.createdAt).getFullYear() : "2024"}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Editar perfil
══════════════════════════════════════════════════════════════ */
function EditProfileModal({
  visible, onClose, user, onSave, C, isDark,
}: {
  visible: boolean; onClose: () => void;
  user: RegisteredUser; onSave: (data: Partial<RegisteredUser>) => void;
  C: ReturnType<typeof useTheme>["C"]; isDark: boolean;
}) {
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [address, setAddress] = useState(user.address ?? "");

  const inputStyle = [styles.editInput, { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F7", color: C.text, borderColor: C.border }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="chevron-down" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Editar perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Read-only fields */}
          <Text style={[styles.editSectionLabel, { color: C.textSecondary }]}>DATOS NO MODIFICABLES</Text>
          <View style={[styles.readonlyCard, { backgroundColor: C.surface }]}>
            <InfoRow label="Nombre completo" value={[user.firstName, user.secondName, user.lastName, user.secondLastName].filter(Boolean).join(" ")} C={C} />
            <View style={[styles.divider, { backgroundColor: C.divider }]} />
            <InfoRow label="Documento" value={`${user.documentType} ${user.documentNumber}`} C={C} />
            <View style={[styles.divider, { backgroundColor: C.divider }]} />
            <InfoRow label="Fecha de nacimiento" value={user.birthDate ?? "—"} C={C} />
          </View>
          <Text style={[styles.readonlyHint, { color: C.textLight }]}>
            Para modificar estos datos visita una sucursal o comunícate con Bancolombia.
          </Text>

          {/* Editable fields */}
          <Text style={[styles.editSectionLabel, { color: C.textSecondary, marginTop: 20 }]}>DATOS EDITABLES</Text>

          <Text style={[styles.editLabel, { color: C.textSecondary }]}>Teléfono</Text>
          <TextInput
            style={inputStyle} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" placeholder="Ej: 3001234567"
            placeholderTextColor={C.textLight} maxLength={15}
          />

          <Text style={[styles.editLabel, { color: C.textSecondary }]}>Correo electrónico</Text>
          <TextInput
            style={inputStyle} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="correo@email.com" placeholderTextColor={C.textLight}
          />

          <Text style={[styles.editLabel, { color: C.textSecondary }]}>Dirección</Text>
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
            value={address} onChangeText={setAddress}
            multiline placeholder="Calle, barrio, ciudad"
            placeholderTextColor={C.textLight}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: YELLOW }]}
            onPress={() => {
              if (!phone.trim() || !email.trim()) {
                Alert.alert("Campos requeridos", "El teléfono y el correo son obligatorios.");
                return;
              }
              if (!/^\S+@\S+\.\S+$/.test(email)) {
                Alert.alert("Correo inválido", "Por favor ingresa un correo válido.");
                return;
              }
              onSave({ phone: phone.trim(), email: email.trim(), address: address.trim() });
            }}
          >
            <Text style={styles.saveBtnText}>Guardar cambios</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Seguridad (con cambio de PIN real + OTP + biometría)
══════════════════════════════════════════════════════════════ */
function SecurityModal({ visible, onClose, C, isDark }: {
  visible: boolean; onClose: () => void;
  C: ReturnType<typeof useTheme>["C"]; isDark: boolean;
}) {
  const { currentUser: user, updateUser, requestPinChange } = useApp();
  type SubView = "menu" | "pin-current" | "pin-new" | "pin-confirm" | "pin-done"
    | "otp" | "biometria" | "devices" | "fraude" | "fraude-done";
  const [view, setView] = useState<SubView>("menu");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [biometria, setBiometria] = useState(false);
  const [otpCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [otpExpiry] = useState(() => { const d = new Date(); d.setMinutes(d.getMinutes() + 3); return d; });

  const reset = () => {
    setView("menu"); setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const pinDots = (p: string, total = 4) => Array.from({ length: total }, (_, i) => (
    <View key={i} style={[styles.pinDot, { backgroundColor: i < p.length ? YELLOW : (isDark ? "#3A3A3C" : "#D1D1D6") }]} />
  ));

  const pinPadDigits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const PinInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.menuSub, { color: C.textSecondary, marginBottom: 20, fontSize: 14 }]}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>{pinDots(value)}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", width: 240, gap: 0 }}>
        {pinPadDigits.map((d, i) => (
          <TouchableOpacity key={i} style={styles.pinKey}
            onPress={() => {
              if (d === "") return;
              if (d === "⌫") { onChange(value.slice(0, -1)); setPinError(""); return; }
              if (value.length < 4) onChange(value + d);
            }}
          >
            <Text style={[styles.pinKeyText, { color: d === "⌫" ? "#EF4444" : C.text }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const options = [
    { icon: "lock" as const, label: "Cambiar clave", desc: "Actualiza tu PIN de acceso", color: "#10B981" },
    { icon: "eye-off" as const, label: "Clave dinámica", desc: "Token de un solo uso (OTP)", color: "#3B82F6" },
    { icon: "smartphone" as const, label: "Biometría", desc: "Huella dactilar y Face ID", color: "#8B5CF6" },
    { icon: "monitor" as const, label: "Dispositivos autorizados", desc: "Administra tus sesiones activas", color: "#F59E0B" },
    { icon: "alert-triangle" as const, label: "Reportar fraude", desc: "Bloquea y reporta actividad sospechosa", color: "#EF4444" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={view === "menu" ? handleClose : reset} style={styles.sheetClose}>
            <Feather name={view === "menu" ? "x" : "arrow-left"} size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>
            {view === "menu" ? "Seguridad"
              : view.startsWith("pin") ? "Cambiar clave"
              : view === "otp" ? "Clave dinámica"
              : view === "biometria" ? "Biometría"
              : view === "devices" ? "Dispositivos"
              : "Reportar fraude"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* ─── MENU ─── */}
          {view === "menu" && (
            <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
              {options.map((o, i) => (
                <View key={o.label}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => {
                    if (o.label === "Cambiar clave") setView("pin-current");
                    else if (o.label === "Clave dinámica") setView("otp");
                    else if (o.label === "Biometría") setView("biometria");
                    else if (o.label === "Dispositivos autorizados") setView("devices");
                    else setView("fraude");
                  }}>
                    <View style={[styles.menuIconWrap, { backgroundColor: o.color + "20" }]}>
                      <Feather name={o.icon} size={18} color={o.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text }]}>{o.label}</Text>
                      <Text style={[styles.menuSub, { color: C.textSecondary }]}>{o.desc}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={C.textLight} />
                  </TouchableOpacity>
                  {i < options.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                </View>
              ))}
            </View>
          )}

          {/* ─── CAMBIAR CLAVE: paso 1 ─── */}
          {view === "pin-current" && (
            <>
              <PinInput value={currentPin} onChange={(v) => { setCurrentPin(v); setPinError(""); }} label="Ingresa tu clave actual" />
              {pinError ? <Text style={{ color: "#EF4444", textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>{pinError}</Text> : null}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 16 }]} onPress={() => {
                if (currentPin.length < 4) { setPinError("Ingresa los 4 dígitos de tu clave actual"); return; }
                if (user && currentPin !== user.pin) { setPinError("Clave incorrecta. Inténtalo de nuevo."); setCurrentPin(""); return; }
                setPinError(""); setView("pin-new");
              }}>
                <Text style={styles.saveBtnText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── CAMBIAR CLAVE: paso 2 ─── */}
          {view === "pin-new" && (
            <>
              <PinInput value={newPin} onChange={(v) => { setNewPin(v); setPinError(""); }} label="Ingresa tu nueva clave (4 dígitos)" />
              {pinError ? <Text style={{ color: "#EF4444", textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>{pinError}</Text> : null}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 16 }]} onPress={() => {
                if (newPin.length < 4) { setPinError("Ingresa los 4 dígitos de tu nueva clave"); return; }
                if (newPin === currentPin) { setPinError("La nueva clave no puede ser igual a la actual"); return; }
                setPinError(""); setView("pin-confirm");
              }}>
                <Text style={styles.saveBtnText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── CAMBIAR CLAVE: paso 3 ─── */}
          {view === "pin-confirm" && (
            <>
              <PinInput value={confirmPin} onChange={(v) => { setConfirmPin(v); setPinError(""); }} label="Confirma tu nueva clave" />
              {pinError ? <Text style={{ color: "#EF4444", textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>{pinError}</Text> : null}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 16 }]} onPress={async () => {
                if (confirmPin.length < 4) { setPinError("Ingresa los 4 dígitos para confirmar"); return; }
                if (confirmPin !== newPin) { setPinError("Las claves no coinciden. Inténtalo de nuevo."); setConfirmPin(""); return; }
                if (user) await requestPinChange(newPin);
                setView("pin-done");
              }}>
                <Text style={styles.saveBtnText}>Enviar solicitud</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── CAMBIAR CLAVE: solicitud enviada ─── */}
          {view === "pin-done" && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#F59E0B20" }]}>
                <Feather name="clock" size={36} color="#F59E0B" />
              </View>
              <Text style={[styles.menuLabel, { color: C.text, fontSize: 20, marginTop: 20, textAlign: "center" }]}>Solicitud enviada</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
                Tu solicitud de cambio de clave está pendiente de verificación por el equipo de Bancolombia. Te notificaremos una vez sea procesada.
              </Text>
              <View style={{ marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: "#F59E0B15", borderWidth: 1, borderColor: "#F59E0B40", alignSelf: "stretch" }}>
                <Text style={{ fontSize: 12, color: "#F59E0B", fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 18 }}>
                  Tu clave actual sigue activa hasta que la solicitud sea aprobada.
                </Text>
              </View>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 24, alignSelf: "stretch" }]} onPress={handleClose}>
                <Text style={styles.saveBtnText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── CLAVE DINÁMICA ─── */}
          {view === "otp" && (
            <View style={{ alignItems: "center" }}>
              <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#3B82F620", marginBottom: 20 }]}>
                <Feather name="eye-off" size={32} color="#3B82F6" />
              </View>
              <Text style={[styles.menuLabel, { color: C.text, fontSize: 18, textAlign: "center", marginBottom: 8 }]}>Tu clave dinámica</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginBottom: 24 }]}>
                Válida por 3 minutos · No la compartas con nadie
              </Text>
              <View style={[styles.otpBox, { backgroundColor: C.surface, borderColor: "#3B82F640" }]}>
                <Text style={[styles.otpCode, { color: C.text }]}>{otpCode.slice(0,3)} {otpCode.slice(3)}</Text>
              </View>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginTop: 12 }]}>
                Vence: {otpExpiry.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 32, alignSelf: "stretch" }]} onPress={reset}>
                <Text style={styles.saveBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── BIOMETRÍA ─── */}
          {view === "biometria" && (
            <>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIconWrap, { backgroundColor: "#8B5CF620" }]}>
                    <Feather name="smartphone" size={18} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: C.text }]}>Huella dactilar / Face ID</Text>
                    <Text style={[styles.menuSub, { color: C.textSecondary }]}>
                      {biometria ? "Activada · Inicio de sesión rápido" : "Desactivada"}
                    </Text>
                  </View>
                  <Switch
                    value={biometria}
                    onValueChange={(v) => {
                      setBiometria(v);
                      Alert.alert(v ? "Biometría activada" : "Biometría desactivada",
                        v ? "Ahora puedes iniciar sesión con tu huella o Face ID." : "Se ha desactivado el inicio de sesión biométrico.");
                    }}
                    trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: "#8B5CF6" }}
                    thumbColor={biometria ? "#FFFFFF" : "#FFFFFF"}
                  />
                </View>
              </View>
              <Text style={[styles.menuSub, { color: C.textSecondary, marginTop: 12, paddingHorizontal: 4 }]}>
                La biometría se usa únicamente para verificar tu identidad en este dispositivo.
              </Text>
            </>
          )}

          {/* ─── DISPOSITIVOS AUTORIZADOS ─── */}
          {view === "devices" && (
            <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
              {[
                { device: "iPhone 14 Pro", location: "Bogotá, CO", time: "Hace 2 min", current: true },
                { device: "Chrome / macOS", location: "Medellín, CO", time: "Hace 1 día", current: false },
                { device: "Samsung Galaxy S23", location: "Cali, CO", time: "Hace 5 días", current: false },
              ].map((s, i, arr) => (
                <View key={s.device}>
                  <View style={[styles.menuItem, { paddingVertical: 14 }]}>
                    <View style={[styles.menuIconWrap, { backgroundColor: s.current ? "#10B98120" : "#F59E0B20" }]}>
                      <Feather name={s.current ? "smartphone" : "monitor"} size={18} color={s.current ? "#10B981" : "#F59E0B"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text }]}>{s.device} {s.current ? "· Actual" : ""}</Text>
                      <Text style={[styles.menuSub, { color: C.textSecondary }]}>{s.location} · {s.time}</Text>
                    </View>
                    {!s.current && (
                      <TouchableOpacity onPress={() => Alert.alert("Sesión cerrada", `Se cerró la sesión en ${s.device}.`)}>
                        <Feather name="log-out" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                </View>
              ))}
            </View>
          )}

          {/* ─── REPORTAR FRAUDE ─── */}
          {view === "fraude" && (
            <View style={{ alignItems: "center" }}>
              <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EF444420", marginBottom: 20 }]}>
                <Feather name="alert-triangle" size={32} color="#EF4444" />
              </View>
              <Text style={[styles.menuLabel, { color: C.text, fontSize: 18, textAlign: "center", marginBottom: 8 }]}>Reportar fraude</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginBottom: 28, lineHeight: 20 }]}>
                ¿Detectaste actividad sospechosa en tu cuenta? Bloquea el acceso de inmediato y repórtalo a Bancolombia.
              </Text>
              <View style={{ alignSelf: "stretch", gap: 12 }}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#EF4444" }]} onPress={() => {
                  Alert.alert("⚠️ Cuenta bloqueada", "Hemos bloqueado el acceso a tu cuenta. Un asesor te contactará en los próximos minutos.");
                  setView("fraude-done");
                }}>
                  <Text style={[styles.saveBtnText, { color: "#FFFFFF" }]}>Bloquear y reportar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border }]} onPress={() => { Alert.alert("Llamando...", "Marcando línea de fraude 018000912345..."); }}>
                  <Text style={[styles.saveBtnText, { color: C.text }]}>Llamar línea anti-fraude</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {view === "fraude-done" && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#10B98120" }]}>
                <Feather name="check-circle" size={36} color="#10B981" />
              </View>
              <Text style={[styles.menuLabel, { color: C.text, fontSize: 20, marginTop: 20, textAlign: "center" }]}>Reporte enviado</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginTop: 8 }]}>Nos contactaremos contigo pronto para resolver tu caso.</Text>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 32, alignSelf: "stretch" }]} onPress={handleClose}>
                <Text style={styles.saveBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Notificaciones
══════════════════════════════════════════════════════════════ */
function NotificationsModal({ visible, onClose, C, isDark }: {
  visible: boolean; onClose: () => void;
  C: ReturnType<typeof useTheme>["C"]; isDark: boolean;
}) {
  const [notifs, setNotifs] = useState({
    transactions: true, promotions: false, security: true,
    news: false, payments: true,
  });
  type NKey = keyof typeof notifs;
  const rows: { key: NKey; label: string; desc: string }[] = [
    { key: "transactions", label: "Transacciones", desc: "Débitos, créditos y transferencias" },
    { key: "security", label: "Seguridad", desc: "Intentos de acceso y alertas" },
    { key: "payments", label: "Pagos y vencimientos", desc: "Fechas de corte y pagos" },
    { key: "promotions", label: "Promociones", desc: "Ofertas y descuentos especiales" },
    { key: "news", label: "Novedades", desc: "Nuevas funciones y actualizaciones" },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Notificaciones</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4 }]}>ALERTAS Y AVISOS</Text>
          <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
            {rows.map((r, i) => (
              <View key={r.key}>
                <View style={[styles.menuItem, { paddingVertical: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: C.text }]}>{r.label}</Text>
                    <Text style={[styles.menuSub, { color: C.textSecondary }]}>{r.desc}</Text>
                  </View>
                  <Switch
                    value={notifs[r.key]}
                    onValueChange={(v) => setNotifs((prev) => ({ ...prev, [r.key]: v }))}
                    trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: "#3A3A3C" }}
                    thumbColor={notifs[r.key] ? YELLOW : "#FFFFFF"}
                  />
                </View>
                {i < rows.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 24 }]} onPress={onClose}>
            <Text style={styles.saveBtnText}>Guardar preferencias</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Mis productos
══════════════════════════════════════════════════════════════ */
function ProductsModal({ visible, onClose, accounts, cards, C }: {
  visible: boolean; onClose: () => void;
  accounts: Account[]; cards: Card[];
  C: ReturnType<typeof useTheme>["C"];
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Mis productos</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {/* Cuentas */}
          {accounts.length > 0 && (
            <>
              <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4 }]}>CUENTAS</Text>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                {accounts.map((acc, i) => (
                  <View key={acc.id}>
                    <TouchableOpacity
                      style={[styles.menuItem, { paddingVertical: 16 }]}
                      onPress={() =>
                        Alert.alert(
                          accountTypeLabel(acc.type),
                          `Número: ${acc.number}\nSaldo: ${fmtCurrency(acc.balance, acc.currencySymbol, acc.currencyCode)}\nEstado: ${acc.status === "active" ? "Activa" : "Inactiva"}`,
                          [{ text: "Cerrar" }],
                        )
                      }
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: "#3B82F620" }]}>
                        <Feather name={accountTypeIcon(acc.type)} size={18} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuLabel, { color: C.text }]}>{accountTypeLabel(acc.type)}</Text>
                        <Text style={[styles.menuSub, { color: C.textSecondary }]}>{maskNumber(acc.number)}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.menuLabel, { color: C.text, fontSize: 14 }]}>
                          {fmtCurrency(acc.balance, acc.currencySymbol, acc.currencyCode)}
                        </Text>
                        <Text style={[styles.menuSub, { color: acc.status === "active" ? "#10B981" : "#EF4444" }]}>
                          {acc.status === "active" ? "Activa" : "Inactiva"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {i < accounts.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Tarjetas */}
          {cards.length > 0 && (
            <>
              <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4, marginTop: 16 }]}>TARJETAS</Text>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                {cards.map((card, i) => (
                  <View key={card.id}>
                    <TouchableOpacity
                      style={[styles.menuItem, { paddingVertical: 16 }]}
                      onPress={() =>
                        Alert.alert(
                          card.type === "debit" ? "Tarjeta Débito" : "Tarjeta Crédito",
                          `Número: ${maskNumber(card.number)}\nMarca: ${card.brand.toUpperCase()}\nVence: ${card.expiry}\nTitular: ${card.holder}\nEstado: ${card.active ? "Activa" : "Inactiva"}`,
                          [{ text: "Cerrar" }],
                        )
                      }
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: cardBrandColor(card.brand) + "20" }]}>
                        <Feather name="credit-card" size={18} color={cardBrandColor(card.brand)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuLabel, { color: C.text }]}>
                          {card.type === "debit" ? "Débito" : "Crédito"} {card.brand.toUpperCase()}
                        </Text>
                        <Text style={[styles.menuSub, { color: C.textSecondary }]}>{maskNumber(card.number)} · Vence {card.expiry}</Text>
                      </View>
                      <View style={[styles.accStatusDot, { backgroundColor: card.active ? "#10B981" : "#EF4444" }]} />
                    </TouchableOpacity>
                    {i < cards.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {accounts.length === 0 && cards.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Feather name="inbox" size={48} color={C.textLight} />
              <Text style={[styles.menuSub, { color: C.textSecondary, marginTop: 12 }]}>Sin productos activos</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Extractos y certificados
══════════════════════════════════════════════════════════════ */
function ExtractosModal({ visible, onClose, accounts, C }: {
  visible: boolean; onClose: () => void;
  accounts: Account[]; C: ReturnType<typeof useTheme>["C"];
}) {
  const [selected, setSelected] = useState<Account | null>(null);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentYear = new Date().getFullYear();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity
            onPress={() => { if (selected) { setSelected(null); } else { onClose(); } }}
            style={styles.sheetClose}
          >
            <Feather name={selected ? "chevron-left" : "x"} size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>
            {selected ? selected.name : "Extractos y certificados"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {!selected ? (
            <>
              <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4 }]}>SELECCIONA UNA CUENTA</Text>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                {accounts.map((acc, i) => (
                  <View key={acc.id}>
                    <TouchableOpacity style={[styles.menuItem, { paddingVertical: 16 }]} onPress={() => setSelected(acc)}>
                      <View style={[styles.menuIconWrap, { backgroundColor: "#6366F120" }]}>
                        <Feather name="file-text" size={18} color="#6366F1" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuLabel, { color: C.text }]}>{accountTypeLabel(acc.type)}</Text>
                        <Text style={[styles.menuSub, { color: C.textSecondary }]}>{maskNumber(acc.number)}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={C.textLight} />
                    </TouchableOpacity>
                    {i < accounts.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Account summary */}
              <View style={[styles.extractoSummary, { backgroundColor: BANCOLOMBIA_BLUE }]}>
                <Text style={styles.extractoAccName}>{accountTypeLabel(selected.type)}</Text>
                <Text style={styles.extractoAccNum}>{maskNumber(selected.number)}</Text>
                <Text style={styles.extractoBalance}>{fmtCurrency(selected.balance, selected.currencySymbol, selected.currencyCode)}</Text>
                <Text style={styles.extractoBalanceLabel}>Saldo disponible</Text>
              </View>

              {/* Certificados */}
              <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4, marginTop: 16 }]}>CERTIFICADOS</Text>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                {[
                  { label: "Certificado de cuenta", desc: "Constancia de titularidad" },
                  { label: "Certificado de saldo", desc: "Saldo a la fecha actual" },
                  { label: "Certificado tributario", desc: "Para declaración de renta" },
                ].map((cert, i, arr) => (
                  <View key={cert.label}>
                    <TouchableOpacity
                      style={[styles.menuItem, { paddingVertical: 14 }]}
                      onPress={() => Alert.alert("Descarga", `${cert.label} generado correctamente.\n\nEn producción se descargará en PDF.`)}
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: "#10B98120" }]}>
                        <Feather name="download" size={18} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuLabel, { color: C.text }]}>{cert.label}</Text>
                        <Text style={[styles.menuSub, { color: C.textSecondary }]}>{cert.desc}</Text>
                      </View>
                      <Feather name="download-cloud" size={16} color={C.textLight} />
                    </TouchableOpacity>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                  </View>
                ))}
              </View>

              {/* Extractos por mes */}
              <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4, marginTop: 16 }]}>EXTRACTOS {currentYear}</Text>
              <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
                {months.slice(0, new Date().getMonth() + 1).reverse().map((m, i, arr) => (
                  <View key={m}>
                    <TouchableOpacity
                      style={[styles.menuItem, { paddingVertical: 12 }]}
                      onPress={() => Alert.alert("Descarga", `Extracto de ${m} ${currentYear} generado.\n\nEn producción se descargará en PDF.`)}
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: "#6366F120" }]}>
                        <Feather name="calendar" size={16} color="#6366F1" />
                      </View>
                      <Text style={[styles.menuLabel, { color: C.text, flex: 1 }]}>{m} {currentYear}</Text>
                      <Feather name="download" size={16} color={C.textLight} />
                    </TouchableOpacity>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Centro de ayuda
══════════════════════════════════════════════════════════════ */
function HelpModal({ visible, onClose, C }: { visible: boolean; onClose: () => void; C: ReturnType<typeof useTheme>["C"] }) {
  const { supportPhone } = useApp();
  const faq = [
    { q: "¿Cómo cambio mi clave?", a: "Ve a Ajustes → Seguridad → Cambiar clave y sigue los pasos." },
    { q: "¿Cómo bloqueo mi tarjeta?", a: "Ve a Mis productos, selecciona la tarjeta y elige 'Bloquear tarjeta'." },
    { q: "¿Qué hago si pierdo mi celular?", a: "Comunícate inmediatamente con Bancolombia para bloquear tu acceso." },
    { q: "¿Cómo activo la clave dinámica?", a: "Ve a Ajustes → Seguridad → Clave dinámica y sigue el proceso de activación." },
    { q: "¿Cómo consulto mis movimientos?", a: "Desde la pestaña Inicio puedes ver tus últimas transacciones." },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Centro de ayuda</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {/* Canales de contacto */}
          <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4 }]}>CONTÁCTANOS</Text>
          <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
            <TouchableOpacity style={[styles.menuItem, { paddingVertical: 16 }]} onPress={() => Linking.openURL("tel:018000912345").catch(() => {})}>
              <View style={[styles.menuIconWrap, { backgroundColor: "#10B98120" }]}>
                <Feather name="phone" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>Línea de atención</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>Llamar ahora · Gratis desde Colombia</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textLight} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />
            <TouchableOpacity style={[styles.menuItem, { paddingVertical: 16 }]} onPress={() => Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20necesito%20ayuda%20con%20mi%20cuenta`).catch(() => {})}>
              <View style={[styles.menuIconWrap, { backgroundColor: "#25D36620" }]}>
                <Feather name="message-circle" size={18} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>WhatsApp</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>Chatea con un asesor</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textLight} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />
            <TouchableOpacity style={[styles.menuItem, { paddingVertical: 16 }]} onPress={() => Linking.openURL("https://www.grupobancolombia.com").catch(() => {})}>
              <View style={[styles.menuIconWrap, { backgroundColor: "#3B82F620" }]}>
                <Feather name="globe" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>Sitio web</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>grupobancolombia.com</Text>
              </View>
              <Feather name="external-link" size={16} color={C.textLight} />
            </TouchableOpacity>
          </View>

          {/* FAQ */}
          <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4, marginTop: 20 }]}>PREGUNTAS FRECUENTES</Text>
          <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
            {faq.map((item, i) => (
              <View key={i}>
                <TouchableOpacity
                  style={[styles.menuItem, { paddingVertical: 14 }]}
                  onPress={() => Alert.alert(item.q, item.a)}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: "#F59E0B20" }]}>
                    <Feather name="help-circle" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[styles.menuLabel, { color: C.text, flex: 1, fontSize: 14 }]}>{item.q}</Text>
                  <Feather name="chevron-right" size={16} color={C.textLight} />
                </TouchableOpacity>
                {i < faq.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Chat con Bancolombia
══════════════════════════════════════════════════════════════ */
function ChatModal({ visible, onClose, C }: { visible: boolean; onClose: () => void; C: ReturnType<typeof useTheme>["C"] }) {
  const { supportPhone } = useApp();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Chat con Bancolombia</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#25D36615" }]}>
              <Feather name="message-circle" size={36} color="#25D366" />
            </View>
            <Text style={[styles.profileHeroName, { color: C.text, marginTop: 16 }]}>Estamos para ayudarte</Text>
            <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginTop: 8 }]}>
              Nuestros asesores están disponibles{"\n"}lunes a sábado de 7:00 a.m. a 8:00 p.m.
            </Text>
          </View>

          {/* Canales */}
          <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
            <TouchableOpacity
              style={[styles.menuItem, { paddingVertical: 18 }]}
              onPress={() => { onClose(); Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20necesito%20ayuda%20con%20mi%20cuenta`).catch(() => {}); }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "#25D36620" }]}>
                <Feather name="message-square" size={18} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>WhatsApp</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>Respuesta inmediata</Text>
              </View>
              <View style={[styles.chatBadge, { backgroundColor: "#25D36620" }]}>
                <Text style={[styles.chatBadgeText, { color: "#25D366" }]}>Abrir</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />
            <TouchableOpacity
              style={[styles.menuItem, { paddingVertical: 18 }]}
              onPress={() => { onClose(); Linking.openURL("tel:018000912345").catch(() => {}); }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "#3B82F620" }]}>
                <Feather name="phone" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>Llamar</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>Línea gratuita desde Colombia</Text>
              </View>
              <View style={[styles.chatBadge, { backgroundColor: "#3B82F620" }]}>
                <Text style={[styles.chatBadgeText, { color: "#3B82F6" }]}>Llamar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Califica la app
══════════════════════════════════════════════════════════════ */
function RatingModal({ visible, onClose, C }: { visible: boolean; onClose: () => void; C: ReturnType<typeof useTheme>["C"] }) {
  const [stars, setStars] = useState(0);
  const [sent, setSent] = useState(false);
  const labels = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={() => { setSent(false); setStars(0); onClose(); }} style={styles.sheetClose}>
            <Feather name="x" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Califica la app</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ padding: 24, alignItems: "center" }}>
          {!sent ? (
            <>
              <Text style={[styles.profileHeroName, { color: C.text, marginBottom: 8 }]}>¿Cómo fue tu experiencia?</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginBottom: 32 }]}>
                Tu opinión nos ayuda a mejorar la app
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} style={{ padding: 6 }}>
                    <Feather name="star" size={42} color={n <= stars ? YELLOW : C.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
              {stars > 0 && (
                <Text style={[styles.ratingLabel, { color: YELLOW }]}>{labels[stars]}</Text>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: YELLOW, opacity: stars > 0 ? 1 : 0.35, marginTop: 32, width: "100%" }]}
                disabled={stars === 0}
                onPress={() => setSent(true)}
              >
                <Text style={styles.saveBtnText}>Enviar calificación</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <View style={[styles.menuIconWrap, { width: 72, height: 72, borderRadius: 36, backgroundColor: "#10B98120" }]}>
                <Feather name="check" size={36} color="#10B981" />
              </View>
              <Text style={[styles.profileHeroName, { color: C.text, marginTop: 20 }]}>¡Gracias por tu calificación!</Text>
              <Text style={[styles.menuSub, { color: C.textSecondary, textAlign: "center", marginTop: 8 }]}>
                Nos diste {stars} estrella{stars !== 1 ? "s" : ""}. Seguiremos mejorando para ti.
              </Text>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: YELLOW, marginTop: 32, width: "100%" }]} onPress={() => { setSent(false); setStars(0); onClose(); }}>
                <Text style={styles.saveBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ─────────────── SectionCard helper ─────────────── */
function SectionCard({ title, C, children }: { title: string; C: ReturnType<typeof useTheme>["C"]; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <Text style={[styles.editSectionLabel, { color: C.textSecondary, paddingHorizontal: 4 }]}>{title.toUpperCase()}</Text>
      <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>{children}</View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;
  const { currentUser, logout, themeMode, setThemeMode, accounts, cards, updateUser, reloadUserData } = useApp();
  const { C, isDark } = useTheme();

  const [modal, setModal] = useState<
    "profile" | "editProfile" | "security" | "notifications" |
    "products" | "extractos" | "help" | "chat" | "rating" | null
  >(null);

  if (!currentUser) return null;

  const fullName = [currentUser.firstName, currentUser.secondName, currentUser.lastName, currentUser.secondLastName]
    .filter(Boolean).join(" ");
  const doc = currentUser.documentNumber ?? "";

  const handleSaveProfile = async (data: Partial<RegisteredUser>) => {
    try {
      await updateUser(currentUser.id, data);
      await reloadUserData();
      setModal(null);
      Alert.alert("¡Listo!", "Tu perfil fue actualizado correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo actualizar el perfil. Intenta de nuevo.");
    }
  };

  const SECTIONS = [
    {
      title: "Mi perfil",
      items: [
        { icon: "user" as const, label: "Mis datos", sub: fullName, color: "#3B82F6", onPress: () => setModal("profile") },
        { icon: "shield" as const, label: "Seguridad", sub: "Clave, biometría y clave dinámica", color: "#10B981", onPress: () => setModal("security") },
        { icon: "bell" as const, label: "Notificaciones", sub: "Configura tus alertas", color: "#F59E0B", onPress: () => setModal("notifications") },
      ],
    },
    {
      title: "Mis productos",
      items: [
        { icon: "credit-card" as const, label: "Mis productos", sub: `${accounts.length} cuenta${accounts.length !== 1 ? "s" : ""} · ${cards.length} tarjeta${cards.length !== 1 ? "s" : ""}`, color: "#8B5CF6", onPress: () => setModal("products") },
        { icon: "briefcase" as const, label: "Mis créditos", sub: "Préstamos y avances", color: "#EF4444",
          onPress: () => Alert.alert("Mis créditos", "No tienes créditos activos.\n\nContacta a Bancolombia para información.", [
            { text: "Contactar", onPress: () => setModal("chat") }, { text: "Cerrar", style: "cancel" },
          ]) },
        { icon: "file-text" as const, label: "Extractos y certificados", sub: "Descarga documentos", color: "#6366F1", onPress: () => setModal("extractos") },
      ],
    },
    {
      title: "Configuración",
      items: [
        { icon: (isDark ? "moon" : "sun") as keyof typeof Feather.glyphMap, label: "Modo oscuro", sub: isDark ? "Activado" : "Desactivado", color: "#6B7280", toggle: true, onPress: () => setThemeMode(isDark ? "light" : "dark") },
        { icon: "help-circle" as const, label: "Centro de ayuda", sub: "Preguntas frecuentes y contacto", color: "#06B6D4", onPress: () => setModal("help") },
        { icon: "message-circle" as const, label: "Chat con Bancolombia", sub: "WhatsApp y asesores en línea", color: "#25D366", onPress: () => setModal("chat") },
        { icon: "star" as const, label: "Califica la app", sub: "Tu opinión nos importa", color: "#F59E0B", onPress: () => setModal("rating") },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* ── Modals ── */}
      <ProfileDetailModal visible={modal === "profile"} onClose={() => setModal(null)} user={currentUser} accounts={accounts} cards={cards ?? []} isDark={isDark} C={C} onEdit={() => setModal("editProfile")} />
      <EditProfileModal visible={modal === "editProfile"} onClose={() => setModal(null)} user={currentUser} onSave={handleSaveProfile} C={C} isDark={isDark} />
      <SecurityModal visible={modal === "security"} onClose={() => setModal(null)} C={C} isDark={isDark} />
      <NotificationsModal visible={modal === "notifications"} onClose={() => setModal(null)} C={C} isDark={isDark} />
      <ProductsModal visible={modal === "products"} onClose={() => setModal(null)} accounts={accounts} cards={cards ?? []} C={C} />
      <ExtractosModal visible={modal === "extractos"} onClose={() => setModal(null)} accounts={accounts} C={C} />
      <HelpModal visible={modal === "help"} onClose={() => setModal(null)} C={C} />
      <ChatModal visible={modal === "chat"} onClose={() => setModal(null)} C={C} />
      <RatingModal visible={modal === "rating"} onClose={() => setModal(null)} C={C} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Profile header ── */}
        <View style={[styles.profileHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => setModal("profile")} activeOpacity={0.8}>
            <Avatar name={fullName} isDark={isDark} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setModal("profile")} activeOpacity={0.8}>
            <Text style={[styles.profileName, { color: C.text }]}>{fullName}</Text>
            <Text style={[styles.profileDoc, { color: C.textSecondary }]}>{currentUser.documentType} {doc}</Text>
            {currentUser.email ? <Text style={[styles.profileEmail, { color: C.textSecondary }]} numberOfLines={1}>{currentUser.email}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7" }]}
            onPress={() => setModal("editProfile")}
          >
            <Feather name="edit-2" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Sections ── */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.section, { backgroundColor: C.background }]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{section.title}</Text>
            <View style={[styles.optionsCard, { backgroundColor: C.surface }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + "20" }]}>
                      <Feather name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                      {item.sub ? <Text style={[styles.menuSub, { color: C.textSecondary }]} numberOfLines={1}>{item.sub}</Text> : null}
                    </View>
                    {"toggle" in item && item.toggle ? (
                      <Switch
                        value={isDark}
                        onValueChange={(v) => setThemeMode(v ? "dark" : "light")}
                        trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: "#3A3A3C" }}
                        thumbColor={isDark ? YELLOW : "#FFFFFF"}
                      />
                    ) : (
                      <Feather name="chevron-right" size={18} color={C.textLight} />
                    )}
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 68 }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <View style={[styles.logoutSection, { backgroundColor: C.background }]}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: isDark ? "#1E1E21" : "#FFFFFF" }]}
            onPress={() => Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Cerrar sesión", style: "destructive", onPress: logout },
            ])}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: C.textLight }]}>Mi Bancolombia · Versión 2.3.2</Text>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Main profile header */
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20, marginBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "700", fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  profileDoc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  profileEmail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  /* Sections */
  section: { marginBottom: 4, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, marginTop: 12 },
  optionsCard: { borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 13 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "500", fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth },

  /* Logout */
  logoutSection: { paddingHorizontal: 16, marginTop: 12 },
  logoutBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444", fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },

  /* Sheet (full-screen modals) */
  sheetContainer: { flex: 1 },
  sheetHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sheetTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sheetEditBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  /* Profile detail */
  profileHero: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 },
  profileHeroName: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 14, textAlign: "center" },
  profileHeroDoc: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  memberSince: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 20 },

  /* Info rows */
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 11, paddingHorizontal: 16, gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium", flex: 2, textAlign: "right" },

  /* Products */
  productRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 13 },
  productIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontWeight: "500", fontFamily: "Inter_500Medium" },
  productNum: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  productBalance: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  accStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },

  /* Edit profile */
  editSectionLabel: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  readonlyCard: { borderRadius: 14, overflow: "hidden" },
  readonlyHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, paddingHorizontal: 4 },
  editLabel: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500", marginTop: 16, marginBottom: 6 },
  editInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular", borderWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },

  /* Extracto */
  extractoSummary: { borderRadius: 16, padding: 20, marginBottom: 4 },
  extractoAccName: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
  extractoAccNum: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  extractoBalance: { color: "#FFFFFF", fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 12 },
  extractoBalanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },

  /* Rating */
  starsRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 8 },
  ratingLabel: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 8 },

  /* Chat */
  chatBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chatBadgeText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  /* PIN pad */
  pinDot: { width: 16, height: 16, borderRadius: 8 },
  pinKey: { width: "33.33%", aspectRatio: 1.6, alignItems: "center", justifyContent: "center" },
  pinKeyText: { fontSize: 22, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  /* OTP */
  otpBox: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 20 },
  otpCode: { fontSize: 38, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 8 },
});
