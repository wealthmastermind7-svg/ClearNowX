import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { ProgressRing } from "@/components/ProgressRing";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ScanScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Scan"
>;

export default function ScanScreen() {
  const navigation = useNavigation<ScanScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [scanText, setScanText] = useState("Preparing scan...");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textOpacity = useSharedValue(1);
  const dotsOpacity = useSharedValue(0);

  const scanTexts = [
    "Analyzing storage...",
    "Scanning photos...",
    "Finding duplicates...",
    "Checking videos...",
    "Almost done...",
  ];

  useEffect(() => {
    trackPageView("Scan");
    trackEvent("Scan Started");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    dotsOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      true
    );

    let textIndex = 0;
    const textInterval = setInterval(() => {
      textOpacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      textIndex = (textIndex + 1) % scanTexts.length;
      setTimeout(() => {
        setScanText(scanTexts[textIndex]);
      }, 150);
    }, 1500);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 0.015;
        if (newProgress >= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          clearInterval(textInterval);
          setTimeout(() => {
            navigation.replace("Results");
          }, 300);
          return 1;
        }
        return newProgress;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(textInterval);
    };
  }, []);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.glowBackground}>
        <View style={styles.glowCircle} />
      </View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing["5xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.ringContainer}>
          <ProgressRing progress={progress} isScanning={true} />
          <View style={styles.centerContent}>
            <ThemedText style={styles.percentageText}>
              {Math.round(progress * 100)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Animated.View style={textAnimatedStyle}>
            <ThemedText style={styles.scanningText}>{scanText}</ThemedText>
          </Animated.View>
          <Animated.View style={[styles.dotsContainer, dotsAnimatedStyle]}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  glowCircle: {
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.accent,
    opacity: 0.06,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  ringContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    ...Typography.display,
    color: Colors.accent,
  },
  textContainer: {
    marginTop: Spacing["5xl"],
    alignItems: "center",
  },
  scanningText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
});
