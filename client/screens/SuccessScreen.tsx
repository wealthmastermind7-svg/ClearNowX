import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { PremiumButton } from "@/components/PremiumButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SuccessScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Success"
>;

type SuccessScreenRouteProp = RouteProp<RootStackParamList, "Success">;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function SuccessScreen() {
  const navigation = useNavigation<SuccessScreenNavigationProp>();
  const route = useRoute<SuccessScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const filesDeleted = route.params?.filesDeleted ?? 0;
  const spaceFreed = route.params?.spaceFreed ?? 0;

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("Success");
    trackEvent("Files Cleaned", { 
      files_deleted: filesDeleted, 
      space_freed: formatBytes(spaceFreed) 
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    ringScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    checkScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    );

    textOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(500, withSpring(0, { damping: 15, stiffness: 150 }));

    statsOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
  }, []);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleDone = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace("Scan");
  };

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
        <View style={styles.successSection}>
          <Animated.View style={[styles.successRing, ringAnimatedStyle]}>
            <View style={styles.successCircle}>
              <Animated.View style={checkAnimatedStyle}>
                <Feather name="check" size={64} color={Colors.accent} />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.textSection, textAnimatedStyle]}>
            <ThemedText style={styles.successTitle}>Cleaning Complete</ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Your storage has been optimized
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View style={[styles.statsSection, statsAnimatedStyle]}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {spaceFreed > 0 ? formatBytes(spaceFreed) : "Storage"}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Space Freed</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {filesDeleted > 0 ? filesDeleted.toLocaleString() : "Optimized"}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Files Cleaned</ThemedText>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionSection, buttonAnimatedStyle]}>
          <PremiumButton
            title="Scan Again"
            onPress={handleDone}
            variant="primary"
            style={styles.doneButton}
          />
        </Animated.View>
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
    backgroundColor: Colors.success,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  successSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.glassWhite,
    justifyContent: "center",
    alignItems: "center",
  },
  textSection: {
    alignItems: "center",
  },
  successTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  successSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    backgroundColor: Colors.glassWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing["4xl"],
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: Spacing.lg,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  actionSection: {
    marginBottom: Spacing.xl,
  },
  doneButton: {
    width: "100%",
  },
});
