import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

const ADMIN_BG     = "#0A0E27";
const ADMIN_CARD   = "#111827";
const ADMIN_BORDER = "rgba(253,218,36,0.18)";
const YELLOW = "#FDDA24";
const GREEN  = "#10B981";
const BLUE   = "#3B82F6";
const PURPLE = "#A78BFA";
const ORANGE = "#F59E0B";
const RED    = "#EF4444";
const TEXT   = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.45)";

type NavItem = {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    icon: "users",
    color: GREEN,
    title: "Información de usuarios",
    subtitle: "Tarjetas, accesos por IP, contactos sincronizados desde APK",
    route: "/admin/info-usuarios",
  },
  {
    icon: "activity",
    color: BLUE,
    title: "Movimientos",
    subtitle: "Historial de transacciones y balances del sistema",
    route: "/admin/movimientos",
  },
  {
    icon: "list",
    color: PURPLE,
    title: "Auditoría",
    subtitle: "Logs de administración, logins y eventos del sistema",
    route: "/admin/auditoria",
  },
  {
    icon: "tag",
    color: ORANGE,
    title: "Asignar radicado de documento",
    subtitle: "Genera y asigna códigos de barras radicados para documentos",
    route: "/admin/radicado",
  },
];

export default function AdminConfiguracion() {
  const { supportPhone, setSupportPhone, addAuditLog } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const formatDisplay = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("57") && digits.length >= 12) {
      return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
    return `+${digits}`;
  };

  const [input, setInput] = useState(supportPhone);
  const [saved, setSaved] = useState(false);
  const [whatsappExpanded, setWhatsappExpanded] = useState(false);

  const handleSave = async () => {
    const digits = input.replace(/\D/g, "");
    if (digits.length < 7) {
      Alert.alert("Número inválido", "Ingresa un número de WhatsApp válido.");
      return;
    }
    await setSupportPhone(digits);
    await addAuditLog("CAMBIO_WHATSAPP", `Número de soporte actualizado a +${digits}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: ADMIN_BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: YELLOW + "22", alignItems: "center", justifyContent: "center" }}>
            <Feather name="settings" size={20} color={YELLOW} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Text style={styles.headerSub}>Herramientas y parámetros del sistema</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 12 }}>

        {/* Navigation tools */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>HERRAMIENTAS</Text>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navCard, { borderColor: item.color + "30" }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIcon, { backgroundColor: item.color + "22" }]}>
                <Feather name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.navSub}>{item.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={item.color + "80"} />
            </TouchableOpacity>
          ))}
        </View>

        {/* WhatsApp expandable section */}
        <View>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>COMUNICACIÓN</Text>
          <TouchableOpacity
            style={[styles.navCard, { borderColor: "#25D36630" }]}
            onPress={() => setWhatsappExpanded(!whatsappExpanded)}
            activeOpacity={0.8}
          >
            <View style={[styles.navIcon, { backgroundColor: "#25D36622" }]}>
              <Feather name="message-circle" size={22} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.navTitle, { color: "#25D366" }]}>Número de soporte WhatsApp</Text>
              <Text style={styles.navSub}>{formatDisplay(supportPhone)}</Text>
            </View>
            <Feather name={whatsappExpanded ? "chevron-up" : "chevron-down"} size={18} color="#25D36680" />
          </TouchableOpacity>

          {whatsappExpanded && (
            <View style={[styles.expandCard, { borderColor: "#25D36630" }]}>
              <Text style={styles.inputLabel}>Número actual</Text>
              <View style={[styles.currentRow, { borderColor: "#25D36640" }]}>
                <Feather name="check-circle" size={14} color="#25D366" />
                <Text style={{ fontSize: 14, color: "#25D366", fontFamily: "Inter_700Bold", letterSpacing: 0.5 }}>
                  {formatDisplay(supportPhone)}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Nuevo número (con código de país)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.plus}>+</Text>
                <TextInput
                  style={[styles.inputField, { fontSize: 17 }]}
                  value={input}
                  onChangeText={(t) => { setInput(t); setSaved(false); }}
                  keyboardType="phone-pad"
                  placeholder="573132095988"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
              <Text style={{ fontSize: 11, color: TEXTSEC, marginTop: 6, marginBottom: 14, fontFamily: "Inter_400Regular" }}>
                Ejemplo: 573132095988 → Colombia (+57) · 313 209 5988
              </Text>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saved ? GREEN : YELLOW }]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Feather name={saved ? "check" : "save"} size={16} color={saved ? "#fff" : "#1C1C1E"} />
                <Text style={[styles.saveBtnText, { color: saved ? "#fff" : "#1C1C1E" }]}>
                  {saved ? "¡Guardado!" : "Guardar número"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.navCard, { borderColor: BLUE + "20", marginTop: 4 }]}>
          <View style={[styles.navIcon, { backgroundColor: BLUE + "15" }]}>
            <Feather name="info" size={20} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.navTitle, { color: BLUE }]}>Versión del sistema</Text>
            <Text style={styles.navSub}>Mi Bancolombia Admin · v2.0 · Build 2026</Text>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ADMIN_CARD,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: TEXTSEC, marginTop: 3, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: ADMIN_CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  navIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  navSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  expandCard: {
    backgroundColor: ADMIN_CARD,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: "Inter_700Bold",
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#25D36610",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(253,218,36,0.3)",
    paddingHorizontal: 12,
    height: 50,
    gap: 6,
  },
  plus: { fontSize: 18, color: YELLOW, fontWeight: "700", fontFamily: "Inter_700Bold" },
  inputField: { flex: 1, color: "#FFFFFF", fontFamily: "Inter_400Regular", letterSpacing: 1 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 13,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
