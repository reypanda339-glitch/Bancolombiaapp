import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { SuspensionStep, SubmissionType } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";

const GREEN  = "#22C55E";
const RED    = "#EF4444";
const YELLOW = "#FDDA24";
const BLUE   = "#3B82F6";
const PURPLE = "#A78BFA";
const ORANGE = "#F59E0B";

/* ─── Helpers ─── */
function censorDoc(doc: string): string {
  if (!doc) return "●●●●";
  const clean = doc.replace(/\s/g, "");
  if (clean.length <= 4) return "●".repeat(clean.length);
  return "●".repeat(clean.length - 4) + clean.slice(-4);
}

function RadicadoCountdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = React.useState("");
  const [expired, setExpired] = React.useState(false);
  React.useEffect(() => {
    const calc = () => {
      const expiry = new Date(expiresAt + "T23:59:59");
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) {
        const d = Math.floor(Math.abs(diff) / 86400000);
        setLabel(d === 0 ? "Vencido hoy" : `Vencido hace ${d} día${d !== 1 ? "s" : ""}`);
        setExpired(true);
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setLabel(
          d > 0 ? `${d}d ${h}h ${m}m de validez` : h > 0 ? `${h}h ${m}m de validez` : `${m}m de validez restantes`
        );
        setExpired(false);
      }
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const c = expired ? RED : GREEN;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Feather name={expired ? "alert-triangle" : "clock"} size={13} color={c} />
      <Text style={{ fontSize: 12, color: c, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
    </View>
  );
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* Try to detect a barcode from an image URI using BarcodeDetector API (web) */
async function detectBarcodeFromImageUri(uri: string): Promise<string | null> {
  if (Platform.OS !== "web") return null;
  if (typeof (window as any).BarcodeDetector === "undefined") return null;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const img = await createImageBitmap(blob);
    const detector = new (window as any).BarcodeDetector({
      formats: ["code_128", "code_39", "code_93", "qr_code", "ean_13", "ean_8"],
    });
    const results = await detector.detect(img);
    if (results.length > 0) return results[0].rawValue as string;
  } catch {}
  return null;
}

function StepTypeIcon({ type }: { type?: string }) {
  if (type === "identity_document")    return <Feather name="credit-card" size={16} color={BLUE} />;
  if (type === "tax_certificate")      return <Feather name="file-text"   size={16} color={PURPLE} />;
  if (type === "document")             return <Feather name="file-text"   size={16} color={BLUE} />;
  if (type === "identity_verification") return <Feather name="user-check" size={16} color={PURPLE} />;
  if (type === "radicado")             return <Feather name="tag"         size={16} color={ORANGE} />;
  return <Feather name="check-square" size={16} color="#94A3B8" />;
}

function StepTypeLabel({ type }: { type?: string }) {
  if (type === "identity_document")     return "Documento de identidad";
  if (type === "tax_certificate")       return "Comprobante tributario";
  if (type === "document")              return "Presentar documento";
  if (type === "identity_verification") return "Verificación de identidad";
  if (type === "radicado")              return "Verificación de radicado de documento";
  return "Paso requerido";
}

/* ══════════════════════════════════════════════════════════════
   PANEL UNIVERSAL — 3 opciones: foto/galería · escanear · manual
══════════════════════════════════════════════════════════════ */
function UniversalStepPanel({
  step,
  onSubmit,
  onClose,
  isDark,
  currentUser,
}: {
  step: SuspensionStep;
  onSubmit: (t: SubmissionType, v?: string, imageBase64?: string, imageMime?: string) => Promise<void>;
  onClose: () => void;
  isDark: boolean;
  currentUser: any;
}) {
  type TabKey = "photo" | "qr" | "manual";
  const [activeTab,  setActiveTab]  = useState<TabKey>("photo");
  const [scanning,   setScanning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>("image/jpeg");

  /* manual form fields */
  const [docNumber, setDocNumber] = useState("");
  const [fullName,  setFullName]  = useState("");
  const [radicado,  setRadicado]  = useState(step.radicadoNumber ?? "");

  const text    = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const inputBg = isDark ? "#2C2C2E" : "#F3F4F6";
  const border  = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const isIdentity      = step.type === "identity_document" || step.type === "identity_verification";
  const isRadicadoStep  = step.type === "radicado";

  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string; record?: any } | null>(null);
  const [verifying,    setVerifying]    = useState(false);

  const verifyRadicadoWithAPI = React.useCallback(async (value: string) => {
    if (!value.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    setError("");
    try {
      const uid  = currentUser?.id ?? "";
      const url  = `/api/radicados/verify/${encodeURIComponent(value.trim().toUpperCase())}${uid ? `?userId=${encodeURIComponent(uid)}` : ""}`;
      const res  = await fetch(url);
      const data = await res.json();
      setVerifyResult(data);
      if (!data.valid) setError(data.reason ?? "Radicado no válido o no encontrado");
    } catch {
      setError("No se pudo verificar el radicado. Revisa tu conexión.");
    } finally {
      setVerifying(false);
    }
  }, [currentUser?.id]);

  const doSubmit = async (type: SubmissionType, value?: string, imageBase64?: string, imageMime?: string) => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(type, value, imageBase64, imageMime);
      onClose();
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Request camera permissions ── */
  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso de cámara",
        "Necesitamos acceso a la cámara para fotografiar tu documento.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Configuración", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  /* ── Convert image URI to base64 ── */
  const imageToBase64 = async (uri: string, base64FromPicker?: string): Promise<{ base64: string; mime: string }> => {
    if (base64FromPicker) {
      return { base64: base64FromPicker, mime: "image/jpeg" };
    }
    if (Platform.OS === "web") {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        const mime = blob.type || "image/jpeg";
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1] ?? "";
            resolve({ base64, mime });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return { base64: "", mime: "image/jpeg" };
      }
    }
    return { base64: "", mime: "image/jpeg" };
  };

  /* ── Process a picked image: detect barcode or extract text ── */
  const processPickedImage = async (uri: string, base64FromPicker?: string) => {
    setCapturedImageUri(uri);
    const { base64, mime } = await imageToBase64(uri, base64FromPicker);
    setCapturedBase64(base64 || null);
    setCapturedMime(mime);

    if (!isIdentity) {
      setScanning(true);
      const detected = await detectBarcodeFromImageUri(uri);
      setScanning(false);
      if (detected) {
        setScanResult(`✓ Código detectado: ${detected}`);
        setRadicado(detected);
        if (isRadicadoStep) await verifyRadicadoWithAPI(detected);
      } else {
        setScanResult("Imagen cargada. Verifica el número de radicado o ingrésalo manualmente.");
        if (step.radicadoNumber) setRadicado(step.radicadoNumber);
      }
      setActiveTab("manual");
    } else {
      setScanResult("Documento fotografiado. Verifica los datos o confírmalos.");
      setDocNumber(currentUser?.documentNumber ?? "");
      setFullName(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim());
      setActiveTab("manual");
    }
  };

  /* ── Foto / cámara (expo-image-picker) ── */
  const handlePhoto = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    setError("");
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await processPickedImage(result.assets[0].uri, result.assets[0].base64 ?? undefined);
      }
    } catch (err) {
      setError("No se pudo abrir la cámara. Inténtalo de nuevo.");
    }
  };

  /* ── Galería (expo-image-picker) ── */
  const handleGallery = async () => {
    setError("");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso de galería", "Necesitamos acceso a tu galería.");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await processPickedImage(result.assets[0].uri, result.assets[0].base64 ?? undefined);
      }
    } catch {
      setError("No se pudo acceder a la galería.");
    }
  };

  /* ── Escanear QR / código de barras via cámara ── */
  const handleScan = async () => {
    setError("");
    setScanResult(null);
    setCapturedImageUri(null);
    setCapturedBase64(null);
    const ok = await requestPermissions();
    if (!ok) return;
    setScanning(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.95,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCapturedImageUri(uri);
        const pickerBase64 = result.assets[0].base64 ?? undefined;
        const { base64, mime } = await imageToBase64(uri, pickerBase64);
        setCapturedBase64(base64 || null);
        setCapturedMime(mime);
        const detected = await detectBarcodeFromImageUri(uri);
        setScanning(false);
        if (detected) {
          setScanResult(`✓ Código detectado: ${detected}`);
          if (isIdentity) {
            setDocNumber(currentUser?.documentNumber ?? "");
            setFullName(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim());
          } else {
            setRadicado(detected);
            if (isRadicadoStep) await verifyRadicadoWithAPI(detected);
          }
          setActiveTab("manual");
        } else {
          setScanResult(
            "Imagen capturada. No se detectó código automáticamente — ingresa el número manualmente."
          );
          if (step.radicadoNumber && !isIdentity) setRadicado(step.radicadoNumber);
          setActiveTab("manual");
        }
      } else {
        setScanning(false);
      }
    } catch {
      setScanning(false);
      setError("Error al acceder a la cámara.");
    }
  };

  /* ── Validación y envío manual (identidad) ── */
  const validateIdentity = (): boolean => {
    const registeredDoc  = normalize(currentUser?.documentNumber ?? "");
    const registeredName = normalize(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`);
    const inputDoc  = normalize(docNumber);
    const inputName = normalize(fullName);
    if (!inputDoc && !inputName) { setError("Ingresa el número de documento y el nombre."); return false; }
    if (!inputDoc)  { setError("Ingresa el número de documento."); return false; }
    if (!inputName) { setError("Ingresa el nombre completo tal como aparece en el documento."); return false; }
    if (inputDoc !== registeredDoc) {
      setError("El número de documento no coincide con el registrado en la cuenta.");
      return false;
    }
    // Require at least firstName AND lastName to appear in the input (minimum 4 chars each)
    const firstName  = normalize(currentUser?.firstName ?? "");
    const lastName   = normalize(currentUser?.lastName  ?? "");
    const hasFirst   = firstName.length >= 3 && inputName.includes(firstName);
    const hasLast    = lastName.length  >= 3 && inputName.includes(lastName);
    if (!hasFirst || !hasLast) {
      setError("El nombre y apellido no corresponden al titular de la cuenta.");
      return false;
    }
    return true;
  };

  /* ── Validación y envío manual (radicado) ── */
  const validateRadicado = (): boolean => {
    const clean = radicado.trim();
    if (!clean) { setError("Ingresa el número de radicado."); return false; }
    if (clean.length < 4) { setError("El número de radicado es demasiado corto."); return false; }
    if (step.radicadoNumber && normalize(clean) !== normalize(step.radicadoNumber)) {
      setError(`El número de radicado no coincide. El código asignado es: ${step.radicadoNumber}`);
      return false;
    }
    return true;
  };

  const handleManualConfirm = async () => {
    if (isIdentity) {
      if (!validateIdentity()) return;
      await doSubmit("photo", `dni_${docNumber}_${fullName}`, capturedBase64 ?? undefined, capturedMime);
    } else if (isRadicadoStep) {
      if (!radicado.trim()) { setError("Ingresa el número de radicado."); return; }
      if (!verifyResult) {
        await verifyRadicadoWithAPI(radicado.trim());
        return;
      }
      if (!verifyResult.valid) { setError(verifyResult.reason ?? "Radicado no válido"); return; }
      await doSubmit("radicado", radicado.trim(), capturedBase64 ?? undefined, capturedMime);
    } else {
      if (!validateRadicado()) return;
      await doSubmit("radicado", radicado.trim(), capturedBase64 ?? undefined, capturedMime);
    }
  };

  const TABS: { key: TabKey; icon: string; label: string; color: string }[] = [
    { key: "photo",  icon: "camera",  label: "Cámara/Galería", color: BLUE   },
    { key: "qr",     icon: "grid",    label: "Escanear código", color: GREEN  },
    { key: "manual", icon: "edit-2",  label: "Manual",         color: ORANGE },
  ];

  return (
    <View style={{ gap: 12 }}>
      {/* Tab selector */}
      <View style={{ flexDirection: "row", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#E5E7EB" }}>
        {TABS.map((t, idx) => (
          <TouchableOpacity
            key={t.key}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              gap: 3,
              backgroundColor: activeTab === t.key ? t.color + "22" : "transparent",
              borderRightWidth: idx < TABS.length - 1 ? 1 : 0,
              borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
            }}
            onPress={() => { setActiveTab(t.key); setError(""); setScanResult(null); }}
          >
            <Feather name={t.icon as any} size={16} color={activeTab === t.key ? t.color : textSec} />
            <Text style={{ fontSize: 9.5, fontFamily: "Inter_600SemiBold", color: activeTab === t.key ? t.color : textSec, textAlign: "center" }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scan result notice */}
      {scanResult && (
        <View style={{ flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, backgroundColor: GREEN + "15" }}>
          <Feather name="check-circle" size={14} color={GREEN} />
          <Text style={{ fontSize: 11, color: GREEN, fontFamily: "Inter_400Regular", flex: 1 }}>{scanResult}</Text>
        </View>
      )}

      {/* Radicado verification result card */}
      {isRadicadoStep && (verifyResult || verifying) && (
        <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: verifyResult?.valid ? GREEN + "50" : RED + "50" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: verifyResult?.valid ? GREEN + "18" : RED + "18" }}>
            {verifying
              ? <ActivityIndicator size="small" color={GREEN} />
              : <Feather name={verifyResult?.valid ? "check-circle" : "x-circle"} size={16} color={verifyResult?.valid ? GREEN : RED} />}
            <Text style={{ fontSize: 13, fontWeight: "700", color: verifyResult?.valid ? GREEN : RED, fontFamily: "Inter_700Bold", flex: 1 }}>
              {verifying ? "Verificando radicado..." : verifyResult?.valid ? "Radicado válido — verificado" : verifyResult?.record ? "Radicado no válido para este usuario" : "Radicado no encontrado"}
            </Text>
          </View>
          {verifyResult?.record && (
            <View style={{ padding: 12, gap: 10, backgroundColor: isDark ? "#1C1C1E" : "#FAFAFA" }}>
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                <View style={{ flex: 1, minWidth: 110 }}>
                  <Text style={{ fontSize: 9, color: textSec, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 }}>Titular</Text>
                  <Text style={{ fontSize: 12, color: text, fontFamily: "Inter_600SemiBold", marginTop: 2 }}>{verifyResult.record.userName}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 110 }}>
                  <Text style={{ fontSize: 9, color: textSec, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 }}>N° Documento</Text>
                  <Text style={{ fontSize: 13, color: text, fontFamily: "Inter_700Bold", marginTop: 2, letterSpacing: 3 }}>
                    {censorDoc(verifyResult.record.documentNumber)}
                  </Text>
                </View>
              </View>
              <View>
                <Text style={{ fontSize: 9, color: textSec, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 }}>Motivo / Trámite</Text>
                <Text style={{ fontSize: 12, color: text, fontFamily: "Inter_400Regular", marginTop: 2 }}>{verifyResult.record.motive}</Text>
              </View>
              {verifyResult.record.expiresAt && (
                <RadicadoCountdown expiresAt={verifyResult.record.expiresAt} />
              )}
              {!verifyResult.valid && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, backgroundColor: RED + "15" }}>
                  <Feather name="info" size={11} color={RED} />
                  <Text style={{ fontSize: 11, color: RED, fontFamily: "Inter_400Regular", flex: 1 }}>{verifyResult.reason}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Captured image preview */}
      {capturedImageUri && (
        <View style={{ borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: GREEN + "60" }}>
          <Image
            source={{ uri: capturedImageUri }}
            style={{ width: "100%", height: 140 }}
            resizeMode="cover"
          />
          <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "#00000080", borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Feather name="check" size={11} color={GREEN} />
            <Text style={{ fontSize: 10, color: GREEN, fontFamily: "Inter_600SemiBold" }}>Imagen capturada</Text>
          </View>
          <TouchableOpacity
            style={{ position: "absolute", top: 6, right: 6, backgroundColor: "#00000080", borderRadius: 16, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
            onPress={() => { setCapturedImageUri(null); setCapturedBase64(null); setScanResult(null); }}
          >
            <Feather name="x" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pestaña: Cámara / Galería ── */}
      {activeTab === "photo" && (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? "#1A2A3A" : "#EFF6FF", borderColor: BLUE }]}
            onPress={handlePhoto}
            disabled={scanning || submitting}
          >
            <View style={[s.actionIcon, { backgroundColor: BLUE + "22" }]}>
              {scanning
                ? <ActivityIndicator color={BLUE} size="small" />
                : <Feather name="camera" size={22} color={BLUE} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: BLUE, fontFamily: "Inter_600SemiBold" }}>
                {scanning ? "Procesando..." : isIdentity ? "Fotografiar documento de identidad" : "Fotografiar documento"}
              </Text>
              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 }}>
                {isIdentity
                  ? "Abre la cámara para fotografiar tu cédula o documento."
                  : "Fotografía el código de barras del documento."}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? "#1A2A1A" : "#F0FDF4", borderColor: GREEN }]}
            onPress={handleGallery}
            disabled={scanning || submitting}
          >
            <View style={[s.actionIcon, { backgroundColor: GREEN + "22" }]}>
              <Feather name="image" size={22} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: GREEN, fontFamily: "Inter_600SemiBold" }}>
                Seleccionar desde galería
              </Text>
              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 }}>
                Elige una imagen de tu galería con el código de barras visible.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pestaña: Escanear QR / código de barras ── */}
      {activeTab === "qr" && (
        <View style={{ gap: 10 }}>
          {/* Show the assigned barcode for reference */}
          {step.radicadoNumber && !isIdentity && (
            <View style={{ backgroundColor: isDark ? "#1C1C1E" : "#F9FAFB", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#E5E7EB" }}>
              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_500Medium", marginBottom: 6, textAlign: "center" }}>
                CÓDIGO ASIGNADO — Escanear este código
              </Text>
              <BarcodeDisplay value={step.radicadoNumber} showValue height={60} background={isDark ? "#1C1C1E" : "#FFFFFF"} lineColor={isDark ? "#FFFFFF" : "#1C1C1E"} />
            </View>
          )}

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? "#1A2D2A" : "#F0FDF4", borderColor: GREEN }]}
            onPress={handleScan}
            disabled={scanning || submitting}
          >
            <View style={[s.actionIcon, { backgroundColor: GREEN + "22" }]}>
              {scanning
                ? <ActivityIndicator color={GREEN} size="small" />
                : <Feather name="grid" size={22} color={GREEN} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: GREEN, fontFamily: "Inter_600SemiBold" }}>
                {scanning ? "Leyendo código..." : "Escanear código de barras"}
              </Text>
              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 }}>
                {isIdentity
                  ? "Apunta al código de barras del reverso de tu cédula."
                  : "Apunta la cámara al código de barras del comprobante."}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Pestaña: Datos manuales ── */}
      {activeTab === "manual" && (
        <View style={{ gap: 10 }}>
          {isIdentity ? (
            <>
              <View>
                <Text style={[s.fieldLabel, { color: textSec }]}>Número de documento</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border, fontSize: 16 }]}
                  value={docNumber}
                  onChangeText={(v) => { setDocNumber(v); setError(""); }}
                  placeholder="Número del documento de identidad"
                  placeholderTextColor={textSec}
                  keyboardType="default"
                />
              </View>
              <View>
                <Text style={[s.fieldLabel, { color: textSec }]}>Nombre completo (como aparece en el documento)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border, fontSize: 16 }]}
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setError(""); }}
                  placeholder="Nombre y apellido"
                  placeholderTextColor={textSec}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={[s.fieldLabel, { color: textSec }]}>
                Número de radicado{step.radicadoNumber ? " (asignado por Bancolombia)" : ""}
              </Text>
              {step.radicadoNumber && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, backgroundColor: PURPLE + "15" }}>
                  <Feather name="info" size={12} color={PURPLE} />
                  <Text style={{ fontSize: 11, color: PURPLE, fontFamily: "Inter_400Regular", flex: 1 }}>
                    Radicado asignado: <Text style={{ fontWeight: "700" }}>{step.radicadoNumber}</Text>. Encuéntralo bajo el código de barras del comprobante.
                  </Text>
                </View>
              )}
              <TextInput
                style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border, letterSpacing: 1, fontSize: 16 }]}
                value={radicado}
                onChangeText={(v) => { setRadicado(v); setError(""); }}
                placeholder="Ej: 2024-1234567"
                placeholderTextColor={textSec}
                keyboardType="default"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleManualConfirm}
              />
            </>
          )}
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={s.errorBox}>
          <Feather name="x-circle" size={15} color={RED} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Confirm button */}
      {activeTab === "manual" && (
        <TouchableOpacity
          style={[s.confirmBtn, { opacity: (submitting || verifying || (isRadicadoStep && !!verifyResult && !verifyResult.valid)) ? 0.6 : 1 }]}
          onPress={handleManualConfirm}
          disabled={submitting || verifying || (isRadicadoStep && !!verifyResult && !verifyResult.valid)}
        >
          {(submitting || verifying)
            ? <ActivityIndicator color="#1C1C1E" size="small" />
            : <Feather name={isRadicadoStep && !verifyResult ? "search" : "check"} size={16} color="#1C1C1E" />}
          <Text style={s.confirmBtnText}>
            {verifying ? "Verificando..." : isRadicadoStep && !verifyResult ? "Verificar radicado" : isRadicadoStep && verifyResult?.valid ? "Confirmar y enviar" : "Confirmar información"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
        <Text style={{ fontSize: 13, color: textSec }}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ══════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════ */
type Props = { visible: boolean; onClose: () => void; isDark: boolean };

export function UnblockProcessModal({ visible, onClose, isDark }: Props) {
  const { currentUser, submitUnblockStep, supportPhone } = useApp();
  const [activeStepId,     setActiveStepId]     = useState<string | null>(null);
  const [activeRadicados,  setActiveRadicados]   = useState<any[]>([]);

  React.useEffect(() => {
    if (!visible || !currentUser?.id) return;
    fetch(`/api/radicados?userId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((data) => {
        const now = Date.now();
        const active = Array.isArray(data)
          ? data.filter((r: any) => r.status === "active" && new Date(r.expiresAt + "T23:59:59").getTime() >= now)
          : [];
        setActiveRadicados(active);
      })
      .catch(() => setActiveRadicados([]));
  }, [visible, currentUser?.id]);

  const bg      = isDark ? "#0F0F11" : "#F8F9FB";
  const cardBg  = isDark ? "#1C1C1E" : "#FFFFFF";
  const text    = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const border  = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  const isBlocked      = currentUser?.status === "blocked";
  const accentColor    = isBlocked ? RED : ORANGE;
  const steps          = currentUser?.unblockSteps ?? [];
  const docs           = currentUser?.requiredDocuments ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const allDone        = steps.length > 0 && completedCount === steps.length;

  const handleSubmitStep = async (stepId: string, submissionType: SubmissionType, value?: string, imageBase64?: string, imageMime?: string) => {
    await submitUnblockStep(stepId, submissionType, value, imageBase64, imageMime);
    setActiveStepId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "94%", minHeight: "55%" }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB", borderRadius: 2, alignSelf: "center", marginTop: 10 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
                <Feather name={isBlocked ? "lock" : "alert-triangle"} size={17} color={accentColor} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Proceso de desbloqueo</Text>
                {steps.length > 0 && (
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular" }}>
                    {completedCount} de {steps.length} pasos completados
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={20} color={textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
            {/* Verification status banners */}
            {currentUser?.verificationStatus === "approved" && (
              <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: GREEN + "15", borderWidth: 1, borderColor: GREEN + "40", flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN + "22", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="check-circle" size={20} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold" }}>Verificación aprobada</Text>
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2 }}>Tu identidad ha sido verificada exitosamente. Tu cuenta ha sido desbloqueada.</Text>
                </View>
              </View>
            )}
            {currentUser?.verificationStatus === "failed" && (
              <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: RED + "15", borderWidth: 1, borderColor: RED + "40" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Feather name="x-circle" size={18} color={RED} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: RED, fontFamily: "Inter_700Bold" }}>Verificación fallida</Text>
                  {(currentUser.verificationAttempts ?? 0) > 0 && (
                    <View style={{ marginLeft: "auto", backgroundColor: RED + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, color: RED, fontFamily: "Inter_700Bold" }}>Intento {currentUser.verificationAttempts}/5</Text>
                    </View>
                  )}
                </View>
                {currentUser.verificationFailedReason && (
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 }}>
                    <Text style={{ fontWeight: "700", color: text }}>Motivo: </Text>{currentUser.verificationFailedReason}
                  </Text>
                )}
                {(currentUser.verificationAttempts ?? 0) < 5 ? (
                  <Text style={{ fontSize: 12, color: YELLOW, fontFamily: "Inter_500Medium" }}>
                    Puedes volver a enviar tu documentación. Por favor corrige los documentos indicados y vuelve a intentarlo.
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: RED, fontFamily: "Inter_500Medium" }}>
                    Has alcanzado el límite de intentos (5). Contacta a soporte para más ayuda.
                  </Text>
                )}
              </View>
            )}
            {currentUser?.verificationStatus === "pending_review" && (
              <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: BLUE + "12", borderWidth: 1, borderColor: BLUE + "30", flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE + "22", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="clock" size={18} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: BLUE, fontFamily: "Inter_700Bold" }}>En revisión por el equipo</Text>
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 }}>Todos tus documentos han sido enviados. El equipo de Bancolombia revisará tu caso en 1–3 días hábiles.</Text>
                </View>
              </View>
            )}

            {/* Status banner */}
            {!currentUser?.verificationStatus && (
            <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: accentColor + "12", borderWidth: 1, borderColor: accentColor + "30" }}>
              {currentUser?.suspensionReason && (
                <Text style={{ fontSize: 13, color: accentColor, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 }}>
                  Motivo: {currentUser.suspensionReason}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
                {isBlocked
                  ? "Tu cuenta está bloqueada. Completa los pasos para que el equipo de Bancolombia revise tu caso."
                  : "Tu cuenta está en revisión. Completa los pasos a continuación para acelerar el proceso de habilitación."}
              </Text>
            </View>
            )}

            {/* Active radicados mandatory banner */}
            {activeRadicados.length > 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: ORANGE + "50" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: ORANGE + "18" }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: ORANGE + "22", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="tag" size={16} color={ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: ORANGE, fontFamily: "Inter_700Bold" }}>
                      Radicado{activeRadicados.length > 1 ? "s" : ""} de documento pendiente{activeRadicados.length > 1 ? "s" : ""}
                    </Text>
                    <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                      Debes presentar el código de barras de tu{activeRadicados.length > 1 ? "s" : ""} documento{activeRadicados.length > 1 ? "s" : ""} radicado{activeRadicados.length > 1 ? "s" : ""}.
                    </Text>
                  </View>
                </View>
                {activeRadicados.map((rad: any) => (
                  <View key={rad.id} style={{ flexDirection: "row", gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: ORANGE + "30", backgroundColor: isDark ? "#18130A" : "#FFFBF0", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: ORANGE, fontFamily: "Inter_700Bold", letterSpacing: 0.5 }}>{rad.radicado}</Text>
                      <Text style={{ fontSize: 10, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2 }}>{rad.motive}</Text>
                    </View>
                    {rad.expiresAt && <RadicadoCountdown expiresAt={rad.expiresAt} />}
                  </View>
                ))}
              </View>
            )}

            {/* Required docs (no steps) */}
            {docs.length > 0 && steps.length === 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Feather name="file-text" size={14} color={BLUE} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Documentos requeridos</Text>
                </View>
                {docs.map((doc: string, i: number) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE + "22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: BLUE }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: text, fontFamily: "Inter_400Regular", lineHeight: 18 }}>{doc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Timeline */}
            {steps.length > 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Feather name="list" size={14} color={text} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Pasos del proceso</Text>
                </View>

                {steps.map((step: SuspensionStep, i: number) => {
                  const isLast   = i === steps.length - 1;
                  const isDone   = step.completed;
                  const isNext   = !isDone && steps.slice(0, i).every((ss) => ss.completed);
                  const isActive = activeStepId === step.id;

                  return (
                    <View key={step.id} style={{ flexDirection: "row", gap: 12 }}>
                      {/* Timeline dot + line */}
                      <View style={{ alignItems: "center", width: 32 }}>
                        <View style={[s.dot, {
                          backgroundColor: isDone ? GREEN : isNext ? accentColor : (isDark ? "#2C2C2E" : "#E5E7EB"),
                          borderColor: isDone ? GREEN : isNext ? accentColor : (isDark ? "#3A3A3C" : "#D1D5DB"),
                          borderWidth: isDone ? 0 : 2,
                        }]}>
                          {isDone
                            ? <Feather name="check" size={12} color="#FFF" />
                            : <Text style={{ fontSize: 10, fontWeight: "700", color: isNext ? accentColor : textSec }}>{i + 1}</Text>
                          }
                        </View>
                        {!isLast && (
                          <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: isDone ? GREEN + "60" : (isDark ? "#2C2C2E" : "#E5E7EB"), marginTop: 4 }} />
                        )}
                      </View>

                      {/* Step card */}
                      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                        <View style={[s.stepCard, { backgroundColor: cardBg, borderColor: isDone ? GREEN + "40" : isNext ? accentColor + "35" : border }]}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                            <StepTypeIcon type={step.type} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: "700", color: isDone ? GREEN : text, fontFamily: "Inter_700Bold" }}>{step.label}</Text>
                              <Text style={{ fontSize: 10, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                                <StepTypeLabel type={step.type} />
                              </Text>
                            </View>
                            {isDone && (
                              <View style={{ backgroundColor: GREEN + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 10, color: GREEN, fontWeight: "700", fontFamily: "Inter_700Bold" }}>✓ Enviado</Text>
                              </View>
                            )}
                          </View>

                          {step.description ? (
                            <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", marginBottom: 8, lineHeight: 17 }}>{step.description}</Text>
                          ) : null}

                          {/* Show barcode for document/radicado steps */}
                          {!isDone && step.radicadoNumber && (step.type === "document" || step.type === "tax_certificate" || step.type === "radicado") && (
                            <View style={{ backgroundColor: isDark ? "#111" : "#F9FAFB", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#E5E7EB" }}>
                              <Text style={{ fontSize: 10, color: textSec, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 4 }}>
                                CÓDIGO DE BARRAS · RADICADO
                              </Text>
                              <BarcodeDisplay
                                value={step.radicadoNumber}
                                showValue
                                height={55}
                                background={isDark ? "#111111" : "#FFFFFF"}
                                lineColor={isDark ? "#FFFFFF" : "#1C1C1E"}
                              />
                            </View>
                          )}

                          {isDone && step.completedAt && (
                            <Text style={{ fontSize: 11, color: GREEN + "AA", fontFamily: "Inter_400Regular" }}>
                              Enviado el {new Date(step.completedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                            </Text>
                          )}

                          {!isDone && isNext && !isActive && (
                            <TouchableOpacity
                              style={[s.advanceBtn, { borderColor: GREEN, backgroundColor: GREEN + "12" }]}
                              onPress={() => setActiveStepId(step.id)}
                            >
                              <Feather name="upload" size={13} color={GREEN} />
                              <Text style={{ fontSize: 12, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold" }}>Enviar documentación</Text>
                            </TouchableOpacity>
                          )}

                          {!isDone && !isNext && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <Feather name="lock" size={11} color={textSec} />
                              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular" }}>Completa el paso anterior primero</Text>
                            </View>
                          )}

                          {/* Panel universal inline */}
                          {isActive && (
                            <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: border }}>
                              <UniversalStepPanel
                                step={step}
                                onSubmit={(t, v, img64, imgMime) => handleSubmitStep(step.id, t, v, img64, imgMime)}
                                onClose={() => setActiveStepId(null)}
                                isDark={isDark}
                                currentUser={currentUser}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {allDone && (
                  <View style={{ marginTop: 16, padding: 20, borderRadius: 14, backgroundColor: GREEN + "15", borderWidth: 1, borderColor: GREEN + "40", alignItems: "center", gap: 10 }}>
                    <Feather name="check-circle" size={32} color={GREEN} />
                    <Text style={{ fontSize: 15, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold", textAlign: "center" }}>
                      ¡Todos los pasos completados!
                    </Text>
                    <Text style={{ fontSize: 13, color: textSec, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 }}>
                      Tu caso será revisado por el equipo de Bancolombia en los próximos 1–3 días hábiles.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* WhatsApp support */}
            {supportPhone && (
              <TouchableOpacity
                style={{ marginHorizontal: 20, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, backgroundColor: "#25D36620", borderWidth: 1, borderColor: "#25D36640" }}
                onPress={() => Linking.openURL(`https://wa.me/${supportPhone}`)}
              >
                <Feather name="message-circle" size={18} color="#25D366" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#25D366", fontFamily: "Inter_700Bold" }}>¿Necesitas ayuda?</Text>
                  <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>Contáctanos por WhatsApp</Text>
                </View>
                <Feather name="chevron-right" size={15} color="#25D366" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  advanceBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { height: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: "Inter_400Regular" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#EF444420" },
  errorText: { fontSize: 12, color: "#EF4444", fontFamily: "Inter_400Regular", flex: 1 },

  confirmBtn: { backgroundColor: "#FDDA24", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  confirmBtnText: { fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
});
