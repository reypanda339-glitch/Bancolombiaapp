import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Transaction, RegisteredUser } from "@/context/AppContext";

const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";

type TxWithUser = Transaction & { userName: string };

const CATEGORIES = ["Todas", "Compras", "Ingresos", "Entretenimiento", "Transferencias", "Servicios", "Alimentación", "Transporte"];

export default function MovimientosScreen() {
  const { getAllTransactions, getAllUsers } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [transactions, setTransactions] = useState<TxWithUser[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [filterCat, setFilterCat] = useState("Todas");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [txs, u] = await Promise.all([getAllTransactions(), getAllUsers()]);
    const regular = u.filter((x) => !x.isAdmin);
    setUsers(regular);
    const withUser: TxWithUser[] = txs.map((tx) => {
      const owner = regular.find((usr) => usr.id === tx.userId);
      return { ...tx, userName: owner ? `${owner.firstName} ${owner.lastName}` : "Usuario" };
    });
    setTransactions(withUser);
    setLoading(false);
  }, [getAllTransactions, getAllUsers]);

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch =
      tx.description.toLowerCase().includes(q) ||
      tx.userName.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q);
    const matchType = filterType === "all" || tx.type === filterType;
    const matchCat = filterCat === "Todas" || tx.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  const totalCredit = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Movimientos</Text>
        <Text style={styles.sub}>{filtered.length} de {transactions.length} movimientos</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Feather name="arrow-down-circle" size={14} color={GREEN} />
          <Text style={styles.summaryLabel}>Entradas</Text>
          <Text style={[styles.summaryValue, { color: GREEN }]}>{fmt(totalCredit)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Feather name="arrow-up-circle" size={14} color={RED} />
          <Text style={styles.summaryLabel}>Salidas</Text>
          <Text style={[styles.summaryValue, { color: RED }]}>{fmt(totalDebit)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Feather name="trending-up" size={14} color={YELLOW} />
          <Text style={styles.summaryLabel}>Neto</Text>
          <Text style={[styles.summaryValue, { color: YELLOW }]}>{fmt(totalCredit - totalDebit)}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar descripción, usuario..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {(["all", "credit", "debit"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filterType === f && styles.filterBtnActive]}
            onPress={() => setFilterType(f)}
          >
            <Text style={[styles.filterText, filterType === f && styles.filterTextActive]}>
              {f === "all" ? "Todos" : f === "credit" ? "Entradas" : "Salidas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catBtn, filterCat === c && styles.catBtnActive]}
            onPress={() => setFilterCat(c)}
          >
            <Text style={[styles.catText, filterCat === c && styles.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando movimientos...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin movimientos</Text>
        ) : (
          filtered.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txCard}
              onPress={() => setExpanded(expanded === tx.id ? null : tx.id)}
            >
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === "credit" ? GREEN + "22" : RED + "22" }]}>
                  <Feather
                    name={tx.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                    size={16}
                    color={tx.type === "credit" ? GREEN : RED}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txMeta}>{tx.date} · {tx.category}</Text>
                  <Text style={styles.txUser}>
                    <Feather name="user" size={10} color={TEXTSEC} /> {tx.userName}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.txAmt, { color: tx.type === "credit" ? GREEN : RED }]}>
                    {tx.type === "credit" ? "+" : "-"}{fmt(Math.abs(tx.amount))}
                  </Text>
                  <View style={[styles.txStatus, { backgroundColor: tx.status === "completed" ? GREEN + "22" : ORANGE + "22" }]}>
                    <Text style={[styles.txStatusText, { color: tx.status === "completed" ? GREEN : ORANGE }]}>
                      {tx.status === "completed" ? "Completado" : "Pendiente"}
                    </Text>
                  </View>
                </View>
              </View>

              {expanded === tx.id && (
                <View style={styles.txDetail}>
                  <TxRow label="ID" value={tx.id} />
                  <TxRow label="Cuenta" value={tx.accountId} />
                  <TxRow label="Usuario" value={tx.userName} />
                  <TxRow label="Tipo" value={tx.type === "credit" ? "Crédito (Entrada)" : "Débito (Salida)"} />
                  <TxRow label="Categoría" value={tx.category} />
                  <TxRow label="Estado" value={tx.status === "completed" ? "Completado" : "Pendiente"} />
                  <TxRow label="Monto" value={fmt(Math.abs(tx.amount))} />
                  <TxRow label="Fecha" value={tx.date} />
                  {tx.userId && <TxRow label="ID Usuario" value={tx.userId} />}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function TxRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  summary: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC },
  summaryValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  summaryDivider: { width: 1, height: 36, backgroundColor: BORDER },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 8,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: "center" },
  filterBtnActive: { backgroundColor: YELLOW + "22", borderColor: YELLOW + "60" },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC },
  filterTextActive: { color: YELLOW },
  catScroll: { marginBottom: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  catBtnActive: { backgroundColor: YELLOW + "22", borderColor: YELLOW + "60" },
  catText: { fontSize: 11, fontFamily: "Inter_500Medium", color: TEXTSEC },
  catTextActive: { color: YELLOW },
  txCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  txRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 1 },
  txUser: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 1 },
  txAmt: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txStatus: { marginTop: 4, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  txStatusText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  txDetail: { marginTop: 12, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  detailValue: { fontSize: 11, fontFamily: "Inter_500Medium", color: TEXT },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
});
