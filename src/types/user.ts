export interface UserPreferences {
  currency: string;
  theme: 'dark' | 'light';
  language: string;
}

export interface SalarySettings {
  amount: number;
  creditDate: '15th' | 'month-end' | 'custom';
  customDate?: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  salary: SalarySettings;
  notifications: {
    salary: boolean;
    expenses: boolean;
    recurring: boolean;
  };
} 