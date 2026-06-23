import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountCardCarousel } from "@/components/AccountCardCarousel";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const COL_W = (SCREEN_W - 32) / 3;

const TX_ACTIONS = [
  { icon: "bar-chart-2", label: "Ver saldos y\nmovimientos", color: "#3B82F6", tab: 1 },
  { icon: "send",        label: "Transferir\nplata",         color: "#8B5CF6", tab: 2 },
  { icon: "repeat",      label: "A otro banco\nTransfiya",   color: "#10B981", tab: 2 },
  { icon: "plus-circle", label: "Inscribir\nproductos",      color: "#F59E0B", alert: "Para inscribir productos nuevos, ve a Más > Mis productos." },
  { icon: "download",    label: "Recibir\nplata",            color: "#06B6D4", tab: 2 },
  { icon: "file-text",   label: "Pagar\nfacturas",           color: "#EF4444", tab: 3 },
  { icon: "credit-card", label: "Pagar tarjetas\ny créditos",color: "#6366F1", alert: "Selecciona la tarjeta a pagar en Más > Mis tarjetas." },
  { icon: "smartphone",  label: "Recargar\ncelular",         color: "#F59E0B", tab: 3 },
  { icon: "trending-up", label: "Avances y\ndesembolsos",    color: "#10B981", alert: "Para solicitar un avance, ve a Más > Mis créditos." },
];

function ClaveTimer({ isDark }: { isDark: boolean }) {
  const [seconds, setSeconds] = useState(28);
  const [codeVal] = useState(() => {
    const n = Math.floor(100000 + Math.random() * 899999);
    return `${String(n).slice(0, 3)} ${String(n).slice(3)}`;
  });

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? 29 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <TouchableOpacity
      style={styles.clavePill}
      onPress={() =>
        Alert.alert(
          "Clave Dinámica",
          `Tu clave de un solo uso:\n\n${codeVal}\n\nÚsala para autorizar transacciones. Cambia cada 30 segundos.`,
        )
      }
      activeOpacity={0.82}
    >
      <View style={styles.claveIconWrap}>
        <Feather name="shield" size={13} color="#1C1C1E" />
      </View>
      <View>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{codeVal}</Text>
      </View>
      <View style={styles.claveTimer}>
        <Text style={styles.claveTimerText}>{String(seconds).padStart(2, "0")}s</Text>
      </View>
    </TouchableOpacity>
  );
}

const ARC_COLORS = ["#FF3B30","#FF6B35","#FDDA24","#34C759","#00C7BE","#007AFF","#AF52DE"];

function ColorArc({ isDark, bgColor }: { isDark: boolean; bgColor: string }) {
  const segCount = ARC_COLORS.length;
  const segW = SCREEN_W / segCount;
  const ARC_H = 190;
  const RADIUS = SCREEN_W * 0.72;

  return (
    <View style={[styles.arcContainer, { height: ARC_H }]} pointerEvents="none">
      {ARC_COLORS.map((color, i) => (
        <View
          key={i}
          style={{
            position: "absolute", bottom: 0,
            left: i * segW - 2, width: segW + 4, height: ARC_H, overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute", bottom: 0,
              left: -(RADIUS - segW / 2), width: RADIUS * 2, height: RADIUS * 2,
              borderRadius: RADIUS, backgroundColor: color, opacity: 0.9,
            }}
          />
        </View>
      ))}
      <View
        style={{
          position: "absolute", bottom: 0, left: 14, right: 14,
          height: ARC_H - 18, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS,
          backgroundColor: bgColor,
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { userName, logout } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const handleTxAction = (action: (typeof TX_ACTIONS)[0]) => {
    if (action.alert) {
      Alert.alert("Información", action.alert);
    } else if (action.tab !== undefined) {
      const routes = [
        "/(tabs)/index",
        "/(tabs)/movements",
        "/(tabs)/transfers",
        "/(tabs)/payments",
        "/(tabs)/cards",
      ];
      router.push(routes[action.tab] as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <Image
          source={require("../../assets/images/bancolombia_icon.png")}
          style={styles.headerLogo}
          resizeMode="contain"
          tintColor={isDark ? "#FFFFFF" : undefined}
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => Alert.alert("Notificaciones", "No tienes notificaciones nuevas.")}
          >
            <Feather name="bell" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() =>
              Alert.alert("Ayuda", "Centro de ayuda Bancolombia.\nLínea: 01 8000 912 345\nWhatsApp: 3132095988")
            }
          >
            <Feather name="help-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() =>
              Alert.alert("Chat", "Conéctate con un asesor por WhatsApp al 3132095988 o desde la app de Bancolombia.")
            }
          >
            <Feather name="message-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={logout}>
            <Feather name="log-out" size={19} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO (greeting + arc + clave) ── */}
        <View style={[styles.heroSection, { backgroundColor: C.heroSection }]}>
          <ColorArc isDark={isDark} bgColor={C.background} />
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingText, { color: C.text }]}>Hola, {userName}</Text>
            <Feather name="chevron-right" size={20} color={C.textSecondary} />
          </View>
          <ClaveTimer isDark={isDark} />
        </View>

        {/* ── ACCOUNT CAROUSEL ── */}
        <AccountCardCarousel isDark={isDark} C={C} />

        {/* ── TRANSACCIONES GRID ── */}
        <View style={[styles.txSection, { backgroundColor: C.sectionBg }]}>
          <Text style={[styles.txSectionTitle, { color: C.text }]}>Transacciones principales</Text>
          <View style={styles.txGrid}>
            {TX_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.txItem]}
                onPress={() => handleTxAction(action)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.txIconWrap,
                    {
                      backgroundColor: isDark
                        ? action.color + "22"
                        : action.color + "18",
                    },
                  ]}
                >
                  <Feather name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={[styles.txLabel, { color: C.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLogo: { width: 120, height: 30 },
  headerIcons: { flexDirection: "row", gap: 2 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  scrollContent: { paddingBottom: 20 },
  heroSection: { paddingBottom: 20, marginBottom: 10 },
  arcContainer: {
    width: SCREEN_W,
    overflow: "hidden",
    marginBottom: -12,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 6,
    gap: 4,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  clavePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8,
    alignSelf: "flex-start",
  },
  claveIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  claveLabel: {
    fontSize: 9, color: "#1C1C1E",
    fontFamily: "Inter_500Medium", opacity: 0.7,
  },
  claveCode: {
    fontSize: 15, fontWeight: "700", color: "#1C1C1E",
    fontFamily: "Inter_700Bold", letterSpacing: 1.5,
  },
  claveTimer: {
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 10, paddingHorizontal: 8,
    paddingVertical: 3, marginLeft: "auto",
  },
  claveTimerText: {
    fontSize: 11, fontWeight: "600", color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
  txSection: {
    paddingVertical: 18,
    marginTop: 8,
  },
  txSectionTitle: {
    fontSize: 15, fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16, marginBottom: 14,
  },
  txGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    rowGap: 14,
  },
  txItem: {
    width: COL_W,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  txIconWrap: {
    width: 50, height: 50, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  txLabel: {
    fontSize: 10, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 14,
  },
});
