import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { Colors, Typography, Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  const navigateToScan = () => {
    navigation.replace("Scan");
  };

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });

    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 500 }));

    const timer = setTimeout(() => {
      runOnJS(navigateToScan)();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.glowBackground}>
        <View style={styles.glowCircle} />
      </View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <ThemedText style={styles.appName}>ClearNowX</ThemedText>
          <ThemedText style={styles.tagline}>
            Instant Storage Cleanup
          </ThemedText>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accent,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  logoContainer: {
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  textContainer: {
    alignItems: "center",
  },
  appName: {
    ...Typography.h1,
    fontSize: 42,
    color: Colors.textPrimary,
    fontWeight: "700",
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
