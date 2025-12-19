import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
const ENTITLEMENT_ID = 'premium_access';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

let isConfigured = false;

export const configurePurchases = async (): Promise<void> => {
  if (isConfigured || Platform.OS === 'web') {
    return;
  }

  // Use Test API Key for Expo Go, Production key otherwise
  const apiKey = isExpoGo ? REVENUECAT_TEST_API_KEY : REVENUECAT_API_KEY;
  
  if (!apiKey) {
    console.error('RevenueCat API key not configured. Please set EXPO_PUBLIC_REVENUECAT_API_KEY or EXPO_PUBLIC_REVENUECAT_TEST_API_KEY.');
    return;
  }

  try {
    // Use INFO level for production, reduce verbosity
    Purchases.setLogLevel(LOG_LEVEL.INFO);
    await Purchases.configure({ apiKey });
    isConfigured = true;
    console.log(`RevenueCat configured with ${isExpoGo ? 'Test Store' : 'Production'} API key`);
  } catch (error) {
    console.error('Failed to configure RevenueCat:', error);
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  if (!isConfigured) {
    await configurePurchases();
  }

  if (!isConfigured) {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isPremium, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.error('Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
};

export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isPremium, customerInfo };
  } catch (error: any) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message || 'Restore failed' };
  }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
  if (!isConfigured) {
    await configurePurchases();
  }

  if (!isConfigured || Platform.OS === 'web') {
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!isConfigured) {
    await configurePurchases();
  }

  if (!isConfigured) {
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};
