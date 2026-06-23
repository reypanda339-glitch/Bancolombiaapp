import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Account, Transaction } from "@/context/AppContext";
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
  Ahorro: "target",
  Salud: "heart",
  Educación: "book",
  Otros: "circle",
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
  Ahorro: "#10B981",
  Salud: "#EF4444",
  Educación: "#3B82F6",
  Otros: "#6B7280",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Procesado",
  pending: "Pendiente",
  failed: "Fallido",
  reversed: "Revertido",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#10B981",
  pending: "#F59E0B",
  failed: "#EF4444",
  reversed: "#6B7280",
};

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function Row({
  label, value, mono, color, C,
}: {
  label: string; value: string; mono?: boolean; color?: string; C: ColorScheme;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: color ?? C.text, fontFamily: mono ? "monospace" : "Inter_500Medium" }]} numberOfLines={2} selectable>
        {value}
      </Text>
    </View>
  );
}

type Props = {
  transaction: Transaction | null;
  account?: Account;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  C: ColorScheme;
  balanceVisible: boolean;
};

export function TransactionReceiptModal({
  transaction,
  account,
  visible,
  onClose,
  isDark,
  C,
  balanceVisible,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const isCredit = transaction.type === "credit";
  const icon = CATEGORY_ICONS[transaction.category] ?? "circle";
  const iconColor = CATEGORY_COLORS[transaction.category] ?? "#6B7280";
  const amountStr = formatBalance(
    Math.abs(transaction.amount),
    account?.currencyCode ?? "COP",
    account?.currencySymbol ?? "$",
    true
  );
  const statusColor = STATUS_COLOR[transaction.status ?? "completed"] ?? "#10B981";
  const refId = transaction.id?.replace(/^tx_/, "").toUpperCase().slice(0, 12) ?? "N/A";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      title: "Comprobante de movimiento",
      message:
        `Comprobante de ${isCredit ? "ingreso" : "egreso"}\n` +
        `Descripción: ${transaction.description}\n` +
        `Monto: ${isCredit ? "+" : "-"}${amountStr}\n` +
        `Fecha: ${formatFullDate(transaction.date)}\n` +
        `Categoría: ${transaction.category}\n` +
        `Estado: ${STATUS_LABEL[transaction.status ?? "completed"] ?? "Procesado"}\n` +
        `Referencia: ${refId}`,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: C.background }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB" }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Comprobante</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Feather name="share-2" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Amount hero */}
          <View style={[styles.amountHero, { backgroundColor: C.surface }]}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}>
              <Feather name={icon} size={26} color={iconColor} />
            </View>
            <Text style={[styles.amountLabel, { color: C.textSecondary }]}>
              {isCredit ? "Ingreso recibido" : "Pago realizado"}
            </Text>
            <Text style={[styles.amountValue, { color: isCredit ? "#10B981" : C.text }]}>
              {balanceVisible
                ? `${isCredit ? "+" : "-"}${amountStr}`
                : `•••••`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABEL[transaction.status ?? "completed"] ?? "Procesado"}
              </Text>
            </View>
          </View>

          {/* Divider + perforations */}
          <View style={[styles.perforationRow, { backgroundColor: C.background }]}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: C.border }]} />
            ))}
          </View>

          {/* Details card */}
          <View style={[styles.detailCard, { backgroundColor: C.surface, marginHorizontal: 16 }]}>
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>DETALLES DE LA TRANSACCIÓN</Text>

            <Row label="Descripción" value={transaction.description} C={C} />
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <Row label="Categoría" value={transaction.category} C={C} />
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <Row label="Fecha" value={formatFullDate(transaction.date)} C={C} />
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <Row label="Tipo" value={isCredit ? "Crédito (ingreso)" : "Débito (egreso)"} C={C} />
            {account && (
              <>
                <View style={[styles.divider, { backgroundColor: C.border }]} />
                <Row label="Cuenta" value={`${account.name} · ${account.number}`} C={C} />
                <View style={[styles.divider, { backgroundColor: C.border }]} />
                <Row label="Moneda" value={`${account.currencyCode} (${account.currencySymbol})`} C={C} />
              </>
            )}
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <Row
              label="Estado"
              value={STATUS_LABEL[transaction.status ?? "completed"] ?? "Procesado"}
              color={statusColor}
              C={C}
            />
          </View>

          {/* Reference */}
          <View style={[styles.refCard, { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F7", marginHorizontal: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.refLabel, { color: C.textSecondary }]}>N° de referencia</Text>
              <Text style={[styles.refValue, { color: C.text }]} selectable>{refId}</Text>
            </View>
            <TouchableOpacity onPress={handleCopy} style={[styles.copyBtn, { backgroundColor: copied ? "#10B98120" : C.surface }]}>
              <Feather name={copied ? "check" : "copy"} size={15} color={copied ? "#10B981" : C.textSecondary} />
              <Text style={{ fontSize: 11, color: copied ? "#10B981" : C.textSecondary, fontFamily: "Inter_500Medium", marginLeft: 4 }}>
                {copied ? "Copiado" : "Copiar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <Text style={[styles.disclaimer, { color: C.textLight }]}>
            Este comprobante es válido como constancia del movimiento en tu cuenta Bancolombia. Para mayor información comunícate con soporte.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 2 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  shareBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },

  amountHero: {
    alignItems: "center", paddingVertical: 28, paddingHorizontal: 20,
    marginTop: 0,
  },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  amountLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
  amountValue: { fontSize: 36, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  perforationRow: {
    flexDirection: "row", justifyContent: "space-around",
    alignItems: "center", height: 20, marginHorizontal: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },

  detailCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, gap: 16 },
  rowLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  rowValue: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1.6, textAlign: "right" },
  divider: { height: 1 },

  refCard: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 14, marginBottom: 16, gap: 12,
  },
  refLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 3 },
  refValue: { fontSize: 15, fontFamily: "monospace", letterSpacing: 1.5 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 10,
  },
  disclaimer: {
    fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center",
    marginHorizontal: 24, lineHeight: 16,
  },
});
