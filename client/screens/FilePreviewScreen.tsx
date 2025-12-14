import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { usePremium } from "@/context/PremiumContext";

type FilePreviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FilePreview"
>;

type FilePreviewScreenRouteProp = RouteProp<RootStackParamList, "FilePreview">;

interface MediaAsset {
  id: string;
  uri: string;
  filename: string;
  mediaType: string;
  duration: number;
  width: number;
  height: number;
  fileSize?: number;
  selected: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function FilePreviewScreen() {
  const navigation = useNavigation<FilePreviewScreenNavigationProp>();
  const route = useRoute<FilePreviewScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const { category } = route.params;

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalSelectedSize, setTotalSelectedSize] = useState(0);

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("FilePreview");
    trackEvent("File Preview Opened", { category });
    loadAssets();
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const loadAssets = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        if (permission.status === "denied" && !permission.canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Photo access was denied. Please enable it in Settings to scan your files.",
            [
              { text: "Cancel", onPress: () => navigation.goBack(), style: "cancel" },
              { 
                text: "Open Settings", 
                onPress: async () => {
                  if (Platform.OS !== "web") {
                    try {
                      const { Linking } = await import("expo-linking");
                      await Linking.openSettings();
                    } catch (e) {
                      navigation.goBack();
                    }
                  } else {
                    navigation.goBack();
                  }
                }
              },
            ]
          );
        } else {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photos to scan for files.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
        return;
      }

      let mediaType: ("photo" | "video" | "audio" | "unknown")[] = ["photo"];
      let sortBy: MediaLibrary.SortByKey = "creationTime";

      if (category === "Large Videos") {
        mediaType = ["video"];
      } else if (category === "Duplicate Photos") {
        mediaType = ["photo"];
      } else if (category === "Old Downloads") {
        mediaType = ["photo", "video"];
        sortBy = "creationTime";
      }

      const mediaAssets = await MediaLibrary.getAssetsAsync({
        mediaType,
        sortBy: [[sortBy, false]],
        first: 200,
      });

      console.log(`Loaded ${mediaAssets.assets.length} assets for category: ${category}`);

      const assetsWithInfo = await Promise.all(
        mediaAssets.assets.map(async (asset) => {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            const estimatedSize = asset.mediaType === "video" 
              ? asset.duration * 5 * 1024 * 1024 
              : (asset.width * asset.height * 3) / 8;
            return {
              id: asset.id,
              uri: asset.uri || "",
              filename: asset.filename || "unknown",
              mediaType: asset.mediaType,
              duration: asset.duration || 0,
              width: asset.width || 0,
              height: asset.height || 0,
              fileSize: (info as any).size ?? estimatedSize ?? 3 * 1024 * 1024,
              selected: false,
            };
          } catch (e) {
            console.error("Error getting asset info:", e);
            return null;
          }
        })
      );

      const validAssets = assetsWithInfo.filter((a) => a !== null) as MediaAsset[];

      let filteredAssets = validAssets;

      if (category === "Large Videos") {
        filteredAssets = validAssets
          .filter((a) => a.mediaType === "video" && a.duration > 10)
          .slice(0, 50);
      } else if (category === "Duplicate Photos") {
        filteredAssets = validAssets
          .filter((a) => a.mediaType === "photo")
          .slice(0, 50);
      } else if (category === "Old Downloads") {
        filteredAssets = validAssets.slice(0, 50);
      }

      console.log(`Showing ${filteredAssets.length} filtered assets`);
      setAssets(filteredAssets);
      setLoading(false);
    } catch (error) {
      console.error("Error loading assets:", error);
      Alert.alert("Error", "Failed to load files. Please try again.");
      setLoading(false);
    }
  };

  const toggleAssetSelection = async (assetId: string) => {
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId ? { ...asset, selected: !asset.selected } : asset
      )
    );
  };

  useEffect(() => {
    const selected = assets.filter((a) => a.selected);
    setSelectedCount(selected.length);
    const totalSize = selected.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    setTotalSelectedSize(totalSize);
  }, [assets]);

  const handleSelectAll = async () => {
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = assets.every((a) => a.selected);
    setAssets((prev) => prev.map((a) => ({ ...a, selected: !allSelected })));
  };

  const handleDeleteSelected = async () => {
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    const selectedAssets = assets.filter((a) => a.selected);
    if (selectedAssets.length === 0) {
      Alert.alert("No Files Selected", "Please select files to delete.");
      return;
    }

    Alert.alert(
      "Delete Files",
      `Are you sure you want to delete ${selectedAssets.length} file(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );

              const assetIds = selectedAssets.map((a) => a.id);
              await MediaLibrary.deleteAssetsAsync(assetIds);

              trackEvent("Files Deleted", {
                count: selectedAssets.length,
                category,
              });

              navigation.navigate("Success", {
                filesDeleted: selectedAssets.length,
                spaceFreed: totalSelectedSize,
              });
            } catch (error) {
              console.error("Error deleting assets:", error);
              Alert.alert(
                "Error",
                "Some files could not be deleted. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const renderAsset = ({ item, index }: { item: MediaAsset; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => toggleAssetSelection(item.id)}
        style={[styles.assetItem, item.selected && styles.assetItemSelected]}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.assetThumbnail}
          contentFit="cover"
        />

        {item.mediaType === "video" && (
          <View style={styles.videoBadge}>
            <Feather name="play" size={12} color={Colors.textPrimary} />
            <ThemedText style={styles.videoDuration}>
              {formatDuration(item.duration)}
            </ThemedText>
          </View>
        )}

        {item.selected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkmark}>
              <Feather name="check" size={20} color={Colors.background} />
            </View>
          </View>
        )}

        {!isPremium && (
          <View style={styles.lockOverlay}>
            <Feather name="lock" size={16} color={Colors.accent} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          headerAnimatedStyle,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>{category}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {assets.length} files found
          </ThemedText>
        </View>

        <Pressable onPress={handleSelectAll} style={styles.selectAllButton}>
          <ThemedText style={styles.selectAllText}>
            {assets.every((a) => a.selected) ? "Deselect" : "Select All"}
          </ThemedText>
        </Pressable>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading files...</ThemedText>
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="check-circle" size={64} color={Colors.success} />
          <ThemedText style={styles.emptyTitle}>All Clean!</ThemedText>
          <ThemedText style={styles.emptyText}>
            No files found in this category.
          </ThemedText>
          <PremiumButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={assets}
            renderItem={renderAsset}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={[
              styles.gridContainer,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          />

          {selectedCount > 0 && (
            <Animated.View
              entering={FadeIn}
              style={[styles.actionBar, { paddingBottom: insets.bottom + Spacing.lg }]}
            >
              <GlassCard style={styles.actionBarContent}>
                <View style={styles.selectionInfo}>
                  <ThemedText style={styles.selectionCount}>
                    {selectedCount} selected
                  </ThemedText>
                  {totalSelectedSize > 0 && (
                    <ThemedText style={styles.selectionSize}>
                      {formatFileSize(totalSelectedSize)}
                    </ThemedText>
                  )}
                </View>
                <PremiumButton
                  title="Delete Selected"
                  onPress={handleDeleteSelected}
                  variant="primary"
                  style={styles.deleteButton}
                />
              </GlassCard>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectAllButton: {
    padding: Spacing.sm,
  },
  selectAllText: {
    ...Typography.small,
    color: Colors.accent,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: Spacing["2xl"],
    minWidth: 150,
  },
  gridContainer: {
    padding: Spacing.xs,
  },
  assetItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    backgroundColor: Colors.glassHighlight,
  },
  assetItemSelected: {
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  assetThumbnail: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDuration: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(125, 249, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  lockOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  actionBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCount: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  selectionSize: {
    ...Typography.small,
    color: Colors.accent,
    marginTop: 2,
  },
  deleteButton: {
    minWidth: 140,
  },
});
