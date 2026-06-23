import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Transaction } from "@/context/AppContext";
import type { ColorScheme } from "@/constants/colors";
import { formatBalance } from "@/constants/countries";

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Compras: "shopping-bag",
  Ingresos: "trending-up",
  Nómina: "trending-up",
  Entretenimiento: "tv",
  Transferencias: "send",
  Servicios: "zap",
  Alimentación: "coffee",
  Transporte: "truck",
  Recargas: "smartphone",
};

const CATEGORY_COLORS: Record<string, string> = {
  Compras: "#8B5CF6",
  Ingresos: "#10B981",
  Nómina: "#10B981",
  Entretenimiento: "#EF4444",
  Transferencias: "#3B82F6",
  Servicios: "#F59E0B",
  Alimentación: "#F97316",
  Transporte: "#6B7280",
  Recargas: "#06B6D4",
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
  isDark?: boolean;
  C?: ColorScheme;
  onPress?: () => void;
};

export function TransactionItem({
  transaction,
  balanceVisible,
  currencyCode = "COP",
  currencySymbol = "$",
  isDark = false,
  C,
  onPress,
}: Props) {
  const icon = CATEGORY_ICONS[transaction.category] ?? "circle";
  const iconColor = CATEGORY_COLORS[transaction.category] ?? "#6B7280";
  const isCredit = transaction.type === "credit";
  const amountStr = formatBalance(transaction.amount, currencyCode, currencySymbol, true);
  const textColor = C?.text ?? "#1C1C1E";
  const subColor = C?.textSecondary ?? "#6B7280";
  const debitColor = isDark ? "rgba(255,255,255,0.75)" : "#1C1C1E";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "22" }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.desc, { color: textColor }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={[styles.meta, { color: subColor }]}>
          {transaction.category} · {formatDate(transaction.date)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text
          style={[
            styles.amount,
            isCredit ? styles.credit : { color: debitColor },
          ]}
        >
          {balanceVisible
            ? `${isCredit ? "+" : "-"}${amountStr}`
            : "•••••"}
        </Text>
        {onPress && <Feather name="chevron-right" size={14} color={subColor} />}
      </View>
    </TouchableOpacity>
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
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  desc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  amount: {
    fontSize: 13, fontFamily: "Inter_600SemiBold",
    textAlign: "right", flexShrink: 0, maxWidth: 130,
  },
  credit: { color: "#10B981" },
});
