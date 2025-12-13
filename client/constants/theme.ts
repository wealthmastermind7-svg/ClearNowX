import { Platform } from "react-native";

// ClearNowX Design System
export const Colors = {
  // Primary brand colors
  background: "#0B0C0F",
  accent: "#7DF9FF",
  accentDim: "rgba(125, 249, 255, 0.6)",
  
  // Glass effects
  glassWhite: "rgba(255, 255, 255, 0.20)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
  glassHighlight: "rgba(255, 255, 255, 0.05)",
  
  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.5)",
  textDisabled: "rgba(255, 255, 255, 0.3)",
  
  // Status colors
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#EF4444",
  
  // Lock overlay
  lockOverlay: "rgba(0, 0, 0, 0.6)",
  
  // Legacy theme support
  light: {
    text: "#11181C",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#7DF9FF",
    link: "#7DF9FF",
    backgroundRoot: "#0B0C0F",
    backgroundDefault: "#0B0C0F",
    backgroundSecondary: "#151618",
    backgroundTertiary: "#1F2123",
  },
  dark: {
    text: "#FFFFFF",
    buttonText: "#0B0C0F",
    tabIconDefault: "rgba(255, 255, 255, 0.5)",
    tabIconSelected: "#7DF9FF",
    link: "#7DF9FF",
    backgroundRoot: "#0B0C0F",
    backgroundDefault: "#0B0C0F",
    backgroundSecondary: "#151618",
    backgroundTertiary: "#1F2123",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  "7xl": 80,
  "8xl": 96,
  inputHeight: 48,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  // Oversized display for storage stats (64-96px)
  display: {
    fontSize: 72,
    fontWeight: "700" as const,
    letterSpacing: -2,
  },
  displayLarge: {
    fontSize: 96,
    fontWeight: "700" as const,
    letterSpacing: -3,
  },
  // Headlines
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  // Body text
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  button: {
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Glass effect constants
export const GlassEffects = {
  blurIntensity: 30,
  cardOpacity: 0.20,
  borderWidth: 1,
};

// Animation timing
export const AnimationConfig = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springFast: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};
