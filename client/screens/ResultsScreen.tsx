import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ResultsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Results"
>;

interface StorageCategory {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  size: string;
  count: string;
}

const storageData: StorageCategory[] = [
  { id: "1", icon: "image", title: "Duplicate Photos", size: "1.8 GB", count: "342 files" },
  { id: "2", icon: "video", title: "Large Videos", size: "2.4 GB", count: "28 files" },
  { id: "3", icon: "file", title: "Old Downloads", size: "892 MB", count: "156 files" },
  { id: "4", icon: "trash-2", title: "Cache & Junk", size: "1.1 GB", count: "1,204 files" },
];

export default function ResultsScreen() {
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [isPremium] = useState(false);

  const totalOpacity = useSharedValue(0);
  const totalScale = useSharedValue(0.9);
  const lockPulse = useSharedValue(1);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("Results");
    trackEvent("Storage Results Viewed", { total_reclaimable: "6.2 GB" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    totalOpacity.value = withTiming(1, { duration: 500 });
    totalScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) });

    cardsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    if (!isPremium) {
      lockPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, []);

  const totalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: totalOpacity.value,
    transform: [{ scale: totalScale.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
  }));

  const lockAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockPulse.value }],
  }));

  const handleUnlock = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Paywall");
  };

  const totalReclaimable = "6.2 GB";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerSection, totalAnimatedStyle]}>
          <ThemedText style={styles.headerLabel}>Reclaimable Space</ThemedText>
          <ThemedText style={styles.totalSize}>{totalReclaimable}</ThemedText>
          <ThemedText style={styles.subtext}>
            Found across {storageData.length} categories
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.categoriesSection, cardsAnimatedStyle]}>
          {storageData.map((category, index) => (
            <Animated.View
              key={category.id}
              style={{
                opacity: cardsOpacity.value,
              }}
            >
              <GlassCard
                style={styles.categoryCard}
                disabled={!isPremium}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Feather name={category.icon} size={24} color={Colors.accent} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText style={styles.categoryTitle}>
                      {category.title}
                    </ThemedText>
                    <ThemedText style={styles.categoryCount}>
                      {category.count}
                    </ThemedText>
                  </View>
                  <View style={styles.sizeContainer}>
                    <ThemedText style={styles.categorySize}>
                      {category.size}
                    </ThemedText>
                  </View>
                </View>

                {!isPremium && (
                  <View style={styles.lockBadge}>
                    <Animated.View style={lockAnimatedStyle}>
                      <Feather name="lock" size={16} color={Colors.background} />
                    </Animated.View>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={styles.actionSection}>
          {!isPremium ? (
            <PremiumButton
              title="Unlock Cleaning"
              onPress={handleUnlock}
              variant="primary"
              style={styles.unlockButton}
            />
          ) : (
            <PremiumButton
              title="Clean Now"
              onPress={() => navigation.navigate("Success")}
              variant="primary"
              style={styles.unlockButton}
            />
          )}

          <ThemedText style={styles.disclaimer}>
            Unlock premium to clean your storage instantly
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  headerLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  totalSize: {
    ...Typography.displayLarge,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  categoriesSection: {
    gap: Spacing.lg,
    marginBottom: Spacing["4xl"],
  },
  categoryCard: {
    padding: Spacing.lg,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.glassHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  sizeContainer: {
    alignItems: "flex-end",
  },
  categorySize: {
    ...Typography.h3,
    color: Colors.accent,
  },
  lockBadge: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  actionSection: {
    alignItems: "center",
  },
  unlockButton: {
    width: "100%",
  },
  disclaimer: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});
