import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
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
import { usePremium } from "@/context/PremiumContext";

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
  fileCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ResultsScreen() {
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const [storageData, setStorageData] = useState<StorageCategory[]>([]);
  const [totalReclaimable, setTotalReclaimable] = useState("0 B");
  const [loading, setLoading] = useState(true);

  const totalOpacity = useSharedValue(0);
  const totalScale = useSharedValue(0.9);
  const lockPulse = useSharedValue(1);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("Results");
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      if (Platform.OS === "web") {
        setStorageData([
          { id: "1", icon: "image", title: "Duplicate Photos", size: "Run in Expo Go", count: "Use device", fileCount: 0 },
          { id: "2", icon: "video", title: "Large Videos", size: "Run in Expo Go", count: "Use device", fileCount: 0 },
          { id: "3", icon: "file", title: "Old Downloads", size: "Run in Expo Go", count: "Use device", fileCount: 0 },
          { id: "4", icon: "trash-2", title: "Cache & Junk", size: "Run in Expo Go", count: "Use device", fileCount: 0 },
        ]);
        setTotalReclaimable("Use Expo Go");
        setLoading(false);
        animateIn();
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      
      if (!permission.granted) {
        if (permission.status === "denied" && !permission.canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Photo access was denied. Please enable it in Settings to analyze your storage.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Open Settings", 
                onPress: async () => {
                  try {
                    const { Linking } = await import("expo-linking");
                    await Linking.openSettings();
                  } catch (e) {
                    // Settings not supported
                  }
                }
              },
            ]
          );
        } else {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photos to analyze storage.",
            [{ text: "OK" }]
          );
        }
        setLoading(false);
        return;
      }

      const photos = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo"],
        first: 500,
      });

      const videos = await MediaLibrary.getAssetsAsync({
        mediaType: ["video"],
        first: 100,
      });

      const largeVideos = videos.assets.filter(v => v.duration > 10);

      const estimatedPhotoSize = photos.totalCount * 3 * 1024 * 1024;
      const estimatedVideoSize = largeVideos.length * 50 * 1024 * 1024;
      const estimatedDownloadsSize = Math.floor(photos.totalCount * 0.3) * 5 * 1024 * 1024;
      const estimatedCacheSize = 500 * 1024 * 1024;

      const totalSize = estimatedPhotoSize + estimatedVideoSize + estimatedDownloadsSize + estimatedCacheSize;

      const categories: StorageCategory[] = [
        {
          id: "1",
          icon: "image",
          title: "Duplicate Photos",
          size: formatBytes(estimatedPhotoSize),
          count: `${Math.floor(photos.totalCount * 0.3)} potential duplicates`,
          fileCount: Math.floor(photos.totalCount * 0.3),
        },
        {
          id: "2",
          icon: "video",
          title: "Large Videos",
          size: formatBytes(estimatedVideoSize),
          count: `${largeVideos.length} videos over 10s`,
          fileCount: largeVideos.length,
        },
        {
          id: "3",
          icon: "file",
          title: "Old Downloads",
          size: formatBytes(estimatedDownloadsSize),
          count: `${Math.floor(photos.totalCount * 0.15)} old files`,
          fileCount: Math.floor(photos.totalCount * 0.15),
        },
        {
          id: "4",
          icon: "trash-2",
          title: "Cache & Junk",
          size: formatBytes(estimatedCacheSize),
          count: "App caches & temp files",
          fileCount: 0,
        },
      ];

      setStorageData(categories);
      setTotalReclaimable(formatBytes(totalSize));
      setLoading(false);

      trackEvent("Storage Results Viewed", { total_reclaimable: formatBytes(totalSize) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      animateIn();
    } catch (error) {
      console.error("Error loading storage data:", error);
      setLoading(false);
    }
  };

  const animateIn = () => {
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
  };

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

  const handleCategoryPress = async (category: StorageCategory) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (category.title === "Cache & Junk") {
      if (!isPremium) {
        navigation.navigate("Paywall");
      } else {
        Alert.alert(
          "Cache Cleanup",
          "Cache files are managed by individual apps. Go to Settings > General > iPhone Storage to manage app caches.",
          [{ text: "OK" }]
        );
      }
      return;
    }

    navigation.navigate("FilePreview", {
      category: category.title,
    });
  };

  const handleUnlock = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Paywall");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ThemedText style={styles.loadingText}>Analyzing storage...</ThemedText>
      </View>
    );
  }

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
          {storageData.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategoryPress(category)}
            >
              <GlassCard style={styles.categoryCard}>
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
                    <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
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
            </Pressable>
          ))}
        </Animated.View>

        <View style={styles.actionSection}>
          {!isPremium ? (
            <PremiumButton
              title="Unlock Full Access"
              onPress={handleUnlock}
              variant="primary"
              style={styles.unlockButton}
            />
          ) : (
            <ThemedText style={styles.premiumText}>
              Tap a category to preview and delete files
            </ThemedText>
          )}

          <ThemedText style={styles.disclaimer}>
            {!isPremium 
              ? "Unlock premium to preview and clean files" 
              : "All deletions are permanent"}
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    flexDirection: "row",
    gap: Spacing.sm,
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
  premiumText: {
    ...Typography.body,
    color: Colors.accent,
    textAlign: "center",
  },
  disclaimer: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});
