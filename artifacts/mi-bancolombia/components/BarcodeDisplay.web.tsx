import JsBarcode from "jsbarcode";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  value: string;
  label?: string;
  width?: number;
  height?: number;
  showValue?: boolean;
  lineColor?: string;
  background?: string;
};

export function BarcodeDisplay({
  value,
  label,
  width = 300,
  height = 72,
  showValue = true,
  lineColor = "#1C1C1E",
  background = "#FFFFFF",
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value.toUpperCase(), {
        format: "CODE128",
        width: 2,
        height,
        displayValue: showValue,
        fontSize: 13,
        margin: 8,
        marginTop: 6,
        marginBottom: 6,
        background,
        lineColor,
        font: "monospace",
      });
    } catch {
      // If encoding fails (e.g. invalid chars), try with filtered value
      try {
        const safe = value.replace(/[^A-Z0-9\-./+% ]/gi, "").toUpperCase();
        JsBarcode(svgRef.current, safe || "INVALID", {
          format: "CODE128",
          width: 2,
          height,
          displayValue: showValue,
          fontSize: 13,
          margin: 8,
          background,
          lineColor,
        });
      } catch {}
    }
  }, [value, height, showValue, lineColor, background]);

  return (
    <View style={[styles.container, { maxWidth: width }]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      {/* @ts-ignore — web-only SVG element */}
      <svg ref={svgRef} style={{ width: "100%", maxWidth: width }} />
      {!value && (
        <Text style={styles.empty}>Sin código asignado</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
  },
  label: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    padding: 16,
  },
});
