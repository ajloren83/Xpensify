// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSettings } from "@/lib/settings-context";

// Map currency codes to their appropriate locales
const currencyToLocale: Record<string, string> = {
  'USD': 'en-US',
  'EUR': 'de-DE',
  'GBP': 'en-GB',
  'JPY': 'ja-JP',
  'INR': 'en-IN',
  'CAD': 'en-CA',
  'AUD': 'en-AU',
  'CNY': 'zh-CN'
};

// Supported currencies for type checking
type SupportedCurrency = keyof typeof currencyToLocale;

// Initialize storage listener for settings changes
if (typeof window !== 'undefined') {
  // Listen for storage changes (for cross-tab synchronization)
  window.addEventListener('storage', (event) => {
    if (event.key === 'user-settings') {
      console.log('Currency settings changed in another tab');
    }
  });
}

/**
 * Get the current active currency from various sources
 * Order of precedence:
 * 1. Explicitly provided currency
 * 2. User settings in localStorage
 * 3. Settings context
 */
function getActiveCurrency(explicitCurrency?: string): string {
  // Priority 1: Use explicitly provided currency if valid
  if (explicitCurrency && explicitCurrency in currencyToLocale) {
    return explicitCurrency;
  }
  
  if (typeof window === 'undefined') {
    // For SSR, we need to use a default that matches our settings context
    return 'INR';
  }
  
  try {
    // Priority 2: Check settings in localStorage
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const settingsCurrency = settings?.display?.currency;
      if (settingsCurrency && settingsCurrency in currencyToLocale) {
        return settingsCurrency;
      }
    }
  } catch (e) {
    console.error('Error retrieving currency preference:', e);
  }
  
  // Priority 3: Use settings from context
  const { settings } = useSettings();
  return settings.display.currency;
}

/**
 * Format a currency amount with the appropriate currency symbol and locale
 */
export function formatCurrency(amount: number, currency: string): string {
  try {
    const locale = currencyToLocale[currency] || 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return amount.toString();
  }
}

/**
 * Hook for using currency formatting with current settings
 */
export function useFormatCurrency() {
  const { settings } = useSettings();
  
  return (amount: number): string => {
    return formatCurrency(amount, settings.display.currency);
  };
}

// Format a date string to a readable format
export const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date in formatDate:", dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Error';
  }
};

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function generateMonthYearList(count = 12): Array<{ label: string, value: string }> {
  const result = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    result.push({ label, value });
  }
  
  return result;
}

export function getDateRange(period: 'week' | 'month' | 'year' | 'custom', customRange?: { start: Date, end: Date }) {
  const now = new Date();
  
  switch (period) {
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { start: startOfWeek, end: endOfWeek };
      
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return { start: startOfMonth, end: endOfMonth };
      
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      return { start: startOfYear, end: endOfYear };
      
    case 'custom':
      if (!customRange) {
        throw new Error('Custom date range requires start and end dates');
      }
      return customRange;
      
    default:
      return { start: new Date(0), end: now };
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getMonthName(month: number): string {
  return new Date(0, month).toLocaleString('default', { month: 'long' });
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}