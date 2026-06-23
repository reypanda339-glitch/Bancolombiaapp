import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  pin: string;
  onPress: (digit: string) => void;
  onDelete: () => void;
  isDark?: boolean;
};

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

const { width: SCREEN_W } = Dimensions.get("window");
const KEY_SIZE = Math.min(80, Math.floor((Math.min(SCREEN_W, 430) - 96) / 3));
const KEY_FONT = Math.round(KEY_SIZE * 0.35);

export function PinPad({ pin, onPress, onDelete, isDark = false }: Props) {
  const keyBg = isDark ? "rgba(255,255,255,0.1)" : "#F0F0F2";
  const keyColor = isDark ? "#FFFFFF" : "#1C1C1E";
  const dotColor = isDark ? "#FFFFFF" : "#1C1C1E";

  const handlePress = (key: string) => {
    if (key === "") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "del") {
      onDelete();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: dotColor },
              i < pin.length && { backgroundColor: dotColor },
            ]}
          />
        ))}
      </View>
      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  styles.key,
                  { backgroundColor: keyBg },
                  key === "" && styles.keyEmpty,
                ]}
                onPress={() => handlePress(key)}
                activeOpacity={key === "" ? 1 : 0.6}
              >
                {key === "del" ? (
                  <Feather name="delete" size={22} color={keyColor} />
                ) : (
                  <Text style={[styles.keyText, { color: keyColor }]}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 32,
    marginTop: 8,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  pad: {
    width: "100%",
    gap: 10,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    backgroundColor: "transparent",
  },
  keyText: {
    fontSize: KEY_FONT,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.3,
  },
});
