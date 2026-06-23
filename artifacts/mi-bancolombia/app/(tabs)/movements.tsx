import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionItem } from "@/components/TransactionItem";
import { useApp } from "@/context/AppContext";
import { formatBalance } from "@/constants/countries";
import { useTheme } from "@/hooks/useTheme";

const FILTERS = ["Todos", "Ingresos", "Egresos", "Transferencias"];

function groupByDate(transactions: ReturnType<typeof useApp>["transactions"]) {
  const groups: Record<string, typeof transactions> = {};
  transactions.forEach((tx) => {
    const key = tx.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return groups;
}

function formatGroupDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

export default function MovementsScreen() {
  const { transactions, balanceVisible, accounts } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");

  const account = accounts.find((a) => a.id === selectedAccount) ?? accounts[0];
  const currencyCode = account?.currencyCode ?? "COP";
  const currencySymbol = account?.currencySymbol ?? "$";

  const filtered = transactions
    .filter((tx) => tx.accountId === selectedAccount)
    .filter((tx) => {
      if (activeFilter === "Todos") return true;
      if (activeFilter === "Ingresos") return tx.type === "credit";
      if (activeFilter === "Egresos") return tx.type === "debit" && tx.category !== "Transferencias";
      if (activeFilter === "Transferencias") return tx.category === "Transferencias";
      return true;
    });

  const totalCredits = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const creditStr = formatBalance(totalCredits, currencyCode, currencySymbol, true);
  const debitStr = formatBalance(totalDebits, currencyCode, currencySymbol, true);

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.title, { color: C.text }]}>Movimientos</Text>
        <TouchableOpacity
          style={[styles.filterIconBtn, { backgroundColor: isDark ? "#1A1A1C" : "#F5F5F7" }]}
          onPress={() => Alert.alert("Filtrar", "Selecciona un rango de fechas o categoría.")}
        >
          <Feather name="sliders" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Account selector */}
      {accounts.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll} contentContainerStyle={styles.accountScrollContent}>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.accountChip,
                { backgroundColor: C.surface, borderColor: "transparent" },
                selectedAccount === acc.id && { borderColor: "#FDDA24", backgroundColor: C.chipActive },
              ]}
              onPress={() => setSelectedAccount(acc.id)}
            >
              <Text style={[styles.accountChipText, { color: C.textSecondary }, selectedAccount === acc.id && { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                {acc.name}
              </Text>
              <Text style={[styles.accountChipNum, { color: C.text }]}>
                {acc.number} · {acc.currencyCode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Summary row */}
      <View style={[styles.summaryRow, { backgroundColor: C.surface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>↑ Ingresos</Text>
          <Text style={[styles.summaryValue, styles.summaryCredit]} numberOfLines={1} adjustsFontSizeToFit>
            {balanceVisible ? `+${creditStr}` : "•••••"}
          </Text>
        </View>
        <View style={[styles.summarySep, { backgroundColor: C.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>↓ Egresos</Text>
          <Text style={[styles.summaryValue, styles.summaryDebit]} numberOfLines={1} adjustsFontSizeToFit>
            {balanceVisible ? `-${debitStr}` : "•••••"}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              { backgroundColor: C.surface, borderColor: C.border },
              activeFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: C.textSecondary }, activeFilter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions list */}
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={C.textLight} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>Sin movimientos</Text>
            <Text style={[styles.emptySubText, { color: C.textLight }]}>
              Aquí aparecerán tus transacciones cuando las realices.
            </Text>
          </View>
        ) : (
          sortedDates.map((date) => (
            <View key={date}>
              <View style={styles.dateHeader}>
                <Text style={[styles.dateHeaderText, { color: C.textSecondary }]}>{formatGroupDate(date)}</Text>
              </View>
              <View style={[styles.txGroup, { backgroundColor: C.surface }]}>
                {grouped[date].map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    <TransactionItem
                      transaction={tx}
                      balanceVisible={balanceVisible}
                      currencyCode={currencyCode}
                      currencySymbol={currencySymbol}
                      isDark={isDark}
                      C={C}
                    />
                    {i < grouped[date].length - 1 && <View style={[styles.divider, { backgroundColor: C.divider, marginLeft: 70 }]} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  filterIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  accountScroll: { maxHeight: 72 },
  accountScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  accountChip: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, minWidth: 130,
  },
  accountChipText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  accountChipNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  summaryRow: {
    flexDirection: "row", marginHorizontal: 16, borderRadius: 14,
    paddingVertical: 14, marginTop: 12, marginBottom: 4,
  },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  summarySep: { width: 1 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryCredit: { color: "#10B981" },
  summaryDebit: { color: "#EF4444" },
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  filterChipActive: { backgroundColor: "#1C1C1E", borderColor: "#1C1C1E" },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filterChipTextActive: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  dateHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  dateHeaderText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize", letterSpacing: 0.3 },
  txGroup: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden", marginBottom: 4 },
  divider: { height: 1 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
});
