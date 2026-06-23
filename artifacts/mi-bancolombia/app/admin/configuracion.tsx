import { Feather } from "@expo/vector-icons";
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
import { useTheme } from "@/hooks/useTheme";

const ADMIN_BG = "#0A0E27";
const ADMIN_SURFACE = "#111827";
const ADMIN_BORDER = "rgba(253,218,36,0.18)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";

export default function AdminConfiguracion() {
  const { supportPhone, setSupportPhone, addAuditLog } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Configuración</Text>
        <Text style={styles.headerSub}>Parámetros del sistema</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* WhatsApp */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: "#25D36620" }]}>
              <Feather name="message-circle" size={20} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Número de soporte WhatsApp</Text>
              <Text style={styles.cardSub}>
                Número al que se redirige el botón de WhatsApp en la app
              </Text>
            </View>
          </View>

          <Text style={styles.currentLabel}>Número actual</Text>
          <View style={[styles.currentRow, { borderColor: "#25D36640" }]}>
            <Feather name="check-circle" size={16} color="#25D366" />
            <Text style={styles.currentText}>{formatDisplay(supportPhone)}</Text>
          </View>

          <Text style={styles.inputLabel}>Nuevo número (con código de país)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.plus}>+</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(t) => { setInput(t); setSaved(false); }}
              keyboardType="phone-pad"
              placeholder="573132095988"
              placeholderTextColor="rgba(255,255,255,0.25)"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.inputHint}>
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

        {/* Información */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: "#3B82F620" }]}>
              <Feather name="info" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.cardTitle, { flex: 1 }]}>¿Cómo funciona?</Text>
          </View>
          {[
            "El botón de WhatsApp en la app abre directamente una conversación con este número.",
            "El número puede ser de cualquier país. Incluye el código de país sin el signo +.",
            "Los cambios se aplican de inmediato para todos los usuarios.",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Feather name="arrow-right" size={13} color="#3B82F6" style={{ marginTop: 2 }} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ADMIN_SURFACE,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BORDER,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  card: {
    backgroundColor: ADMIN_SURFACE,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: ADMIN_BORDER,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 3,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#25D36610",
    marginBottom: 20,
  },
  currentText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#25D366",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(253,218,36,0.3)",
    paddingHorizontal: 14,
    height: 52,
    gap: 6,
  },
  plus: {
    fontSize: 18,
    color: YELLOW,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  inputHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginTop: 8,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
