const BANCOLOMBIA_YELLOW = "#FDDA24";

/**
 * Dark background color extracted from the Mi Bancolombia logo icon background:
 * a dark charcoal with a very slight warm tone — NOT pure black.
 * Matches the official Mi Bancolombia dark mode.
 */
const DARK_BG       = "#1B1B1F";   // logo background — dark charcoal
const DARK_SURFACE  = "#232328";   // cards / panels
const DARK_CARD     = "#2A2A30";   // elevated cards inside panels
const DARK_TABBAR   = "#161619";   // bottom tab bar (slightly darker than bg)
const DARK_BORDER   = "rgba(255,255,255,0.07)";
const DARK_DIVIDER  = "rgba(255,255,255,0.05)";

const light = {
  text:           "#1C1C1E",
  textSecondary:  "#6B7280",
  textLight:      "#9CA3AF",
  background:     "#F5F5F7",
  surface:        "#FFFFFF",
  card:           "#FFFFFF",
  cardBorder:     "#F0F0F0",
  tint:           BANCOLOMBIA_YELLOW,
  tabBar:         "#FFFFFF",
  tabIconDefault: "#9CA3AF",
  tabIconSelected:"#1C1C1E",
  border:         "#E5E7EB",
  yellow:         BANCOLOMBIA_YELLOW,
  yellowDark:     "#E6C000",
  dark:           "#1C1C1E",
  navy:           "#0A0E27",
  success:        "#10B981",
  error:          "#EF4444",
  warning:        "#F59E0B",
  info:           "#3B82F6",
  overlay:        "rgba(0,0,0,0.5)",
  inputBg:        "#F5F5F7",
  inputBorder:    "#E5E7EB",
  divider:        "#F0F0F2",
  shadow:         "#000000",
  headerBg:       "#FFFFFF",
  heroSection:    "#FFFFFF",
  sectionBg:      "#F5F5F7",
  balanceText:    "#1C1C1E",
  chipActive:     "#FDDA2418",
};

const dark = {
  text:           "#FFFFFF",
  textSecondary:  "rgba(255,255,255,0.52)",
  textLight:      "rgba(255,255,255,0.30)",
  background:     DARK_BG,
  surface:        DARK_SURFACE,
  card:           DARK_CARD,
  cardBorder:     DARK_BORDER,
  tint:           BANCOLOMBIA_YELLOW,
  tabBar:         DARK_TABBAR,
  tabIconDefault: "rgba(255,255,255,0.35)",
  tabIconSelected:BANCOLOMBIA_YELLOW,
  border:         DARK_BORDER,
  yellow:         BANCOLOMBIA_YELLOW,
  yellowDark:     "#E6C000",
  dark:           "#FFFFFF",
  navy:           "#0A0E27",
  success:        "#10B981",
  error:          "#EF4444",
  warning:        "#F59E0B",
  info:           "#3B82F6",
  overlay:        "rgba(0,0,0,0.75)",
  inputBg:        DARK_SURFACE,
  inputBorder:    "rgba(255,255,255,0.10)",
  divider:        DARK_DIVIDER,
  shadow:         "#000000",
  headerBg:       DARK_BG,
  heroSection:    DARK_BG,
  sectionBg:      DARK_SURFACE,
  balanceText:    BANCOLOMBIA_YELLOW,
  chipActive:     "rgba(253,218,36,0.10)",
};

export default { light, dark };
export type ColorScheme = typeof light;
