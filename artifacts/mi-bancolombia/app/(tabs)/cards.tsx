import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

const YELLOW = "#FDDA24";
const WHATSAPP_URL = "https://wa.me/573132095988";
const HELP_PHONE = "01 8000 912 345";

/* ── Avatar initials ── */
function Avatar({ name, isDark }: { name: string; isDark: boolean }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View style={[styles.avatarWrap, { backgroundColor: isDark ? "#2A2A35" : "#EFEFEF" }]}>
      <Text style={[styles.avatarText, { color: isDark ? YELLOW : "#1C1C1E" }]}>{initials}</Text>
    </View>
  );
}

/* ── Star rating modal ── */
function RatingModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const { C } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: C.surface }]}>
          <Text style={[styles.modalTitle, { color: C.text }]}>¿Cómo calificarías la app?</Text>
          <Text style={[styles.modalSub, { color: C.textSecondary }]}>Tu opinión nos ayuda a mejorar</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setStars(n)}>
                <Feather name="star" size={36} color={n <= stars ? YELLOW : "#9CA3AF"} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: YELLOW, opacity: stars > 0 ? 1 : 0.4 }]}
            disabled={stars === 0}
            onPress={() => {
              onClose();
              Alert.alert("¡Gracias!", `Nos diste ${stars} estrella${stars !== 1 ? "s" : ""}. Tu opinión es muy importante.`);
            }}
          >
            <Text style={styles.modalBtnText}>Enviar calificación</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={[styles.modalCancel, { color: C.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Security modal ── */
function SecurityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { C } = useTheme();
  const options = [
    { icon: "lock" as const, label: "Cambiar clave", desc: "Actualiza tu clave de 4 dígitos" },
    { icon: "eye-off" as const, label: "Clave dinámica", desc: "OTP de un solo uso cada 30 s" },
    { icon: "smartphone" as const, label: "Dispositivos autorizados", desc: "Gestiona tus dispositivos" },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: C.surface }]}>
          <Text style={[styles.modalTitle, { color: C.text }]}>Seguridad</Text>
          {options.map((o, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.secRow, { borderBottomColor: C.divider, borderBottomWidth: i < options.length - 1 ? 1 : 0 }]}
              onPress={() => {
                onClose();
                Alert.alert(o.label, `${o.desc}.\n\nEsta función estará disponible próximamente.`);
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "#10B98120" }]}>
                <Feather name={o.icon} size={17} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>{o.label}</Text>
                <Text style={[styles.menuSub, { color: C.textSecondary }]}>{o.desc}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textLight} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.background, marginTop: 16 }]} onPress={onClose}>
            <Text style={[styles.modalBtnText, { color: C.text }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const { currentUser, logout, themeMode, setThemeMode, accounts } = useApp();
  const { C, isDark } = useTheme();

  const [showRating, setShowRating] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Usuario";
  const doc = currentUser?.documentNumber ?? "";
  const email = currentUser?.email ?? "";
  const phone = currentUser?.phone ?? "";

  /* ── Actions with real logic ── */
  const handleMisDatos = () => {
    Alert.alert(
      "Mis datos",
      `👤 Nombre: ${name}\n📋 Documento: ${currentUser?.documentType ?? "CC"} ${doc}\n📧 Correo: ${email}\n📱 Teléfono: ${phone}`,
      [{ text: "Cerrar" }],
    );
  };

  const handleNotificaciones = () => {
    Alert.alert(
      "Notificaciones",
      "¿Qué alertas deseas recibir?",
      [
        { text: "Transacciones (Activado)", style: "default" },
        { text: "Promociones (Desactivado)", style: "default" },
        { text: "Cerrar", style: "cancel" },
      ],
    );
  };

  const handleMisTarjetas = () => {
    if (accounts.length === 0) {
      Alert.alert("Mis tarjetas", "No tienes productos activos.");
      return;
    }
    const list = accounts
      .map((a) => `• ${a.name} ···${a.number.slice(-4)}`)
      .join("\n");
    Alert.alert("Mis productos activos", list, [{ text: "Cerrar" }]);
  };

  const handleExtractos = () => {
    if (accounts.length === 0) {
      Alert.alert("Extractos", "No tienes cuentas activas.");
      return;
    }
    const options = accounts.map((a) => ({
      text: a.name,
      onPress: () =>
        Alert.alert(
          "Extracto",
          `Cuenta: ${a.number}\nSaldo: ${a.balance.toLocaleString("es-CO", { minimumFractionDigits: 2 })} ${a.currency}\n\nDescarga disponible próximamente.`,
        ),
    }));
    Alert.alert("Extractos y certificados", "Selecciona una cuenta:", [
      ...options,
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleCentroAyuda = () => {
    Alert.alert(
      "Centro de ayuda",
      `📞 Línea nacional: ${HELP_PHONE}\n📱 WhatsApp: 313 209 5988\n🌐 www.grupobancolombia.com`,
      [
        {
          text: "Llamar",
          onPress: () => Linking.openURL(`tel:018000912345`).catch(() => {}),
        },
        {
          text: "WhatsApp",
          onPress: () => Linking.openURL(WHATSAPP_URL).catch(() => {}),
        },
        { text: "Cerrar", style: "cancel" },
      ],
    );
  };

  const handleChat = () => {
    Alert.alert(
      "Chat con Bancolombia",
      "¿Cómo deseas contactarnos?",
      [
        {
          text: "WhatsApp",
          onPress: () => Linking.openURL(WHATSAPP_URL).catch(() =>
            Alert.alert("Error", "No se pudo abrir WhatsApp.")),
        },
        {
          text: "Llamar",
          onPress: () => Linking.openURL(`tel:018000912345`).catch(() => {}),
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const SECTIONS = [
    {
      title: "Mi perfil",
      items: [
        {
          icon: "user" as const,
          label: "Mis datos",
          sub: `${name} · CC ${doc}`,
          color: "#3B82F6",
          onPress: handleMisDatos,
        },
        {
          icon: "shield" as const,
          label: "Seguridad",
          sub: "Clave, biometría y clave dinámica",
          color: "#10B981",
          onPress: () => setShowSecurity(true),
        },
        {
          icon: "bell" as const,
          label: "Notificaciones",
          sub: "Configura tus alertas",
          color: "#F59E0B",
          onPress: handleNotificaciones,
        },
      ],
    },
    {
      title: "Mis productos",
      items: [
        {
          icon: "credit-card" as const,
          label: "Mis productos",
          sub: `${accounts.length} producto${accounts.length !== 1 ? "s" : ""} activo${accounts.length !== 1 ? "s" : ""}`,
          color: "#8B5CF6",
          onPress: handleMisTarjetas,
        },
        {
          icon: "briefcase" as const,
          label: "Mis créditos",
          sub: "Préstamos y avances",
          color: "#EF4444",
          onPress: () =>
            Alert.alert("Mis créditos", "No tienes créditos activos en este momento.\n\nContacta a Bancolombia para más información.", [
              { text: "Llamar", onPress: () => Linking.openURL("tel:018000912345").catch(() => {}) },
              { text: "Cerrar", style: "cancel" },
            ]),
        },
        {
          icon: "file-text" as const,
          label: "Extractos y certificados",
          sub: "Descarga documentos",
          color: "#6366F1",
          onPress: handleExtractos,
        },
      ],
    },
    {
      title: "Configuración",
      items: [
        {
          icon: (isDark ? "moon" : "sun") as const,
          label: "Modo oscuro",
          sub: isDark ? "Activado" : "Desactivado",
          color: "#6B7280",
          toggle: true,
          onPress: () => setThemeMode(isDark ? "light" : "dark"),
        },
        {
          icon: "help-circle" as const,
          label: "Centro de ayuda",
          sub: HELP_PHONE,
          color: "#06B6D4",
          onPress: handleCentroAyuda,
        },
        {
          icon: "message-circle" as const,
          label: "Chat con Bancolombia",
          sub: "WhatsApp · 313 209 5988",
          color: "#25D366",
          onPress: handleChat,
        },
        {
          icon: "star" as const,
          label: "Califica la app",
          sub: "Tu opinión nos importa",
          color: "#F59E0B",
          onPress: () => setShowRating(true),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      <RatingModal visible={showRating} onClose={() => setShowRating(false)} />
      <SecurityModal visible={showSecurity} onClose={() => setShowSecurity(false)} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profile header ── */}
        <View style={[styles.profileHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <Avatar name={name} isDark={isDark} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.text }]}>{name}</Text>
            <Text style={[styles.profileDoc, { color: C.textSecondary }]}>C.C. {doc}</Text>
            {email ? <Text style={[styles.profileEmail, { color: C.textSecondary }]}>{email}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7" }]}
            onPress={handleMisDatos}
          >
            <Feather name="edit-2" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Sections ── */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.section, { backgroundColor: C.background }]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: C.surface }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + "20" }]}>
                      <Feather name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                      {item.sub ? (
                        <Text style={[styles.menuSub, { color: C.textSecondary }]} numberOfLines={1}>
                          {item.sub}
                        </Text>
                      ) : null}
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
                    <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 70 }]} />
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
            onPress={() =>
              Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar sesión", style: "destructive", onPress: logout },
              ])
            }
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

const styles = StyleSheet.create({
  container: { flex: 1 },

  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 20, marginBottom: 8, borderBottomWidth: 1,
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  profileDoc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  profileEmail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },

  section: { marginBottom: 8, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 8, marginTop: 10,
  },
  card: { borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 13 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "500", fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70 },

  logoutSection: { paddingHorizontal: 16, marginTop: 8 },
  logoutBtn: {
    borderRadius: 14, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444", fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },

  /* Modals */
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 6 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  starsRow: { flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 28 },
  modalBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  modalCancel: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  secRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, gap: 13,
  },
});
