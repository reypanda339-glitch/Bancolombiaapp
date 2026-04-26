import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const YELLOW = "#FDDA24";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub?: string;
  color: string;
  action?: () => void;
  toggle?: boolean;
};

export default function MasScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const { currentUser, logout, themeMode, setThemeMode } = useApp();
  const router = useRouter();

  const isDark = themeMode === "dark";
  const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Usuario";
  const doc = currentUser?.documentNumber ?? "";

  const SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: "Mi perfil",
      items: [
        { icon: "user", label: "Mis datos", sub: "Información personal", color: "#3B82F6" },
        { icon: "shield", label: "Seguridad", sub: "Clave, biometría y clave dinámica", color: "#10B981" },
        { icon: "bell", label: "Notificaciones", sub: "Configura tus alertas", color: "#F59E0B" },
      ],
    },
    {
      title: "Mis productos",
      items: [
        { icon: "credit-card", label: "Mis tarjetas", sub: "Débito y crédito", color: "#8B5CF6" },
        { icon: "briefcase", label: "Mis créditos", sub: "Préstamos y avances", color: "#EF4444" },
        { icon: "file-text", label: "Extractos y certificados", sub: "Descarga documentos", color: "#6366F1" },
      ],
    },
    {
      title: "Configuración",
      items: [
        {
          icon: isDark ? "moon" : "sun",
          label: "Modo oscuro",
          sub: isDark ? "Activado" : "Desactivado",
          color: "#6B7280",
          toggle: true,
        },
        { icon: "help-circle", label: "Centro de ayuda", sub: "Preguntas frecuentes", color: "#06B6D4" },
        { icon: "message-circle", label: "Chat con Bancolombia", sub: "WhatsApp y chat", color: "#25D366" },
        { icon: "star", label: "Califica la app", sub: "Tu opinión nos importa", color: "#F59E0B" },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image
              source={require("../../assets/images/bancolombia_icon.png")}
              style={styles.avatarLogo}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileDoc}>C.C. {doc}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Feather name="edit-2" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.action ?? (() => {
                      if (item.toggle) {
                        setThemeMode(isDark ? "light" : "dark");
                      } else {
                        Alert.alert(item.label, "Próximamente disponible");
                      }
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + "18" }]}>
                      <Feather name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={isDark}
                        onValueChange={(v) => setThemeMode(v ? "dark" : "light")}
                        trackColor={{ false: "#E5E7EB", true: "#1C1C1E" }}
                        thumbColor={isDark ? YELLOW : "#FFFFFF"}
                      />
                    ) : (
                      <Feather name="chevron-right" size={18} color="#C0C0C0" />
                    )}
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Mi Bancolombia · Versión 2.3.2</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", padding: 20, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  avatarWrap: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarLogo: { width: 40, height: 40 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  profileDoc: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "500", color: "#1C1C1E", fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginTop: 1 },
  divider: { height: 1, backgroundColor: "#F5F5F7", marginLeft: 70 },
  logoutSection: { paddingHorizontal: 16, marginTop: 8 },
  logoutBtn: {
    backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444", fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 12, color: "#C0C0C0", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16 },
});
