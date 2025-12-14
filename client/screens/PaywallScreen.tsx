import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { PurchasesPackage } from "react-native-purchases";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { trackPageView, trackEvent } from "@/lib/mixpanel";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { usePremium } from "@/context/PremiumContext";

type PaywallScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Paywall"
>;

interface PlanDisplay {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  trial?: string;
  isDefault?: boolean;
  package?: PurchasesPackage;
}

const fallbackPlans: PlanDisplay[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    trial: "7-day free trial",
    isDefault: true,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$29.99",
    period: "/year",
    badge: "Best Value",
  },
  {
    id: "weekly",
    name: "Weekly",
    price: "$4.99",
    period: "/week",
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation<PaywallScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore } = usePremium();
  
  const [selectedPlanId, setSelectedPlanId] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<PlanDisplay[]>(fallbackPlans);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(100);
  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    trackPageView("Paywall");
    trackEvent("Upgrade Viewed");
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    blurIntensity.value = withTiming(50, { duration: 400 });
  }, []);

  useEffect(() => {
    if (offerings?.availablePackages) {
      const mappedPlans: PlanDisplay[] = offerings.availablePackages.map((pkg) => {
        const identifier = pkg.identifier.toLowerCase();
        let name = "Plan";
        let period = "";
        let badge: string | undefined;
        let trial: string | undefined;
        let isDefault = false;

        if (identifier.includes("monthly") || identifier.includes("month")) {
          name = "Monthly";
          period = "/month";
          trial = pkg.product.introPrice ? "7-day free trial" : undefined;
          isDefault = true;
        } else if (identifier.includes("annual") || identifier.includes("year")) {
          name = "Annual";
          period = "/year";
          badge = "Best Value";
        } else if (identifier.includes("weekly") || identifier.includes("week")) {
          name = "Weekly";
          period = "/week";
        }

        return {
          id: pkg.identifier,
          name,
          price: pkg.product.priceString,
          period,
          badge,
          trial,
          isDefault,
          package: pkg,
        };
      });

      if (mappedPlans.length > 0) {
        setPlans(mappedPlans);
        const defaultPlan = mappedPlans.find((p) => p.isDefault);
        if (defaultPlan) {
          setSelectedPlanId(defaultPlan.id);
        }
      }
    }
  }, [offerings]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const blurAnimatedStyle = useAnimatedStyle(() => ({
    opacity: blurIntensity.value / 50,
  }));

  const handleSelectPlan = async (planId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlanId(planId);
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handlePurchase = async () => {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    
    if (!selectedPlan?.package) {
      Alert.alert(
        "Purchase Unavailable",
        "In-app purchases are not available in this environment. Please test on a real device with Expo Go.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const success = await purchase(selectedPlan.package);
      if (success) {
        trackEvent("Purchase Completed", { plan: selectedPlanId });
        navigation.replace("Success", {});
      }
    } catch (error) {
      Alert.alert("Purchase Failed", "Please try again later.", [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const success = await restore();
      if (success) {
        trackEvent("Purchases Restored");
        Alert.alert("Restored", "Your purchases have been restored.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("No Purchases Found", "No previous purchases were found to restore.", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      Alert.alert("Restore Failed", "Please try again later.", [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, blurAnimatedStyle]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
        <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.heroSection}>
            <ThemedText style={styles.headline}>
              Free up space in under 60 seconds
            </ThemedText>
            <ThemedText style={styles.subheadline}>
              Unlock powerful cleaning tools
            </ThemedText>
          </View>

          <View style={styles.featuresSection}>
            {[
              "Instant duplicate detection",
              "Large file finder",
              "Smart cache cleaning",
              "Unlimited scans",
            ].map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Feather name="check" size={18} color={Colors.accent} />
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.plansSection}>
            {plans.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <GlassCard
                  style={[
                    styles.planCard,
                    selectedPlanId === plan.id && styles.selectedPlanCard,
                  ]}
                >
                  <View style={styles.planContent}>
                    <View style={styles.planHeader}>
                      <View
                        style={[
                          styles.radioOuter,
                          selectedPlanId === plan.id && styles.radioOuterSelected,
                        ]}
                      >
                        {selectedPlanId === plan.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View style={styles.planInfo}>
                        <View style={styles.planNameRow}>
                          <ThemedText style={styles.planName}>
                            {plan.name}
                          </ThemedText>
                          {plan.badge ? (
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                {plan.badge}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                        {plan.trial ? (
                          <ThemedText style={styles.trialText}>
                            {plan.trial}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.price}>{plan.price}</ThemedText>
                      <ThemedText style={styles.period}>{plan.period}</ThemedText>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionSection}>
            <PremiumButton
              title={
                isLoading
                  ? "Processing..."
                  : selectedPlan?.trial
                  ? "Start Free Trial"
                  : "Continue"
              }
              onPress={handlePurchase}
              variant="primary"
              style={styles.purchaseButton}
              disabled={isLoading}
            />

            <PremiumButton
              title="Restore Purchases"
              onPress={handleRestore}
              variant="ghost"
              disabled={isLoading}
            />
          </View>

          <ThemedText style={styles.legalText}>
            Cancel anytime. Subscription auto-renews.
          </ThemedText>
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "95%",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glassWhite,
    justifyContent: "center",
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  headline: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subheadline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  featuresSection: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  plansSection: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  planCard: {
    padding: Spacing.lg,
  },
  selectedPlanCard: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  planContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
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
    gap: Spacing.xs,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  planName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: "700",
  },
  trialText: {
    ...Typography.small,
    color: Colors.accent,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  period: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  actionSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  purchaseButton: {
    width: "100%",
  },
  legalText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
