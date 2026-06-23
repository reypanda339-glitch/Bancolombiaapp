import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { RegisteredUser, Transaction } from "@/context/AppContext";

const NAVY = "#0A0E27";
const YELLOW = "#FDDA24";
const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";

export default function AdminDashboard() {
  const { logout, getAllUsers, getAllTransactions, getAllAccounts, getLoginEvents, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalLogins, setTotalLogins] = useState(0);
  const [failedLogins, setFailedLogins] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [u, t, a, ev] = await Promise.all([getAllUsers(), getAllTransactions(), getAllAccounts(), getLoginEvents()]);
    const regularUsers = u.filter((x) => !x.isAdmin);
    setUsers(regularUsers);
    setTransactions(t);
    const bal = a.reduce((sum, ac) => sum + (ac.balance || 0), 0);
    setTotalBalance(bal);
    const successEv = ev.filter((e) => e.success && !e.deviceInfo.startsWith("LOGOUT"));
    const failEv = ev.filter((e) => !e.success);
    setTotalLogins(successEv.length);
    setFailedLogins(failEv.length);
    setLoading(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayTx = transactions.filter((t) => t.date === today);
  const credits = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const debits = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const suspended = users.filter((u) => u.status === "suspended").length;
  const blocked = users.filter((u) => u.status === "blocked").length;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            source={require("../../assets/images/pwa-icon.png")}
            style={{ width: 36, height: 36, borderRadius: 10 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerLabel}>PANEL ADMINISTRATIVO</Text>
            <Text style={styles.headerTitle}>Bancolombia Admin</Text>
            <Text style={styles.headerSub}>
              {currentUser?.firstName} {currentUser?.lastName}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Feather name="log-out" size={20} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statsGrid}>
          <StatCard icon="users" label="Usuarios" value={String(users.length)} color={BLUE} />
          <StatCard icon="alert-circle" label="Suspendidos/Bloq." value={String(suspended + blocked)} color={RED} />
          <StatCard icon="activity" label="Movimientos" value={String(transactions.length)} color={GREEN} />
          <StatCard icon="clock" label="Hoy" value={String(todayTx.length)} color={YELLOW} />
          <StatCard icon="log-in" label="Sesiones exitosas" value={String(totalLogins)} color={GREEN} />
          <StatCard icon="alert-triangle" label="Intentos fallidos" value={String(failedLogins)} color={RED} />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO TOTAL DEL SISTEMA</Text>
          <Text style={styles.balanceValue}>{fmt(totalBalance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Feather name="arrow-down-circle" size={14} color={GREEN} />
              <Text style={[styles.balanceItemLabel, { color: GREEN }]}>Entradas</Text>
              <Text style={styles.balanceItemValue}>{fmt(credits)}</Text>
            </View>
            <View style={[styles.balanceDivider]} />
            <View style={styles.balanceItem}>
              <Feather name="arrow-up-circle" size={14} color={RED} />
              <Text style={[styles.balanceItemLabel, { color: RED }]}>Salidas</Text>
              <Text style={styles.balanceItemValue}>{fmt(debits)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        {loading ? (
          <Text style={styles.empty}>Cargando...</Text>
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>Sin movimientos registrados</Text>
        ) : (
          transactions.slice(0, 8).map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txDot, { backgroundColor: tx.type === "credit" ? GREEN : RED }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.date} · {tx.category}</Text>
              </View>
              <Text style={[styles.txAmt, { color: tx.type === "credit" ? GREEN : RED }]}>
                {tx.type === "credit" ? "+" : "-"}{fmt(Math.abs(tx.amount))}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          <QuickBtn icon="users" label="Gestionar usuarios" onPress={() => router.push("/admin/usuarios" as any)} />
          <QuickBtn icon="credit-card" label="Ver cuentas" onPress={() => router.push("/admin/cuentas" as any)} />
          <QuickBtn icon="activity" label="Movimientos" onPress={() => router.push("/admin/movimientos" as any)} />
          <QuickBtn icon="shield" label="Auditoría" onPress={() => router.push("/admin/auditoria" as any)} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "40" }]}>
      <Feather name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Feather name={icon} size={20} color={YELLOW} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: YELLOW, letterSpacing: 1.5 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT, marginTop: 2 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC },
  logoutBtn: { padding: 10, backgroundColor: "rgba(253,218,36,0.1)", borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  scroll: { padding: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: TEXT },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  balanceCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: YELLOW, letterSpacing: 1.2, marginBottom: 6 },
  balanceValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: TEXT, marginBottom: 16 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceItem: { flex: 1, alignItems: "center", gap: 4 },
  balanceItemLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  balanceItemValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT },
  balanceDivider: { width: 1, height: 40, backgroundColor: BORDER },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXTSEC, letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txDesc: { fontSize: 13, fontFamily: "Inter_500Medium", color: TEXT },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 1 },
  txAmt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 20 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: { width: 44, height: 44, backgroundColor: "rgba(253,218,36,0.12)", borderRadius: 22, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXT, textAlign: "center" },
});
