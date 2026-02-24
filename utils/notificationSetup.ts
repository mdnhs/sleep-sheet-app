import Constants from "expo-constants";
import { Platform } from "react-native";

let notificationsModulePromise:
  | Promise<typeof import("expo-notifications") | null>
  | null = null;

async function getNotificationsModule() {
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  if (Platform.OS === "web" || typeof window === "undefined" || isExpoGo) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }

  return notificationsModulePromise;
}

export async function setupNotificationHandler() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Ask for permissions
export async function registerForPushNotificationsAsync() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Failed to get push notification permissions");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export async function subscribeToNotificationEvents({
  onReceive,
  onResponse,
}: {
  onReceive?: (notification: unknown) => void;
  onResponse?: (response: unknown) => void;
}) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return () => {};

  const foregroundSub = Notifications.addNotificationReceivedListener(
    (notification) => {
      onReceive?.(notification);
    }
  );

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onResponse?.(response);
    }
  );

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

export async function scheduleOrderNotification(customerName: string) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🛍️ New Order Found!",
      body: `Order from ${customerName} just arrived.`,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}
