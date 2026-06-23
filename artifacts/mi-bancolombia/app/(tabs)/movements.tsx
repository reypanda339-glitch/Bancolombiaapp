import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionItem } from "@/components/TransactionItem";
import { TransactionReceiptModal } from "@/components/TransactionReceiptModal";
import { useApp } from "@/context/AppContext";
import type { Transaction } from "@/context/AppContext";
import { formatBalance } from "@/constants/countries";
import { useTheme } from "@/hooks/useTheme";

const FILTERS = ["Todos", "Ingresos", "Egresos", "Transferencias"];
const CATEGORIES = ["Todas", "Alimentación", "Transporte", "Entretenimiento", "Salud", "Educación", "Servicios", "Ahorro", "Bolsillos", "Otros"];
const DATE_RANGES = ["Todos", "Hoy", "Esta semana", "Este mes", "Últimos 3 meses"];

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

function isInDateRange(dateStr: string, range: string): boolean {
  if (range === "Todos") return true;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "Hoy") return d >= today;
  if (range === "Esta semana") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    return d >= weekStart;
  }
  if (range === "Este mes") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= monthStart;
  }
  if (range === "Últimos 3 meses") {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return d >= threeMonthsAgo;
  }
  return true;
}

export default function MovementsScreen() {
  const { transactions, balanceVisible, accounts } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterDateRange, setFilterDateRange] = useState("Todos");
  const [pendingCategory, setPendingCategory] = useState("Todas");
  const [pendingDateRange, setPendingDateRange] = useState("Todos");

  const account = accounts.find((a) => a.id === selectedAccount) ?? accounts[0];
  const currencyCode = account?.currencyCode ?? "COP";
  const currencySymbol = account?.currencySymbol ?? "$";

  const hasActiveFilter = filterCategory !== "Todas" || filterDateRange !== "Todos";

  const filtered = transactions
    .filter((tx) => tx.accountId === selectedAccount)
    .filter((tx) => {
      if (activeFilter === "Todos") return true;
      if (activeFilter === "Ingresos") return tx.type === "credit";
      if (activeFilter === "Egresos") return tx.type === "debit" && tx.category !== "Transferencias";
      if (activeFilter === "Transferencias") return tx.category === "Transferencias";
      return true;
    })
    .filter((tx) => filterCategory === "Todas" || tx.category === filterCategory)
    .filter((tx) => isInDateRange(tx.date, filterDateRange));

  const totalCredits = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const creditStr = formatBalance(totalCredits, currencyCode, currencySymbol, true);
  const debitStr = formatBalance(totalDebits, currencyCode, currencySymbol, true);

  const openFilter = () => {
    setPendingCategory(filterCategory);
    setPendingDateRange(filterDateRange);
    setShowFilterModal(true);
  };

  const applyFilter = () => {
    setFilterCategory(pendingCategory);
    setFilterDateRange(pendingDateRange);
    setShowFilterModal(false);
  };

  const clearFilter = () => {
    setPendingCategory("Todas");
    setPendingDateRange("Todos");
    setFilterCategory("Todas");
    setFilterDateRange("Todos");
    setShowFilterModal(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image source={require("../../assets/images/pwa-icon.png")} style={{ width: 26, height: 26, borderRadius: 7 }} resizeMode="contain" />
          <Text style={[styles.title, { color: C.text }]}>Movimientos</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterIconBtn, { backgroundColor: hasActiveFilter ? "#FDDA24" : (isDark ? "#1A1A1C" : "#F5F5F7") }]}
          onPress={openFilter}
        >
          <Feather name="sliders" size={20} color={hasActiveFilter ? "#1C1C1E" : C.text} />
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
            {balanceVisible ? `+${creditStr}` : `${currencySymbol} •••• ${currencyCode}`}
          </Text>
        </View>
        <View style={[styles.summarySep, { backgroundColor: C.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>↓ Egresos</Text>
          <Text style={[styles.summaryValue, styles.summaryDebit]} numberOfLines={1} adjustsFontSizeToFit>
            {balanceVisible ? `-${debitStr}` : `${currencySymbol} •••• ${currencyCode}`}
          </Text>
        </View>
      </View>

      {/* Active filter badge */}
      {hasActiveFilter && (
        <View style={[styles.activeBadgeRow]}>
          {filterDateRange !== "Todos" && (
            <View style={[styles.activeBadge, { backgroundColor: "#FDDA2422" }]}>
              <Text style={[styles.activeBadgeText, { color: "#FDDA24" }]}>{filterDateRange}</Text>
              <TouchableOpacity onPress={() => setFilterDateRange("Todos")}>
                <Feather name="x" size={12} color="#FDDA24" />
              </TouchableOpacity>
            </View>
          )}
          {filterCategory !== "Todas" && (
            <View style={[styles.activeBadge, { backgroundColor: "#3B82F622" }]}>
              <Text style={[styles.activeBadgeText, { color: "#3B82F6" }]}>{filterCategory}</Text>
              <TouchableOpacity onPress={() => setFilterCategory("Todas")}>
                <Feather name="x" size={12} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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
              {hasActiveFilter ? "Prueba con otros filtros" : "Aquí aparecerán tus transacciones cuando las realices."}
            </Text>
            {hasActiveFilter && (
              <TouchableOpacity style={[styles.clearFilterBtn, { backgroundColor: C.surface }]} onPress={clearFilter}>
                <Text style={[styles.clearFilterText, { color: C.text }]}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
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
                      onPress={() => setSelectedTx(tx)}
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

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={selectedTx !== null}
        transaction={selectedTx}
        account={account}
        onClose={() => setSelectedTx(null)}
        isDark={isDark}
        C={C}
        balanceVisible={balanceVisible}
      />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.sheetContainer, { backgroundColor: C.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.sheetClose}>
              <Feather name="x" size={22} color={C.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: C.text }]}>Filtrar movimientos</Text>
            <TouchableOpacity onPress={clearFilter} style={styles.sheetClose}>
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: "#EF4444" }}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.filterSectionLabel, { color: C.textSecondary }]}>PERÍODO</Text>
            <View style={[styles.filterOptionsCard, { backgroundColor: C.surface }]}>
              {DATE_RANGES.map((r, i) => (
                <View key={r}>
                  <TouchableOpacity
                    style={styles.filterOptionRow}
                    onPress={() => setPendingDateRange(r)}
                  >
                    <Text style={[styles.filterOptionText, { color: C.text }]}>{r}</Text>
                    <View style={[styles.filterRadio, { borderColor: pendingDateRange === r ? "#FDDA24" : C.border }]}>
                      {pendingDateRange === r && <View style={styles.filterRadioFill} />}
                    </View>
                  </TouchableOpacity>
                  {i < DATE_RANGES.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
                </View>
              ))}
            </View>

            <Text style={[styles.filterSectionLabel, { color: C.textSecondary, marginTop: 20 }]}>CATEGORÍA</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: C.surface, borderColor: C.border },
                    pendingCategory === cat && { backgroundColor: "#FDDA2422", borderColor: "#FDDA24" },
                  ]}
                  onPress={() => setPendingCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: C.textSecondary },
                    pendingCategory === cat && { color: "#FDDA24", fontFamily: "Inter_600SemiBold" },
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.applyBtn]} onPress={applyFilter}>
              <Text style={styles.applyBtnText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  activeBadgeRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 6, gap: 8, flexWrap: "wrap" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
  clearFilterBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  clearFilterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Filter Modal */
  sheetContainer: { flex: 1 },
  sheetHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: 1 },
  sheetClose: { width: 60, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  sheetTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  filterSectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  filterOptionsCard: { borderRadius: 14, overflow: "hidden", marginBottom: 4 },
  filterOptionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  filterOptionText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  filterRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  filterRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FDDA24" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  applyBtn: { backgroundColor: "#FDDA24", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 28 },
  applyBtnText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
