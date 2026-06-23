import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatBalance, maskedBalance } from "@/constants/countries";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const CARD_W = Math.min(SCREEN_W - 40, 340);

function accountTypeLabel(type: string) {
  if (type === "savings") return "Ahorros";
  if (type === "checking") return "Corriente";
  if (type === "credit") return "Crédito";
  return type;
}

/* ─── Color Arc (pointerEvents in style, not prop) ─── */
function ColorArc() {
  const w = SCREEN_W;
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { top: 60, height: 110, overflow: "hidden" },
        { pointerEvents: "none" } as any,
      ]}
    >
      <Svg width={w} height={110} viewBox={`0 0 ${w} 110`} fill="none">
        <Path d={`M-10,90 Q15,78 28,104`} stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
        <Path d={`M-14,97 Q10,86 22,110`} stroke="#905cf5" strokeWidth="3.5" strokeLinecap="round" />
        <Path d={`M${w * 0.82},30 Q${w * 0.9},40 ${w + 2},72`} stroke="#905cf5" strokeWidth="4" strokeLinecap="round" />
        <Path d={`M${w * 0.42},52 A110 110 0 0 1 ${w * 0.63},32`} stroke="#00EA90" strokeWidth="5" strokeLinecap="round" />
        <Path d={`M${w * 0.62},32 A110 110 0 0 1 ${w * 0.79},42`} stroke="#FED201" strokeWidth="9" strokeLinecap="round" />
        <Path d={`M${w * 0.78},40 A95 95 0 0 1 ${w + 4},90`} stroke="#FF7A1A" strokeWidth="11" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/* ─── Clave Dinámica ─── */
function ClaveTimer({ onPress }: { onPress: () => void }) {
  const [countdown, setCountdown] = useState(28);
  const [code, setCode] = useState(() => {
    const n = Math.floor(100000 + Math.random() * 899999).toString();
    return `${n.slice(0, 3)} ${n.slice(3)}`;
  });
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          const n = Math.floor(100000 + Math.random() * 899999).toString();
          setCode(`${n.slice(0, 3)} ${n.slice(3)}`);
          return 30;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const R = 13;
  const C = 2 * Math.PI * R;
  const off = C * (1 - countdown / 30);
  return (
    <TouchableOpacity style={styles.clavePill} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.claveCircle}>
        <Svg width={32} height={32} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={16} cy={16} r={R} stroke="#2A2A2A" strokeWidth={2.5} fill="transparent" />
          <Circle cx={16} cy={16} r={R} stroke={YELLOW} strokeWidth={2.5} fill="transparent"
            strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round" />
        </Svg>
        <View style={styles.lockIcon}><Feather name="lock" size={10} color="#FFF" /></View>
      </View>
      <View>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{code}</Text>
      </View>
      <Feather name="chevron-right" size={14} color="#555" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

/* ─── Bottom Sheet Modal ─── */
function BottomSheet({
  visible, onClose, title, children,
}: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );
}

/* ─── Logout Confirm Modal ─── */
function LogoutModal({
  visible, onClose, onConfirm,
}: {
  visible: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.logoutOverlay}>
        <View style={styles.logoutBox}>
          <View style={styles.logoutIcon}>
            <Feather name="log-out" size={28} color="#EF4444" />
          </View>
          <Text style={styles.logoutTitle}>Cerrar sesión</Text>
          <Text style={styles.logoutSub}>
            ¿Seguro que deseas salir de{"\n"}Mi Bancolombia?
          </Text>
          <TouchableOpacity style={styles.logoutConfirmBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.logoutConfirmText}>Sí, cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutCancelBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.logoutCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Notification Modal ─── */
function NotificationsModal({ visible, onClose, C, isDark }: {
  visible: boolean; onClose: () => void; C: any; isDark: boolean;
}) {
  const notifs = [
    { icon: "check-circle", color: "#10B981", title: "Transacción exitosa", sub: "Pago realizado a Claro por $35.000", time: "Hace 2h" },
    { icon: "info", color: "#3B82F6", title: "Nuevo extracto", sub: "Tu extracto de junio está disponible", time: "Ayer" },
    { icon: "alert-circle", color: "#F59E0B", title: "Consejo de seguridad", sub: "Nunca compartas tu Clave Dinámica", time: "Hace 3 días" },
  ];
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Notificaciones">
      <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
        {notifs.map((n, i) => (
          <TouchableOpacity key={i} onPress={onClose}
            style={[styles.notifRow, { borderBottomColor: isDark ? "#2A2A2E" : "#F0F0F3" }]}>
            <View style={[styles.notifIconWrap, { backgroundColor: n.color + "22" }]}>
              <Feather name={n.icon as any} size={18} color={n.color} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.notifTitle, { color: C.text }]} numberOfLines={1}>{n.title}</Text>
              <Text style={[styles.notifSub, { color: C.textSecondary }]} numberOfLines={2}>{n.sub}</Text>
            </View>
            <Text style={[styles.notifTime, { color: C.textSecondary }]}>{n.time}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.seeAllBtn} onPress={onClose}>
          <Text style={styles.seeAllText}>Ver todas las notificaciones</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

/* ─── Clave Dinámica Modal ─── */
function ClaveModal({ visible, onClose, C, code }: {
  visible: boolean; onClose: () => void; C: any; code: string;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Clave Dinámica">
      <View style={{ padding: 20, alignItems: "center" }}>
        <View style={[styles.claveModalBox, { backgroundColor: "#212123" }]}>
          <Feather name="lock" size={32} color={YELLOW} />
          <Text style={styles.claveModalCode}>{code}</Text>
          <Text style={styles.claveModalNote}>Cambia cada 30 segundos</Text>
        </View>
        <Text style={[styles.claveModalInfo, { color: C.textSecondary }]}>
          Usa este código para confirmar tus operaciones. Nunca lo compartas con nadie, ni siquiera con asesores de Bancolombia.
        </Text>
        <TouchableOpacity style={[styles.claveModalBtn, { backgroundColor: YELLOW }]} onPress={onClose}>
          <Text style={{ fontWeight: "700", color: "#1C1C1E" }}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

/* ─── Help Modal ─── */
function HelpModal({ visible, onClose, C }: { visible: boolean; onClose: () => void; C: any }) {
  const { supportPhone } = useApp();
  const options = [
    { icon: "phone", label: "Línea de atención", sub: "01 8000 912345 · Gratis desde Colombia", action: () => Linking.openURL("tel:018000912345").catch(() => {}) },
    { icon: "message-circle", label: "WhatsApp", sub: `Escríbenos al +${supportPhone}`, action: () => Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20necesito%20ayuda`).catch(() => {}) },
    { icon: "globe", label: "Bancolombia.com", sub: "Visita nuestro portal web", action: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
    { icon: "map-pin", label: "Sucursales y cajeros", sub: "Encuentra el punto más cercano", action: () => Linking.openURL("https://www.bancolombia.com/personas/sucursales-cajeros").catch(() => {}) },
  ];
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Centro de ayuda">
      <View style={{ paddingBottom: 24 }}>
        {options.map((o, i) => (
          <TouchableOpacity key={i} style={styles.helpRow}
            onPress={() => { onClose(); setTimeout(o.action, 300); }}>
            <View style={[styles.helpIconWrap, { backgroundColor: "#3B82F622" }]}>
              <Feather name={o.icon as any} size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.helpLabel, { color: C.text }]}>{o.label}</Text>
              <Text style={[styles.helpSub, { color: C.textSecondary }]} numberOfLines={1}>{o.sub}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

/* ─── Account Cards ─── */
function AccountsSection({ isDark, C }: { isDark: boolean; C: any }) {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<typeof accounts[0] | null>(null);

  const cardBg = isDark ? "#212224" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.09)" : "#E5E7EB";

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setActiveIdx(Math.max(0, Math.min(idx, accounts.length - 1)));
  };

  return (
    <View style={{ marginTop: 4 }}>
      {/* Header row */}
      <View style={styles.accHeader}>
        <Text style={[styles.accTitle, { color: C.text }]}>Tus cuentas</Text>
        <TouchableOpacity
          onPress={toggleBalanceVisible}
          style={[styles.hideBtn, { backgroundColor: isDark ? "#1A1A1C" : "#F0F0F3" }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name={balanceVisible ? "eye-off" : "eye"} size={13} color={C.textSecondary} />
          <Text style={[styles.hideText, { color: C.textSecondary }]}>
            {balanceVisible ? "Ocultar saldos" : "Mostrar saldos"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards scroll */}
      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {accounts.map((acc) => {
          const label = accountTypeLabel(acc.type);
          const bal = formatBalance(acc.balance, acc.currencyCode, acc.currencySymbol, true);
          return (
            <View key={acc.id}
              style={[styles.card, { width: CARD_W, backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Card header */}
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]} numberOfLines={1}>
                    {label} · {acc.number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.arrowBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F5F5F7" }]}
                  onPress={() => { setSelectedAcc(acc); setShowDetail(true); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="chevron-right" size={15} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Balance */}
              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.balLabel, { color: C.textSecondary }]}>Saldo disponible</Text>
                {balanceVisible
                  ? <Text style={[styles.balAmount, { color: C.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>{bal}</Text>
                  : <Text style={[styles.balHidden, { color: C.text }]}>{maskedBalance(acc.currencyCode, acc.currencySymbol)}</Text>
                }
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.85}
                onPress={() => { setSelectedAcc(acc); setShowDetail(true); }}
              >
                <Text style={styles.ctaText}>Ver detalles de la cuenta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i === activeIdx
                ? styles.dotActive
                : [styles.dotInactive, { backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "#D1D5DB" }],
            ]} />
          ))}
        </View>
      )}

      {/* Account Detail Modal */}
      {selectedAcc && (
        <BottomSheet visible={showDetail} onClose={() => setShowDetail(false)} title="Detalles de cuenta">
          <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nombre</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{selectedAcc.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Número</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{selectedAcc.number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{accountTypeLabel(selectedAcc.type)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Moneda</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{selectedAcc.currency} ({selectedAcc.currencyCode})</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Saldo disponible</Text>
              <Text style={[styles.detailValue, { color: YELLOW, fontWeight: "700" }]}>
                {balanceVisible
                  ? formatBalance(selectedAcc.balance, selectedAcc.currencyCode, selectedAcc.currencySymbol, true)
                  : maskedBalance(selectedAcc.currencyCode, selectedAcc.currencySymbol)
                }
              </Text>
            </View>
            <TouchableOpacity style={[styles.ctaBtn, { marginTop: 20 }]} onPress={() => setShowDetail(false)}>
              <Text style={styles.ctaText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function HomeScreen() {
  const { userName, logout, supportPhone } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = insets.top > 0 ? insets.top : 20;

  /* Modal states */
  const [showLogout, setShowLogout]     = useState(false);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [showHelp, setShowHelp]         = useState(false);
  const [showClave, setShowClave]       = useState(false);
  const [claveCode, setClaveCode]       = useState("");

  const handleLogoutConfirm = async () => {
    setShowLogout(false);
    await logout();
    router.replace("/login");
  };

  const handleClavePress = (code: string) => {
    setClaveCode(code);
    setShowClave(true);
  };

  /* TX Action grid */
  const TX_ACTIONS = [
    { icon: "bar-chart-2", label: "Saldos y\nmovimientos", color: "#3B82F6", route: "/(tabs)/movements" as const },
    { icon: "send",        label: "Transferir\nplata",       color: "#8B5CF6", route: "/(tabs)/transfers" as const },
    { icon: "credit-card", label: "Pagar\ncréditos",         color: "#6366F1", route: "/(tabs)/transfers" as const },
    { icon: "file-text",   label: "Pagar\nfacturas",         color: "#EF4444", route: "/(tabs)/transfers" as const },
    { icon: "repeat",      label: "Transfiya /\nOtro banco", color: "#10B981", route: "/(tabs)/transfers" as const },
    { icon: "download",    label: "Recibir\nplata",          color: "#06B6D4", route: "/(tabs)/transfers" as const },
    { icon: "smartphone",  label: "Recargar\ncelular",       color: "#F59E0B", route: "/(tabs)/payments" as const },
    { icon: "trending-up", label: "Avances y\npréstamos",    color: "#10B981", route: "/(tabs)/payments" as const },
  ] as const;

  const CATEGORIES = [
    { icon: "target",          label: "Metas",       color: "#AF52DE", route: "/(tabs)/payments" as const },
    { icon: "home",            label: "Vivienda",    color: "#FF6B35", route: "/(tabs)/payments" as const },
    { icon: "shield",          label: "Seguros",     color: "#34C759", route: "/(tabs)/payments" as const },
    { icon: "trending-up",     label: "Inversiones", color: "#007AFF", route: "/(tabs)/payments" as const },
    { icon: "dollar-sign",     label: "Créditos",    color: "#FDDA24", route: "/(tabs)/transfers" as const },
    { icon: "more-horizontal", label: "Más",         color: "#8B5CF6", route: "/(tabs)/cards"    as const },
  ] as const;

  const colW = SCREEN_W / 4;

  return (
    <View style={[styles.root, { paddingTop: topPad, backgroundColor: C.background }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: C.headerBg ?? C.background, borderBottomColor: C.border }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image source={require("../../assets/images/pwa-icon.png")}
            style={styles.logoImg} resizeMode="contain" />
          <Text style={[styles.logoText, { color: C.text }]} numberOfLines={1}>Mi Bancolombia</Text>
        </View>
        {/* Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => setShowNotifs(true)}>
            <Feather name="bell" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => setShowHelp(true)}>
            <Feather name="help-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20necesito%20ayuda%20con%20mi%20cuenta`).catch(() => {})}>
            <Feather name="message-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => setShowLogout(true)}>
            <Feather name="log-out" size={19} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SCROLL CONTENT ── */}
      <ScrollView showsVerticalScrollIndicator={false} bounces contentContainerStyle={{ paddingBottom: 24 }}>

        {/* HERO */}
        <View style={[styles.hero, { backgroundColor: isDark ? "#16161A" : "#F7F7FA", overflow: "hidden" }]}>
          <ColorArc />
          <TouchableOpacity style={styles.greetRow} activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/cards")}>
            <Text style={[styles.greetText, { color: C.text }]} numberOfLines={1}>Hola, {userName} 👋</Text>
            <Feather name="chevron-right" size={18} color={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} />
          </TouchableOpacity>
          <ClaveTimer onPress={() => {
            const n = Math.floor(100000 + Math.random() * 899999).toString();
            handleClavePress(`${n.slice(0, 3)} ${n.slice(3)}`);
          }} />
        </View>

        {/* CUENTAS */}
        <AccountsSection isDark={isDark} C={C} />

        {/* TRANSACCIONES */}
        <View style={[styles.section, { backgroundColor: C.background }]}>
          <Text style={[styles.secTitle, { color: C.text }]}>Transacciones principales</Text>
          <View style={styles.grid}>
            {TX_ACTIONS.map((a, i) => (
              <TouchableOpacity key={i} style={[styles.gridItem, { width: colW }]}
                onPress={() => router.push(a.route)} activeOpacity={0.7}>
                <View style={[styles.gridIcon, { backgroundColor: a.color + (isDark ? "2A" : "1A") }]}>
                  <Feather name={a.icon as any} size={19} color={a.color} />
                </View>
                <Text style={[styles.gridLabel, { color: C.text }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CATEGORÍAS */}
        <View style={[styles.section, { backgroundColor: isDark ? "#111113" : "#F7F7FA", marginTop: 6 }]}>
          <Text style={[styles.secTitle, { color: C.text }]}>Explorar</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.gridItem, { width: colW }]}
                onPress={() => router.push(c.route)} activeOpacity={0.7}>
                <View style={[styles.gridIcon, { backgroundColor: c.color + (isDark ? "2A" : "1A") }]}>
                  <Feather name={c.icon as any} size={19} color={c.color} />
                </View>
                <Text style={[styles.gridLabel, { color: C.text }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── MODALS ── */}
      <LogoutModal visible={showLogout} onClose={() => setShowLogout(false)} onConfirm={handleLogoutConfirm} />
      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} C={C} isDark={isDark} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} C={C} />
      <ClaveModal visible={showClave} onClose={() => setShowClave(false)} C={C} code={claveCode} />
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0, marginRight: 4 },
  logoImg: { width: 28, height: 28, borderRadius: 7 },
  logoText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", flexShrink: 1 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  /* Hero */
  hero: { height: 148, justifyContent: "flex-start" },
  greetRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingTop: 16, gap: 4,
  },
  greetText: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", flexShrink: 1 },

  /* Clave Dinámica */
  clavePill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#212123", borderRadius: 30,
    paddingVertical: 6, paddingLeft: 8, paddingRight: 12,
    marginHorizontal: 18, marginTop: 12,
    gap: 8, alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  claveCircle: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  lockIcon: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  claveLabel: { fontSize: 9, color: "#A1A1AA", fontFamily: "Inter_500Medium" },
  claveCode: { fontSize: 13, fontWeight: "700", color: "#FFF", fontFamily: "Inter_700Bold", letterSpacing: 1.5 },

  /* Accounts section */
  accHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginTop: 14, marginBottom: 10,
  },
  accTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  hideBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 16,
  },
  hideText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  /* Card */
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  cardName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  arrowBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  balLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 3 },
  balAmount: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  balHidden: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 4 },
  ctaBtn: { backgroundColor: YELLOW, borderRadius: 24, paddingVertical: 11, alignItems: "center" },
  ctaText: { fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },

  /* Dots */
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { height: 5, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: YELLOW },
  dotInactive: { width: 5 },

  /* Account detail */
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
  detailLabel: { fontSize: 13, color: "#8E8E93", fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_500Medium", maxWidth: "60%", textAlign: "right" },

  /* Sections */
  section: { paddingTop: 16, paddingBottom: 8 },
  secTitle: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { alignItems: "center", paddingBottom: 14, paddingHorizontal: 2 },
  gridIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  gridLabel: { fontSize: 9.5, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 12, paddingHorizontal: 2 },

  /* Bottom sheet overlay */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#1C1C1E", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#3A3A3C", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2C2C2E",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },

  /* Logout modal */
  logoutOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center", padding: 32 },
  logoutBox: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 28, width: "100%", maxWidth: 320, alignItems: "center" },
  logoutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF444422", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoutTitle: { fontSize: 18, fontWeight: "700", color: "#FFF", fontFamily: "Inter_700Bold", marginBottom: 8 },
  logoutSub: { fontSize: 14, color: "#A1A1AA", textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 24 },
  logoutConfirmBtn: { backgroundColor: "#EF4444", borderRadius: 24, paddingVertical: 14, width: "100%", alignItems: "center", marginBottom: 10 },
  logoutConfirmText: { fontSize: 15, fontWeight: "700", color: "#FFF", fontFamily: "Inter_700Bold" },
  logoutCancelBtn: { backgroundColor: "#2C2C2E", borderRadius: 24, paddingVertical: 14, width: "100%", alignItems: "center" },
  logoutCancelText: { fontSize: 15, fontWeight: "600", color: "#FFF", fontFamily: "Inter_600SemiBold" },

  /* Notifications */
  notifRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  notifIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  notifSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },
  seeAllBtn: { paddingVertical: 16, alignItems: "center" },
  seeAllText: { fontSize: 14, color: YELLOW, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  /* Help */
  helpRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#2C2C2E" },
  helpIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  helpLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  helpSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, color: "#8E8E93" },

  /* Clave modal */
  claveModalBox: { borderRadius: 20, padding: 28, alignItems: "center", width: "100%", marginBottom: 16 },
  claveModalCode: { fontSize: 36, fontWeight: "700", color: YELLOW, fontFamily: "Inter_700Bold", letterSpacing: 6, marginTop: 12 },
  claveModalNote: { fontSize: 12, color: "#8E8E93", marginTop: 6, fontFamily: "Inter_400Regular" },
  claveModalInfo: { fontSize: 13, textAlign: "center", lineHeight: 20, fontFamily: "Inter_400Regular", marginBottom: 20 },
  claveModalBtn: { borderRadius: 24, paddingVertical: 14, paddingHorizontal: 40, alignItems: "center" },
});
