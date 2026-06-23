import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { formatBalance, BANKS_BY_CURRENCY } from "@/constants/countries";

const YELLOW = "#FDDA24";
const { width: SCREEN_W } = Dimensions.get("window");
const COL = (SCREEN_W - 44) / 3;

type SubView = "menu" | "qr" | "transfer" | "transfiya" | "recibir" | "facturas" | "recargar" | "avances";

type Contact = {
  name: string;
  account: string;
  bank: string;
  initial: string;
  color: string;
};

const COP_CONTACTS: Contact[] = [
  { name: "Juan García",     account: "****1234", bank: "Bancolombia",       initial: "J", color: "#3B82F6" },
  { name: "María López",     account: "****5678", bank: "Nequi",             initial: "M", color: "#8B5CF6" },
  { name: "Pedro Ramírez",   account: "****9012", bank: "Davivienda",        initial: "P", color: "#EF4444" },
  { name: "Laura Torres",    account: "****3456", bank: "Banco de Bogotá",   initial: "L", color: "#10B981" },
  { name: "Carlos Mesa",     account: "****7890", bank: "BBVA Colombia",     initial: "C", color: "#F59E0B" },
  { name: "Sofía Mendoza",   account: "****2211", bank: "Banco AV Villas",   initial: "S", color: "#06B6D4" },
  { name: "Andrés Ruiz",     account: "****4433", bank: "Banco Caja Social", initial: "A", color: "#6366F1" },
];

function QRCodeView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"cobrar" | "pagar">("cobrar");
  const QR_SIZE = Math.min(SCREEN_W * 0.62, 240);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={qrStyles.header}>
        <TouchableOpacity onPress={onBack} style={qrStyles.btn36}>
          <Feather name="x" size={20} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={qrStyles.headerTitle}>Código QR</Text>
        <TouchableOpacity
          style={qrStyles.btn36}
          onPress={() => Alert.alert("Compartir", "Código QR copiado al portapapeles.")}
        >
          <Feather name="share-2" size={18} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View style={qrStyles.tabs}>
        <TouchableOpacity style={[qrStyles.tabBtn, tab === "cobrar" && qrStyles.tabActive]} onPress={() => setTab("cobrar")}>
          <Text style={[qrStyles.tabText, tab === "cobrar" && qrStyles.tabTextActive]}>Cobrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[qrStyles.tabBtn, tab === "pagar" && qrStyles.tabActive]} onPress={() => setTab("pagar")}>
          <Text style={[qrStyles.tabText, tab === "pagar" && qrStyles.tabTextActive]}>Pagar QR</Text>
        </TouchableOpacity>
      </View>

      {tab === "cobrar" ? (
        <ScrollView contentContainerStyle={qrStyles.qrContainer} showsVerticalScrollIndicator={false}>
          <Text style={qrStyles.qrLabel}>Mi código QR Bancolombia</Text>
          <View style={[qrStyles.qrBox, { width: QR_SIZE, height: QR_SIZE }]}>
            <View style={qrStyles.qrCornerTL} />
            <View style={qrStyles.qrCornerTR} />
            <View style={qrStyles.qrCornerBL} />
            <View style={qrStyles.qrCornerBR} />
            <View style={qrStyles.qrInner}>
              {Array.from({ length: 100 }).map((_, i) => (
                <View
                  key={i}
                  style={[qrStyles.qrCell, (i % 7 === 0 || i % 11 === 0 || i % 3 === 0) && qrStyles.qrCellFilled]}
                />
              ))}
            </View>
            <View style={qrStyles.qrLogo}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E" }}>≡</Text>
            </View>
          </View>
          <Text style={qrStyles.qrSub}>Comparte este código para recibir pagos instantáneos</Text>
          <TouchableOpacity
            style={qrStyles.qrActionBtn}
            onPress={() => Alert.alert("Guardado", "Tu código QR fue guardado en la galería.")}
          >
            <Feather name="download" size={16} color="#1C1C1E" />
            <Text style={qrStyles.qrActionBtnText}>Guardar código</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[qrStyles.qrActionBtn, { backgroundColor: "#FDDA24" }]}
            onPress={() => Alert.alert("Cobrar con monto", "Ingresa un monto específico para personalizar tu código QR de cobro.")}
          >
            <Feather name="dollar-sign" size={16} color="#1C1C1E" />
            <Text style={qrStyles.qrActionBtnText}>Cobrar con monto específico</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={qrStyles.scanContainer}>
          <View style={qrStyles.scanArea}>
            <View style={qrStyles.scanCornerTL} />
            <View style={qrStyles.scanCornerTR} />
            <View style={qrStyles.scanCornerBL} />
            <View style={qrStyles.scanCornerBR} />
            <Text style={qrStyles.scanText}>Apunta la cámara al código QR</Text>
          </View>
          <Text style={qrStyles.scanSub}>Escanea cualquier código QR Bancolombia para pagar</Text>
          <TouchableOpacity
            style={[qrStyles.qrActionBtn, { marginTop: 24, backgroundColor: "rgba(255,255,255,0.15)" }]}
            onPress={() => Alert.alert("Galería", "Selecciona un código QR desde tu galería de fotos.")}
          >
            <Feather name="image" size={16} color="#FFFFFF" />
            <Text style={[qrStyles.qrActionBtnText, { color: "#FFFFFF" }]}>Pagar desde galería</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TransferView({ onBack, useBanks }: { onBack: () => void; useBanks: string[] }) {
  const { accounts, balanceVisible } = useApp();
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const account = accounts[0];
  const currencyCode = account?.currencyCode ?? "COP";
  const currencySymbol = account?.currencySymbol ?? "$";
  const rawNum = amount.replace(/\D/g, "");
  const displayAmount = rawNum ? new Intl.NumberFormat("es-CO").format(parseInt(rawNum)) : "";
  const balStr = account ? formatBalance(account.balance, currencyCode, currencySymbol, true) : "";

  const contacts = COP_CONTACTS.map((c, i) => ({
    ...c,
    bank: useBanks[i % useBanks.length] ?? c.bank,
  }));
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.bank.toLowerCase().includes(search.toLowerCase()));

  const handleConfirm = () => {
    if (!selected || !rawNum) return;
    setStep("confirm");
  };

  const handleSend = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "✅ ¡Transferencia exitosa!",
      `Se enviaron ${currencySymbol} ${displayAmount} ${currencyCode}\na ${selected?.name}\n(${selected?.bank} · ${selected?.account})`,
      [{ text: "Listo", onPress: () => { setAmount(""); setSelected(null); setNote(""); setStep("form"); } }]
    );
  };

  if (step === "confirm" && selected) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <View style={txStyles.header}>
          <TouchableOpacity onPress={() => setStep("form")} style={txStyles.btn36}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={txStyles.headerTitle}>Confirmar transferencia</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={txStyles.confirmCard}>
          <View style={[txStyles.contactAvatar, { backgroundColor: selected.color, alignSelf: "center", width: 56, height: 56, borderRadius: 28, marginBottom: 12 }]}>
            <Text style={[txStyles.contactInitial, { fontSize: 22 }]}>{selected.initial}</Text>
          </View>
          <Text style={txStyles.confirmName}>{selected.name}</Text>
          <Text style={txStyles.confirmBank}>{selected.bank} · {selected.account}</Text>
          <View style={txStyles.confirmSep} />
          <View style={txStyles.confirmRow}>
            <Text style={txStyles.confirmLabel}>Monto</Text>
            <Text style={txStyles.confirmValue}>{currencySymbol} {displayAmount} {currencyCode}</Text>
          </View>
          {note ? (
            <View style={txStyles.confirmRow}>
              <Text style={txStyles.confirmLabel}>Descripción</Text>
              <Text style={txStyles.confirmValue}>{note}</Text>
            </View>
          ) : null}
          <View style={txStyles.confirmRow}>
            <Text style={txStyles.confirmLabel}>Cuenta origen</Text>
            <Text style={txStyles.confirmValue}>{account?.number ?? "****"}</Text>
          </View>
          <View style={txStyles.confirmRow}>
            <Text style={txStyles.confirmLabel}>Disponible después</Text>
            <Text style={txStyles.confirmValue}>{formatBalance((account?.balance ?? 0) - parseInt(rawNum), currencyCode, currencySymbol, true)}</Text>
          </View>
        </View>
        <TouchableOpacity style={txStyles.btn} onPress={handleSend}>
          <Feather name="send" size={18} color="#1C1C1E" />
          <Text style={txStyles.btnText}>Confirmar y transferir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F5F7" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={txStyles.header}>
        <TouchableOpacity onPress={onBack} style={txStyles.btn36}>
          <Feather name="chevron-left" size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={txStyles.headerTitle}>Transferir plata</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={txStyles.amountCard}>
          <Text style={txStyles.amountLabel}>¿Cuánto quieres enviar?</Text>
          <View style={txStyles.amountRow}>
            <Text style={txStyles.amountCurrency}>{currencySymbol}</Text>
            <TextInput
              style={txStyles.amountInput}
              value={displayAmount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text style={txStyles.amountCode}>{currencyCode}</Text>
          </View>
          {account && (
            <Text style={txStyles.accountAvail}>Disponible: {balanceVisible ? balStr : "••••••"}</Text>
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
              placeholder="Buscar por nombre o banco..."
              placeholderTextColor="#9CA3AF"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
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
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={txStyles.contactName}>{c.name}</Text>
                <Text style={txStyles.contactBank} numberOfLines={1}>{c.bank} · {c.account}</Text>
              </View>
              {selected?.account === c.account && (
                <View style={txStyles.checkCircle}>
                  <Feather name="check" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={txStyles.newContactBtn}
            onPress={() => Alert.alert("Nuevo destinatario", "Ingresa el número de cuenta o celular del destinatario para inscribirlo.")}
          >
            <Feather name="user-plus" size={16} color="#3B82F6" />
            <Text style={txStyles.newContactText}>Nuevo destinatario</Text>
          </TouchableOpacity>
        </View>

        <View style={txStyles.noteSection}>
          <Text style={txStyles.sectionTitle}>Descripción (opcional)</Text>
          <TextInput
            style={txStyles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ej: Pago alquiler"
            placeholderTextColor="#9CA3AF"
            maxLength={80}
          />
        </View>

        <TouchableOpacity
          style={[txStyles.btn, (!selected || !rawNum) && txStyles.btnDisabled]}
          onPress={handleConfirm}
          disabled={!selected || !rawNum}
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
  const { accounts } = useApp();
  const [currentView, setCurrentView] = useState<SubView>("menu");

  const currencyCode = accounts[0]?.currencyCode ?? "COP";
  const banks = BANKS_BY_CURRENCY[currencyCode] ?? BANKS_BY_CURRENCY.COP;

  if (currentView === "qr") return <QRCodeView onBack={() => setCurrentView("menu")} />;
  if (currentView === "transfer" || currentView === "transfiya") {
    return <TransferView onBack={() => setCurrentView("menu")} useBanks={banks} />;
  }
  if (currentView === "recibir") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <View style={qrStyles.header}>
          <TouchableOpacity onPress={() => setCurrentView("menu")} style={qrStyles.btn36}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={qrStyles.headerTitle}>Recibir plata</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Feather name="download" size={48} color="#10B981" />
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1C1C1E", marginTop: 16, fontFamily: "Inter_700Bold" }}>
            Comparte tus datos
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>
            Para recibir dinero, comparte tu número de cuenta o tu código QR con quien quieras que te envíe.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginTop: 28 }}
            onPress={() => Alert.alert("Cuenta copiada", `Número: ${accounts[0]?.number ?? "****5678"}\nBanco: Bancolombia`)}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>Copiar número de cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: 12 }}
            onPress={() => setCurrentView("qr")}
          >
            <Text style={{ fontSize: 14, color: "#3B82F6", fontFamily: "Inter_500Medium" }}>Ver código QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  if (currentView === "facturas") {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <View style={qrStyles.header}>
          <TouchableOpacity onPress={() => setCurrentView("menu")} style={qrStyles.btn36}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={qrStyles.headerTitle}>Pagar facturas</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {[
            { label: "Energía – EPM", ref: "REF-890123", value: 187500, due: "30 Jun 2026" },
            { label: "Agua – EAAB", ref: "REF-234567", value: 95200, due: "28 Jun 2026" },
            { label: "Gas – Vanti",  ref: "REF-567890", value: 62800, due: "25 Jun 2026" },
            { label: "Internet – Claro", ref: "REF-112233", value: 89900, due: "15 Jul 2026" },
          ].map((f) => (
            <View key={f.ref} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>{f.label}</Text>
                <Text style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular" }}>Vence: {f.due}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 10 }}>{f.ref}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>
                  {formatBalance(f.value, currencyCode, accounts[0]?.currencySymbol ?? "$", true)}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 }}
                  onPress={() => Alert.alert("Pago exitoso", `Factura ${f.label} pagada correctamente.`)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>Pagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }
  if (currentView === "recargar") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <View style={qrStyles.header}>
          <TouchableOpacity onPress={() => setCurrentView("menu")} style={qrStyles.btn36}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={qrStyles.headerTitle}>Recargar celular</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 16, fontFamily: "Inter_400Regular", color: "#1C1C1E" }}
            placeholder="Número de celular"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>Selecciona el valor</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[5000, 10000, 15000, 20000, 30000, 50000].map((v) => (
              <TouchableOpacity
                key={v}
                style={{ backgroundColor: "#F5F5F7", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1.5, borderColor: "#E5E7EB" }}
                onPress={() => Alert.alert("Recarga", `Recarga de ${formatBalance(v, currencyCode, accounts[0]?.currencySymbol ?? "$", true)} realizada.`)}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>
                  {formatBalance(v, currencyCode, accounts[0]?.currencySymbol ?? "$", false)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  const TX_OPTIONS = [
    { icon: "maximize",    label: "QR\nCobrar/Pagar", color: "#1C1C1E", bg: "#F5F5F7",  view: "qr" as SubView },
    { icon: "send",        label: "Transferir\nplata",     color: "#3B82F6", bg: "#EFF6FF",  view: "transfer" as SubView },
    { icon: "repeat",      label: "A otro banco\nTransfiya",color:"#10B981", bg: "#ECFDF5",  view: "transfiya" as SubView },
    { icon: "download",    label: "Recibir\nplata",        color: "#8B5CF6", bg: "#EDE9FE",  view: "recibir" as SubView },
    { icon: "plus-circle", label: "Inscribir\nproductos",  color: "#F59E0B", bg: "#FFFBEB",  view: "transfer" as SubView },
    { icon: "credit-card", label: "Pagar tarjetas\ny créditos",color:"#EF4444",bg:"#FEF2F2",view: "facturas" as SubView },
    { icon: "file-text",   label: "Pagar\nfacturas",       color: "#6366F1", bg: "#EEF2FF",  view: "facturas" as SubView },
    { icon: "smartphone",  label: "Recargar\ncelular",     color: "#F59E0B", bg: "#FFFBEB",  view: "recargar" as SubView },
    { icon: "trending-up", label: "Avances y\ndesembolsos",color: "#06B6D4", bg: "#ECFEFF",  view: "transfer" as SubView },
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
              style={[menuStyles.item, { backgroundColor: o.bg, width: COL }]}
              onPress={() => setCurrentView(o.view)}
              activeOpacity={0.7}
            >
              <View style={[menuStyles.iconWrap, { backgroundColor: o.color + "20" }]}>
                <Feather name={o.icon as any} size={22} color={o.color} />
              </View>
              <Text style={menuStyles.itemLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={menuStyles.categoriesBtn}
          onPress={() => Alert.alert("Explorar categorías", "Encuentra más opciones de pago y servicios en la pestaña Explorar.")}
        >
          <Text style={menuStyles.categoriesBtnText}>Explorar nuestras categorías</Text>
          <Feather name="chevron-right" size={16} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    backgroundColor: "#00C072",
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 22,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  item: {
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 8,
    minHeight: 100,
    justifyContent: "center",
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  itemLabel: {
    fontSize: 10,
    color: "#1C1C1E",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 14,
  },
  categoriesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
  },
  categoriesBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
});

const qrStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 60 : 56,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  btn36: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 14,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_500Medium" },
  tabTextActive: { color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  qrContainer: { alignItems: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 16 },
  qrLabel: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_400Regular" },
  qrBox: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    padding: 16,
  },
  qrCornerTL: { position: "absolute", top: 10, left: 10, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#1C1C1E", borderTopLeftRadius: 4 },
  qrCornerTR: { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#1C1C1E", borderTopRightRadius: 4 },
  qrCornerBL: { position: "absolute", bottom: 10, left: 10, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#1C1C1E", borderBottomLeftRadius: 4 },
  qrCornerBR: { position: "absolute", bottom: 10, right: 10, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#1C1C1E", borderBottomRightRadius: 4 },
  qrInner: { flexDirection: "row", flexWrap: "wrap", width: "72%", aspectRatio: 1, gap: 2 },
  qrCell: { width: 9, height: 9, borderRadius: 2, backgroundColor: "transparent" },
  qrCellFilled: { backgroundColor: "#1C1C1E" },
  qrLogo: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
  },
  qrSub: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", textAlign: "center" },
  qrActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
    justifyContent: "center",
  },
  qrActionBtnText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  scanContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0A0A0A",
  },
  scanArea: {
    width: Math.min(SCREEN_W * 0.65, 240),
    height: Math.min(SCREEN_W * 0.65, 240),
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  scanCornerTL: { position: "absolute", top: 0, left: 0, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: YELLOW, borderTopLeftRadius: 4 },
  scanCornerTR: { position: "absolute", top: 0, right: 0, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: YELLOW, borderTopRightRadius: 4 },
  scanCornerBL: { position: "absolute", bottom: 0, left: 0, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: YELLOW, borderBottomLeftRadius: 4 },
  scanCornerBR: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: YELLOW, borderBottomRightRadius: 4 },
  scanText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  scanSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 28, textAlign: "center" },
});

const txStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 60 : 56,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  btn36: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  amountCard: { backgroundColor: "#1C1C1E", padding: 24, margin: 16, borderRadius: 20 },
  amountLabel: { fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", marginBottom: 10 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  amountCurrency: { fontSize: 24, fontWeight: "700", color: YELLOW, fontFamily: "Inter_700Bold" },
  amountInput: { fontSize: 38, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", flex: 1, minWidth: 0 },
  amountCode: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_500Medium" },
  accountAvail: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", marginTop: 8 },
  section: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 8 },
  noteSection: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1C1C1E", fontFamily: "Inter_400Regular" },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 12, borderRadius: 12 },
  contactRowActive: { backgroundColor: "#FDDA2415" },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  contactInitial: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  contactName: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  contactBank: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular" },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  newContactBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 8 },
  newContactText: { fontSize: 14, color: "#3B82F6", fontFamily: "Inter_500Medium" },
  noteInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1C1C1E",
    fontFamily: "Inter_400Regular",
  },
  btn: {
    backgroundColor: YELLOW,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  confirmCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  confirmName: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmBank: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 16 },
  confirmSep: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 16 },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F7" },
  confirmLabel: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_400Regular" },
  confirmValue: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 8 },
});
