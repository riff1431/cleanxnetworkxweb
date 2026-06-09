import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentGatewaySettings {
  // Stripe
  stripe_enabled: boolean;
  stripe_mode: "test" | "live";
  // Cash
  cash_enabled: boolean;
  cash_instructions: string;
  cash_confirmation_required: boolean;
  // Bank Transfer
  bank_enabled: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_swift_code: string;
  bank_instructions: string;
}

export type PaymentMethod = "stripe" | "cash" | "bank" | "wallet";

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  instructions?: string;
}

const DEFAULT_SETTINGS: PaymentGatewaySettings = {
  stripe_enabled: true,
  stripe_mode: "test",
  cash_enabled: true,
  cash_instructions: "Please pay the cleaner in cash after the service is completed.",
  cash_confirmation_required: true,
  bank_enabled: true,
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_routing_number: "",
  bank_swift_code: "",
  bank_instructions: "Please transfer the payment before your scheduled booking date.",
};

// Cache for settings
let cachedPaymentSettings: PaymentGatewaySettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePaymentSettings = () => {
  const [settings, setSettings] = useState<PaymentGatewaySettings>(cachedPaymentSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cachedPaymentSettings);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // Use cache if valid
      if (cachedPaymentSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setSettings(cachedPaymentSettings);
        setLoading(false);
        return;
      }

      try {
        // In a real implementation, these would come from the database
        // For now, use defaults since payment columns don't exist yet
        const paymentSettings: PaymentGatewaySettings = {
          ...DEFAULT_SETTINGS,
        };
        
        cachedPaymentSettings = paymentSettings;
        cacheTimestamp = Date.now();
        setSettings(paymentSettings);
      } catch (err) {
        console.error("Error fetching payment settings:", err);
        setError(err as Error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Get available payment methods based on settings
  const getAvailablePaymentMethods = (): PaymentMethodOption[] => {
    const methods: PaymentMethodOption[] = [];

    if (settings.stripe_enabled) {
      methods.push({
        id: "stripe",
        name: "Credit / Debit Card",
        description: "Pay securely with your card",
        icon: "credit-card",
      });
    }

    if (settings.cash_enabled) {
      methods.push({
        id: "cash",
        name: "Cash",
        description: "Pay the cleaner directly",
        icon: "banknote",
        instructions: settings.cash_instructions,
      });
    }

    if (settings.bank_enabled) {
      methods.push({
        id: "bank",
        name: "Bank Transfer",
        description: "Direct bank transfer",
        icon: "landmark",
        instructions: settings.bank_instructions,
      });
    }

    return methods;
  };

  // Get bank details for display (masked for security)
  const getBankDetails = () => {
    if (!settings.bank_enabled) return null;
    
    return {
      bankName: settings.bank_name,
      accountName: settings.bank_account_name,
      accountNumber: settings.bank_account_number 
        ? `****${settings.bank_account_number.slice(-4)}`
        : "",
      routingNumber: settings.bank_routing_number,
      swiftCode: settings.bank_swift_code,
      instructions: settings.bank_instructions,
    };
  };

  // Check if any payment method is available
  const hasPaymentMethods = settings.stripe_enabled || settings.cash_enabled || settings.bank_enabled;

  // Invalidate cache
  const invalidateCache = () => {
    cachedPaymentSettings = null;
    cacheTimestamp = 0;
  };

  return {
    settings,
    loading,
    error,
    getAvailablePaymentMethods,
    getBankDetails,
    hasPaymentMethods,
    invalidateCache,
  };
};

export default usePaymentSettings;
