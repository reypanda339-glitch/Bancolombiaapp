import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View, Text, Alert } from "react-native";

type FeatherName = keyof typeof Feather.glyphMap;

const WHITE_BG = "#FFFFFF";
const ACTIVE_COLOR = "#1C1C1E";
const INACTIVE_COLOR = "#9CA3AF";
const YELLOW = "#FDDA24";

function TabIcon({ name, focused, badge }: { name: FeatherName; focused: boolean; badge?: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Feather name={name} size={23} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
      {badge && <View style={styles.badge} />}
      {focused && <View style={styles.dot} />}
    </View>
  );
}

function QRTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.qrWrap}>
      <View style={[styles.qrBtn, focused && styles.qrBtnActive]}>
        <Feather name="maximize" size={22} color={focused ? "#1C1C1E" : "#FFFFFF"} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: WHITE_BG,
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -2 },
          height: isWeb ? 76 : 80,
          paddingBottom: isWeb ? 10 : 14,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ focused }) => <TabIcon name="clock" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: "Transferir",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <QRTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Explorar",
          tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Más",
          tabBarIcon: ({ focused }) => <TabIcon name="menu" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: YELLOW,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  qrBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  qrBtnActive: {
    backgroundColor: YELLOW,
  },
});
