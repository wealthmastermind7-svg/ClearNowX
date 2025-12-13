import React from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius, Spacing, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PremiumButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: PremiumButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const buttonStyles = [
    styles.button,
    variant === "primary" && styles.primaryButton,
    variant === "secondary" && styles.secondaryButton,
    variant === "ghost" && styles.ghostButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textColor =
    variant === "primary"
      ? Colors.background
      : variant === "ghost"
      ? Colors.textSecondary
      : Colors.textPrimary;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={buttonStyles}
      >
        <ThemedText
          style={[
            styles.text,
            { color: textColor },
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  secondaryButton: {
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    ...Typography.button,
  },
  disabledText: {
    color: Colors.textDisabled,
  },
});
