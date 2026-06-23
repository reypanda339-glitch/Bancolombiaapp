import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import type { ColorScheme } from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 48, 360);
const YELLOW = "#FDDA24";

function getAccountTypeLabel(type: string) {
  if (type === "savings") return "Ahorros";
  if (type === "checking") return "Corriente";
  if (type === "credit") return "Crédito";
  return type;
}

/** Card balance format: "$ 2.654.112,00" — matches real Mi Bancolombia */
function formatCardBalance(amount: number, currencySymbol: string, currencyCode: string): string {
  const locale = ["USD", "GBP", "CAD"].includes(currencyCode) ? "en-US" : "es-CO";
  try {
    const num = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return `${currencySymbol} ${num}`;
  } catch {
    return `${currencySymbol} ${Math.abs(amount).toFixed(2)}`;
  }
}

type Props = {
  isDark: boolean;
  C: ColorScheme;
};

export function AccountCardCarousel({ isDark, C }: Props) {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setActiveIdx(idx);
  };

  if (accounts.length === 0) {
    return (
      <View style={[styles.wrapper, { backgroundColor: C.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Tus cuentas</Text>
        </View>
        <View style={[styles.card, { width: CARD_W, backgroundColor: C.card, borderColor: C.cardBorder }]}>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Sin cuenta activa</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: C.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Tus cuentas</Text>
        <TouchableOpacity onPress={toggleBalanceVisible} style={[styles.hideBtn, { backgroundColor: isDark ? "#1A1A1C" : "#F5F5F7" }]}>
          <Feather name={balanceVisible ? "eye-off" : "eye"} size={14} color={C.textSecondary} />
          <Text style={[styles.hideText, { color: C.textSecondary }]}>
            {balanceVisible ? "Ocultar saldos" : "Mostrar saldos"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {accounts.map((acc) => {
          const balanceStr = formatCardBalance(acc.balance, acc.currencySymbol, acc.currencyCode);
          const typeLabel = getAccountTypeLabel(acc.type);
          return (
            <View
              key={acc.id}
              style={[
                styles.card,
                {
                  width: CARD_W,
                  backgroundColor: C.card,
                  borderColor: C.cardBorder,
                  shadowColor: isDark ? "#000" : "#000",
                  shadowOpacity: isDark ? 0.4 : 0.06,
                },
              ]}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardAccountName, { color: C.text }]} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.cardAccountType, { color: C.textSecondary }]}>
                    {typeLabel} · {acc.number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.arrowBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F5F5F7" }]}
                  onPress={() =>
                    Alert.alert(
                      acc.name,
                      `Número: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nEstado: Activa`,
                    )
                  }
                >
                  <Feather name="chevron-right" size={16} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Balance */}
              <View style={styles.cardBalanceSection}>
                <Text style={[styles.cardLabel, { color: C.textSecondary }]}>Saldo disponible</Text>
                {balanceVisible ? (
                  <Text
                    style={[styles.cardBalance, { color: C.balanceText }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {balanceStr}
                  </Text>
                ) : (
                  <Text style={[styles.cardBalance, { color: C.balanceText }]}>
                    {acc.currencySymbol} ••••••
                  </Text>
                )}
              </View>

              {/* CTA button */}
              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    "Detalles de cuenta",
                    `Cuenta: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nSaldo: ${balanceStr}`,
                    [{ text: "Cerrar" }],
                  )
                }
              >
                <Text style={styles.ctaBtnText}>Conoce más de tu cuenta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots indicator */}
      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotItem,
                i === activeIdx
                  ? styles.dotActive
                  : [styles.dotInactive, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB" }],
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 4, paddingBottom: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold",
  },
  hideBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  hideText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scrollContent: { paddingHorizontal: 24, gap: 12 },
  card: {
    borderRadius: 20, padding: 20,
    borderWidth: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 18,
  },
  cardAccountName: {
    fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold",
  },
  cardAccountType: {
    fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2,
  },
  arrowBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  cardBalanceSection: { marginBottom: 18 },
  cardLabel: {
    fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6,
  },
  cardBalance: {
    fontSize: 28, fontWeight: "700",
    fontFamily: "Inter_700Bold", letterSpacing: -0.3,
  },
  ctaBtn: {
    backgroundColor: YELLOW, borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  ctaBtnText: {
    fontSize: 14, fontWeight: "700", color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  dots: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 6, marginTop: 14,
  },
  dotItem: { height: 6, borderRadius: 3 },
  dotActive: { width: 20, backgroundColor: YELLOW },
  dotInactive: { width: 6 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
});
