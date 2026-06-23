import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
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

const RESTRICTED_STATUSES = ["suspended", "blocked"] as const;

function useMoneyRestriction() {
  const { currentUser, supportPhone } = useApp();
  const isRestricted = RESTRICTED_STATUSES.includes(currentUser?.status as any);
  const showRestrictionAlert = () => {
    const isBlocked = currentUser?.status === "blocked";
    Alert.alert(
      isBlocked ? "Cuenta bloqueada" : "Cuenta en revisión",
      `Tu cuenta está ${isBlocked ? "bloqueada permanentemente" : "en revisión"} y no puede realizar movimientos de dinero en este momento.\n\nContacta a un asesor para resolver esta situación.`,
      [
        { text: "Entendido", style: "cancel" },
        {
          text: "Hablar con asesor",
          onPress: () => Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20mi%20cuenta%20está%20${isBlocked ? "bloqueada" : "en%20revisión"}%20y%20necesito%20ayuda`).catch(() => {}),
        },
      ]
    );
  };
  return { isRestricted, showRestrictionAlert };
}

const YELLOW = "#FDDA24";
const { width: SCREEN_W } = Dimensions.get("window");
const COL = (SCREEN_W - 44) / 3;

type SubView = "menu" | "qr" | "transfer" | "transfiya" | "recibir" | "facturas" | "recargar" | "avances" | "inscribir" | "tarjetas";

type Contact = { name: string; account: string; bank: string; initial: string; color: string };

const COP_CONTACTS: Contact[] = [
  { name: "Juan García",   account: "****1234", bank: "Bancolombia",    initial: "J", color: "#3B82F6" },
  { name: "María López",   account: "****5678", bank: "Nequi",          initial: "M", color: "#8B5CF6" },
  { name: "Pedro Ramírez", account: "****9012", bank: "Davivienda",     initial: "P", color: "#EF4444" },
  { name: "Laura Torres",  account: "****3456", bank: "Banco de Bogotá",initial: "L", color: "#10B981" },
  { name: "Carlos Mesa",   account: "****7890", bank: "BBVA Colombia",  initial: "C", color: "#F59E0B" },
  { name: "Sofía Mendoza", account: "****2211", bank: "Banco AV Villas",initial: "S", color: "#06B6D4" },
  { name: "Andrés Ruiz",   account: "****4433", bank: "Banco Caja Social",initial:"A",color: "#6366F1" },
];

/* ──────────────────────────────────────────────────────── QR ── */
function QRCodeView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"cobrar" | "pagar">("cobrar");
  const QR_SIZE = Math.min(SCREEN_W * 0.62, 240);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="x" size={20} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Código QR</Text>
        <TouchableOpacity style={sh.btn36} onPress={() => Alert.alert("Compartir", "Código QR copiado al portapapeles.")}>
          <Feather name="share-2" size={18} color="#1C1C1E" />
        </TouchableOpacity>
      </View>
      <View style={sh.tabs}>
        {(["cobrar","pagar"] as const).map((t) => (
          <TouchableOpacity key={t} style={[sh.tabBtn, tab === t && sh.tabActive]} onPress={() => setTab(t)}>
            <Text style={[sh.tabText, tab === t && sh.tabTextActive]}>{t === "cobrar" ? "Cobrar" : "Pagar QR"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === "cobrar" ? (
        <ScrollView contentContainerStyle={sh.qrContainer}>
          <Text style={sh.qrLabel}>Mi código QR Bancolombia</Text>
          <View style={[sh.qrBox, { width: QR_SIZE, height: QR_SIZE }]}>
            <View style={sh.qrCornerTL} /><View style={sh.qrCornerTR} />
            <View style={sh.qrCornerBL} /><View style={sh.qrCornerBR} />
            <View style={sh.qrInner}>
              {Array.from({ length: 100 }).map((_, i) => (
                <View key={i} style={[sh.qrCell, (i % 7 === 0 || i % 11 === 0 || i % 3 === 0) && sh.qrCellFilled]} />
              ))}
            </View>
            <View style={sh.qrLogo}><Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E" }}>≡</Text></View>
          </View>
          <Text style={sh.qrSub}>Comparte este código para recibir pagos instantáneos</Text>
          <TouchableOpacity style={sh.qrActionBtn} onPress={() => Alert.alert("Guardado", "Tu código QR fue guardado en la galería.")}>
            <Feather name="download" size={16} color="#1C1C1E" />
            <Text style={sh.qrActionBtnText}>Guardar código</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sh.qrActionBtn, { backgroundColor: YELLOW }]} onPress={() =>
            Alert.alert("Cobrar con monto", "Ingresa el monto que deseas cobrar y comparte el QR con quien quieras.")
          }>
            <Feather name="dollar-sign" size={16} color="#1C1C1E" />
            <Text style={sh.qrActionBtnText}>Cobrar con monto específico</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={sh.scanContainer}>
          <View style={sh.scanArea}>
            <View style={sh.scanCornerTL} /><View style={sh.scanCornerTR} />
            <View style={sh.scanCornerBL} /><View style={sh.scanCornerBR} />
            <Text style={sh.scanText}>Apunta la cámara al código QR</Text>
          </View>
          <Text style={sh.scanSub}>Escanea cualquier código QR Bancolombia para pagar</Text>
          <TouchableOpacity style={[sh.qrActionBtn, { marginTop: 24, backgroundColor: "rgba(255,255,255,0.15)" }]}
            onPress={() => Alert.alert("Galería", "Selecciona un código QR desde tu galería de fotos.")}>
            <Feather name="image" size={16} color="#FFFFFF" />
            <Text style={[sh.qrActionBtnText, { color: "#FFFFFF" }]}>Pagar desde galería</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ──────────────────────────────────────────── Transfer / Transfiya ── */
function TransferView({ onBack, useBanks, title = "Transferir plata" }: { onBack: () => void; useBanks: string[]; title?: string }) {
  const { accounts, balanceVisible, addTransaction } = useApp();
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const account = accounts[0];
  const currencyCode = account?.currencyCode ?? "COP";
  const currencySymbol = account?.currencySymbol ?? "$";
  const rawNum = parseInt(amount.replace(/\D/g, "") || "0");
  const displayAmount = rawNum ? new Intl.NumberFormat("es-CO").format(rawNum) : "";
  const balStr = account ? formatBalance(account.balance, currencyCode, currencySymbol, true) : "";

  const contacts = COP_CONTACTS.map((c, i) => ({ ...c, bank: useBanks[i % useBanks.length] ?? c.bank }));
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.bank.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selected || !rawNum || !account) return;
    if (rawNum > account.balance) {
      Alert.alert("Saldo insuficiente", `Tu saldo disponible es ${balStr}.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await addTransaction(account.userId, {
        accountId: account.id, userId: account.userId,
        date: new Date().toISOString().split("T")[0],
        description: note || `Transferencia a ${selected.name}`,
        amount: -rawNum, type: "debit", category: "Transferencias", status: "completed",
      });
      Alert.alert("✅ ¡Transferencia exitosa!",
        `Se enviaron ${currencySymbol} ${displayAmount} ${currencyCode}\na ${selected.name}\n(${selected.bank} · ${selected.account})`,
        [{ text: "Listo", onPress: () => { setAmount(""); setSelected(null); setNote(""); setStep("form"); } }]
      );
    } catch {
      Alert.alert("Error", "No se pudo completar la transferencia. Intenta de nuevo.");
    }
  };

  if (step === "confirm" && selected) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <View style={tx.header}>
          <TouchableOpacity onPress={() => setStep("form")} style={tx.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
          <Text style={tx.headerTitle}>Confirmar transferencia</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={tx.confirmCard}>
            <View style={[tx.contactAvatar, { backgroundColor: selected.color, alignSelf: "center", width: 56, height: 56, borderRadius: 28, marginBottom: 12 }]}>
              <Text style={[tx.contactInitial, { fontSize: 22 }]}>{selected.initial}</Text>
            </View>
            <Text style={tx.confirmName}>{selected.name}</Text>
            <Text style={tx.confirmBank}>{selected.bank} · {selected.account}</Text>
            <View style={tx.confirmSep} />
            {(
              [
                ["Monto", `${currencySymbol} ${displayAmount} ${currencyCode}`],
                note ? ["Descripción", note] : null,
                ["Cuenta origen", account?.number ?? "****"],
                ["Saldo después", formatBalance((account?.balance ?? 0) - rawNum, currencyCode, currencySymbol, true)],
              ].filter(Boolean) as string[][]
            ).map(([l, v]) => (
              <View key={l} style={tx.confirmRow}>
                <Text style={tx.confirmLabel}>{l}</Text>
                <Text style={tx.confirmValue}>{v}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={tx.btn} onPress={handleSend}>
            <Feather name="send" size={18} color="#1C1C1E" />
            <Text style={tx.btnText}>Confirmar y transferir</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F5F7" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={tx.header}>
        <TouchableOpacity onPress={onBack} style={tx.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={tx.headerTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={tx.amountCard}>
          <Text style={tx.amountLabel}>¿Cuánto quieres enviar?</Text>
          <View style={tx.amountRow}>
            <Text style={tx.amountCurrency}>{currencySymbol}</Text>
            <TextInput
              style={tx.amountInput} value={displayAmount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric" placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text style={tx.amountCode}>{currencyCode}</Text>
          </View>
          {account && <Text style={tx.accountAvail}>Disponible: {balanceVisible ? balStr : "••••••"}</Text>}
        </View>
        <View style={tx.section}>
          <Text style={tx.sectionTitle}>Enviar a</Text>
          <View style={tx.searchWrap}>
            <Feather name="search" size={15} color="#9CA3AF" />
            <TextInput style={tx.searchInput} value={search} onChangeText={setSearch}
              placeholder="Buscar por nombre o banco..." placeholderTextColor="#9CA3AF" />
            {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={15} color="#9CA3AF" /></TouchableOpacity>}
          </View>
          {filtered.map((c) => (
            <TouchableOpacity key={c.account}
              style={[tx.contactRow, selected?.account === c.account && tx.contactRowActive]}
              onPress={() => setSelected(c)}
            >
              <View style={[tx.contactAvatar, { backgroundColor: c.color }]}>
                <Text style={tx.contactInitial}>{c.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tx.contactName}>{c.name}</Text>
                <Text style={tx.contactBank} numberOfLines={1}>{c.bank} · {c.account}</Text>
              </View>
              {selected?.account === c.account && (
                <View style={tx.checkCircle}><Feather name="check" size={14} color="#FFFFFF" /></View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={tx.newContactBtn} onPress={() => setCurrentViewGlobal?.("inscribir")}>
            <Feather name="user-plus" size={16} color="#3B82F6" />
            <Text style={tx.newContactText}>Nuevo destinatario</Text>
          </TouchableOpacity>
        </View>
        <View style={tx.noteSection}>
          <Text style={tx.sectionTitle}>Descripción (opcional)</Text>
          <TextInput style={tx.noteInput} value={note} onChangeText={setNote}
            placeholder="Ej: Pago alquiler" placeholderTextColor="#9CA3AF" maxLength={80} />
        </View>
        <TouchableOpacity
          style={[tx.btn, (!selected || !rawNum) && tx.btnDisabled]}
          onPress={() => { if (selected && rawNum) setStep("confirm"); }}
          disabled={!selected || !rawNum}
        >
          <Text style={tx.btnText}>Continuar</Text>
          <Feather name="arrow-right" size={18} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ──────────────────────────────────────────── Recibir plata ── */
function RecibirView({ onBack, accounts, onQR }: { onBack: () => void; accounts: ReturnType<typeof useApp>["accounts"]; onQR: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Recibir plata</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Feather name="download" size={48} color="#10B981" />
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1C1C1E", marginTop: 16, fontFamily: "Inter_700Bold" }}>
            Comparte tus datos
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>
            Para recibir dinero, comparte el número de tu cuenta o tu código QR.
          </Text>
        </View>
        {accounts.map((acc) => (
          <View key={acc.id} style={{ backgroundColor: "#F5F5F7", borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 4 }}>
              {acc.type === "savings" ? "Cuenta de Ahorros" : acc.type === "checking" ? "Cuenta Corriente" : "Crédito"}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", letterSpacing: 1 }}>
              {acc.number}
            </Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginTop: 2 }}>
              Bancolombia · {acc.currencyCode}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 12, marginTop: 14, alignItems: "center" }}
              onPress={() => Alert.alert("Cuenta copiada", `Número ${acc.number} copiado.\n\nComparte este número con quien quieras que te envíe dinero.`)}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>Copiar número</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={{ borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 }}
          onPress={onQR}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#3B82F6", fontFamily: "Inter_600SemiBold" }}>Ver mi código QR</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ──────────────────────────────────────────── Facturas ── */
function FacturasView({ onBack, currencyCode, currencySymbol }: { onBack: () => void; currencyCode: string; currencySymbol: string }) {
  const { accounts, addTransaction } = useApp();
  const BILLS = [
    { label: "Energía – EPM",    ref: "REF-890123", value: 187500, due: "30 Jun 2026" },
    { label: "Agua – EAAB",      ref: "REF-234567", value: 95200,  due: "28 Jun 2026" },
    { label: "Gas – Vanti",      ref: "REF-567890", value: 62800,  due: "25 Jun 2026" },
    { label: "Internet – Claro", ref: "REF-112233", value: 89900,  due: "15 Jul 2026" },
  ];

  const handlePay = (f: typeof BILLS[0]) => {
    const account = accounts[0];
    if (!account) { Alert.alert("Sin cuenta", "No tienes una cuenta activa."); return; }
    if (f.value > account.balance) { Alert.alert("Saldo insuficiente", `Tu saldo disponible es ${formatBalance(account.balance, currencyCode, currencySymbol, true)}.`); return; }
    Alert.alert(`Pagar ${f.label}`, `¿Confirmar pago de ${formatBalance(f.value, currencyCode, currencySymbol, true)}?\nRef: ${f.ref}`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Pagar", onPress: async () => {
        try {
          await addTransaction(account.userId, {
            accountId: account.id, userId: account.userId,
            date: new Date().toISOString().split("T")[0],
            description: `Pago ${f.label}`, amount: -f.value,
            type: "debit", category: "Servicios", status: "completed",
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("✅ Pago exitoso", `Factura ${f.label} pagada correctamente.\nRef: ${f.ref}`);
        } catch { Alert.alert("Error", "No se pudo procesar el pago."); }
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Pagar facturas</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {BILLS.map((f) => (
          <View key={f.ref} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>{f.label}</Text>
              <Text style={{ fontSize: 12, color: "#EF4444", fontFamily: "Inter_500Medium" }}>Vence {f.due}</Text>
            </View>
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 12 }}>{f.ref}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>
                {formatBalance(f.value, currencyCode, currencySymbol, true)}
              </Text>
              <TouchableOpacity style={{ backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 }} onPress={() => handlePay(f)}>
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

/* ──────────────────────────────────────────── Recargar celular ── */
function RecargarView({ onBack, currencyCode, currencySymbol }: { onBack: () => void; currencyCode: string; currencySymbol: string }) {
  const { accounts, addTransaction } = useApp();
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState<string | null>(null);
  const OPERATORS = ["Claro", "Movistar", "Tigo", "WOM", "Virgin Mobile"];
  const VALUES = [5000, 10000, 15000, 20000, 30000, 50000];

  const handleRecharge = async (v: number) => {
    if (!phone || phone.length < 10) { Alert.alert("Número inválido", "Ingresa un número de celular de 10 dígitos."); return; }
    if (!operator) { Alert.alert("Selecciona operador", "Elige el operador del número a recargar."); return; }
    const account = accounts[0];
    if (!account) { Alert.alert("Sin cuenta", "No tienes una cuenta activa."); return; }
    if (v > account.balance) { Alert.alert("Saldo insuficiente", `Tu saldo disponible es ${formatBalance(account.balance, currencyCode, currencySymbol, true)}.`); return; }
    Alert.alert("Confirmar recarga", `${operator} · ${phone}\n${formatBalance(v, currencyCode, currencySymbol, true)}`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Recargar", onPress: async () => {
        await addTransaction(account.userId, {
          accountId: account.id, userId: account.userId,
          date: new Date().toISOString().split("T")[0],
          description: `Recarga ${operator} ${phone}`, amount: -v,
          type: "debit", category: "Recargas", status: "completed",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ ¡Recarga exitosa!", `Se recargaron ${formatBalance(v, currencyCode, currencySymbol, true)} al número ${phone} de ${operator}.`);
        setPhone(""); setOperator(null);
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Recargar celular</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold", marginBottom: 8 }}>Número de celular</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 16, fontFamily: "Inter_400Regular", color: "#1C1C1E" }}
            placeholder="Ej: 3001234567" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10}
            value={phone} onChangeText={setPhone}
          />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold", marginBottom: 8 }}>Operador</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {OPERATORS.map((op) => (
              <TouchableOpacity key={op}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
                  borderColor: operator === op ? "#1C1C1E" : "#E5E7EB",
                  backgroundColor: operator === op ? "#1C1C1E" : "#FFFFFF" }}
                onPress={() => setOperator(op)}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: operator === op ? "#FFFFFF" : "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>{op}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold", marginBottom: 8 }}>Selecciona el valor</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {VALUES.map((v) => (
              <TouchableOpacity key={v}
                style={{ backgroundColor: "#F5F5F7", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1.5, borderColor: "#E5E7EB" }}
                onPress={() => handleRecharge(v)}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>
                  {formatBalance(v, currencyCode, currencySymbol, true)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

/* ──────────────────────────────────────────── Avances y desembolsos ── */
function AvancesView({ onBack }: { onBack: () => void }) {
  const PRODUCTS = [
    { label: "Crédito Personal",    rate: "1.8% MV", max: "$ 50.000.000", color: "#3B82F6", icon: "user" as const },
    { label: "Libranza",            rate: "1.2% MV", max: "$ 100.000.000",color: "#10B981", icon: "briefcase" as const },
    { label: "Crédito Rotativo",    rate: "2.1% MV", max: "$ 20.000.000", color: "#8B5CF6", icon: "refresh-cw" as const },
    { label: "Avance en Efectivo",  rate: "3.0% MV", max: "$ 5.000.000",  color: "#F59E0B", icon: "dollar-sign" as const },
    { label: "Microcrédito",        rate: "1.9% MV", max: "$ 10.000.000", color: "#EF4444", icon: "zap" as const },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Avances y desembolsos</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <View style={{ backgroundColor: "#003087", borderRadius: 16, padding: 20, marginBottom: 6 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" }}>Tu capacidad de endeudamiento</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 6 }}>$ 25.000.000</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 }}>Estimado según tu historial</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold", paddingHorizontal: 4 }}>Productos disponibles</Text>
        {PRODUCTS.map((p) => (
          <TouchableOpacity key={p.label} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}
            onPress={() => Alert.alert(p.label, `Tasa desde ${p.rate}\nMonto máximo: ${p.max}\n\nUn asesor se pondrá en contacto contigo para gestionar tu solicitud.`, [
              { text: "Solicitar", style: "default" }, { text: "Cerrar", style: "cancel" },
            ])}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: p.color + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={p.icon} size={20} color={p.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>{p.label}</Text>
              <Text style={{ fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular" }}>Desde {p.rate} · Hasta {p.max}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

/* ──────────────────────────────────────────── Inscribir productos ── */
function InscribirView({ onBack }: { onBack: () => void }) {
  const [bank, setBank] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "checking">("savings");
  const [ownerName, setOwnerName] = useState("");

  const handleInscribir = () => {
    if (!bank || !accountNum || !ownerName) { Alert.alert("Campos incompletos", "Por favor completa todos los campos."); return; }
    if (accountNum.length < 8) { Alert.alert("Número inválido", "El número de cuenta debe tener al menos 8 dígitos."); return; }
    Alert.alert("✅ Producto inscrito", `Cuenta ${accountType === "savings" ? "de Ahorros" : "Corriente"} de ${bank}\nNúmero: ****${accountNum.slice(-4)}\nTitular: ${ownerName}\n\nInscripción exitosa. Ya puedes transferirle.`, [
      { text: "Listo", onPress: onBack },
    ]);
  };

  const inputStyle = { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 16, fontFamily: "Inter_400Regular" as const, color: "#1C1C1E", backgroundColor: "#FFFFFF" };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F5F7" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Inscribir producto</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold" as const, marginBottom: 8 }}>Banco</Text>
          <TextInput style={inputStyle} placeholder="Ej: Davivienda" placeholderTextColor="#9CA3AF" value={bank} onChangeText={setBank} />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold" as const, marginBottom: 8 }}>Tipo de cuenta</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {([["savings","Ahorros"],["checking","Corriente"]] as const).map(([v, l]) => (
              <TouchableOpacity key={v}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
                  borderColor: accountType === v ? "#1C1C1E" : "#E5E7EB",
                  backgroundColor: accountType === v ? "#1C1C1E" : "#FFFFFF", alignItems: "center" }}
                onPress={() => setAccountType(v)}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: accountType === v ? "#FFFFFF" : "#1C1C1E", fontFamily: "Inter_600SemiBold" as const }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold" as const, marginBottom: 8 }}>Número de cuenta</Text>
          <TextInput style={inputStyle} placeholder="Número de cuenta" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={accountNum} onChangeText={setAccountNum} maxLength={16} />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold" as const, marginBottom: 8 }}>Nombre del titular</Text>
          <TextInput style={inputStyle} placeholder="Nombre completo del titular" placeholderTextColor="#9CA3AF" value={ownerName} onChangeText={setOwnerName} />
        </View>
        <TouchableOpacity style={{ backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 }} onPress={handleInscribir}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" as const }}>Inscribir producto</Text>
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ──────────────────────────────────────────── Pagar tarjetas ── */
function TarjetasView({ onBack }: { onBack: () => void }) {
  const { accounts, cards, addTransaction } = useApp();
  const CREDIT_CARDS = [
    { label: "Visa Clásica Bancolombia", min: 85000, total: 720000, due: "05 Jul 2026", color: "#1A1F71" },
    { label: "Mastercard Gold",          min: 120000,total: 1450000,due: "15 Jul 2026", color: "#EB001B" },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onBack} style={sh.btn36}><Feather name="chevron-left" size={22} color="#1C1C1E" /></TouchableOpacity>
        <Text style={sh.headerTitle}>Pagar tarjetas y créditos</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {CREDIT_CARDS.map((card) => (
          <View key={card.label} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" }}>
            <View style={{ backgroundColor: card.color, padding: 16 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular" }}>Saldo total</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" }}>$ {card.total.toLocaleString("es-CO")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>{card.label}</Text>
            </View>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" }}>Pago mínimo</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>$ {card.min.toLocaleString("es-CO")}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" }}>Fecha de corte</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#EF4444", fontFamily: "Inter_600SemiBold" }}>{card.due}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: "#F5F5F7", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
                  onPress={() => Alert.alert("Pago mínimo", `¿Pagar el mínimo de $${card.min.toLocaleString("es-CO")}?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Pagar", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert("✅ Pago exitoso", `Pago mínimo de $${card.min.toLocaleString("es-CO")} realizado.`); }},
                  ])}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>Pago mínimo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
                  onPress={() => Alert.alert("Pago total", `¿Pagar el total de $${card.total.toLocaleString("es-CO")}?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Pagar todo", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert("✅ Pago exitoso", `Pago total de $${card.total.toLocaleString("es-CO")} realizado.`); }},
                  ])}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>Pagar todo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

// Global setter for nested navigation within TransferView
let setCurrentViewGlobal: ((v: SubView) => void) | null = null;

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
function AccountRestrictedScreen({ topPad }: { topPad: number }) {
  const { currentUser, supportPhone } = useApp();
  const u = currentUser;
  const isBlocked = u?.status === "blocked";
  const steps = u?.unblockSteps ?? [];
  const docs = u?.requiredDocuments ?? [];
  const color = isBlocked ? "#EF4444" : "#F59E0B";
  const label = isBlocked ? "Cuenta bloqueada" : "Cuenta en revisión";
  const waMsg = encodeURIComponent(`Hola, mi cuenta está ${isBlocked ? "bloqueada" : "en revisión"} y necesito ayuda para habilitar los movimientos.`);
  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A", paddingTop: topPad }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>Transacciones</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Banner de restricción */}
        <View style={{ backgroundColor: color + "15", borderRadius: 16, borderWidth: 1.5, borderColor: color + "50", padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Feather name={isBlocked ? "lock" : "alert-triangle"} size={22} color={color} />
            <Text style={{ fontSize: 17, fontWeight: "700", color, fontFamily: "Inter_700Bold" }}>{label}</Text>
          </View>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", fontFamily: "Inter_400Regular", lineHeight: 19 }}>
            Tu cuenta no puede realizar transferencias, pagos ni movimientos de dinero en este momento. Puedes seguir consultando tu saldo e historial.
          </Text>
          {u?.suspensionReason ? (
            <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 0.8, marginBottom: 4 }}>MOTIVO</Text>
              <Text style={{ fontSize: 13, color: "#fff", fontFamily: "Inter_400Regular" }}>{u.suspensionReason}</Text>
              {u.suspensionDate && <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{new Date(u.suspensionDate).toLocaleString("es-CO")}</Text>}
            </View>
          ) : null}
        </View>

        {/* Botón principal: Hablar con asesor */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, backgroundColor: "#25D36620", borderWidth: 1.5, borderColor: "#25D36660", marginBottom: 16 }}
          onPress={() => Linking.openURL(`https://wa.me/${supportPhone}?text=${waMsg}`).catch(() => {})}
        >
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#25D36622", alignItems: "center", justifyContent: "center" }}>
            <Feather name="message-circle" size={24} color="#25D366" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#25D366", fontFamily: "Inter_700Bold" }}>Hablar con un asesor</Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", marginTop: 2 }}>
              Chat directo de WhatsApp con soporte
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#25D366" />
        </TouchableOpacity>

        {docs.length > 0 && (
          <View style={{ backgroundColor: "#1E2A3A", borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="file-text" size={18} color="#60A5FA" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>Documentos requeridos</Text>
            </View>
            {docs.map((doc: string, i: number) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#3B82F620", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#60A5FA" }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", lineHeight: 19 }}>{doc}</Text>
              </View>
            ))}
          </View>
        )}
        {steps.length > 0 && (
          <View style={{ backgroundColor: "#1E2A3A", borderRadius: 16, padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="list" size={18} color="#A78BFA" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>Pasos para desbloquear</Text>
            </View>
            {steps.map((step: any, i: number) => (
              <View key={step.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: step.completed ? "#22C55E30" : "#7C3AED30", borderWidth: 1.5, borderColor: step.completed ? "#22C55E" : "#A78BFA", alignItems: "center", justifyContent: "center" }}>
                    {step.completed
                      ? <Feather name="check" size={13} color="#22C55E" />
                      : <Text style={{ fontSize: 12, fontWeight: "700", color: "#A78BFA" }}>{i + 1}</Text>}
                  </View>
                  {i < steps.length - 1 && <View style={{ width: 1.5, height: 20, backgroundColor: "#A78BFA40", marginTop: 4 }} />}
                </View>
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: step.completed ? "#22C55E" : "#fff", fontFamily: "Inter_700Bold", marginBottom: 2 }}>{step.label}</Text>
                  {step.description ? <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", lineHeight: 17 }}>{step.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;
  const { accounts, currentUser } = useApp();
  const [currentView, setCurrentView] = useState<SubView>("menu");

  if (currentUser?.status === "suspended" || currentUser?.status === "blocked") {
    return <AccountRestrictedScreen topPad={topPad} />;
  }
  setCurrentViewGlobal = setCurrentView;

  const currencyCode = accounts[0]?.currencyCode ?? "COP";
  const currencySymbol = accounts[0]?.currencySymbol ?? "$";
  const banks = BANKS_BY_CURRENCY[currencyCode] ?? BANKS_BY_CURRENCY.COP;

  if (currentView === "qr")       return <QRCodeView onBack={() => setCurrentView("menu")} />;
  if (currentView === "transfer" || currentView === "transfiya") {
    return <TransferView onBack={() => setCurrentView("menu")} useBanks={banks}
      title={currentView === "transfiya" ? "A otro banco · Transfiya" : "Transferir plata"} />;
  }
  if (currentView === "recibir")  return <RecibirView onBack={() => setCurrentView("menu")} accounts={accounts} onQR={() => setCurrentView("qr")} />;
  if (currentView === "facturas" || currentView === "tarjetas") {
    if (currentView === "tarjetas") return <TarjetasView onBack={() => setCurrentView("menu")} />;
    return <FacturasView onBack={() => setCurrentView("menu")} currencyCode={currencyCode} currencySymbol={currencySymbol} />;
  }
  if (currentView === "recargar") return <RecargarView onBack={() => setCurrentView("menu")} currencyCode={currencyCode} currencySymbol={currencySymbol} />;
  if (currentView === "avances")  return <AvancesView onBack={() => setCurrentView("menu")} />;
  if (currentView === "inscribir") return <InscribirView onBack={() => setCurrentView("menu")} />;

  const TX_OPTIONS = [
    { icon: "maximize",    label: "QR\nCobrar/Pagar",    color: "#1C1C1E", bg: "#F5F5F7",  view: "qr" as SubView },
    { icon: "send",        label: "Transferir\nplata",    color: "#3B82F6", bg: "#EFF6FF",  view: "transfer" as SubView },
    { icon: "repeat",      label: "A otro banco\nTransfiya", color:"#10B981",bg:"#ECFDF5", view: "transfiya" as SubView },
    { icon: "download",    label: "Recibir\nplata",       color: "#8B5CF6", bg: "#EDE9FE",  view: "recibir" as SubView },
    { icon: "plus-circle", label: "Inscribir\nproductos", color: "#F59E0B", bg: "#FFFBEB",  view: "inscribir" as SubView },
    { icon: "credit-card", label: "Pagar tarjetas\ny créditos", color:"#EF4444",bg:"#FEF2F2", view: "tarjetas" as SubView },
    { icon: "file-text",   label: "Pagar\nfacturas",      color: "#6366F1", bg: "#EEF2FF",  view: "facturas" as SubView },
    { icon: "smartphone",  label: "Recargar\ncelular",    color: "#F59E0B", bg: "#FFFBEB",  view: "recargar" as SubView },
    { icon: "trending-up", label: "Avances y\ndesembolsos",color:"#06B6D4", bg: "#ECFEFF",  view: "avances" as SubView },
  ];

  return (
    <View style={[ms.container, { paddingTop: topPad }]}>
      <View style={ms.header}>
        <Text style={ms.title}>Transacciones</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={ms.grid}>
          {TX_OPTIONS.map((o) => (
            <TouchableOpacity key={o.label}
              style={[ms.item, { backgroundColor: o.bg, width: COL }]}
              onPress={() => setCurrentView(o.view)}
              activeOpacity={0.7}
            >
              <View style={[ms.iconWrap, { backgroundColor: o.color + "20" }]}>
                <Feather name={o.icon as any} size={22} color={o.color} />
              </View>
              <Text style={ms.itemLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════ STYLES ══ */
const sh = StyleSheet.create({
  header: { flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:"#E5E7EB",backgroundColor:"#FFFFFF" },
  headerTitle: { fontSize:17,fontWeight:"700",color:"#1C1C1E",fontFamily:"Inter_700Bold" },
  btn36: { width:36,height:36,alignItems:"center",justifyContent:"center" },
  tabs: { flexDirection:"row",borderBottomWidth:1,borderBottomColor:"#E5E7EB",backgroundColor:"#FFFFFF" },
  tabBtn: { flex:1,paddingVertical:14,alignItems:"center" },
  tabActive: { borderBottomWidth:2,borderBottomColor:"#1C1C1E" },
  tabText: { fontSize:15,fontFamily:"Inter_400Regular",color:"#6B7280" },
  tabTextActive: { fontFamily:"Inter_700Bold",color:"#1C1C1E" },
  qrContainer: { alignItems:"center",padding:24,gap:16 },
  qrLabel: { fontSize:16,fontWeight:"600",color:"#1C1C1E",fontFamily:"Inter_600SemiBold" },
  qrBox: { borderRadius:16,padding:16,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",position:"relative",borderWidth:2,borderColor:"#E5E7EB" },
  qrCornerTL:{position:"absolute",top:12,left:12,width:24,height:24,borderTopWidth:3,borderLeftWidth:3,borderColor:"#1C1C1E",borderRadius:2},
  qrCornerTR:{position:"absolute",top:12,right:12,width:24,height:24,borderTopWidth:3,borderRightWidth:3,borderColor:"#1C1C1E",borderRadius:2},
  qrCornerBL:{position:"absolute",bottom:12,left:12,width:24,height:24,borderBottomWidth:3,borderLeftWidth:3,borderColor:"#1C1C1E",borderRadius:2},
  qrCornerBR:{position:"absolute",bottom:12,right:12,width:24,height:24,borderBottomWidth:3,borderRightWidth:3,borderColor:"#1C1C1E",borderRadius:2},
  qrInner:{flexDirection:"row",flexWrap:"wrap",width:"70%",aspectRatio:1},
  qrCell:{width:"10%",aspectRatio:1,padding:1},
  qrCellFilled:{backgroundColor:"#1C1C1E",borderRadius:1},
  qrLogo:{position:"absolute",width:36,height:36,borderRadius:8,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:"#E5E7EB"},
  qrSub:{fontSize:13,color:"#6B7280",textAlign:"center",fontFamily:"Inter_400Regular",maxWidth:240},
  qrActionBtn:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#F5F5F7",borderRadius:14,paddingVertical:14,paddingHorizontal:20},
  qrActionBtnText:{fontSize:14,fontWeight:"600",color:"#1C1C1E",fontFamily:"Inter_600SemiBold"},
  scanContainer:{flex:1,backgroundColor:"#1C1C1E",alignItems:"center",justifyContent:"center",padding:32},
  scanArea:{width:240,height:240,position:"relative",alignItems:"center",justifyContent:"center"},
  scanCornerTL:{position:"absolute",top:0,left:0,width:32,height:32,borderTopWidth:3,borderLeftWidth:3,borderColor:"#FDDA24",borderRadius:2},
  scanCornerTR:{position:"absolute",top:0,right:0,width:32,height:32,borderTopWidth:3,borderRightWidth:3,borderColor:"#FDDA24",borderRadius:2},
  scanCornerBL:{position:"absolute",bottom:0,left:0,width:32,height:32,borderBottomWidth:3,borderLeftWidth:3,borderColor:"#FDDA24",borderRadius:2},
  scanCornerBR:{position:"absolute",bottom:0,right:0,width:32,height:32,borderBottomWidth:3,borderRightWidth:3,borderColor:"#FDDA24",borderRadius:2},
  scanText:{fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:"Inter_400Regular",textAlign:"center"},
  scanSub:{fontSize:13,color:"rgba(255,255,255,0.6)",textAlign:"center",marginTop:24,fontFamily:"Inter_400Regular"},
});

const tx = StyleSheet.create({
  header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:"#E5E7EB",backgroundColor:"#F5F5F7"},
  headerTitle:{fontSize:17,fontWeight:"700",color:"#1C1C1E",fontFamily:"Inter_700Bold"},
  btn36:{width:36,height:36,alignItems:"center",justifyContent:"center"},
  amountCard:{backgroundColor:"#1C1C1E",padding:28,paddingBottom:32},
  amountLabel:{color:"rgba(255,255,255,0.6)",fontSize:14,fontFamily:"Inter_400Regular",marginBottom:12},
  amountRow:{flexDirection:"row",alignItems:"center",gap:8},
  amountCurrency:{fontSize:28,fontWeight:"700",color:"#FFFFFF",fontFamily:"Inter_700Bold"},
  amountInput:{flex:1,fontSize:40,fontWeight:"700",color:"#FFFFFF",fontFamily:"Inter_700Bold",minWidth:80},
  amountCode:{fontSize:16,color:"rgba(255,255,255,0.5)",fontFamily:"Inter_400Regular"},
  accountAvail:{color:"rgba(255,255,255,0.5)",fontSize:13,fontFamily:"Inter_400Regular",marginTop:8},
  section:{padding:20},
  sectionTitle:{fontSize:15,fontWeight:"700",color:"#1C1C1E",fontFamily:"Inter_700Bold",marginBottom:12},
  searchWrap:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"#FFFFFF",borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginBottom:12,borderWidth:1,borderColor:"#E5E7EB"},
  searchInput:{flex:1,fontSize:16,fontFamily:"Inter_400Regular",color:"#1C1C1E"},
  contactRow:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#FFFFFF",borderRadius:14,padding:14,marginBottom:8,borderWidth:1.5,borderColor:"transparent"},
  contactRowActive:{borderColor:"#FDDA24",backgroundColor:"#FFFDF0"},
  contactAvatar:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center"},
  contactInitial:{fontSize:18,fontWeight:"700",color:"#FFFFFF",fontFamily:"Inter_700Bold"},
  contactName:{fontSize:15,fontWeight:"600",color:"#1C1C1E",fontFamily:"Inter_600SemiBold"},
  contactBank:{fontSize:12,color:"#6B7280",fontFamily:"Inter_400Regular",marginTop:2},
  checkCircle:{width:24,height:24,borderRadius:12,backgroundColor:"#10B981",alignItems:"center",justifyContent:"center"},
  newContactBtn:{flexDirection:"row",alignItems:"center",gap:8,paddingVertical:14,paddingHorizontal:16,borderRadius:14,borderWidth:1.5,borderStyle:"dashed",borderColor:"#3B82F6",backgroundColor:"transparent"},
  newContactText:{fontSize:14,fontWeight:"600",color:"#3B82F6",fontFamily:"Inter_600SemiBold"},
  noteSection:{paddingHorizontal:20,paddingBottom:8},
  noteInput:{backgroundColor:"#FFFFFF",borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:16,fontFamily:"Inter_400Regular",color:"#1C1C1E",borderWidth:1,borderColor:"#E5E7EB"},
  btn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,backgroundColor:"#FDDA24",borderRadius:14,paddingVertical:16,marginHorizontal:20,marginTop:16},
  btnDisabled:{opacity:0.4},
  btnText:{fontSize:16,fontWeight:"700",color:"#1C1C1E",fontFamily:"Inter_700Bold"},
  confirmCard:{backgroundColor:"#FFFFFF",borderRadius:16,padding:24,marginBottom:4},
  confirmName:{fontSize:18,fontWeight:"700",color:"#1C1C1E",fontFamily:"Inter_700Bold",textAlign:"center",marginBottom:4},
  confirmBank:{fontSize:13,color:"#6B7280",fontFamily:"Inter_400Regular",textAlign:"center"},
  confirmSep:{height:1,backgroundColor:"#E5E7EB",marginVertical:16},
  confirmRow:{flexDirection:"row",justifyContent:"space-between",marginBottom:10},
  confirmLabel:{fontSize:14,color:"#6B7280",fontFamily:"Inter_400Regular"},
  confirmValue:{fontSize:14,fontWeight:"600",color:"#1C1C1E",fontFamily:"Inter_600SemiBold",flex:1,textAlign:"right"},
});

const ms = StyleSheet.create({
  container:{flex:1,backgroundColor:"#F5F5F7"},
  header:{backgroundColor:"#00C072",paddingHorizontal:24,paddingVertical:18,paddingBottom:22},
  title:{fontSize:24,fontWeight:"700",color:"#FFFFFF",fontFamily:"Inter_700Bold"},
  grid:{flexDirection:"row",flexWrap:"wrap",padding:12,gap:10},
  item:{borderRadius:16,padding:12,alignItems:"center",gap:8,minHeight:100,justifyContent:"center"},
  iconWrap:{width:48,height:48,borderRadius:14,alignItems:"center",justifyContent:"center"},
  itemLabel:{fontSize:11,color:"#1C1C1E",fontFamily:"Inter_500Medium",textAlign:"center",lineHeight:15},
});
