import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const YELLOW = "#FDDA24";

type FeatherName = keyof typeof Feather.glyphMap;

function TabIcon({ name, focused, C }: { name: FeatherName; focused: boolean; C: any }) {
  return (
    <View style={styles.iconWrap}>
      <Feather
        name={name}
        size={22}
        color={focused ? C.tabIconSelected : C.tabIconDefault}
      />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

function QRTabIcon({ focused, C }: { focused: boolean; C: any }) {
  return (
    <View style={styles.qrWrap}>
      <View style={[styles.qrBtn, focused && styles.qrBtnActive]}>
        <Feather name="maximize" size={22} color={focused ? "#1C1C1E" : "#FFFFFF"} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { C, isDark } = useTheme();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? YELLOW : "#1C1C1E",
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 16,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.5 : 0.08,
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
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} C={C} />,
          tabBarActiveTintColor: isDark ? YELLOW : "#1C1C1E",
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ focused }) => <TabIcon name="clock" focused={focused} C={C} />,
          tabBarActiveTintColor: isDark ? YELLOW : "#1C1C1E",
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: "Transferir",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <QRTabIcon focused={focused} C={C} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Explorar",
          tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} C={C} />,
          tabBarActiveTintColor: isDark ? YELLOW : "#1C1C1E",
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Más",
          tabBarIcon: ({ focused }) => <TabIcon name="menu" focused={focused} C={C} />,
          tabBarActiveTintColor: isDark ? YELLOW : "#1C1C1E",
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
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: YELLOW,
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  qrBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#1C1C1E",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  qrBtnActive: {
    backgroundColor: YELLOW,
  },
});
