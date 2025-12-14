import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, BorderRadius, GlassEffects } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  disabled?: boolean;
  highlighted?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = GlassEffects.blurIntensity,
  disabled = false,
  highlighted = false,
}: GlassCardProps) {
  return (
    <View style={[styles.container, highlighted && styles.highlighted, style]}>
      <View style={styles.backgroundFill} />
      {Platform.OS !== "web" ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.12)",
          "rgba(255, 255, 255, 0.04)",
          "rgba(0, 0, 0, 0.1)",
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {highlighted ? (
        <LinearGradient
          colors={[
            "rgba(125, 249, 255, 0.15)",
            "rgba(125, 249, 255, 0.05)",
            "transparent",
          ]}
          locations={[0, 0.3, 0.6]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {disabled ? <View style={styles.disabledOverlay} /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  backgroundFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 27, 31, 0.75)",
  },
  highlighted: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.lockOverlay,
  },
  content: {
    position: "relative",
  },
});
