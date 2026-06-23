import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Transaction } from "@/context/AppContext";
import { formatBalance } from "@/constants/countries";

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Compras: "shopping-bag",
  Ingresos: "trending-up",
  Entretenimiento: "tv",
  Transferencias: "send",
  Servicios: "zap",
  Alimentación: "coffee",
  Transporte: "truck",
};

const CATEGORY_COLORS: Record<string, string> = {
  Compras: "#8B5CF6",
  Ingresos: "#10B981",
  Entretenimiento: "#EF4444",
  Transferencias: "#3B82F6",
  Servicios: "#F59E0B",
  Alimentación: "#F97316",
  Transporte: "#6B7280",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

type Props = {
  transaction: Transaction;
  balanceVisible: boolean;
  currencyCode?: string;
  currencySymbol?: string;
};

export function TransactionItem({
  transaction,
  balanceVisible,
  currencyCode = "COP",
  currencySymbol = "$",
}: Props) {
  const icon = CATEGORY_ICONS[transaction.category] ?? "circle";
  const iconColor = CATEGORY_COLORS[transaction.category] ?? "#6B7280";
  const isCredit = transaction.type === "credit";

  const amountStr = formatBalance(transaction.amount, currencyCode, currencySymbol, true);

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.category} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.amount, isCredit ? styles.credit : styles.debit]}>
        {balanceVisible
          ? `${isCredit ? "+" : "-"}${amountStr}`
          : "•••••"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  desc: {
    fontSize: 14,
    color: "#1C1C1E",
    fontFamily: "Inter_500Medium",
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  amount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flexShrink: 0,
    maxWidth: 130,
  },
  credit: { color: "#10B981" },
  debit: { color: "#1C1C1E" },
});
