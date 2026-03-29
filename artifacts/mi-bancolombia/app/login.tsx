import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function LoginScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { login } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => attempt(next), 120);
    }
  };

  const attempt = async (p: string) => {
    const ok = await login(p);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setPin("");
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 32, paddingBottom: bottomPad },
      ]}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <View style={styles.logo}>
        <Image
          source={require("../assets/images/mi_bancolombia_icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Mi Bancolombia</Text>
      </View>

      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Ingresa tu clave de 4 dígitos</Text>

      <Text style={[styles.hint, error && styles.hintError]}>
        {error ? "Clave incorrecta. Inténtalo de nuevo" : " "}
      </Text>

      <PinPad pin={pin} onPress={handleDigit} onDelete={handleDelete} />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn}>
          <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn}>
          <Text style={styles.registerText}>Registrarme</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "transparent",
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    textAlign: "center",
    minHeight: 18,
  },
  hintError: {
    color: "#EF4444",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  footerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  forgotText: {
    fontSize: 14,
    color: C.yellow,
    fontFamily: "Inter_600SemiBold",
  },
  registerText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
});
