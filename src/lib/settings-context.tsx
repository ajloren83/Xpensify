"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from "./auth-context";
import { getUserSettings } from "./db";

export interface Settings {
  display: {
    currency: string;
    language: string;
    darkMode: boolean;
  };
  notifications: {
    salary: boolean;
    expenses: boolean;
    recurring: boolean;
  };
}

export interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

// Define default settings that match our application's requirements
const defaultSettings: Settings = {
  display: {
    currency: 'INR', // Default currency for the application
    language: 'en', // Default language
    darkMode: false, // Default theme
  },
  notifications: {
    salary: true, // Default notification settings
    expenses: true,
    recurring: true,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Custom setter that both updates state and saves to localStorage
  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-settings', JSON.stringify(newSettings));
    }
  };

  useEffect(() => {
    // Try to load from localStorage first for immediate display
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('user-settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }

    const loadUserSettings = async () => {
      if (!user) {
        console.log('No user found, using default settings');
        updateSettings(defaultSettings);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading settings for user:', user.uid);
        const userSettings = await getUserSettings(user.uid);
        console.log('Loaded user settings:', userSettings);
        
        if (userSettings) {
          const newSettings = {
            display: {
              currency: userSettings.display?.currency || defaultSettings.display.currency,
              language: userSettings.display?.language || defaultSettings.display.language,
              darkMode: userSettings.display?.darkMode ?? defaultSettings.display.darkMode,
            },
            notifications: {
              salary: userSettings.notifications?.salary ?? defaultSettings.notifications.salary,
              expenses: userSettings.notifications?.expenses ?? defaultSettings.notifications.expenses,
              recurring: userSettings.notifications?.recurring ?? defaultSettings.notifications.recurring,
            },
          };
          console.log('Setting new settings:', newSettings);
          updateSettings(newSettings);
        } else {
          console.log('No user settings found, using defaults');
          updateSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        updateSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSettings();
  }, [user]);

  // Don't render children until settings are loaded
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings: updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}