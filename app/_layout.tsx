import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { ThemePreferenceProvider, useThemePreference } from "@/context/theme-preference";
import {
  registerForPushNotificationsAsync,
  setupNotificationHandler,
  subscribeToNotificationEvents,
} from "@/utils/notificationSetup";

function RootLayoutInner() {
  const { resolvedScheme } = useThemePreference();

  useEffect(() => {
    let cleanup = () => {};
    let isMounted = true;

    (async () => {
      await setupNotificationHandler();
      await registerForPushNotificationsAsync();
      const unsubscribe = await subscribeToNotificationEvents({
        onReceive: (notification) => {
          console.log("📩 Notification received:", notification);
        },
        onResponse: (response) => {
          console.log("👉 Notification clicked:", response);
        },
      });

      if (isMounted) {
        cleanup = unsubscribe;
      } else {
        unsubscribe();
      }
    })();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  return (
    <ThemeProvider value={resolvedScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="dashboard" screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      {/* ✅ Status bar setup */}
      <StatusBar
        style={resolvedScheme === "dark" ? "light" : "dark"}
        backgroundColor={resolvedScheme === "dark" ? "#0b0b0c" : "#f4f4f5"}
      />

      {/* ✅ Toast setup */}
      <Toast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutInner />
    </ThemePreferenceProvider>
  );
}
