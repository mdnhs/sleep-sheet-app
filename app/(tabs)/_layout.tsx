import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  const PRIMARY = "#bd6281";
  const SECONDARY = "#df9e98";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Tab bar background and shape
        tabBarStyle: {
          backgroundColor: "#fff", // clean white background
          borderTopWidth: 1,
          borderTopColor: "#f1f1f1",
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },

        // Tab colors
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#9CA3AF",

        // Label styling
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
