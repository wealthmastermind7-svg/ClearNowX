import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import {
  configurePurchases,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkPremiumStatus,
} from '@/lib/revenuecat';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  isLoading: true,
  offerings: null,
  purchase: async () => false,
  restore: async () => false,
  refreshStatus: async () => {},
});

export const usePremium = () => useContext(PremiumContext);

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    try {
      await configurePurchases();
      
      const [status, currentOfferings] = await Promise.all([
        checkPremiumStatus(),
        getOfferings(),
      ]);

      setIsPremium(status);
      setOfferings(currentOfferings);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchase = async (pkg: PurchasesPackage): Promise<boolean> => {
    const result = await purchasePackage(pkg);
    if (result.success) {
      setIsPremium(true);
    }
    return result.success;
  };

  const restore = async (): Promise<boolean> => {
    const result = await restorePurchases();
    if (result.success) {
      setIsPremium(true);
    }
    return result.success;
  };

  const refreshStatus = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status);
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        offerings,
        purchase,
        restore,
        refreshStatus,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
