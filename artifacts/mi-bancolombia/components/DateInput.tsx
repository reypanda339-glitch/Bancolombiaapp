import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function autoFormatDMY(raw: string): string {
  let v = digitsOnly(raw);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5);
  return v.slice(0, 10);
}

export function dmyToYmd(dmy: string): string {
  const p = dmy.split("/");
  if (p.length !== 3 || p[2].length < 4) return "";
  return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
}

export function ymdToDmy(ymd: string): string {
  if (!ymd || ymd.length < 10) return "";
  const p = ymd.split("-");
  if (p.length !== 3) return "";
  return `${p[2].padStart(2, "0")}/${p[1].padStart(2, "0")}/${p[0]}`;
}

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface DateInputProps {
  value: string;
  onChange: (v: string) => void;
  outputFormat?: "DMY" | "YMD";
  style?: any;
  inputStyle?: any;
  error?: boolean;
  placeholder?: string;
  isDark?: boolean;
  minDate?: string;
  maxDate?: string;
  fontSize?: number;
}

/**
 * DateInput — auto-formats DD/MM/AAAA as the user types.
 * A calendar icon opens a native date picker (web) or falls back to text entry.
 *
 * outputFormat="DMY" → onChange emits "DD/MM/YYYY"   (default)
 * outputFormat="YMD" → onChange emits "YYYY-MM-DD"
 *
 * The displayed value is always DD/MM/AAAA regardless of outputFormat.
 */
export function DateInput({
  value,
  onChange,
  outputFormat = "DMY",
  style,
  inputStyle,
  error = false,
  placeholder = "DD/MM/AAAA",
  isDark = true,
  minDate,
  maxDate,
  fontSize = 16,
}: DateInputProps) {
  const hiddenRef = useRef<any>(null);

  const displayValue =
    outputFormat === "YMD" ? ymdToDmy(value) : value;

  const emit = (dmy: string) => {
    if (outputFormat === "YMD") {
      const ymd = dmyToYmd(dmy);
      onChange(ymd !== "" ? ymd : "");
    } else {
      onChange(dmy);
    }
  };

  const handleChange = (raw: string) => {
    const digits = digitsOnly(raw);
    const fmt = autoFormatDMY(digits);
    emit(fmt);
  };

  const openCalendar = () => {
    if (Platform.OS === "web" && hiddenRef.current) {
      try {
        hiddenRef.current.showPicker?.();
      } catch {
        hiddenRef.current.click?.();
      }
    }
  };

  const handleNativeChange = (e: any) => {
    if (Platform.OS !== "web") return;
    const ymdVal: string = e.target.value;
    if (!ymdVal) return;
    if (outputFormat === "YMD") {
      onChange(ymdVal);
    } else {
      onChange(ymdToDmy(ymdVal));
    }
  };

  const calendarValue =
    outputFormat === "YMD" ? value : dmyToYmd(value);

  const borderColor = error
    ? "#EF4444"
    : isDark
    ? "rgba(255,255,255,0.15)"
    : "#D1D5DB";
  const bg = isDark ? "rgba(255,255,255,0.06)" : "#F9FAFB";
  const textColor = isDark ? "#FFFFFF" : "#111827";
  const iconColor = isDark ? "rgba(255,255,255,0.45)" : "#6B7280";
  const dividerColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  return (
    <View style={[{ position: "relative" }, style]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor,
          overflow: "hidden",
        }}
      >
        <TextInput
          style={[
            {
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 13,
              color: textColor,
              fontFamily: "Inter_400Regular",
              fontSize,
            },
            inputStyle,
          ]}
          value={displayValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={iconColor}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity
          onPress={openCalendar}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 13,
            borderLeftWidth: 1,
            borderLeftColor: dividerColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="calendar" size={18} color={iconColor} />
        </TouchableOpacity>
      </View>

      {Platform.OS === "web" && (
        // @ts-ignore — web-only element
        <input
          ref={hiddenRef}
          type="date"
          value={calendarValue ?? ""}
          min={minDate ?? ""}
          max={maxDate ?? ""}
          onChange={handleNativeChange}
          style={{
            position: "absolute",
            opacity: 0,
            width: "1px",
            height: "1px",
            bottom: 0,
            right: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
          tabIndex={-1}
        />
      )}
    </View>
  );
}
