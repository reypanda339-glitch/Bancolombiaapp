import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";

const YELLOW = "#FDDA24";
const GREEN = "#00C072";
const PURPLE = "#8B5CF6";
const ORANGE = "#F59E0B";

/* ─── helpers ─── */
function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

/* ══════════════════════════════════════════════════════════════
   BOLSILLOS
══════════════════════════════════════════════════════════════ */
type Bolsillo = { id: string; name: string; saved: number; goal: number | null; color: string; emoji: string };

const INITIAL_BOLSILLOS: Bolsillo[] = [
  { id: "1", name: "Viaje a España", saved: 4500000, goal: 18000000, color: "#8B5CF6", emoji: "✈️" },
  { id: "2", name: "Viaje México",   saved: 1200000, goal: 5000000,  color: "#F59E0B", emoji: "🌮" },
  { id: "3", name: "Gastos de la U", saved: 200000,  goal: null,     color: "#10B981", emoji: "🎓" },
];

function BolsillosView({ isDark, C }: { isDark: boolean; C: any }) {
  const { accounts, addTransaction } = useApp();
  const [bolsillos, setBolsillos] = useState(INITIAL_BOLSILLOS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [selectedBolsillo, setSelectedBolsillo] = useState<Bolsillo | null>(null);
  const [abonoAmount, setAbonoAmount] = useState("");
  const [showAbono, setShowAbono] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) { Alert.alert("Nombre requerido", "Ingresa un nombre para tu bolsillo."); return; }
    setBolsillos((prev) => [...prev, {
      id: Date.now().toString(), name: newName.trim(), saved: 0,
      goal: newGoal ? parseInt(newGoal.replace(/\D/g, "")) : null,
      color: ["#8B5CF6","#F59E0B","#10B981","#3B82F6","#EF4444"][prev.length % 5],
      emoji: ["💰","🏠","🎯","✈️","📚"][prev.length % 5],
    }]);
    setNewName(""); setNewGoal(""); setShowCreate(false);
    Alert.alert("✅ Bolsillo creado", `Tu bolsillo "${newName.trim()}" está listo. Empieza a ahorrar.`);
  };

  const handleAbono = async () => {
    if (!selectedBolsillo) return;
    const amount = parseInt(abonoAmount.replace(/\D/g, "") || "0");
    if (!amount || amount < 1000) { Alert.alert("Monto inválido", "El monto mínimo de abono es $ 1.000."); return; }
    const account = accounts[0];
    if (!account) { Alert.alert("Sin cuenta", "No tienes una cuenta activa."); return; }
    if (amount > account.balance) { Alert.alert("Saldo insuficiente", `Tu saldo disponible es ${formatCOP(account.balance)}.`); return; }
    try {
      await addTransaction(account.userId, {
        accountId: account.id, userId: account.userId,
        date: new Date().toISOString().split("T")[0],
        description: `Abono bolsillo "${selectedBolsillo.name}"`,
        amount: -amount, type: "debit", category: "Ahorro", status: "completed",
      });
      setBolsillos((prev) => prev.map((b) => b.id === selectedBolsillo.id ? { ...b, saved: b.saved + amount } : b));
      setShowAbono(false); setAbonoAmount(""); setSelectedBolsillo(null);
      Alert.alert("✅ Abono exitoso", `Se abonaron ${formatCOP(amount)} al bolsillo "${selectedBolsillo.name}".`);
    } catch { Alert.alert("Error", "No se pudo realizar el abono."); }
  };

  const handleBolsilloMenu = (b: Bolsillo) => {
    Alert.alert(b.name, `Ahorrado: ${formatCOP(b.saved)}${b.goal ? `\nMeta: ${formatCOP(b.goal)}` : ""}`, [
      { text: "Abonar", onPress: () => { setSelectedBolsillo(b); setShowAbono(true); } },
      { text: "Retirar", onPress: () => Alert.alert("Retirar", `¿Deseas retirar el saldo de "${b.name}" a tu cuenta principal?`, [
          { text: "Cancelar", style: "cancel" },
          { text: "Retirar todo", onPress: () => {
            setBolsillos((prev) => prev.map((x) => x.id === b.id ? { ...x, saved: 0 } : x));
            Alert.alert("✅ Retiro exitoso", `${formatCOP(b.saved)} devueltos a tu cuenta.`);
          }},
        ])
      },
      { text: "Eliminar bolsillo", style: "destructive", onPress: () =>
          Alert.alert("Eliminar", `¿Eliminar el bolsillo "${b.name}"?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: () => setBolsillos((prev) => prev.filter((x) => x.id !== b.id)) },
          ])
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "#7C3AED", padding: 24, paddingBottom: 32 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginBottom: 4 }}>Explorar</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 4 }}>Tus bolsillos</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }}>Ahorra para tus metas con bolsillos separados</Text>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          {bolsillos.map((b) => {
            const pct = b.goal ? Math.min((b.saved / b.goal) * 100, 100) : null;
            return (
              <TouchableOpacity key={b.id} style={[bS.item, { backgroundColor: C.surface }]} onPress={() => handleBolsilloMenu(b)} activeOpacity={0.8}>
                <View style={[bS.itemIcon, { backgroundColor: b.color + "20" }]}>
                  <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={bS.itemRow}>
                    <Text style={[bS.itemName, { color: C.text }]}>{b.name}</Text>
                    <TouchableOpacity onPress={() => handleBolsilloMenu(b)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Feather name="more-vertical" size={18} color={C.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[bS.itemSaved, { color: C.text }]}>{formatCOP(b.saved)}</Text>
                  {b.goal ? (
                    <>
                      <Text style={[bS.itemGoal, { color: C.textSecondary }]}>Meta: {formatCOP(b.goal)} · {Math.round(pct ?? 0)}%</Text>
                      <View style={[bS.progressBg, { backgroundColor: isDark ? "#2A2A2C" : "#F0F0F0" }]}>
                        <View style={[bS.progressFill, { width: `${pct}%` as any, backgroundColor: b.color }]} />
                      </View>
                    </>
                  ) : (
                    <Text style={[bS.itemGoal, { color: C.textSecondary }]}>Sin meta de ahorro</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[bS.footer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TouchableOpacity style={bS.createBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={18} color="#1C1C1E" />
          <Text style={bS.createBtnText}>Crear bolsillo</Text>
        </TouchableOpacity>
      </View>

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[bS.modal, { backgroundColor: C.surface }]}>
            <Text style={[bS.modalTitle, { color: C.text }]}>Nuevo bolsillo</Text>
            <Text style={[bS.modalLabel, { color: C.textSecondary }]}>Nombre del bolsillo</Text>
            <TextInput style={[bS.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={newName} onChangeText={setNewName} placeholder="Ej: Vacaciones 2027" placeholderTextColor={C.textLight} />
            <Text style={[bS.modalLabel, { color: C.textSecondary }]}>Meta de ahorro (opcional)</Text>
            <TextInput style={[bS.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={newGoal} onChangeText={setNewGoal} placeholder="$ 0" placeholderTextColor={C.textLight} keyboardType="numeric" />
            <View style={bS.modalBtns}>
              <TouchableOpacity style={[bS.modalCancelBtn, { backgroundColor: isDark ? "#2A2A2C" : "#F5F5F7" }]} onPress={() => setShowCreate(false)}>
                <Text style={[bS.modalCancelText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bS.modalConfirmBtn} onPress={handleCreate}>
                <Text style={bS.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Abono modal */}
      <Modal visible={showAbono} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[bS.modal, { backgroundColor: C.surface }]}>
            <Text style={[bS.modalTitle, { color: C.text }]}>Abonar a "{selectedBolsillo?.name}"</Text>
            <Text style={[bS.modalLabel, { color: C.textSecondary }]}>Monto a abonar</Text>
            <TextInput style={[bS.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={abonoAmount} onChangeText={setAbonoAmount} placeholder="$ 0" placeholderTextColor={C.textLight} keyboardType="numeric" autoFocus />
            <View style={bS.modalBtns}>
              <TouchableOpacity style={[bS.modalCancelBtn, { backgroundColor: isDark ? "#2A2A2C" : "#F5F5F7" }]} onPress={() => setShowAbono(false)}>
                <Text style={[bS.modalCancelText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bS.modalConfirmBtn} onPress={handleAbono}>
                <Text style={bS.modalConfirmText}>Abonar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   DÍA A DÍA
══════════════════════════════════════════════════════════════ */
const DDA_CATEGORIES = [
  { cat: "Alimentación",    icon: "coffee" as const,          pct: 35, amount: 432250, color: "#F59E0B",
    detail: "Restaurantes, mercado y delivery. Tu categoría con mayor gasto este mes." },
  { cat: "Transporte",      icon: "navigation" as const,      pct: 20, amount: 247000, color: "#3B82F6",
    detail: "Gasolina, Uber, taxi y transporte público. Considera carpooling para ahorrar." },
  { cat: "Entretenimiento", icon: "music" as const,           pct: 15, amount: 185250, color: "#8B5CF6",
    detail: "Streaming, cine, conciertos y salidas. Puedes establecer un límite mensual." },
  { cat: "Servicios",       icon: "zap" as const,             pct: 18, amount: 222300, color: "#10B981",
    detail: "Energía, agua, internet, gas y servicios del hogar. Gastos fijos del mes." },
  { cat: "Otros",           icon: "more-horizontal" as const, pct: 12, amount: 148200, color: "#6B7280",
    detail: "Gastos varios no clasificados. Revisa estos movimientos para optimizar tu presupuesto." },
];

function DiaADiaView({ isDark, C }: { isDark: boolean; C: any }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.background }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: GREEN, padding: 24, paddingBottom: 32 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 4 }}>Día a Día</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }}>Controla tus gastos del mes</Text>
      </View>
      <View style={[eS.ddCard, { backgroundColor: C.surface, marginTop: -16 }]}>
        <Text style={[eS.ddCardLabel, { color: C.textSecondary }]}>Gastos este mes</Text>
        <Text style={[eS.ddCardAmount, { color: C.text }]}>$ 1.235.000</Text>
        <View style={[eS.ddBar, { backgroundColor: isDark ? "#2A2A2C" : "#F0F0F0" }]}>
          <View style={[eS.ddBarFill, { width: "62%", backgroundColor: GREEN }]} />
        </View>
        <Text style={[eS.ddBarLabel, { color: C.textSecondary }]}>62% del presupuesto mensual ($ 2.000.000)</Text>
        <TouchableOpacity
          style={{ marginTop: 12, backgroundColor: isDark ? "#2A2A2C" : "#F5F5F7", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
          onPress={() => Alert.alert("Editar presupuesto", "Ingresa tu presupuesto mensual para hacer seguimiento de tus gastos.", [
            { text: "$ 1.500.000", onPress: () => {} }, { text: "$ 2.000.000", onPress: () => {} },
            { text: "$ 3.000.000", onPress: () => {} }, { text: "Personalizado", onPress: () => {} },
            { text: "Cancelar", style: "cancel" },
          ])}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: "Inter_600SemiBold" }}>Editar presupuesto</Text>
        </TouchableOpacity>
      </View>
      {DDA_CATEGORIES.map((item) => (
        <TouchableOpacity
          key={item.cat}
          style={[eS.ddItem, { backgroundColor: C.surface }]}
          onPress={() => Alert.alert(item.cat, `${item.detail}\n\nGasto del mes: ${formatCOP(item.amount)}\n${item.pct}% de tu presupuesto`, [
            { text: "Ver movimientos", onPress: () => {} }, { text: "Cerrar", style: "cancel" },
          ])}
          activeOpacity={0.8}
        >
          <View style={[eS.ddItemIcon, { backgroundColor: item.color + "20" }]}>
            <Feather name={item.icon} size={20} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={eS.ddItemRow}>
              <Text style={[eS.ddItemCat, { color: C.text }]}>{item.cat}</Text>
              <Text style={[eS.ddItemAmt, { color: C.text }]}>{formatCOP(item.amount)}</Text>
            </View>
            <View style={[eS.ddItemBar, { backgroundColor: isDark ? "#2A2A2C" : "#F0F0F0" }]}>
              <View style={[eS.ddItemBarFill, { width: `${item.pct}%` as any, backgroundColor: item.color }]} />
            </View>
            <Text style={{ fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 }}>{item.pct}% del total</Text>
          </View>
          <Feather name="chevron-right" size={14} color={C.textLight} />
        </TouchableOpacity>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOGAR & TRANSPORTE SERVICES
══════════════════════════════════════════════════════════════ */
const HOGAR_SERVICES = [
  { icon: "smartphone" as const, label: "Recargar\ncelular",   color: "#10B981",
    action: (nav: () => void) => nav() },
  { icon: "home" as const,       label: "Tu360\nInmobiliario", color: "#3B82F6",
    action: () => Alert.alert("Tu360 Inmobiliario", "Busca, arrienda o compra vivienda con Bancolombia.\n\n• Crédito hipotecario\n• Leasing habitacional\n• Subsidio de vivienda", [
      { text: "Conocer más", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
      { text: "Cerrar", style: "cancel" },
    ])
  },
  { icon: "zap" as const,        label: "Pagar\nservicios",    color: "#F59E0B",
    action: (nav: () => void) => Alert.alert("Pagar servicios públicos", "Selecciona el servicio a pagar:", [
      { text: "Energía – EPM", onPress: () => {} },
      { text: "Agua – EAAB", onPress: () => {} },
      { text: "Gas – Vanti", onPress: () => {} },
      { text: "Ver todos", onPress: nav },
      { text: "Cancelar", style: "cancel" },
    ])
  },
  { icon: "shield" as const,     label: "Seguros",             color: "#8B5CF6",
    action: () => Alert.alert("Seguros Bancolombia", "Protege lo que más importa:\n\n🏠 Seguro de hogar\n🚗 Seguro de vehículo\n❤️ Seguro de vida\n🏥 Seguro de salud", [
      { text: "Cotizar seguro", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
      { text: "Cerrar", style: "cancel" },
    ])
  },
];

const TRANSPORTE_SERVICES = [
  { icon: "credit-card" as const, label: "Recargar\ntransporte", color: "#3B82F6",
    action: () => Alert.alert("Recargar transporte", "Selecciona la ciudad y el tipo de tarjeta:", [
      { text: "Bogotá · Tullave", onPress: () => Alert.alert("Recarga Tullave", "Ingresa el número de tu tarjeta Tullave para recargar en línea.") },
      { text: "Medellín · Cívica", onPress: () => Alert.alert("Recarga Cívica", "Ingresa el número de tu tarjeta Cívica para recargar.") },
      { text: "Cali · Mi Cali", onPress: () => Alert.alert("Recarga Mi Cali", "Ingresa el número de tu tarjeta Mi Cali para recargar.") },
      { text: "Cancelar", style: "cancel" },
    ])
  },
  { icon: "map-pin" as const,    label: "Muéveme",             color: "#10B981",
    action: () => Alert.alert("Muéveme", "Conecta con conductores de confianza usando tu cuenta Bancolombia.\n\nPaga tus viajes directamente desde la app.", [
      { text: "Abrir Muéveme", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
      { text: "Cerrar", style: "cancel" },
    ])
  },
  { icon: "navigation" as const, label: "Tu360\nMovilidad",    color: "#F59E0B",
    action: () => Alert.alert("Tu360 Movilidad", "Administra tus gastos de movilidad:\n\n• Gasolina\n• Mantenimiento\n• Seguros vehículo\n• SOAT", [
      { text: "Conocer más", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
      { text: "Cerrar", style: "cancel" },
    ])
  },
  { icon: "truck" as const,      label: "Servicios\nvehículo", color: "#6B7280",
    action: () => Alert.alert("Servicios vehículo", "Gestiona tus gastos vehiculares:\n\n• Pago de SOAT\n• Revisión tecnomecánica\n• Multas de tránsito\n• Impuesto vehículo", [
      { text: "Pagar SOAT", onPress: () => Alert.alert("SOAT", "Ingresa la placa de tu vehículo para consultar y pagar tu SOAT.") },
      { text: "Cerrar", style: "cancel" },
    ])
  },
];

/* ══════════════════════════════════════════════════════════════
   EXPLORAR MAIN VIEW
══════════════════════════════════════════════════════════════ */
function ExplorarView({ isDark, C, onNavigateRecargar, onNavigateFacturas }: {
  isDark: boolean; C: any;
  onNavigateRecargar: () => void;
  onNavigateFacturas: () => void;
}) {
  const [subView, setSubView] = useState<"main" | "bolsillos" | "diaadia">("main");

  if (subView === "bolsillos") {
    return (
      <View style={{ flex: 1 }}>
        <View style={[eS.subHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <TouchableOpacity style={eS.backBtn} onPress={() => setSubView("main")}>
            <Feather name="chevron-left" size={22} color={C.text} />
            <Text style={[eS.backText, { color: C.text }]}>Volver</Text>
          </TouchableOpacity>
        </View>
        <BolsillosView isDark={isDark} C={C} />
      </View>
    );
  }

  if (subView === "diaadia") {
    return (
      <View style={{ flex: 1 }}>
        <View style={[eS.subHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <TouchableOpacity style={eS.backBtn} onPress={() => setSubView("main")}>
            <Feather name="chevron-left" size={22} color={C.text} />
            <Text style={[eS.backText, { color: C.text }]}>Volver</Text>
          </TouchableOpacity>
        </View>
        <DiaADiaView isDark={isDark} C={C} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.background }} showsVerticalScrollIndicator={false} bounces>
      <View style={[eS.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[eS.title, { color: C.text }]}>Explorar</Text>
      </View>

      {/* ── Organiza tu plata ── */}
      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Organiza tu plata</Text>
        <View style={eS.organizeRow}>
          <TouchableOpacity
            style={[eS.organizeCard, { backgroundColor: isDark ? "#2D1F5A" : "#EDE9FE" }]}
            onPress={() => setSubView("diaadia")}
          >
            <View style={[eS.organizeIcon, { backgroundColor: PURPLE }]}>
              <Feather name="bar-chart-2" size={22} color="#FFFFFF" />
            </View>
            <Text style={[eS.organizeLabel, { color: C.text }]}>Día a Día</Text>
            <Text style={{ fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }}>
              Controla tus gastos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[eS.organizeCard, { backgroundColor: isDark ? "#3B2A0F" : "#FEF3C7" }]}
            onPress={() => setSubView("bolsillos")}
          >
            <View style={[eS.organizeIcon, { backgroundColor: ORANGE }]}>
              <Feather name="target" size={22} color="#FFFFFF" />
            </View>
            <Text style={[eS.organizeLabel, { color: C.text }]}>Bolsillos</Text>
            <Text style={{ fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }}>
              Ahorra para tus metas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hogar y servicios ── */}
      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Hogar y servicios</Text>
        <View style={eS.servicesGrid}>
          {HOGAR_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label} style={eS.serviceItem}
              onPress={() => s.action(s.label.includes("Recargar") ? onNavigateRecargar : onNavigateFacturas)}
            >
              <View style={[eS.serviceIcon, { backgroundColor: s.color + (isDark ? "30" : "18") }]}>
                <Feather name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={[eS.serviceLabel, { color: C.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Transporte ── */}
      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Transporte</Text>
        <View style={eS.servicesGrid}>
          {TRANSPORTE_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label} style={eS.serviceItem}
              onPress={() => s.action()}
            >
              <View style={[eS.serviceIcon, { backgroundColor: s.color + (isDark ? "30" : "18") }]}>
                <Feather name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={[eS.serviceLabel, { color: C.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Inversiones ── */}
      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Inversiones y ahorro</Text>
        {[
          { label: "CDT Bancolombia", desc: "Desde 6% EA · Plazos desde 30 días", color: "#3B82F6", icon: "trending-up" as const },
          { label: "Fondos de inversión", desc: "Diversifica tu portafolio", color: "#10B981", icon: "activity" as const },
          { label: "Acciones en bolsa", desc: "Invierte en empresas colombianas", color: "#8B5CF6", icon: "bar-chart-2" as const },
        ].map((inv, i, arr) => (
          <TouchableOpacity
            key={inv.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14,
              borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: isDark ? "#2A2A2C" : "#F0F0F0" }}
            onPress={() => Alert.alert(inv.label, `${inv.desc}\n\nContacta a un asesor Bancolombia para más información sobre este producto.`, [
              { text: "Conocer más", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
              { text: "Cerrar", style: "cancel" },
            ])}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: inv.color + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={inv.icon} size={20} color={inv.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" }}>{inv.label}</Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 }}>{inv.desc}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
function PaymentRestrictedScreen({ topPad, C }: { topPad: number; C: any }) {
  const { currentUser } = useApp();
  const u = currentUser;
  const isBlocked = u?.status === "blocked";
  const color = isBlocked ? "#EF4444" : "#F59E0B";
  const steps = u?.unblockSteps ?? [];
  const docs = u?.requiredDocuments ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: C.background, paddingTop: topPad }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" }}>Explora</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ backgroundColor: color + "15", borderRadius: 16, borderWidth: 1.5, borderColor: color + "50", padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Feather name={isBlocked ? "lock" : "alert-triangle"} size={22} color={color} />
            <Text style={{ fontSize: 17, fontWeight: "700", color, fontFamily: "Inter_700Bold" }}>
              {isBlocked ? "Cuenta bloqueada" : "Cuenta suspendida"}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 19 }}>
            Tu cuenta tiene restricciones. No puedes realizar pagos ni transacciones en este momento.
          </Text>
          {u?.suspensionReason ? (
            <View style={{ marginTop: 12, backgroundColor: C.surface, borderRadius: 10, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.textSecondary, letterSpacing: 0.8, marginBottom: 4 }}>MOTIVO</Text>
              <Text style={{ fontSize: 13, color: C.text, fontFamily: "Inter_400Regular" }}>{u.suspensionReason}</Text>
            </View>
          ) : null}
        </View>
        {docs.length > 0 && (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", marginBottom: 12 }}>📄 Documentos requeridos</Text>
            {docs.map((doc, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: "#60A5FA", fontWeight: "700" }}>{i + 1}.</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 19 }}>{doc}</Text>
              </View>
            ))}
          </View>
        )}
        {steps.length > 0 && (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 18 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", marginBottom: 14 }}>📋 Pasos para desbloquear</Text>
            {steps.map((step, i) => (
              <View key={step.id} style={{ flexDirection: "row", gap: 12, marginBottom: i < steps.length - 1 ? 14 : 0 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#7C3AED30", borderWidth: 1.5, borderColor: "#A78BFA", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A78BFA" }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" }}>{step.label}</Text>
                  {step.description ? <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{step.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function ExplorarScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 20;
  const { C, isDark } = useTheme();
  const { currentUser } = useApp();
  const [subNav, setSubNav] = useState<"main" | "recargar" | "facturas">("main");

  if (currentUser?.status === "suspended" || currentUser?.status === "blocked") {
    return <PaymentRestrictedScreen topPad={topPad} C={C} />;
  }

  // Simple inline recargar/facturas views navigated from Hogar services
  if (subNav === "recargar") {
    return (
      <View style={[{ flex: 1, paddingTop: topPad, backgroundColor: "#FFFFFF" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
          <TouchableOpacity style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }} onPress={() => setSubNav("main")}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" }}>Recargar celular</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 14, color: "#6B7280", fontFamily: "Inter_400Regular" }}>Recarga tu celular desde tu cuenta Bancolombia de forma rápida y segura.</Text>
          {["Claro","Movistar","Tigo","WOM","Virgin Mobile"].map((op) => (
            <TouchableOpacity key={op}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#F5F5F7", borderRadius: 14, padding: 16 }}
              onPress={() => Alert.alert(`Recargar ${op}`, "Ingresa el número de celular y el valor de la recarga.", [
                { text: "$ 10.000", onPress: () => Alert.alert("✅ Recarga exitosa", `Recarga de $10.000 a ${op}.`) },
                { text: "$ 20.000", onPress: () => Alert.alert("✅ Recarga exitosa", `Recarga de $20.000 a ${op}.`) },
                { text: "$ 50.000", onPress: () => Alert.alert("✅ Recarga exitosa", `Recarga de $50.000 a ${op}.`) },
                { text: "Cancelar", style: "cancel" },
              ])}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#10B98120", alignItems: "center", justifyContent: "center" }}>
                <Feather name="smartphone" size={22} color="#10B981" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }}>{op}</Text>
              <Feather name="chevron-right" size={16} color="#9CA3AF" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, paddingTop: topPad, backgroundColor: C.background }]}>
      <ExplorarView
        isDark={isDark} C={C}
        onNavigateRecargar={() => setSubNav("recargar")}
        onNavigateFacturas={() => setSubNav("facturas")}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════ */
const eS = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  section: { marginBottom: 8, paddingVertical: 20, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  organizeRow: { flexDirection: "row", gap: 12 },
  organizeCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  organizeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  organizeLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceItem: { width: "22%", alignItems: "center", gap: 8 },
  serviceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  subHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  ddCard: { margin: 16, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  ddCardLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  ddCardAmount: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 12 },
  ddBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  ddBarFill: { height: "100%", borderRadius: 4 },
  ddBarLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ddItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 16, gap: 14 },
  ddItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ddItemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ddItemCat: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  ddItemAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  ddItemBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  ddItemBarFill: { height: "100%", borderRadius: 3 },
});

const bS = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, padding: 16, marginBottom: 8, gap: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  itemIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  itemName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  itemSaved: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 2 },
  itemGoal: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  createBtn: { backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular", marginBottom: 16 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: YELLOW },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
