import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
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
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const GREEN = "#00C072";
const PURPLE = "#8B5CF6";
const ORANGE = "#F59E0B";

type Bolsillo = {
  id: string; name: string; saved: number; goal: number | null; color: string; emoji: string;
};

const INITIAL_BOLSILLOS: Bolsillo[] = [
  { id: "1", name: "Viaje a España",  saved: 4500000, goal: 18000000, color: "#8B5CF6", emoji: "✈️" },
  { id: "2", name: "Viaje México",    saved: 1200000, goal: 5000000,  color: "#F59E0B", emoji: "🌮" },
  { id: "3", name: "Gastos de la U",  saved: 200000,  goal: null,     color: "#10B981", emoji: "🎓" },
];

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function BolsillosView({ isDark, C }: { isDark: boolean; C: any }) {
  const [bolsillos, setBolsillos] = useState(INITIAL_BOLSILLOS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    setBolsillos((prev) => [...prev, {
      id: Date.now().toString(), name: newName.trim(), saved: 0,
      goal: newGoal ? parseInt(newGoal.replace(/\D/g, "")) : null,
      color: ["#8B5CF6","#F59E0B","#10B981","#3B82F6","#EF4444"][prev.length % 5],
      emoji: "💰",
    }]);
    setNewName(""); setNewGoal(""); setShowCreate(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "#7C3AED", padding: 24, paddingBottom: 32 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginBottom: 4 }}>Explorar</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 4 }}>Tus bolsillos</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }}>Ahorra para tus metas con bolsillos</Text>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          {bolsillos.map((b) => {
            const pct = b.goal ? Math.min((b.saved / b.goal) * 100, 100) : null;
            return (
              <View key={b.id} style={[bS.item, { backgroundColor: C.surface }]}>
                <View style={[bS.itemIcon, { backgroundColor: b.color + "20" }]}>
                  <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={bS.itemRow}>
                    <Text style={[bS.itemName, { color: C.text }]}>{b.name}</Text>
                    <Feather name="more-vertical" size={18} color={C.textSecondary} />
                  </View>
                  <Text style={[bS.itemSaved, { color: C.text }]}>{formatCOP(b.saved)}</Text>
                  {b.goal ? (
                    <>
                      <Text style={[bS.itemGoal, { color: C.textSecondary }]}>Meta: {formatCOP(b.goal)}</Text>
                      <View style={[bS.progressBg, { backgroundColor: isDark ? "#2A2A2C" : "#F0F0F0" }]}>
                        <View style={[bS.progressFill, { width: `${pct}%` as any, backgroundColor: b.color }]} />
                      </View>
                    </>
                  ) : (
                    <Text style={[bS.itemGoal, { color: C.textSecondary }]}>Sin meta de ahorro</Text>
                  )}
                </View>
              </View>
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
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[bS.modal, { backgroundColor: C.surface }]}>
            <Text style={[bS.modalTitle, { color: C.text }]}>Nuevo bolsillo</Text>
            <Text style={[bS.modalLabel, { color: C.textSecondary }]}>Nombre</Text>
            <TextInput style={[bS.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={newName} onChangeText={setNewName} placeholder="Ej: Vacaciones" placeholderTextColor={C.textLight} />
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
    </View>
  );
}

const HOGAR_SERVICES = [
  { icon: "smartphone", label: "Recargar\ncelular",  color: "#10B981" },
  { icon: "home",       label: "Tu360\nInmobiliario", color: "#3B82F6" },
  { icon: "zap",        label: "Pagar\nservicios",    color: "#F59E0B" },
  { icon: "shield",     label: "Seguros",             color: "#8B5CF6" },
];

const TRANSPORTE_SERVICES = [
  { icon: "credit-card", label: "Recargar\ntransporte", color: "#3B82F6" },
  { icon: "map-pin",     label: "Muéveme",              color: "#10B981" },
  { icon: "navigation",  label: "Tu360\nMovilidad",     color: "#F59E0B" },
  { icon: "truck",       label: "Servicios\nvehículo",  color: "#6B7280" },
];

function ExplorarView({ isDark, C }: { isDark: boolean; C: any }) {
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
            <Text style={[eS.ddBarLabel, { color: C.textSecondary }]}>62% del presupuesto mensual</Text>
          </View>
          {[
            { cat: "Alimentación",    icon: "coffee",         pct: 35, amount: 432250, color: "#F59E0B" },
            { cat: "Transporte",      icon: "navigation",     pct: 20, amount: 247000, color: "#3B82F6" },
            { cat: "Entretenimiento", icon: "music",          pct: 15, amount: 185250, color: "#8B5CF6" },
            { cat: "Servicios",       icon: "zap",            pct: 18, amount: 222300, color: "#10B981" },
            { cat: "Otros",           icon: "more-horizontal",pct: 12, amount: 148200, color: "#6B7280" },
          ].map((item) => (
            <View key={item.cat} style={[eS.ddItem, { backgroundColor: C.surface }]}>
              <View style={[eS.ddItemIcon, { backgroundColor: item.color + "20" }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={eS.ddItemRow}>
                  <Text style={[eS.ddItemCat, { color: C.text }]}>{item.cat}</Text>
                  <Text style={[eS.ddItemAmt, { color: C.text }]}>{formatCOP(item.amount)}</Text>
                </View>
                <View style={[eS.ddItemBar, { backgroundColor: isDark ? "#2A2A2C" : "#F0F0F0" }]}>
                  <View style={[eS.ddItemBarFill, { width: `${item.pct}%` as any, backgroundColor: item.color }]} />
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.background }} showsVerticalScrollIndicator={false} bounces>
      <View style={[eS.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[eS.title, { color: C.text }]}>Explorar</Text>
      </View>

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
          </TouchableOpacity>
          <TouchableOpacity
            style={[eS.organizeCard, { backgroundColor: isDark ? "#3B2A0F" : "#FEF3C7" }]}
            onPress={() => setSubView("bolsillos")}
          >
            <View style={[eS.organizeIcon, { backgroundColor: ORANGE }]}>
              <Feather name="target" size={22} color="#FFFFFF" />
            </View>
            <Text style={[eS.organizeLabel, { color: C.text }]}>Bolsillos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Hogar y servicios</Text>
        <View style={eS.servicesGrid}>
          {HOGAR_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label} style={eS.serviceItem}
              onPress={() => Alert.alert(s.label.replace("\n", " "), "Próximamente disponible")}
            >
              <View style={[eS.serviceIcon, { backgroundColor: s.color + (isDark ? "30" : "18") }]}>
                <Feather name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={[eS.serviceLabel, { color: C.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[eS.section, { backgroundColor: C.surface }]}>
        <Text style={[eS.sectionTitle, { color: C.text }]}>Transporte</Text>
        <View style={eS.servicesGrid}>
          {TRANSPORTE_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.label} style={eS.serviceItem}
              onPress={() => Alert.alert(s.label.replace("\n", " "), "Próximamente disponible")}
            >
              <View style={[eS.serviceIcon, { backgroundColor: s.color + (isDark ? "30" : "18") }]}>
                <Feather name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={[eS.serviceLabel, { color: C.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

export default function ExplorarScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const { C, isDark } = useTheme();

  return (
    <View style={[{ flex: 1, paddingTop: topPad, backgroundColor: C.background }]}>
      <ExplorarView isDark={isDark} C={C} />
    </View>
  );
}

const eS = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  section: { marginBottom: 8, paddingVertical: 20, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 16 },
  organizeRow: { flexDirection: "row", gap: 12 },
  organizeCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  organizeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  organizeLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceItem: { width: "22%", alignItems: "center", gap: 8 },
  serviceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  subHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  ddCard: {
    margin: 16, borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  ddCardLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  ddCardAmount: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 12 },
  ddBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  ddBarFill: { height: "100%", borderRadius: 4 },
  ddBarLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ddItem: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 16, gap: 14,
  },
  ddItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ddItemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ddItemCat: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  ddItemAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  ddItemBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  ddItemBarFill: { height: "100%", borderRadius: 3 },
});

const bS = StyleSheet.create({
  item: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 16, padding: 16, marginBottom: 8, gap: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  itemIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  itemName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  itemSaved: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 2 },
  itemGoal: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 32, borderTopWidth: 1,
  },
  createBtn: {
    backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  modalInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    fontFamily: "Inter_400Regular", marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: YELLOW },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
