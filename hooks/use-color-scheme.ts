import { useThemePreference } from "@/context/theme-preference";

export function useColorScheme() {
  return useThemePreference().resolvedScheme;
}
