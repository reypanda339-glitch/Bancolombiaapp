const BANCOLOMBIA_YELLOW = "#FDDA24";
const BANCOLOMBIA_DARK = "#1C1C1E";
const BANCOLOMBIA_NAVY = "#0A0E27";

const light = {
  text: "#1C1C1E",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  tint: BANCOLOMBIA_YELLOW,
  tabIconDefault: "rgba(255,255,255,0.45)",
  tabIconSelected: BANCOLOMBIA_YELLOW,
  border: "#E5E7EB",
  yellow: BANCOLOMBIA_YELLOW,
  yellowDark: "#E6C000",
  dark: BANCOLOMBIA_DARK,
  navy: BANCOLOMBIA_NAVY,
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  overlay: "rgba(0,0,0,0.5)",
  inputBg: "#F5F5F7",
  inputBorder: "#E5E7EB",
  divider: "#F0F0F2",
  shadow: "#000000",
};

const dark = {
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.55)",
  textLight: "rgba(255,255,255,0.35)",
  background: "#1C1C1E",
  surface: "#2C2C2E",
  card: "#3A3A3C",
  tint: BANCOLOMBIA_YELLOW,
  tabIconDefault: "rgba(255,255,255,0.45)",
  tabIconSelected: BANCOLOMBIA_YELLOW,
  border: "rgba(255,255,255,0.1)",
  yellow: BANCOLOMBIA_YELLOW,
  yellowDark: "#E6C000",
  dark: "#FFFFFF",
  navy: BANCOLOMBIA_NAVY,
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  overlay: "rgba(0,0,0,0.7)",
  inputBg: "#2C2C2E",
  inputBorder: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.06)",
  shadow: "#000000",
};

export default { light, dark };

export type ColorScheme = typeof light;
