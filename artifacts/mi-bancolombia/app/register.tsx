import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";
import type { DocType } from "@/constants/countries";
import { PinPad } from "@/components/PinPad";

const DOC_TYPES: { label: string; value: DocType }[] = [
  { label: "Cédula de Ciudadanía (CC)", value: "CC" },
  { label: "Cédula de Extranjería (CE)", value: "CE" },
  { label: "Pasaporte (PA)", value: "PA" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const { register, themeMode } = useApp();
  const isDark = themeMode === "dark" || (themeMode === "system" && system === "dark");
  const C = isDark ? Colors.dark : Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState(1);
  const [showDocPicker, setShowDocPicker] = useState(false);

  const [documentType, setDocumentType] = useState<DocType>("CC");
  const [documentNumber, setDocumentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"create" | "confirm">("create");
  const [pinError, setPinError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [address, setAddress] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!documentNumber.trim()) e.documentNumber = "Ingresa tu número de documento";
    else if (documentNumber.length < 5) e.documentNumber = "Número de documento muy corto";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Ingresa tu primer nombre";
    if (!lastName.trim()) e.lastName = "Ingresa tu primer apellido";
    if (!birthDate.trim()) e.birthDate = "Ingresa tu fecha de nacimiento";
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) e.birthDate = "Formato: DD/MM/AAAA";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate3 = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Ingresa tu correo electrónico";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo inválido";
    if (!phone.trim()) e.phone = "Ingresa tu número de celular";
    else if (phone.length < 10) e.phone = "Número de celular inválido";
    if (!address.trim()) e.address = "Ingresa tu dirección de residencia";
    if (!motherName.trim()) e.motherName = "Ingresa el nombre completo de tu madre";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validate1()) setStep(2);
    else if (step === 2 && validate2()) setStep(3);
    else if (step === 3 && validate3()) setStep(4);
  };

  const handlePinDigit = (d: string) => {
    setPinError("");
    if (pinStep === "create") {
      if (pin.length >= 4) return;
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => setPinStep("confirm"), 300);
      }
    } else {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + d;
      setConfirmPin(next);
      if (next.length === 4) {
        setTimeout(() => finishRegister(next), 300);
      }
    }
  };

  const handlePinDelete = () => {
    if (pinStep === "create") {
      setPin((p) => p.slice(0, -1));
    } else {
      setConfirmPin((p) => p.slice(0, -1));
    }
  };

  const finishRegister = async (confirmValue: string) => {
    if (pin !== confirmValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setPinError("Las claves no coinciden. Inténtalo de nuevo.");
      setPin("");
      setConfirmPin("");
      setPinStep("create");
      return;
    }

    setRegistering(true);
    try {
      await register({
        documentType,
        documentNumber,
        countryResidence: "CO",
        countryBirth: "CO",
        currencyCode: "COP",
        currencySymbol: "$",
        firstName,
        secondName,
        lastName,
        secondLastName,
        birthDate,
        email,
        phone,
        pin,
        address,
        motherName,
        motherPhone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/login");
    } catch {
      setPinError("Ocurrió un error al crear la cuenta. Inténtalo de nuevo.");
      setRegistering(false);
    }
  };

  const docLabel = DOC_TYPES.find((d) => d.value === documentType)?.label ?? documentType;

  const inputStyle = [styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }];
  const labelStyle = [styles.label, { color: C.textSecondary }];
  const errorStyle = styles.errorText;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                { backgroundColor: s <= step ? C.yellow : C.border },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View>
            <Text style={[styles.stepTitle, { color: C.text }]}>Identificación</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary }]}>
              Ingresa tu documento de identidad
            </Text>

            <Text style={labelStyle}>Tipo de documento</Text>
            <TouchableOpacity
              style={[inputStyle, styles.pickerBtn]}
              onPress={() => setShowDocPicker(!showDocPicker)}
            >
              <Text style={{ color: C.text, fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 }}>
                {docLabel}
              </Text>
              <Feather name={showDocPicker ? "chevron-up" : "chevron-down"} size={18} color={C.textSecondary} />
            </TouchableOpacity>

            {showDocPicker && (
              <View style={[styles.dropdown, { backgroundColor: C.surface, borderColor: C.border }]}>
                {DOC_TYPES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dropdownItem, { borderBottomColor: C.divider }]}
                    onPress={() => { setDocumentType(d.value); setShowDocPicker(false); }}
                  >
                    <Text style={{ color: d.value === documentType ? C.yellow : C.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                      {d.label}
                    </Text>
                    {d.value === documentType && <Feather name="check" size={16} color={C.yellow} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[labelStyle, { marginTop: 16 }]}>Número de documento</Text>
            <TextInput
              style={inputStyle}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              keyboardType="numeric"
              placeholder="Ej. 1234567890"
              placeholderTextColor={C.textLight}
              maxLength={15}
            />
            {errors.documentNumber && <Text style={errorStyle}>{errors.documentNumber}</Text>}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.stepTitle, { color: C.text }]}>Datos personales</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary }]}>
              Como aparecen en tu documento
            </Text>

            <Text style={labelStyle}>Primer nombre *</Text>
            <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName} placeholder="Ej. Juan" placeholderTextColor={C.textLight} autoCapitalize="words" />
            {errors.firstName && <Text style={errorStyle}>{errors.firstName}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Segundo nombre</Text>
            <TextInput style={inputStyle} value={secondName} onChangeText={setSecondName} placeholder="Opcional" placeholderTextColor={C.textLight} autoCapitalize="words" />

            <Text style={[labelStyle, { marginTop: 14 }]}>Primer apellido *</Text>
            <TextInput style={inputStyle} value={lastName} onChangeText={setLastName} placeholder="Ej. Pérez" placeholderTextColor={C.textLight} autoCapitalize="words" />
            {errors.lastName && <Text style={errorStyle}>{errors.lastName}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Segundo apellido</Text>
            <TextInput style={inputStyle} value={secondLastName} onChangeText={setSecondLastName} placeholder="Opcional" placeholderTextColor={C.textLight} autoCapitalize="words" />

            <Text style={[labelStyle, { marginTop: 14 }]}>Fecha de nacimiento *</Text>
            <TextInput
              style={inputStyle}
              value={birthDate}
              onChangeText={(t) => {
                let v = t.replace(/[^\d]/g, "");
                if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5);
                setBirthDate(v.slice(0, 10));
              }}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={C.textLight}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.birthDate && <Text style={errorStyle}>{errors.birthDate}</Text>}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.stepTitle, { color: C.text }]}>Información de contacto</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary }]}>
              Para notificaciones y seguridad de tu cuenta
            </Text>

            <Text style={labelStyle}>Correo electrónico *</Text>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={C.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={errorStyle}>{errors.email}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Número de celular *</Text>
            <View style={styles.phoneRow}>
              <View style={[styles.prefix, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                <Text style={{ color: C.text, fontFamily: "Inter_500Medium", fontSize: 14 }}>🇨🇴 +57</Text>
              </View>
              <TextInput
                style={[inputStyle, { flex: 1, marginLeft: 8 }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="3XX XXX XXXX"
                placeholderTextColor={C.textLight}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {errors.phone && <Text style={errorStyle}>{errors.phone}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Dirección de residencia *</Text>
            <TextInput
              style={inputStyle}
              value={address}
              onChangeText={setAddress}
              placeholder="Ej. Cra 10 # 45-20, Bogotá"
              placeholderTextColor={C.textLight}
              autoCapitalize="words"
            />
            {errors.address && <Text style={errorStyle}>{errors.address}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Nombre completo de la madre *</Text>
            <TextInput
              style={inputStyle}
              value={motherName}
              onChangeText={setMotherName}
              placeholder="Ej. María López de García"
              placeholderTextColor={C.textLight}
              autoCapitalize="words"
            />
            {errors.motherName && <Text style={errorStyle}>{errors.motherName}</Text>}

            <Text style={[labelStyle, { marginTop: 14 }]}>Teléfono de la madre</Text>
            <TextInput
              style={inputStyle}
              value={motherPhone}
              onChangeText={setMotherPhone}
              placeholder="3XX XXX XXXX (opcional)"
              placeholderTextColor={C.textLight}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <View style={[styles.notice, { backgroundColor: C.yellow + "20", borderColor: C.yellow + "40" }]}>
              <Feather name="info" size={14} color={C.yellow} />
              <Text style={[styles.noticeText, { color: C.text }]}>
                Tu cuenta iniciará con saldo $0. Los fondos se acreditarán según el producto bancario que actives.
              </Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.pinContainer}>
            <Text style={[styles.stepTitle, { color: C.text, textAlign: "center" }]}>
              {registering ? "Creando tu cuenta..." : pinStep === "create" ? "Crea tu clave" : "Confirma tu clave"}
            </Text>
            <Text style={[styles.stepSub, { color: C.textSecondary, textAlign: "center" }]}>
              {registering
                ? "Por favor espera un momento"
                : pinStep === "create"
                ? "Elige una clave de 4 dígitos para ingresar a tu cuenta"
                : "Ingresa nuevamente tu clave para confirmarla"}
            </Text>
            {pinError ? (
              <Text style={[styles.errorText, { textAlign: "center", marginBottom: 16 }]}>{pinError}</Text>
            ) : null}
            {!registering && (
              <PinPad
                pin={pinStep === "create" ? pin : confirmPin}
                onPress={handlePinDigit}
                onDelete={handlePinDelete}
                isDark={isDark}
              />
            )}
          </View>
        )}

        {step < 4 && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: C.yellow }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>Continuar</Text>
            <Feather name="arrow-right" size={18} color="#1C1C1E" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginLeft: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  prefix: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  notice: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
    alignItems: "flex-start",
  },
  noticeText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  pinContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 32,
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
});
