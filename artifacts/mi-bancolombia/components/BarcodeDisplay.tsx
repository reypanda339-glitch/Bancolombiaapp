import React from "react";
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

// Native fallback: visual representation of a barcode using characters
export function BarcodeDisplay({ value, label, background = "#FFFFFF" }: Props) {
  // Generate a pseudo-barcode visual using vertical bars
  const pattern = Array.from(value).map((c) => c.charCodeAt(0));

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.barWrap}>
        {/* Start bars */}
        {[3, 1, 1, 2, 1, 4].map((w, i) => (
          <View
            key={`s${i}`}
            style={[
              styles.bar,
              {
                width: w * 2,
                backgroundColor: i % 2 === 0 ? "#1C1C1E" : "transparent",
              },
            ]}
          />
        ))}
        {pattern.map((code, ci) =>
          [
            ((code >> 5) & 3) + 1,
            ((code >> 4) & 1) + 1,
            ((code >> 3) & 3) + 1,
            ((code >> 2) & 1) + 1,
            ((code >> 1) & 3) + 1,
            (code & 1) + 1,
          ].map((w, bi) => (
            <View
              key={`${ci}-${bi}`}
              style={[
                styles.bar,
                {
                  width: w * 2,
                  backgroundColor: bi % 2 === 0 ? "#1C1C1E" : "transparent",
                },
              ]}
            />
          ))
        )}
        {/* Stop bars */}
        {[2, 3, 3, 1, 1, 1, 2].map((w, i) => (
          <View
            key={`e${i}`}
            style={[
              styles.bar,
              {
                width: w * 2,
                backgroundColor: i % 2 === 0 ? "#1C1C1E" : "transparent",
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 10 },
  label: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  barWrap: { flexDirection: "row", height: 72, alignItems: "stretch" },
  bar: { height: "100%" },
  value: { fontSize: 12, fontFamily: "monospace", marginTop: 6, color: "#1C1C1E", letterSpacing: 1.5 },
});
