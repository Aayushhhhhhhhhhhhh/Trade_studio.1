
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Define types for settings
type ProfileSettings = {
  name: string;
  email: string;
  avatarUrl: string;
};

type PreferencesSettings = {
  timezone: string;
  currency: string;
};

type NotificationsSettings = {
  dailySummary: boolean;
  tradeAlerts: boolean;
  weeklyReport: boolean;
};

type AppSettings = {
  profile: ProfileSettings;
  preferences: PreferencesSettings;
  notifications: NotificationsSettings;
};

// Define context type
type SettingsContextType = {
  settings: AppSettings;
  setProfile: (profile: Partial<ProfileSettings>) => void;
  setPreferences: (preferences: PreferencesSettings) => void;
  setNotifications: (notifications: NotificationsSettings) => void;
  isLoading: boolean;
};

const userAvatarFallback = PlaceHolderImages.find(p => p.id === 'user-avatar-fallback');

// Default values
const defaultSettings: AppSettings = {
  profile: { name: 'User', email: '', avatarUrl: userAvatarFallback?.imageUrl || '' },
  preferences: { timezone: 'gmt+5.5', currency: 'inr' },
  notifications: { dailySummary: true, tradeAlerts: false, weeklyReport: true },
};

// Helper to get item from localStorage
const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const item = window.localStorage.getItem('app-settings');
    if (item) {
        const parsed = JSON.parse(item);
        // Ensure avatarUrl has a fallback if it's missing from storage
        if (!parsed.profile.avatarUrl) {
            parsed.profile.avatarUrl = defaultSettings.profile.avatarUrl;
        }
        return parsed;
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultSettings;
  }
};

// Helper to set item in localStorage
const setStoredSettings = (value: AppSettings) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('app-settings', JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Create provider
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setSettings(getStoredSettings());
    setIsLoading(false);
  }, []);

  const updateAndStore = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
        const updated = { 
            ...prevSettings, 
            ...newSettings,
            profile: { ...prevSettings.profile, ...newSettings.profile },
            preferences: { ...prevSettings.preferences, ...newSettings.preferences },
            notifications: { ...prevSettings.notifications, ...newSettings.notifications },
        };
        setStoredSettings(updated);
        return updated;
    });
  };

  const setProfile = (profile: Partial<ProfileSettings>) => {
    updateAndStore({ profile });
  };

  const setPreferences = (preferences: PreferencesSettings) => {
    updateAndStore({ preferences });
  };

  const setNotifications = (notifications: NotificationsSettings) => {
    updateAndStore({ notifications });
  };

  const value = {
    settings,
    setProfile,
    setPreferences,
    setNotifications,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Create custom hook
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
