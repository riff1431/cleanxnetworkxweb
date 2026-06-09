import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  id: string;
  platform_name: string;
  support_email: string | null;
  maintenance_mode: boolean;
  site_tagline: string | null;
  // Commission & Pricing
  platform_commission_rate: number;
  min_hourly_rate: number;
  max_hourly_rate: number;
  default_currency: string;
  // Booking Settings
  min_booking_hours: number;
  max_booking_hours: number;
  cancellation_window_hours: number;
  advance_booking_days: number;
  allow_instant_booking: boolean;
  // Cleaner Settings
  require_cleaner_verification: boolean;
  auto_approve_cleaners: boolean;
  // Legal
  terms_url: string | null;
  privacy_url: string | null;
  // Timestamps
  updated_at: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: "",
  platform_name: "The Cleaning Network",
  support_email: null,
  maintenance_mode: false,
  site_tagline: "Find trusted cleaning professionals near you",
  platform_commission_rate: 10,
  min_hourly_rate: 25,
  max_hourly_rate: 150,
  default_currency: "CAD",
  min_booking_hours: 2,
  max_booking_hours: 8,
  cancellation_window_hours: 24,
  advance_booking_days: 30,
  allow_instant_booking: true,
  require_cleaner_verification: true,
  auto_approve_cleaners: false,
  terms_url: null,
  privacy_url: null,
  updated_at: new Date().toISOString(),
};

// Currency symbols map
export const CURRENCY_SYMBOLS: Record<string, string> = {
  CAD: "$",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// Cache for settings to avoid repeated fetches
let cachedSettings: PlatformSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>(cachedSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cachedSettings);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // Use cache if valid
      if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setSettings(cachedSettings);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .rpc("get_public_platform_settings")
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          const platformSettings = {
            ...DEFAULT_SETTINGS,
            ...(data as Partial<PlatformSettings>),
          } as PlatformSettings;
          cachedSettings = platformSettings;
          cacheTimestamp = Date.now();
          setSettings(platformSettings);
        }
      } catch (err) {
        console.error("Error fetching platform settings:", err);
        setError(err as Error);
        // Use defaults on error
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[settings.default_currency] || "$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Calculate commission from a booking price
  const calculateCommission = (price: number): number => {
    return (price * settings.platform_commission_rate) / 100;
  };

  // Calculate cleaner earnings after commission
  const calculateCleanerEarnings = (price: number): number => {
    return price - calculateCommission(price);
  };

  // Check if a booking date is within allowed advance booking range
  const isDateWithinBookingRange = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + settings.advance_booking_days);
    
    return date >= today && date <= maxDate;
  };

  // Check if cancellation is allowed for a booking
  const isCancellationAllowed = (scheduledDate: Date, scheduledTime: string): boolean => {
    const [time, period] = scheduledTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;
    
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;
    
    const bookingDateTime = new Date(scheduledDate);
    bookingDateTime.setHours(hour24, minutes || 0, 0, 0);
    
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilBooking >= settings.cancellation_window_hours;
  };

  // Validate booking hours
  const isValidBookingDuration = (hours: number): boolean => {
    return hours >= settings.min_booking_hours && hours <= settings.max_booking_hours;
  };

  // Validate hourly rate
  const isValidHourlyRate = (rate: number): boolean => {
    return rate >= settings.min_hourly_rate && rate <= settings.max_hourly_rate;
  };

  // Invalidate cache (useful after settings update)
  const invalidateCache = () => {
    cachedSettings = null;
    cacheTimestamp = 0;
  };

  return {
    settings,
    loading,
    error,
    formatCurrency,
    calculateCommission,
    calculateCleanerEarnings,
    isDateWithinBookingRange,
    isCancellationAllowed,
    isValidBookingDuration,
    isValidHourlyRate,
    invalidateCache,
    currencySymbol: CURRENCY_SYMBOLS[settings.default_currency] || "$",
  };
};

export default usePlatformSettings;
