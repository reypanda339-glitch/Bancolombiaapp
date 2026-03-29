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
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";
import { COUNTRIES, DOC_TYPE_LABELS, ALL_DOC_TYPES, type Country, type DocType } from "@/constants/countries";

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

  const { login, themeMode } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const isDark = themeMode === "dark" || (themeMode === "system" && system === "dark");
  const C = isDark ? Colors.dark : Colors.light;

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
    const ok = await login(p);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Clave incorrecta. Inténtalo de nuevo");
      setPin("");
    }
  };

  const inputStyle = [styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 28, paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image
            source={
              isDark
                ? require("../assets/images/mi_bancolombia_icon.png")
                : require("../assets/images/bancolombia_icon.png")
            }
            style={[styles.logo, isDark && styles.logoDark]}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: C.text }]}>Mi Bancolombia</Text>
        </View>

        {step === "identify" ? (
          <>
            <Text style={[styles.title, { color: C.text }]}>Iniciar sesión</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>
              Ingresa tu país e identificación
            </Text>

            <Text style={[styles.label, { color: C.textSecondary }]}>País de residencia</Text>
            <TouchableOpacity
              style={[inputStyle, styles.pickerBtn]}
              onPress={() => { setShowCountryPicker(!showCountryPicker); setShowDocPicker(false); }}
            >
              <Text style={[styles.flagText]}>{selectedCountry.flag}</Text>
              <Text style={{ color: C.text, fontFamily: "Inter_400Regular", fontSize: 15, flex: 1, marginLeft: 8 }}>
                {selectedCountry.name}
              </Text>
              <Feather name={showCountryPicker ? "chevron-up" : "chevron-down"} size={18} color={C.textSecondary} />
            </TouchableOpacity>

            {showCountryPicker && (
              <View style={[styles.dropdown, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.searchWrap, { backgroundColor: C.inputBg, borderBottomColor: C.border }]}>
                  <Feather name="search" size={14} color={C.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: C.text }]}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    placeholder="Buscar país..."
                    placeholderTextColor={C.textLight}
                    autoFocus
                  />
                </View>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
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
                      <Text style={{ color: c.code === selectedCountry.code ? C.yellow : C.text, fontFamily: "Inter_400Regular", fontSize: 14, marginLeft: 8, flex: 1 }}>
                        {c.name}
                      </Text>
                      <Text style={{ color: C.textLight, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                        {c.currencyCode}
                      </Text>
                      {c.code === selectedCountry.code && <Feather name="check" size={14} color={C.yellow} style={{ marginLeft: 6 }} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.label, { color: C.textSecondary, marginTop: 14 }]}>Tipo de documento</Text>
            <TouchableOpacity
              style={[inputStyle, styles.pickerBtn]}
              onPress={() => { setShowDocPicker(!showDocPicker); setShowCountryPicker(false); }}
            >
              <Text style={{ color: C.text, fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 }}>
                {DOC_TYPE_LABELS[docType]}
              </Text>
              <Feather name={showDocPicker ? "chevron-up" : "chevron-down"} size={18} color={C.textSecondary} />
            </TouchableOpacity>

            {showDocPicker && (
              <View style={[styles.dropdown, { backgroundColor: C.surface, borderColor: C.border }]}>
                {ALL_DOC_TYPES.map((dt) => (
                  <TouchableOpacity
                    key={dt}
                    style={[styles.dropdownItem, { borderBottomColor: C.divider }]}
                    onPress={() => { setDocType(dt); setShowDocPicker(false); }}
                  >
                    <Text style={{ color: dt === docType ? C.yellow : C.text, fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 }}>
                      {DOC_TYPE_LABELS[dt]}
                    </Text>
                    {dt === docType && <Feather name="check" size={14} color={C.yellow} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: C.textSecondary, marginTop: 14 }]}>
              Número de {DOC_TYPE_LABELS[docType]}
            </Text>
            <TextInput
              style={inputStyle}
              value={docNumber}
              onChangeText={(t) => { setDocNumber(t); setError(null); }}
              keyboardType="default"
              placeholder="Ingresa tu número de documento"
              placeholderTextColor={C.textLight}
              maxLength={20}
              autoCapitalize="characters"
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.yellow, marginTop: 28 }]}
              onPress={handleContinue}
            >
              <Text style={styles.btnText}>Continuar</Text>
              <Feather name="arrow-right" size={18} color="#1C1C1E" />
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/forgot-password" as any)}>
                <Text style={[styles.forgotText, { color: C.yellow }]}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/register" as any)}>
                <Text style={[styles.registerText, { color: C.textSecondary }]}>Registrarme</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.identityCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Feather name="user" size={18} color={C.textSecondary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.identityLabel, { color: C.textSecondary }]}>
                  {selectedCountry.flag}  {selectedCountry.name}  ·  {DOC_TYPE_LABELS[docType]}
                </Text>
                <Text style={[styles.identityValue, { color: C.text }]}>{docNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => { setStep("identify"); setPin(""); setError(null); }}>
                <Feather name="edit-2" size={16} color={C.yellow} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: C.text, textAlign: "center", marginTop: 24 }]}>
              Ingresa tu clave
            </Text>
            <Text style={[styles.sub, { color: C.textSecondary, textAlign: "center" }]}>
              Clave de 4 dígitos
            </Text>

            {error && (
              <Text style={[styles.errorText, { textAlign: "center" }]}>{error}</Text>
            )}

            <PinPad pin={pin} onPress={handlePinDigit} onDelete={() => { setPin((p) => p.slice(0, -1)); setError(null); }} isDark={isDark} />

            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/forgot-password" as any)}>
                <Text style={[styles.forgotText, { color: C.yellow }]}>¿Olvidaste tu clave?</Text>
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
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 76,
    height: 76,
    marginBottom: 10,
  },
  logoDark: {
    borderRadius: 18,
  },
  appName: {
    fontSize: 19,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    width: "100%",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagText: {
    fontSize: 20,
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    width: "100%",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 15,
    width: "100%",
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
    gap: 4,
    width: "100%",
  },
  footerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  registerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    width: "100%",
  },
  identityLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  identityValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
