import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

const YELLOW = "#FDDA24";
const { width: SCREEN_W } = Dimensions.get("window");

type Contact = { name: string; account: string; bank: string; initial: string; color: string };
type View2 = "menu" | "qr" | "transfer" | "transfiya" | "recibir";

const CONTACTS: Contact[] = [
  { name: "Juan García", account: "****1234", bank: "Bancolombia", initial: "J", color: "#3B82F6" },
  { name: "María López", account: "****5678", bank: "Nequi", initial: "M", color: "#8B5CF6" },
  { name: "Pedro Ramírez", account: "****9012", bank: "Davivienda", initial: "P", color: "#EF4444" },
  { name: "Laura Torres", account: "****3456", bank: "Bancolombia", initial: "L", color: "#10B981" },
  { name: "Carlos Mesa", account: "****7890", bank: "Scotiabank", initial: "C", color: "#F59E0B" },
];

function QRCodeView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"cobrar" | "pagar">("cobrar");
  const QR_SIZE = SCREEN_W * 0.62;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={qrStyles.header}>
        <TouchableOpacity onPress={onBack} style={qrStyles.backBtn}>
          <Feather name="x" size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={qrStyles.headerTitle}>Código QR</Text>
        <TouchableOpacity style={qrStyles.shareBtn}>
          <Feather name="share-2" size={20} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View style={qrStyles.tabs}>
        <TouchableOpacity
          style={[qrStyles.tabBtn, tab === "cobrar" && qrStyles.tabActive]}
          onPress={() => setTab("cobrar")}
        >
          <Text style={[qrStyles.tabText, tab === "cobrar" && qrStyles.tabTextActive]}>Cobrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[qrStyles.tabBtn, tab === "pagar" && qrStyles.tabActive]}
          onPress={() => setTab("pagar")}
        >
          <Text style={[qrStyles.tabText, tab === "pagar" && qrStyles.tabTextActive]}>Pagar QR</Text>
        </TouchableOpacity>
      </View>

      {tab === "cobrar" ? (
        <View style={qrStyles.qrContainer}>
          <Text style={qrStyles.qrLabel}>Mi código QR Bancolombia</Text>
          <View style={[qrStyles.qrBox, { width: QR_SIZE, height: QR_SIZE }]}>
            <View style={qrStyles.qrCornerTL} />
            <View style={qrStyles.qrCornerTR} />
            <View style={qrStyles.qrCornerBL} />
            <View style={qrStyles.qrCornerBR} />
            <View style={qrStyles.qrGrid}>
              {Array.from({ length: 144 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    qrStyles.qrCell,
                    (i % 7 === 0 || i % 11 === 0 || i % 3 === 0) && qrStyles.qrCellFilled,
                  ]}
                />
              ))}
            </View>
            <View style={qrStyles.qrLogo}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1C1E" }}>≡</Text>
            </View>
          </View>
          <Text style={qrStyles.qrSub}>Comparte este código para recibir pagos</Text>
          <TouchableOpacity style={qrStyles.qrBtn}>
            <Feather name="download" size={16} color="#1C1C1E" />
            <Text style={qrStyles.qrBtnText}>Guardar código</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={qrStyles.scanContainer}>
          <View style={qrStyles.scanArea}>
            <View style={qrStyles.scanCornerTL} />
            <View style={qrStyles.scanCornerTR} />
            <View style={qrStyles.scanCornerBL} />
            <View style={qrStyles.scanCornerBR} />
            <Text style={qrStyles.scanText}>Apunta la cámara al código QR</Text>
          </View>
          <Text style={qrStyles.scanSub}>Escanea cualquier código QR para pagar</Text>
        </View>
      )}
    </View>
  );
}

function TransferView({ onBack }: { onBack: () => void }) {
  const { accounts, balanceVisible } = useApp();
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const displayAmount = amount
    ? new Intl.NumberFormat("es-CO").format(parseInt(amount.replace(/\D/g, "")))
    : "";

  const filtered = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleTransfer = () => {
    if (!selected || !amount) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("¡Transferencia exitosa!", `Enviaste $${displayAmount} a ${selected.name}`, [
      { text: "OK", onPress: () => { setAmount(""); setSelected(null); setNote(""); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F5F7" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={txStyles.header}>
        <TouchableOpacity onPress={onBack} style={txStyles.backBtn}>
          <Feather name="chevron-left" size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={txStyles.headerTitle}>Transferir plata</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={txStyles.amountCard}>
          <Text style={txStyles.amountLabel}>¿Cuánto quieres enviar?</Text>
          <View style={txStyles.amountRow}>
            <Text style={txStyles.amountCurrency}>$</Text>
            <TextInput
              style={txStyles.amountInput}
              value={displayAmount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#C0C0C0"
            />
          </View>
          {accounts[0] && (
            <Text style={txStyles.accountAvail}>
              Disponible: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(accounts[0].balance)}
            </Text>
          )}
        </View>

        <View style={txStyles.section}>
          <Text style={txStyles.sectionTitle}>Enviar a</Text>
          <View style={txStyles.searchWrap}>
            <Feather name="search" size={15} color="#9CA3AF" />
            <TextInput
              style={txStyles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar contacto..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {filtered.map((c) => (
            <TouchableOpacity
              key={c.account}
              style={[txStyles.contactRow, selected?.account === c.account && txStyles.contactRowActive]}
              onPress={() => setSelected(c)}
            >
              <View style={[txStyles.contactAvatar, { backgroundColor: c.color }]}>
                <Text style={txStyles.contactInitial}>{c.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={txStyles.contactName}>{c.name}</Text>
                <Text style={txStyles.contactBank}>{c.bank} · {c.account}</Text>
              </View>
              {selected?.account === c.account && (
                <View style={txStyles.checkCircle}>
                  <Feather name="check" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={txStyles.noteSection}>
          <Text style={txStyles.sectionTitle}>Descripción (opcional)</Text>
          <TextInput
            style={txStyles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ej: Pago alquiler"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[txStyles.btn, (!selected || !amount) && txStyles.btnDisabled]}
          onPress={handleTransfer}
          disabled={!selected || !amount}
        >
          <Text style={txStyles.btnText}>Continuar</Text>
          <Feather name="arrow-right" size={18} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const [currentView, setCurrentView] = useState<View2>("menu");

  if (currentView === "qr") return <QRCodeView onBack={() => setCurrentView("menu")} />;
  if (currentView === "transfer") return <TransferView onBack={() => setCurrentView("menu")} />;

  const TX_OPTIONS = [
    { icon: "maximize", label: "Cobrar o pagar\ncon QR", color: "#1C1C1E", bg: "#F5F5F7", view: "qr" as View2 },
    { icon: "send", label: "Transferir\nplata", color: "#3B82F6", bg: "#EFF6FF", view: "transfer" as View2 },
    { icon: "repeat", label: "A otro banco\ncon Transfiya", color: "#10B981", bg: "#ECFDF5", view: "transfer" as View2 },
    { icon: "download", label: "Recibir\nplata", color: "#8B5CF6", bg: "#EDE9FE", view: "transfer" as View2 },
    { icon: "plus-circle", label: "Inscribir\nproductos", color: "#F59E0B", bg: "#FFFBEB", view: "transfer" as View2 },
    { icon: "credit-card", label: "Pagar tarjetas\ny créditos", color: "#EF4444", bg: "#FEF2F2", view: "transfer" as View2 },
    { icon: "file-text", label: "Pagar\nfacturas", color: "#6366F1", bg: "#EEF2FF", view: "transfer" as View2 },
    { icon: "smartphone", label: "Recargar\ncelular", color: "#F59E0B", bg: "#FFFBEB", view: "transfer" as View2 },
    { icon: "trending-up", label: "Avances y\ndesembolsos", color: "#06B6D4", bg: "#ECFEFF", view: "transfer" as View2 },
  ];

  return (
    <View style={[menuStyles.container, { paddingTop: topPad }]}>
      <View style={menuStyles.header}>
        <Text style={menuStyles.title}>Transacciones</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={menuStyles.grid}>
          {TX_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.label}
              style={[menuStyles.item, { backgroundColor: o.bg }]}
              onPress={() => setCurrentView(o.view)}
              activeOpacity={0.7}
            >
              <View style={[menuStyles.iconWrap, { backgroundColor: o.color + "18" }]}>
                <Feather name={o.icon as any} size={24} color={o.color} />
              </View>
              <Text style={menuStyles.itemLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={menuStyles.categoriesBtn}>
          <Text style={menuStyles.categoriesBtnText}>Explorar nuestras categorías</Text>
          <Feather name="chevron-right" size={16} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    backgroundColor: "#00C072", paddingHorizontal: 24, paddingVertical: 20,
    paddingBottom: 24,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  item: {
    width: (SCREEN_W - 56) / 3,
    borderRadius: 18, padding: 14, alignItems: "center", gap: 10,
    minHeight: 110,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  itemLabel: { fontSize: 11, color: "#1C1C1E", fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 15 },
  categoriesBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 14,
    paddingVertical: 16, gap: 8,
  },
  categoriesBtnText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
});

const qrStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 60 : 56, paddingBottom: 16,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", marginHorizontal: 24, marginVertical: 16, backgroundColor: "#F0F0F0", borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_500Medium" },
  tabTextActive: { color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  qrContainer: { flex: 1, alignItems: "center", paddingTop: 24 },
  qrLabel: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 24 },
  qrBox: {
    borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F0F0F0",
    alignItems: "center", justifyContent: "center", position: "relative",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  qrCornerTL: { position: "absolute", top: 12, left: 12, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#1C1C1E", borderTopLeftRadius: 4 },
  qrCornerTR: { position: "absolute", top: 12, right: 12, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#1C1C1E", borderTopRightRadius: 4 },
  qrCornerBL: { position: "absolute", bottom: 12, left: 12, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#1C1C1E", borderBottomLeftRadius: 4 },
  qrCornerBR: { position: "absolute", bottom: 12, right: 12, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#1C1C1E", borderBottomRightRadius: 4 },
  qrGrid: { flexDirection: "row", flexWrap: "wrap", width: "70%", height: "70%", gap: 3 },
  qrCell: { width: 10, height: 10, borderRadius: 2, backgroundColor: "transparent" },
  qrCellFilled: { backgroundColor: "#1C1C1E" },
  qrLogo: {
    position: "absolute", width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#F0F0F0",
  },
  qrSub: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", marginTop: 20, textAlign: "center" },
  qrBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F5F5F7", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16,
  },
  qrBtnText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  scanContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#000" },
  scanArea: {
    width: SCREEN_W * 0.65, height: SCREEN_W * 0.65, position: "relative",
    alignItems: "center", justifyContent: "center",
  },
  scanCornerTL: { position: "absolute", top: 0, left: 0, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderColor: YELLOW, borderTopLeftRadius: 4 },
  scanCornerTR: { position: "absolute", top: 0, right: 0, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderColor: YELLOW, borderTopRightRadius: 4 },
  scanCornerBL: { position: "absolute", bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: YELLOW, borderBottomLeftRadius: 4 },
  scanCornerBR: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderColor: YELLOW, borderBottomRightRadius: 4 },
  scanText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  scanSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 32, textAlign: "center" },
});

const txStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
    paddingTop: Platform.OS === "web" ? 60 : 56,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  amountCard: { backgroundColor: "#1C1C1E", padding: 28, margin: 16, borderRadius: 20 },
  amountLabel: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginBottom: 12 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  amountCurrency: { fontSize: 28, fontWeight: "700", color: YELLOW, fontFamily: "Inter_700Bold" },
  amountInput: { fontSize: 42, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", flex: 1 },
  accountAvail: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginTop: 8 },
  section: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 8 },
  noteSection: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F7",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1C1C1E", fontFamily: "Inter_400Regular" },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12, borderRadius: 12, paddingHorizontal: 8 },
  contactRowActive: { backgroundColor: "#FDDA2415" },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contactInitial: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  contactName: { fontSize: 15, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  contactBank: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular" },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  noteInput: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1C1C1E", fontFamily: "Inter_400Regular",
  },
  btn: {
    backgroundColor: YELLOW, marginHorizontal: 16, borderRadius: 14,
    paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
