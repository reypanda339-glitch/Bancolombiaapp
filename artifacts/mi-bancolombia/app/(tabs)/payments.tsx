import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const GREEN = "#00C072";
const PURPLE = "#8B5CF6";
const ORANGE = "#F59E0B";
const TEAL = "#06B6D4";
const BLUE = "#3B82F6";

type Bolsillo = {
  id: string;
  name: string;
  saved: number;
  goal: number | null;
  color: string;
  emoji: string;
};

const INITIAL_BOLSILLOS: Bolsillo[] = [
  { id: "1", name: "Viaje a España", saved: 4500000, goal: 18000000, color: "#8B5CF6", emoji: "✈️" },
  { id: "2", name: "Viaje México", saved: 1200000, goal: 5000000, color: "#F59E0B", emoji: "🌮" },
  { id: "3", name: "Gastos de la U", saved: 200000, goal: null, color: "#10B981", emoji: "🎓" },
];

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function BolsillosView() {
  const [bolsillos, setBolsillos] = useState(INITIAL_BOLSILLOS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    setBolsillos(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      saved: 0,
      goal: newGoal ? parseInt(newGoal.replace(/\D/g, "")) : null,
      color: ["#8B5CF6", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"][prev.length % 5],
      emoji: "💰",
    }]);
    setNewName("");
    setNewGoal("");
    setShowCreate(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={bStyles.headerSection}>
          <Text style={bStyles.sectionLabel}>Explorar</Text>
          <Text style={bStyles.title}>Tus bolsillos</Text>
          <Text style={bStyles.subtitle}>Ahorra para tus metas con bolsillos</Text>
        </View>

        <View style={bStyles.list}>
          {bolsillos.map((b) => {
            const pct = b.goal ? Math.min((b.saved / b.goal) * 100, 100) : null;
            return (
              <View key={b.id} style={bStyles.item}>
                <View style={[bStyles.itemIcon, { backgroundColor: b.color + "20" }]}>
                  <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={bStyles.itemRow}>
                    <Text style={bStyles.itemName}>{b.name}</Text>
                    <TouchableOpacity>
                      <Feather name="more-vertical" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={bStyles.itemSaved}>{formatCOP(b.saved)}</Text>
                  {b.goal ? (
                    <>
                      <Text style={bStyles.itemGoal}>Meta: {formatCOP(b.goal)}</Text>
                      <View style={bStyles.progressBg}>
                        <View style={[bStyles.progressFill, { width: `${pct}%` as any, backgroundColor: b.color }]} />
                      </View>
                    </>
                  ) : (
                    <Text style={bStyles.itemGoal}>Sin meta de ahorro</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={bStyles.footer}>
        <TouchableOpacity style={bStyles.createBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={18} color="#1C1C1E" />
          <Text style={bStyles.createBtnText}>Crear bolsillo</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={bStyles.modalOverlay}>
          <View style={bStyles.modal}>
            <Text style={bStyles.modalTitle}>Nuevo bolsillo</Text>
            <Text style={bStyles.modalLabel}>Nombre</Text>
            <TextInput
              style={bStyles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ej: Vacaciones"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={bStyles.modalLabel}>Meta de ahorro (opcional)</Text>
            <TextInput
              style={bStyles.modalInput}
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="$ 0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            <View style={bStyles.modalBtns}>
              <TouchableOpacity style={bStyles.modalCancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={bStyles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bStyles.modalConfirmBtn} onPress={handleCreate}>
                <Text style={bStyles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const HOGAR_SERVICES = [
  { icon: "smartphone", label: "Recargar\ncelular", color: "#10B981" },
  { icon: "home", label: "Tu360\nInmobiliario", color: "#3B82F6" },
  { icon: "zap", label: "Pagar\nservicios", color: "#F59E0B" },
  { icon: "shield", label: "Seguros", color: "#8B5CF6" },
];

const TRANSPORTE_SERVICES = [
  { icon: "credit-card", label: "Recargar\ntransporte", color: "#3B82F6" },
  { icon: "map-pin", label: "Muéveme", color: "#10B981" },
  { icon: "navigation", label: "Tu360\nMovilidad", color: "#F59E0B" },
  { icon: "truck", label: "Servicios\nvehículo", color: "#6B7280" },
];

function ExplorarView() {
  const [subView, setSubView] = useState<"main" | "bolsillos" | "diaadia">("main");

  if (subView === "bolsillos") {
    return (
      <View style={{ flex: 1 }}>
        <View style={eStyles.subHeader}>
          <TouchableOpacity style={eStyles.backBtn} onPress={() => setSubView("main")}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
            <Text style={eStyles.backText}>Volver</Text>
          </TouchableOpacity>
        </View>
        <BolsillosView />
      </View>
    );
  }

  if (subView === "diaadia") {
    return (
      <View style={{ flex: 1 }}>
        <View style={eStyles.subHeader}>
          <TouchableOpacity style={eStyles.backBtn} onPress={() => setSubView("main")}>
            <Feather name="chevron-left" size={22} color="#1C1C1E" />
            <Text style={eStyles.backText}>Volver</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={eStyles.ddHeader}>
            <Text style={eStyles.ddTitle}>Día a Día</Text>
            <Text style={eStyles.ddSub}>Controla tus gastos del mes</Text>
          </View>
          <View style={eStyles.ddCard}>
            <Text style={eStyles.ddCardLabel}>Gastos este mes</Text>
            <Text style={eStyles.ddCardAmount}>$ 1.235.000</Text>
            <View style={eStyles.ddBar}>
              <View style={[eStyles.ddBarFill, { width: "62%" }]} />
            </View>
            <Text style={eStyles.ddBarLabel}>62% del presupuesto mensual</Text>
          </View>
          {[
            { cat: "Alimentación", icon: "coffee", pct: 35, amount: 432250, color: "#F59E0B" },
            { cat: "Transporte", icon: "navigation", pct: 20, amount: 247000, color: "#3B82F6" },
            { cat: "Entretenimiento", icon: "music", pct: 15, amount: 185250, color: "#8B5CF6" },
            { cat: "Servicios", icon: "zap", pct: 18, amount: 222300, color: "#10B981" },
            { cat: "Otros", icon: "more-horizontal", pct: 12, amount: 148200, color: "#6B7280" },
          ].map((item) => (
            <View key={item.cat} style={eStyles.ddItem}>
              <View style={[eStyles.ddItemIcon, { backgroundColor: item.color + "20" }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={eStyles.ddItemRow}>
                  <Text style={eStyles.ddItemCat}>{item.cat}</Text>
                  <Text style={eStyles.ddItemAmt}>{formatCOP(item.amount)}</Text>
                </View>
                <View style={eStyles.ddItemBar}>
                  <View style={[eStyles.ddItemBarFill, { width: `${item.pct}%` as any, backgroundColor: item.color }]} />
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
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces>
      <View style={eStyles.header}>
        <Text style={eStyles.title}>Explorar</Text>
      </View>

      <View style={eStyles.section}>
        <Text style={eStyles.sectionTitle}>Organiza tu plata</Text>
        <View style={eStyles.organizeRow}>
          <TouchableOpacity style={[eStyles.organizeCard, { backgroundColor: "#EDE9FE" }]} onPress={() => setSubView("diaadia")}>
            <View style={[eStyles.organizeIcon, { backgroundColor: PURPLE }]}>
              <Feather name="bar-chart-2" size={22} color="#FFFFFF" />
            </View>
            <Text style={eStyles.organizeLabel}>Día a Día</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[eStyles.organizeCard, { backgroundColor: "#FEF3C7" }]} onPress={() => setSubView("bolsillos")}>
            <View style={[eStyles.organizeIcon, { backgroundColor: ORANGE }]}>
              <Feather name="target" size={22} color="#FFFFFF" />
            </View>
            <Text style={eStyles.organizeLabel}>Bolsillos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={eStyles.section}>
        <Text style={eStyles.sectionTitle}>Hogar y servicios</Text>
        <View style={eStyles.servicesGrid}>
          {HOGAR_SERVICES.map((s) => (
            <TouchableOpacity key={s.label} style={eStyles.serviceItem}
              onPress={() => Alert.alert(s.label.replace("\n", " "), "Próximamente disponible")}>
              <View style={[eStyles.serviceIcon, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={eStyles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={eStyles.section}>
        <Text style={eStyles.sectionTitle}>Transporte</Text>
        <View style={eStyles.servicesGrid}>
          {TRANSPORTE_SERVICES.map((s) => (
            <TouchableOpacity key={s.label} style={eStyles.serviceItem}
              onPress={() => Alert.alert(s.label.replace("\n", " "), "Próximamente disponible")}>
              <View style={[eStyles.serviceIcon, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={eStyles.serviceLabel}>{s.label}</Text>
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

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ExplorarView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
});

const eStyles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  title: { fontSize: 24, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  section: { backgroundColor: "#FFFFFF", marginBottom: 8, paddingVertical: 20, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 16 },
  organizeRow: { flexDirection: "row", gap: 12 },
  organizeCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  organizeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  organizeLabel: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceItem: { width: "22%", alignItems: "center", gap: 8 },
  serviceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 11, color: "#1C1C1E", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  subHeader: {
    backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 16, color: "#1C1C1E", fontFamily: "Inter_400Regular" },
  ddHeader: { backgroundColor: GREEN, padding: 24, paddingBottom: 32 },
  ddTitle: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 4 },
  ddSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  ddCard: {
    backgroundColor: "#FFFFFF", margin: 16, borderRadius: 16, padding: 20,
    marginTop: -16, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  ddCardLabel: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 4 },
  ddCardAmount: { fontSize: 28, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 12 },
  ddBar: { height: 8, backgroundColor: "#F0F0F0", borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  ddBarFill: { height: "100%", backgroundColor: GREEN, borderRadius: 4 },
  ddBarLabel: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular" },
  ddItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 16, gap: 14,
  },
  ddItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ddItemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ddItemCat: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  ddItemAmt: { fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  ddItemBar: { height: 6, backgroundColor: "#F0F0F0", borderRadius: 3, overflow: "hidden" },
  ddItemBarFill: { height: "100%", borderRadius: 3 },
});

const bStyles = StyleSheet.create({
  headerSection: { backgroundColor: "#7C3AED", padding: 24, paddingBottom: 32 },
  sectionLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginBottom: 4 },
  title: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  list: { padding: 16, gap: 0 },
  item: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 16, marginBottom: 8, gap: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  itemIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  itemName: { fontSize: 15, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  itemSaved: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 2 },
  itemGoal: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: "#F0F0F0", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFFFFF", padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: "#F0F0F0",
  },
  createBtn: {
    backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold", marginBottom: 20 },
  modalLabel: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_500Medium", marginBottom: 8 },
  modalInput: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1C1E",
    fontFamily: "Inter_400Regular", backgroundColor: "#FAFAFA", marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: "#F5F5F7" },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#6B7280", fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: YELLOW },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
