import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currencyCode: string) {
  const symbols: { [key: string]: string } = {
    usd: '$',
    eur: '€',
    gbp: '£',
    jpy: '¥',
    inr: '₹',
  };
  return symbols[currencyCode.toLowerCase()] || '$';
}
