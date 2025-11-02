import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { registerForPushNotificationsAsync } from "@/utils/notificationSetup"; // your setup file

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 🔔 Register for notifications when app loads
    registerForPushNotificationsAsync();

    // ✅ Foreground listener
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received:", notification);
      }
    );

    // ✅ Background/Interaction listener (when user taps)
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👉 Notification clicked:", response);
        // You can navigate here if needed later
        // e.g., router.push("/orders");
      }
    );

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      {/* ✅ Status bar setup */}
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor={colorScheme === "dark" ? "#111827" : "#ffffff"}
      />

      {/* ✅ Toast setup */}
      <Toast />
    </ThemeProvider>
  );
}
