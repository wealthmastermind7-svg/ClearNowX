import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  isScanning?: boolean;
}

export function ProgressRing({
  size = 240,
  strokeWidth = 12,
  progress,
  isScanning = false,
}: ProgressRingProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isScanning]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progressDegrees = progress * 360;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.backgroundRing, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: strokeWidth,
      }]} />
      
      <Animated.View style={[styles.progressContainer, rotationStyle, { width: size, height: size }]}>
        <View style={[styles.progressRing, {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderTopColor: Colors.accent,
          borderRightColor: progressDegrees > 90 ? Colors.accent : 'transparent',
          borderBottomColor: progressDegrees > 180 ? Colors.accent : 'transparent',
          borderLeftColor: progressDegrees > 270 ? Colors.accent : 'transparent',
        }]} />
      </Animated.View>

      {isScanning ? (
        <View style={styles.glowContainer}>
          <View style={[styles.glow, { width: size * 0.5, height: size * 0.5 }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundRing: {
    position: "absolute",
    borderColor: Colors.glassWhite,
  },
  progressContainer: {
    position: "absolute",
  },
  progressRing: {
    position: "absolute",
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    backgroundColor: Colors.accent,
    opacity: 0.15,
    borderRadius: 999,
  },
});
