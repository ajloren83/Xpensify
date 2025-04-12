export interface UserPreferences {
  currency: string;
  theme: 'dark' | 'light';
  language: string;
}

export interface SalarySettings {
  amount: number;
  creditDateType: 'first' | 'middle' | 'last' | 'custom';
  customDate?: number;
  currency: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  salarySettings: SalarySettings;
  notifications: {
    salary: boolean;
    expenses: boolean;
    recurring: boolean;
  };
} 