import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

const ADMIN_BG = "#0A0E27";
const ADMIN_ACTIVE = "#FDDA24";
const ADMIN_INACTIVE = "rgba(255,255,255,0.4)";

type FeatherName = keyof typeof Feather.glyphMap;

function TabIcon({ name, focused }: { name: FeatherName; focused: boolean }) {
  return (
    <View style={focused ? styles.activeWrap : styles.wrap}>
      <Feather name={name} size={22} color={focused ? ADMIN_ACTIVE : ADMIN_INACTIVE} />
    </View>
  );
}

export default function AdminLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ADMIN_ACTIVE,
        tabBarInactiveTintColor: ADMIN_INACTIVE,
        tabBarStyle: {
          backgroundColor: ADMIN_BG,
          borderTopWidth: 1,
          borderTopColor: "rgba(253,218,36,0.25)",
          elevation: 0,
          shadowOpacity: 0,
          height: isWeb ? 72 : 70,
          paddingBottom: isWeb ? 10 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: ADMIN_BG }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-2" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Usuarios",
          tabBarIcon: ({ focused }) => <TabIcon name="users" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cuentas"
        options={{
          title: "Cuentas",
          tabBarIcon: ({ focused }) => <TabIcon name="credit-card" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="apelacion"
        options={{
          title: "Apelación",
          tabBarIcon: ({ focused }) => <TabIcon name="shield" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: "Config.",
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="movimientos"
        options={{ href: null, tabBarItemStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="auditoria"
        options={{ href: null, tabBarItemStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="radicado"
        options={{ href: null, tabBarItemStyle: { display: "none" } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  activeWrap: { alignItems: "center", justifyContent: "center" },
});
