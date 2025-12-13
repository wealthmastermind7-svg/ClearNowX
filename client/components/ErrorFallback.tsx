import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <View style={styles.container}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={({ pressed }) => [
            styles.topButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="alert-circle" size={20} color={Colors.textSecondary} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="alert-triangle" size={48} color={Colors.accent} />
        </View>

        <Text style={styles.title}>
          ClearNowX encountered an issue
        </Text>

        <Text style={styles.message}>
          Something went wrong. Please restart the app to continue cleaning your storage.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={styles.buttonText}>
            Restart ClearNowX
          </Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Error Details
                </Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={Colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.errorContainer}>
                  <Text
                    style={[
                      styles.errorText,
                      { fontFamily: Fonts?.mono || "monospace" },
                    ]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 600,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glassWhite,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  topButton: {
    position: "absolute",
    top: Spacing["2xl"] + Spacing.lg,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glassWhite,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing["2xl"],
    minWidth: 200,
    backgroundColor: Colors.accent,
    marginTop: Spacing.lg,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 17,
    color: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  modalTitle: {
    fontWeight: "600",
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  errorContainer: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    padding: Spacing.lg,
    backgroundColor: Colors.glassWhite,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    width: "100%",
    color: Colors.textPrimary,
  },
});
