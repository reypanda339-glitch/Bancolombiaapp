import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Image,
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

export default function MasScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const { currentUser, logout, themeMode, setThemeMode } = useApp();
  const { C, isDark } = useTheme();

  const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Usuario";
  const doc = currentUser?.documentNumber ?? "";

  const SECTIONS = [
    {
      title: "Mi perfil",
      items: [
        { icon: "user"       as const, label: "Mis datos",         sub: "Información personal",              color: "#3B82F6" },
        { icon: "shield"     as const, label: "Seguridad",         sub: "Clave, biometría y clave dinámica", color: "#10B981" },
        { icon: "bell"       as const, label: "Notificaciones",    sub: "Configura tus alertas",             color: "#F59E0B" },
      ],
    },
    {
      title: "Mis productos",
      items: [
        { icon: "credit-card" as const, label: "Mis tarjetas",             sub: "Débito y crédito",      color: "#8B5CF6" },
        { icon: "briefcase"   as const, label: "Mis créditos",             sub: "Préstamos y avances",   color: "#EF4444" },
        { icon: "file-text"   as const, label: "Extractos y certificados", sub: "Descarga documentos",  color: "#6366F1" },
      ],
    },
    {
      title: "Configuración",
      items: [
        {
          icon: isDark ? "moon" as const : "sun" as const,
          label: "Modo oscuro",
          sub: isDark ? "Activado" : "Desactivado",
          color: "#6B7280",
          toggle: true,
        },
        { icon: "help-circle"    as const, label: "Centro de ayuda",         sub: "Preguntas frecuentes",  color: "#06B6D4" },
        { icon: "message-circle" as const, label: "Chat con Bancolombia",    sub: "WhatsApp y chat",       color: "#25D366" },
        { icon: "star"           as const, label: "Califica la app",         sub: "Tu opinión nos importa",color: "#F59E0B" },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <View style={[styles.avatarWrap, { backgroundColor: isDark ? "#1E1E21" : "#F0F0F0" }]}>
            <Image
              source={require("../../assets/images/bancolombia_icon.png")}
              style={styles.avatarLogo}
              resizeMode="contain"
              tintColor={isDark ? "#FFFFFF" : undefined}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.text }]}>{name}</Text>
            <Text style={[styles.profileDoc, { color: C.textSecondary }]}>C.C. {doc}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7" }]}
            onPress={() => Alert.alert("Editar perfil", "Próximamente disponible.")}
          >
            <Feather name="edit-2" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.section, { backgroundColor: C.background }]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: C.surface }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      if ("toggle" in item && item.toggle) {
                        setThemeMode(isDark ? "light" : "dark");
                      } else {
                        Alert.alert(item.label, "Próximamente disponible");
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + "20" }]}>
                      <Feather name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                      {item.sub && <Text style={[styles.menuSub, { color: C.textSecondary }]}>{item.sub}</Text>}
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

        <View style={[styles.logoutSection, { backgroundColor: C.background }]}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: isDark ? "#1E1E21" : "#FFFFFF" }]}
            onPress={logout}
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
    padding: 20, marginBottom: 8,
    borderBottomWidth: 1,
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarLogo: { width: 38, height: 38 },
  profileName: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  profileDoc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  section: { marginBottom: 8, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 8, marginTop: 4,
  },
  card: { borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 15, gap: 13 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "500", fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  divider: { height: 1 },
  logoutSection: { paddingHorizontal: 16, marginTop: 8 },
  logoutBtn: {
    borderRadius: 14, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444", fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },
});
