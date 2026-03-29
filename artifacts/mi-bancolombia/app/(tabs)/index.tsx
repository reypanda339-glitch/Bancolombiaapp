import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionItem } from "@/components/TransactionItem";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;

type QuickAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "send", label: "Transferir", route: "/(tabs)/transfers", color: "#3B82F6" },
  { icon: "file-text", label: "Pagar", route: "/(tabs)/payments", color: "#10B981" },
  { icon: "smartphone", label: "Recargar", route: "/(tabs)/payments", color: "#F59E0B" },
  { icon: "credit-card", label: "Productos", route: "/(tabs)/cards", color: "#8B5CF6" },
  { icon: "clock", label: "Movimientos", route: "/(tabs)/movements", color: "#EF4444" },
  { icon: "more-horizontal", label: "Más", route: "/(tabs)/cards", color: "#6B7280" },
];

export default function HomeScreen() {
  const { transactions, balanceVisible, logout, userName } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const recent = transactions.slice(0, 5);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/mi_bancolombia_icon.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.greeting}>Hola, {userName}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={20} color={C.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Feather name="log-out" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <BalanceCard />

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickItem}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + "18" }]}>
                <Feather name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/movements" as any)}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txList}>
          {recent.map((tx, i) => (
            <React.Fragment key={tx.id}>
              <TransactionItem transaction={tx} balanceVisible={balanceVisible} />
              {i < recent.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.bannerWrap}>
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>¡Conoce nuestros CDTs!</Text>
              <Text style={styles.bannerSub}>Rentabilidad hasta 12% E.A.</Text>
              <TouchableOpacity style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Ver más</Text>
              </TouchableOpacity>
            </View>
            <Feather name="trending-up" size={48} color={C.yellow} />
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5F5F7",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
    textTransform: "capitalize",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickItem: {
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  seeAll: {
    fontSize: 14,
    color: C.yellow,
    fontFamily: "Inter_600SemiBold",
  },
  txList: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F7",
    marginLeft: 70,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  banner: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  bannerBtn: {
    backgroundColor: C.yellow,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
});
