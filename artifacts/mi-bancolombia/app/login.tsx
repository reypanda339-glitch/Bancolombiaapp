import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { COUNTRIES, DOC_TYPE_LABELS, ALL_DOC_TYPES, type Country, type DocType } from "@/constants/countries";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";

export default function LoginScreen() {
  const [step, setStep] = useState<"identify" | "pin">("identify");
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [docType, setDocType] = useState<DocType>("CC");
  const [docNumber, setDocNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login } = useApp();
  const { C, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleContinue = () => {
    if (!docNumber.trim() || docNumber.length < 4) {
      setError("Ingresa un número de documento válido");
      return;
    }
    setError(null);
    setStep("pin");
  };

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === 4) setTimeout(() => attempt(next), 120);
  };

  const attempt = async (p: string) => {
    const ok = await login(docNumber, p);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError("Clave incorrecta. Inténtalo de nuevo");
      setPin("");
    }
  };

  const bg = C.background;
  const surface = C.surface;
  const borderColor = C.inputBorder;
  const inputBg = isDark ? C.surface : "#FAFAFA";
  const textColor = C.text;
  const subColor = C.textSecondary;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad, backgroundColor: bg, borderBottomColor: C.border }]}>
        <Image
          source={require("../assets/images/bancolombia_icon.png")}
          style={styles.topLogo}
          resizeMode="contain"
          tintColor={isDark ? "#FFFFFF" : undefined}
        />
      </View>

      <ScrollView
        style={[styles.flex, { backgroundColor: bg }]}
        contentContainerStyle={[styles.container, { paddingBottom: bottomPad, backgroundColor: bg }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {step === "identify" ? (
          <>
            <View style={[styles.heroSection, { backgroundColor: isDark ? C.surface : "#FAFAFA", borderBottomColor: C.border }]}>
              <Image
                source={require("../assets/images/pwa-icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
              <Text style={[styles.heroTitle, { color: textColor }]}>Bienvenido a{"\n"}Mi Bancolombia</Text>
              <Text style={[styles.heroSub, { color: subColor }]}>
                Ingresa tu identificación para continuar
              </Text>
            </View>

            <View style={[styles.form, { backgroundColor: bg }]}>
              <Text style={[styles.label, { color: subColor }]}>País de residencia</Text>
              <TouchableOpacity
                style={[styles.picker, { borderColor, backgroundColor: inputBg }]}
                onPress={() => { setShowCountryPicker(!showCountryPicker); setShowDocPicker(false); }}
              >
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={[styles.pickerText, { color: textColor }]}>{selectedCountry.name}</Text>
                <Feather name={showCountryPicker ? "chevron-up" : "chevron-down"} size={18} color={subColor} />
              </TouchableOpacity>

              {showCountryPicker && (
                <View style={[styles.dropdown, { backgroundColor: surface, borderColor }]}>
                  <View style={[styles.searchWrap, { backgroundColor: inputBg, borderBottomColor: C.border }]}>
                    <Feather name="search" size={14} color={subColor} />
                    <TextInput
                      style={[styles.searchInput, { color: textColor }]}
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholder="Buscar país..."
                      placeholderTextColor={C.textLight}
                      autoFocus
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {filteredCountries.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.dropdownItem, { borderBottomColor: C.divider }]}
                        onPress={() => {
                          setSelectedCountry(c);
                          setDocType(c.docTypes[0]);
                          setShowCountryPicker(false);
                          setCountrySearch("");
                        }}
                      >
                        <Text style={styles.flagText}>{c.flag}</Text>
                        <Text style={[styles.dropdownItemText, { color: subColor },
                          c.code === selectedCountry.code && { color: textColor, fontFamily: "Inter_600SemiBold" }]}>
                          {c.name}
                        </Text>
                        {c.code === selectedCountry.code && <Feather name="check" size={14} color={YELLOW} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16, color: subColor }]}>Tipo de documento</Text>
              <TouchableOpacity
                style={[styles.picker, { borderColor, backgroundColor: inputBg }]}
                onPress={() => { setShowDocPicker(!showDocPicker); setShowCountryPicker(false); }}
              >
                <Text style={[styles.pickerText, { color: textColor }]}>{DOC_TYPE_LABELS[docType]}</Text>
                <Feather name={showDocPicker ? "chevron-up" : "chevron-down"} size={18} color={subColor} />
              </TouchableOpacity>

              {showDocPicker && (
                <View style={[styles.dropdown, { backgroundColor: surface, borderColor }]}>
                  {ALL_DOC_TYPES.map((dt) => (
                    <TouchableOpacity
                      key={dt}
                      style={[styles.dropdownItem, { borderBottomColor: C.divider }]}
                      onPress={() => { setDocType(dt); setShowDocPicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, { color: subColor },
                        dt === docType && { color: textColor, fontFamily: "Inter_600SemiBold" }]}>
                        {DOC_TYPE_LABELS[dt]}
                      </Text>
                      {dt === docType && <Feather name="check" size={14} color={YELLOW} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16, color: subColor }]}>
                Número de {DOC_TYPE_LABELS[docType]}
              </Text>
              <TextInput
                style={[styles.input, { borderColor, backgroundColor: inputBg, color: textColor }]}
                value={docNumber}
                onChangeText={(t) => { setDocNumber(t); setError(null); }}
                keyboardType="default"
                placeholder="Ingresa tu número de documento"
                placeholderTextColor={C.textLight}
                maxLength={20}
                autoCapitalize="characters"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <Feather name="arrow-right" size={18} color="#1C1C1E" />
              </TouchableOpacity>


              <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                  <Text style={[styles.linkText, { color: textColor }]}>¿Olvidaste tu clave?</Text>
                </TouchableOpacity>
                <View style={[styles.footerDivider, { backgroundColor: C.border }]} />
                <TouchableOpacity onPress={() => router.push("/register" as any)}>
                  <Text style={[styles.registerText, { color: subColor }]}>Registrarme</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.heroSection, { backgroundColor: isDark ? C.surface : "#FAFAFA", borderBottomColor: C.border }]}>
              <Image
                source={require("../assets/images/pwa-icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
              <Text style={[styles.heroTitle, { color: textColor }]}>Ingresa tu clave</Text>
              <Text style={[styles.heroSub, { color: subColor }]}>Clave de 4 dígitos</Text>
            </View>

            <View style={[styles.identityCard, { borderColor, backgroundColor: inputBg, marginTop: 24 }]}>
              <Feather name="user" size={18} color={subColor} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.identityLabel, { color: subColor }]}>
                  {selectedCountry.flag}  {DOC_TYPE_LABELS[docType]}
                </Text>
                <Text style={[styles.identityValue, { color: textColor }]}>{docNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => { setStep("identify"); setPin(""); setError(null); }}>
                <Feather name="edit-2" size={16} color={YELLOW} />
              </TouchableOpacity>
            </View>

            {error && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{error}</Text>}

            <PinPad
              pin={pin}
              onPress={handlePinDigit}
              onDelete={() => { setPin((p) => p.slice(0, -1)); setError(null); }}
              isDark={isDark}
            />

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                <Text style={[styles.linkText, { color: textColor }]}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: "flex-start",
  },
  topLogo: { width: 150, height: 34 },
  container: { flexGrow: 1 },
  heroSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  appIcon: {
    width: 80, height: 80, borderRadius: 20, marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold",
    textAlign: "center", letterSpacing: -0.5, marginBottom: 8,
  },
  heroSub: {
    fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center",
  },
  form: { padding: 24 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  picker: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  flagText: { fontSize: 20 },
  pickerText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dropdown: {
    borderWidth: 1.5, borderRadius: 12, marginTop: 4, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  dropdownItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, gap: 8,
  },
  dropdownItemText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  errorText: { fontSize: 12, color: "#EF4444", fontFamily: "Inter_400Regular", marginTop: 6 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 16, marginTop: 28, gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  footer: { alignItems: "center", marginTop: 24, gap: 12 },
  footerDivider: { width: 40, height: 1 },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textDecorationLine: "underline" },
  registerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  identityCard: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 14, padding: 16,
    marginHorizontal: 24,
  },
  identityLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  identityValue: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
