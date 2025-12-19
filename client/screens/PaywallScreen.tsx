import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { PurchasesPackage, PACKAGE_TYPE } from "react-native-purchases";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { usePremium } from "@/context/PremiumContext";

type PaywallScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Paywall"
>;

interface PlanOption {
  id: string;
  title: string;
  price: string;
  period: string;
  savings?: string;
  trialText?: string;
  package?: PurchasesPackage;
  isBestValue?: boolean;
}

const FEATURES = [
  { icon: "trash-2" as const, text: "Delete duplicate photos" },
  { icon: "video" as const, text: "Manage large videos" },
  { icon: "hard-drive" as const, text: "Identify unnecessary files" },
  { icon: "refresh-cw" as const, text: "Unlimited scans" },
];

export default function PaywallScreen() {
  const navigation = useNavigation<PaywallScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPremium } = usePremium();

  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const headerOpacity = useSharedValue(0);
  const plansOpacity = useSharedValue(0);

  useEffect(() => {
    trackPageView("Paywall");
    headerOpacity.value = withTiming(1, { duration: 400 });
    plansOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium]);

  useEffect(() => {
    if (offerings?.availablePackages) {
      const mappedPlans: PlanOption[] = [];
      
      offerings.availablePackages.forEach((pkg) => {
        if (pkg.packageType === PACKAGE_TYPE.ANNUAL) {
          mappedPlans.push({
            id: "annual",
            title: "Annual",
            price: pkg.product.priceString,
            period: "/year",
            savings: "Save 75%",
            package: pkg,
            isBestValue: true,
          });
        } else if (pkg.packageType === PACKAGE_TYPE.MONTHLY) {
          mappedPlans.push({
            id: "monthly",
            title: "Monthly",
            price: pkg.product.priceString,
            period: "/month",
            trialText: "7-day free trial",
            package: pkg,
          });
        } else if (pkg.packageType === PACKAGE_TYPE.WEEKLY) {
          mappedPlans.push({
            id: "weekly",
            title: "Weekly",
            price: pkg.product.priceString,
            period: "/week",
            package: pkg,
          });
        }
      });

      const sortOrder = ["monthly", "annual", "weekly"];
      mappedPlans.sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));
      
      setPlans(mappedPlans);
      
      const hasMonthly = mappedPlans.some(p => p.id === "monthly");
      setSelectedPlan(hasMonthly ? "monthly" : (mappedPlans[0]?.id || "monthly"));
    } else {
      setPlans([
        {
          id: "monthly",
          title: "Monthly",
          price: "$9.99",
          period: "/month",
          trialText: "7-day free trial",
        },
        {
          id: "annual",
          title: "Annual",
          price: "$29.99",
          period: "/year",
          savings: "Save 75%",
          isBestValue: true,
        },
        {
          id: "weekly",
          title: "Weekly",
          price: "$4.99",
          period: "/week",
        },
      ]);
    }
  }, [offerings]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const plansStyle = useAnimatedStyle(() => ({
    opacity: plansOpacity.value,
  }));

  const handleSelectPlan = async (planId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
    trackEvent("Plan Selected", { plan: planId });
  };

  const handleSubscribe = async () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan?.package) {
      if (Platform.OS === "web") {
        Alert.alert(
          "Not Available",
          "Subscriptions are only available in the mobile app. Please use Expo Go to subscribe."
        );
      } else {
        Alert.alert("Error", "Unable to process subscription. Please try again.");
      }
      return;
    }

    // Show helpful confirmation before purchase
    Alert.alert(
      "Confirm Subscription",
      `You're about to subscribe to ${plan.title} for ${plan.price}${plan.period}.\n\nNext: You'll see a test payment screen. Click "Test Valid Purchase" to complete.\n\nNo real charge will be made.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            if (!plan.package) return;
            setIsLoading(true);
            trackEvent("Subscribe Tapped", { plan: selectedPlan });

            try {
              console.log("Starting purchase...");
              const success = await purchase(plan.package);
              console.log("Purchase result:", success);
              
              // Add small delay to ensure RevenueCat dialog fully dismisses
              await new Promise(resolve => setTimeout(resolve, 300));
              
              if (success) {
                trackEvent("Purchase Completed", { plan: selectedPlan });
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                console.log("Navigating to Results...");
                navigation.replace("Results");
              } else {
                console.log("Purchase was not successful");
                Alert.alert("Error", "Purchase was not completed. Please try again.");
              }
            } catch (error) {
              console.error("Purchase error:", error);
              Alert.alert("Error", "Failed to complete purchase. Please try again.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    trackEvent("Restore Tapped");

    try {
      const success = await restore();
      if (success) {
        trackEvent("Restore Completed");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Your purchases have been restored!", [
          { text: "OK", onPress: () => navigation.replace("Results") },
        ]);
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases associated with your account."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Feather name="x" size={24} color={Colors.textSecondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.iconContainer}>
            <Feather name="unlock" size={40} color={Colors.accent} />
          </View>
          <ThemedText style={styles.title}>Unlock Premium</ThemedText>
          <ThemedText style={styles.subtitle}>
            Get full access to all cleaning features
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.featuresContainer, headerStyle]}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.text}
              entering={FadeInDown.delay(100 + index * 50).duration(300)}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <Feather name={feature.icon} size={18} color={Colors.accent} />
              </View>
              <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.plansContainer, plansStyle]}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </Animated.View>

        <View style={styles.buttonContainer}>
          <PremiumButton
            title={isLoading ? "Processing..." : "Continue"}
            onPress={handleSubscribe}
            disabled={isLoading || isRestoring}
          />

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring || isLoading}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <ThemedText style={styles.restoreText}>Restore Purchases</ThemedText>
            )}
          </Pressable>
        </View>

        <ThemedText style={styles.disclaimer}>
          Payment will be charged to your Apple ID account at confirmation of
          purchase. Subscription automatically renews unless it is canceled at
          least 24 hours before the end of the current period. Your account
          will be charged for renewal within 24 hours prior to the end of the
          current period.
        </ThemedText>
      </ScrollView>
    </View>
  );
}

interface PlanCardProps {
  plan: PlanOption;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <GlassCard
          style={styles.planCard}
          highlighted={isSelected}
        >
          {plan.isBestValue ? (
            <View style={styles.bestValueBadge}>
              <ThemedText style={styles.bestValueText}>BEST VALUE</ThemedText>
            </View>
          ) : null}
          
          <View style={styles.planContent}>
            <View style={styles.planLeft}>
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected ? <View style={styles.radioInner} /> : null}
              </View>
              <View style={styles.planInfo}>
                <ThemedText style={styles.planTitle}>{plan.title}</ThemedText>
                {plan.trialText ? (
                  <ThemedText style={styles.planTrial}>{plan.trialText}</ThemedText>
                ) : null}
                {plan.savings ? (
                  <ThemedText style={styles.planSavings}>{plan.savings}</ThemedText>
                ) : null}
              </View>
            </View>
            <View style={styles.planRight}>
              <ThemedText style={styles.planPrice}>{plan.price}</ThemedText>
              <ThemedText style={styles.planPeriod}>{plan.period}</ThemedText>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glassWhite,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["4xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(125, 249, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  featuresContainer: {
    marginBottom: Spacing["3xl"],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(125, 249, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  plansContainer: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: 20,
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    left: Spacing.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  bestValueText: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: "700",
  },
  planContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  radioOuterSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  planInfo: {
    gap: 2,
  },
  planTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  planTrial: {
    ...Typography.small,
    color: Colors.success,
  },
  planSavings: {
    ...Typography.small,
    color: Colors.accent,
  },
  planRight: {
    alignItems: "flex-end",
  },
  planPrice: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  planPeriod: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  restoreButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  restoreText: {
    ...Typography.link,
    color: Colors.textSecondary,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
