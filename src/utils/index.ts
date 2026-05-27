import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// Tailwind CSS utility merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Currency formatting
export function formatCurrency(amount: number | string | null | undefined, currency = 'PKR') {
  const value =
    typeof amount === 'string'
      ? parseFloat(amount)
      : typeof amount === 'number'
      ? amount
      : 0;

  const normalized = Number.isFinite(value) ? value : 0;
  
  // Custom display for common currencies
  if (currency === 'PKR') {
    return `₨ ${normalized.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'AED') {
    return `AED ${normalized.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(normalized);
}

// Number formatting
export function formatNumber(number: number | string | null | undefined) {
  const value =
    typeof number === 'string'
      ? parseFloat(number)
      : typeof number === 'number'
      ? number
      : 0;

  const normalized = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US').format(normalized);
}

export function formatPercentage(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

// String utilities
export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

// Survey helpers
export function getSurveyReward(survey: any): number {
  if (!survey) return 0;
  const possible = [
    survey.reward_per_response,
    survey.reward_amount,
    survey.reward,
    survey.price,
    survey.price_per_response,
    survey.estimated_reward,
  ];

  for (const v of possible) {
    if (v !== undefined && v !== null && v !== '') {
      const num = typeof v === 'string' ? parseFloat(v) : Number(v);
      if (Number.isFinite(num)) return num;
    }
  }

  return 0;
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Validation utilities
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// API error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;
    return errorObj.message || errorObj.error || JSON.stringify(error);
  }

  return 'An unexpected error occurred';
}

// Local storage utilities
export function getFromLocalStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    if (typeof window === 'undefined') return defaultValue || null;

    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue || null;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue || null;
  }
}

export function saveToLocalStorage<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
}

export function removeFromLocalStorage(key: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
  }
}

// Async utilities
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Color utilities
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function groupBy<T>(array: T[], key: keyof T) {
  return array.reduce(
    (result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

// File utilities
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Generate random utilities
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
