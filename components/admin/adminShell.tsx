import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemePreference } from "@/context/theme-preference";

type AdminMenuItem = {
  label: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
};

const MENU_ITEMS: AdminMenuItem[] = [
  { label: "Dashboard", route: "/dashboard", icon: "grid" },
  { label: "Shop", route: "/shop", icon: "shopping-bag" },
  { label: "Orders", route: "/orders", icon: "truck" },
  { label: "Reports", route: "/reports", icon: "bar-chart-2" },
  { label: "Categories", route: "/categories", icon: "tag" },
  { label: "Products", route: "/products", icon: "box" },
  { label: "Customers", route: "/customers", icon: "users" },
  { label: "Users", route: "/users", icon: "user" },
  { label: "Settings", route: "/settings", icon: "settings" },
];
const SIDEBAR_WIDTH = 260;
const DRAWER_BREAKPOINT = 1024;

const LIGHT_COLORS = {
  pageBg: "#f4f4f5",
  panelBg: "#ffffff",
  muted: "#71717a",
  text: "#111827",
  line: "#e4e4e7",
  accent: "#0f172a",
  soft: "#f8fafc",
  success: "#059669",
  warning: "#d97706",
  rose: "#bd6281",
} as const;

const DARK_COLORS: typeof LIGHT_COLORS = {
  pageBg: "#0b0b0c",
  panelBg: "#111214",
  muted: "#a1a1aa",
  text: "#f4f4f5",
  line: "#27272a",
  accent: "#e2e8f0",
  soft: "#18181b",
  success: "#22c55e",
  warning: "#f59e0b",
  rose: "#d47f97",
};

let currentScheme: "light" | "dark" = "light";

function getAdminColors(scheme: "light" | "dark") {
  return scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

export const COLORS: typeof LIGHT_COLORS = {
  get pageBg() {
    return getAdminColors(currentScheme).pageBg;
  },
  get panelBg() {
    return getAdminColors(currentScheme).panelBg;
  },
  get muted() {
    return getAdminColors(currentScheme).muted;
  },
  get text() {
    return getAdminColors(currentScheme).text;
  },
  get line() {
    return getAdminColors(currentScheme).line;
  },
  get accent() {
    return getAdminColors(currentScheme).accent;
  },
  get soft() {
    return getAdminColors(currentScheme).soft;
  },
  get success() {
    return getAdminColors(currentScheme).success;
  },
  get warning() {
    return getAdminColors(currentScheme).warning;
  },
  get rose() {
    return getAdminColors(currentScheme).rose;
  },
};

export function useAdminColors() {
  const { resolvedScheme } = useThemePreference();
  currentScheme = resolvedScheme;
  return React.useMemo(() => getAdminColors(resolvedScheme), [resolvedScheme]);
}

function useAdminTheme() {
  const colors = useAdminColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return { colors, styles };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminShell({
  title,
  subtitle,
  activeRoute,
  children,
}: {
  title: string;
  subtitle: string;
  activeRoute: string;
  children: React.ReactNode;
}) {
  const { colors, styles } = useAdminTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width < DRAWER_BREAKPOINT;
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isCompact) {
      setIsDrawerOpen(false);
    }
  }, [isCompact]);

  const onNavigate = React.useCallback(
    (route: string) => {
      router.push(route as never);
      if (isCompact) {
        setIsDrawerOpen(false);
      }
    },
    [isCompact, router]
  );

  const renderSidebar = () => (
    <View
      style={[
        styles.sidebar,
        { paddingTop: 18 + (isCompact ? insets.top : 0) },
      ]}
    >
      <Pressable style={styles.brandWrap} onPress={() => onNavigate("/dashboard")}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>Sleep Sheet</Text>
      </Pressable>
      <Text style={styles.groupLabel}>ADMIN PANEL</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isOrdersRoute = activeRoute.includes("orders");
          const active =
            (item.route === "/orders" && isOrdersRoute) ||
            activeRoute === item.route ||
            (item.route !== "/dashboard" && activeRoute.startsWith(item.route));

          return (
            <Pressable
              key={item.route}
              style={[styles.menuItem, active ? styles.menuItemActive : undefined]}
              onPress={() => onNavigate(item.route)}
            >
              <Feather name={item.icon} size={16} color={active ? colors.text : colors.muted} />
              <Text style={[styles.menuText, active ? styles.menuTextActive : undefined]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.page}>
      {!isCompact ? renderSidebar() : null}

      <View style={styles.main}>
        <View
          style={[
            styles.navbar,
            isCompact
              ? {
                  height: 62 + insets.top,
                  paddingTop: insets.top,
                }
              : null,
          ]}
        >
          <View style={styles.titleRow}>
            {isCompact ? (
              <Pressable style={styles.iconButton} onPress={() => setIsDrawerOpen(true)}>
                <Feather name="menu" size={16} color={colors.text} />
              </Pressable>
            ) : null}
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <View style={styles.navActions}>
            <View style={styles.iconButton}>
              <Ionicons name="globe-outline" size={16} color={colors.text} />
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>

      {isCompact && isDrawerOpen ? (
        <View style={styles.drawerLayer}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setIsDrawerOpen(false)} />
          <View style={styles.drawerPanel}>{renderSidebar()}</View>
        </View>
      ) : null}
    </View>
  );
}

export function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useAdminTheme();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function AdminStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const { colors, styles } = useAdminTheme();
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Feather name={icon} size={15} color={colors.accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: typeof LIGHT_COLORS) {
  return StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBg,
    flexDirection: "row",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    backgroundColor: colors.panelBg,
    paddingTop: 18,
    paddingHorizontal: 14,
    flex: 1,
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: "row",
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  drawerPanel: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: colors.panelBg,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.rose,
    marginRight: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  menuTextActive: {
    color: colors.text,
    fontWeight: "600",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  navbar: {
    height: 62,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panelBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelBg,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.panelBg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: colors.panelBg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    minWidth: 170,
    flexGrow: 1,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  });
}
