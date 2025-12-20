import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
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
  creationTime?: number; // Timestamp in milliseconds
  selected: boolean;
  groupKey?: string; // For grouping duplicates by dimension
}

interface DuplicateGroup {
  key: string; // "1920x1080"
  count: number;
  assets: MediaAsset[];
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

// Detects actual duplicate photos based on dimensions AND file size
function findDuplicatePhotos(assets: MediaAsset[]): MediaAsset[] {
  const photos = assets.filter((a) => a.mediaType === "photo");
  
  // Group photos by dimension AND file size (actual duplicates)
  const duplicateMap = new Map<string, MediaAsset[]>();
  
  photos.forEach((photo) => {
    // Key includes both dimensions AND file size for true duplicate detection
    const key = `${photo.width}x${photo.height}x${photo.fileSize || 0}`;
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    duplicateMap.get(key)!.push(photo);
  });
  
  // Get all photos from groups with 2+ identical files (actual duplicates)
  const duplicates: MediaAsset[] = [];
  duplicateMap.forEach((group, key) => {
    if (group.length >= 2) {
      // Sort by filename to show related duplicates together
      group.sort((a, b) => a.filename.localeCompare(b.filename));
      // Add groupKey to each asset to track which group it belongs to
      duplicates.push(...group.map(a => ({ ...a, groupKey: key })));
    }
  });
  
  // If no actual duplicates found, return empty state
  if (duplicates.length === 0) {
    return [];
  }
  
  return duplicates;
}

// Finds large videos (duration > 10s) and sorts by file size
function findLargeVideos(assets: MediaAsset[]): MediaAsset[] {
  return assets
    .filter((a) => a.mediaType === "video" && a.duration > 10)
    .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    .slice(0, 50);
}

// Finds old downloads (files created more than 30 days ago)
function findOldDownloads(assets: MediaAsset[]): MediaAsset[] {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  return assets
    .filter((a) => (a.creationTime || 0) < thirtyDaysAgo)
    .sort((a, b) => (a.creationTime || 0) - (b.creationTime || 0)) // Oldest first
    .slice(0, 50);
}

// Finds unnecessary files sorted by size (largest first)
function findUnnecessaryFiles(assets: MediaAsset[]): MediaAsset[] {
  return assets
    .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    .slice(0, 50);
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_MARGIN = 4;

function getNumColumns(category: string): number {
  return 3;
}

function getItemSize(category: string): number {
  const numColumns = getNumColumns(category);
  return (SCREEN_WIDTH - (Spacing.md * 2) - (ITEM_MARGIN * (numColumns - 1))) / numColumns;
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
  const [showPermissionExplanation, setShowPermissionExplanation] = useState(false);

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("FilePreview");
    trackEvent("File Preview Opened", { category });
    checkPermissionAndLoadAssets();
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const checkPermissionAndLoadAssets = async () => {
    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      if (!permission.granted) {
        setShowPermissionExplanation(true);
        return;
      }
      await loadAssets();
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const handleContinuePermission = async () => {
    setShowPermissionExplanation(false);
    await loadAssets();
  };

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
              creationTime: asset.creationTime || Date.now(),
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
        filteredAssets = findLargeVideos(validAssets);
      } else if (category === "Old Downloads") {
        filteredAssets = findOldDownloads(validAssets);
      } else if (category === "Unnecessary Files") {
        filteredAssets = findUnnecessaryFiles(validAssets);
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

  const renderAsset = ({ item, index }: { item: MediaAsset; index: number }) => {
    const itemSize = getItemSize(category);
    return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => toggleAssetSelection(item.id)}
        style={[
          styles.assetItem,
          { width: itemSize, height: itemSize },
          item.selected && styles.assetItemSelected
        ]}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.assetThumbnail}
          contentFit="cover"
          placeholder={{ backgroundColor: "rgba(30, 32, 36, 0.8)" }}
          cachePolicy="memory-disk"
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
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showPermissionExplanation}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPermissionExplanation(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.permissionModal}>
            <Feather name="info" size={40} color={Colors.accent} />
            <ThemedText style={styles.permissionTitle}>
              Why Photo Access Is Needed
            </ThemedText>
            <ThemedText style={styles.permissionDescription}>
              ClearNowX analyzes your photo library to identify duplicates, large videos, and storage-heavy images so you can free up space.
            </ThemedText>
            <ThemedText style={styles.permissionDescription}>
              All analysis happens locally on your device. Photos are never uploaded or shared.
            </ThemedText>
            <View style={styles.permissionButtons}>
              <Pressable
                onPress={() => {
                  setShowPermissionExplanation(false);
                  navigation.goBack();
                }}
                style={styles.declineButton}
              >
                <ThemedText style={styles.declineButtonText}>Not Now</ThemedText>
              </Pressable>
              <PremiumButton
                title="Continue"
                onPress={handleContinuePermission}
                variant="primary"
                style={styles.continueButton}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

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
            numColumns={getNumColumns(category)}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  permissionModal: {
    alignItems: "center",
    padding: Spacing["2xl"],
    maxWidth: 320,
  },
  permissionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  permissionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  permissionButtons: {
    flexDirection: "row",
    gap: Spacing.lg,
    width: "100%",
    marginTop: Spacing.xl,
  },
  declineButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  declineButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  continueButton: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 0,
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
    textAlign: "center",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: Spacing["2xl"],
    minWidth: 150,
  },
  gridContainer: {
    padding: Spacing.md,
  },
  assetItem: {
    marginRight: ITEM_MARGIN,
    marginBottom: ITEM_MARGIN,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: "rgba(30, 32, 36, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  assetItemSelected: {
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: "rgba(125, 249, 255, 0.1)",
  },
  assetThumbnail: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoDuration: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(125, 249, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  lockOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(11, 12, 15, 0.95)",
  },
  actionBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    gap: Spacing.lg,
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
