import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Account, RegisteredUser } from "@/context/AppContext";
import { DateInput } from "@/components/DateInput";

const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";
const PURPLE = "#8B5CF6";

const TYPE_LABEL: Record<string, string> = { savings: "Ahorros", checking: "Corriente", credit: "Crédito" };
const TYPE_COLOR: Record<string, string> = { savings: GREEN, checking: BLUE, credit: ORANGE };
const STATUS_COLOR: Record<string, string> = { active: GREEN, suspended: ORANGE, blocked: RED };
const STATUS_LABEL: Record<string, string> = { active: "Activa", suspended: "Suspendida", blocked: "Bloqueada" };

const CATEGORIES = [
  "Transferencias", "Nómina", "Pago de servicios", "Consignación", "Retiro",
  "Crédito", "Ajuste", "Devolución", "Otros",
];

type AccountWithUser = Account & { userName: string; userDoc: string; userEmail: string; userId: string };

export default function CuentasScreen() {
  const { getAllAccounts, getAllUsers, updateAccount, adminAddBalance, addAuditLog } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;

  const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AccountWithUser | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editBalance, setEditBalance] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "blocked">("active");
  const [loading, setLoading] = useState(true);

  const [txModal, setTxModal] = useState(false);
  const [txAccount, setTxAccount] = useState<AccountWithUser | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txSign, setTxSign] = useState<"credit" | "debit">("credit");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [txCategory, setTxCategory] = useState("Transferencias");
  const [txError, setTxError] = useState("");
  const [txSaving, setTxSaving] = useState(false);

  const load = useCallback(async () => {
    const [u, a] = await Promise.all([getAllUsers(), getAllAccounts()]);
    const regularUsers = u.filter((x) => !x.isAdmin);
    setAccounts(
      a.map((acc) => {
        const owner = regularUsers.find((usr) => acc.userId === usr.id);
        return {
          ...acc,
          userName: owner ? `${owner.firstName} ${owner.lastName}` : "—",
          userDoc: owner?.documentNumber ?? "—",
          userEmail: owner?.email ?? "—",
          userId: owner?.id ?? acc.userId ?? "",
        };
      })
    );
    setLoading(false);
  }, [getAllAccounts, getAllUsers]);

  useEffect(() => { load(); }, []);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.userName.toLowerCase().includes(q) ||
      a.userDoc.toLowerCase().includes(q) ||
      a.number.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.userEmail.toLowerCase().includes(q)
    );
  });

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openEdit = (a: AccountWithUser) => {
    setSelected(a);
    setEditBalance(String(a.balance));
    setEditStatus((a.status as any) ?? "active");
    setEditModal(true);
  };

  const openAddTx = (a: AccountWithUser) => {
    setTxAccount(a);
    setTxAmount("");
    setTxDesc("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxCategory("Transferencias");
    setTxSign("credit");
    setTxError("");
    setTxModal(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const newBalance = Number(editBalance) || 0;
    await updateAccount(selected.userId, selected.id, { balance: newBalance, status: editStatus });
    await addAuditLog("EDIT_ACCOUNT", `Cuenta ${selected.number} actualizada: saldo=${newBalance}, estado=${editStatus}`, selected.userId);
    setEditModal(false);
    load();
  };

  const saveTx = async () => {
    setTxError("");
    if (!txAmount.trim() || isNaN(Number(txAmount)) || Number(txAmount) <= 0)
      return setTxError("Ingresa un monto válido mayor a 0");
    if (!txDesc.trim())
      return setTxError("Ingresa una descripción para el movimiento");
    if (!txDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(txDate))
      return setTxError("Selecciona o ingresa una fecha válida");
    if (!txAccount) return;

    setTxSaving(true);
    const amount = txSign === "credit" ? Number(txAmount) : -Number(txAmount);
    await adminAddBalance(txAccount.userId, txAccount.id, amount, txDesc, txDate, txCategory);
    setTxSaving(false);
    setTxModal(false);
    load();
  };

  const fmtCurrency = (n: number, code: string = "COP", locale: string = "es-CO") => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${n.toLocaleString("es-CO")} ${code}`;
    }
  };
  const fmt = (n: number) => fmtCurrency(n, txAccount?.currencyCode ?? "COP");

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image source={require("../../assets/images/pwa-icon.png")} style={{ width: 26, height: 26, borderRadius: 6 }} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Cuentas</Text>
            <Text style={styles.sub}>{accounts.length} cuentas · Total: {fmtCurrency(totalBalance, "COP")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por usuario, número, email..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando cuentas...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados</Text>
        ) : (
          filtered.map((a) => (
            <TouchableOpacity
              key={`${a.userId}_${a.id}`}
              style={styles.card}
              onPress={() => setSelected(selected?.id === a.id && selected?.userId === a.userId ? null : a)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typeTag, { backgroundColor: TYPE_COLOR[a.type] + "22", borderColor: TYPE_COLOR[a.type] + "44" }]}>
                  <Text style={[styles.typeText, { color: TYPE_COLOR[a.type] }]}>{TYPE_LABEL[a.type]}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: STATUS_COLOR[a.status ?? "active"] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[a.status ?? "active"] }]}>
                    {STATUS_LABEL[a.status ?? "active"]}
                  </Text>
                </View>
              </View>

              <Text style={styles.accountNumber}>{a.number}</Text>
              <Text style={styles.accountName}>{a.name}</Text>
              <Text style={styles.accountBalance}>{a.currencySymbol ?? "$"} {a.balance.toLocaleString("es-CO")}</Text>
              <Text style={styles.accountOwner}>
                {a.userName} · {a.userDoc}
              </Text>

              {selected?.id === a.id && selected?.userId === a.userId && (
                <View style={styles.detail}>
                  <DetailRow label="ID cuenta" value={a.id} />
                  <DetailRow label="Tipo" value={TYPE_LABEL[a.type]} />
                  <DetailRow label="Moneda" value={`${a.currency} (${a.currencyCode})`} />
                  <DetailRow label="Estado" value={STATUS_LABEL[a.status ?? "active"]} />
                  <DetailRow label="Titular" value={a.userName} />
                  <DetailRow label="Email" value={a.userEmail} />
                  <DetailRow label="Documento" value={a.userDoc} />
                  <DetailRow label="ID usuario" value={a.userId} />
                  <DetailRow label="Creada" value={a.createdAt ? new Date(a.createdAt).toLocaleString("es-CO") : "—"} />

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(a)}>
                      <Feather name="edit-2" size={13} color={YELLOW} />
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.txBtn} onPress={() => openAddTx(a)}>
                      <Feather name="plus-circle" size={13} color={GREEN} />
                      <Text style={styles.txBtnText}>Agregar movimiento</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Cuenta</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editLabel}>Saldo directo ({selected?.currencyCode ?? "COP"})</Text>
            <TextInput
              style={styles.editInput}
              value={editBalance}
              onChangeText={setEditBalance}
              keyboardType="numeric"
              placeholderTextColor={TEXTSEC}
            />

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Estado</Text>
            <View style={styles.statusOptions}>
              {(["active", "suspended", "blocked"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOpt, { borderColor: STATUS_COLOR[s], backgroundColor: editStatus === s ? STATUS_COLOR[s] + "33" : "transparent" }]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.statusOptText, { color: STATUS_COLOR[s] }]}>{STATUS_LABEL[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD TRANSACTION MODAL */}
      <Modal visible={txModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Agregar Movimiento</Text>
                {txAccount && (
                  <Text style={styles.modalSub}>{txAccount.name} · {txAccount.number}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setTxModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Tipo de movimiento</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.typeOpt, { borderColor: GREEN, backgroundColor: txSign === "credit" ? GREEN + "33" : "transparent" }]}
                  onPress={() => setTxSign("credit")}
                >
                  <Feather name="arrow-down-circle" size={16} color={GREEN} />
                  <Text style={[styles.typeOptText, { color: GREEN }]}>Ingreso / Crédito</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOpt, { borderColor: RED, backgroundColor: txSign === "debit" ? RED + "33" : "transparent" }]}
                  onPress={() => setTxSign("debit")}
                >
                  <Feather name="arrow-up-circle" size={16} color={RED} />
                  <Text style={[styles.typeOptText, { color: RED }]}>Egreso / Débito</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.editLabel}>Monto ({txAccount?.currencyCode ?? "COP"}) *</Text>
              <TextInput
                style={styles.editInput}
                value={txAmount}
                onChangeText={setTxAmount}
                keyboardType="numeric"
                placeholder="Ej. 150000"
                placeholderTextColor={TEXTSEC}
              />

              <Text style={[styles.editLabel, { marginTop: 14 }]}>Nombre del movimiento *</Text>
              <TextInput
                style={styles.editInput}
                value={txDesc}
                onChangeText={setTxDesc}
                placeholder="Ej. Nómina enero, Consignación, Ajuste..."
                placeholderTextColor={TEXTSEC}
              />

              <Text style={[styles.editLabel, { marginTop: 14 }]}>Fecha del movimiento *</Text>
              <DateInput
                value={txDate}
                onChange={setTxDate}
                outputFormat="YMD"
                isDark
                maxDate={new Date().toISOString().slice(0, 10)}
              />

              <Text style={[styles.editLabel, { marginTop: 14 }]}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, txCategory === cat && styles.catBtnActive]}
                      onPress={() => setTxCategory(cat)}
                    >
                      <Text style={[styles.catText, txCategory === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {txAccount && txAmount && !isNaN(Number(txAmount)) && Number(txAmount) > 0 && (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Vista previa del saldo</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItem}>Saldo actual</Text>
                    <Text style={styles.previewValue}>{fmt(txAccount.balance)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItem}>{txSign === "credit" ? "Crédito" : "Débito"}</Text>
                    <Text style={[styles.previewValue, { color: txSign === "credit" ? GREEN : RED }]}>
                      {txSign === "credit" ? "+" : "-"}{fmt(Number(txAmount))}
                    </Text>
                  </View>
                  <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 }]}>
                    <Text style={[styles.previewItem, { fontFamily: "Inter_700Bold", color: TEXT }]}>Nuevo saldo</Text>
                    <Text style={[styles.previewValue, { color: YELLOW, fontFamily: "Inter_700Bold" }]}>
                      {fmt(txAccount.balance + (txSign === "credit" ? Number(txAmount) : -Number(txAmount)))}
                    </Text>
                  </View>
                </View>
              )}

              {txError ? <Text style={styles.errorText}>{txError}</Text> : null}

              <TouchableOpacity style={[styles.saveBtn, { marginTop: 8 }]} onPress={saveTx} disabled={txSaving}>
                <Text style={styles.saveBtnText}>{txSaving ? "Guardando..." : "Confirmar movimiento"}</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={styles.dValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT },
  card: { backgroundColor: CARD, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14 },
  cardTop: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  statusTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  accountNumber: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, letterSpacing: 1, marginBottom: 2 },
  accountName: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginBottom: 6 },
  accountBalance: { fontSize: 20, fontFamily: "Inter_700Bold", color: YELLOW, marginBottom: 4 },
  accountOwner: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  dLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  dValue: { fontSize: 11, fontFamily: "Inter_500Medium", color: TEXT, flex: 1, textAlign: "right", marginLeft: 8 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: YELLOW + "15", borderRadius: 10, borderWidth: 1, borderColor: YELLOW + "40", paddingVertical: 10 },
  editBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: YELLOW },
  txBtn: { flex: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN + "15", borderRadius: 10, borderWidth: 1, borderColor: GREEN + "40", paddingVertical: 10 },
  txBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: GREEN },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#161B2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "94%", borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT },
  modalSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 6 },
  editInput: { backgroundColor: "#0F1320", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular", color: TEXT, marginBottom: 4 },
  statusOptions: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statusOpt: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  statusOptText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  typeOpt: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 12 },
  typeOptText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  catBtnActive: { backgroundColor: YELLOW + "22", borderColor: YELLOW + "60" },
  catText: { fontSize: 11, fontFamily: "Inter_500Medium", color: TEXTSEC },
  catTextActive: { color: YELLOW, fontFamily: "Inter_600SemiBold" },
  preview: { backgroundColor: "#0A0E1A", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  previewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: TEXTSEC, letterSpacing: 0.8, marginBottom: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  previewItem: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC },
  previewValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: TEXT },
  saveBtn: { backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1C1C1E" },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: RED, textAlign: "center", marginBottom: 10 },
});
