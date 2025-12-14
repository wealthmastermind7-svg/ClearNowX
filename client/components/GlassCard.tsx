import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { Colors, BorderRadius, GlassEffects } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  disabled?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = GlassEffects.blurIntensity,
  disabled = false,
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.overlay, disabled && styles.disabledOverlay]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: GlassEffects.borderWidth,
    borderColor: Colors.glassBorder,
    backgroundColor: "rgba(30, 32, 36, 0.85)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glassWhite,
  },
  disabledOverlay: {
    backgroundColor: Colors.lockOverlay,
  },
  content: {
    position: "relative",
  },
});
